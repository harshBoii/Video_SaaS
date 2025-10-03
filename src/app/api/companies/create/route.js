import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function POST(req) {
  try {
    const { companyName, companyType, adminFirstName, adminLastName, adminEmail, adminPassword, adminPosition } = await req.json()

    // 1. Create the company
    const company = await prisma.company.create({
      data: {
        name: companyName,
        description: companyType
      }
    })

    // 2. Ensure Admin role exists for this company
    let role = await prisma.role.findFirst({
      where: { name: 'Admin', companyId: company.id }
    })
    if (!role) {
      role = await prisma.role.create({
        data: {
          name: 'Admin',
          description: 'Company Admin',
          companyId: company.id
        }
      })
    }

    // 3. Create Admin employee
    const passwordHash = await bcrypt.hash(adminPassword, 10)
    const employee = await prisma.employee.create({
      data: {
        firstName: adminFirstName,
        lastName: adminLastName,
        email: adminEmail,
        passwordHash,
        status: 'ACTIVE',
        companyId: company.id,
        roleId: role.id
      }
    })

    return NextResponse.json({ company, employee })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: error.message || 'Failed to create company' }, { status: 500 })
  }
}
