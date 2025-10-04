import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decoded.companyId;
    const { searchParams } = new URL(req.url);
    const nameFilter = searchParams.get("name") || "";

    const employees = await prisma.employee.findMany({
      where: {
        companyId,
        OR: [
          { firstName: { contains: nameFilter, mode: "insensitive" } },
          { lastName: { contains: nameFilter, mode: "insensitive" } },
          { email: { contains: nameFilter, mode: "insensitive" } },
        ],
      },
      include: {
        role: true,
        department: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(employees);
  } catch (err) {
    console.error("Error in /api/admin/employees:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
