import { describe, it, expect } from 'vitest';
import { validateCSVData, type CSVSchema } from '../validator';

describe('csv validator', () => {
  const basicSchema: CSVSchema = {
    required: ['Name', 'Email'],
    optional: ['Age', 'Phone'],
    validators: {
      Email: (value) => {
        if (!value.includes('@')) {
          return 'Invalid email format';
        }
        return null;
      },
      Age: (value) => {
        const age = parseInt(value);
        if (isNaN(age) || age < 0 || age > 150) {
          return 'Invalid age';
        }
        return null;
      },
    },
  };

  describe('validateCSVData', () => {
    it('should validate correct CSV data', () => {
      const headers = ['Name', 'Email', 'Age'];
      const rows = [
        ['John Doe', 'john@example.com', '30'],
        ['Jane Smith', 'jane@example.com', '25'],
      ];
      
      const result = validateCSVData(headers, rows, basicSchema);
      
      expect(result.valid).toBe(true);
      expect(result.validRows).toBe(2);
      expect(result.totalRows).toBe(2);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required columns', () => {
      const headers = ['Name', 'Age'];
      const rows = [['John Doe', '30']];
      
      const result = validateCSVData(headers, rows, basicSchema);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain('Missing required columns: Email');
    });

    it('should detect missing required field values', () => {
      const headers = ['Name', 'Email', 'Age'];
      const rows = [
        ['John Doe', '', '30'],
        ['Jane Smith', 'jane@example.com', '25'],
      ];
      
      const result = validateCSVData(headers, rows, basicSchema);
      
      expect(result.valid).toBe(false);
      expect(result.validRows).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].row).toBe(2);
      expect(result.errors[0].field).toBe('Email');
      expect(result.errors[0].error).toContain('required');
    });

    it('should run field validators', () => {
      const headers = ['Name', 'Email', 'Age'];
      const rows = [
        ['John Doe', 'invalid-email', '30'],
        ['Jane Smith', 'jane@example.com', 'invalid-age'],
      ];
      
      const result = validateCSVData(headers, rows, basicSchema);
      
      expect(result.valid).toBe(false);
      expect(result.validRows).toBe(0);
      expect(result.errors).toHaveLength(2);
      
      const emailError = result.errors.find(e => e.field === 'Email');
      expect(emailError).toBeDefined();
      expect(emailError!.error).toContain('Invalid email');
      
      const ageError = result.errors.find(e => e.field === 'Age');
      expect(ageError).toBeDefined();
      expect(ageError!.error).toContain('Invalid age');
    });

    it('should warn about unknown columns', () => {
      const headers = ['Name', 'Email', 'UnknownColumn'];
      const rows = [['John Doe', 'john@example.com', 'extra']];
      
      const result = validateCSVData(headers, rows, basicSchema);
      
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].error).toContain('Unknown columns');
      expect(result.warnings[0].error).toContain('UnknownColumn');
    });

    it('should enforce row limit', () => {
      const headers = ['Name', 'Email'];
      const rows = Array.from({ length: 10001 }, (_, i) => 
        [`Person${i}`, `person${i}@example.com`]
      );
      
      const result = validateCSVData(headers, rows, basicSchema);
      
      expect(result.valid).toBe(false);
      expect(result.errors[0].error).toContain('exceeds maximum');
      expect(result.errors[0].error).toContain('10000 rows');
    });

    it('should enforce column limit', () => {
      const headers = Array.from({ length: 51 }, (_, i) => `Column${i}`);
      const rows = [Array.from({ length: 51 }, () => 'value')];
      
      const result = validateCSVData(headers, rows, basicSchema);
      
      expect(result.valid).toBe(false);
      expect(result.errors[0].error).toContain('exceeds maximum');
      expect(result.errors[0].error).toContain('50 columns');
    });

    it('should enforce cell size limit', () => {
      const headers = ['Name', 'Email', 'Description'];
      const largeText = 'a'.repeat(10001);
      const rows = [['John Doe', 'john@example.com', largeText]];
      
      const schema: CSVSchema = {
        required: ['Name', 'Email'],
        optional: ['Description'],
        validators: {},
      };
      
      const result = validateCSVData(headers, rows, schema);
      
      expect(result.valid).toBe(false);
      expect(result.errors[0].error).toContain('exceeds maximum');
      expect(result.errors[0].error).toContain('10000 characters');
    });

    it('should handle multiple errors in same row', () => {
      const headers = ['Name', 'Email', 'Age'];
      const rows = [['', 'invalid-email', '-5']];
      
      const result = validateCSVData(headers, rows, basicSchema);
      
      expect(result.valid).toBe(false);
      expect(result.validRows).toBe(0);
      expect(result.errors.length).toBeGreaterThan(1);
    });

    it('should correctly number rows in errors', () => {
      const headers = ['Name', 'Email'];
      const rows = [
        ['John Doe', 'john@example.com'],
        ['Jane Smith', ''], // Error in data row 2 (row 3 when counting header as row 1)
        ['Bob Johnson', 'bob@example.com'],
      ];
      
      const result = validateCSVData(headers, rows, basicSchema);
      
      // Row numbering: Header is row 1, data rows start at row 2
      // So second data row with error should be row 3
      expect(result.errors[0].row).toBe(3);
    });

    it('should handle empty rows', () => {
      const headers = ['Name', 'Email'];
      const rows: string[][] = [];
      
      const result = validateCSVData(headers, rows, basicSchema);
      
      expect(result.valid).toBe(true);
      expect(result.totalRows).toBe(0);
      expect(result.validRows).toBe(0);
    });

    it('should skip validator for empty optional fields', () => {
      const headers = ['Name', 'Email', 'Age'];
      const rows = [['John Doe', 'john@example.com', '']];
      
      const result = validateCSVData(headers, rows, basicSchema);
      
      expect(result.valid).toBe(true);
      expect(result.validRows).toBe(1);
    });

    it('should handle validators that return null for valid values', () => {
      const schema: CSVSchema = {
        required: ['Name'],
        optional: ['Score'],
        validators: {
          Score: (value) => {
            const score = parseInt(value);
            return score >= 0 && score <= 100 ? null : 'Score must be 0-100';
          },
        },
      };
      
      const headers = ['Name', 'Score'];
      const rows = [
        ['John', '85'],
        ['Jane', '105'],
      ];
      
      const result = validateCSVData(headers, rows, schema);
      
      expect(result.valid).toBe(false);
      expect(result.validRows).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].row).toBe(3);
    });

    it('should differentiate between errors and warnings', () => {
      const headers = ['Name', 'Email', 'UnknownField'];
      const rows = [['John', '', 'value']];
      
      const result = validateCSVData(headers, rows, basicSchema);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.warnings.length).toBeGreaterThan(0);
      
      const error = result.errors.find(e => e.severity === 'error');
      const warning = result.warnings.find(w => w.severity === 'warning');
      
      expect(error).toBeDefined();
      expect(warning).toBeDefined();
    });
  });
});
