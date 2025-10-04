import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    // Get token from cookies
    const token = req.cookies.get("token")?.value;
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const companyId = decoded.companyId;

    // Aggregate employee stats by status
    const [total, active, inactive, suspended] = await Promise.all([
      prisma.employee.count({ where: { companyId } }),
      prisma.employee.count({ where: { companyId, status: "ACTIVE" } }),
      prisma.employee.count({ where: { companyId, status: "INACTIVE" } }),
      prisma.employee.count({ where: { companyId, status: "SUSPENDED" } }),
    ]);

    return NextResponse.json({
      totalEmployees: total,
      activeEmployees: active,
      inactiveEmployees: inactive,
      suspendedEmployees: suspended,
    });
  } catch (err) {
    console.error("Error in /api/admin/stats:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
