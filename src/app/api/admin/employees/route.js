// src/app/api/admin/employees/route.js
//cacaheble and invalidate on post
import prisma from "@/app/lib/prisma";
import { verifyJWT, requireAdmin } from "@/app/lib/auth";
import bcrypt from "bcryptjs";

export async function GET(req) {
  try {
    const { employee: currentUser, error, status } = await verifyJWT(req);
    if (error) {
      return new Response(JSON.stringify({ success: false, message: error }), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const adminError = requireAdmin(currentUser);
    if (adminError) {
      return new Response(
        JSON.stringify({ success: false, message: adminError.error }),
        { status: adminError.status, headers: { "Content-Type": "application/json" } }
      );
    }

    const { searchParams } = new URL(req.url);
    let companyId = searchParams.get("companyId");
    const take = Number(searchParams.get("take")) || 50;
    const cursor = searchParams.get("cursor") || null;
    const sortBy = searchParams.get("sortBy") || "updatedAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";
    const search = searchParams.get("search")?.trim() || "";
    const isAdminParam = searchParams.get("isAdmin");

    if (!companyId) {
      companyId = currentUser.companyId;
    }

    if (companyId !== currentUser.companyId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Forbidden - Cannot access other company's employees" 
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const whereClause = {
      companyId: companyId,
    };

    if (search) {
      whereClause.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // ✅ FIXED: Changed from is_admin to isAdmin
    if (isAdminParam === "true" || isAdminParam === "false") {
      whereClause.isAdmin = isAdminParam === "true";
    }

    console.log("🔍 Admin Employee Query:", {
      requestedCompanyId: searchParams.get("companyId"),
      usingCompanyId: companyId,
      userCompanyId: currentUser.companyId,
      search,
      whereClause: JSON.stringify(whereClause, null, 2),
    });

    const employees = await prisma.employee.findMany({
      where: whereClause,
      take,
      skip: cursor ? 1 : 0,
      ...(cursor && { cursor: { id: cursor } }),
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        status: true,
        isAdmin: true,  // ✅ FIXED
        lastLogin: true,
        role: { 
          select: { 
            id: true,
            name: true 
          } 
        },
        department: { 
          select: { 
            id: true,
            name: true 
          } 
        },
        campaignAssignments: {
          select: {
            campaign: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          take: 5,
        },
        teams: {
          select: {
            id: true,
            name: true,
          },
          take: 5,
        },
        updatedAt: true,
        createdAt: true,
      },
    });

    console.log(`✅ Found ${employees.length} employees for company ${companyId}`);

    const transformedEmployees = employees.map(emp => ({
      ...emp,
      campaigns: emp.campaignAssignments?.map(ca => ca.campaign) || [],
      campaignAssignments: undefined,
    }));

    const nextCursor =
      employees.length === take ? employees[employees.length - 1].id : null;

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: transformedEmployees, 
        nextCursor,
      }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("❌ Admin Employee API error:", err);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: "Server error",
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function POST(req) {
  try {
    const { employee: currentUser, error, status } = await verifyJWT(req);
    if (error) {
      return new Response(JSON.stringify({ success: false, message: error }), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const adminError = requireAdmin(currentUser);
    if (adminError) {
      return new Response(
        JSON.stringify({ success: false, message: adminError.error }),
        { status: adminError.status, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    // ✅ FIXED: Changed from is_admin to isAdmin
    const { firstName, lastName, email, password, roleId, companyId, departmentId, isAdmin } = body;

    if (!firstName || !lastName || !email || !password || !roleId || !companyId) {
      return new Response(
        JSON.stringify({ success: false, message: "All required fields must be provided." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (companyId !== currentUser.companyId) {
      return new Response(
        JSON.stringify({ success: false, message: "Cannot create employees for other companies" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const existing = await prisma.employee.findUnique({ where: { email } });
    if (existing) {
      return new Response(
        JSON.stringify({ success: false, message: "Email already registered." }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    const role = await prisma.role.findUnique({
      where: { id: roleId },
      select: { companyId: true },
    });

    if (!role || role.companyId !== companyId) {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid role for this company" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newEmployee = await prisma.employee.create({
      data: {
        firstName,
        lastName,
        email,
        passwordHash: hashedPassword,
        company: { connect: { id: companyId } },
        role: { connect: { id: roleId } },
        ...(departmentId && { department: { connect: { id: departmentId } } }),
        isAdmin: isAdmin || false,  // ✅ FIXED
        status: "ACTIVE",
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isAdmin: true,  // ✅ FIXED
        role: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
        status: true,
        createdAt: true,
      },
    });

    return new Response(JSON.stringify({ success: true, data: newEmployee }), {
      headers: { "Content-Type": "application/json" },
      status: 201,
    });

  } catch (err) {
    console.error("❌ Admin Employee create error:", err);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: "Server error",
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
