import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import prisma from './prisma';
import { ApiResponse } from './api-response';

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

export async function verifyJWT(request) {
  try {
    let token;

    // 1. Try to get token from cookies (your primary method)
    token = request.cookies.get('token')?.value;

    // 2. Fallback to Authorization header (for API clients)
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    // 3. Check if token exists
    if (!token) {
      return { error: 'Missing authentication token', status: 401 };
    }

    // 4. Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 5. Get employee from database
    const employee = await prisma.employee.findUnique({
      where: { 
        id: decoded.id, // Your JWT uses 'id' field
      },
      select: {
        id: true,
        email: true,
        companyId: true,
        is_admin: true,
        status: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!employee) {
      return { error: 'Employee not found', status: 404 };
    }

    if (employee.status !== 'ACTIVE') {
      return { error: 'Account is not active', status: 403 };
    }

    return { employee };

  } catch (error) {
    console.error('JWT verification error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return { error: 'Invalid token', status: 401 };
    }
    if (error.name === 'TokenExpiredError') {
      return { error: 'Token expired', status: 401 };
    }
    return { error: 'Authentication failed', status: 500 };
  }
}

// Helper to check if user is admin
export function requireAdmin(employee) {
  if (!employee.is_admin) {
    return { error: 'Admin access required', status: 403 };
  }
  return null;
}
