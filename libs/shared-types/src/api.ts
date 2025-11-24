import { z } from 'zod';

/**
 * API Types and Schemas
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  metadata?: {
    timestamp: string;
    requestId?: string;
    page?: number;
    totalPages?: number;
    totalItems?: number;
  };
}

export const ApiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.object({
      code: z.string(),
      message: z.string(),
      details: z.unknown().optional(),
    }).optional(),
    metadata: z.object({
      timestamp: z.string(),
      requestId: z.string().optional(),
      page: z.number().optional(),
      totalPages: z.number().optional(),
      totalItems: z.number().optional(),
    }).optional(),
  });

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const PaginationParamsSchema = z.object({
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export interface ErrorResponse {
  code: string;
  message: string;
  statusCode: number;
  details?: unknown;
}

export const ErrorResponseSchema = z.object({
  code: z.string(),
  message: z.string(),
  statusCode: z.number(),
  details: z.unknown().optional(),
});
