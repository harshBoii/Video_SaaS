// app/api/employees/route.js
//invalidate here and cache at get
import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { verify } from 'jsonwebtoken';

// GET /api/employees?companyId=1
// export async function GET(request) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const companyId = searchParams.get('companyId');

//     if (!companyId) {
//       return NextResponse.json(
//         { error: 'Company ID is required' },
//         { status: 400 }
//       );
//     }

//     // Fetch all employees with relations
//     const employees = await prisma.employee.findMany({
//       where: {
//         companyId: companyId,
//       },
//       include: {
//         role: {
//           select: {
//             id: true,
//             name: true,
//             description: true,
//           },
//         },
//         department: {
//           select: {
//             id: true,
//             name: true,
//           },
//         },
//         manager: {
//           select: {
//             id: true,
//             firstName: true,
//             lastName: true,
//             email: true,
//           },
//         },
//       },
//       orderBy: [
//         { isAdmin: 'desc' },
//         { firstName: 'asc' },
//       ],
//     });

//     return NextResponse.json({
//       success: true,
//       employees,
//       count: employees.length,
//     });
//   } catch (error) {
//     console.error('Error fetching employees:', error);
//     return NextResponse.json(
//       { error: 'Failed to fetch employees', details: error.message },
//       { status: 500 }
//     );
//   }
// }


// POST /api/employees - Create new employee
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      roleId,
      departmentId,
      managerId,
      companyId,
      isAdmin = false,
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !companyId) {
      return NextResponse.json(
        { error: 'Missing required fields: firstName, lastName, email, companyId' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { email },
    });

    if (existingEmployee) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }

    // Create employee
    const newEmployee = await prisma.employee.create({
      data: {
        firstName,
        lastName,
        email,
        phone: phone || null,
        roleId: roleId ? (roleId) : null,
        departmentId: departmentId ?  (departmentId) : null,
        managerId: managerId ?  (managerId) : null,
        companyId:  (companyId),
        isAdmin,
      },
      include: {
        role: true,
        department: true,
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
    const employees = await prisma.employee.findMany({
      where: {
        companyId: companyId,
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: [
        { isAdmin: 'desc' },
        { firstName: 'asc' },
      ],
    });

    return NextResponse.json({
      success: true,
      employee: newEmployee,
      message: 'Employee created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating employee:', error);
    return NextResponse.json(
      { error: 'Failed to create employee', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    // 1. Verify Authentication
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verify(token, process.env.JWT_SECRET);
    const employeeId = decoded.id;
    const companyId = decoded.companyId
    // 2. Fetch Campaigns assigned to this employee
    const assignments = await prisma.campaignAssignment.findMany({
      where: {
        employeeId: employeeId
      },
      include: {
        role: true, // To show what role they play in this campaign (e.g. Editor, Viewer)
        campaign: {
          include: {
            assignments: true, // To count total members
            videos: {
              where: { status: 'ready' } // To count completed videos or calculate progress
            }
          }
        }
      },
      orderBy: {
        joinedAt: 'desc'
      }
    });

    // 3. Format Data for Frontend
    const campaigns = assignments.map((assignment) => {
      const c = assignment.campaign;
      
      // Calculate progress based on videos or your specific logic
      // Example logic: (videos ready / total videos expected) * 100
      // For now, I'll generate a semi-random progress based on video count for visual effect
      const progress = Math.min(100, (c.videos.length * 10)); 

      return {
        id: c.id,
        name: c.name,
        role: assignment.role.name, // "Editor", "Reviewer", etc.
        status: c.status, // 'active', 'archived', etc.
        dueDate: c.updatedAt, // Or a specific dueDate field if you add one to schema
        members: c.assignments.length,
        videos: c.videos.length,
        progress: progress,
        joinedAt: assignment.joinedAt
      };
    });

    const employees = await prisma.employee.findMany({
      where: {
        companyId: companyId,
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: [
        { isAdmin: 'desc' },
        { firstName: 'asc' },
      ],
    });


    return NextResponse.json
      ({ success: true, 
         campaigns,
         employees,
         count: employees.length,
 });

  } catch (error) {
    console.error('Error fetching employee campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}
