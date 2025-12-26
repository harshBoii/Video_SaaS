import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";
import { verifyJWT } from "@/app/lib/auth";
export async function GET(request) {
  try {
    const { employee: user, error: authError } = await verifyJWT(request);
    if (authError) {
      return NextResponse.json({ success: false, error: authError }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Filters
    const campaignId = searchParams.get("campaignId");
    const documentType = searchParams.get("documentType");
    const status = searchParams.get("status") || "ready";
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const workflowStepId = searchParams.get("workflowStepId"); // Filter by step
    const workflowStatus = searchParams.get("workflowStatus"); // Filter by workflow status
    const assignedToMe = searchParams.get("assignedToMe") === "true"; // Show only my tasks

    // Build where clause
    const where = {
      status,
      ...(campaignId && { campaignId }),
      ...(documentType && { documentType }),  
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { filename: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    // Execute queries
    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          campaign: {
            select: {
              id: true,
              name: true,
            },
          },
          uploader: {
            select: {
              id: true,
              firstName: true,  
              lastName: true,
              email: true,
              avatarUrl: true,  
            },
          },
          shareSettings: {
            select: {
              id: true,
              accessType: true,
            },
          },
          _count: {
            select: {
              comments: true,
              versions: true,
            },
          },
        },
      }),
      prisma.document.count({ where }),
    ]);


    const documentIds = documents.map(doc => doc.id);

    const workflowStates = await prisma.assetWorkflowState.findMany({
      where: {
        assetId: { in: documentIds },
        assetType: 'DOCUMENT',
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
          take: 5, // Last 5 workflow actions
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


    // Format response
        const formattedDocuments = await Promise.all(
        documents.map(async (doc) => {
            
        const viewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/documents/${doc.id}/proxy`;
        const workflowState = workflowStateMap.get(doc.id);
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
          id: doc.id,
          title: doc.title,
          filename: doc.filename,
          fileSize: Number(doc.fileSize),
          fileSizeFormatted: formatBytes(doc.fileSize),
          documentType: doc.documentType,
          mimeType: doc.mimeType,
          status: doc.status,
          r2Key: doc.r2Key,
          r2Bucket: doc.r2Bucket,
          thumbnailUrl: doc.thumbnailUrl,
          viewUrl: viewUrl,  
          pageCount: doc.pageCount,
          tags: doc.tags,
          currentVersion: doc.currentVersion,
          campaign: doc.campaign,
          uploader: {
            id: doc.uploader.id,
            name: `${doc.uploader.firstName} ${doc.uploader.lastName}`,
            email: doc.uploader.email,
            avatarUrl: doc.uploader.avatarUrl,
          },
          isShared: !!doc.shareSettings,
          shareAccessType: doc.shareSettings?.accessType,
          commentsCount: doc._count.comments,
          versionsCount: doc._count.versions,
            workflow: workflowState ? {
            id: workflowState.id,
            status: workflowState.status, // in_progress, awaiting_review, approved, rejected, changes_requested, completed
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
            
            isAssignedToMe: workflowState.assignedToEmployeeId === user.id,
            isOverdue: workflowState.dueDate && new Date(workflowState.dueDate) < new Date() && !workflowState.completedAt,
            canEdit: workflowState.assignedToEmployeeId === user.id && workflowState.status === 'in_progress',
            canReview: workflowState.assignedToEmployeeId === user.id && workflowState.status === 'awaiting_review',
          } : null, 
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
        };
      })
    );

    let filteredDocuments = formattedDocuments;
    if (assignedToMe) {
      filteredDocuments = formattedDocuments.filter(doc => doc.workflow?.isAssignedToMe);
    }


    return NextResponse.json({
      success: true,
      data: filteredDocuments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },

      workflowStats: {
        total: filteredDocuments.length,
        assignedToMe: filteredDocuments.filter(d => d.workflow?.isAssignedToMe).length,
        inProgress: filteredDocuments.filter(d => d.workflow?.status === 'in_progress').length,
        awaitingReview: filteredDocuments.filter(d => d.workflow?.status === 'awaiting_review').length,
        approved: filteredDocuments.filter(d => d.workflow?.status === 'approved').length,
        completed: filteredDocuments.filter(d => d.workflow?.status === 'completed').length,
        overdue: filteredDocuments.filter(d => d.workflow?.isOverdue).length,
        withoutWorkflow: filteredDocuments.filter(d => !d.workflow).length,
      },
    });

  } catch (error) {
    console.error("❌ [DOCUMENTS LIST ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch documents",
        message: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

function formatBytes(bytes) {
  if (bytes === 0 || bytes === 0n) return "0 Bytes";
  const numBytes = typeof bytes === 'bigint' ? Number(bytes) : bytes;
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(numBytes) / Math.log(k));
  return Math.round((numBytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}
