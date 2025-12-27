// src/app/api/workflows/assign/route.js

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
    const { assetId, assetType, flowChainId, campaignId } = body;

    // Validate required fields
    if (!assetId || !assetType || !flowChainId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: assetId, assetType, flowChainId' },
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

    // ✅ Get the first stage and first step
    const firstStage = flowChain.stages[0];
    const firstStep = firstStage.steps[0];

    if (!firstStep) {
      return NextResponse.json(
        { success: false, error: 'First stage has no steps defined' },
        { status: 400 }
      );
    }

    // Get the asset to verify it exists and get campaignId
    let asset;
    let assetCampaignId;

    if (assetType === 'VIDEO') {
      asset = await prisma.video.findUnique({
        where: { id: assetId },
        select: { id: true, campaignId: true, title: true }
      });
    } else if (assetType === 'DOCUMENT') {
      asset = await prisma.document.findUnique({
        where: { id: assetId },
        select: { id: true, campaignId: true, title: true, documentType: true }
      });
    }

    if (!asset) {
      return NextResponse.json(
        { success: false, error: `${assetType} not found` },
        { status: 404 }
      );
    }

    assetCampaignId = asset.campaignId || campaignId;

    if (!assetCampaignId) {
      return NextResponse.json(
        { success: false, error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    // ✅ Check if workflow already exists for this asset
    const existingWorkflow = await prisma.assetWorkflowState.findFirst({
      where: {
        assetId: assetId,
        assetType: assetType
      },
      include: {
        activeSteps: true
      }
    });

    let workflowState;

    if (existingWorkflow) {
      // ✅ Delete old active steps
      await prisma.assetActiveStep.deleteMany({
        where: { workflowStateId: existingWorkflow.id }
      });

      // ✅ Update existing workflow
      workflowState = await prisma.assetWorkflowState.update({
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
        },
        include: {
          currentStep: {
            include: {
              assignedRoles: {
                include: { role: true }
              },
              stage: true
            }
          },
          flowChain: true,
          assignedToRole: true
        }
      });

      // ✅ Create new active step
      await prisma.assetActiveStep.create({
        data: {
          id: `activeStep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          workflowStateId: workflowState.id,
          stepId: firstStep.id,
          status: 'IN_PROGRESS',
          startedAt: new Date()
        }
      });

      // ✅ Update asset workflow status
      if (assetType === 'VIDEO') {
        await prisma.video.update({
          where: { id: assetId },
          data: { workflowStatus: 'UNDER_REVIEW' }
        });
      } else if (assetType === 'DOCUMENT') {
        await prisma.document.update({
          where: { id: assetId },
          data: { workflowStatus: 'UNDER_REVIEW' }
        });
      }

      // ✅ Log workflow reassignment
      await prisma.assetWorkflowHistory.create({
        data: {
          workflowStateId: workflowState.id,
          fromStepId: existingWorkflow.currentStepId,
          toStepId: firstStep.id,
          action: 'workflow_reassigned',
          actionBy: user.id,
          comment: `Workflow changed to ${flowChain.name}`
        }
      });

    } else {
      // ✅ Create new workflow state
      workflowState = await prisma.assetWorkflowState.create({
        data: {
          id: `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          assetId: assetId,
          assetType: assetType,
          flowChainId: flowChainId,
          currentStepId: firstStep.id,
          assignedToRoleId: firstStep.assignedRoles[0]?.roleId || null,
          status: 'UNDER_REVIEW',
          campaignId: assetCampaignId,
          startedAt: new Date()
        },
        include: {
          currentStep: {
            include: {
              assignedRoles: {
                include: { role: true }
              },
              stage: true
            }
          },
          flowChain: true,
          assignedToRole: true
        }
      });

      // ✅ Create initial active step
      await prisma.assetActiveStep.create({
        data: {
          id: `activeStep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          workflowStateId: workflowState.id,
          stepId: firstStep.id,
          status: 'IN_PROGRESS',
          startedAt: new Date()
        }
      });

      // ✅ Update asset workflow status
      if (assetType === 'VIDEO') {
        await prisma.video.update({
          where: { id: assetId },
          data: { workflowStatus: 'UNDER_REVIEW' }
        });
      } else if (assetType === 'DOCUMENT') {
        await prisma.document.update({
          where: { id: assetId },
          data: { workflowStatus: 'UNDER_REVIEW' }
        });
      }

      // ✅ Log workflow start
      await prisma.assetWorkflowHistory.create({
        data: {
          workflowStateId: workflowState.id,
          toStepId: firstStep.id,
          action: 'workflow_started',
          actionBy: user.id,
          comment: `Workflow ${flowChain.name} started at ${firstStep.name}`
        }
      });
    }

    // ✅ Return comprehensive response
    return NextResponse.json({
      success: true,
      message: `Workflow assigned successfully to ${assetType.toLowerCase()}`,
      data: {
        workflowStateId: workflowState.id,
        assetId: workflowState.assetId,
        assetType: workflowState.assetType,
        flowChain: {
          id: workflowState.flowChain.id,
          name: workflowState.flowChain.name,
          description: workflowState.flowChain.description
        },
        currentStage: {
          id: workflowState.currentStep.stage.id,
          name: workflowState.currentStep.stage.name,
          order: workflowState.currentStep.stage.order
        },
        currentStep: {
          id: workflowState.currentStep.id,
          name: workflowState.currentStep.name,
          orderInStage: workflowState.currentStep.orderInStage,
          approvalPolicy: workflowState.currentStep.approvalPolicy
        },
        assignedToRole: workflowState.assignedToRole ? {
          id: workflowState.assignedToRole.id,
          name: workflowState.assignedToRole.name
        } : null,
        assignedRoles: workflowState.currentStep.assignedRoles.map(ar => ({
          roleId: ar.roleId,
          roleName: ar.role.name,
          required: ar.required
        })),
        status: workflowState.status,
        startedAt: workflowState.startedAt
      }
    });

  } catch (error) {
    console.error('❌ [WORKFLOW ASSIGN ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to assign workflow',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
