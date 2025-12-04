// cache here till put call 
// src/app/api/hierarchy/employees/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma'; // Adjust your prisma import path

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        subordinates: true,
        manager: true,
      },
    });
    return NextResponse.json(employees);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { employeeId, managerId } = await request.json();

    // validation: prevent circular reference (simplified check)
    if (employeeId === managerId) {
      return NextResponse.json({ error: 'Cannot report to self' }, { status: 400 });
    }

    const updated = await prisma.employee.update({
      where: { id: employeeId },
      data: { managerId: managerId }, // managerId can be null (to remove manager)
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
