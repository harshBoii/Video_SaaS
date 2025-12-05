// lib/validation.js
// Production-grade Zod schemas for video management API

import { z } from 'zod'; // ✅ ES modules

// ===================== COMMON SCHEMAS =====================

/**
 * Common ID validation (CUID format)
 */
export const cuidSchema = z.string().cuid();

/**
 * Pagination schema for list endpoints
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Date range filter
 */
export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// ===================== PROJECT SCHEMAS =====================

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255, 'Name too long'),
  description: z.string().max(5000, 'Description too long').optional(),
  companyId: cuidSchema,
  adminId: cuidSchema,
  teamId: cuidSchema.optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).optional().nullable(),
  teamId: cuidSchema.optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const listProjectsSchema = paginationSchema.extend({
  companyId: cuidSchema.optional(),
  adminId: cuidSchema.optional(),
  search: z.string().max(255).optional(),
  status: z.enum(['active', 'archived', 'deleted']).optional(),
});

export const projectIdParamSchema = z.object({
  projectId: cuidSchema,
});

// ===================== UPLOAD SCHEMAS =====================

/**
 * Video file MIME types whitelist
 */
export const VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
  'video/webm',
  'video/x-flv',
  'video/3gpp',
  'video/mpeg',
];

/**
 * Start multipart upload validation
 */
export const startUploadSchema = z.object({
  fileName: z
    .string()
    .min(1, 'Filename is required')
    .max(255, 'Filename too long')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Invalid filename characters'),
  fileType: z
    .string()
    .refine((type) => VIDEO_MIME_TYPES.includes(type), {
      message: 'Invalid video file type. Supported: MP4, MOV, AVI, MKV, WEBM, FLV, 3GP, MPEG',
    }),
  fileSize: z
    .number()
    .positive('File size must be positive')
    .max(1000 * 1024 * 1024 * 1024, 'File size cannot exceed 1TB'),
  campaignId: z.string().cuid('Invalid campaign ID'),
  metadata: z
    .object({
      title: z.string().max(500).optional(),
      description: z.string().max(5000).optional(),
      tags: z.array(z.string().max(50)).max(20).optional(),
    })
    .optional(),
});

export const COMPRESSION_THRESHOLD = 25 * 1024 * 1024 * 1024; // 25GB in bytes

/**
 * Upload part validation
 */
export const uploadPartSchema = z.object({
  uploadId: z.string().min(1, 'Upload ID is required'),
  key: z.string().min(1, 'Key is required'),
  partNumber: z.number().int().positive().max(10000, 'Part number too high'),
});

/**
 * Complete multipart upload validation
 */
export const completeUploadSchema = z.object({
  uploadId: z.string().min(1, 'Upload ID is required'),
  key: z.string().min(1, 'Key is required'),
  parts: z
    .array(
      z.object({
        PartNumber: z.number().int().positive(),
        ETag: z.string().min(1, 'ETag is required'),
      })
    )
    .min(1, 'At least one part is required')
    .max(10000, 'Too many parts'),
  videoId: cuidSchema.optional(),
  duration: z.number().optional(), 
});

/**
 * Abort multipart upload validation
 */
export const abortUploadSchema = z.object({
  uploadId: z.string().min(1, 'Upload ID is required'),
  key: z.string().min(1, 'Key is required'),
});

// ===================== COMPRESSION SCHEMAS =====================

export const QUALITY_PRESETS = ['low', 'medium', 'high', 'source'];

export const queueCompressionSchema = z.object({
  videoId: cuidSchema,
  quality: z.enum(QUALITY_PRESETS).default('medium'),
  targetBitrate: z.number().positive().optional(),
  targetResolution: z.string().regex(/^\d{3,4}x\d{3,4}$/).optional(),
  codec: z.enum(['h264', 'h265', 'vp9', 'av1']).default('h264'),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
});

export const compressionStatusSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
});

// ===================== STREAM SCHEMAS =====================

export const streamWebhookSchema = z.object({
  uid: z.string().min(1, 'Stream UID is required'),
  status: z.object({
    state: z.enum(['queued', 'inprogress', 'ready', 'error']),
    errorReasonCode: z.string().optional(),
    errorReasonText: z.string().optional(),
  }),
  meta: z.record(z.string(), z.any()).optional(),
  created: z.string().datetime(),
  modified: z.string().datetime(),
  size: z.number().optional(),
  preview: z.string().url().optional(),
  thumbnail: z.string().url().optional(),
  playback: z
    .object({
      hls: z.string().url().optional(),
      dash: z.string().url().optional(),
    })
    .optional(),
  duration: z.number().optional(),
  input: z
    .object({
      width: z.number().optional(),
      height: z.number().optional(),
    })
    .optional(),
  readyToStream: z.boolean().optional(),
});

