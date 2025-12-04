// app/api/companies/[id]/employees/route.js
// cacheable , invalidate employee post
import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET(req, { params }) {
  try {
    const employees = await prisma.employee.findMany({
      where: { companyId: params.id },
      include: { role: true, department: true }
    })

    const formatted = employees.map(e => ({
      id: e.id,
      name: `${e.firstName} ${e.lastName}`,
      email: e.email,
      role: e.role?.name || 'N/A',
      department: e.department?.name || 'N/A',
      status: e.status
    }))

    return NextResponse.json(formatted)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 })
  }
}
