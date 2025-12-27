import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { verifyJWT } from '@/app/lib/auth';

// GET - Fetch single flowchain with all details
// GET - Fetch single flowchain with all details
export async function GET(request, { params }) {
  try {
    const { employee, error, status } = await verifyJWT(request);
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    const flowChain = await prisma.flowChain.findUnique({
      where: { id },
      include: {
        // ✅ Include stages with full structure
        stages: {
          orderBy: { order: 'asc' },
          include: {
            steps: {
              orderBy: { orderInStage: 'asc' },
              include: {
                role: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                assignedRoles: {
                  include: {
                    role: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
                nextSteps: {
                  include: {
                    toStep: {
                      select: {
                        id: true,
                        name: true,
                        // ❌ Remove these - they don't exist
                        // action: true,
                        // assetType: true,
                      },
                    },
                  },
                },
              },
            },
            transitionsFrom: {
              include: {
                toStage: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        // ✅ Also include flat steps for backward compatibility
        steps: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
              },
            },
            assignedRoles: {
              include: {
                role: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
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

    // ✅ Helper to parse action/assetType from step name
    const parseStepMetadata = (stepName) => {
      // Default values
      let action = 'REVIEW';
      let assetType = 'VIDEO';
      
      // Try to parse from name like "Upload Videos" or "Review Images"
      const actions = ['UPLOAD', 'REVIEW', 'EDIT', 'PROCESS', 'ENHANCE', 'CUT', 'COLOR_GRADE', 'ADD_AUDIO', 'ADD_TEXT', 'PUBLISH', 'ARCHIVE'];
      const assetTypes = ['VIDEO', 'IMAGE', 'DOCUMENT', 'SCRIPT', 'ALL_ASSETS'];
      
      const upperName = stepName.toUpperCase();
      
      // Find action
      for (const a of actions) {
        if (upperName.includes(a.replace('_', ' ')) || upperName.startsWith(a)) {
          action = a;
          break;
        }
      }
      
      // Find asset type
      for (const at of assetTypes) {
        if (upperName.includes(at.replace('_', ' '))) {
          assetType = at;
          break;
        }
      }
      
      return { action, assetType };
    };

    // ✅ Transform response with stage-based structure
    const transformed = {
      id: flowChain.id,
      name: flowChain.name,
      description: flowChain.description,
      companyId: flowChain.companyId,
      // ✅ Return stages if they exist
      stages: flowChain.stages?.map(stage => ({
        id: stage.id,
        name: stage.name,
        order: stage.order,
        executionMode: stage.executionMode,
        steps: stage.steps.map(step => {
          const { action, assetType } = parseStepMetadata(step.name);
          return {
            id: step.id,
            name: step.name,
            description: step.description,
            action, // ✅ Parsed from name
            assetType, // ✅ Parsed from name
            orderInStage: step.orderInStage,
            approvalPolicy: step.approvalPolicy,
            roleId: step.roleId, // Legacy single role
            role: step.role, // Legacy single role object
            assignedRoles: step.assignedRoles.map(ar => ({
              roleId: ar.roleId,
              required: ar.required,
              role: ar.role,
            })),
            transitions: step.nextSteps.map(t => ({
              id: t.id,
              condition: t.condition,
              toStepId: t.toStepId,
              toStep: t.toStep,
            })),
          };
        }),
        transitions: stage.transitionsFrom.map(t => ({
          id: t.id,
          condition: t.condition,
          toStageId: t.toStageId,
          toStage: t.toStage,
        })),
      })) || [],
      // ✅ Keep flat steps for backward compatibility
      steps: flowChain.steps.map(step => {
        const { action, assetType } = parseStepMetadata(step.name);
        return {
          id: step.id,
          name: step.name,
          description: step.description,
          action, // ✅ Parsed from name
          assetType, // ✅ Parsed from name
          approvalPolicy: step.approvalPolicy,
          roleId: step.roleId,
          role: step.role,
          assignedRoles: step.assignedRoles?.map(ar => ({
            roleId: ar.roleId,
            required: ar.required,
            role: ar.role,
          })) || [],
          transitions: step.nextSteps.map(t => ({
            id: t.id,
            condition: t.condition,
            toStepId: t.toStepId,
            toStep: t.toStep,
          })),
        };
      }),
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
// PUT - Update flowchain with STAGE support (OPTIMIZED)
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

    // ✅ Prepare all data BEFORE transaction
    const stagesToCreate = [];
    const stepsToCreate = [];
    const roleAssignmentsToCreate = [];
    const stepTransitionsToCreate = [];
    const stageTransitionsToCreate = [];

    const stageIdMap = new Map();
    const stepIdMap = new Map();

    // Pre-generate all IDs and prepare data
    for (const stageData of stages) {
      const stageId = `stage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      stageIdMap.set(stageData.name, stageId);

      stagesToCreate.push({
        id: stageId,
        chainId: flowChainId,
        name: stageData.name,
        order: stageData.order,
        executionMode: stageData.executionMode,
      });

      for (const stepData of stageData.steps) {
        const stepId = `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        stepIdMap.set(stepData.name, stepId);

        stepsToCreate.push({
          id: stepId,
          name: stepData.name,
          description: stepData.description,
          orderInStage: stepData.orderInStage,
          approvalPolicy: stepData.approvalPolicy,
          stageId: stageId,
          chainId: flowChainId,
          roleId: null,
        });

        // Role assignments
        if (stepData.assignedRoles && stepData.assignedRoles.length > 0) {
          for (const ar of stepData.assignedRoles) {
            roleAssignmentsToCreate.push({
              id: `stepRole_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              stepId: stepId,
              roleId: ar.roleId,
              required: ar.required,
            });
          }
        }

        // Step transitions
        if (stepData.transitions && stepData.transitions.length > 0) {
          for (const transition of stepData.transitions) {
            const toStep = stages.flatMap(s => s.steps).find(s => s.name === transition.toStepName);
            if (toStep) {
              const toStepId = stepIdMap.get(toStep.name);
              if (toStepId) {
                stepTransitionsToCreate.push({
                  id: `stepTrans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  fromStepId: stepId,
                  toStepId: toStepId,
                  condition: transition.condition,
                });
              }
            }
          }
        }
      }

      // Stage transitions
      if (stageData.transitions && stageData.transitions.length > 0) {
        for (const transition of stageData.transitions) {
          const toStage = stages.find(s => s.name === transition.toStageName);
          if (toStage) {
            const toStageId = stageIdMap.get(toStage.name);
            if (toStageId) {
              stageTransitionsToCreate.push({
                id: `stageTrans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                fromStageId: stageId,
                toStageId: toStageId,
                condition: transition.condition,
              });
            }
          }
        }
      }
    }

    // ✅ Execute transaction with batch operations
    await prisma.$transaction(async (tx) => {
      // Update flowchain
      await tx.flowChain.update({
        where: { id: flowChainId },
        data: { name, description },
      });

      const existingStageIds = existingFlowChain.stages.map(s => s.id);

      if (existingStageIds.length > 0) {
        // Delete in order
        await tx.stageTransition.deleteMany({
          where: {
            OR: [
              { fromStageId: { in: existingStageIds } },
              { toStageId: { in: existingStageIds } }
            ]
          },
        });

        await tx.flowTransition.deleteMany({
          where: {
            fromStep: { stageId: { in: existingStageIds } }
          },
        });

        await tx.flowStepRole.deleteMany({
          where: {
            step: { stageId: { in: existingStageIds } }
          },
        });

        await tx.flowStep.deleteMany({
          where: { stageId: { in: existingStageIds } },
        });

        await tx.flowStage.deleteMany({
          where: { id: { in: existingStageIds } },
        });
      }

      // ✅ Batch create everything
      if (stagesToCreate.length > 0) {
        await tx.flowStage.createMany({ data: stagesToCreate });
      }

      if (stepsToCreate.length > 0) {
        await tx.flowStep.createMany({ data: stepsToCreate });
      }

      if (roleAssignmentsToCreate.length > 0) {
        await tx.flowStepRole.createMany({ data: roleAssignmentsToCreate });
      }

      if (stepTransitionsToCreate.length > 0) {
        await tx.flowTransition.createMany({ data: stepTransitionsToCreate });
      }

      if (stageTransitionsToCreate.length > 0) {
        await tx.stageTransition.createMany({ data: stageTransitionsToCreate });
      }
    }, {
      timeout: 30000, // 30 second timeout
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
