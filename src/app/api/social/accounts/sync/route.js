import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { getCompanyFromToken } from '@/app/lib/auth';

/**
 * Syncs connected social accounts from Late API to local database
 * Called after OAuth callback to fetch and store account IDs
 */
export async function POST(request) {
  try {
    // Authenticate user
    const companyId = await getCompanyFromToken(request);
    
    if (!companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Late profile for this company
    const profile = await prisma.lateProfile.findUnique({
      where: { companyId },
      select: {
        id: true,
        lateId: true,
        socialAccounts: true
      }
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Late profile not found. Please connect your Late account first.' },
        { status: 404 }
      );
    }

    console.log('🔄 Syncing accounts for Late profile:', profile.lateId);

    // Fetch all connected accounts from Late API
    const lateResponse = await fetch('https://getlate.dev/api/v1/accounts', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.LATE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!lateResponse.ok) {
      const errorData = await lateResponse.json().catch(() => ({}));
      console.error('❌ Late API error:', errorData);
      throw new Error(errorData.message || 'Failed to fetch accounts from Late');
    }

    const lateData = await lateResponse.json();
    console.log('✅ Fetched accounts from Late:', lateData.accounts?.length || 0);

    // Filter accounts that belong to this profile
    const profileAccounts = lateData.accounts.filter(
      acc => acc.profileId._id === profile.lateId
    );

    console.log('📊 Accounts for this profile:', profileAccounts.length);

    // Update or create social accounts in database
    const updatedAccounts = [];
    const errors = [];

    for (const account of profileAccounts) {
      try {
        const socialAccount = await prisma.socialAccount.upsert({
          where: {
            lateProfileId_platform: {
              lateProfileId: profile.id,
              platform: account.platform
            }
          },
          update: {
            accountId: account._id,
            username: account.username || account.displayName,
            displayName: account.displayName || account.username,
            profilePicture: account.profilePicture || null,
            isActive: true,
            updatedAt: new Date()
          },
          create: {
            lateProfileId: profile.id,
            platform: account.platform,
            accountId: account._id,
            username: account.username || account.displayName,
            displayName: account.displayName || account.username,
            profilePicture: account.profilePicture || null,
            isActive: true
          }
        });

        updatedAccounts.push(socialAccount);
        console.log(`✅ Updated ${account.platform} account:`, socialAccount.username);

      } catch (error) {
        console.error(`❌ Failed to update ${account.platform} account:`, error);
        errors.push({
          platform: account.platform,
          error: error.message
        });
      }
    }

    // Return results
    return NextResponse.json({
      success: true,
      message: `Successfully synced ${updatedAccounts.length} accounts`,
      accounts: updatedAccounts.map(acc => ({
        platform: acc.platform,
        username: acc.username,
        lateAccountId: acc.lateAccountId
      })),
      hasAnalyticsAccess: lateData.hasAnalyticsAccess || false,
      ...(errors.length > 0 && { errors })
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Failed to sync accounts:', error);
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to sync accounts',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to manually trigger sync
export async function GET(request) {
  return POST(request);
}
