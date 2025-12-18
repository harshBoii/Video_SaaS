import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import prisma from './prisma';
import { ApiResponse } from './api-response';
import { NextResponse } from "next/server";
import { verify } from 'jsonwebtoken';

/**
 * Verify and decode JWT token from cookies
 * @returns {Promise<Object|null>} Decoded token or null
 */
async function verifyToken() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return null;
    }

    // Verify and decode JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    return decoded;
  } catch (error) {
    // Token expired, invalid, or malformed
    console.error('Token verification error:', error.message);
    return null;
  }
}

/**
 * Get authenticated user from JWT token
 * @returns {Promise<Object|null>} User object or null
 */
export async function getAuthUser() {
  try {
    const decoded = await verifyToken();
    
    if (!decoded?.id) {
      return null;
    }

    // Fetch full user details from database
    const user = await prisma.employee.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        companyId: true,
        roleId: true,
        is_admin: true,
        status: true,
        role: {
          select: {
            id: true,
            name: true,
            permissions: {
              select: {
                permission: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Check if user exists and is active
    if (!user || user.status !== 'ACTIVE') {
      return null;
    }

    // Add decoded token data to user object for easy access
    return {
      ...user,
      tokenPermissions: decoded.permissions || [],
      tokenRole: decoded.role,
    };
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

/**
 * Get user from token without database query (faster, but less fresh data)
 * Use this for quick permission checks where up-to-date DB data isn't critical
 * @returns {Promise<Object|null>} Decoded token data or null
 */
export async function getAuthUserFromToken() {
  try {
    const decoded = await verifyToken();
    return decoded;
  } catch (error) {
    console.error('Token decode error:', error);
    return null;
  }
}

/**
 * Check if user has specific permission
 * @param {Object} user - User object from getAuthUser()
 * @param {string} permission - Permission name
 * @returns {boolean}
 */
export function hasPermission(user, permission) {
  if (!user) return false;
  
  // Admins have all permissions
  if (user.is_admin) return true;

  // Check from database role permissions (most up-to-date)
  if (user.role?.permissions) {
    const dbPermissions = user.role.permissions.map(p => p.permission.name);
    if (dbPermissions.includes(permission)) return true;
  }

  // Fallback to token permissions (faster but may be stale)
  if (user.tokenPermissions?.includes(permission)) return true;

  return false;
}

/**
 * Check if user has any of the specified permissions
 * @param {Object} user - User object
 * @param {Array<string>} permissions - Array of permission names
 * @returns {boolean}
 */
export function hasAnyPermission(user, permissions) {
  if (!user) return false;
  if (user.is_admin) return true;
  
  return permissions.some(permission => hasPermission(user, permission));
}

/**
 * Check if user has all specified permissions
 * @param {Object} user - User object
 * @param {Array<string>} permissions - Array of permission names
 * @returns {boolean}
 */
export function hasAllPermissions(user, permissions) {
  if (!user) return false;
  if (user.is_admin) return true;
  
  return permissions.every(permission => hasPermission(user, permission));
}

/**
 * Verify user belongs to company
 * @param {Object} user - User object
 * @param {string} companyId - Company ID to verify
 * @returns {boolean}
 */
export function verifyCompanyAccess(user, companyId) {
  if (!user || !companyId) return false;
  return user.companyId === companyId;
}

/**
 * Check if user is admin or super admin
 * @param {Object} user - User object
 * @returns {boolean}
 */
export function isAdmin(user) {
  if (!user) return false;
  return user.is_admin || user.role?.name === 'Admin' || user.role?.name === 'SuperAdmin';
}

/**
 * Check if user is super admin
 * @param {Object} user - User object
 * @returns {boolean}
 */
export function isSuperAdmin(user) {
  if (!user) return false;
  return user.role?.name === 'SuperAdmin';
}

/**
 * Middleware wrapper for protected routes
 * @param {Function} handler - Route handler function
 * @param {Object} options - Options object
 * @param {string} options.permission - Required permission
 * @param {Array<string>} options.permissions - Array of required permissions (any)
 * @param {boolean} options.requireAdmin - Require admin access
 * @param {boolean} options.requireSuperAdmin - Require super admin access
 * @returns {Function} Wrapped handler
 */
export function withAuth(handler, options = {}) {
  return async (request, context) => {
    const user = await getAuthUser();

    // Check authentication
    if (!user) {
      return ApiResponse.unauthorized('Authentication required');
    }

    // Check if token is about to expire (optional: refresh logic)
    const decoded = await verifyToken();
    if (decoded?.exp) {
      const expiresIn = decoded.exp * 1000 - Date.now();
      if (expiresIn < 5 * 60 * 1000) { // Less than 5 minutes
        console.warn('Token expiring soon for user:', user.id);
        // You could implement auto-refresh here
      }
    }

    // Check super admin requirement
    if (options.requireSuperAdmin && !isSuperAdmin(user)) {
      return ApiResponse.forbidden('Super admin access required');
    }

    // Check admin requirement
    if (options.requireAdmin && !isAdmin(user)) {
      return ApiResponse.forbidden('Admin access required');
    }

    // Check single permission
    if (options.permission && !hasPermission(user, options.permission)) {
      return ApiResponse.forbidden(`Missing required permission: ${options.permission}`);
    }

    // Check multiple permissions (any)
    if (options.permissions && !hasAnyPermission(user, options.permissions)) {
      return ApiResponse.forbidden(`Missing required permissions: ${options.permissions.join(', ')}`);
    }

    // Check all permissions required
    if (options.requireAllPermissions && !hasAllPermissions(user, options.requireAllPermissions)) {
      return ApiResponse.forbidden('Insufficient permissions');
    }

    // Add user to request context
    request.user = user;

    return handler(request, context);
  };
}

/**
 * Clear authentication cookie (logout)
 * Use this in logout route
 */
export function clearAuthCookie() {
  const cookieStore = cookies();
  cookieStore.delete('token');
}

/**
 * Generate new JWT token (for token refresh)
 * @param {Object} user - User object from database
 * @returns {string} JWT token
 */
export function generateToken(user) {
  const permissions = user.role?.permissions 
    ? user.role.permissions.map(rp => rp.permission.name)
    : [];

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role?.name,
      permissions,
      companyId: user.companyId,
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

// src/app/lib/auth.js

export async function verifyJWT(req) {
  try {
    const authHeader = req.headers.get("authorization");
    const cookieToken = req.cookies.get("token")?.value;
    const token = authHeader?.replace("Bearer ", "") || cookieToken;

    if (!token) {
      return { error: "No token provided", status: 401 };
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // ✅ FIXED: Your JWT uses 'id', not 'userId'
    const employee = await prisma.employee.findUnique({
      where: { id: decoded.id },  // ✅ Changed from decoded.userId to decoded.id
      select: {
        id: true,
        email: true,
        companyId: true,
        isAdmin: true,
        status: true,
        firstName: true,
        lastName: true,
        role: {
          select: {
            id: true,
            name: true,
            permissions: {
              select: {
                permission: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!employee) {
      return { error: "Employee not found", status: 404 };
    }

    if (employee.status !== "ACTIVE") {
      return { error: "Account is not active", status: 403 };
    }

    // ✅ Transform permissions to match your original structure
    const permissions = employee.role?.permissions?.map(rp => rp.permission.name) || [];

    return { 
      employee: {
        ...employee,
        permissions,
      }, 
      error: null 
    };
  } catch (err) {
    console.error("JWT verification error:", err);
    if (err.name === "TokenExpiredError") {
      return { error: "Token expired", status: 401 };
    }
    return { error: "Invalid token", status: 401 };
  }
}

export function requireAdmin(employee) {
  if (!employee.isAdmin) {
    // return { error: "Admin access required", status: 403 };
    return null;
  }
  return null;
}


export async function authenticateRequest(request) {
  try {
    let token = null;

    // ✅ Try Authorization header first
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    // ✅ Fallback to HTTP-only cookie
    if (!token) {
      token = request.cookies.get("token")?.value;
    }

    if (!token) {
      return {
        authenticated: false,
        error: NextResponse.json(
          {
            success: false,
            error: "Authentication required",
            message: "No token provided",
          },
          { status: 401 }
        ),
      };
    }

    // ✅ Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Verify user still exists and is active
    const user = await prisma.employee.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        isAdmin: true,
        companyId: true,
        roleId: true,
        role: {
          select: {
            id: true,
            name: true,
            permissions: {
              select: {
                permission: {
                  select: {
                    name: true,
                    group: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return {
        authenticated: false,
        error: NextResponse.json(
          {
            success: false,
            error: "User not found",
            message: "The user associated with this token no longer exists",
          },
          { status: 401 }
        ),
      };
    }

    if (user.status !== "ACTIVE") {
      return {
        authenticated: false,
        error: NextResponse.json(
          {
            success: false,
            error: "Account inactive",
            message: `Account status: ${user.status}`,
          },
          { status: 403 }
        ),
      };
    }

    // ✅ Extract permissions for easy checking
    const permissions = user.role
      ? user.role.permissions.map((rp) => rp.permission.name)
      : [];

    return {
      authenticated: true,
      user: {
        ...user,
        permissions,
      },
    };
  } catch (error) {
    console.error("Authentication error:", error);

    // ✅ Handle specific JWT errors
    if (error.name === "JsonWebTokenError") {
      return {
        authenticated: false,
        error: NextResponse.json(
          {
            success: false,
            error: "Invalid token",
            message: "The provided token is malformed or invalid",
          },
          { status: 401 }
        ),
      };
    }

    if (error.name === "TokenExpiredError") {
      return {
        authenticated: false,
        error: NextResponse.json(
          {
            success: false,
            error: "Token expired",
            message: "Please login again",
          },
          { status: 401 }
        ),
      };
    }

    return {
      authenticated: false,
      error: NextResponse.json(
        {
          success: false,
          error: "Authentication failed",
          message: process.env.NODE_ENV === "development" ? error.message : undefined,
        },
        { status: 500 }
      ),
    };
  }
}

/**
 * Check if user has a specific permission
 */
// export function hasPermission(user, permissionName) {
//   if (user.isAdmin) return true; // Super admin has all permissions
//   return user.permissions?.includes(permissionName);
// }

/**
 * Check if user has any of the specified permissions
 */
// export function hasAnyPermission(user, permissionNames) {
//   if (user.isAdmin) return true;
//   return permissionNames.some((perm) => user.permissions?.includes(perm));
// }

// /**
//  * Check if user has all of the specified permissions
//  */
// export function hasAllPermissions(user, permissionNames) {
//   if (user.isAdmin) return true;
//   return permissionNames.every((perm) => user.permissions?.includes(perm));
// }

/**
 * Check if user can access a campaign (is admin, company member, or campaign admin/member)
 */
export async function canAccessCampaign(userId, companyId, campaignId) {
  const user = await prisma.employee.findUnique({
    where: { id: userId },
    select: {
      id: true,
      isAdmin: true,
      companyId: true,
    },
  });

  if (!user) return false;
  if (user.isAdmin) return true; // Super admin
  if (user.companyId !== companyId) return false; // Different company

  // Check if user is campaign admin or assigned to campaign
  const campaign = await prisma.campaign.findFirst({
    where: {
      id: campaignId,
      OR: [
        { adminId: userId }, // Is campaign admin
        { assignments: { some: { employeeId: userId } } }, // Is assigned to campaign
      ],
    },
  });

  return !!campaign;
}
export async function getCompanyFromToken(request) {
  try {
    const token = (await cookies()).get("token")?.value;
    
    if (!token) {
      return null;
    }
    
    const decoded = verify(token, process.env.JWT_SECRET);
    return decoded.companyId;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export function detectAssetType(fileType, fileName) {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  // Video types
  if (fileType.startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(extension)) {
    return 'video';
  }
  
  // Image types
  if (fileType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension)) {
    return 'image';
  }
  
  // Document types
  if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'md'].includes(extension)) {
    return 'document';
  }
  
  return 'unknown';
}

export function detectAssetTypeFromKey(key, fileName) {
  const extension = fileName?.split('.').pop()?.toLowerCase();
  
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(extension)) {
    return 'video';
  }
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension)) {
    return 'image';
  }
  
  if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'md'].includes(extension)) {
    return 'document';
  }
  
  return 'unknown';
}

