import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { verifyJWT } from '@/app/lib/auth';

export async function GET(request, { params }) {
  try {
    const { employee, error, status } = await verifyJWT(request);
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    const { id:companyId } = params;
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');

    if (employee.companyId !== companyId) {
      return NextResponse.json(
        { error: 'Forbidden - Access denied' },
        { status: 403 }
      );
    }

    // Get all flowchains for the company
    const flowchains = await prisma.flowChain.findMany({
      where: { companyId },
      include: {
        steps: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // If campaignId provided, filter out already assigned ones
    let availableFlowchains = flowchains;
    
    if (campaignId) {
      const assignedFlows = await prisma.campaignFlow.findMany({
        where: { campaignId },
        select: { flowChainId: true },
      });

      const assignedIds = new Set(assignedFlows.map(f => f.flowChainId));
      availableFlowchains = flowchains.filter(fc => !assignedIds.has(fc.id));
    }

    // Transform response
    const transformed = availableFlowchains.map(fc => ({
      id: fc.id,
      name: fc.name,
      description: fc.description,
      totalSteps: fc.steps.length,
      createdAt: fc.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: transformed,
    });

  } catch (error) {
    console.error('Error fetching flowchains:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined 
      },
      { status: 500 }
    );
  }
}
