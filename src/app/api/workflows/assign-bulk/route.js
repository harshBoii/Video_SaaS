// src/app/api/workflows/bulk-assign/route.js

import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { verifyJWT } from '@/app/lib/auth';

export async function POST(request) {
  try {
    const { employee: user, error: authError } = await verifyJWT(request);
    if (authError) {
      return NextResponse.json({ success: false, error: authError }, { status: 401 });
    }

    const body = await request.json();
    const { campaignId, assetType, flowChainId } = body;

    // Validate required fields
    if (!campaignId || !assetType || !flowChainId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: campaignId, assetType, flowChainId' },
        { status: 400 }
      );
    }

    // Validate asset type
    if (!['VIDEO', 'DOCUMENT'].includes(assetType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid asset type. Must be VIDEO or DOCUMENT' },
        { status: 400 }
      );
    }

    // ✅ Get the flowchain with stages and steps (NEW SCHEMA)
    const flowChain = await prisma.flowChain.findUnique({
      where: { id: flowChainId },
      include: {
        stages: {
          orderBy: { order: 'asc' },
          include: {
            steps: {
              orderBy: { orderInStage: 'asc' },
              include: {
                assignedRoles: {
                  include: {
                    role: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!flowChain) {
      return NextResponse.json(
        { success: false, error: 'Flowchain not found' },
        { status: 404 }
      );
    }

    if (flowChain.stages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Flowchain has no stages defined' },
        { status: 400 }
      );
    }

    // ✅ Get first stage and first step
    const firstStage = flowChain.stages[0];
    const firstStep = firstStage.steps[0];

    if (!firstStep) {
      return NextResponse.json(
        { success: false, error: 'First stage has no steps defined' },
        { status: 400 }
      );
    }

    // ✅ Get all assets of the specified type in the campaign
    let assets = [];

    if (assetType === 'VIDEO') {
      assets = await prisma.video.findMany({
        where: {
          campaignId: campaignId
        },
        select: { id: true, title: true, workflowStatus: true }
      });
    } else if (assetType === 'DOCUMENT') {
      assets = await prisma.document.findMany({
        where: {
          campaignId: campaignId
        },
        select: { id: true, title: true, workflowStatus: true }
      });
    }

    if (assets.length === 0) {
      return NextResponse.json(
        { success: false, error: `No ${assetType.toLowerCase()}s found in this campaign` },
        { status: 404 }
      );
    }

    const assetIds = assets.map(a => a.id);

    // ✅ Get existing workflow states for these assets
    const existingWorkflows = await prisma.assetWorkflowState.findMany({
      where: {
        assetId: { in: assetIds },
        assetType: assetType
      },
      include: {
        activeSteps: true
      }
    });

    const existingWorkflowMap = new Map(
      existingWorkflows.map(w => [w.assetId, w])
    );

    let updatedCount = 0;
    let createdCount = 0;
    const errors = [];

    // ✅ Process each asset in a transaction-friendly way
    for (const asset of assets) {
      try {
        const existingWorkflow = existingWorkflowMap.get(asset.id);

        if (existingWorkflow) {
          // ✅ Delete old active steps
          await prisma.assetActiveStep.deleteMany({
            where: { workflowStateId: existingWorkflow.id }
          });

          // ✅ Update existing workflow
          await prisma.assetWorkflowState.update({
            where: { id: existingWorkflow.id },
            data: {
              flowChainId: flowChainId,
              currentStepId: firstStep.id,
              assignedToRoleId: firstStep.assignedRoles[0]?.roleId || null,
              assignedToEmployeeId: null,
              status: 'UNDER_REVIEW',
              startedAt: new Date(),
              completedAt: null,
              updatedAt: new Date()
            }
          });

          // ✅ Create new active step
          await prisma.assetActiveStep.create({
            data: {
              id: `activeStep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              workflowStateId: existingWorkflow.id,
              stepId: firstStep.id,
              status: 'IN_PROGRESS',
              startedAt: new Date()
            }
          });

          // ✅ Update asset workflow status
          if (assetType === 'VIDEO') {
            await prisma.video.update({
              where: { id: asset.id },
              data: { workflowStatus: 'UNDER_REVIEW' }
            });
          } else {
            await prisma.document.update({
              where: { id: asset.id },
              data: { workflowStatus: 'UNDER_REVIEW' }
            });
          }

          // ✅ Log reassignment
          await prisma.assetWorkflowHistory.create({
            data: {
              workflowStateId: existingWorkflow.id,
              fromStepId: existingWorkflow.currentStepId,
              toStepId: firstStep.id,
              action: 'workflow_reassigned',
              actionBy: user.id,
              comment: `Bulk assignment: Workflow changed to ${flowChain.name}`
            }
          });

          updatedCount++;

        } else {
          // ✅ Create new workflow state
          const newWorkflowState = await prisma.assetWorkflowState.create({
            data: {
              id: `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              assetId: asset.id,
              assetType: assetType,
              flowChainId: flowChainId,
              currentStepId: firstStep.id,
              assignedToRoleId: firstStep.assignedRoles[0]?.roleId || null,
              status: 'UNDER_REVIEW',
              campaignId: campaignId,
              startedAt: new Date()
            }
          });

          // ✅ Create initial active step
          await prisma.assetActiveStep.create({
            data: {
              id: `activeStep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              workflowStateId: newWorkflowState.id,
              stepId: firstStep.id,
              status: 'IN_PROGRESS',
              startedAt: new Date()
            }
          });

          // ✅ Update asset workflow status
          if (assetType === 'VIDEO') {
            await prisma.video.update({
              where: { id: asset.id },
              data: { workflowStatus: 'UNDER_REVIEW' }
            });
          } else {
            await prisma.document.update({
              where: { id: asset.id },
              data: { workflowStatus: 'UNDER_REVIEW' }
            });
          }

          // ✅ Log workflow start
          await prisma.assetWorkflowHistory.create({
            data: {
              workflowStateId: newWorkflowState.id,
              toStepId: firstStep.id,
              action: 'workflow_started',
              actionBy: user.id,
              comment: `Bulk assignment: Workflow ${flowChain.name} started`
            }
          });

          createdCount++;
        }

      } catch (assetError) {
        console.error(`Error processing asset ${asset.id}:`, assetError);
        errors.push({
          assetId: asset.id,
          assetTitle: asset.title,
          error: assetError.message
        });
      }
    }

    // ✅ Return comprehensive summary
    return NextResponse.json({
      success: true,
      data: {
        campaignId,
        assetType,
        flowChain: {
          id: flowChain.id,
          name: flowChain.name,
          description: flowChain.description
        },
        currentStage: {
          id: firstStage.id,
          name: firstStage.name,
          order: firstStage.order
        },
        currentStep: {
          id: firstStep.id,
          name: firstStep.name,
          orderInStage: firstStep.orderInStage
        },
        summary: {
          totalAssets: assets.length,
          created: createdCount,
          updated: updatedCount,
          failed: errors.length,
          successful: createdCount + updatedCount
        },
        errors: errors.length > 0 ? errors : undefined
      },
      message: `Successfully assigned workflow to ${createdCount + updatedCount} of ${assets.length} ${assetType.toLowerCase()}(s)`
    });

  } catch (error) {
    console.error('❌ [WORKFLOW BULK ASSIGN ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to bulk assign workflow',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
