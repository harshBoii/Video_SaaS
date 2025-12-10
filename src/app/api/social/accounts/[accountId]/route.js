import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { getCompanyFromToken } from '@/app/lib/auth';

/**
 * DELETE /api/social/accounts/[accountId]
 * Disconnects a social account from Late and removes from database
 */
export async function DELETE(request, { params }) {
  try {
    const { accountId } = await params;
    const companyId = await getCompanyFromToken(request);

    if (!companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the account in database
    const account = await prisma.socialAccount.findFirst({
      where: {
        accountId: accountId,
        companyId: companyId
      }
    });

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    console.log(`🗑️ Deleting account from Late: ${account.platform} (@${account.username})`);

    // Call Late API to disconnect the account
    const lateResponse = await fetch(
      `https://getlate.dev/api/v1/accounts/${accountId}`,
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
      console.error('❌ Late API error:', errorData);
      
      // If Late returns 404, the account might already be deleted there
      // Continue with local deletion
      if (lateResponse.status !== 404) {
        throw new Error(errorData.message || 'Failed to disconnect account from Late');
      }
    }

    // Delete from local database
    await prisma.socialAccount.delete({
      where: { id: account.id }
    });

    console.log(`✅ Account deleted successfully: ${account.platform}`);

    return NextResponse.json({
      success: true,
      message: `${account.platform} account disconnected successfully`
    });

  } catch (error) {
    console.error('❌ Failed to delete account:', error);
    
    return NextResponse.json(
      {
        error: error.message || 'Failed to disconnect account',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
