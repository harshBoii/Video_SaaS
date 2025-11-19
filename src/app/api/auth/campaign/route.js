// import { NextResponse } from "next/server";
// import prisma from "@/app/lib/prisma"; // adjust path if needed
// import { cookies } from "next/headers";
// import jwt from "jsonwebtoken";

// export async function GET(req) {
//   try {
//     const { searchParams } = new URL(req.url);

//     const token = (await cookies()).get("token")?.value
//     const decoded=jwt.verify(token,process.env.JWT_SECRET)

//     const campaignId = searchParams.get("campaignId");
//     const employeeId = decoded.id

//     if (!campaignId || !employeeId) {
//       return NextResponse.json({ error: "Missing campaignId or employeeId" }, { status: 400 });
//     }

//     // Fetch ONLY what is required — campaign name, employee name, permissions
//     const assignment = await prisma.campaignAssignment.findUnique({
//       where: {
//         campaignId_employeeId: {
//           campaignId,
//           employeeId,
//         },
//       },
//       select: {
//         employee: {
//           select: {
//             firstName: true,
//             lastName: true,
//           },
//         },
//         campaign: {
//           select: {
//             name: true,
//           },
//         },
//         role: {
//           select: {
//             name: true,
//             permissions: {
//               select: {
//                 permission: {
//                   select: {
//                     name: true,
//                   },
//                 },
//               },
//             },
//           },
//         },
//       },
//     });

//     if (!assignment) {
//       return NextResponse.json({ error: "Not assigned to this campaign" }, { status: 404 });
//     }

//     const permissions = assignment.role.permissions.map(p => p.permission.name);

//     return NextResponse.json({
//       employeeName: `${assignment.employee.firstName} ${assignment.employee.lastName}`,
//       campaignName: assignment.campaign.name,
//       role: assignment.role.name,
//       permissions,
//     });
//   } catch (err) {
//     console.error(err);
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }
import { PrismaClient } from '@prisma/client';
import { verify } from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    // Extract campaignId from query params
    const { searchParams } = new URL(req.url);
    const campaignId = searchParams.get('campaignId');

    if (!campaignId) {
      return NextResponse.json({ error: 'Campaign ID required' }, { status: 400 });
    }

    // Get token from cookies
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify JWT and extract employee ID
    const decoded = verify(token, process.env.JWT_SECRET);
    const employeeId = decoded.id;

    // Fetch employee details to check if they're admin
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        isAdmin: true,
        role: {
          select: {
            name: true,
          }
        }
      }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Check if user is admin or has admin/superadmin role
    const isAdmin = employee.isAdmin;
    const roleName = employee.role?.name || '';
    const isSuperAdminRole = roleName.toLowerCase() === 'superadmin' || roleName.toLowerCase() === 'admin';

    // If admin or superadmin role, return immediately with full access
    if (isAdmin || isSuperAdminRole) {
      return NextResponse.json({
        isAdmin: true,
        role: roleName,
        permissions: ['Superadmin All'], // Grant all permissions
      });
    }

    // Otherwise, fetch campaign-specific permissions
    const assignment = await prisma.campaignAssignment.findFirst({
      where: {
        campaignId,
        employeeId,
      },
      include: {
        role: {
          select: {
            name: true,
            permissions: {
              select: {
                permission: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!assignment || !assignment.role) {
      return NextResponse.json({
        isAdmin: false,
        role: null,
        permissions: [],
      });
    }

    // Extract and format permissions
    const permissions = assignment.role.permissions.map(rp =>
      rp.permission.name
        .replace(/^[-_]*(.)/, (_, c) => c.toUpperCase())
        .replace(/[-_]+(.)/g, (_, c) => ' ' + c.toUpperCase())
    );

    return NextResponse.json({
      isAdmin: false,
      role: assignment.role.name,
      permissions,
    });
  } catch (error) {
    console.error('Campaign auth error:', error);
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
