import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { verifyJWT, requireAdmin } from '@/app/lib/auth';

export async function GET(request, { params }) {
  try {
    const { employee, error, status } = await verifyJWT(request);
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    const { id: campaignId } = params;

    if (!campaignId || typeof campaignId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid campaign ID' },
        { status: 400 }
      );
    }

    // Verify campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { 
        companyId: true,
        name: true,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    if (employee.companyId !== campaign.companyId) {
      return NextResponse.json(
        { error: 'Forbidden - Access denied to this campaign' },
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

    // Fetch campaign flows with full FlowChain details
    const campaignFlows = await prisma.campaignFlow.findMany({
      where: { campaignId },
      include: {
        flowChain: {
          include: {
            steps: {
              include: {
                role: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                nextSteps: {
                  include: {
                    toStep: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // Transform response
    const flows = campaignFlows.map(cf => ({
      id: cf.id,
      isDefault: cf.isDefault,
      flowChain: {
        id: cf.flowChain.id,
        name: cf.flowChain.name,
        description: cf.flowChain.description,
        totalSteps: cf.flowChain.steps.length,
        steps: cf.flowChain.steps.map(step => ({
          id: step.id,
          name: step.name,
          description: step.description,
          role: step.role,
          transitions: step.nextSteps.map(t => ({
            id: t.id,
            condition: t.condition,
            toStep: t.toStep,
          })),
        })),
        createdAt: cf.flowChain.createdAt,
        updatedAt: cf.flowChain.updatedAt,
      },
      createdAt: cf.createdAt,
      updatedAt: cf.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        campaignId: campaignId,
        campaignName: campaign.name,
        totalFlows: flows.length,
        defaultFlow: flows.find(f => f.isDefault) || null,
        flows: flows,
      },
    });

  } catch (error) {
    console.error('Error fetching campaign flows:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined 
      },
      { status: 500 }
    );
  }
}
