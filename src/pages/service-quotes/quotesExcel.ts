import dayjs from "@/lib/dayjs";
import { listQuotes } from "@/services/api/serviceQuoteApi";
import { pageOf } from "@/services/apiResult";
import { saveXlsx, excelStyles } from "@/utils/excel";
import type { CellObject, Row, SheetData } from "write-excel-file/browser";
import type { Quote } from "@/types";
import { cssVar } from "@/theme/antdTheme";
import { BUSINESS_TIME_ZONE } from "@/utils/datetime";

// The monthly Service Quote report: every quote made that month, grouped by
// client, with one column per day and paid / not-paid totals.

// The day of the month a quote was made, in Eastern time.
const dayOf = (timestamp: string | null) => dayjs(timestamp).tz(BUSINESS_TIME_ZONE).date();

// Every quote of a month: the list is paged (50 at most per page).
async function quotesOfMonth(month: string): Promise<Quote[]> {
  const quotes: Quote[] = [];
  for (let page = 1; ; page += 1) {
    const { items, pagination } = pageOf(await listQuotes({ month, page, limit: 50 }));
    quotes.push(...items);
    if (!pagination || page >= pagination.total_pages) break;
  }
  return quotes;
}

/** Builds and downloads the report for `formattedMonth` (YYYY-MM); answers the month's name. */
export async function downloadMonthlyQuotesExcel(formattedMonth: string): Promise<string> {
  const quotes = await quotesOfMonth(formattedMonth);
  const byClient = new Map<number | string, { name: string; invoices: Quote[] }>();
  for (const quote of quotes) {
    const key = quote.user_id ?? `company:${quote.to_company_name}`;
    const group = byClient.get(key) ?? { name: quote.client?.name || quote.to_company_name || "Unknown", invoices: [] };
    group.invoices.push(quote);
    byClient.set(key, group);
  }
  const users = [...byClient.values()].sort((a, b) => a.name.localeCompare(b.name));

  const monthName = dayjs(formattedMonth).format("MMMM YYYY");
  const monthShort = dayjs(formattedMonth).format("MMM");

  const ordinalSuffix = (n: number) => {
    const j = n % 10;
    const k = n % 100;
    if (j === 1 && k !== 11) return "st";
    if (j === 2 && k !== 12) return "nd";
    if (j === 3 && k !== 13) return "rd";
    return "th";
  };

  const formatDayHeader = (d: number) => "" + d + ordinalSuffix(d) + " " + monthShort;

  const allDates: number[] = [];
  users.forEach((user) => {
    (user.invoices || []).forEach((inv) => {
      if (inv.created_at) {
        allDates.push(dayOf(inv.created_at));
      }
    });
  });

  const dayNumbers = Array.from(new Set(allDates)).sort((a, b) => a - b);

  // Themed cell styles (header, status fills, currency format...).
  const styles = excelStyles();

  const paidStatuses: (string | null)[] = ["PAID", "CASH_PAID", "CHECK_PAID", "ACH_PAID"];

  const getFinalStatus = (inv: Quote): "PAID" | "NOT_PAID" => {
    if (paidStatuses.includes(inv.payment_status)) return "PAID";
    return "NOT_PAID";
  };

  let totalInvoices = 0;
  let totalAmount = 0;
  let paidCount = 0;
  let paidAmount = 0;
  let notPaidCount = 0;
  let notPaidAmount = 0;

  users.forEach((user) => {
    (user.invoices || []).forEach((inv) => {
      const amount = Number(inv.total_due || 0);
      totalInvoices++;
      totalAmount += amount;

      if (paidStatuses.includes(inv.payment_status)) {
        paidCount++;
        paidAmount += amount;
      } else {
        notPaidCount++;
        notPaidAmount += amount;
      }
    });
  });

  const mergeSpan = Math.max(6, dayNumbers.length + 1);

  // Rows are 34pt high (the sheet's row height); client rows grow with
  // the number of quotes on their busiest day.
  const ROW_HEIGHT = 34;

  // One cell merged across the full report width.
  const mergedRow = (cell: CellObject): Row => [
    { ...cell, columnSpan: mergeSpan, height: ROW_HEIGHT },
    ...Array(mergeSpan - 1).fill(null),
  ];

  const rows: SheetData = [];

  rows.push(
    mergedRow({
      value: "Service Quote Invoices - " + monthName,
      ...styles.title,
    }),
  );

  rows.push(
    [
      "Total Invoices",
      "Total Amount",
      "Paid",
      "Paid Amount",
      "Not Paid",
      "Not Paid Amount",
    ].map((value) => ({ value, ...styles.header, height: ROW_HEIGHT })),
  );

  rows.push(
    [
      totalInvoices,
      totalAmount,
      paidCount,
      paidAmount,
      notPaidCount,
      notPaidAmount,
    ].map((value, i) => ({
      value,
      fontWeight: "bold",
      align: "center",
      height: ROW_HEIGHT,
      // 2nd, 4th and 6th columns are amounts
      ...(i % 2 === 1 ? { format: styles.currency } : {}),
    })),
  );

  rows.push(
    mergedRow({
      value: "🟢 Paid (Card / Check / ACH / Cash)     🟠 Not Paid",
      ...styles.note,
      fontSize: 11,
    }),
  );

  const header = ["Client Name"].concat(dayNumbers.map(formatDayHeader));

  rows.push(
    header.map((value) => ({
      value,
      ...styles.header,
      height: ROW_HEIGHT,
    })),
  );

  // Sheet row number of the first client row (rows are striped by it).
  const firstDataRow = rows.length + 1;

  users.forEach((user, userIndex) => {
    const userInvoices = user.invoices || [];
    const hasUnpaid = userInvoices.some(
      (inv) => getFinalStatus(inv) === "NOT_PAID",
    );

    // Fill for the whole row; day cells with quotes use a status fill.
    const rowFill = hasUnpaid
      ? styles.error
      : (firstDataRow + userIndex) % 2 === 0
        ? styles.muted
        : { backgroundColor: cssVar("--color-bg") };

    const maxQuotesInADay = Math.max(
      1,
      ...dayNumbers.map(
        (d) =>
          userInvoices.filter((inv) => dayOf(inv.created_at) === d)
            .length,
      ),
    );

    const row: Row = [
      {
        value: user.name || "Unknown",
        ...rowFill,
        fontWeight: "bold",
        textColor: cssVar(
          hasUnpaid ? "--color-error-strong" : "--color-text",
        ),
        alignVertical: "center",
        height: Math.max(34, 20 + maxQuotesInADay * 16),
      },
    ];

    dayNumbers.forEach((d) => {
      const invoices = userInvoices.filter(
        (inv) => dayOf(inv.created_at) === d,
      );

      if (invoices.length === 0) {
        row.push({ value: "—", ...rowFill, align: "center" });
        return;
      }

      let text = "";
      let cellStatus: "PAID" | "NOT_PAID" = "PAID";

      invoices.forEach((inv) => {
        const status = getFinalStatus(inv);
        const emoji = status === "PAID" ? "🟢" : "🟠";
        const amount = "$" + Number(inv.total_due || 0).toFixed(2);
        text += inv.ref_no + "  " + amount + "  " + emoji + "\n";

        if (status === "NOT_PAID") cellStatus = "NOT_PAID";
      });

      row.push({
        value: text.trim(),
        ...(cellStatus === "PAID" ? styles.success : styles.warning),
        wrap: true,
        alignVertical: "top",
        align: "center",
      });
    });

    rows.push(row);
  });

  await saveXlsx(
    rows,
    {
      sheet: "Service Quotes " + monthName,
      columns: Array.from({ length: mergeSpan }, (_, i) => ({
        width: i === 0 ? 36 : 20,
      })),
      stickyRowsCount: 5,
      stickyColumnsCount: 1,
      orientation: "landscape",
    },
    "Service Quote Invoices - " + monthName + ".xlsx",
  );

  return monthName;
}
