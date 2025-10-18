import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { verifyJWT, requireAdmin } from '@/app/lib/auth';

export async function DELETE(request, { params }) {
  try {
    const { employee, error, status } = await verifyJWT(request);
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    const { campaignId, assignmentId } = params;

    if (!campaignId || !assignmentId) {
      return NextResponse.json(
        { error: 'Invalid campaign or assignment ID' },
        { status: 400 }
      );
    }

    // Verify campaign exists and user has access
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { companyId: true },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    if (employee.companyId !== campaign.companyId) {
      return NextResponse.json(
        { error: 'Forbidden - Access denied' },
        { status: 403 }
      );
    }

    const adminError = requireAdmin(employee);
    if (adminError) {
      return NextResponse.json(
        { error: adminError.error },
        { status: adminError.status }
      );
    }

    // Verify assignment exists and belongs to this campaign
    const assignment = await prisma.campaignAssignment.findUnique({
      where: { id: assignmentId },
      select: { campaignId: true },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    if (assignment.campaignId !== campaignId) {
      return NextResponse.json(
        { error: 'Assignment does not belong to this campaign' },
        { status: 400 }
      );
    }

    // Delete the assignment
    await prisma.campaignAssignment.delete({
      where: { id: assignmentId },
    });

    return NextResponse.json({
      success: true,
      message: 'Assignment removed successfully',
    });

  } catch (error) {
    console.error('Error removing assignment:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined 
      },
      { status: 500 }
    );
  }
}
