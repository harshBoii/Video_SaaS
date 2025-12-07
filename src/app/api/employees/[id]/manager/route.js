// app/api/employees/[id]/manager/route.js
import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

// PATCH /api/employees/[id]/manager - Update employee's manager
export async function PATCH(request, { params }) {
  try {
    const {id: employeeId} = await params
    // const employeeId =  (params.id);
    const body = await request.json();
    const { managerId } = body;

    if (!managerId) {
      return NextResponse.json(
        { error: 'Manager ID is required' },
        { status: 400 }
      );
    }

    const newManagerId =  (managerId);

    // Verify employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Verify new manager exists
    const newManager = await prisma.employee.findUnique({
      where: { id: newManagerId },
    });

    if (!newManager) {
      return NextResponse.json(
        { error: 'Manager not found' },
        { status: 404 }
      );
    }

    // Verify they're in the same company
    if (newManager.companyId !== employee.companyId) {
      return NextResponse.json(
        { error: 'Manager must be in same company' },
        { status: 400 }
      );
    }

    // Prevent self-assignment
    if (employeeId === newManagerId) {
      return NextResponse.json(
        { error: 'Employee cannot be their own manager' },
        { status: 400 }
      );
    }

    // Prevent circular references
    const isCircular = await checkCircularReference(newManagerId, employeeId);
    if (isCircular) {
      return NextResponse.json(
        { error: 'This would create a circular reference in the hierarchy' },
        { status: 400 }
      );
    }

    // Update manager
    const updatedEmployee = await prisma.employee.update({
      where: { id: employeeId },
      data: { managerId: newManagerId },
      include: {
        role: true,
        department: true,
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      employee: updatedEmployee,
      message: 'Manager updated successfully',
    });
  } catch (error) {
    console.error('Error updating manager:', error);
    return NextResponse.json(
      { error: 'Failed to update manager', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/employees/[id]/manager - Remove employee's manager
export async function DELETE(request, { params }) {
  try {
    const {id:employeeId} = await params;

    // Verify employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Remove manager
    const updatedEmployee = await prisma.employee.update({
      where: { id: employeeId },
      data: { managerId: null },
      include: {
        role: true,
        department: true,
      },
    });

    return NextResponse.json({
      success: true,
      employee: updatedEmployee,
      message: 'Manager removed successfully',
    });
  } catch (error) {
    console.error('Error removing manager:', error);
    return NextResponse.json(
      { error: 'Failed to remove manager', details: error.message },
      { status: 500 }
    );
  }
}

// Helper function to check for circular references
async function checkCircularReference(managerId, employeeId) {
  let currentId = managerId;
  const visited = new Set();
  const maxDepth = 100; // Safety limit

  while (currentId !== null && visited.size < maxDepth) {
    if (currentId === employeeId) {
      return true; // Circular reference detected
    }

    if (visited.has(currentId)) {
      break; // Already visited, avoid infinite loop
    }

    visited.add(currentId);

    const manager = await prisma.employee.findUnique({
      where: { id: currentId },
      select: { managerId: true },
    });

    if (!manager) {
      break;
    }

    currentId = manager.managerId;
  }

  return false;
}
