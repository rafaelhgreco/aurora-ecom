import ExcelJS from "exceljs";
import {
  canonicalizeColumnKey,
  isHeaderRow,
  isRowEmpty,
  mapRowValuesToRecord,
  parseSpreadsheetRow,
  type RawSpreadsheetRow,
} from "@/core/import/parse-spreadsheet-row";
import type {
  BulkImportRow,
  BulkImportRowError,
} from "@/core/schemas/bulk-import.schema";

const MAX_ROWS = 500;

export type ParseXlsxResult = {
  rows: BulkImportRow[];
  errors: BulkImportRowError[];
};

export async function parseXlsxBuffer(
  buffer: Buffer,
  cloudName?: string,
): Promise<ParseXlsxResult> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);

  const sheet =
    workbook.getWorksheet("Produtos") ?? workbook.worksheets[0] ?? null;
  if (!sheet) {
    return {
      rows: [],
      errors: [
        { lineNumber: 0, message: 'Planilha sem aba "Produtos" ou dados' },
      ],
    };
  }

  const rows: BulkImportRow[] = [];
  const errors: BulkImportRowError[] = [];
  let headers: string[] = [];
  let dataRowCount = 0;

  sheet.eachRow((row, rowNumber) => {
    const values = (row.values as unknown[]) ?? [];
    const cells = values.slice(1);

    if (rowNumber === 1 || (headers.length === 0 && isHeaderRow(cells))) {
      headers = cells.map((c) =>
        String(canonicalizeColumnKey(String(c ?? ""))),
      );
      return;
    }

    const record: RawSpreadsheetRow = mapRowValuesToRecord(
      headers,
      cells,
      rowNumber,
    );

    if (isRowEmpty(record)) return;

    dataRowCount++;
    if (dataRowCount > MAX_ROWS) {
      errors.push({
        lineNumber: rowNumber,
        message: `Limite de ${MAX_ROWS} linhas de dados excedido`,
      });
      return;
    }

    const { row: parsed, errors: rowErrs } = parseSpreadsheetRow(
      record,
      cloudName,
    );
    if (rowErrs.length > 0) {
      errors.push(...rowErrs);
    } else if (parsed) {
      rows.push(parsed);
    }
  });

  return { rows, errors };
}
