import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function POST(req) {
  try {
    const { email, password } = await req.json()
      console.log("The Data Is , " , email , password)

    // 1. Find employee
    const user = await prisma.employee.findUnique({
      where: { email },
      include: {
        role: {
          include: {
            permissions: { include: { permission: true } }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // 2. Verify password
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // 3. Collect permissions
    const permissions = user.role
      ? user.role.permissions.map(rp => rp.permission.name)
      : []

    // 4. Generate JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role?.name,
        permissions,
        companyId: user.companyId
      },
      process.env.JWT_SECRET,  // add to .env
      { expiresIn: '6h' }
    )

    // 5. Decide redirect based on role
    let redirect = '/employee'
    if (user.role?.name === 'SuperAdmin') redirect = '/superadmin'
    else if (user.role?.name === 'Admin') redirect = '/admin'

    const res = NextResponse.json({
      message: 'Login successful',
      token,
      redirect
    })

    res.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });

  return res

  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
// // app/api/auth/login/route.js
// import prisma from "@/app/lib/prisma"; // Use singleton
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";
// import { NextResponse } from "next/server";
// import { z } from "zod";
// import { formatZodError } from "@/app/lib/validation";

// // ✅ Input validation schema
// const loginSchema = z.object({
//   email: z
//     .string()
//     .email("Invalid email format")
//     .max(255, "Email too long")
//     .toLowerCase()
//     .trim(),
//   password: z
//     .string()
//     .min(8, "Password must be at least 8 characters")
//     .max(255, "Password too long"),
// });


// export async function POST(req) {
//   try {
//     // ✅ Parse and validate input
//     const body = await req.json();
//     const validation = loginSchema.safeParse(body);

//     if (!validation.success) {
//       return NextResponse.json(
//         {
//           success: false,
//           error: "Validation failed",
//           details: formatZodError(validation.error),
//         },
//         { status: 400 }
//       );
//     }

//     const { email, password } = validation.data;

//     // ✅ Find employee with complete data
//     const user = await prisma.employee.findUnique({
//       where: { email },
//       select: {
//         id: true,
//         email: true,
//         firstName: true,
//         lastName: true,
//         passwordHash: true,
//         status: true,
//         isAdmin: true,
//         companyId: true,
//         roleId: true,
//         role: {
//           select: {
//             id: true,
//             name: true,
//             permissions: {
//               select: {
//                 permission: {
//                   select: {
//                     id: true,
//                     name: true,
//                     group: true,
//                   },
//                 },
//               },
//             },
//           },
//         },
//         company: {
//           select: {
//             id: true,
//             name: true,
//           },
//         },
//       },
//     });

//     // ✅ Generic error message (don't reveal if user exists)
//     if (!user) {
//       return NextResponse.json(
//         {
//           success: false,
//           error: "Invalid credentials",
//         },
//         { status: 401 }
//       );
//     }

//     // ✅ Check if user is active
//     if (user.status !== "ACTIVE") {
//       return NextResponse.json(
//         {
//           success: false,
//           error: "Account is inactive or suspended",
//           status: user.status,
//         },
//         { status: 403 }
//       );
//     }

//     // ✅ Verify password
//     const validPassword = await bcrypt.compare(password, user.passwordHash);
//     if (!validPassword) {
//       return NextResponse.json(
//         {
//           success: false,
//           error: "Invalid credentials",
//         },
//         { status: 401 }
//       );
//     }

//     // ✅ Extract permissions
//     const permissions = user.role
//       ? user.role.permissions.map((rp) => rp.permission.name)
//       : [];

//     // ✅ Group permissions by category
//     const permissionsByGroup = user.role
//       ? user.role.permissions.reduce((acc, rp) => {
//           const group = rp.permission.group || "general";
//           if (!acc[group]) acc[group] = [];
//           acc[group].push(rp.permission.name);
//           return acc;
//         }, {})
//       : {};

//     // ✅ Generate JWT with proper expiry (7 days)
//     const token = jwt.sign(
//       {
//         id: user.id,
//         email: user.email,
//         companyId: user.companyId,
//         roleId: user.roleId,
//         roleName: user.role?.name || null,
//         isAdmin: user.isAdmin,
//         permissions,
//       },
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" } // ✅ 7 days for better UX
//     );

//     // ✅ Update lastLogin timestamp
//     await prisma.employee.update({
//       where: { id: user.id },
//       data: {
//         lastLogin: new Date(),
//       },
//     });

//     // ✅ Determine redirect based on role hierarchy
//     let redirect = '/employee'
//     if (user.role?.name === 'SuperAdmin') redirect = '/superadmin'
//     else if (user.role?.name === 'Admin') redirect = '/admin'

//     // ✅ Create response with user data (excluding sensitive info)
//     const response = NextResponse.json({
//       success: true,
//       message: "Login successful",
//       token,
//       redirect,
//       user: {
//         id: user.id,
//         email: user.email,
//         firstName: user.firstName,
//         lastName: user.lastName,
//         fullName: `${user.firstName} ${user.lastName}`,
//         isAdmin: user.isAdmin,
//         status: user.status,
//         company: user.company,
//         role: user.role
//           ? {
//               id: user.role.id,
//               name: user.role.name,
//             }
//           : null,
//         permissions,
//         permissionsByGroup,
//       },
//     });

//     // ✅ Set secure HTTP-only cookie
//     response.cookies.set("token", token, {
//       httpOnly: true, // Prevents XSS attacks
//       secure: process.env.NODE_ENV === "production", // HTTPS only in prod
//       sameSite: "strict", // CSRF protection
//       path: "/",
//       maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
//     });

//     return response;
//   } catch (error) {
//     console.error("Login error:", error);

//     // ✅ Handle specific errors
//     if (error.name === "JsonWebTokenError") {
//       return NextResponse.json(
//         {
//           success: false,
//           error: "Token generation failed",
//         },
//         { status: 500 }
//       );
//     }

//     return NextResponse.json(
//       {
//         success: false,
//         error: "Server error",
//         message: process.env.NODE_ENV === "development" ? error.message : undefined,
//       },
//       { status: 500 }
//     );
//   }
// }
