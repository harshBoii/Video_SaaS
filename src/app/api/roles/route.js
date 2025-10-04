import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import * as jose from 'jose';

// 🧠 Utility to extract companyId from JWT
async function getCompanyIdFromToken(request) {
  const token = request.cookies.get('token')?.value;
  if (!token) return null;

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    return payload.companyId || null;
  } catch (err) {
    console.error('JWT verification failed:', err);
    return null;
  }
}

// ---------------------------------------------------
// ✅ GET — Fetch all roles (for the logged-in company)
// ---------------------------------------------------
export async function GET(request) {
  try {
    const companyId = await getCompanyIdFromToken(request);
    if (!companyId)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const roles = await prisma.role.findMany({
      where: { companyId },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = roles.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      permissions: r.permissions.map((p) => ({
        id: p.permission.id,
        name: p.permission.name,
        description: p.permission.description,
        group: p.permission.group,
      })),
    }));

    return NextResponse.json(formatted);
  } catch (err) {
    console.error('Error fetching roles:', err);
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
  }
}

// ---------------------------------------------------
// ✅ POST — Create a new role for the logged-in company
// ---------------------------------------------------
export async function POST(request) {
  try {
    const companyId = await getCompanyIdFromToken(request);
    if (!companyId)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, description } = await request.json();
    if (!name)
      return NextResponse.json({ error: 'Role name is required' }, { status: 400 });

    const existing = await prisma.role.findFirst({
      where: { name, companyId },
    });
    if (existing)
      return NextResponse.json({ error: 'Role name already exists for this company' }, { status: 400 });

    const role = await prisma.role.create({
      data: {
        name,
        description: description || null,
        company: { connect: { id: companyId } },
      },
    });

    return NextResponse.json(role);
  } catch (err) {
    console.error('Error creating role:', err);
    return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
  }
}
