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
    const { name, description, companyId, stages } = body;

    // ============ VALIDATION ============
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

    if (!stages || stages.length === 0) {
      return NextResponse.json(
        { error: 'At least one stage is required' },
        { status: 400 }
      );
    }

    // Validate stages have steps
    const stagesWithoutSteps = stages.filter(s => !s.steps || s.steps.length === 0);
    if (stagesWithoutSteps.length > 0) {
      return NextResponse.json(
        { error: 'All stages must have at least one step' },
        { status: 400 }
      );
    }

    // ============ CREATE FLOWCHAIN ============
    const flowChain = await prisma.flowChain.create({
      data: {
        name,
        description,
        companyId,
      },
    });

    console.log('✅ FlowChain created:', flowChain.id);

    // ============ CREATE STAGES ============
    const createdStages = [];
    for (const stage of stages) {
      const createdStage = await prisma.flowStage.create({
        data: {
          id: `stage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          chainId: flowChain.id,
          name: stage.name,
          order: stage.order,
          executionMode: stage.executionMode || 'SEQUENTIAL',
        },
      });
      createdStages.push({ original: stage, created: createdStage });
    }

    console.log('✅ Created', createdStages.length, 'stages');

    // ============ CREATE STEPS & ROLES ============
    const stepIdMap = new Map(); // Map temp step IDs to real database IDs

    for (const stageData of createdStages) {
      const { original: originalStage, created: createdStage } = stageData;

      for (const step of originalStage.steps) {
        // Create step
        const createdStep = await prisma.flowStep.create({
          data: {
            name: step.name,
            description: step.description || null,
            chainId: flowChain.id,
            stageId: createdStage.id,
            roleId: step.assignedRoles?.[0]?.roleId || null, // Legacy single role support
            orderInStage: step.orderInStage,
            approvalPolicy: step.approvalPolicy || 'ALL_MUST_APPROVE',
          },
        });

        // Map temp step ID (from frontend) to real database ID
        if (step.id) {
          stepIdMap.set(step.id, createdStep.id);
        }

        // Create FlowStepRole entries for multi-role support
        if (step.assignedRoles && step.assignedRoles.length > 0) {
          const roleAssignments = step.assignedRoles.map(ar => ({
            id: `step_role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            stepId: createdStep.id,
            roleId: ar.roleId,
            required: ar.required !== undefined ? ar.required : true,
          }));

          await prisma.flowStepRole.createMany({
            data: roleAssignments,
          });

          console.log(`✅ Step "${step.name}" assigned to ${roleAssignments.length} role(s)`);
        }
      }
    }

    console.log('✅ Created steps with role assignments');

    // ============ CREATE STEP TRANSITIONS ============
    const stepTransitions = [];

    for (const stageData of createdStages) {
      const { original: originalStage } = stageData;

      for (const step of originalStage.steps) {
        if (step.transitions && step.transitions.length > 0) {
          for (const transition of step.transitions) {
            const fromStepId = stepIdMap.get(step.id);
            const toStepId = stepIdMap.get(transition.toStepId);

            if (fromStepId && toStepId) {
              stepTransitions.push({
                fromStepId,
                toStepId,
                condition: transition.condition || 'SUCCESS',
                fromStageId: null, // Step-level transition
                toStageId: null,
              });
            } else {
              console.warn('⚠️ Could not resolve step IDs for transition:', {
                from: step.id,
                to: transition.toStepId,
              });
            }
          }
        }
      }
    }

    if (stepTransitions.length > 0) {
      await prisma.flowTransition.createMany({
        data: stepTransitions,
      });
      console.log('✅ Created', stepTransitions.length, 'step transitions');
    }

    // ============ CREATE STAGE TRANSITIONS ============
    const stageTransitions = [];
    const stageIdMap = new Map();
    
    createdStages.forEach(sd => {
      stageIdMap.set(sd.original.id, sd.created.id);
    });

    for (const stageData of createdStages) {
      const { original: originalStage, created: createdStage } = stageData;

      if (originalStage.transitions && originalStage.transitions.length > 0) {
        for (const transition of originalStage.transitions) {
          const toStageId = stageIdMap.get(transition.toStageId);

          if (toStageId) {
            stageTransitions.push({
              id: `stage_trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              fromStageId: createdStage.id,
              toStageId,
              condition: transition.condition || 'all_approved',
            });
          }
        }
      }
    }

    if (stageTransitions.length > 0) {
      await prisma.stageTransition.createMany({
        data: stageTransitions,
      });
      console.log('✅ Created', stageTransitions.length, 'stage transitions');
    }

    // ============ FETCH COMPLETE FLOWCHAIN ============
    const completeFlowChain = await prisma.flowChain.findUnique({
      where: { id: flowChain.id },
      include: {
        stages: {
          orderBy: { order: 'asc' },
          include: {
            steps: {
              orderBy: { orderInStage: 'asc' },
              include: {
                role: true,
                assignedRoles: {
                  include: {
                    role: true,
                  },
                },
                nextSteps: {
                  include: {
                    toStep: true,
                  },
                },
              },
            },
            transitionsFrom: {
              include: {
                toStage: true,
              },
            },
          },
        },
        steps: {
          include: {
            role: true,
            assignedRoles: {
              include: {
                role: true,
              },
            },
          },
        },
      },
    });

    console.log('✅ FlowChain creation complete');


    return NextResponse.json({
      success: true,
      data: completeFlowChain,
      message: 'Advanced workflow created successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Error creating flowchain:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
