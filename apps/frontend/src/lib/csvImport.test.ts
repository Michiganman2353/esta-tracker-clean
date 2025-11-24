import { describe, it, expect } from 'vitest';
import {
  parseCSV,
  importEmployeeCSV,
  importHoursCSV,
  validateEmployeeBusinessRules,
  validateHoursBusinessRules,
  generateEmployeeCSVTemplate,
  generateHoursCSVTemplate,
} from './csvImport';

describe('CSV Import', () => {
  describe('parseCSV', () => {
    it('should parse basic CSV', () => {
      const csv = 'name,email\nJohn,john@test.com\nJane,jane@test.com';
      const result = parseCSV(csv);
      expect(result).toEqual([
        ['name', 'email'],
        ['John', 'john@test.com'],
        ['Jane', 'jane@test.com'],
      ]);
    });

    it('should handle quoted fields with commas', () => {
      const csv = 'name,address\n"Smith, John","123 Main St, Apt 2"';
      const result = parseCSV(csv);
      expect(result).toEqual([
        ['name', 'address'],
        ['Smith, John', '123 Main St, Apt 2'],
      ]);
    });

    it('should handle escaped quotes', () => {
      const csv = 'name,quote\n"John ""The Man"" Doe","He said ""hello"""';
      const result = parseCSV(csv);
      expect(result).toEqual([
        ['name', 'quote'],
        ['John "The Man" Doe', 'He said "hello"'],
      ]);
    });

    it('should handle different line endings', () => {
      const csv1 = 'a,b\n1,2\n3,4';
      const csv2 = 'a,b\r\n1,2\r\n3,4';
      const csv3 = 'a,b\r1,2\r3,4';

      expect(parseCSV(csv1)).toEqual([
        ['a', 'b'],
        ['1', '2'],
        ['3', '4'],
      ]);
      expect(parseCSV(csv2)).toEqual([
        ['a', 'b'],
        ['1', '2'],
        ['3', '4'],
      ]);
      expect(parseCSV(csv3)).toEqual([
        ['a', 'b'],
        ['1', '2'],
        ['3', '4'],
      ]);
    });

    it('should handle empty lines', () => {
      const csv = 'a,b\n1,2\n\n3,4';
      const result = parseCSV(csv);
      expect(result).toEqual([
        ['a', 'b'],
        ['1', '2'],
        ['3', '4'],
      ]);
    });
  });

  describe('importEmployeeCSV', () => {
    it('should validate valid employee CSV', () => {
      const csv = `firstName,lastName,email,hireDate,department
John,Doe,john@test.com,2024-01-15,IT
Jane,Smith,jane@test.com,2024-02-01,HR`;

      const result = importEmployeeCSV(csv);
      expect(result.valid).toBe(true);
      expect(result.totalRows).toBe(2);
      expect(result.validRows).toBe(2);
      expect(result.errors).toHaveLength(0);
      expect(result.data).toHaveLength(2);
    });

    it('should detect missing required fields', () => {
      const csv = `firstName,lastName,email
John,Doe,john@test.com`;

      const result = importEmployeeCSV(csv);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.error.includes('hireDate'))).toBe(true);
    });

    it('should validate email format', () => {
      const csv = `firstName,lastName,email,hireDate
John,Doe,invalid-email,2024-01-15`;

      const result = importEmployeeCSV(csv);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'email')).toBe(true);
    });

    it('should validate date format', () => {
      const csv = `firstName,lastName,email,hireDate
John,Doe,john@test.com,invalid-date`;

      const result = importEmployeeCSV(csv);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'hireDate')).toBe(true);
    });

    it('should reject future hire dates', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const csv = `firstName,lastName,email,hireDate
John,Doe,john@test.com,${futureDate.toISOString().split('T')[0]}`;

      const result = importEmployeeCSV(csv);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.error.includes('future'))).toBe(true);
    });

    it('should warn about unknown columns', () => {
      const csv = `firstName,lastName,email,hireDate,unknownColumn
John,Doe,john@test.com,2024-01-15,someValue`;

      const result = importEmployeeCSV(csv);
      expect(result.valid).toBe(true);
      expect(result.warnings.some((w) => w.error.includes('Unknown columns'))).toBe(
        true
      );
    });

    it('should validate hours per week', () => {
      const csv = `firstName,lastName,email,hireDate,hoursPerWeek
John,Doe,john@test.com,2024-01-15,200`;

      const result = importEmployeeCSV(csv);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'hoursPerWeek')).toBe(true);
    });
  });

  describe('importHoursCSV', () => {
    it('should validate valid hours CSV', () => {
      const csv = `employeeEmail,date,hoursWorked
john@test.com,2024-11-01,8
jane@test.com,2024-11-01,7.5`;

      const result = importHoursCSV(csv);
      expect(result.valid).toBe(true);
      expect(result.totalRows).toBe(2);
      expect(result.data).toHaveLength(2);
    });

    it('should validate hours range', () => {
      const csv = `employeeEmail,date,hoursWorked
john@test.com,2024-11-01,25`;

      const result = importHoursCSV(csv);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'hoursWorked')).toBe(true);
    });

    it('should validate email format', () => {
      const csv = `employeeEmail,date,hoursWorked
invalid-email,2024-11-01,8`;

      const result = importHoursCSV(csv);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'employeeEmail')).toBe(true);
    });

    it('should validate date format', () => {
      const csv = `employeeEmail,date,hoursWorked
john@test.com,not-a-date,8`;

      const result = importHoursCSV(csv);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'date')).toBe(true);
    });

    it('should handle optional overtime hours', () => {
      const csv = `employeeEmail,date,hoursWorked,overtimeHours
john@test.com,2024-11-01,8,2`;

      const result = importHoursCSV(csv);
      expect(result.valid).toBe(true);
      expect(result.data[0]).toHaveProperty('overtimeHours');
    });
  });

  describe('validateEmployeeBusinessRules', () => {
    it('should detect duplicate emails in CSV', () => {
      const employees = [
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@test.com',
          hireDate: '2024-01-15',
        },
        {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'john@test.com',
          hireDate: '2024-02-01',
        },
      ];

      const result = validateEmployeeBusinessRules(employees, new Set());
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Duplicate email'))).toBe(true);
    });

    it('should warn about existing employees', () => {
      const employees = [
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@test.com',
          hireDate: '2024-01-15',
        },
      ];

      const existingEmails = new Set(['john@test.com']);
      const result = validateEmployeeBusinessRules(employees, existingEmails);
      expect(result.valid).toBe(true);
      expect(result.warnings.some((w) => w.includes('already exists'))).toBe(true);
    });

    it('should warn about very old hire dates', () => {
      const oldDate = new Date();
      oldDate.setFullYear(oldDate.getFullYear() - 15);

      const employees = [
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@test.com',
          hireDate: oldDate.toISOString().split('T')[0],
        },
      ];

      const result = validateEmployeeBusinessRules(employees, new Set());
      expect(result.warnings.some((w) => w.includes('10 years ago'))).toBe(true);
    });
  });

  describe('validateHoursBusinessRules', () => {
    it('should detect non-existent employees', () => {
      const hours = [
        {
          employeeEmail: 'nonexistent@test.com',
          date: '2024-11-01',
          hoursWorked: 8,
        },
      ];

      const validEmails = new Set(['john@test.com']);
      const result = validateHoursBusinessRules(hours, validEmails);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('not found'))).toBe(true);
    });

    it('should detect future dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const hours = [
        {
          employeeEmail: 'john@test.com',
          date: futureDate.toISOString().split('T')[0],
          hoursWorked: 8,
        },
      ];

      const validEmails = new Set(['john@test.com']);
      const result = validateHoursBusinessRules(hours, validEmails);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('future'))).toBe(true);
    });

    it('should warn about very long days', () => {
      const hours = [
        {
          employeeEmail: 'john@test.com',
          date: '2024-11-01',
          hoursWorked: 14,
          overtimeHours: 4,
        },
      ];

      const validEmails = new Set(['john@test.com']);
      const result = validateHoursBusinessRules(hours, validEmails);
      expect(result.warnings.some((w) => w.includes('exceeds 16 hours'))).toBe(true);
    });

    it('should warn about weekend work', () => {
      // November 2, 2024 is a Saturday
      const hours = [
        {
          employeeEmail: 'john@test.com',
          date: '2024-11-02',
          hoursWorked: 8,
        },
      ];

      const validEmails = new Set(['john@test.com']);
      const result = validateHoursBusinessRules(hours, validEmails);
      expect(result.warnings.some((w) => w.includes('weekend'))).toBe(true);
    });
  });

  describe('CSV Templates', () => {
    it('should generate employee CSV template', () => {
      const template = generateEmployeeCSVTemplate();
      expect(template).toContain('firstName');
      expect(template).toContain('lastName');
      expect(template).toContain('email');
      expect(template).toContain('hireDate');
      expect(template.split('\n').length).toBeGreaterThanOrEqual(2);
    });

    it('should generate hours CSV template', () => {
      const template = generateHoursCSVTemplate();
      expect(template).toContain('employeeEmail');
      expect(template).toContain('date');
      expect(template).toContain('hoursWorked');
      expect(template.split('\n').length).toBeGreaterThanOrEqual(2);
    });
  });
});
