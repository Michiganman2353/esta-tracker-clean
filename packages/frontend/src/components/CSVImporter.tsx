import { useState } from 'react';
import {
  importEmployeeCSV,
  importHoursCSV,
  validateEmployeeBusinessRules,
  validateHoursBusinessRules,
  generateEmployeeCSVTemplate,
  generateHoursCSVTemplate,
  type CSVImportResult,
  type EmployeeCSVRow,
  type HoursCSVRow,
} from '../lib/csvImport';

type ImportType = 'employees' | 'hours';

interface CSVImporterProps {
  importType: ImportType;
  existingEmployeeEmails?: string[];
  onImportComplete?: (data: Record<string, unknown>[]) => void;
}

export default function CSVImporter({
  importType,
  existingEmployeeEmails = [],
  onImportComplete,
}: CSVImporterProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<CSVImportResult | null>(null);
  const [businessValidation, setBusinessValidation] = useState<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  } | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'confirm'>('upload');
  const [importing, setImporting] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    // Read and parse CSV
    const text = await selectedFile.text();
    let result: CSVImportResult;

    if (importType === 'employees') {
      result = importEmployeeCSV(text);

      // Run business rules validation
      if (result.valid) {
        const bizValidation = validateEmployeeBusinessRules(
          result.data as unknown as EmployeeCSVRow[],
          new Set(existingEmployeeEmails)
        );
        setBusinessValidation(bizValidation);
      }
    } else {
      result = importHoursCSV(text);

      // Run business rules validation
      if (result.valid) {
        const bizValidation = validateHoursBusinessRules(
          result.data as unknown as HoursCSVRow[],
          new Set(existingEmployeeEmails)
        );
        setBusinessValidation(bizValidation);
      }
    }

    setImportResult(result);
    if (result.valid && (!businessValidation || businessValidation.valid)) {
      setStep('preview');
    }
  };

  const handleDownloadTemplate = () => {
    const template =
      importType === 'employees'
        ? generateEmployeeCSVTemplate()
        : generateHoursCSVTemplate();

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${importType}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!importResult || !importResult.valid) return;

    setImporting(true);
    try {
      // In a real app, this would call an API to process the import
      await new Promise((resolve) => setTimeout(resolve, 1000));
      onImportComplete?.(importResult.data);
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setImportResult(null);
    setBusinessValidation(null);
    setStep('upload');
  };

  return (
    <div className="csv-importer">
      <div className="importer-header">
        <h2>
          Import {importType === 'employees' ? 'Employees' : 'Hours'} from CSV
        </h2>
        <button onClick={handleDownloadTemplate} className="btn btn-secondary">
          📥 Download Template
        </button>
      </div>

      {step === 'upload' && (
        <div className="upload-step">
          <div className="upload-zone">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="file-input"
              id="csv-file"
            />
            <label htmlFor="csv-file" className="file-label">
              <div className="upload-icon">📄</div>
              <p>Click to select CSV file or drag and drop</p>
              <p className="text-sm text-gray-500">CSV files only</p>
            </label>
          </div>

          {file && !importResult && (
            <div className="processing">
              <div className="spinner"></div>
              <p>Processing {file.name}...</p>
            </div>
          )}

          {importResult && !importResult.valid && (
            <div className="validation-errors">
              <h3>Validation Errors</h3>
              <div className="error-list">
                {importResult.errors.map((error, index) => (
                  <div key={index} className="error-item">
                    <span className="error-icon">❌</span>
                    <div>
                      <strong>
                        Row {error.row}, {error.field}:
                      </strong>
                      <p>{error.error}</p>
                      {error.value && (
                        <p className="error-value">Value: "{error.value}"</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={handleReset} className="btn btn-primary mt-4">
                Try Again
              </button>
            </div>
          )}

          {businessValidation && !businessValidation.valid && (
            <div className="validation-errors">
              <h3>Business Rules Errors</h3>
              <div className="error-list">
                {businessValidation.errors.map((error, index) => (
                  <div key={index} className="error-item">
                    <span className="error-icon">❌</span>
                    <p>{error}</p>
                  </div>
                ))}
              </div>
              <button onClick={handleReset} className="btn btn-primary mt-4">
                Try Again
              </button>
            </div>
          )}
        </div>
      )}

      {step === 'preview' && importResult && (
        <div className="preview-step">
          <div className="preview-summary">
            <h3>Import Summary</h3>
            <div className="summary-stats">
              <div className="stat-card">
                <div className="stat-value">{importResult.totalRows}</div>
                <div className="stat-label">Total Rows</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{importResult.validRows}</div>
                <div className="stat-label">Valid Rows</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{importResult.errors.length}</div>
                <div className="stat-label">Errors</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{importResult.warnings.length}</div>
                <div className="stat-label">Warnings</div>
              </div>
            </div>
          </div>

          {importResult.warnings.length > 0 && (
            <div className="warnings-section">
              <h4>⚠️ Warnings</h4>
              <div className="warning-list">
                {importResult.warnings.map((warning, index) => (
                  <div key={index} className="warning-item">
                    <p>{warning.error}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {businessValidation?.warnings && businessValidation.warnings.length > 0 && (
            <div className="warnings-section">
              <h4>⚠️ Business Rules Warnings</h4>
              <div className="warning-list">
                {businessValidation.warnings.map((warning, index) => (
                  <div key={index} className="warning-item">
                    <p>{warning}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="preview-data">
            <h4>Data Preview (First 10 Rows)</h4>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    {importResult.preview.length > 0 &&
                      Object.keys(importResult.preview[0]).map((key) => (
                        <th key={key}>{key}</th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {importResult.preview.map((row, index) => (
                    <tr key={index}>
                      {Object.values(row).map((value, cellIndex) => (
                        <td key={cellIndex}>{String(value)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="preview-actions">
            <button onClick={handleReset} className="btn btn-secondary">
              Cancel
            </button>
            <button onClick={() => setStep('confirm')} className="btn btn-primary">
              Continue to Confirm
            </button>
          </div>
        </div>
      )}

      {step === 'confirm' && importResult && (
        <div className="confirm-step">
          <div className="confirm-message">
            <div className="confirm-icon">⚠️</div>
            <h3>Confirm Import</h3>
            <p>
              You are about to import <strong>{importResult.validRows}</strong>{' '}
              {importType === 'employees' ? 'employees' : 'hours records'}.
            </p>
            {businessValidation?.warnings && businessValidation.warnings.length > 0 && (
              <p className="warning-text">
                There are {businessValidation.warnings.length} warnings. Please review
                them carefully before proceeding.
              </p>
            )}
            <p>This action cannot be undone. Are you sure you want to continue?</p>
          </div>

          <div className="confirm-actions">
            <button
              onClick={() => setStep('preview')}
              className="btn btn-secondary"
              disabled={importing}
            >
              Back to Preview
            </button>
            <button
              onClick={handleImport}
              className="btn btn-primary"
              disabled={importing}
            >
              {importing ? (
                <>
                  <span className="spinner-sm"></span>
                  Importing...
                </>
              ) : (
                'Confirm Import'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
