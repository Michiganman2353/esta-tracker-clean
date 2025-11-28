import { describe, it, expect } from 'vitest';
import {
  validateProcedure,
  validateProcedureOrThrow,
  schema,
} from '../validator.js';
import type { Procedure } from '../types.js';

describe('Procedure Validation', () => {
  describe('schema', () => {
    it('should export the schema object', () => {
      expect(schema).toBeDefined();
      expect((schema as Record<string, unknown>)['$schema']).toBe(
        'http://json-schema.org/draft-07/schema#'
      );
      expect((schema as Record<string, unknown>)['title']).toBe(
        'Procedure Template v1'
      );
    });
  });

  describe('validateProcedure()', () => {
    it('should return valid for a correct minimal procedure', () => {
      const procedure = {
        schemaVersion: '1.0.0',
        name: 'test-procedure',
        description: 'A test procedure',
        type: 'library',
        files: [{ path: 'index.ts', template: 'export {}' }],
      };

      const result = validateProcedure(procedure);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return valid for a complete procedure with variables', () => {
      const procedure: Procedure = {
        schemaVersion: '1.0.0',
        name: 'complete-procedure',
        description: 'A complete test procedure',
        type: 'service',
        targetDir: 'libs',
        variables: [
          {
            name: 'serviceName',
            type: 'string',
            description: 'Name of the service',
            required: true,
            transform: 'PascalCase',
          },
          {
            name: 'includeTests',
            type: 'boolean',
            default: true,
          },
        ],
        files: [
          {
            path: '{{serviceName}}/index.ts',
            template: 'export class {{serviceName}}Service {}',
          },
          {
            path: '{{serviceName}}/__tests__/index.test.ts',
            template: 'describe("{{serviceName}}", () => {})',
            condition: '{{includeTests}}',
          },
        ],
        postGenerate: ['npm install'],
      };

      const result = validateProcedure(procedure);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid when schemaVersion is missing', () => {
      const procedure = {
        name: 'test-procedure',
        description: 'A test procedure',
        type: 'library',
        files: [{ path: 'index.ts' }],
      };

      const result = validateProcedure(procedure);
      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e) => e.message?.includes('schemaVersion'))
      ).toBe(true);
    });

    it('should return invalid when name is missing', () => {
      const procedure = {
        schemaVersion: '1.0.0',
        description: 'A test procedure',
        type: 'library',
        files: [{ path: 'index.ts' }],
      };

      const result = validateProcedure(procedure);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message?.includes('name'))).toBe(true);
    });

    it('should return invalid when name has invalid format', () => {
      const procedure = {
        schemaVersion: '1.0.0',
        name: 'Invalid Name!',
        description: 'A test procedure',
        type: 'library',
        files: [{ path: 'index.ts' }],
      };

      const result = validateProcedure(procedure);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.path.includes('name'))).toBe(true);
    });

    it('should return invalid when type is not in enum', () => {
      const procedure = {
        schemaVersion: '1.0.0',
        name: 'test-procedure',
        description: 'A test procedure',
        type: 'invalid-type',
        files: [{ path: 'index.ts' }],
      };

      const result = validateProcedure(procedure);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.path.includes('type'))).toBe(true);
    });

    it('should return invalid when files array is empty', () => {
      const procedure = {
        schemaVersion: '1.0.0',
        name: 'test-procedure',
        description: 'A test procedure',
        type: 'library',
        files: [],
      };

      const result = validateProcedure(procedure);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.path.includes('files'))).toBe(true);
    });

    it('should return invalid when file is missing path', () => {
      const procedure = {
        schemaVersion: '1.0.0',
        name: 'test-procedure',
        description: 'A test procedure',
        type: 'library',
        files: [{ template: 'content' }],
      };

      const result = validateProcedure(procedure);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.message?.includes('path'))).toBe(true);
    });

    it('should return invalid for additional properties', () => {
      const procedure = {
        schemaVersion: '1.0.0',
        name: 'test-procedure',
        description: 'A test procedure',
        type: 'library',
        files: [{ path: 'index.ts' }],
        unknownField: 'should fail',
      };

      const result = validateProcedure(procedure);
      expect(result.valid).toBe(false);
    });

    it('should accept all valid procedure types', () => {
      const types = ['library', 'component', 'service', 'feature', 'module'];
      for (const type of types) {
        const procedure = {
          schemaVersion: '1.0.0',
          name: 'test-procedure',
          description: 'A test procedure',
          type,
          files: [{ path: 'index.ts' }],
        };
        const result = validateProcedure(procedure);
        expect(result.valid).toBe(true);
      }
    });

    it('should accept all valid variable types', () => {
      const varTypes = ['string', 'boolean', 'number', 'choice'];
      for (const varType of varTypes) {
        const procedure = {
          schemaVersion: '1.0.0',
          name: 'test-procedure',
          description: 'A test procedure',
          type: 'library',
          variables: [{ name: 'testVar', type: varType }],
          files: [{ path: 'index.ts' }],
        };
        const result = validateProcedure(procedure);
        expect(result.valid).toBe(true);
      }
    });

    it('should accept all valid transform types', () => {
      const transforms = [
        'camelCase',
        'PascalCase',
        'kebab-case',
        'UPPER_CASE',
        'lower_case',
      ];
      for (const transform of transforms) {
        const procedure = {
          schemaVersion: '1.0.0',
          name: 'test-procedure',
          description: 'A test procedure',
          type: 'library',
          variables: [{ name: 'testVar', type: 'string', transform }],
          files: [{ path: 'index.ts' }],
        };
        const result = validateProcedure(procedure);
        expect(result.valid).toBe(true);
      }
    });
  });

  describe('validateProcedureOrThrow()', () => {
    it('should not throw for valid procedure', () => {
      const procedure = {
        schemaVersion: '1.0.0',
        name: 'test-procedure',
        description: 'A test procedure',
        type: 'library',
        files: [{ path: 'index.ts' }],
      };

      expect(() => validateProcedureOrThrow(procedure)).not.toThrow();
    });

    it('should throw for invalid procedure', () => {
      const procedure = {
        name: 'test-procedure',
      };

      expect(() => validateProcedureOrThrow(procedure)).toThrow(
        'Procedure validation failed'
      );
    });

    it('should include error details in thrown error', () => {
      const procedure = {
        name: 'test-procedure',
      };

      try {
        validateProcedureOrThrow(procedure);
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).toContain(
          'Procedure validation failed'
        );
        expect((error as Error).message).toContain('schemaVersion');
      }
    });

    it('should return the validated procedure', () => {
      const procedure = {
        schemaVersion: '1.0.0',
        name: 'test-procedure',
        description: 'A test procedure',
        type: 'library',
        files: [{ path: 'index.ts' }],
      };

      const result = validateProcedureOrThrow(procedure);
      expect(result).toEqual(procedure);
    });
  });
});
