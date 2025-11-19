// app/api/campaigns/list/route.js
import prisma from "@/app/lib/prisma";
import { z } from "zod";
import { NextResponse } from "next/server";

// ✅ Comprehensive validation schema
const listCampaignsSchema = z.object({
  companyId: z.string().cuid("Invalid company ID").optional(),
  adminId: z.string().cuid("Invalid admin ID").optional(),
  teamId: z.string().cuid("Invalid team ID").optional(),
  page: z.coerce
    .number()
    .int("Page must be an integer")
    .positive("Page must be positive")
    .default(1),
  limit: z.coerce
    .number()
    .int("Limit must be an integer")
    .positive("Limit must be positive")
    .max(100, "Limit cannot exceed 100") // ✅ Security: prevent excessive queries
    .default(10),
  sortBy: z.enum(["createdAt", "updatedAt", "name"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().max(255).optional(), // ✅ Search functionality
  status: z.enum(["active", "archived", "completed"]).optional(),
});

// ✅ Format validation errors
function formatZodError(error) {
  return error.errors.map((err) => ({
    field: err.path.join("."),
    message: err.message,
  }));
}

// ✅ Correct App Router syntax
export async function GET(request) {
  try {
    // ✅ Parse and validate query params
    const { searchParams } = new URL(request.url);
    const queryObject = Object.fromEntries(searchParams.entries());

    const validation = listCampaignsSchema.safeParse(queryObject);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid query parameters",
          details: formatZodError(validation.error),
        },
        { status: 400 }
      );
    }

    const {
      companyId,
      adminId,
      teamId,
      page,
      limit,
      sortBy,
      sortOrder,
      search,
      status,
    } = validation.data;

    // ✅ Build dynamic where clause
    const where = {};

    if (companyId) where.companyId = companyId;
    if (adminId) where.adminId = adminId;
    if (teamId) where.teamId = teamId;
    if (status) where.status = status;

    // ✅ Search functionality (searches name)
    if (search) {
      where.name = {
        contains: search,
        mode: "insensitive", // Case-insensitive search
      };
    }

    // ✅ Build orderBy dynamically
    const orderBy = {
      [sortBy]: sortOrder,
    };

    // ✅ Calculate pagination
    const skip = (page - 1) * limit;

    // ✅ Execute queries in parallel for better performance
    const [campaigns, totalCount] = await Promise.all([
      prisma.campaign.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          company: {
            select: {
              id: true,
              name: true,
              domain: true,
            },
          },
          admin: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          team: {
            select: {
              id: true,
              name: true,
              _count: {
                select: {
                  members: true,
                },
              },
            },
          },
          _count: {
            select: {
              assignments: true, // Count of employees assigned
              flows: true, // Count of flows
              schedules: true, // Count of schedule entries
            },
          },
        },
      }),
      prisma.campaign.count({ where }),
    ]);

    // ✅ Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    // ✅ Proper response format
    return NextResponse.json({
      success: true,
      data: campaigns,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    });
  } catch (error) {
    console.error("List campaigns error:", error);

    // ✅ Handle specific Prisma errors
    if (error.code === "P2025") {
      return NextResponse.json(
        {
          success: false,
          error: "Related record not found",
        },
        { status: 404 }
      );
    }

    // ✅ Generic error with helpful message
    return NextResponse.json(
      {
        success: false,
        error: "Failed to list campaigns",
        message: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
