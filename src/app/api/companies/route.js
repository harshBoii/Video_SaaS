// app/api/companies/route.js

//invalidate here for company get 
import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function POST(req) {
  try {
    const { name, domain, adminEmail, adminPassword, adminFirstName, adminLastName } = await req.json()

    // Create company
    const company = await prisma.company.create({
      data: {
        name,
        domain,
        description: `${name} registered company`,
        employees: {
          create: {
            firstName: adminFirstName,
            lastName: adminLastName,
            email: adminEmail,
            passwordHash: await bcrypt.hash(adminPassword, 10),
            status: 'ACTIVE',
            role: {
              connectOrCreate: {
                where: { name_companyId: { name: 'Admin', companyId: '' } },
                create: { name: 'Admin', companyId: '' } 
              }
            }
          }
        }
      },
      include: { employees: true }
    })

    return NextResponse.json(company)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create company' }, { status: 500 })
  }
}
