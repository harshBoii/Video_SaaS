import { PrismaClient } from '@prisma/client'
import { verify } from 'jsonwebtoken'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET(req) {
  try {
    const token = req.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verify(token, process.env.JWT_SECRET)

    const user = await prisma.employee.findUnique({
      where: { id: decoded.id },
      include: {
        role: true,
        company: {
          select: { name: true, domain: true }
        }
      }
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    return NextResponse.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role?.name,
      company: user.company,
      lastLogin: user.lastLogin
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
  }
}
