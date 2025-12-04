import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { verify } from 'jsonwebtoken';
/**
 * GET /api/permission/combo
 * POST /api/permission/combo
 *
 * GET -> returns an array of combos with `permissions` flattened (frontend expects this)
 * POST -> create a combo: body { name, description?, permissionIds: [] }
 *
 * NOTE: replace req.user?.companyId with your actual auth/company retrieval.
 */

export async function GET(req) {
  try {
    // Replace with real companyId from auth context

      const token = req.cookies.get('token')?.value;
      if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
  
      const decoded = verify(token, process.env.JWT_SECRET);
      const companyId = decoded.companyId;
    

    console.log("CompanyId is : " , companyId)
    const combos = await prisma.permissionCombo.findMany({
      where: { companyId },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = combos.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      companyId: c.companyId,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      permissions: c.permissions.map((p) => p.permission),
    }));

    return NextResponse.json(data);
  } catch (err) {
    console.error('GET /api/permission/combo error', err);
    return NextResponse.json({ error: 'Failed to fetch combos' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, description, permissionIds, } = body;

    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verify(token, process.env.JWT_SECRET);
    const companyId = decoded.companyId;


    if (!name || !Array.isArray(permissionIds) || permissionIds.length === 0) {
      return NextResponse.json(
        { error: 'Name and at least one permissionId are required' },
        { status: 400 }
      );
    }

    // Replace with real companyId from auth context

    console.log("CompanyId is : " , companyId)

    // create combo
    const combo = await prisma.permissionCombo.create({
      data: {
        name,
        description,
        companyId,
      },
    });

    // create many to link permissions (skip duplicates)
    await prisma.comboPermission.createMany({
      data: permissionIds.map((pid) => ({ comboId: combo.id, permissionId: pid })),
      skipDuplicates: true,
    });

    const created = await prisma.permissionCombo.findUnique({
      where: { id: combo.id },
      include: { permissions: { include: { permission: true } } },
    });

    return NextResponse.json({
      id: created.id,
      name: created.name,
      description: created.description,
      companyId: created.companyId,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
      permissions: created.permissions.map((p) => p.permission),
    });
  } catch (err) {
    console.error('POST /api/permission/combo error', err);
    return NextResponse.json({ error: 'Failed to create combo' }, { status: 500 });
  }
}
