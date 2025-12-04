//cache here till put request

import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { verifyJWT } from '@/app/lib/auth';

// GET - Fetch single flowchain with all details
export async function GET(request, { params }) {
  try {
    const { employee, error, status } = await verifyJWT(request);
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = params;

    const flowChain = await prisma.flowChain.findUnique({
      where: { id },
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
    });

    if (!flowChain) {
      return NextResponse.json(
        { error: 'FlowChain not found' },
        { status: 404 }
      );
    }

    if (flowChain.companyId !== employee.companyId) {
      return NextResponse.json(
        { error: 'Forbidden - Access denied' },
        { status: 403 }
      );
    }

    // Transform response
    const transformed = {
      id: flowChain.id,
      name: flowChain.name,
      description: flowChain.description,
      companyId: flowChain.companyId,
      steps: flowChain.steps.map(step => ({
        id: step.id,
        name: step.name,
        description: step.description,
        roleId: step.roleId,
        role: step.role,
        transitions: step.nextSteps.map(t => ({
          id: t.id,
          condition: t.condition,
          toStep: t.toStep,
        })),
      })),
      createdAt: flowChain.createdAt,
      updatedAt: flowChain.updatedAt,
    };

    return NextResponse.json({
      success: true,
      data: transformed,
    });

  } catch (error) {
    console.error('Error fetching flowchain:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update flowchain
export async function PUT(request, { params }) {
  try {
    const { employee, error, status } = await verifyJWT(request);
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    const { id: flowChainId } = params;
    const body = await request.json();
    const { name, description, steps } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Verify flowchain exists and user has access
    const existingFlowChain = await prisma.flowChain.findUnique({
      where: { id: flowChainId },
      select: { companyId: true },
    });

    if (!existingFlowChain) {
      return NextResponse.json(
        { error: 'FlowChain not found' },
        { status: 404 }
      );
    }

    if (existingFlowChain.companyId !== employee.companyId) {
      return NextResponse.json(
        { error: 'Forbidden - Access denied' },
        { status: 403 }
      );
    }

    // Update in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update flowchain basic info
      const updatedFlowChain = await tx.flowChain.update({
        where: { id: flowChainId },
        data: {
          name,
          description,
        },
      });

      // Delete existing steps and transitions
      await tx.flowTransition.deleteMany({
        where: {
          OR: [
            { fromStep: { chainId: flowChainId } },
            { toStep: { chainId: flowChainId } },
          ],
        },
      });

      await tx.flowStep.deleteMany({
        where: { chainId: flowChainId },
      });

      // Create new steps
      const createdSteps = await Promise.all(
        steps.map((step, index) =>
          tx.flowStep.create({
            data: {
              name: step.name,
              description: step.description,
              roleId: step.roleId || null,
              chainId: flowChainId,
            },
          })
        )
      );

      // Create step name to ID mapping
      const stepNameToId = {};
      createdSteps.forEach((step, index) => {
        stepNameToId[steps[index].name] = step.id;
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

      if (transitions.length > 0) {
        await tx.flowTransition.createMany({
          data: transitions,
        });
      }

      return updatedFlowChain;
    });

    // Fetch complete updated flowchain
    const completeFlowChain = await prisma.flowChain.findUnique({
      where: { id: flowChainId },
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
      message: 'FlowChain updated successfully',
    });

  } catch (error) {
    console.error('Error updating flowchain:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete flowchain
export async function DELETE(request, { params }) {
  try {
    const { employee, error, status } = await verifyJWT(request);
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    const { id: flowChainId } = params;

    const flowChain = await prisma.flowChain.findUnique({
      where: { id: flowChainId },
      select: { companyId: true },
    });

    if (!flowChain) {
      return NextResponse.json(
        { error: 'FlowChain not found' },
        { status: 404 }
      );
    }

    if (flowChain.companyId !== employee.companyId) {
      return NextResponse.json(
        { error: 'Forbidden - Access denied' },
        { status: 403 }
      );
    }

    // Delete in transaction (cascading deletes handled by Prisma)
    await prisma.flowChain.delete({
      where: { id: flowChainId },
    });

    return NextResponse.json({
      success: true,
      message: 'FlowChain deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting flowchain:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
