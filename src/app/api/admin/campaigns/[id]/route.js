//cacheable but too much invalidation
import prisma from "@/app/lib/prisma";
import { NextResponse } from "next/server";
import { verifyJWT, requireAdmin } from '@/app/lib/auth';
import { string } from "zod";

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, adminId, teamId, status } = body;

    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing)
      return NextResponse.json({ success: false, message: "Campaign not found." }, { status: 404 });

    const updated = await prisma.campaign.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(adminId && { adminId }),
        ...(teamId && { teamId }),
        ...(status && { status }),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        admin: { select: { firstName: true, lastName: true } },
        team: { select: { name: true } },
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("Campaign PUT error:", err);
    return NextResponse.json({ success: false, message: "Failed to update campaign." }, { status: 500 });
  }
}
export async function GET(request, { params }) {
  try {
    const { employee, error, status } = await verifyJWT(request);
    if (error) {
      return NextResponse.json({ error }, { status });
    }

    const { id: campaignId } = await params;

    if (!campaignId || typeof campaignId !== 'string') {
      return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 });
    }

    // ✅ Fetch campaign with all necessary data
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        company: {
          select: { id: true, name: true, domain: true },
        },
        admin: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        team: {
          select: {
            id: true,
            name: true,
            members: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
        assignments: {
          include: {
            employee: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
            role: {
              select: { id: true, name: true },
            },
          },
        },
        flows: {
          include: {
            flowChain: {
              include: {
                stages: {
                  orderBy: { order: 'asc' },
                  include: {
                    steps: {
                      orderBy: { orderInStage: 'asc' },
                      include: {
                        assignedRoles: {
                          include: {
                            role: {
                              select: { id: true, name: true },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        schedules: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
          },
        },
        videos: {
          select: {
            id: true,
            title: true,
            filename: true,
            thumbnailUrl: true,
            duration: true,
            status: true,
            workflowStatus: true,
            uploadedBy: true,
            uploader: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            createdAt: true,
            updatedAt: true,
          },
        },
        documents: {
          select: {
            id: true,
            title: true,
            filename: true,
            thumbnailUrl: true,
            documentType: true,
            fileSize: true, // BigInt - needs conversion
            workflowStatus: true,
            uploadedBy: true,
            uploader: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            createdAt: true,
            updatedAt: true,
          },
        },
        assetWorkflowStates: {
          include: {
            currentStep: {
              select: {
                id: true,
                name: true,
                orderInStage: true,
                stageId: true,
              },
            },
            assignedToRole: {
              select: {
                id: true,
                name: true,
              },
            },
            assignedToEmployee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (employee.companyId !== campaign.companyId) {
      return NextResponse.json(
        { error: 'Forbidden - Access denied to this campaign' },
        { status: 403 }
      );
    }

    // ✅ Helper to convert BigInt to string
    const serializeBigInt = (obj) => {
      if (obj && typeof obj === 'object') {
        Object.keys(obj).forEach(key => {
          if (typeof obj[key] === 'bigint') {
            obj[key] = obj[key].toString();
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            serializeBigInt(obj[key]);
          }
        });
      }
      return obj;
    };

    // ✅ Group videos by workflow status
    const videosByStatus = {
      DRAFT: [],
      PENDING_REVIEW: [],
      UNDER_REVIEW: [],
      CHANGES_REQUESTED: [],
      PARTIALLY_APPROVED: [],
      APPROVED: [],
      PUBLISHED: [],
      COMPLETED: [],
      ARCHIVED: [],
    };

    campaign.videos.forEach((video) => {
      const workflowState = campaign.assetWorkflowStates.find(
        ws => ws.assetId === video.id && ws.assetType === 'VIDEO'
      );

      videosByStatus[video.workflowStatus].push({
        ...video,
        uploader: {
          ...video.uploader,
          fullName: `${video.uploader.firstName} ${video.uploader.lastName}`,
        },
        currentStep: workflowState?.currentStep || null,
        assignedTo: workflowState ? {
          role: workflowState.assignedToRole,
          employee: workflowState.assignedToEmployee ? {
            ...workflowState.assignedToEmployee,
            fullName: `${workflowState.assignedToEmployee.firstName} ${workflowState.assignedToEmployee.lastName}`,
          } : null,
        } : null,
        workflowStateId: workflowState?.id || null,
      });
    });

    // ✅ Group documents by workflow status (with BigInt conversion)
    const documentsByStatus = {
      DRAFT: [],
      PENDING_REVIEW: [],
      UNDER_REVIEW: [],
      CHANGES_REQUESTED: [],
      PARTIALLY_APPROVED: [],
      APPROVED: [],
      PUBLISHED: [],
      COMPLETED: [],
      ARCHIVED: [],
    };

    campaign.documents.forEach((doc) => {
      const workflowState = campaign.assetWorkflowStates.find(
        ws => ws.assetId === doc.id && ws.assetType === 'DOCUMENT'
      );

      documentsByStatus[doc.workflowStatus].push({
        ...doc,
        fileSize: doc.fileSize ? doc.fileSize.toString() : null, // ✅ Convert BigInt to string
        uploader: {
          ...doc.uploader,
          fullName: `${doc.uploader.firstName} ${doc.uploader.lastName}`,
        },
        currentStep: workflowState?.currentStep || null,
        assignedTo: workflowState ? {
          role: workflowState.assignedToRole,
          employee: workflowState.assignedToEmployee ? {
            ...workflowState.assignedToEmployee,
            fullName: `${workflowState.assignedToEmployee.firstName} ${workflowState.assignedToEmployee.lastName}`,
          } : null,
        } : null,
        workflowStateId: workflowState?.id || null,
      });
    });

    // ✅ Get default/active workflow
    const defaultFlow = campaign.flows.find(f => f.isDefault) || campaign.flows[0];
    
    let activeWorkflow = null;
    if (defaultFlow) {
      const stagesWithCounts = defaultFlow.flowChain.stages.map(stage => ({
        id: stage.id,
        name: stage.name,
        order: stage.order,
        executionMode: stage.executionMode,
        steps: stage.steps.map(step => {
          const assetsAtStep = campaign.assetWorkflowStates.filter(
            ws => ws.currentStepId === step.id
          );

          return {
            id: step.id,
            name: step.name,
            orderInStage: step.orderInStage,
            approvalPolicy: step.approvalPolicy,
            assignedRoles: step.assignedRoles.map(ar => ({
              roleId: ar.roleId,
              required: ar.required,
              role: ar.role,
            })),
            assetCount: assetsAtStep.length,
            assets: assetsAtStep.map(ws => ({
              id: ws.assetId,
              type: ws.assetType,
              status: ws.status,
            })),
          };
        }),
      }));

      activeWorkflow = {
        id: defaultFlow.flowChain.id,
        name: defaultFlow.flowChain.name,
        description: defaultFlow.flowChain.description,
        isDefault: defaultFlow.isDefault,
        stages: stagesWithCounts,
        totalStages: stagesWithCounts.length,
        totalSteps: stagesWithCounts.reduce((sum, stage) => sum + stage.steps.length, 0),
        totalAssetsInWorkflow: campaign.assetWorkflowStates.length,
      };
    }

    // ✅ Calculate statistics
    const totalVideos = campaign.videos.length;
    const totalDocuments = campaign.documents.length;
    const totalAssets = totalVideos + totalDocuments;

    const stats = {
      videos: {
        total: totalVideos,
        byStatus: Object.fromEntries(
          Object.entries(videosByStatus).map(([status, assets]) => [status, assets.length])
        ),
      },
      documents: {
        total: totalDocuments,
        byStatus: Object.fromEntries(
          Object.entries(documentsByStatus).map(([status, assets]) => [status, assets.length])
        ),
      },
      overall: {
        total: totalAssets,
        draft: videosByStatus.DRAFT.length + documentsByStatus.DRAFT.length,
        inReview: videosByStatus.UNDER_REVIEW.length + documentsByStatus.UNDER_REVIEW.length,
        approved: videosByStatus.APPROVED.length + documentsByStatus.APPROVED.length,
        completed: videosByStatus.COMPLETED.length + documentsByStatus.COMPLETED.length,
        published: videosByStatus.PUBLISHED.length + documentsByStatus.PUBLISHED.length,
      },
    };

    const completedCount = stats.overall.approved + stats.overall.completed + stats.overall.published;
    const progressPercentage = totalAssets > 0 ? Math.round((completedCount / totalAssets) * 100) : 0;

    // Transform response
    const response = {
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      workflowStatus: campaign.workflowStatus,
      
      company: campaign.company,
      
      admin: {
        ...campaign.admin,
        fullName: `${campaign.admin.firstName} ${campaign.admin.lastName}`,
      },
      
      team: campaign.team ? {
        ...campaign.team,
        memberCount: campaign.team.members.length,
      } : null,

      assets: {
        videos: videosByStatus,
        documents: documentsByStatus,
        stats,
      },

      workflow: activeWorkflow,

      progress: {
        total: totalAssets,
        completed: completedCount,
        percentage: progressPercentage,
      },
      
      assignments: campaign.assignments.map(a => ({
        id: a.id,
        employee: {
          ...a.employee,
          fullName: `${a.employee.firstName} ${a.employee.lastName}`,
        },
        role: a.role,
        note: a.note,
        joinedAt: a.joinedAt,
      })),
      
      schedules: campaign.schedules,
      
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
    };

    return NextResponse.json({
      success: true,
      data: response,
    });

  } catch (error) {
    console.error('Error fetching campaign:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined 
      },
      { status: 500 }
    );
  }
}
