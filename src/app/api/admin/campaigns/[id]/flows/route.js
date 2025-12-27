import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { verifyJWT, requireAdmin } from '@/app/lib/auth';


// GET - Fetch all flows for a campaign
export async function GET(request, { params }) {
  try {
    const { employee, error, status } = await verifyJWT(request);
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    const { id: campaignId } = await params;

    if (!campaignId || typeof campaignId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid campaign ID' },
        { status: 400 }
      );
    }

    // Verify campaign exists
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { 
        companyId: true,
        name: true,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    if (employee.companyId !== campaign.companyId) {
      return NextResponse.json(
        { error: 'Forbidden - Access denied to this campaign' },
        { status: 403 }
      );
    }

    const adminError = requireAdmin(employee);
    if (adminError) {
      return NextResponse.json(
        { error: adminError.error },
        { status: adminError.status }
      );
    }

    // ✅ Fetch campaign flows with FULL advanced workflow structure
    const campaignFlows = await prisma.campaignFlow.findMany({
      where: { campaignId },
      include: {
        flowChain: {
          include: {
            // ✅ Include stages (new)
            stages: {
              orderBy: { order: 'asc' },
              include: {
                steps: {
                  orderBy: { orderInStage: 'asc' },
                  include: {
                    role: { select: { id: true, name: true } }, // Legacy single role
                    assignedRoles: { // ✅ Multi-role support (new)
                      include: {
                        role: { select: { id: true, name: true } },
                      },
                    },
                    nextSteps: {
                      include: {
                        toStep: { select: { id: true, name: true } },
                      },
                    },
                  },
                },
                transitionsFrom: { // ✅ Stage transitions (new)
                  include: {
                    toStage: { select: { id: true, name: true, order: true } },
                  },
                },
              },
            },
            // ✅ Also include steps at chain level for backward compatibility
            steps: {
              orderBy: { createdAt: 'asc' },
              include: {
                role: { select: { id: true, name: true } },
                assignedRoles: {
                  include: {
                    role: { select: { id: true, name: true } },
                  },
                },
                nextSteps: {
                  include: {
                    toStep: { select: { id: true, name: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // ✅ Transform response with new structure
    const flows = campaignFlows.map(cf => ({
      id: cf.id,
      isDefault: cf.isDefault,
      flowChain: {
        id: cf.flowChain.id,
        name: cf.flowChain.name,
        description: cf.flowChain.description,
        
        // ✅ Stage-based structure (new)
        stages: cf.flowChain.stages.map(stage => ({
          id: stage.id,
          name: stage.name,
          order: stage.order,
          executionMode: stage.executionMode,
          steps: stage.steps.map(step => ({
            id: step.id,
            name: step.name,
            description: step.description,
            orderInStage: step.orderInStage,
            approvalPolicy: step.approvalPolicy, // ✅ New
            
            // ✅ Multi-role support
            assignedRoles: step.assignedRoles.map(ar => ({
              roleId: ar.roleId,
              roleName: ar.role.name,
              required: ar.required,
            })),
            
            // Legacy single role (for backward compatibility)
            role: step.role,
            
            // Step transitions
            transitions: step.nextSteps.map(t => ({
              id: t.id,
              condition: t.condition,
              toStep: t.toStep,
            })),
          })),
          
          // ✅ Stage transitions
          transitions: stage.transitionsFrom.map(t => ({
            id: t.id,
            condition: t.condition,
            toStage: t.toStage,
          })),
        })),
        
        // Legacy flat steps list (for backward compatibility)
        steps: cf.flowChain.steps.map(step => ({
          id: step.id,
          name: step.name,
          description: step.description,
          role: step.role,
          assignedRoles: step.assignedRoles.map(ar => ({
            roleId: ar.roleId,
            roleName: ar.role.name,
            required: ar.required,
          })),
          approvalPolicy: step.approvalPolicy,
          transitions: step.nextSteps.map(t => ({
            id: t.id,
            condition: t.condition,
            toStep: t.toStep,
          })),
        })),
        
        totalSteps: cf.flowChain.steps.length,
        totalStages: cf.flowChain.stages.length, // ✅ New
        createdAt: cf.flowChain.createdAt,
        updatedAt: cf.flowChain.updatedAt,
      },
      createdAt: cf.createdAt,
      updatedAt: cf.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        campaignId: campaignId,
        campaignName: campaign.name,
        totalFlows: flows.length,
        defaultFlow: flows.find(f => f.isDefault) || null,
        flows: flows,
      },
    });

  } catch (error) {
    console.error('Error fetching campaign flows:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined 
      },
      { status: 500 }
    );
  }
}

// POST - Link an existing flowchain to this campaign
export async function POST(request, { params }) {
  try {
    const { employee, error, status } = await verifyJWT(request);
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    const { id: campaignId } = await params;
    const body = await request.json();
    const { flowChainId, isDefault } = body;

    console.log('🔗 POST /api/campaigns/[id]/flows', { campaignId, flowChainId, isDefault });

    if (!campaignId || typeof campaignId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid campaign ID' },
        { status: 400 }
      );
    }

    if (!flowChainId) {
      return NextResponse.json(
        { error: 'FlowChain ID is required' },
        { status: 400 }
      );
    }

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
        { error: 'Forbidden - Access denied to this campaign' },
        { status: 403 }
      );
    }

    const adminError = requireAdmin(employee);
    if (adminError) {
      return NextResponse.json(
        { error: adminError.error },
        { status: adminError.status }
      );
    }

    // Verify flowchain exists and belongs to same company
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

    if (flowChain.companyId !== campaign.companyId) {
      return NextResponse.json(
        { error: 'FlowChain does not belong to this company' },
        { status: 400 }
      );
    }

    // Check if already assigned
    const existing = await prisma.campaignFlow.findFirst({
      where: {
        campaignId,
        flowChainId,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'FlowChain already assigned to this campaign' },
        { status: 409 }
      );
    }

    // If setting as default, unset other defaults first
    if (isDefault === true) {
      await prisma.campaignFlow.updateMany({
        where: { campaignId },
        data: { isDefault: false },
      });
    }

    // Create the campaign flow assignment
    const campaignFlow = await prisma.campaignFlow.create({
      data: {
        campaignId,
        flowChainId,
        isDefault: isDefault || false,
      },
      include: {
        flowChain: {
          include: {
            stages: {
              orderBy: { order: 'asc' },
              include: {
                steps: {
                  orderBy: { orderInStage: 'asc' },
                  include: {
                    role: true,
                    assignedRoles: {
                      include: { role: true },
                    },
                  },
                },
              },
            },
            steps: {
              include: {
                role: true,
                assignedRoles: {
                  include: { role: true },
                },
                nextSteps: {
                  include: { toStep: true },
                },
              },
            },
          },
        },
      },
    });

    console.log('✅ Campaign flow created:', campaignFlow.id);


    return NextResponse.json({
      success: true,
      data: campaignFlow,
      message: 'FlowChain linked to campaign successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Error adding campaign flow:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined 
      },
      { status: 500 }
    );
  }
}
