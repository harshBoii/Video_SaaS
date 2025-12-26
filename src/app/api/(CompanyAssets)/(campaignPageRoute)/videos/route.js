import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/app/lib/auth';
import prisma from '@/app/lib/prisma';

export async function GET(request) {
  const { authenticated, user, error } = await authenticateRequest(request);
  if (!authenticated) return error;

  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query params
    const campaignId = searchParams.get('campaignId');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const status = searchParams.get('status') || 'ready';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const skip = (page - 1) * limit;

    const workflowStepId = searchParams.get('workflowStepId');
    const workflowStatus = searchParams.get('workflowStatus');
    const assignedToMe = searchParams.get('assignedToMe') === 'true';


    const where = {
      status,
      campaign: {
        companyId: user.companyId,
        status: 'active'
      }
    };


    if (campaignId) {
      where.campaignId = campaignId;
    }


    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { filename: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } }
      ];
    }


    const orderBy = {};
    orderBy[sortBy] = sortOrder;


    const [videos, totalCount] = await Promise.all([
      prisma.video.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          campaign: {
            select: {
              id: true,
              name: true,
              admin: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          uploader: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true
            }
          },
          _count: {
            select: {
              comments: true,
              views: true,
              versions: true
            }
          }
        }
      }),
      prisma.video.count({ where })
    ]);


    const videoIds = videos.map(v => v.id);
    const workflowStates = await prisma.assetWorkflowState.findMany({
      where: {
        assetId: { in: videoIds },
        assetType: 'VIDEO',
        ...(workflowStepId && { currentStepId: workflowStepId }),
        ...(workflowStatus && { status: workflowStatus }),
        ...(assignedToMe && { assignedToEmployeeId: user.id }),
      },
      include: {
        currentStep: {
          select: {
            id: true,
            name: true,
            description: true,
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
            email: true,
            avatarUrl: true,
          },
        },
        flowChain: {
          select: {
            id: true,
            name: true,
            steps: {
              select: {
                id: true,
                name: true,
              },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
        history: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            actor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
            toStep: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });


    const workflowStateMap = new Map(
      workflowStates.map(ws => [ws.assetId, ws])
    );
    const roleIds = [...new Set(workflowStates.map(ws => ws.assignedToRoleId).filter(Boolean))];

    const availableAssignees = await prisma.campaignAssignment.findMany({
      where: {
        campaignId: campaignId || { in: workflowStates.map(ws => ws.campaignId) },
        roleId: { in: roleIds }
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            email: true
          }
        },
        role: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Create map by roleId
    const assigneesByRole = {};
    availableAssignees.forEach(assignment => {
      if (!assigneesByRole[assignment.roleId]) {
        assigneesByRole[assignment.roleId] = [];
      }
      assigneesByRole[assignment.roleId].push({
        id: assignment.employee.id,
        name: `${assignment.employee.firstName} ${assignment.employee.lastName}`,
        email: assignment.employee.email,
        avatarUrl: assignment.employee.avatarUrl,
        role: assignment.role.name
      });
    });


    const serializedVideos = videos.map(video => {
      const workflowState = workflowStateMap.get(video.id);


      let workflowProgress = null;
      if (workflowState) {
        const totalSteps = workflowState.flowChain.steps.length;
        const currentStepIndex = workflowState.flowChain.steps.findIndex(
          step => step.id === workflowState.currentStepId
        );
        const progressPercentage = totalSteps > 0 
          ? Math.round(((currentStepIndex + 1) / totalSteps) * 100)
          : 0;

        workflowProgress = {
          currentStep: currentStepIndex + 1,
          totalSteps: totalSteps,
          percentage: progressPercentage,
        };
      }

      return {
        id: video.id,
        title: video.title,
        filename: video.filename,
        originalSize: video.originalSize.toString(),
        duration: video.duration,
        resolution: video.resolution,
        fps: video.fps,
        codec: video.codec,
        status: video.status,
        streamId: video.streamId,
        playbackUrl: video.playbackUrl,
        thumbnailUrl: video.thumbnailUrl,
        tags: video.tags,
        metadata: video.metadata,
        currentVersion: video.currentVersion,
        
        campaign: video.campaign,
        
        uploader: {
          id: video.uploader.id,
          name: `${video.uploader.firstName} ${video.uploader.lastName}`,
          avatarUrl: video.uploader.avatarUrl,
        },
        
        commentCount: video._count.comments,
        viewCount: video._count.views,
        versionCount: video._count.versions,


        workflow: workflowState ? {
          id: workflowState.id,
          status: workflowState.status,
          availableAssignees: assigneesByRole[workflowState.assignedToRoleId] || [],

          currentStep: {
            id: workflowState.currentStep.id,
            name: workflowState.currentStep.name,
            description: workflowState.currentStep.description,
          },
          assignedTo: workflowState.assignedToEmployee ? {
            id: workflowState.assignedToEmployee.id,
            name: `${workflowState.assignedToEmployee.firstName} ${workflowState.assignedToEmployee.lastName}`,
            email: workflowState.assignedToEmployee.email,
            avatarUrl: workflowState.assignedToEmployee.avatarUrl,
          } : null,
          assignedToRole: workflowState.assignedToRole ? {
            id: workflowState.assignedToRole.id,
            name: workflowState.assignedToRole.name,
          } : null,
          progress: workflowProgress,
          flowChain: {
            id: workflowState.flowChain.id,
            name: workflowState.flowChain.name,
            totalSteps: workflowState.flowChain.steps.length,
          },
          recentHistory: workflowState.history.map(h => ({
            action: h.action,
            comment: h.comment,
            actor: {
              name: `${h.actor.firstName} ${h.actor.lastName}`,
              avatarUrl: h.actor.avatarUrl,
            },
            stepName: h.toStep.name,
            createdAt: h.createdAt,
          })),
          startedAt: workflowState.startedAt,
          updatedAt: workflowState.updatedAt,
          completedAt: workflowState.completedAt,
          dueDate: workflowState.dueDate,
          
          // Useful flags for UI
          isAssignedToMe: workflowState.assignedToEmployeeId === user.id,
          isOverdue: workflowState.dueDate && new Date(workflowState.dueDate) < new Date() && !workflowState.completedAt,
          canEdit: workflowState.assignedToEmployeeId === user.id && workflowState.status === 'in_progress',
          canReview: workflowState.assignedToEmployeeId === user.id && workflowState.status === 'awaiting_review',
        } : null,

        createdAt: video.createdAt,
        updatedAt: video.updatedAt,
      };
    });


    let filteredVideos = serializedVideos;
    if (assignedToMe) {
      filteredVideos = serializedVideos.filter(video => video.workflow?.isAssignedToMe);
    }

    return NextResponse.json({
      success: true,
      data: {
        videos: filteredVideos,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasMore: page * limit < totalCount
        },

        workflowStats: {
          total: filteredVideos.length,
          assignedToMe: filteredVideos.filter(v => v.workflow?.isAssignedToMe).length,
          inProgress: filteredVideos.filter(v => v.workflow?.status === 'in_progress').length,
          awaitingReview: filteredVideos.filter(v => v.workflow?.status === 'awaiting_review').length,
          approved: filteredVideos.filter(v => v.workflow?.status === 'approved').length,
          completed: filteredVideos.filter(v => v.workflow?.status === 'completed').length,
          overdue: filteredVideos.filter(v => v.workflow?.isOverdue).length,
          withoutWorkflow: filteredVideos.filter(v => !v.workflow).length,
        },
      }
    });

  } catch (error) {
    console.error('[VIDEOS LIST ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch videos', message: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}
