import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma'; 
import bcrypt from 'bcryptjs'; 

export async function POST(request, { params }) {
  try {
    const { accessType, password, permissions } = await request.json();
    const { videoId } = await params;

    let passwordHash = null;

    // Only hash password if mode is PASSWORD and a password is provided
    if (accessType === 'PASSWORD' && password) {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(password, salt);
    }

    // Upsert: Create settings if they don't exist, update if they do
    const shareSettings = await prisma.videoShare.upsert({
      where: { videoId },
      update: {
        accessType,
        // Only update password hash if a new one is provided
        ...(passwordHash && { passwordHash }), 
        allowComments: permissions.allowComments,
        allowDownload: permissions.allowDownload,
      },
      create: {
        videoId,
        accessType,
        passwordHash,
        allowComments: permissions.allowComments,
        allowDownload: permissions.allowDownload,
      },
    });

    return NextResponse.json({ 
      success: true, 
      shareId: shareSettings.id,
      link: `${process.env.NEXT_PUBLIC_APP_URL}/watch/${shareSettings.id}`
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to save share settings' }, { status: 500 });
  }
}
