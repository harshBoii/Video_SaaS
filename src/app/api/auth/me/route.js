// import { PrismaClient } from '@prisma/client'
// import { verify } from 'jsonwebtoken'
// import { NextResponse } from 'next/server'

// const prisma = new PrismaClient()

// export async function GET(req) {
//   try {
//     const token = req.cookies.get('token')?.value
//     if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

//     const decoded = verify(token, process.env.JWT_SECRET)

//     const user = await prisma.employee.findUnique({
//       where: { id: decoded.id },
//       include: {
//         role: true,
//         company: {
//           select: { id: true,name: true, domain: true , email:true , mobile:true}
//         }
//       }
//     })

//     if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

//     return NextResponse.json({
//       id: user.id,
//       firstName: user.firstName,
//       lastName: user.lastName,
//       email: user.email,
//       role: user.role?.name,
//       company: user.company,
//       lastLogin: user.lastLogin,
//       companyId:user.company.id
//     })
//   } catch (err) {
//     console.error(err)
//     return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
//   }
// }
import { PrismaClient } from '@prisma/client';
import { verify } from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verify(token, process.env.JWT_SECRET);

    const user = await prisma.employee.findUnique({
      where: { id: decoded.id },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        company: {
          select: { 
            id: true, 
            name: true, 
            domain: true, 
            email: true, 
            mobile: true 
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return in format expected by frontend
    return NextResponse.json({
      success: true, // Add this for consistency
      employee: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        companyId: user.companyId,
        is_admin: user.is_admin,
        status: user.status,
        role: user.role,
        company: user.company,
        lastLogin: user.lastLogin,
      },
    });
  } catch (err) {
    console.error('Auth me error:', err);
    return NextResponse.json(
      { error: 'Invalid or expired token' }, 
      { status: 401 }
    );
  }
}
