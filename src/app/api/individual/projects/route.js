import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';


async function verifyToken() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) return null;
    
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    console.error('[JWT VERIFY ERROR]', error.message);
    return null;
  }
}
export async function POST(req) {
  try {
    const decoded = await verifyToken();
    
    if (!decoded?.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { name, description } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Project name is required' },
        { status: 400 }
      );
    }

    // Get employee record
    const employee = await prisma.employee.findUnique({
      where: { id: decoded.userId },
      select: { 
        id: true, 
        companyId: true
      }
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee profile not found' },
        { status: 404 }
      );
    }

    // Get or create default role
    let defaultRole = await prisma.role.findFirst({
      where: {
        companyId: employee.companyId,
        name: 'Project Owner'
      }
    });

    if (!defaultRole) {
      defaultRole = await prisma.role.create({
        data: {
          name: 'Project Owner',
          companyId: employee.companyId
        }
      });

      // Create permissions for this role
      const superAdminPermission = await prisma.permission.findFirst({
        where: { name: 'SuperAdmin All' }
      });

      if (superAdminPermission) {
        await prisma.rolePermission.create({
          data: {
            roleId: defaultRole.id,
            permissionId: superAdminPermission.id
          }
        });
      }
    }

    // Create campaign (project)
    const project = await prisma.campaign.create({
      data: {
        name: name.trim(),
        companyId: employee.companyId,
        adminId: employee.id,
        status: 'active',
        assignments: {
          create: {
            employee: {
              connect: { id: employee.id }
            },
            role: {
              connect: { id: defaultRole.id }
            },
            note: 'Project creator'
          }
        }
      },
      include: {
        _count: {
          select: {
            videos: true
          }
        },
        assignments: {
          where: {
            employeeId: employee.id
          },
          include: {
            role: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        name: project.name,
        videoCount: project._count.videos,
        role: project.assignments[0]?.role?.name || 'Owner',
        createdAt: project.createdAt
      }
    });

  } catch (error) {
    console.error('[CREATE PROJECT ERROR]', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    const decoded = await verifyToken();
    
    if (!decoded?.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit')) || 10;

    // Get employee
    const employee = await prisma.employee.findUnique({
      where: { id: decoded.userId },
      select: { id: true }
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Get projects where user is assigned
    const projects = await prisma.campaign.findMany({
      where: {
        assignments: {
          some: {
            employeeId: employee.id
          }
        },
        status: 'active'
      },
      include: {
        _count: {
          select: {
            videos: true
          }
        },
        assignments: {
          where: {
            employeeId: employee.id
          },
          include: {
            role: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    return NextResponse.json({
      success: true,
      projects: projects.map(project => ({
        id: project.id,
        name: project.name,
        videoCount: project._count.videos,
        role: project.assignments[0]?.role?.name || 'Member',
        createdAt: project.createdAt
      }))
    });

  } catch (error) {
    console.error('[GET PROJECTS ERROR]', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
