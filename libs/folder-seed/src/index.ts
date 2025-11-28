/**
 * @esta-tracker/folder-seed
 *
 * Folder seeding system with introspection capabilities for generating
 * code structures from declarative procedure templates.
 */

export {
  validateProcedure,
  validateProcedureOrThrow,
  schema,
} from './validator.js';
export {
  generateFromProcedure,
  GenerateOptions,
  GenerateResult,
} from './generator.js';
export { reflectStructure, ReflectionResult, FileInfo } from './reflection.js';
export type {
  Procedure,
  ProcedureVariable,
  ProcedureFile,
  ProcedureType,
  VariableType,
  TransformType,
} from './types.js';
