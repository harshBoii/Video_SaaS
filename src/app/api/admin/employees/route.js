import prisma from "@/app/lib/prisma";
import { cacheGet } from "@/app/lib/cache/cache";
import bcrypt from "bcryptjs";


export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const companyId = searchParams.get("companyId");
    const take = Number(searchParams.get("take")) || 50;
    const cursor = searchParams.get("cursor") || null;
    const sortBy = searchParams.get("sortBy") || "updatedAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";
    const search = searchParams.get("search")?.trim() || "";
    const roleName = searchParams.get("role");

    const whereClause = {};
    if (companyId) whereClause.companyId = companyId;

    if (search) {
      whereClause.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // ✅ Correct nested role filter
    if (roleName) {
      whereClause.role = {
        is: {
          name: { equals: roleName, mode: "insensitive" },
        },
      };
    }

    const cacheKey = `employees:${companyId || "all"}:${roleName || "any"}:${search}:${sortBy}:${sortOrder}:${cursor || "start"}:${take}`;

    const data = await cacheGet(cacheKey, async () => {
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
          role: { select: { name: true } },
          department: { select: { name: true } },
          updatedAt: true,
        },
      });

      const nextCursor =
        employees.length === take ? employees[employees.length - 1].id : null;

      return { success: true, data: employees, nextCursor };
    });

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Employee pagination API error:", err);
    return new Response(
      JSON.stringify({ success: false, message: "Server error" }),
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, password, roleId, companyId } = body;

    // 🔒 Validate input
    if (!firstName || !lastName || !email || !password || !roleId || !companyId) {
      return new Response(
        JSON.stringify({ success: false, message: "All fields are required." }),
        { status: 400 }
      );
    }

    // 🔍 Check if user exists
    const existing = await prisma.employee.findUnique({ where: { email } });
    if (existing) {
      return new Response(
        JSON.stringify({ success: false, message: "Email already registered." }),
        { status: 409 }
      );
    }

    // 🔐 Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🧱 Create new employee
    const newEmployee = await prisma.employee.create({
      data: {
        firstName,
        lastName,
        email,
        passwordHash: hashedPassword,
        company: { connect: { id: companyId } },
        role: { connect: { id: roleId } },
        status: "ACTIVE",
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: { select: { name: true } },
        company: { select: { name: true } },
        status: true,
        createdAt: true,
      },
    });

    return new Response(JSON.stringify({ success: true, data: newEmployee }), {
      headers: { "Content-Type": "application/json" },
      status: 201,
    });
  } catch (err) {
    console.error("Employee create API error:", err);
    return new Response(
      JSON.stringify({ success: false, message: "Server error" }),
      { status: 500 }
    );
  }
}