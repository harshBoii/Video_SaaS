// app/api/campaigns/create/route.js
import prisma from "@/app/lib/prisma";
import { z } from "zod"; // ✅ Correct import
import { NextResponse } from "next/server"; // ✅ App Router response

// ✅ Proper validation schema with CUID validation
const createCampaignSchema = z.object({
  name: z
    .string()
    .min(3, "Campaign name must be at least 3 characters")
    .max(255, "Campaign name cannot exceed 255 characters"),
  companyId: z.string().cuid("Invalid company ID format"),
  adminId: z.string().cuid("Invalid admin ID format"),
  teamId: z.string().cuid("Invalid team ID format").optional(),
});

// ✅ Format Zod errors for better UX
function formatZodError(error) {
  return error.errors.map((err) => ({
    field: err.path.join("."),
    message: err.message,
  }));
}

// ✅ Correct App Router syntax - no (req, res) params
export async function POST(request) {
  try {
    // ✅ Parse body from Request object
    const body = await request.json();

    // ✅ Validate with proper error handling
    const validation = createCampaignSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: formatZodError(validation.error),
        },
        { status: 400 }
      );
    }

    const { name, companyId, adminId, teamId } = validation.data;

    // ✅ Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return NextResponse.json(
        {
          success: false,
          error: "Company not found",
        },
        { status: 404 }
      );
    }

    // ✅ Verify admin exists and belongs to company
    const admin = await prisma.employee.findFirst({
      where: {
        id: adminId,
        companyId: companyId,
        status: "ACTIVE",
      },
    });

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          error: "Admin not found or not authorized for this company",
        },
        { status: 403 }
      );
    }

    // ✅ If teamId provided, verify it exists and belongs to company
    if (teamId) {
      const team = await prisma.team.findFirst({
        where: {
          id: teamId,
          companyId: companyId,
        },
      });

      if (!team) {
        return NextResponse.json(
          {
            success: false,
            error: "Team not found or not authorized for this company",
          },
          { status: 404 }
        );
      }
    }

    // ✅ Create campaign with proper data
    const campaign = await prisma.campaign.create({
      data: {
        name,
        companyId,
        adminId,
        teamId: teamId ?? null,
      },
      include: {
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
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // ✅ Proper success response with 201 status
    return NextResponse.json(
      {
        success: true,
        message: "Campaign created successfully",
        campaign,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create campaign error:", error);

    // ✅ Handle Prisma unique constraint violations
    if (error.code === "P2002") {
      return NextResponse.json(
        {
          success: false,
          error: "A campaign with this name already exists for this company",
        },
        { status: 409 }
      );
    }

    // ✅ Handle Prisma foreign key violations
    if (error.code === "P2003") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid reference: Company, Admin, or Team ID does not exist",
        },
        { status: 400 }
      );
    }

    // ✅ Generic error handler
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create campaign",
        message: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
