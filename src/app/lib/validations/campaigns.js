import { z } from 'zod';

/**
 * Campaign validation schemas using Zod
 * Provides type-safe validation with detailed error messages
 */

export const createCampaignSchema = z.object({
  name: z
    .string()
    .min(3, 'Campaign name must be at least 3 characters')
    .max(100, 'Campaign name must not exceed 100 characters')
    .trim()
    .regex(/^[a-zA-Z0-9\s\-_&.,!]+$/, 'Campaign name contains invalid characters'),
  
  companyId: z
    .string()
    .cuid('Invalid company ID format'),
  
  adminId: z
    .string()
    .cuid('Invalid admin ID format'),
  
  teamId: z
    .string()
    .cuid('Invalid team ID format')
    .optional()
    .nullable(),
  
  description: z
    .string()
    .max(500, 'Description must not exceed 500 characters')
    .optional()
    .nullable(),
});

export const updateCampaignSchema = z.object({
  name: z
    .string()
    .min(3, 'Campaign name must be at least 3 characters')
    .max(100, 'Campaign name must not exceed 100 characters')
    .trim()
    .regex(/^[a-zA-Z0-9\s\-_&.,!]+$/, 'Campaign name contains invalid characters')
    .optional(),
  
  adminId: z
    .string()
    .cuid('Invalid admin ID format')
    .optional(),
  
  teamId: z
    .string()
    .cuid('Invalid team ID format')
    .optional()
    .nullable(),
  
  description: z
    .string()
    .max(500, 'Description must not exceed 500 characters')
    .optional()
    .nullable(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

export const campaignQuerySchema = z.object({
  companyId: z.string().cuid('Invalid company ID format'),
  
  search: z
    .string()
    .max(100, 'Search query too long')
    .optional(),
  
  cursor: z
    .string()
    .cuid('Invalid cursor format')
    .optional(),
  
  take: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0 && val <= 100, {
      message: 'Take must be between 1 and 100',
    })
    .default('50'),
  
  sortBy: z
    .enum(['name', 'createdAt', 'updatedAt'])
    .default('updatedAt'),
  
  sortOrder: z
    .enum(['asc', 'desc'])
    .default('desc'),
});

/**
 * Helper to format Zod errors for API response
 */
export function formatZodErrors(error) {
  const formattedErrors = {};
  
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    if (!formattedErrors[path]) {
      formattedErrors[path] = [];
    }
    formattedErrors[path].push(err.message);
  });
  
  return formattedErrors;
}
