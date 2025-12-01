import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { signupSchema } from '@/app/lib/validation';
const prisma = new PrismaClient();


// Rate limiting
const rateLimitMap = new Map();

function checkRateLimit(identifier, maxRequests = 5, windowMs = 60000) {
  const now = Date.now();
  const userRequests = rateLimitMap.get(identifier) || [];
  const recentRequests = userRequests.filter(time => now - time < windowMs);
  
  if (recentRequests.length >= maxRequests) {
    return false;
  }
  
  recentRequests.push(now);
  rateLimitMap.set(identifier, recentRequests);
  return true;
}

export async function POST(request) {
  try {
    // 1. Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    if (!checkRateLimit(ip, 5, 60000)) {
      return NextResponse.json(
        { 
          error: 'Too many signup attempts. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED'
        },
        { status: 429 }
      );
    }

    // 2. Parse request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        {
          error: 'Invalid JSON in request body',
          code: 'INVALID_JSON'
        },
        { status: 400 }
      );
    }

    // 3. Validate data
    const validatedData = signupSchema.parse(body);

    // 4. Check if email already exists
    const existingUser = await prisma.employee.findUnique({
      where: { email: validatedData.email },
      select: { id: true }
    });

    if (existingUser) {
      return NextResponse.json(
        { 
          error: 'Email already registered',
          code: 'EMAIL_EXISTS',
          field: 'email'
        },
        { status: 409 }
      );
    }

    // 5. Hash password OUTSIDE transaction to save time
    const passwordHash = await bcrypt.hash(validatedData.password, 12);

    // 6. Extract name from email OUTSIDE transaction
    const emailUsername = validatedData.email.split('@')[0];
    const nameParts = emailUsername.split(/[._-]/);
    const firstName = nameParts[0] 
      ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1)
      : 'User';
    const lastName = nameParts[1] 
      ? nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1)
      : 'Creator';

    // 7. Create everything in a transaction with INCREASED TIMEOUT
    const result = await prisma.$transaction(async (tx) => {
      // Create company for solo creator
      const company = await tx.company.create({
        data: {
          name: `${emailUsername}'s Workspace`,
          email: validatedData.email,
          description: 'Solo Creator Workspace'
        }
      });

      // Create Solo_Creator role (don't check if exists, just create)
      const soloCreatorRole = await tx.role.create({
        data: {
          name: 'Solo_Creator',
          description: 'Solo creator with full access',
          companyId: company.id
        }
      });

      // Create employee
      const employee = await tx.employee.create({
        data: {
          firstName: firstName,
          lastName: lastName,
          email: validatedData.email,
          passwordHash: passwordHash,
          companyId: company.id,
          roleId: soloCreatorRole.id,
          status: 'ACTIVE',
          isAdmin: true
        }
      });

      return { employee, company, role: soloCreatorRole };
    }, {
      maxWait: 10000, // Wait max 10s to get a transaction slot
      timeout: 15000  // Allow transaction to run for 15s (increased from 5s default)
    });

    // 8. Fetch the complete user data AFTER transaction (outside transaction)
    const completeUser = await prisma.employee.findUnique({
      where: { id: result.employee.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        status: true,
        isAdmin: true,
        createdAt: true,
        role: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        company: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // 9. Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully',
        user: completeUser
      },
      { status: 201 }
    );

  } catch (error) {
    // Handle validation errors from Zod
    if (error?.name === 'ZodError' || error?.issues) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.issues?.map(err => ({
            field: err.path.join('.'),
            message: err.message
          })) || []
        },
        { status: 400 }
      );
    }

    // Handle Prisma unique constraint errors
    if (error?.code === 'P2002') {
      return NextResponse.json(
        {
          error: 'Email already exists',
          code: 'UNIQUE_CONSTRAINT_VIOLATION'
        },
        { status: 409 }
      );
    }

    // Handle Prisma timeout errors
    if (error?.code === 'P2028') {
      return NextResponse.json(
        {
          error: 'Request took too long. Please try again.',
          code: 'TRANSACTION_TIMEOUT'
        },
        { status: 408 }
      );
    }

    // Log error for monitoring
    console.error('Signup error:', {
      name: error?.name,
      message: error?.message,
      code: error?.code,
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    });

    // Return generic error
    return NextResponse.json(
      {
        error: error?.message || 'An error occurred during signup. Please try again.',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Block other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' },
    { status: 405 }
  );
}
