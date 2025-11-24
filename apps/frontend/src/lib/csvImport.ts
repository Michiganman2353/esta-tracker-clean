/**
 * CSV Import System with Validation and Preview
 * Handles bulk employee and hours data imports with comprehensive validation
 */

export interface CSVValidationError {
  row: number;
  field: string;
  value: string;
  error: string;
  severity: 'error' | 'warning';
}

export interface CSVImportResult {
  valid: boolean;
  totalRows: number;
  validRows: number;
  errors: CSVValidationError[];
  warnings: CSVValidationError[];
  data: Record<string, unknown>[];
  preview: Record<string, unknown>[];
}

export interface EmployeeCSVRow {
  firstName: string;
  lastName: string;
  email: string;
  hireDate: string;
  department?: string;
  employmentStatus?: string;
  hoursPerWeek?: number;
}

export interface HoursCSVRow {
  employeeEmail: string;
  date: string;
  hoursWorked: number;
  overtimeHours?: number;
  notes?: string;
}

/**
 * CSV Schema definitions
 */
const EMPLOYEE_SCHEMA = {
  required: ['firstName', 'lastName', 'email', 'hireDate'],
  optional: ['department', 'employmentStatus', 'hoursPerWeek'],
  validators: {
    firstName: (value: string) => {
      if (!value || value.trim().length === 0) {
        return 'First name is required';
      }
      if (value.length > 50) {
        return 'First name too long (max 50 characters)';
      }
      return null;
    },
    lastName: (value: string) => {
      if (!value || value.trim().length === 0) {
        return 'Last name is required';
      }
      if (value.length > 50) {
        return 'Last name too long (max 50 characters)';
      }
      return null;
    },
    email: (value: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Invalid email format';
      }
      return null;
    },
    hireDate: (value: string) => {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return 'Invalid date format (use YYYY-MM-DD)';
      }
      if (date > new Date()) {
        return 'Hire date cannot be in the future';
      }
      return null;
    },
    hoursPerWeek: (value: string) => {
      if (!value) return null; // Optional field
      const hours = parseFloat(value);
      if (isNaN(hours) || hours < 0 || hours > 168) {
        return 'Hours per week must be between 0 and 168';
      }
      return null;
    },
  },
};

const HOURS_SCHEMA = {
  required: ['employeeEmail', 'date', 'hoursWorked'],
  optional: ['overtimeHours', 'notes'],
  validators: {
    employeeEmail: (value: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Invalid email format';
      }
      return null;
    },
    date: (value: string) => {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return 'Invalid date format (use YYYY-MM-DD)';
      }
      return null;
    },
    hoursWorked: (value: string) => {
      const hours = parseFloat(value);
      if (isNaN(hours) || hours < 0 || hours > 24) {
        return 'Hours worked must be between 0 and 24';
      }
      return null;
    },
    overtimeHours: (value: string) => {
      if (!value) return null; // Optional field
      const hours = parseFloat(value);
      if (isNaN(hours) || hours < 0 || hours > 24) {
        return 'Overtime hours must be between 0 and 24';
      }
      return null;
    },
  },
};

/**
 * Parse CSV text into rows
 */
