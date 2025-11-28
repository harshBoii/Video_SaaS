// app/api/employees/[id]/route.js
import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

// GET /api/employees/[id]
export async function GET(request, { params }) {
  try {
    const employeeId =  (params.id);

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
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
        subordinates: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      employee,
    });
  } catch (error) {
    console.error('Error fetching employee:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employee', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/employees/[id] - Update employee
export async function PATCH(request, { params }) {
  try {
    const employeeId =  (params.id);
    const body = await request.json();

    // Verify employee exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!existingEmployee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // If updating email, check for duplicates
    if (body.email && body.email !== existingEmployee.email) {
      const emailExists = await prisma.employee.findUnique({
        where: { email: body.email },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        );
      }
    }

    // Update employee
    const updatedEmployee = await prisma.employee.update({
      where: { id: employeeId },
      data: {
        ...(body.firstName && { firstName: body.firstName }),
        ...(body.lastName && { lastName: body.lastName }),
        ...(body.email && { email: body.email }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.roleId !== undefined && { 
          roleId: body.roleId ?  (body.roleId) : null 
        }),
        ...(body.departmentId !== undefined && { 
          departmentId: body.departmentId ?  (body.departmentId) : null 
        }),
        ...(body.managerId !== undefined && { 
          managerId: body.managerId ?  (body.managerId) : null 
        }),
        ...(body.isAdmin !== undefined && { isAdmin: body.isAdmin }),
      },
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
      message: 'Employee updated successfully',
    });
  } catch (error) {
    console.error('Error updating employee:', error);
    return NextResponse.json(
      { error: 'Failed to update employee', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/employees/[id]
export async function DELETE(request, { params }) {
  try {
    const employeeId =  (params.id);

    // Verify employee exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!existingEmployee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Check if employee has subordinates
    const subordinates = await prisma.employee.count({
      where: { managerId: employeeId },
    });

    if (subordinates > 0) {
      // Reassign subordinates to null (no manager)
      await prisma.employee.updateMany({
        where: { managerId: employeeId },
        data: { managerId: null },
      });
    }

    // Delete employee
    await prisma.employee.delete({
      where: { id: employeeId },
    });

    return NextResponse.json({
      success: true,
      message: 'Employee deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting employee:', error);
    return NextResponse.json(
      { error: 'Failed to delete employee', details: error.message },
      { status: 500 }
    );
  }
}
