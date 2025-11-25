/**
 * Unit tests for validation middleware.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import {
  validate,
  validateBody,
  validateParams,
  validateQuery,
} from '../middleware.js';

// Mock Express Request and Response
function createMockRequest(data: {
  body?: unknown;
  params?: unknown;
  query?: unknown;
  path?: string;
  method?: string;
}) {
  return {
    body: data.body || {},
    params: data.params || {},
    query: data.query || {},
    path: data.path || '/test',
    method: data.method || 'POST',
    headers: {},
  };
}

function createMockResponse() {
  const res: {
    statusCode: number;
    body: unknown;
    status: (code: number) => typeof res;
    json: (data: unknown) => typeof res;
  } = {
    statusCode: 200,
    body: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: unknown) {
      this.body = data;
      return this;
    },
  };
  return res;
}

describe('Validation Middleware', () => {
  const testSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    age: z.number().optional(),
  }).strict();

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('validate', () => {
    it('should pass valid body data', async () => {
      const middleware = validate({ body: testSchema });
      const req = createMockRequest({
        body: { name: 'John', email: 'john@example.com' },
      }) as Parameters<typeof middleware>[0];
      const res = createMockResponse() as Parameters<typeof middleware>[1];
      const next = vi.fn();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledOnce();
      expect((req as { validated?: { body: unknown } }).validated?.body).toEqual({
        name: 'John',
        email: 'john@example.com',
      });
    });

    it('should return 400 for invalid body data', async () => {
      const middleware = validate({ body: testSchema });
      const req = createMockRequest({
        body: { name: '', email: 'invalid' },
      }) as Parameters<typeof middleware>[0];
      const res = createMockResponse() as Parameters<typeof middleware>[1];
      const next = vi.fn();

      await middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(400);
      expect((res.body as { success: boolean }).success).toBe(false);
      expect((res.body as { errors: unknown[] }).errors.length).toBeGreaterThan(0);
    });

    it('should validate params when schema provided', async () => {
      const paramsSchema = z.object({ id: z.string().min(1) });
      const middleware = validate({ params: paramsSchema });
      const req = createMockRequest({
        params: { id: '123' },
      }) as Parameters<typeof middleware>[0];
      const res = createMockResponse() as Parameters<typeof middleware>[1];
      const next = vi.fn();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledOnce();
      expect((req as { validated?: { params: unknown } }).validated?.params).toEqual({ id: '123' });
    });

    it('should validate query when schema provided', async () => {
      const querySchema = z.object({ page: z.coerce.number().min(1) });
      const middleware = validate({ query: querySchema });
      const req = createMockRequest({
        query: { page: '5' },
      }) as Parameters<typeof middleware>[0];
      const res = createMockResponse() as Parameters<typeof middleware>[1];
      const next = vi.fn();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledOnce();
      expect((req as { validated?: { query: unknown } }).validated?.query).toEqual({ page: 5 });
    });

    it('should collect errors from multiple sources', async () => {
      const bodySchema = z.object({ name: z.string().min(1) });
      const querySchema = z.object({ page: z.coerce.number().min(1) });
      const middleware = validate({ body: bodySchema, query: querySchema });
      const req = createMockRequest({
        body: { name: '' },
        query: { page: '0' },
      }) as Parameters<typeof middleware>[0];
      const res = createMockResponse() as Parameters<typeof middleware>[1];
      const next = vi.fn();

      await middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(400);
      const errors = (res.body as { errors: Array<{ field: string }> }).errors;
      expect(errors.length).toBeGreaterThanOrEqual(2);
    });

    it('should reject unknown fields when schema is strict', async () => {
      const middleware = validate({ body: testSchema });
      const req = createMockRequest({
        body: { name: 'John', email: 'john@example.com', unknown: 'field' },
      }) as Parameters<typeof middleware>[0];
      const res = createMockResponse() as Parameters<typeof middleware>[1];
      const next = vi.fn();

      await middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(400);
    });
  });

  describe('validateBody', () => {
    it('should validate body only', async () => {
      const middleware = validateBody(testSchema);
      const req = createMockRequest({
        body: { name: 'John', email: 'john@example.com' },
      }) as Parameters<typeof middleware>[0];
      const res = createMockResponse() as Parameters<typeof middleware>[1];
      const next = vi.fn();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });
  });

  describe('validateParams', () => {
    it('should validate params only', async () => {
      const paramsSchema = z.object({ id: z.string().min(1) });
      const middleware = validateParams(paramsSchema);
      const req = createMockRequest({
        params: { id: '123' },
      }) as Parameters<typeof middleware>[0];
      const res = createMockResponse() as Parameters<typeof middleware>[1];
      const next = vi.fn();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });
  });

  describe('validateQuery', () => {
    it('should validate query only', async () => {
      const querySchema = z.object({ search: z.string().optional() });
      const middleware = validateQuery(querySchema);
      const req = createMockRequest({
        query: { search: 'test' },
      }) as Parameters<typeof middleware>[0];
      const res = createMockResponse() as Parameters<typeof middleware>[1];
      const next = vi.fn();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });
  });

  describe('Error Response Format', () => {
    it('should return structured error response', async () => {
      const middleware = validateBody(testSchema);
      const req = createMockRequest({
        body: { email: 'invalid' },
      }) as Parameters<typeof middleware>[0];
      const res = createMockResponse() as Parameters<typeof middleware>[1];
      const next = vi.fn();

      await middleware(req, res, next);

      expect(res.statusCode).toBe(400);
      const body = res.body as { success: boolean; errors: Array<{ field: string; message: string }> };
      expect(body.success).toBe(false);
      expect(Array.isArray(body.errors)).toBe(true);
      expect(body.errors[0]).toHaveProperty('field');
      expect(body.errors[0]).toHaveProperty('message');
    });
  });
});
