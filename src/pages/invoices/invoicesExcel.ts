import dayjs from "@/lib/dayjs";
import { getInvoicesMonthlySummary } from "@/services/api/invoiceApi";
import { dataOf } from "@/services/apiResult";
import { saveXlsx, excelStyles } from "@/utils/excel";
import { cssVar } from "@/theme/antdTheme";
import type { CellObject, Row, SheetData } from "write-excel-file/browser";
import type { InvoiceRecord, InvoicesMonthlySummary } from "@/types";

// The monthly invoice report: each client's invoices of the month, one column
// per billing day, with paid / not-paid totals.

const PAID_STATUSES: (string | null)[] = ["PAID", "CHECK_PAID", "CASH_PAID", "ACH_PAID"];
const isPaid = (invoice: InvoiceRecord) => PAID_STATUSES.includes(invoice.payment_status);

// Every row of the report is 32pt high.
const ROW_HEIGHT = 32;

const ordinalSuffix = (n: number) => {
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) return "st";
  if (j === 2 && k !== 12) return "nd";
  if (j === 3 && k !== 13) return "rd";
  return "th";
};

/** Builds and downloads the report for `month` (YYYY-MM); answers the month's name. */
export async function downloadMonthlyInvoicesExcel(month: string): Promise<string> {
  const summary: InvoicesMonthlySummary = dataOf(await getInvoicesMonthlySummary(month)) || {
    billing_dates: [],
    employees: [],
  };
  const clients = summary.employees || [];
  const dayNumbers = [...new Set((summary.billing_dates || []).map((date) => dayjs(date, "YYYY-MM-DD").date()))].sort(
    (a, b) => a - b,
  );

  const monthName = dayjs(`${month}-01`).format("MMMM YYYY");
  const monthShort = dayjs(`${month}-01`).format("MMM");
  const styles = excelStyles();

  const all = clients.flatMap((client) => client.invoices || []);
  const sum = (list: InvoiceRecord[]) => list.reduce((total, invoice) => total + Number(invoice.total_due || 0), 0);
  const paid = all.filter(isPaid);
  const unpaid = all.filter((invoice) => !isPaid(invoice));

  const mergeSpan = Math.max(6, dayNumbers.length + 1);
  const mergedRow = (cell: CellObject): Row => [{ ...cell, columnSpan: mergeSpan, height: ROW_HEIGHT }, ...Array(mergeSpan - 1).fill(null)];

  const rows: SheetData = [];
  rows.push(mergedRow({ value: `Monthly Invoice Report - ${monthName}`, ...styles.title }));
  rows.push(
    ["Total Invoices", "Total Amount", "Paid", "Paid Amount", "Not Paid", "Not Paid Amount"].map((value) => ({
      value,
      ...styles.header,
      height: ROW_HEIGHT,
    })),
  );
  rows.push(
    [all.length, sum(all), paid.length, sum(paid), unpaid.length, sum(unpaid)].map((value, i) => ({
      value,
      fontWeight: "bold",
      align: "center",
      height: ROW_HEIGHT,
      // The 2nd, 4th and 6th columns are amounts.
      ...(i % 2 === 1 ? { format: styles.currency } : {}),
    })),
  );
  rows.push(
    mergedRow({
      value: "🟢 Paid (Cash / Check / ACH / Card)    🟠 Not Paid (including Overdue)",
      ...styles.note,
      fontSize: 11,
    }),
  );
  rows.push(
    ["Client's Name", ...dayNumbers.map((d) => `${d}${ordinalSuffix(d)} ${monthShort}`)].map((value) => ({
      value,
      ...styles.header,
      height: ROW_HEIGHT,
    })),
  );

  // Rows are striped by their sheet row number.
  const firstDataRow = rows.length + 1;
  clients.forEach((client, index) => {
    const invoices = client.invoices || [];
    const hasUnpaid = invoices.some((invoice) => !isPaid(invoice));
    const rowFill = hasUnpaid
      ? styles.error
      : (firstDataRow + index) % 2 === 0
        ? styles.muted
        : { backgroundColor: cssVar("--color-bg") };

    const row: Row = [
      {
        value: client.name || "Unknown",
        ...rowFill,
        fontWeight: "bold",
        textColor: cssVar(hasUnpaid ? "--color-error-strong" : "--color-text"),
        alignVertical: "center",
        height: ROW_HEIGHT,
      },
    ];

    dayNumbers.forEach((day) => {
      const ofDay = invoices.filter(
        (invoice) => invoice.billing_date && dayjs(invoice.billing_date, "YYYY-MM-DD").date() === day,
      );
      if (!ofDay.length) {
        row.push({ value: "—", ...rowFill, align: "center" });
        return;
      }
      const lines = ofDay.map(
        (invoice) =>
          `${invoice.custom_ref_no || invoice.ref_no} $${Number(invoice.total_due || 0).toFixed(2)} ${isPaid(invoice) ? "🟢" : "🟠"}`,
      );
      row.push({
        value: [ofDay.length > 1 ? `${ofDay.length} invoices` : null, ...lines].filter(Boolean).join("\n"),
        ...(ofDay.every(isPaid) ? styles.success : styles.warning),
        wrap: true,
        alignVertical: "top",
      });
    });

    rows.push(row);
  });

  await saveXlsx(
    rows,
    {
      sheet: `Monthly Invoices ${monthName}`,
      columns: Array.from({ length: mergeSpan }, (_, i) => ({ width: i === 0 ? 34 : 19 })),
      stickyRowsCount: 5,
      stickyColumnsCount: 1,
      orientation: "landscape",
    },
    `Invoice Report - ${monthName}.xlsx`,
  );
  return monthName;
}
