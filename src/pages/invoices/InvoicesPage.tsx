import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Alert,
  Button,
  DatePicker,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  message,
  type TableColumnsType,
} from "antd";
import { Download, Plus, Search, Upload } from "lucide-react";
import dayjs from "@/lib/dayjs";
import PageHeader from "@/components/PageHeader";
import StatusTag from "@/components/StatusTag";
import { usePagedList } from "@/hooks/usePagedList";
import { listInvoices } from "@/services/api/invoiceApi";
import { clientPagePath } from "@/pages/clients/clientFlow";
import { formatDate, formatDateTime } from "@/utils/datetime";
import { formatMoney } from "@/utils/format";
import InvoiceActions from "./components/InvoiceActions";
import InvoiceImportModal from "./components/InvoiceImportModal";
import { downloadMonthlyInvoicesExcel } from "./invoicesExcel";
import "./invoices.scss";
import type { InvoiceImportResult, InvoiceSummary } from "@/types";

// Client names from a CSV import that don't exist yet, kept in this browser
// until they're imported or dismissed.
const PENDING_CLIENTS_KEY = "csvPendingClients";

const PAYMENT_STATUS_OPTIONS = [
  { value: "NOT_PAID", label: "Not paid" },
  { value: "PAID", label: "Paid by card" },
  { value: "CHECK_PAID", label: "Paid by check" },
  { value: "ACH_PAID", label: "Paid by ACH" },
  { value: "CASH_PAID", label: "Paid in cash" },
];

const PAID_BY: Record<string, string> = {
  CHECK_PAID: "by check",
  ACH_PAID: "by ACH",
  CASH_PAID: "in cash",
  PAID: "by card",
};

const readPendingClients = (): string[] => {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(PENDING_CLIENTS_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((name): name is string => typeof name === "string") : [];
  } catch {
    return [];
  }
};

const savePendingClients = (list: string[]) => {
  try {
    if (list.length) localStorage.setItem(PENDING_CLIENTS_KEY, JSON.stringify(list));
    else localStorage.removeItem(PENDING_CLIENTS_KEY);
  } catch {
    // Not kept in this browser; the import result still lists them.
  }
};

const serviceDatesText = (text: string | null) => {
  const [start, end] = String(text || "").split(" - ");
  return start && end ? `${formatDate(start)} – ${formatDate(end)}` : text || "—";
};

