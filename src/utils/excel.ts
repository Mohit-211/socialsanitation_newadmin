import writeExcelFile, { type SheetData, type SheetOptions } from "write-excel-file/browser";
import { cssVar } from "@/theme/antdTheme";

/**
 * Builds and downloads an .xlsx file with write-excel-file
 * (replaces exceljs, xlsx-js-style and file-saver).
 *
 *   await saveXlsx(rows, { columns: [{ width: 20 }], stickyRowsCount: 1 }, "Report.xlsx");
 *
 * `rows` is an array of rows; each cell is a value or an object such as
 * { value, fontWeight: "bold", backgroundColor, textColor, align, wrap,
 *   columnSpan, format: "$#,##0.00" }. Empty cells are `null`.
 */
export async function saveXlsx(rows: SheetData, options: SheetOptions<File | Blob | ArrayBuffer>, fileName: string) {
  await writeExcelFile(rows, options).toFile(fileName);
}

/**
 * Cell styles in the app's theme colors. Excel needs real hex values, so
 * they are read from the CSS tokens when the export runs.
 */
export function excelStyles() {
  const border = {
    borderColor: cssVar("--color-border-strong"),
    borderStyle: "thin" as const,
  };
  return {
    border,
    title: { fontWeight: "bold" as const, fontSize: 16, align: "center" as const },
    header: {
      ...border,
      fontWeight: "bold" as const,
      backgroundColor: cssVar("--color-primary"),
      textColor: cssVar("--color-on-primary"),
      align: "center" as const,
      alignVertical: "center" as const,
    },
    subheader: {
      ...border,
      fontWeight: "bold" as const,
      backgroundColor: cssVar("--color-primary-soft"),
      textColor: cssVar("--color-on-primary"),
    },
    total: {
      ...border,
      fontWeight: "bold" as const,
      backgroundColor: cssVar("--color-bg-muted"),
    },
    note: { fontStyle: "italic" as const, textColor: cssVar("--color-text-muted") },
    success: { backgroundColor: cssVar("--color-success-subtle") },
    warning: { backgroundColor: cssVar("--color-warning-subtle") },
    error: { backgroundColor: cssVar("--color-error-subtle") },
    muted: { backgroundColor: cssVar("--color-bg-subtle") },
    currency: "$#,##0.00",
  };
}
