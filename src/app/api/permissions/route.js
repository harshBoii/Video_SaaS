import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';


export async function GET() {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: { group: 'asc' },
    });

    return NextResponse.json(permissions);
  } catch (err) {
    console.error('Error fetching permissions:', err);
    return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 });
  }
}
