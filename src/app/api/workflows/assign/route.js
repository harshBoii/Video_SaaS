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
    const { assetId, assetType, flowChainId } = body;

    // Validate required fields
    if (!assetId || !assetType || !flowChainId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: assetId, assetType, flowChainId' },
        { status: 400 }
      );
    }

    // Validate asset type
    if (!['VIDEO', 'DOCUMENT', 'IMAGE'].includes(assetType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid asset type. Must be VIDEO, DOCUMENT, or IMAGE' },
        { status: 400 }
      );
    }

    // Get the flowchain with its steps
    const flowChain = await prisma.flowChain.findUnique({
      where: { id: flowChainId },
      include: {
        steps: {
          orderBy: { createdAt: 'asc' },
          include: {
            role: true
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

    if (flowChain.steps.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Flowchain has no steps defined' },
        { status: 400 }
      );
    }

    // Get the first step
    const firstStep = flowChain.steps[0];

    // Get the asset to verify it exists and get campaignId
    let asset;
    let campaignId;

    if (assetType === 'VIDEO') {
      asset = await prisma.video.findUnique({
        where: { id: assetId },
        select: { id: true, campaignId: true, title: true }
      });
    } else if (assetType === 'DOCUMENT' || assetType === 'IMAGE') {
      asset = await prisma.document.findUnique({
        where: { id: assetId },
        select: { id: true, campaignId: true, title: true, documentType: true }
      });
      
      // Verify documentType matches assetType for images
      if (assetType === 'IMAGE' && asset?.documentType !== 'IMAGE') {
        return NextResponse.json(
          { success: false, error: 'Asset is not an image' },
          { status: 400 }
        );
      }
    }

    if (!asset) {
      return NextResponse.json(
        { success: false, error: `${assetType} not found` },
        { status: 404 }
      );
    }

    campaignId = asset.campaignId;

    // Check if workflow already exists for this asset
    const existingWorkflow = await prisma.assetWorkflowState.findFirst({
      where: {
        assetId: assetId,
        assetType: assetType
      }
    });

    let workflowState;

    if (existingWorkflow) {
      // Update existing workflow
      workflowState = await prisma.assetWorkflowState.update({
        where: { id: existingWorkflow.id },
        data: {
          flowChainId: flowChainId,
          currentStepId: firstStep.id,
          assignedToRoleId: firstStep.roleId,
          assignedToEmployeeId: null,
          status: 'in_progress',
          startedAt: new Date(),
          completedAt: null,
          updatedAt: new Date()
        },
        include: {
          currentStep: true,
          flowChain: true,
          assignedToRole: true
        }
      });

      // ✅ Log workflow reassignment with connect
      await prisma.assetWorkflowHistory.create({
        data: {
          workflowState: {
            connect: { id: workflowState.id }
          },
          action: 'WORKFLOW_REASSIGNED',
          actor: {
            connect: { id: user.id }
          },
          fromStep: existingWorkflow.currentStepId ? {
            connect: { id: existingWorkflow.currentStepId }
          } : undefined,
          toStep: {
            connect: { id: firstStep.id }
          },
          comment: `Workflow changed to ${flowChain.name}`
        }
      });

    } else {
      // Create new workflow state
      workflowState = await prisma.assetWorkflowState.create({
        data: {
          assetId: assetId,
          assetType: assetType,
          flowChainId: flowChainId,
          currentStepId: firstStep.id,
          assignedToRoleId: firstStep.roleId,
          status: 'in_progress',
          campaignId: campaignId,
          startedAt: new Date()
        },
        include: {
          currentStep: true,
          flowChain: true,
          assignedToRole: true
        }
      });

      // ✅ Log workflow start with connect
      await prisma.assetWorkflowHistory.create({
        data: {
          workflowState: {
            connect: { id: workflowState.id }
          },
          action: 'WORKFLOW_STARTED',
          actor: {
            connect: { id: user.id }
          },
          toStep: {
            connect: { id: firstStep.id }
          },
          comment: `Workflow ${flowChain.name} started`
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: workflowState.id,
        assetId: workflowState.assetId,
        assetType: workflowState.assetType,
        flowChain: {
          id: workflowState.flowChain.id,
          name: workflowState.flowChain.name
        },
        currentStep: {
          id: workflowState.currentStep.id,
          name: workflowState.currentStep.name
        },
        assignedToRole: workflowState.assignedToRole ? {
          id: workflowState.assignedToRole.id,
          name: workflowState.assignedToRole.name
        } : null,
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
