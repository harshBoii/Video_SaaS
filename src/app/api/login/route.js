import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function POST(req) {
  try {
    const { email, password } = await req.json()

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
      { expiresIn: '1h' }
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
