import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { verifyJWT, requireAuth } from '@/app/lib/auth';

export async function DELETE(request, { params }) {
  try {
    const { employee, error, status } = await verifyJWT(request);
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    requireAuth(employee);

    const { id: campaignId, flowId } = await params;

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

    // If this was the default, set another as default
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
// PUT - Update flowchain with STAGE support// PUT - Update flowchain with STAGE support
export async function PUT(request, { params }) {
  try {
    const { employee, error, status } = await verifyJWT(request);
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    const { id: flowChainId } = await params;
    const body = await request.json();
    const { name, description, stages, companyId } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Verify flowchain exists and user has access
    const existingFlowChain = await prisma.flowChain.findUnique({
      where: { id: flowChainId },
      select: { 
        companyId: true,
        stages: { select: { id: true } }
      },
    });

    if (!existingFlowChain) {
      return NextResponse.json({ error: 'FlowChain not found' }, { status: 404 });
    }

    if (existingFlowChain.companyId !== employee.companyId) {
      return NextResponse.json({ error: 'Forbidden - Access denied' }, { status: 403 });
    }

    // ✅ Update with stage-based structure
    const result = await prisma.$transaction(async (tx) => {
      // Update flowchain basic info
      const updatedFlowChain = await tx.flowChain.update({
        where: { id: flowChainId },
        data: { name, description },
      });

      // ✅ Get all existing stage IDs
      const existingStageIds = existingFlowChain.stages.map(s => s.id);

      if (existingStageIds.length > 0) {
        // ✅ Delete existing stage transitions
        await tx.stageTransition.deleteMany({
          where: {
            OR: [
              { fromStageId: { in: existingStageIds } },
              { toStageId: { in: existingStageIds } }
            ]
          },
        });

        // ✅ Delete step transitions
        await tx.flowTransition.deleteMany({
          where: {
            fromStep: {
              stageId: { in: existingStageIds }
            }
          },
        });

        // ✅ Delete FlowStepRole assignments (CORRECT MODEL NAME)
        await tx.flowStepRole.deleteMany({
          where: {
            step: {
              stageId: { in: existingStageIds }
            }
          },
        });

        // ✅ Delete steps
        await tx.flowStep.deleteMany({
          where: {
            stageId: { in: existingStageIds }
          },
        });

        // ✅ Delete stages
        await tx.flowStage.deleteMany({
          where: { id: { in: existingStageIds } },
        });
      }

      // ✅ Create new stages and steps
      const stageIdMap = new Map();
      const allStepIdMaps = new Map(); // Global step ID mapping for transitions

      for (const stageData of stages) {
        // Generate custom stage ID
        const stageId = `stage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const createdStage = await tx.flowStage.create({
          data: {
            id: stageId,
            chainId: flowChainId,
            name: stageData.name,
            order: stageData.order,
            executionMode: stageData.executionMode,
          },
        });

        stageIdMap.set(stageData.name, createdStage.id);

        const stepIdMap = new Map();

        // Create steps in stage
        for (const stepData of stageData.steps) {
          const createdStep = await tx.flowStep.create({
            data: {
              name: stepData.name,
              description: stepData.description,
              orderInStage: stepData.orderInStage,
              approvalPolicy: stepData.approvalPolicy,
              stageId: createdStage.id,
              chainId: flowChainId,
              roleId: null, // Legacy field
            },
          });

          stepIdMap.set(stepData.name, createdStep.id);
          allStepIdMaps.set(stepData.name, createdStep.id);

          // ✅ Create FlowStepRole assignments
          if (stepData.assignedRoles && stepData.assignedRoles.length > 0) {
            for (const ar of stepData.assignedRoles) {
              const roleAssignmentId = `stepRole_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              await tx.flowStepRole.create({
                data: {
                  id: roleAssignmentId,
                  stepId: createdStep.id,
                  roleId: ar.roleId,
                  required: ar.required,
                },
              });
            }
          }
        }

        // ✅ Create step transitions
        for (const stepData of stageData.steps) {
          if (stepData.transitions && stepData.transitions.length > 0) {
            const fromStepId = stepIdMap.get(stepData.name);
            
            for (const transition of stepData.transitions) {
              // Find target step across all stages
              const toStep = stages.flatMap(s => s.steps).find(s => s.name === transition.toStepName);
              const toStepId = toStep ? allStepIdMaps.get(toStep.name) : null;
              
              if (fromStepId && toStepId) {
                await tx.flowTransition.create({
                  data: {
                    fromStepId,
                    toStepId,
                    condition: transition.condition,
                  },
                });
              }
            }
          }
        }
      }

      // ✅ Create stage transitions
      for (const stageData of stages) {
        if (stageData.transitions && stageData.transitions.length > 0) {
          const fromStageId = stageIdMap.get(stageData.name);
          
          for (const transition of stageData.transitions) {
            const toStage = stages.find(s => s.name === transition.toStageName);
            const toStageId = toStage ? stageIdMap.get(toStage.name) : null;
            
            if (fromStageId && toStageId) {
              const transitionId = `stageTrans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              await tx.stageTransition.create({
                data: {
                  id: transitionId,
                  fromStageId,
                  toStageId,
                  condition: transition.condition,
                },
              });
            }
          }
        }
      }

      return updatedFlowChain;
    });

    // Fetch complete updated flowchain
    const completeFlowChain = await prisma.flowChain.findUnique({
      where: { id: flowChainId },
      include: {
        stages: {
          orderBy: { order: 'asc' },
          include: {
            steps: {
              orderBy: { orderInStage: 'asc' },
              include: {
                assignedRoles: {
                  include: { role: true },
                },
                nextSteps: {
                  include: { toStep: true },
                },
              },
            },
            transitionsFrom: {
              include: { toStage: true },
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
      { 
        error: 'Internal server error', 
        details: process.env.NODE_ENV === 'development' ? error.message : undefined 
      },
      { status: 500 }
    );
  }
}
