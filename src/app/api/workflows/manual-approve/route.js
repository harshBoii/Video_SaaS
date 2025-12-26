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
    const { assetId, assetType, workflowId, targetStepId, reason } = body;

    // Validate required fields
    if (!assetId || !assetType || !workflowId || !targetStepId || !reason) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: assetId, assetType, workflowId, targetStepId, reason' },
        { status: 400 }
      );
    }

    if (!reason.trim()) {
      return NextResponse.json(
        { success: false, error: 'Reason cannot be empty' },
        { status: 400 }
      );
    }

    // Get the workflow state
    const workflowState = await prisma.assetWorkflowState.findUnique({
      where: { id: workflowId },
      include: {
        currentStep: true,
        flowChain: {
          include: {
            steps: {
              orderBy: { createdAt: 'asc' }
            }
          }
        }
      }
    });

    if (!workflowState) {
      return NextResponse.json(
        { success: false, error: 'Workflow not found' },
        { status: 404 }
      );
    }

    // Verify asset matches
    if (workflowState.assetId !== assetId || workflowState.assetType !== assetType) {
      return NextResponse.json(
        { success: false, error: 'Asset and workflow mismatch' },
        { status: 400 }
      );
    }

    // Get the target step
    const targetStep = await prisma.flowStep.findUnique({
      where: { id: targetStepId },
      include: { role: true }
    });

    if (!targetStep) {
      return NextResponse.json(
        { success: false, error: 'Target step not found' },
        { status: 404 }
      );
    }

    // Verify target step belongs to the same flowchain
    if (targetStep.chainId !== workflowState.flowChainId) {
      return NextResponse.json(
        { success: false, error: 'Target step does not belong to this workflow' },
        { status: 400 }
      );
    }

    // Verify target step is after current step
    const currentStepIndex = workflowState.flowChain.steps.findIndex(
      s => s.id === workflowState.currentStepId
    );
    const targetStepIndex = workflowState.flowChain.steps.findIndex(
      s => s.id === targetStepId
    );

    if (targetStepIndex <= currentStepIndex) {
      return NextResponse.json(
        { success: false, error: 'Target step must be after current step' },
        { status: 400 }
      );
    }

    // Check if it's the last step
    const isLastStep = targetStepIndex === workflowState.flowChain.steps.length - 1;

    // Update workflow state
    const updatedWorkflowState = await prisma.assetWorkflowState.update({
      where: { id: workflowId },
      data: {
        currentStepId: targetStepId,
        assignedToRoleId: targetStep.roleId,
        assignedToEmployeeId: null,
        status: isLastStep ? 'completed' : 'in_progress',
        completedAt: isLastStep ? new Date() : null,
        updatedAt: new Date()
      },
      include: {
        currentStep: true,
        flowChain: true,
        assignedToRole: true
      }
    });

    // ✅ Log manual approval in workflow history with connect
    await prisma.assetWorkflowHistory.create({
      data: {
        workflowState: {
          connect: { id: workflowState.id }
        },
        action: 'MANUAL_APPROVAL',
        actor: {
          connect: { id: user.id }
        },
        fromStep: {
          connect: { id: workflowState.currentStepId }
        },
        toStep: {
          connect: { id: targetStepId }
        },
        comment: `Manual approval: ${reason}`
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedWorkflowState.id,
        assetId: updatedWorkflowState.assetId,
        assetType: updatedWorkflowState.assetType,
        status: updatedWorkflowState.status,
        previousStep: {
          id: workflowState.currentStep.id,
          name: workflowState.currentStep.name
        },
        currentStep: {
          id: updatedWorkflowState.currentStep.id,
          name: updatedWorkflowState.currentStep.name
        },
        assignedToRole: updatedWorkflowState.assignedToRole ? {
          id: updatedWorkflowState.assignedToRole.id,
          name: updatedWorkflowState.assignedToRole.name
        } : null,
        completedAt: updatedWorkflowState.completedAt
      },
      message: isLastStep 
        ? 'Workflow completed successfully' 
        : `Asset advanced to ${targetStep.name}`
    });

  } catch (error) {
    console.error('❌ [MANUAL APPROVAL ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to approve workflow',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
