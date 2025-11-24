/**
 * CSV Parser
 * 
 * Parse CSV text into structured data
 * 
 * NOTE: This is a basic CSV parser for simple use cases.
 * It handles quoted fields and basic escaping but may not handle
 * all edge cases (e.g., quoted newlines in cells, complex escaping).
 * 
 * TODO: Migrate to Rust/WASM for 10x+ performance improvement on large files
 * TODO: Consider using a battle-tested library (papaparse) as temporary solution
 */

export interface CSVParseResult {
  headers: string[];
  rows: string[][];
  totalRows: number;
}

/**
 * Parse CSV text into rows
 * 
 * @param csvText - Raw CSV text
 * @returns Parsed CSV data
 */
export function parseCSV(csvText: string): CSVParseResult {
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

  const headers = rows.length > 0 && rows[0] ? rows[0].map(h => h.trim()) : [];
  const dataRows = rows.slice(1);

  return {
    headers,
    rows: dataRows,
    totalRows: dataRows.length,
  };
}

/**
 * Convert CSV rows to objects using headers as keys
 * 
 * @param parseResult - Parsed CSV data
 * @returns Array of objects
 */
export function csvToObjects(parseResult: CSVParseResult): Record<string, string>[] {
  const { headers, rows } = parseResult;
  
  return rows.map(row => {
    const obj: Record<string, string> = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] || '';
    });
    return obj;
  });
}
