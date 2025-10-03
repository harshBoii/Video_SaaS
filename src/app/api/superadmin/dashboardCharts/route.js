import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

// Utility: safely convert BigInt → Number (or String if needed)
function safeJson(obj) {
  return JSON.parse(
    JSON.stringify(obj, (_, value) =>
      typeof value === 'bigint' ? Number(value) : value
    )
  )
}

export async function GET() {
  try {
    // 1. Companies created in the last 6 months (for line chart)
    const companiesByMonthRaw = await prisma.$queryRaw`
      SELECT DATE_TRUNC('month', "createdAt") as month, COUNT(*) as count
      FROM "Company"
      GROUP BY month
      ORDER BY month DESC
      LIMIT 6;
    `
    const companiesByMonth = safeJson(companiesByMonthRaw)

    // 2. Employees per role (for pie chart)
    const employeesByRole = await prisma.role.findMany({
      include: {
        _count: {
          select: { employees: true }
        }
      }
    })
    const roleData = employeesByRole.map(r => ({
      role: r.name,
      count: Number(r._count.employees) // BigInt → Number
    }))

    // 3. Employees per department (bar chart)
    const employeesByDept = await prisma.department.findMany({
      include: {
        _count: {
          select: { employees: true }
        }
      }
    })
    const deptData = employeesByDept.map(d => ({
      department: d.name,
      count: Number(d._count.employees) // BigInt → Number
    }))

    // 4. Active vs Inactive Employees
    const employeeStatus = await prisma.employee.groupBy({
      by: ['status'],
      _count: { _all: true }
    })
    const statusData = employeeStatus.map(s => ({
      status: s.status,
      count: Number(s._count._all) // BigInt → Number
    }))

    return NextResponse.json({
      companiesByMonth,
      roleData,
      deptData,
      statusData
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch chart data' }, { status: 500 })
  }
}
