/**
 * Reflection/introspection utilities for analyzing existing code structures
 */

import { readdirSync, statSync, readFileSync, existsSync } from 'fs';
import { join, relative, extname, basename } from 'path';

export interface FileInfo {
  /** Relative path from the root directory */
  path: string;
  /** File name without extension */
  name: string;
  /** File extension (including dot) */
  extension: string;
  /** Whether this is a directory */
  isDirectory: boolean;
  /** Size in bytes (0 for directories) */
  size: number;
  /** Detected file type category */
  category: FileCategory;
}

export type FileCategory =
  | 'source'
  | 'test'
  | 'config'
  | 'documentation'
  | 'asset'
  | 'data'
  | 'unknown';

export interface ReflectionResult {
  /** Root directory that was analyzed */
  root: string;
  /** All files found in the structure */
  files: FileInfo[];
  /** Detected project type */
  projectType: ProjectType | null;
  /** Detected patterns */
  patterns: DetectedPattern[];
  /** Statistics about the structure */
  stats: ReflectionStats;
}

export type ProjectType =
  | 'typescript-library'
  | 'typescript-app'
  | 'javascript-library'
  | 'javascript-app'
  | 'react-app'
  | 'node-app'
  | 'monorepo';

export interface DetectedPattern {
  name: string;
  description: string;
  files: string[];
}

export interface ReflectionStats {
  totalFiles: number;
  totalDirectories: number;
  byCategory: Record<FileCategory, number>;
  byExtension: Record<string, number>;
}

const EXTENSION_CATEGORIES: Record<string, FileCategory> = {
  '.ts': 'source',
  '.tsx': 'source',
  '.js': 'source',
  '.jsx': 'source',
  '.mjs': 'source',
  '.cjs': 'source',
  '.json': 'config',
  '.yaml': 'config',
  '.yml': 'config',
  '.toml': 'config',
  '.md': 'documentation',
  '.mdx': 'documentation',
  '.txt': 'documentation',
  '.png': 'asset',
  '.jpg': 'asset',
  '.jpeg': 'asset',
  '.svg': 'asset',
  '.gif': 'asset',
  '.ico': 'asset',
  '.css': 'asset',
  '.scss': 'asset',
  '.less': 'asset',
  '.html': 'asset',
};

const TEST_PATTERNS = ['.test.', '.spec.', '__tests__', '__mocks__'];
const CONFIG_FILENAMES = [
  'package.json',
  'tsconfig.json',
  'jest.config',
  'vitest.config',
  '.eslintrc',
  'eslint.config',
  '.prettierrc',
  'nx.json',
  'project.json',
];

/**
 * Categorizes a file based on its path and extension
 */
function categorizeFile(path: string, extension: string): FileCategory {
  // Check for test files
  if (TEST_PATTERNS.some((p) => path.includes(p))) {
    return 'test';
  }

  // Check for config files
  if (CONFIG_FILENAMES.some((c) => path.includes(c))) {
    return 'config';
  }

  // Use extension-based categorization
  const category = EXTENSION_CATEGORIES[extension.toLowerCase()];
  if (category) {
    // JSON files in src are likely data, not config
    if (extension === '.json' && path.includes('/src/')) {
      return 'data';
    }
    return category;
  }

  return 'unknown';
}

/**
 * Recursively scans a directory and collects file information
 */
function scanDirectory(
  rootPath: string,
  currentPath: string,
  files: FileInfo[],
  stats: ReflectionStats,
  options: { maxDepth: number; currentDepth: number; exclude: string[] }
): void {
  if (options.currentDepth > options.maxDepth) {
    return;
  }

  let entries: string[];
  try {
    entries = readdirSync(currentPath);
  } catch {
    return; // Skip inaccessible directories
  }

  for (const entry of entries) {
    // Skip excluded paths
    if (options.exclude.some((e) => entry === e || entry.startsWith(e))) {
      continue;
    }

    const fullPath = join(currentPath, entry);
    const relativePath = relative(rootPath, fullPath);

    let entryStat;
    try {
      entryStat = statSync(fullPath);
    } catch {
      continue; // Skip inaccessible files
    }

    const isDirectory = entryStat.isDirectory();
    const extension = isDirectory ? '' : extname(entry);
    const name = basename(entry, extension);
    const category = isDirectory
      ? 'unknown'
      : categorizeFile(relativePath, extension);

    const fileInfo: FileInfo = {
      path: relativePath,
      name,
      extension,
      isDirectory,
      size: isDirectory ? 0 : entryStat.size,
      category,
    };

    files.push(fileInfo);

    if (isDirectory) {
      stats.totalDirectories++;
      scanDirectory(rootPath, fullPath, files, stats, {
        ...options,
        currentDepth: options.currentDepth + 1,
      });
    } else {
      stats.totalFiles++;
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
      if (extension) {
        stats.byExtension[extension] = (stats.byExtension[extension] || 0) + 1;
      }
    }
  }
}

