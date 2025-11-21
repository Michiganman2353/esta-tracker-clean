import { describe, it, expect } from 'vitest';
import { parseCSV, csvToObjects } from '../parser';

describe('csv parser', () => {
  describe('parseCSV', () => {
    it('should parse simple CSV with headers and rows', () => {
      const csv = 'Name,Email,Age\nJohn Doe,john@example.com,30\nJane Smith,jane@example.com,25';
      const result = parseCSV(csv);
      
      expect(result.headers).toEqual(['Name', 'Email', 'Age']);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]).toEqual(['John Doe', 'john@example.com', '30']);
      expect(result.rows[1]).toEqual(['Jane Smith', 'jane@example.com', '25']);
      expect(result.totalRows).toBe(2);
    });

    it('should handle CSV with quotes', () => {
      const csv = 'Name,Description\n"John Doe","A person with, comma"\n"Jane Smith","Another, person"';
      const result = parseCSV(csv);
      
      expect(result.headers).toEqual(['Name', 'Description']);
      expect(result.rows[0]).toEqual(['John Doe', 'A person with, comma']);
      expect(result.rows[1]).toEqual(['Jane Smith', 'Another, person']);
    });

    it('should handle escaped quotes', () => {
      const csv = 'Name,Quote\n"John Doe","He said ""Hello"""';
      const result = parseCSV(csv);
      
      expect(result.rows[0]).toEqual(['John Doe', 'He said "Hello"']);
    });

    it('should handle empty cells', () => {
      const csv = 'Name,Email,Age\nJohn,,30\n,jane@example.com,';
      const result = parseCSV(csv);
      
      expect(result.rows[0]).toEqual(['John', '', '30']);
      expect(result.rows[1]).toEqual(['', 'jane@example.com', '']);
    });

    it('should handle CRLF line endings', () => {
      const csv = 'Name,Age\r\nJohn,30\r\nJane,25';
      const result = parseCSV(csv);
      
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]).toEqual(['John', '30']);
    });

    it('should handle LF line endings', () => {
      const csv = 'Name,Age\nJohn,30\nJane,25';
      const result = parseCSV(csv);
      
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]).toEqual(['John', '30']);
    });

    it('should trim whitespace from cells', () => {
      const csv = 'Name , Email , Age \n John Doe , john@example.com , 30 ';
      const result = parseCSV(csv);
      
      expect(result.headers).toEqual(['Name', 'Email', 'Age']);
      expect(result.rows[0]).toEqual(['John Doe', 'john@example.com', '30']);
    });

    it('should handle empty CSV', () => {
      const csv = '';
      const result = parseCSV(csv);
      
      expect(result.headers).toEqual([]);
      expect(result.rows).toEqual([]);
      expect(result.totalRows).toBe(0);
    });

    it('should handle CSV with only headers', () => {
      const csv = 'Name,Email,Age';
      const result = parseCSV(csv);
      
      expect(result.headers).toEqual(['Name', 'Email', 'Age']);
      expect(result.rows).toEqual([]);
      expect(result.totalRows).toBe(0);
    });

    it('should skip empty rows', () => {
      const csv = 'Name,Age\nJohn,30\n\nJane,25\n\n';
      const result = parseCSV(csv);
      
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]).toEqual(['John', '30']);
      expect(result.rows[1]).toEqual(['Jane', '25']);
    });

    it('should handle rows with different column counts', () => {
      const csv = 'Name,Email,Age\nJohn,john@example.com\nJane,jane@example.com,25,extra';
      const result = parseCSV(csv);
      
      expect(result.rows[0]).toEqual(['John', 'john@example.com']);
      expect(result.rows[1]).toEqual(['Jane', 'jane@example.com', '25', 'extra']);
    });

    it('should handle CSV with special characters', () => {
      const csv = 'Name,Email\n"John & Jane","test@example.com"';
      const result = parseCSV(csv);
      
      expect(result.rows[0]).toEqual(['John & Jane', 'test@example.com']);
    });

    it('should handle large CSV data', () => {
      const headers = 'Name,Email,Age';
      const rows = Array.from({ length: 100 }, (_, i) => 
        `Person${i},person${i}@example.com,${20 + i}`
      ).join('\n');
      const csv = `${headers}\n${rows}`;
      const result = parseCSV(csv);
      
      expect(result.totalRows).toBe(100);
      expect(result.rows[0]).toEqual(['Person0', 'person0@example.com', '20']);
      expect(result.rows[99]).toEqual(['Person99', 'person99@example.com', '119']);
    });
  });

  describe('csvToObjects', () => {
    it('should convert CSV rows to objects', () => {
      const parseResult = {
        headers: ['Name', 'Email', 'Age'],
        rows: [
          ['John Doe', 'john@example.com', '30'],
          ['Jane Smith', 'jane@example.com', '25'],
        ],
        totalRows: 2,
      };
      
      const objects = csvToObjects(parseResult);
      
      expect(objects).toHaveLength(2);
      expect(objects[0]).toEqual({
        Name: 'John Doe',
        Email: 'john@example.com',
        Age: '30',
      });
      expect(objects[1]).toEqual({
        Name: 'Jane Smith',
        Email: 'jane@example.com',
        Age: '25',
      });
    });

    it('should handle missing values', () => {
      const parseResult = {
        headers: ['Name', 'Email', 'Age'],
        rows: [['John', 'john@example.com']],
        totalRows: 1,
      };
      
      const objects = csvToObjects(parseResult);
      
      expect(objects[0]).toEqual({
        Name: 'John',
        Email: 'john@example.com',
        Age: '',
      });
    });

    it('should handle empty rows', () => {
      const parseResult = {
        headers: ['Name', 'Email'],
        rows: [],
        totalRows: 0,
      };
      
      const objects = csvToObjects(parseResult);
      
      expect(objects).toEqual([]);
    });

    it('should handle duplicate headers', () => {
      const parseResult = {
        headers: ['Name', 'Name', 'Email'],
        rows: [['John', 'Doe', 'john@example.com']],
        totalRows: 1,
      };
      
      const objects = csvToObjects(parseResult);
      
      // Last value wins for duplicate headers
      expect(objects[0].Name).toBe('Doe');
      expect(objects[0].Email).toBe('john@example.com');
    });
  });
});
