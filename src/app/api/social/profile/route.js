import { NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import prisma from '@/app/lib/prisma';
import { cookies } from 'next/headers';
import { error } from 'pdf-lib';




async function getCompanyFromToken(request) {
  try {
    
    const token = (await cookies()).get("token").value
    if (!token){
        return "No Token Found"
    }
    const decoded = verify(token, process.env.JWT_SECRET);
    return decoded.companyId;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}


export async function GET(request) {
  try {
    const companyId = await getCompanyFromToken(request);
    
    if (!companyId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const profile = await prisma.lateProfile.findUnique({
      where: { companyId },
      include: {
        socialAccounts: {
          where: { isActive: true },
          select: {
            id: true,
            platform: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            accountId:true
          }
        }
      }
    });

    return NextResponse.json({
      hasProfile: !!profile,
      profile: profile || null
    });

  } catch (error) {
    console.error('Profile check error:', error);
    return NextResponse.json(
      { error: 'Failed to check profile status' },
      { status: 500 }
    );
  }
}

// POST: Create Late profile
export async function POST(request) {
  try {
    const companyId = await getCompanyFromToken(request);
    
    if (!companyId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get company details
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true, description: true }
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    const body = JSON.stringify({
                    "name": company.name,
                    "description": `Social media profile for ${company.name}`,
                    "color": "#4CAF50"
                    })

    // Call Late API to create profile
    const lateResponse = await fetch('https://getlate.dev/api/v1/profiles', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LATE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body
    });

    if (!lateResponse.ok) {
      const errorData = await lateResponse.json();
      throw new Error(errorData.message || 'Failed to create Late profile');
    }

    const lateData = await lateResponse.json();
    const profileData = lateData.profile
    console.log("Data Received :" , lateData)
    console.log("Profile Data Received :" , profileData)

    // Save to database using upsert
    const profile = await prisma.lateProfile.upsert({
      where: { companyId },
      update: {
        lateId: profileData._id,
        name: profileData.name,
        description: profileData.description
      },
      create: {
        lateId: profileData._id,
        name: profileData.name,
        description: profileData.description,
        companyId: companyId
      }
    });

    return NextResponse.json({
      success: true,
      profile: {
        id: profile.id,
        lateId: profile.lateId,
        name: profile.name,
        description: profile.description
      }
    });

  } catch (error) {
    console.error('Profile creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create profile' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const companyId = await getCompanyFromToken(request);
    
    if (!companyId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the profile from database
    const profile = await prisma.lateProfile.findUnique({
      where: { companyId },
      include: {
        socialAccounts: {
          select: { id: true }
        }
      }
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Check if there are connected social accounts
    if (profile.socialAccounts && profile.socialAccounts.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete profile with connected accounts. Please disconnect all accounts first.',
          connectedAccounts: profile.socialAccounts.length
        },
        { status: 400 }
      );
    }

    // Call Late API to delete profile
    const lateResponse = await fetch(
      `https://getlate.dev/api/v1/profiles/${profile.lateId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${process.env.LATE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!lateResponse.ok) {
      const errorData = await lateResponse.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to delete Late profile');
    }

    // Delete from database (cascade will handle related records)
    await prisma.lateProfile.delete({
      where: { companyId }
    });

    return NextResponse.json({
      success: true,
      message: 'Profile deleted successfully'
    });

  } catch (error) {
    console.error('Profile deletion error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete profile' },
      { status: 500 }
    );
  }
}
