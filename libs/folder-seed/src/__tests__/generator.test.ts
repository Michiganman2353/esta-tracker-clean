import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { generateFromProcedure } from '../generator.js';
import type { Procedure } from '../types.js';

const TEST_OUTPUT_DIR = '/tmp/folder-seed-generator-test';

describe('Generator', () => {
  beforeEach(() => {
    // Create clean test directory
    if (existsSync(TEST_OUTPUT_DIR)) {
      rmSync(TEST_OUTPUT_DIR, { recursive: true });
    }
    mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
  });

  afterEach(() => {
    // Cleanup test directory
    if (existsSync(TEST_OUTPUT_DIR)) {
      rmSync(TEST_OUTPUT_DIR, { recursive: true });
    }
  });

  describe('generateFromProcedure()', () => {
    it('should generate files from a simple procedure', () => {
      const procedure: Procedure = {
        schemaVersion: '1.0.0',
        name: 'simple-lib',
        description: 'A simple library',
        type: 'library',
        files: [
          { path: 'index.ts', template: 'export const hello = "world";' },
          { path: 'package.json', template: '{"name": "simple-lib"}' },
        ],
      };

      const result = generateFromProcedure(procedure, {
        variables: {},
        outputDir: TEST_OUTPUT_DIR,
      });

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(2);
      expect(result.errors).toHaveLength(0);

      // Verify files were created
      expect(existsSync(join(TEST_OUTPUT_DIR, 'index.ts'))).toBe(true);
      expect(existsSync(join(TEST_OUTPUT_DIR, 'package.json'))).toBe(true);

      // Verify content
      const indexContent = readFileSync(
        join(TEST_OUTPUT_DIR, 'index.ts'),
        'utf-8'
      );
      expect(indexContent).toBe('export const hello = "world";');
    });

    it('should interpolate variables in paths and templates', () => {
      const procedure: Procedure = {
        schemaVersion: '1.0.0',
        name: 'lib-with-vars',
        description: 'Library with variables',
        type: 'library',
        variables: [
          { name: 'name', type: 'string', required: true },
          { name: 'version', type: 'string', default: '1.0.0' },
        ],
        files: [
          {
            path: '{{name}}/index.ts',
            template: 'export const NAME = "{{name}}";',
          },
          {
            path: '{{name}}/package.json',
            template: '{"name": "{{name}}", "version": "{{version}}"}',
          },
        ],
      };

      const result = generateFromProcedure(procedure, {
        variables: { name: 'my-lib' },
        outputDir: TEST_OUTPUT_DIR,
      });

      expect(result.success).toBe(true);

      // Verify path interpolation
      expect(existsSync(join(TEST_OUTPUT_DIR, 'my-lib', 'index.ts'))).toBe(
        true
      );

      // Verify template interpolation
      const indexContent = readFileSync(
        join(TEST_OUTPUT_DIR, 'my-lib', 'index.ts'),
        'utf-8'
      );
      expect(indexContent).toBe('export const NAME = "my-lib";');

      const pkgContent = readFileSync(
        join(TEST_OUTPUT_DIR, 'my-lib', 'package.json'),
        'utf-8'
      );
      expect(pkgContent).toBe('{"name": "my-lib", "version": "1.0.0"}');
    });

    it('should apply transforms to variables', () => {
      const procedure: Procedure = {
        schemaVersion: '1.0.0',
        name: 'transform-test',
        description: 'Test transforms',
        type: 'library',
        variables: [{ name: 'name', type: 'string', transform: 'PascalCase' }],
        files: [
          {
            path: '{{name}}.ts',
            template: 'export class {{name}} {}',
          },
        ],
      };

      const result = generateFromProcedure(procedure, {
        variables: { name: 'my-service' },
        outputDir: TEST_OUTPUT_DIR,
      });

      expect(result.success).toBe(true);

      // PascalCase transform should convert 'my-service' to 'MyService'
      expect(existsSync(join(TEST_OUTPUT_DIR, 'MyService.ts'))).toBe(true);
      const content = readFileSync(
        join(TEST_OUTPUT_DIR, 'MyService.ts'),
        'utf-8'
      );
      expect(content).toBe('export class MyService {}');
    });

    it('should skip files based on condition', () => {
      const procedure: Procedure = {
        schemaVersion: '1.0.0',
        name: 'conditional-test',
        description: 'Test conditions',
        type: 'library',
        variables: [{ name: 'includeTests', type: 'boolean', default: false }],
        files: [
          { path: 'index.ts', template: 'export {}' },
          {
            path: '__tests__/index.test.ts',
            template: 'test("works", () => {})',
            condition: '{{includeTests}}',
          },
        ],
      };

      const result = generateFromProcedure(procedure, {
        variables: { includeTests: false },
        outputDir: TEST_OUTPUT_DIR,
      });

      expect(result.success).toBe(true);
      expect(existsSync(join(TEST_OUTPUT_DIR, 'index.ts'))).toBe(true);
      expect(existsSync(join(TEST_OUTPUT_DIR, '__tests__'))).toBe(false);

      // Find the skipped file
      const skipped = result.files.find((f) =>
        f.path.includes('index.test.ts')
      );
      expect(skipped?.skipped).toBe(true);
      expect(skipped?.reason).toBe('Condition not met');
    });

    it('should generate files when condition is true', () => {
      const procedure: Procedure = {
        schemaVersion: '1.0.0',
        name: 'conditional-test',
        description: 'Test conditions',
        type: 'library',
        files: [
          { path: 'index.ts', template: 'export {}' },
          {
            path: '__tests__/index.test.ts',
            template: 'test("works", () => {})',
            condition: '{{includeTests}}',
          },
        ],
      };

      const result = generateFromProcedure(procedure, {
        variables: { includeTests: true },
        outputDir: TEST_OUTPUT_DIR,
      });

      expect(result.success).toBe(true);
      expect(
        existsSync(join(TEST_OUTPUT_DIR, '__tests__', 'index.test.ts'))
      ).toBe(true);
    });

    it('should fail when required variables are missing', () => {
      const procedure: Procedure = {
        schemaVersion: '1.0.0',
        name: 'required-vars',
        description: 'Test required variables',
        type: 'library',
        variables: [
          { name: 'name', type: 'string', required: true },
          { name: 'optional', type: 'string', required: false },
        ],
        files: [{ path: 'index.ts', template: '{{name}}' }],
      };

      const result = generateFromProcedure(procedure, {
        variables: { optional: 'value' },
        outputDir: TEST_OUTPUT_DIR,
      });

      expect(result.success).toBe(false);
      expect(result.errors.some((e) => e.includes('name'))).toBe(true);
    });

    it('should not overwrite existing files by default', () => {
      // Create existing file
      const existingPath = join(TEST_OUTPUT_DIR, 'index.ts');
      mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
      writeFileSync(existingPath, 'original content', 'utf-8');

      const procedure: Procedure = {
        schemaVersion: '1.0.0',
        name: 'no-overwrite',
        description: 'Test no overwrite',
        type: 'library',
        files: [{ path: 'index.ts', template: 'new content' }],
      };

      const result = generateFromProcedure(procedure, {
        variables: {},
        outputDir: TEST_OUTPUT_DIR,
      });

      expect(result.success).toBe(true);
      const skipped = result.files.find((f) => f.path === 'index.ts');
      expect(skipped?.skipped).toBe(true);
      expect(skipped?.reason).toBe('File already exists');

      // Verify original content preserved
      const content = readFileSync(existingPath, 'utf-8');
      expect(content).toBe('original content');
    });

    it('should overwrite existing files when overwrite is true', () => {
      // Create existing file
      const existingPath = join(TEST_OUTPUT_DIR, 'index.ts');
      mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
      writeFileSync(existingPath, 'original content', 'utf-8');

      const procedure: Procedure = {
        schemaVersion: '1.0.0',
        name: 'with-overwrite',
        description: 'Test overwrite',
        type: 'library',
        files: [{ path: 'index.ts', template: 'new content', overwrite: true }],
      };

      const result = generateFromProcedure(procedure, {
        variables: {},
        outputDir: TEST_OUTPUT_DIR,
      });

      expect(result.success).toBe(true);
      const generated = result.files.find((f) => f.path === 'index.ts');
      expect(generated?.skipped).toBe(false);

      // Verify new content
      const content = readFileSync(existingPath, 'utf-8');
      expect(content).toBe('new content');
    });

    it('should perform dry run without writing files', () => {
      const procedure: Procedure = {
        schemaVersion: '1.0.0',
        name: 'dry-run',
        description: 'Test dry run',
        type: 'library',
        files: [
          { path: 'index.ts', template: 'content' },
          { path: 'package.json', template: '{}' },
        ],
      };

      const result = generateFromProcedure(procedure, {
        variables: {},
        outputDir: TEST_OUTPUT_DIR,
        dryRun: true,
      });

      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(2);

      // Verify no files were created
      expect(existsSync(join(TEST_OUTPUT_DIR, 'index.ts'))).toBe(false);
      expect(existsSync(join(TEST_OUTPUT_DIR, 'package.json'))).toBe(false);

      // But content should be available
      const indexFile = result.files.find((f) => f.path === 'index.ts');
      expect(indexFile?.content).toBe('content');
    });

    it('should apply all transform types correctly', () => {
      const procedure: Procedure = {
        schemaVersion: '1.0.0',
        name: 'all-transforms',
        description: 'Test all transforms',
        type: 'library',
        variables: [
          { name: 'camel', type: 'string', transform: 'camelCase' },
          { name: 'pascal', type: 'string', transform: 'PascalCase' },
          { name: 'kebab', type: 'string', transform: 'kebab-case' },
          { name: 'upper', type: 'string', transform: 'UPPER_CASE' },
          { name: 'lower', type: 'string', transform: 'lower_case' },
        ],
        files: [
          {
            path: 'output.txt',
            template: '{{camel}} {{pascal}} {{kebab}} {{upper}} {{lower}}',
          },
        ],
      };

      const result = generateFromProcedure(procedure, {
        variables: {
          camel: 'my-test-name',
          pascal: 'my-test-name',
          kebab: 'myTestName',
          upper: 'my-test-name',
          lower: 'MyTestName',
        },
        outputDir: TEST_OUTPUT_DIR,
      });

      expect(result.success).toBe(true);
      const content = readFileSync(
        join(TEST_OUTPUT_DIR, 'output.txt'),
        'utf-8'
      );
      expect(content).toBe(
        'myTestName MyTestName my-test-name MY_TEST_NAME my_test_name'
      );
    });
  });
});
