import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { verifyJWT } from '@/app/lib/auth';
import { requireAuth } from '@/app/lib/auth';

export async function DELETE(request, { params }) {
  try {
    const { employee, error, status } = await verifyJWT(request);
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    requireAuth(employee)

    const { id:campaignId, flowId } = await params;


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

    // Verify flow assignment exists
    const campaignFlow = await prisma.campaignFlow.findUnique({
      where: { id: flowId },
    });

    if (!campaignFlow) {
      return NextResponse.json(
        { error: 'Flow assignment not found' },
        { status: 404 }
      );
    }

    if (campaignFlow.campaignId !== campaignId) {
      return NextResponse.json(
        { error: 'Flow does not belong to this campaign' },
        { status: 400 }
      );
    }

    // Delete the assignment
    await prisma.campaignFlow.delete({
      where: { id: flowId },
    });

    // If this was the default, maybe set another as default
    if (campaignFlow.isDefault) {
      const otherFlow = await prisma.campaignFlow.findFirst({
        where: { campaignId },
      });

      if (otherFlow) {
        await prisma.campaignFlow.update({
          where: { id: otherFlow.id },
          data: { isDefault: true },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Flow removed from campaign successfully',
    });

  } catch (error) {
    console.error('Error deleting campaign flow:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined 
      },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { employee, error, status } = await verifyJWT(request);
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    const { campaignId, flowId } = params;
    const body = await request.json();
    const { isDefault } = body;

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

    // Verify flow assignment exists
    const campaignFlow = await prisma.campaignFlow.findUnique({
      where: { id: flowId },
    });

    if (!campaignFlow) {
      return NextResponse.json(
        { error: 'Flow assignment not found' },
        { status: 404 }
      );
    }

    if (campaignFlow.campaignId !== campaignId) {
      return NextResponse.json(
        { error: 'Flow does not belong to this campaign' },
        { status: 400 }
      );
    }

    // If setting as default, unset other defaults
    if (isDefault === true) {
      await prisma.campaignFlow.updateMany({
        where: { 
          campaignId,
          id: { not: flowId },
        },
        data: { isDefault: false },
      });
    }

    // Update the flow
    const updatedFlow = await prisma.campaignFlow.update({
      where: { id: flowId },
      data: { isDefault },
      include: {
        flowChain: {
          include: {
            steps: {
              include: {
                role: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedFlow,
    });

  } catch (error) {
    console.error('Error updating campaign flow:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined 
      },
      { status: 500 }
    );
  }
}
