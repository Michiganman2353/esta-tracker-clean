/**
 * Code generator that creates files from procedure templates
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import type { Procedure, ProcedureFile, TransformType } from './types.js';

export interface GenerateOptions {
  /** Values for template variables */
  variables: Record<string, string | boolean | number>;
  /** Base output directory */
  outputDir: string;
  /** Whether to perform a dry run (no files written) */
  dryRun?: boolean;
  /** Base path for resolving templateFile references */
  templateBasePath?: string;
}

export interface GeneratedFile {
  path: string;
  content: string;
  skipped: boolean;
  reason?: string;
}

export interface GenerateResult {
  success: boolean;
  files: GeneratedFile[];
  errors: string[];
}

/**
 * Applies a string transformation to a value
 */
function applyTransform(value: string, transform: TransformType): string {
  switch (transform) {
    case 'camelCase':
      return value
        .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
        .replace(/^./, (c) => c.toLowerCase());
    case 'PascalCase':
      return value
        .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
        .replace(/^./, (c) => c.toUpperCase());
    case 'kebab-case':
      return value
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/[\s_]+/g, '-')
        .toLowerCase();
    case 'UPPER_CASE':
      return value
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/[\s-]+/g, '_')
        .toUpperCase();
    case 'lower_case':
      return value
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/[\s-]+/g, '_')
        .toLowerCase();
    default:
      return value;
  }
}

/**
 * Interpolates variables in a template string
 */
function interpolate(
  template: string,
  variables: Record<string, string | boolean | number>,
  transforms: Record<string, TransformType>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    if (!(varName in variables)) {
      return match; // Keep unmatched variables as-is
    }
    const value = String(variables[varName]);
    const transform = transforms[varName];
    return transform ? applyTransform(value, transform) : value;
  });
}

/**
 * Evaluates a simple condition expression
 */
function evaluateCondition(
  condition: string,
  variables: Record<string, string | boolean | number>
): boolean {
  // Simple truthy check for {{variableName}}
  const match = condition.match(/^\{\{(\w+)\}\}$/);
  if (match) {
    const [, varName] = match;
    if (!varName) return true;
    const value = variables[varName];
    return Boolean(value);
  }
  // Simple negative check for !{{variableName}}
  const negMatch = condition.match(/^!\{\{(\w+)\}\}$/);
  if (negMatch) {
    const [, varName] = negMatch;
    if (!varName) return true;
    const value = variables[varName];
    return !value;
  }
  // Default to true if we can't parse
  return true;
}

/**
 * Generates files from a procedure template
 */
export function generateFromProcedure(
  procedure: Procedure,
  options: GenerateOptions
): GenerateResult {
  const result: GenerateResult = {
    success: true,
    files: [],
    errors: [],
  };

  // Build transform map from procedure variables
  const transforms: Record<string, TransformType> = {};
  for (const v of procedure.variables ?? []) {
    if (v.transform) {
      transforms[v.name] = v.transform;
    }
  }

  // Merge default values with provided values
  const variables: Record<string, string | boolean | number> = {};
  for (const v of procedure.variables ?? []) {
    if (v.default !== undefined) {
      variables[v.name] = v.default;
    }
  }
  Object.assign(variables, options.variables);

  // Check required variables
  // A variable is required if:
  // - It's explicitly marked as required (required: true or required not set to false)
  // - AND it doesn't have a default value
  for (const v of procedure.variables ?? []) {
    const hasDefault = v.default !== undefined;
    const isRequired = v.required !== false;
    if (isRequired && !hasDefault && !(v.name in options.variables)) {
      result.errors.push(`Missing required variable: ${v.name}`);
      result.success = false;
    }
  }

  if (!result.success) {
    return result;
  }

  // Generate each file
  for (const file of procedure.files) {
    const generated = generateFile(file, variables, transforms, options);
    result.files.push(generated);
    if (!generated.skipped && generated.reason) {
      result.errors.push(generated.reason);
      result.success = false;
    }
  }

  return result;
}

/**
 * Generates a single file from a file template
 */
function generateFile(
  file: ProcedureFile,
  variables: Record<string, string | boolean | number>,
  transforms: Record<string, TransformType>,
  options: GenerateOptions
): GeneratedFile {
  // Check condition
  if (file.condition && !evaluateCondition(file.condition, variables)) {
    return {
      path: file.path,
      content: '',
      skipped: true,
      reason: 'Condition not met',
    };
  }

  // Interpolate path
  const relativePath = interpolate(file.path, variables, transforms);
  const fullPath = join(options.outputDir, relativePath);

  // Check if file exists and overwrite is disabled
  if (!file.overwrite && existsSync(fullPath)) {
    return {
      path: relativePath,
      content: '',
      skipped: true,
      reason: 'File already exists',
    };
  }

  // Get template content
  let templateContent = '';
  if (file.template) {
    templateContent = file.template;
  } else if (file.templateFile && options.templateBasePath) {
    const templatePath = join(options.templateBasePath, file.templateFile);
    try {
      templateContent = readFileSync(templatePath, 'utf-8');
    } catch (err) {
      return {
        path: relativePath,
        content: '',
        skipped: false,
        reason: `Failed to read template file: ${templatePath}`,
      };
    }
  }

  // Interpolate content
  const content = interpolate(templateContent, variables, transforms);

  // Write file (unless dry run)
  if (!options.dryRun) {
    try {
      mkdirSync(dirname(fullPath), { recursive: true });
      writeFileSync(fullPath, content, 'utf-8');
    } catch (err) {
      return {
        path: relativePath,
        content,
        skipped: false,
        reason: `Failed to write file: ${String(err)}`,
      };
    }
  }

  return {
    path: relativePath,
    content,
    skipped: false,
  };
}
