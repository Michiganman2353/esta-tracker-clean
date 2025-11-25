/**
 * Zod validation schemas for document operations.
 */

import { z } from 'zod';

/**
 * Allowed content types for document uploads.
 */
const allowedContentTypes = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

/**
 * Schema for requesting an upload URL.
 */
export const documentUploadUrlSchema = z
  .object({
    requestId: z
      .string()
      .trim()
      .min(1, 'Request ID is required'),
    fileName: z
      .string()
      .trim()
      .min(1, 'File name is required')
      .max(255, 'File name must be 255 characters or less')
      .regex(
        /^[a-zA-Z0-9._-]+$/,
        'File name can only contain letters, numbers, dots, underscores, and hyphens'
      ),
    contentType: z.enum(allowedContentTypes, {
      errorMap: () => ({
        message: 'Invalid content type. Allowed: PDF, JPEG, PNG, GIF, DOC, DOCX',
      }),
    }),
  })
  .strict();

export type DocumentUploadUrlInput = z.infer<typeof documentUploadUrlSchema>;

/**
 * Schema for confirming a document upload.
 */
export const documentConfirmSchema = z
  .object({
    documentId: z
      .string()
      .trim()
      .min(1, 'Document ID is required'),
  })
  .strict();

export type DocumentConfirmInput = z.infer<typeof documentConfirmSchema>;

/**
 * Schema for document query parameters.
 */
export const documentQuerySchema = z
  .object({
    requestId: z
      .string()
      .trim()
      .min(1, 'Request ID is required')
      .optional(),
  })
  .strict();

export type DocumentQueryInput = z.infer<typeof documentQuerySchema>;
