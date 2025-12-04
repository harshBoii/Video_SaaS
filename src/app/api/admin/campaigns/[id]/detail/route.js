// Cacheable Content , Invalidate on ___
// app/api/projects/[id]/details/route.js
import prisma from "@/app/lib/prisma";
import { z } from "zod";
import { NextResponse } from "next/server";

// ✅ Validate the ID parameter
const projectIdSchema = z.object({
  id: z.string().cuid("Invalid project ID format"),
});

// ✅ Format validation errors
function formatZodError(error) {
  return error.errors.map((err) => ({
    field: err.path.join("."),
    message: err.message,
  }));
}

// ✅ Correct App Router syntax with context param
export async function GET(request, { params }) {
  try {
    // ✅ Validate the ID parameter
    const validation = projectIdSchema.safeParse(params);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid project ID",
          details: formatZodError(validation.error),
        },
        { status: 400 }
      );
    }

    const { id } = validation.data;

    // ✅ Fetch project with safe, selective includes
    const project = await prisma.campaign.findUnique({
      where: { id },
      include: {
        // Company info
        company: {
          select: {
            id: true,
            name: true,
            domain: true,
            email: true,
            mobile: true,
          },
        },
        // Admin info (no sensitive data)
        admin: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            status: true,
            lastLogin: true,
          },
        },
        // Team info with member count
        team: {
          select: {
            id: true,
            name: true,
            teamAdmin: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            _count: {
              select: {
                members: true,
              },
            },
          },
        },
        // Flows with chain details
        flows: {
          select: {
            id: true,
            isDefault: true,
            createdAt: true,
            flowChain: {
              select: {
                id: true,
                name: true,
                description: true,
                steps: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    role: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                  orderBy: {
                    createdAt: "asc",
                  },
                },
              },
            },
          },
        },
        // Assignments with employee and role info
        assignments: {
          select: {
            id: true,
            joinedAt: true,
            note: true,
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                status: true,
                department: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            role: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
          orderBy: {
            joinedAt: "desc",
          },
        },
        // Schedule entries
        schedules: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            color: true,
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            startDate: "asc",
          },
        },
        // Counts for quick stats
        _count: {
          select: {
            assignments: true,
            flows: true,
            schedules: true,
          },
        },
      },
    });

    // ✅ Handle not found case
    if (!project) {
      return NextResponse.json(
        {
          success: false,
          error: "Project not found",
          message: "The requested project does not exist or has been deleted",
        },
        { status: 404 }
      );
    }

    // ✅ Calculate additional statistics
    const stats = {
      totalAssignments: project._count.assignments,
      activeAssignments: project.assignments.filter(
        (a) => a.employee.status === "ACTIVE"
      ).length,
      totalFlows: project._count.flows,
      defaultFlow: project.flows.find((f) => f.isDefault),
      totalSchedules: project._count.schedules,
      upcomingSchedules: project.schedules.filter(
        (s) => new Date(s.startDate) > new Date()
      ).length,
    };

    // ✅ Return comprehensive response
    return NextResponse.json({
      success: true,
      project: {
        ...project,
        stats,
      },
    });
  } catch (error) {
    console.error("Get project details error:", error);

    // ✅ Handle specific Prisma errors
    if (error.code === "P2023") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid ID format",
          message: "The provided project ID is malformed",
        },
        { status: 400 }
      );
    }

    if (error.code === "P2025") {
      return NextResponse.json(
        {
          success: false,
          error: "Project not found",
        },
        { status: 404 }
      );
    }

    // ✅ Generic error handler
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch project details",
        message: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
