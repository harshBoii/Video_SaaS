//cacheable , invalidate on post request
import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { verifyJWT, requireAdmin } from '@/app/lib/auth';

export async function GET(request, { params }) {
  try {
    const { employee, error, status } = await verifyJWT(request);
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    const { id: campaignId } = await params;
    const { searchParams } = new URL(request.url);
    
    // Optional query params for filtering
    const roleId = searchParams.get('roleId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!campaignId || typeof campaignId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid campaign ID' },
        { status: 400 }
      );
    }

    // Verify campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { 
        companyId: true,
        name: true,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    if (employee.companyId !== campaign.companyId) {
      return NextResponse.json(
        { error: 'Forbidden - Access denied to this campaign' },
        { status: 403 }
      );
    }

    const adminError = requireAdmin(employee);
    if (adminError) {
      return NextResponse.json(
        { error: adminError.error },
        { status: adminError.status }
      );
    }

    // Build filter conditions
    const whereConditions = { campaignId };

    if (roleId) {
      whereConditions.roleId = roleId;
    }

    // Date range filtering
    if (startDate || endDate) {
      whereConditions.AND = [];
      
      if (startDate) {
        whereConditions.AND.push({
          endDate: { gte: new Date(startDate) },
        });
      }
      
      if (endDate) {
        whereConditions.AND.push({
          startDate: { lte: new Date(endDate) },
        });
      }
    }

    // Fetch schedules
    const schedules = await prisma.campaignSchedule.findMany({
      where: whereConditions,
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
      orderBy: [
        { startDate: 'asc' },
        { role: { name: 'asc' } },
      ],
    });

    // Get creator details if createdBy exists
    const schedulesWithCreators = await Promise.all(
      schedules.map(async (schedule) => {
        let creator = null;
        
        if (schedule.createdBy) {
          creator = await prisma.employee.findUnique({
            where: { id: schedule.createdBy },
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          });
          
          if (creator) {
            creator = {
              ...creator,
              fullName: `${creator.firstName} ${creator.lastName}`,
            };
          }
        }

        return {
          id: schedule.id,
          title: schedule.title,
          role: schedule.role,
          startDate: schedule.startDate,
          endDate: schedule.endDate,
          color: schedule.color,
          creator: creator,
          createdAt: schedule.createdAt,
          updatedAt: schedule.updatedAt,
        };
      })
    );

    // Group schedules by role for easier visualization
    const groupedByRole = {};
    schedulesWithCreators.forEach(schedule => {
      const roleId = schedule.role.id;
      
      if (!groupedByRole[roleId]) {
        groupedByRole[roleId] = {
          role: schedule.role,
          schedules: [],
          count: 0,
        };
      }
      
      groupedByRole[roleId].schedules.push(schedule);
      groupedByRole[roleId].count++;
    });

    return NextResponse.json({
      success: true,
      data: {
        campaignId: campaignId,
        campaignName: campaign.name,
        totalSchedules: schedules.length,
        schedules: schedulesWithCreators,
        groupedByRole: Object.values(groupedByRole),
      },
    });

  } catch (error) {
    console.error('Error fetching campaign schedules:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined 
      },
      { status: 500 }
    );
  }
}

// POST - Add schedule entries
export async function POST(request, { params }) {
  try {
    const { employee, error, status } = await verifyJWT(request);
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    const { id: campaignId } = await params;
    const body = await request.json();
    const { roleId, title, startDate, endDate, color } = body;

    if (!campaignId || typeof campaignId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid campaign ID' },
        { status: 400 }
      );
    }

    if (!roleId || typeof roleId !== 'string') {
      return NextResponse.json(
        { error: 'Role ID is required' },
        { status: 400 }
      );
    }

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    if (start >= end) {
      return NextResponse.json(
        { error: 'Start date must be before end date' },
        { status: 400 }
      );
    }

    // Verify campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { companyId: true },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    if (employee.companyId !== campaign.companyId) {
      return NextResponse.json(
        { error: 'Forbidden - Access denied to this campaign' },
        { status: 403 }
      );
    }

    const adminError = requireAdmin(employee);
    if (adminError) {
      return NextResponse.json(
        { error: adminError.error },
        { status: adminError.status }
      );
    }

    // Verify role exists and belongs to same company
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      select: { 
        companyId: true,
        name: true,
      },
    });

    if (!role) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    if (role.companyId !== campaign.companyId) {
      return NextResponse.json(
        { error: 'Role must belong to the same company as the campaign' },
        { status: 400 }
      );
    }

    // Optional: Check for schedule conflicts
    const conflicts = await prisma.campaignSchedule.findMany({
      where: {
        campaignId: campaignId,
        roleId: roleId,
        OR: [
          {
            AND: [
              { startDate: { lte: start } },
              { endDate: { gte: start } },
            ],
          },
          {
            AND: [
              { startDate: { lte: end } },
              { endDate: { gte: end } },
            ],
          },
          {
            AND: [
              { startDate: { gte: start } },
              { endDate: { lte: end } },
            ],
          },
        ],
      },
    });

    if (conflicts.length > 0) {
      return NextResponse.json(
        { 
          error: 'Schedule conflict detected',
          conflicts: conflicts.map(c => ({
            id: c.id,
            startDate: c.startDate,
            endDate: c.endDate,
            title: c.title,
          })),
        },
        { status: 409 }
      );
    }

    // Create schedule entry
    const schedule = await prisma.campaignSchedule.create({
      data: {
        campaignId,
        roleId,
        title: title || null,
        startDate: start,
        endDate: end,
        color: color || null,
        createdBy: employee.id,
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Schedule entry created successfully',
      data: {
        id: schedule.id,
        title: schedule.title,
        role: schedule.role,
        startDate: schedule.startDate,
        endDate: schedule.endDate,
        color: schedule.color,
        createdBy: employee.id,
        createdAt: schedule.createdAt,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating campaign schedule:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined 
      },
      { status: 500 }
    );
  }
}
