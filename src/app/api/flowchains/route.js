import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { verifyJWT } from '@/app/lib/auth';

export async function POST(request) {
  try {
    const { employee, error, status } = await verifyJWT(request);
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    const body = await request.json();
    const { name, description, companyId, steps } = body;

    if (!name || !companyId) {
      return NextResponse.json(
        { error: 'Name and company ID are required' },
        { status: 400 }
      );
    }

    if (employee.companyId !== companyId) {
      return NextResponse.json(
        { error: 'Forbidden - Access denied' },
        { status: 403 }
      );
    }

    if (!steps || steps.length === 0) {
      return NextResponse.json(
        { error: 'At least one step is required' },
        { status: 400 }
      );
    }

    // Create flowchain with steps and transitions
    const flowChain = await prisma.flowChain.create({
      data: {
        name,
        description,
        companyId,
        steps: {
          create: steps.map((step, index) => ({
            name: step.name,
            description: step.description,
            roleId: step.roleId || null,
          })),
        },
      },
      include: {
        steps: true,
      },
    });

    // Now create transitions
    // We need to map step names to their IDs
    const stepNameToId = {};
    flowChain.steps.forEach(step => {
      const originalStep = steps.find(s => s.name === step.name);
      if (originalStep) {
        stepNameToId[step.name] = step.id;
      }
    });

    // Create transitions
    const transitions = [];
    for (const step of steps) {
      if (step.transitions && step.transitions.length > 0) {
        const fromStepId = stepNameToId[step.name];
        
        for (const transition of step.transitions) {
          const toStepId = stepNameToId[transition.toStepName];
          
          if (fromStepId && toStepId) {
            transitions.push({
              fromStepId,
              toStepId,
              condition: transition.condition,
            });
          }
        }
      }
    }

    // Bulk create transitions
    if (transitions.length > 0) {
      await prisma.flowTransition.createMany({
        data: transitions,
      });
    }

    // Fetch the complete flowchain with transitions
    const completeFlowChain = await prisma.flowChain.findUnique({
      where: { id: flowChain.id },
      include: {
        steps: {
          include: {
            role: true,
            nextSteps: {
              include: {
                toStep: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: completeFlowChain,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating flowchain:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined 
      },
      { status: 500 }
    );
  }
}
