import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { reflectStructure } from '../reflection.js';

const TEST_DIR = '/tmp/folder-seed-reflection-test';

describe('Reflection', () => {
  beforeEach(() => {
    // Create clean test directory
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    // Cleanup test directory
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true });
    }
  });

  describe('reflectStructure()', () => {
    it('should return empty result for non-existent directory', () => {
      const result = reflectStructure('/non/existent/path');

      expect(result.root).toBe('/non/existent/path');
      expect(result.files).toHaveLength(0);
      expect(result.projectType).toBeNull();
      expect(result.patterns).toHaveLength(0);
      expect(result.stats.totalFiles).toBe(0);
    });

    it('should analyze a simple TypeScript library structure', () => {
      // Create test structure
      mkdirSync(join(TEST_DIR, 'src'));
      writeFileSync(join(TEST_DIR, 'src', 'index.ts'), 'export {}');
      writeFileSync(join(TEST_DIR, 'package.json'), '{"name": "test"}');
      writeFileSync(join(TEST_DIR, 'tsconfig.json'), '{}');

      const result = reflectStructure(TEST_DIR);

      expect(result.files.length).toBeGreaterThan(0);
      expect(result.projectType).toBe('typescript-library');
      expect(result.stats.totalFiles).toBeGreaterThan(0);
    });

    it('should detect src directory pattern', () => {
      // Create test structure
      mkdirSync(join(TEST_DIR, 'src'));
      writeFileSync(join(TEST_DIR, 'src', 'index.ts'), 'export {}');
      writeFileSync(join(TEST_DIR, 'src', 'utils.ts'), 'export {}');

      const result = reflectStructure(TEST_DIR);

      const srcPattern = result.patterns.find(
        (p) => p.name === 'src-directory'
      );
      expect(srcPattern).toBeDefined();
      expect(srcPattern?.files.length).toBeGreaterThan(0);
    });

    it('should detect colocated test pattern', () => {
      // Create test structure
      mkdirSync(join(TEST_DIR, 'src'));
      writeFileSync(join(TEST_DIR, 'src', 'utils.ts'), 'export {}');
      writeFileSync(join(TEST_DIR, 'src', 'utils.test.ts'), 'test()');
      writeFileSync(join(TEST_DIR, 'src', 'index.spec.ts'), 'describe()');

      const result = reflectStructure(TEST_DIR);

      const testPattern = result.patterns.find(
        (p) => p.name === 'colocated-tests'
      );
      expect(testPattern).toBeDefined();
      expect(testPattern?.files.length).toBe(2);
    });

    it('should detect dedicated test directory pattern', () => {
      // Create test structure
      mkdirSync(join(TEST_DIR, 'src'));
      mkdirSync(join(TEST_DIR, '__tests__'));
      writeFileSync(join(TEST_DIR, 'src', 'index.ts'), 'export {}');
      writeFileSync(join(TEST_DIR, '__tests__', 'index.test.ts'), 'test()');

      const result = reflectStructure(TEST_DIR);

      const testDirPattern = result.patterns.find(
        (p) => p.name === 'test-directory'
      );
      expect(testDirPattern).toBeDefined();
    });

    it('should detect barrel export pattern', () => {
      // Create test structure
      mkdirSync(join(TEST_DIR, 'src'));
      mkdirSync(join(TEST_DIR, 'src', 'utils'));
      writeFileSync(
        join(TEST_DIR, 'src', 'index.ts'),
        'export * from "./utils"'
      );
      writeFileSync(
        join(TEST_DIR, 'src', 'utils', 'index.ts'),
        'export const foo = 1'
      );

      const result = reflectStructure(TEST_DIR);

      const barrelPattern = result.patterns.find(
        (p) => p.name === 'barrel-exports'
      );
      expect(barrelPattern).toBeDefined();
      expect(barrelPattern?.files.length).toBe(2);
    });

    it('should categorize files correctly', () => {
      // Create test structure with various file types
      mkdirSync(join(TEST_DIR, 'src'));
      mkdirSync(join(TEST_DIR, 'docs'));
      writeFileSync(join(TEST_DIR, 'src', 'index.ts'), 'export {}');
      writeFileSync(join(TEST_DIR, 'src', 'utils.test.ts'), 'test()');
      writeFileSync(join(TEST_DIR, 'package.json'), '{}');
      writeFileSync(join(TEST_DIR, 'README.md'), '# Readme');
      writeFileSync(join(TEST_DIR, 'docs', 'guide.md'), '# Guide');

      const result = reflectStructure(TEST_DIR);

      // Check source files
      const sourceFiles = result.files.filter((f) => f.category === 'source');
      expect(sourceFiles.length).toBeGreaterThan(0);

      // Check test files
      const testFiles = result.files.filter((f) => f.category === 'test');
      expect(testFiles.length).toBe(1);

      // Check config files
      const configFiles = result.files.filter((f) => f.category === 'config');
      expect(configFiles.length).toBeGreaterThan(0);

      // Check documentation files
      const docFiles = result.files.filter(
        (f) => f.category === 'documentation'
      );
      expect(docFiles.length).toBe(2);
    });

    it('should exclude node_modules and .git by default', () => {
      // Create test structure
      mkdirSync(join(TEST_DIR, 'src'));
      mkdirSync(join(TEST_DIR, 'node_modules'));
      mkdirSync(join(TEST_DIR, '.git'));
      writeFileSync(join(TEST_DIR, 'src', 'index.ts'), 'export {}');
      writeFileSync(join(TEST_DIR, 'node_modules', 'package.json'), '{}');
      writeFileSync(join(TEST_DIR, '.git', 'config'), 'git config');

      const result = reflectStructure(TEST_DIR);

      const nodeModulesFiles = result.files.filter((f) =>
        f.path.includes('node_modules')
      );
      expect(nodeModulesFiles).toHaveLength(0);

      const gitFiles = result.files.filter((f) => f.path.includes('.git'));
      expect(gitFiles).toHaveLength(0);
    });

    it('should respect maxDepth option', () => {
      // Create deep structure
      mkdirSync(join(TEST_DIR, 'a', 'b', 'c', 'd', 'e'), { recursive: true });
      writeFileSync(join(TEST_DIR, 'a', 'b', 'c', 'd', 'e', 'deep.ts'), '');
      writeFileSync(join(TEST_DIR, 'a', 'shallow.ts'), '');

      const result = reflectStructure(TEST_DIR, { maxDepth: 2 });

      const deepFile = result.files.find((f) => f.path.includes('deep.ts'));
      const shallowFile = result.files.find((f) =>
        f.path.includes('shallow.ts')
      );

      expect(shallowFile).toBeDefined();
      expect(deepFile).toBeUndefined();
    });

    it('should respect custom exclude option', () => {
      // Create test structure
      mkdirSync(join(TEST_DIR, 'src'));
      mkdirSync(join(TEST_DIR, 'build'));
      writeFileSync(join(TEST_DIR, 'src', 'index.ts'), '');
      writeFileSync(join(TEST_DIR, 'build', 'output.js'), '');

      const result = reflectStructure(TEST_DIR, { exclude: ['build'] });

      const buildFiles = result.files.filter((f) => f.path.includes('build'));
      expect(buildFiles).toHaveLength(0);

      const srcFiles = result.files.filter((f) => f.path.includes('src'));
      expect(srcFiles.length).toBeGreaterThan(0);
    });

    it('should collect accurate statistics', () => {
      // Create test structure
      mkdirSync(join(TEST_DIR, 'src'));
      mkdirSync(join(TEST_DIR, 'lib'));
      writeFileSync(join(TEST_DIR, 'src', 'a.ts'), '');
      writeFileSync(join(TEST_DIR, 'src', 'b.ts'), '');
      writeFileSync(join(TEST_DIR, 'lib', 'c.js'), '');
      writeFileSync(join(TEST_DIR, 'README.md'), '');

      const result = reflectStructure(TEST_DIR);

      expect(result.stats.totalFiles).toBe(4);
      expect(result.stats.totalDirectories).toBe(2);
      expect(result.stats.byExtension['.ts']).toBe(2);
      expect(result.stats.byExtension['.js']).toBe(1);
      expect(result.stats.byExtension['.md']).toBe(1);
    });

    it('should detect React app from package.json', () => {
      // Create test structure
      mkdirSync(join(TEST_DIR, 'src'));
      writeFileSync(join(TEST_DIR, 'src', 'App.tsx'), 'export {}');
      writeFileSync(
        join(TEST_DIR, 'package.json'),
        JSON.stringify({
          dependencies: { react: '^18.0.0', 'react-dom': '^18.0.0' },
        })
      );
      writeFileSync(join(TEST_DIR, 'tsconfig.json'), '{}');

      const result = reflectStructure(TEST_DIR);

      expect(result.projectType).toBe('react-app');
    });

    it('should detect monorepo from nx.json', () => {
      // Create test structure
      mkdirSync(join(TEST_DIR, 'apps'));
      mkdirSync(join(TEST_DIR, 'libs'));
      writeFileSync(join(TEST_DIR, 'nx.json'), '{}');
      writeFileSync(join(TEST_DIR, 'package.json'), '{}');

      const result = reflectStructure(TEST_DIR);

      expect(result.projectType).toBe('monorepo');
    });
  });
});