export const streamIdParamSchema = z.object({
  streamId: z.string().min(1, 'Stream ID is required'),
});

// ===================== VIDEO SCHEMAS =====================

export const listVideosSchema = paginationSchema.merge(dateRangeSchema).extend({
  projectId: cuidSchema.optional(),
  userId: cuidSchema.optional(),
  status: z.enum(['uploading', 'processing', 'ready', 'error', 'archived']).optional(),
  search: z.string().max(255).optional(),
  tags: z.array(z.string().max(50)).optional(),
});

export const videoIdParamSchema = z.object({
  videoId: cuidSchema,
});

export const updateVideoSchema = z.object({
  title: z.string().max(500).optional(),
  description: z.string().max(5000).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const playbackOptionsSchema = z.object({
  format: z.enum(['hls', 'dash', 'iframe']).default('iframe'),
  autoplay: z.boolean().default(false),
  muted: z.boolean().default(false),
  controls: z.boolean().default(true),
  preload: z.enum(['none', 'metadata', 'auto']).default('metadata'),
});

export const rawDownloadSchema = z.object({
  expiresIn: z.number().int().positive().max(604800).default(3600),
  responseContentType: z.string().max(100).optional(),
  responseContentDisposition: z.enum(['inline', 'attachment']).default('attachment'),
  filename: z.string().max(255).optional(),
});

export const replaceVideoSchema = z.object({
  versionNote: z.string().max(500).optional(),
  autoPromote: z.boolean().default(true),
});

// ===================== LIFECYCLE SCHEMAS =====================

export const archiveVideoSchema = z.object({
  videoIds: z.array(cuidSchema).min(1, 'At least one video ID required').max(100),
  deleteAfterDays: z.number().int().positive().max(365).optional(),
  reason: z.string().max(500).optional(),
});

export const cleanupConfigSchema = z.object({
  dryRun: z.boolean().default(false),
  olderThanDays: z.number().int().positive().min(7).default(30),
  deleteArchivedAfterDays: z.number().int().positive().min(30).default(90),
  status: z.array(z.enum(['error', 'archived', 'abandoned'])).optional(),
  batchSize: z.number().int().positive().max(1000).default(100),
});

// ===================== HEALTH CHECK SCHEMAS =====================

export const healthCheckSchema = z.object({
  service: z.string(),
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  timestamp: z.string().datetime(),
  checks: z.object({
    database: z.boolean(),
    r2: z.boolean(),
    stream: z.boolean(),
    redis: z.boolean().optional(),
  }),
  latency: z
    .object({
      database: z.number().optional(),
      r2: z.number().optional(),
      stream: z.number().optional(),
    })
    .optional(),
});

// ===================== VALIDATION HELPERS =====================

/**
 * Generic validation helper
 */
export function validateData(schema, data) {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Format Zod errors for API response
 */
// export function formatZodError(error) {
//   return error.errors.map((err) => ({
//     field: err.path.join('.'),
//     message: err.message,
//     code: err.code,
//   }));
// }

/**
 * Validate request body (for Next.js route handlers)
 */
export function validateRequestBody(schema) {
  return async (request) => {
    try {
      const body = await request.json();
      return validateData(schema, body);
    } catch (error) {
      return {
        success: false,
        error: { errors: [{ message: 'Invalid JSON body' }] },
      };
    }
  };
}

export function formatZodError(error) {
  // Handle Zod validation errors
  if (error && error.errors && Array.isArray(error.errors)) {
    return error.errors.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    }));
  }
  
  // Handle regular Error objects
  if (error instanceof Error) {
    return [{
      field: "unknown",
      message: error.message,
    }];
  }
  
  // Fallback for unknown error types
  return [{
    field: "unknown",
    message: "Validation error occurred",
  }];
}

export const signupSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  
  email: z.string()
    .email('Invalid email address')
    .toLowerCase()
    .trim(),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password is too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  
  workspaceType: z.enum(['SOLO', 'TEAM', 'ENTERPRISE']).default('SOLO')
});

export function sanitizeMetadata(value) {
  if (!value) return '';
  
  // Convert to string and limit length (max 2KB per metadata value)
  const str = String(value).slice(0, 1024);
  
  // Replace invalid characters with underscores
  // S3/R2 allows: alphanumeric, spaces, and: _ . : / = + - @
  return str
    .replace(/[^\x20-\x7E]/g, '_') // Replace non-ASCII with underscore
    .replace(/[^\w\s.:\/=+\-@]/g, '_'); // Replace invalid chars with underscore
}
