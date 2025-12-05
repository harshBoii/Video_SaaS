import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { signupSchema } from '@/app/lib/validation';


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

    // 2. Parse and validate
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body', code: 'INVALID_JSON' },
        { status: 400 }
      );
    }

    const validatedData = signupSchema.parse(body);

    // 3. Check if email exists
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

    // 4. Hash password
    const passwordHash = await bcrypt.hash(validatedData.password, 12);

    // 5. Parse name
    const nameParts = validatedData.name.trim().split(' ');
    const firstName = nameParts[0] || 'User';
    const lastName = nameParts.slice(1).join(' ') || '';

    // 6. Determine company name based on workspace type
    const workspaceNames = {
      SOLO: `${firstName}'s Workspace`,
      TEAM: `${firstName}'s Team`,
      ENTERPRISE: `${firstName}'s Organization`
    };

    // 7. Create everything in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create company
      const company = await tx.company.create({
        data: {
          name: workspaceNames[validatedData.workspaceType],
          email: validatedData.email,
          description: `${validatedData.workspaceType} workspace`,
          // Add workspace type to company metadata if you have this field
          // workspaceType: validatedData.workspaceType
        }
      });

      // Create role based on workspace type
      const roleNames = {
        SOLO: 'Solo_Creator',
        TEAM: 'Team_Admin',
        ENTERPRISE: 'Enterprise_Admin'
      };

      const role = await tx.role.create({
        data: {
          name: roleNames[validatedData.workspaceType],
          description: `${validatedData.workspaceType} administrator with full access`,
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
          roleId: role.id,
          status: 'ACTIVE',
          isAdmin: true
        }
      });

      return { employee, company, role };
    }, {
      maxWait: 10000,
      timeout: 15000
    });

    // 8. Fetch complete user data
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

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully',
        user: completeUser
      },
      { status: 201 }
    );

  } catch (error) {
    // Handle validation errors
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

    // Handle Prisma errors
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Email already exists', code: 'UNIQUE_CONSTRAINT_VIOLATION' },
        { status: 409 }
      );
    }

    if (error?.code === 'P2028') {
      return NextResponse.json(
        { error: 'Request took too long. Please try again.', code: 'TRANSACTION_TIMEOUT' },
        { status: 408 }
      );
    }

    console.error('Signup error:', {
      name: error?.name,
      message: error?.message,
      code: error?.code,
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    });

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

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' },
    { status: 405 }
  );
}
