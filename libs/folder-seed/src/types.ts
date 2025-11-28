/**
 * Type definitions for procedure templates
 */

export type ProcedureType =
  | 'library'
  | 'component'
  | 'service'
  | 'feature'
  | 'module';
export type VariableType = 'string' | 'boolean' | 'number' | 'choice';
export type TransformType =
  | 'camelCase'
  | 'PascalCase'
  | 'kebab-case'
  | 'UPPER_CASE'
  | 'lower_case';

/**
 * Variable definition for a procedure template
 */
export interface ProcedureVariable {
  /** Variable name (camelCase or PascalCase) */
  name: string;
  /** Type of the variable */
  type: VariableType;
  /** Description shown to user when prompting */
  description?: string;
  /** Default value for the variable */
  default?: string | boolean | number;
  /** Whether this variable is required */
  required?: boolean;
  /** Available choices (for 'choice' type) */
  choices?: string[];
  /** Transform to apply to the value */
  transform?: TransformType;
}

/**
 * File definition for a procedure template
 */
export interface ProcedureFile {
  /** Relative path for the file (supports {{variable}} interpolation) */
  path: string;
  /** Template content (supports {{variable}} interpolation) */
  template?: string;
  /** Path to external template file (relative to procedure file) */
  templateFile?: string;
  /** Condition for generating this file */
  condition?: string;
  /** Whether to overwrite existing files */
  overwrite?: boolean;
}

/**
 * Complete procedure template definition
 */
export interface Procedure {
  /** Schema version for this procedure (e.g., '1.0.0') */
  schemaVersion: string;
  /** Unique identifier for the procedure */
  name: string;
  /** Human-readable description of what this procedure generates */
  description: string;
  /** Type of code structure to generate */
  type: ProcedureType;
  /** Default directory for output (relative to workspace root) */
  targetDir?: string;
  /** Variables that can be interpolated in templates */
  variables?: ProcedureVariable[];
  /** Files to generate as part of this procedure */
  files: ProcedureFile[];
  /** Commands to run after generation */
  postGenerate?: string[];
}
