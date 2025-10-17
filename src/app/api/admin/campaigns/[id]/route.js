import prisma from "@/app/lib/prisma";
import { NextResponse } from "next/server";
import { verifyJWT, requireAdmin } from '@/app/lib/auth';

export async function PUT(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { name, adminId, teamId, status } = body;

    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing)
      return NextResponse.json({ success: false, message: "Campaign not found." }, { status: 404 });

    const updated = await prisma.campaign.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(adminId && { adminId }),
        ...(teamId && { teamId }),
        ...(status && { status }),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        admin: { select: { firstName: true, lastName: true } },
        team: { select: { name: true } },
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("Campaign PUT error:", err);
    return NextResponse.json({ success: false, message: "Failed to update campaign." }, { status: 500 });
  }
}
export async function GET(request, { params }) {
  try {
    const { employee, error, status } = await verifyJWT(request);
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    const { id: campaignId } = await params;

    if (!campaignId || typeof campaignId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid campaign ID' },
        { status: 400 }
      );
    }

    // Fetch campaign with relations
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            domain: true,
          },
        },
        admin: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
            members: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        assignments: {
          select: {
            id: true,
          },
        },
        flows: {
          select: {
            id: true,
          },
        },
        schedules: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Check if employee belongs to same company
    if (employee.companyId !== campaign.companyId) {
      return NextResponse.json(
        { error: 'Forbidden - Access denied to this campaign' },
        { status: 403 }
      );
    }

    // Check admin access
    const adminError = requireAdmin(employee);
    if (adminError) {
      return NextResponse.json(
        { error: adminError.error },
        { status: adminError.status }
      );
    }

    // Transform response
    const response = {
      id: campaign.id,
      name: campaign.name,
      company: campaign.company,
      admin: {
        ...campaign.admin,
        fullName: `${campaign.admin.firstName} ${campaign.admin.lastName}`,
      },
      team: campaign.team,
      stats: {
        totalAssignments: campaign.assignments.length,
        totalFlows: campaign.flows.length,
        totalSchedules: campaign.schedules.length,
      },
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
    };

    return NextResponse.json({
      success: true,
      data: response,
    });

  } catch (error) {
    console.error('Error fetching campaign:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined 
      },
      { status: 500 }
    );
  }
}