export function parseCSV(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentCell += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of cell
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      // End of row
      if (currentCell || currentRow.length > 0) {
        currentRow.push(currentCell.trim());
        if (currentRow.some((cell) => cell !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
      }
      // Skip \r\n combinations
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
    } else {
      currentCell += char;
    }
  }

  // Add last row if exists
  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((cell) => cell !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Validate CSV data against schema
 */
function validateCSVData(
  headers: string[],
  rows: string[][],
  schema: typeof EMPLOYEE_SCHEMA | typeof HOURS_SCHEMA
): CSVImportResult {
  const errors: CSVValidationError[] = [];
  const warnings: CSVValidationError[] = [];
  const data: Record<string, unknown>[] = [];

  // Validate headers
  const missingRequired = schema.required.filter(
    (field) => !headers.includes(field)
  );
  if (missingRequired.length > 0) {
    errors.push({
      row: 0,
      field: 'headers',
      value: headers.join(', '),
      error: `Missing required columns: ${missingRequired.join(', ')}`,
      severity: 'error',
    });
  }

  // Check for unknown headers
  const allFields = [...schema.required, ...schema.optional];
  const unknownHeaders = headers.filter((h) => !allFields.includes(h));
  if (unknownHeaders.length > 0) {
    warnings.push({
      row: 0,
      field: 'headers',
      value: unknownHeaders.join(', '),
      error: `Unknown columns will be ignored: ${unknownHeaders.join(', ')}`,
      severity: 'warning',
    });
  }

  // Validate each row
  rows.forEach((row, rowIndex) => {
    const rowData: Record<string, unknown> = {};
    const rowNumber = rowIndex + 2; // +1 for 0-index, +1 for header row

    headers.forEach((header, colIndex) => {
      const value = row[colIndex] || '';
      rowData[header] = value;

      // Validate required fields
      if (schema.required.includes(header) && !value.trim()) {
        errors.push({
          row: rowNumber,
          field: header,
          value,
          error: `${header} is required`,
          severity: 'error',
        });
        return;
      }

      // Run field-specific validators
      if (value) {
        const validators = schema.validators as Record<string, (value: string) => string | null>;
        const validator = validators[header];
        if (validator && typeof validator === 'function') {
          const validationError = validator(value);
          if (validationError) {
            errors.push({
              row: rowNumber,
              field: header,
              value,
              error: validationError,
              severity: 'error',
            });
          }
        }
      }
    });

    data.push(rowData);
  });

  return {
    valid: errors.length === 0,
    totalRows: rows.length,
    validRows: rows.length - errors.filter((e) => e.severity === 'error').length,
    errors,
    warnings,
    data,
    preview: data.slice(0, 10), // First 10 rows for preview
  };
}

/**
 * Import employee CSV
 */
export function importEmployeeCSV(csvText: string): CSVImportResult {
  const rows = parseCSV(csvText);
  if (rows.length === 0) {
    return {
      valid: false,
      totalRows: 0,
      validRows: 0,
      errors: [
        {
          row: 0,
          field: 'file',
          value: '',
          error: 'CSV file is empty',
          severity: 'error',
        },
      ],
      warnings: [],
      data: [],
      preview: [],
    };
  }

  const firstRow = rows[0];
  if (!firstRow) {
    return {
      valid: false,
      totalRows: 0,
      validRows: 0,
      errors: [
        {
          row: 0,
          field: 'file',
          value: '',
          error: 'CSV file has no header row',
          severity: 'error',
        },
      ],
      warnings: [],
      data: [],
      preview: [],
    };
  }

  const headers = firstRow.map((h) => h.trim());
  const dataRows = rows.slice(1);

  return validateCSVData(headers, dataRows, EMPLOYEE_SCHEMA);
}

/**
 * Import hours CSV
 */
export function importHoursCSV(csvText: string): CSVImportResult {
  const rows = parseCSV(csvText);
  if (rows.length === 0) {
    return {
      valid: false,
      totalRows: 0,
      validRows: 0,
      errors: [
        {
          row: 0,
          field: 'file',
          value: '',
          error: 'CSV file is empty',
          severity: 'error',
        },
      ],
      warnings: [],
      data: [],
      preview: [],
    };
  }

  const firstRow = rows[0];
  if (!firstRow) {
    return {
      valid: false,
      totalRows: 0,
      validRows: 0,
      errors: [
        {
          row: 0,
          field: 'file',
          value: '',
          error: 'CSV file has no header row',
          severity: 'error',
        },
      ],
      warnings: [],
      data: [],
      preview: [],
    };
  }

  const headers = firstRow.map((h) => h.trim());
  const dataRows = rows.slice(1);

  return validateCSVData(headers, dataRows, HOURS_SCHEMA);
}

/**
 * Business rules validation
 */
export interface BusinessRulesValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateEmployeeBusinessRules(
  employees: EmployeeCSVRow[],
  existingEmails: Set<string>
): BusinessRulesValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const emailSet = new Set<string>();

  employees.forEach((employee, index) => {
    const rowNumber = index + 2;

    // Check for duplicate emails in CSV
    if (emailSet.has(employee.email)) {
      errors.push(`Row ${rowNumber}: Duplicate email ${employee.email} found in CSV`);
    }
    emailSet.add(employee.email);

    // Check for existing emails in system
    if (existingEmails.has(employee.email)) {
      warnings.push(
        `Row ${rowNumber}: Employee ${employee.email} already exists and will be updated`
      );
    }

    // Validate hire date is reasonable (not too far in past)
    const hireDate = new Date(employee.hireDate);
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);

    if (hireDate < tenYearsAgo) {
      warnings.push(
        `Row ${rowNumber}: Hire date ${employee.hireDate} is more than 10 years ago`
      );
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateHoursBusinessRules(
  hours: HoursCSVRow[],
  validEmployeeEmails: Set<string>
): BusinessRulesValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  hours.forEach((entry, index) => {
    const rowNumber = index + 2;

    // Check if employee exists
    if (!validEmployeeEmails.has(entry.employeeEmail)) {
      errors.push(
        `Row ${rowNumber}: Employee ${entry.employeeEmail} not found in system`
      );
    }

    // Check for date in future
    const entryDate = new Date(entry.date);
    if (entryDate > new Date()) {
      errors.push(`Row ${rowNumber}: Date ${entry.date} is in the future`);
    }

    // Check for unusually high hours
    const totalHours = entry.hoursWorked + (entry.overtimeHours || 0);
    if (totalHours > 16) {
      warnings.push(
        `Row ${rowNumber}: Total hours ${totalHours} exceeds 16 hours (very long day)`
      );
    }

    // Check for weekend work (potential data entry error)
    const dayOfWeek = entryDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      warnings.push(
        `Row ${rowNumber}: Date ${entry.date} is a weekend day (Saturday or Sunday)`
      );
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Generate CSV template for employees
 */
export function generateEmployeeCSVTemplate(): string {
  const headers = [
    'firstName',
    'lastName',
    'email',
    'hireDate',
    'department',
    'employmentStatus',
    'hoursPerWeek',
  ];
  const example = [
    'John',
    'Doe',
    'john.doe@company.com',
    '2024-01-15',
    'Operations',
    'full-time',
    '40',
  ];

  return [headers.join(','), example.join(',')].join('\n');
}

/**
 * Generate CSV template for hours
 */
export function generateHoursCSVTemplate(): string {
  const headers = ['employeeEmail', 'date', 'hoursWorked', 'overtimeHours', 'notes'];
  const example = ['john.doe@company.com', '2024-11-01', '8', '0', 'Regular shift'];

  return [headers.join(','), example.join(',')].join('\n');
}
