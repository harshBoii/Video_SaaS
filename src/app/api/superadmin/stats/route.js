
import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const totalCompanies = await prisma.company.count()
    const totalEmployees = await prisma.employee.count()

    return NextResponse.json({ totalCompanies, totalEmployees })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 })
  }
}
