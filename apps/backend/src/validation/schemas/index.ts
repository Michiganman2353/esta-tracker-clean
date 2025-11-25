/**
 * Central export for all validation schemas.
 */

// Auth schemas
export {
  employeeRegistrationSchema,
  managerRegistrationSchema,
  loginSchema,
  userProfileUpdateSchema,
  passwordChangeSchema,
  type EmployeeRegistrationInput,
  type ManagerRegistrationInput,
  type LoginInput,
  type UserProfileUpdateInput,
  type PasswordChangeInput,
} from './auth.js';

// Employer schemas
export {
  employerSizeSchema,
  employerProfileCreateSchema,
  employerSettingsUpdateSchema,
  type EmployerSize,
  type EmployerProfileCreateInput,
  type EmployerSettingsUpdateInput,
} from './employer.js';

// Employee schemas
export {
  employmentStatusSchema,
  employeeProfileCreateSchema,
  employeeProfileUpdateSchema,
  employeeImportRowSchema,
  type EmploymentStatus,
  type EmployeeProfileCreateInput,
  type EmployeeProfileUpdateInput,
  type EmployeeImportRowInput,
} from './employee.js';

// Policy schemas
export {
  policyTypeSchema,
  policyCreateSchema,
  policyActivateSchema,
  policyQuerySchema,
  type PolicyType,
  type PolicyCreateInput,
  type PolicyActivateInput,
  type PolicyQueryInput,
} from './policy.js';

// Accrual schemas
export {
  workLogCreateSchema,
  workLogUpdateSchema,
  hoursImportRowSchema,
  balanceQuerySchema,
  type WorkLogCreateInput,
  type WorkLogUpdateInput,
  type HoursImportRowInput,
  type BalanceQueryInput,
} from './accrual.js';

// Request schemas
export {
  requestStatusSchema,
  requestReasonSchema,
  sickTimeRequestCreateSchema,
  sickTimeRequestStatusUpdateSchema,
  sickTimeRequestQuerySchema,
  type RequestStatus,
  type RequestReason,
  type SickTimeRequestCreateInput,
  type SickTimeRequestStatusUpdateInput,
  type SickTimeRequestQueryInput,
} from './request.js';

// Document schemas
export {
  documentUploadUrlSchema,
  documentConfirmSchema,
  documentQuerySchema,
  type DocumentUploadUrlInput,
  type DocumentConfirmInput,
  type DocumentQueryInput,
} from './document.js';

// Import schemas
export {
  importTypeSchema,
  importValidateSchema,
  employeeImportSchema,
  hoursImportSchema,
  importHistoryQuerySchema,
  type ImportType,
  type ImportValidateInput,
  type EmployeeImportInput,
  type HoursImportInput,
  type ImportHistoryQueryInput,
} from './import.js';

// Common schemas
export {
  paginationSchema,
  idParamSchema,
  userIdParamSchema,
  dateRangeSchema,
  type PaginationInput,
  type IdParamInput,
  type UserIdParamInput,
  type DateRangeInput,
} from './common.js';