/**
 * Detects the project type based on files found
 */
function detectProjectType(
  files: FileInfo[],
  rootPath: string
): ProjectType | null {
  const hasPackageJson = files.some((f) => f.path === 'package.json');
  const hasTsConfig = files.some((f) => f.path === 'tsconfig.json');
  const hasNxJson = files.some((f) => f.path === 'nx.json');
  const hasLernaJson = files.some((f) => f.path === 'lerna.json');

  // Check for monorepo indicators
  if (hasNxJson || hasLernaJson) {
    return 'monorepo';
  }

  // Check for React
  if (hasPackageJson) {
    try {
      const pkgPath = join(rootPath, 'package.json');
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if ('react' in deps || 'react-dom' in deps) {
        return 'react-app';
      }
    } catch {
      // Ignore parse errors
    }
  }

  // Check for TypeScript
  if (hasTsConfig) {
    const hasIndex = files.some(
      (f) => f.path === 'src/index.ts' || f.path === 'index.ts'
    );
    return hasIndex ? 'typescript-library' : 'typescript-app';
  }

  // Check for JavaScript
  const jsFiles = files.filter(
    (f) => f.extension === '.js' || f.extension === '.mjs'
  );
  if (jsFiles.length > 0) {
    const hasIndex = files.some(
      (f) => f.path === 'src/index.js' || f.path === 'index.js'
    );
    return hasIndex ? 'javascript-library' : 'javascript-app';
  }

  return null;
}

/**
 * Detects common patterns in the project structure
 */
function detectPatterns(files: FileInfo[]): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];

  // Check for src directory
  const srcFiles = files.filter((f) => f.path.startsWith('src/'));
  if (srcFiles.length > 0) {
    patterns.push({
      name: 'src-directory',
      description: 'Source files organized in src/ directory',
      files: srcFiles.map((f) => f.path),
    });
  }

  // Check for tests directory
  const testDirs = files.filter(
    (f) =>
      f.isDirectory &&
      (f.name === '__tests__' || f.name === 'tests' || f.name === 'test')
  );
  if (testDirs.length > 0) {
    patterns.push({
      name: 'test-directory',
      description: 'Dedicated test directories',
      files: testDirs.map((f) => f.path),
    });
  }

  // Check for colocated tests
  const colocatedTests = files.filter(
    (f) =>
      !f.isDirectory && (f.path.includes('.test.') || f.path.includes('.spec.'))
  );
  if (colocatedTests.length > 0) {
    patterns.push({
      name: 'colocated-tests',
      description: 'Test files colocated with source files',
      files: colocatedTests.map((f) => f.path),
    });
  }

  // Check for index exports
  const indexFiles = files.filter(
    (f) =>
      !f.isDirectory &&
      f.name === 'index' &&
      (f.extension === '.ts' || f.extension === '.js')
  );
  if (indexFiles.length > 0) {
    patterns.push({
      name: 'barrel-exports',
      description: 'Index files for barrel exports',
      files: indexFiles.map((f) => f.path),
    });
  }

  return patterns;
}

export interface ReflectOptions {
  /** Maximum directory depth to scan (default: 10) */
  maxDepth?: number;
  /** Directories/files to exclude (default: ['node_modules', '.git', 'dist']) */
  exclude?: string[];
}

/**
 * Analyzes a directory structure and returns detailed information
 * about the files, project type, and patterns found.
 *
 * @param rootPath - The root directory to analyze
 * @param options - Configuration options
 * @returns Reflection result with detailed analysis
 */
export function reflectStructure(
  rootPath: string,
  options: ReflectOptions = {}
): ReflectionResult {
  const maxDepth = options.maxDepth ?? 10;
  const exclude = options.exclude ?? [
    'node_modules',
    '.git',
    'dist',
    '.nx',
    'coverage',
  ];

  if (!existsSync(rootPath)) {
    return {
      root: rootPath,
      files: [],
      projectType: null,
      patterns: [],
      stats: {
        totalFiles: 0,
        totalDirectories: 0,
        byCategory: {} as Record<FileCategory, number>,
        byExtension: {},
      },
    };
  }

  const files: FileInfo[] = [];
  const stats: ReflectionStats = {
    totalFiles: 0,
    totalDirectories: 0,
    byCategory: {} as Record<FileCategory, number>,
    byExtension: {},
  };

  scanDirectory(rootPath, rootPath, files, stats, {
    maxDepth,
    currentDepth: 0,
    exclude,
  });

  const projectType = detectProjectType(files, rootPath);
  const patterns = detectPatterns(files);

  return {
    root: rootPath,
    files,
    projectType,
    patterns,
    stats,
  };
}
