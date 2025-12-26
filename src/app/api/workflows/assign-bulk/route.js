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

    const firstStep = flowChain.steps[0];

    // Get all assets of the specified type in the campaign
    let assets = [];

    if (assetType === 'VIDEO') {
      assets = await prisma.video.findMany({
        where: {
          campaignId: campaignId,
          status: 'ready'
        },
        select: { id: true, title: true }
      });
    } else if (assetType === 'DOCUMENT') {
      assets = await prisma.document.findMany({
        where: {
          campaignId: campaignId,
          documentType: { not: 'IMAGE' },
          status: 'ready'
        },
        select: { id: true, title: true }
      });
    } else if (assetType === 'IMAGE') {
      assets = await prisma.document.findMany({
        where: {
          campaignId: campaignId,
          documentType: 'IMAGE',
          status: 'ready'
        },
        select: { id: true, title: true }
      });
    }

    if (assets.length === 0) {
      return NextResponse.json(
        { success: false, error: `No ${assetType.toLowerCase()}s found in this campaign` },
        { status: 404 }
      );
    }

    const assetIds = assets.map(a => a.id);

    // Get existing workflow states for these assets
    const existingWorkflows = await prisma.assetWorkflowState.findMany({
      where: {
        assetId: { in: assetIds },
        assetType: assetType
      },
      select: { id: true, assetId: true, currentStepId: true }
    });

    const existingWorkflowMap = new Map(
      existingWorkflows.map(w => [w.assetId, w])
    );

    let updatedCount = 0;
    let createdCount = 0;

    // Process each asset
    for (const asset of assets) {
      const existingWorkflow = existingWorkflowMap.get(asset.id);

      if (existingWorkflow) {
        // Update existing workflow
        await prisma.assetWorkflowState.update({
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
          }
        });

        // ✅ Log reassignment with connect
        await prisma.assetWorkflowHistory.create({
          data: {
            workflowState: {
              connect: { id: existingWorkflow.id }
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
            comment: `Bulk assignment: Workflow changed to ${flowChain.name}`
          }
        });

        updatedCount++;
      } else {
        // Create new workflow state
        const newWorkflowState = await prisma.assetWorkflowState.create({
          data: {
            assetId: asset.id,
            assetType: assetType,
            flowChainId: flowChainId,
            currentStepId: firstStep.id,
            assignedToRoleId: firstStep.roleId,
            status: 'in_progress',
            campaignId: campaignId,
            startedAt: new Date()
          }
        });

        // ✅ Log workflow start with connect
        await prisma.assetWorkflowHistory.create({
          data: {
            workflowState: {
              connect: { id: newWorkflowState.id }
            },
            action: 'WORKFLOW_STARTED',
            actor: {
              connect: { id: user.id }
            },
            toStep: {
              connect: { id: firstStep.id }
            },
            comment: `Bulk assignment: Workflow ${flowChain.name} started`
          }
        });

        createdCount++;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        campaignId,
        assetType,
        flowChain: {
          id: flowChain.id,
          name: flowChain.name
        },
        totalAssets: assets.length,
        created: createdCount,
        updated: updatedCount
      },
      message: `Successfully assigned workflow to ${assets.length} ${assetType.toLowerCase()}(s)`
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
