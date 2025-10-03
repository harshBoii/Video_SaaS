// app/api/companies/search/route.js
import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const name = searchParams.get('name') || ''

    const companies = await prisma.company.findMany({
      where: {
        name: { contains: name, mode: 'insensitive' }
      },
      include: {
        employees: {
          where: {
            role: { name: 'Admin' } // assume one admin per company
          },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const formatted = companies.map(c => {
      const admin = c.employees[0]
      return {
        id: c.id,
        companyName: c.name,
        adminName: admin ? `${admin.firstName} ${admin.lastName}` : 'N/A',
        adminEmail: admin?.email || 'N/A',
        package: "Standard",   // you could add `plan` field in Company later
        remaining: "Active"    // could be license expiry logic
      }
    })

    return NextResponse.json(formatted)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 })
  }
}