// Every invoice, newest billing date first, by month: where each stands and
// what to do next. A client's invoices are also on their page.
const InvoicesPage = () => {
  const navigate = useNavigate();
  const [importOpen, setImportOpen] = useState(false);
  const [pendingClients, setPendingClients] = useState<string[]>(readPendingClients);
  const [downloading, setDownloading] = useState(false);

  const list = usePagedList((query) => listInvoices(query), {
    filters: { month: dayjs().format("YYYY-MM") },
    errorText: "Couldn't load the invoices",
  });
  const month = typeof list.filters.month === "string" ? list.filters.month : undefined;

  const updatePendingClients = (names: string[]) => {
    setPendingClients(names);
    savePendingClients(names);
  };

  const onImported = (result: InvoiceImportResult) => {
    const importedNames = (result.invoices || []).map((invoice) => invoice.client_name);
    const missingNames = (result.unmatched || [])
      .filter((row) => row.reason === "Client not found")
      .map((row) => row.client_name);
    updatePendingClients([
      ...new Set(
        [...pendingClients.filter((name) => !importedNames.includes(name)), ...missingNames].filter(
          (name): name is string => Boolean(name),
        ),
      ),
    ]);
    // Show the month of the first invoice imported.
    const first = result.invoices?.[0]?.billing_date;
    if (first) list.setFilter("month", dayjs(first).format("YYYY-MM"));
    list.reload();
  };

  const downloadExcel = async () => {
    if (!month) return;
    setDownloading(true);
    try {
      const monthName = await downloadMonthlyInvoicesExcel(month);
      message.success(`Invoice Report - ${monthName} downloaded`);
    } catch {
      message.error("Couldn't make the report");
    } finally {
      setDownloading(false);
    }
  };

  const columns: TableColumnsType<InvoiceSummary> = [
    {
      title: "Invoice",
      key: "ref",
      render: (_value, invoice) => (
        <div className="invoice-number-cell">
          {invoice.is_historical ? (
            <span>{invoice.custom_ref_no || invoice.ref_no}</span>
          ) : (
            <Button type="link" className="table-link" onClick={() => navigate(`/edit-invoice/${invoice.id}`)}>
              {invoice.custom_ref_no || invoice.ref_no}
            </Button>
          )}
          {invoice.is_historical && (
            <div className="csv-badge-row">
              <Tag>Imported</Tag>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Client",
      key: "client",
      render: (_value, invoice) => (
        <div>
          {invoice.user_id ? (
            <Button
              type="link"
              className="table-link"
              onClick={() => navigate(clientPagePath(invoice.user_id, "invoices"))}
            >
              {invoice.client_name || invoice.to_company_name || "Client"}
            </Button>
          ) : (
            invoice.to_company_name || "—"
          )}
          {invoice.client_name && invoice.to_company_name && invoice.to_company_name !== invoice.client_name && (
            <div className="text-subtle">{invoice.to_company_name}</div>
          )}
        </div>
      ),
    },
    { title: "Service Dates", dataIndex: "service_dates", render: serviceDatesText },
    { title: "Billed", dataIndex: "billing_date", render: (date: string | null) => formatDate(date) },
    { title: "Due", dataIndex: "due_date", render: (date: string | null) => formatDate(date) },
    { title: "Total", dataIndex: "total_due", align: "right", render: formatMoney },
    {
      title: "Due Now",
      dataIndex: "amount_due_now",
      align: "right",
      render: (amount: number | null, invoice) => (invoice.state === "paid" ? "—" : formatMoney(amount)),
    },
    {
      title: "State",
      key: "state",
      render: (_value, invoice) => (
        <Space size={4} orientation="vertical">
          <StatusTag code={invoice.state} />
          {invoice.state === "paid" && PAID_BY[invoice.payment_status ?? ""] && (
            <span className="text-subtle">{PAID_BY[invoice.payment_status ?? ""]}</span>
          )}
          {invoice.state === "scheduled" && invoice.scheduled_send_at && (
            <span className="text-subtle">Goes {formatDateTime(invoice.scheduled_send_at)}</span>
          )}
        </Space>
      ),
    },
    {
      title: "Reminders",
      key: "reminders",
      render: (_value, invoice) =>
        invoice.reminder_count ? (
          <Tooltip title={invoice.last_reminder_at ? `Last ${formatDateTime(invoice.last_reminder_at)}` : undefined}>
            {invoice.reminder_count}
          </Tooltip>
        ) : (
          "—"
        ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 170,
      render: (_value, invoice) => (
        <InvoiceActions invoice={invoice} openPath={`/edit-invoice/${invoice.id}`} onChanged={list.reload} />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="INVOICES"
        subtitle="Every invoice by billing month. Start a client's invoice from their page to have it filled in."
        actions={
          <Space wrap>
            <Button size="large" icon={<Upload size={16} />} onClick={() => setImportOpen(true)}>
              Import CSV
            </Button>
            <Button size="large" icon={<Download size={16} />} onClick={downloadExcel} loading={downloading} disabled={!month}>
              {month ? `Report (${dayjs(`${month}-01`).format("MMM YYYY")})` : "Report (pick a month)"}
            </Button>
            <Button type="primary" size="large" icon={<Plus size={16} />} onClick={() => navigate("/generate-invoice")}>
              New Invoice
            </Button>
          </Space>
        }
      />

      <div className="all-invoices__toolbar">
        <Input
          allowClear
          size="large"
          className="all-invoices__search"
          prefix={<Search size={16} className="text-subtle" />}
          placeholder="Search by reference or company"
          value={list.searchText}
          onChange={(e) => list.setSearchText(e.target.value)}
        />
        <DatePicker
          picker="month"
          size="large"
          format="MMMM YYYY"
          placeholder="All months"
          value={month ? dayjs(`${month}-01`) : null}
          onChange={(value) => list.setFilter("month", value ? value.format("YYYY-MM") : undefined)}
        />
        <Select
          size="large"
          allowClear
          className="all-invoices__status-filter"
          placeholder="Any payment"
          value={list.filters.payment_status}
          onChange={(value) => list.setFilter("payment_status", value)}
          options={PAYMENT_STATUS_OPTIONS}
        />
      </div>

      {pendingClients.length > 0 && (
        <Alert
          className="csv-pending-banner"
          type="warning"
          showIcon
          title={`${pendingClients.length} client(s) from your CSV import don't exist yet`}
          description={
            <div>
              <p className="csv-pending-banner__text">
                Create each client under Clients with the exact name below, then import the same CSV again. Invoices
                already imported are skipped.
              </p>
              <div className="csv-client-list">
                {pendingClients.map((name) => (
                  <code key={name} className="csv-client-chip">
                    {name}
                  </code>
                ))}
              </div>
              <Space wrap>
                <Button
                  size="small"
                  onClick={() =>
                    navigator.clipboard
                      .writeText(pendingClients.join("\n"))
                      .then(() => message.success("Client names copied"))
                      .catch(() => message.error("Couldn't copy"))
                  }
                >
                  Copy Names
                </Button>
                <Button size="small" onClick={() => navigate("/users")}>
                  Go to Clients
                </Button>
                <Button size="small" type="text" onClick={() => updatePendingClients([])}>
                  Dismiss
                </Button>
              </Space>
            </div>
          }
        />
      )}

      <Table rowKey="id" columns={columns} size="middle" scroll={{ x: "max-content" }} {...list.tableProps} />

      <InvoiceImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={onImported}
        onGoToClients={() => navigate("/users")}
      />
    </>
  );
};

export default InvoicesPage;
