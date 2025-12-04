//cacheable , invalidate on post
import prisma from "@/app/lib/prisma";
import { NextResponse } from "next/server";


export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");
    const take = parseInt(searchParams.get("take") || "50");
    const cursor = searchParams.get("cursor");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "updatedAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    if (!companyId) {
      return NextResponse.json({ success: false, message: "Company ID is required." }, { status: 400 });
    }

    const whereClause = {
      companyId,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { admin: { firstName: { contains: search, mode: "insensitive" } } },
              { admin: { lastName: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const campaigns = await prisma.campaign.findMany({
      where: whereClause,
      take,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        companyId: true,
        admin: { select: { id: true, firstName: true, lastName: true, role: { select: { name: true } } } },
        team: { select: { id: true, name: true } },
      },
    });

    const nextCursor = campaigns.length === take ? campaigns[campaigns.length - 1].id : null;

    return NextResponse.json({ success: true, data: campaigns, nextCursor });
  } catch (err) {
    console.error("Campaigns GET error:", err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

// ------------------- POST (Create Campaign) -------------------
export async function POST(req) {
  try {
    const body = await req.json();
    const { name, description, adminId, teamId, companyId, budget, status } = body;

    if (!name || !adminId || !companyId) {
      return NextResponse.json({ success: false, message: "Name, admin, and company ID are required." }, { status: 400 });
    }

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) return NextResponse.json({ success: false, message: "Company not found." }, { status: 404 });

    const admin = await prisma.employee.findUnique({ where: { id: adminId } });
    if (!admin) return NextResponse.json({ success: false, message: "Admin not found." }, { status: 404 });

    const newCampaign = await prisma.campaign.create({
      data: {
        name,
        companyId,
        adminId,
        teamId: teamId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        admin: { select: { firstName: true, lastName: true } },
        company: { select: { name: true } },
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, data: newCampaign }, { status: 201 });
  } catch (err) {
    console.error("Campaign POST error:", err);
    return NextResponse.json({ success: false, message: "Failed to create campaign." }, { status: 500 });
  }
}
