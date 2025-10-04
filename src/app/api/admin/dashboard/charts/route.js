import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    // --- Step 1: Authenticate the Admin and Get Company ID ---
    const token = req.cookies.get('token')?.value;
    if (!token)
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decoded.companyId;

    if (!companyId)
      return NextResponse.json({ error: 'Invalid token or no company access' }, { status: 403 });

    // --- Step 2: Query Employee Stats ---

    // 1️⃣ Employee status breakdown
    const [activeCount, inactiveCount, suspendedCount] = await Promise.all([
      prisma.employee.count({ where: { companyId, status: 'ACTIVE' } }),
      prisma.employee.count({ where: { companyId, status: 'INACTIVE' } }),
      prisma.employee.count({ where: { companyId, status: 'SUSPENDED' } }),
    ]);

    // 2️⃣ Department-wise employee count
    const departments = await prisma.department.findMany({
      where: { companyId },
      include: {
        _count: { select: { employees: true } },
      },
    });

    // 3️⃣ Top roles by employee count
    const roles = await prisma.role.findMany({
      where: { companyId },
      include: {
        _count: { select: { employees: true } },
      },
      orderBy: {
        employees: { _count: 'desc' },
      },
      take: 5,
    });

    // --- Step 3: Prepare chart data ---
    const chartData = {
      employeeStatus: {
        active: activeCount,
        inactive: inactiveCount,
        suspended: suspendedCount,
      },
      departmentEmployees: departments.map((d) => ({
        name: d.name,
        count: d._count.employees,
      })),
      topRoles: roles.map((r) => ({
        name: r.name,
        employees: r._count.employees,
      })),
    };

    // --- Step 4: Return Response ---
    return NextResponse.json(chartData);
  } catch (error) {
    console.error('Error in /api/admin/charts-dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard chart data.' },
      { status: 500 }
    );
  }
}
