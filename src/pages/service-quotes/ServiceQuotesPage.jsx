import { useState } from "react";
import { Button, DatePicker, Input, Modal, Select, Space, Table, message } from "antd";
import { useNavigate } from "react-router";
import {
  Banknote,
  CircleCheck,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Pencil,
  ReceiptText,
  Search,
  Trash2,
} from "lucide-react";
import dayjs from "@/lib/dayjs";
import PageHeader from "@/components/PageHeader";
import IconAction from "@/components/IconAction";
import ShareToggle from "@/components/ShareToggle";
import StatusTag from "@/components/StatusTag";
import { deleteQuote, listQuotes, markQuoteBooked, markQuotePaid } from "@/services/api/serviceQuoteApi";
import { createInvoice } from "@/services/api/invoiceApi";
import { dataOf, errorMessage } from "@/services/apiResult";
import { usePagedList } from "@/hooks/usePagedList";
import { PERMISSION, useCan } from "@/lib/session";
import { formatDate } from "@/utils/datetime";
import { formatMoney } from "@/utils/format";
import InvoiceViewModal from "./components/InvoiceViewModal";
import { downloadMonthlyQuotesExcel } from "./quotesExcel";
import "./ServiceQuotesPage.scss";

const MONTH = "YYYY-MM";
const STATUS_OPTIONS = [
  { value: "SAVED", label: "Sent" },
  { value: "SIGNED", label: "Signed" },
  { value: "DRAFT", label: "Draft" },
];
const PAYMENT_OPTIONS = [
  { value: "NOT_PAID", label: "Not paid" },
  { value: "PAID", label: "Paid" },
  { value: "CHECK_PAID", label: "Paid by check" },
  { value: "ACH_PAID", label: "Paid by ACH" },
];

const open = (url) => window.open(url, "_blank", "noopener");

// Service quotes: one month at a time (this month to start), with what the
// office does next: mark booked or paid, make the invoice, share or delete.
const ServiceQuotesPage = () => {
  const navigate = useNavigate();
  const canDelete = useCan(PERMISSION.DELETE_RECORDS);
  const [viewing, setViewing] = useState(null);
  const [exporting, setExporting] = useState(false);
  const list = usePagedList((query) => listQuotes(query), {
    filters: { month: dayjs().format(MONTH) },
    errorText: "Couldn't load the quotes",
  });

  const act = async (action, success, failure) => {
    try {
      await action();
      message.success(success);
      list.reload();
    } catch (error) {
      message.error(errorMessage(error, failure));
    }
  };

  const markPaid = (quote) => {
    let method = "CHECK";
    Modal.confirm({
      title: `Mark quote ${quote.ref_no} paid?`,
      content: (
        <Select
          defaultValue="CHECK"
          style={{ width: "100%", marginTop: 8 }}
          onChange={(value) => (method = value)}
          options={[
            { value: "CHECK", label: "Paid by check" },
            { value: "ACH", label: "Paid by ACH" },
          ]}
        />
      ),
      okText: "Mark Paid",
      onOk: () => act(() => markQuotePaid(quote.id, method), "Quote marked paid; its link is closed", "Couldn't mark it paid"),
    });
  };

  const makeInvoice = async (quote) => {
    try {
      const invoice = dataOf(await createInvoice({ quote_id: quote.id }));
      message.success("Invoice made from the quote");
      navigate(`/edit-invoice/${invoice.id}`);
    } catch (error) {
      message.error(errorMessage(error, "Couldn't make the invoice"));
    }
  };

  const confirmDelete = (quote) =>
    Modal.confirm({
      title: `Delete quote ${quote.ref_no}?`,
      content: "Its payment link closes. This can't be undone.",
      okText: "Delete",
      okType: "danger",
      onOk: () => act(() => deleteQuote(quote.id), "Quote deleted", "Couldn't delete the quote"),
    });

  const exportMonth = async () => {
    const month = list.filters.month || dayjs().format(MONTH);
    setExporting(true);
    try {
      const monthName = await downloadMonthlyQuotesExcel(month);
      message.success(`Service quotes for ${monthName} downloaded`);
    } catch (error) {
      message.error(errorMessage(error, "Couldn't make the spreadsheet"));
    } finally {
      setExporting(false);
    }
  };

  const columns = [
    {
      title: "Quote #",
      dataIndex: "ref_no",
      render: (ref, quote) => (
        <Button type="link" className="table-link" onClick={() => setViewing(quote)}>
          {ref || `Quote ${quote.id}`}
        </Button>
      ),
    },
    {
      title: "Client",
      key: "client",
      render: (_, quote) => (
        <Button type="link" className="table-link" onClick={() => navigate(`/viewUser/${quote.user_id}?tab=quotes`)}>
          {quote.client?.name || quote.to_company_name || "Client"}
        </Button>
      ),
    },
    { title: "Amount", dataIndex: "total_due", align: "right", render: formatMoney },
    { title: "Status", dataIndex: "status", render: (status) => <StatusTag code={status} /> },
    { title: "Job", dataIndex: "job_status", render: (status) => <StatusTag code={status} /> },
    { title: "Payment", dataIndex: "payment_status", render: (status) => <StatusTag code={status} /> },
    { title: "Expires", dataIndex: "expires_at", render: (date) => formatDate(date) },
    {
      title: "Actions",
      key: "actions",
      width: 300,
      render: (_, quote) => (
        <Space size={4} wrap>
          <IconAction icon={Eye} title="View" onClick={() => setViewing(quote)} />
          <IconAction icon={Pencil} title="Edit" onClick={() => navigate(`/edit-service-quote/${quote.id}`)} />
          {quote.pdf_url && <IconAction icon={FileText} title="PDF" onClick={() => open(quote.pdf_url)} />}
          {quote.payment_url && quote.payment_status === "NOT_PAID" && (
            <IconAction icon={ExternalLink} title="Payment link" onClick={() => open(quote.payment_url)} />
          )}
          {quote.job_status === "NOT_BOOKED" && (
            <IconAction
              icon={CircleCheck}
              title="Mark booked"
              onClick={() => act(() => markQuoteBooked(quote.id), "Quote marked booked", "Couldn't mark it booked")}
            />
          )}
          {quote.payment_status === "NOT_PAID" && (
            <IconAction icon={Banknote} title="Mark paid by check or ACH" onClick={() => markPaid(quote)} />
          )}
          {quote.invoice_id ? (
            <IconAction icon={ReceiptText} title="Open its invoice" onClick={() => navigate(`/edit-invoice/${quote.invoice_id}`)} />
          ) : (
            quote.status !== "DRAFT" && (
              <IconAction icon={ReceiptText} title="Make an invoice from this quote" onClick={() => makeInvoice(quote)} />
            )
          )}
          <ShareToggle kind="quote" id={quote.id} sharedAt={quote.shared_at} onChanged={list.reload} />
          {canDelete && <IconAction icon={Trash2} title="Delete" danger onClick={() => confirmDelete(quote)} />}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="SERVICE QUOTES"
        subtitle="Quotes sent to clients with a payment link. Start a new one from the client's page."
        actions={
          <>
            <DatePicker
              picker="month"
              size="large"
              format="MMMM YYYY"
              placeholder="Every month"
              value={list.filters.month ? dayjs(list.filters.month, MONTH) : null}
              onChange={(value) => list.setFilter("month", value ? value.format(MONTH) : undefined)}
            />
            <Select
              size="large"
              allowClear
              placeholder="Any status"
              style={{ width: 140 }}
              options={STATUS_OPTIONS}
              value={list.filters.status}
              onChange={(value) => list.setFilter("status", value)}
            />
            <Select
              size="large"
              allowClear
              placeholder="Any payment"
              style={{ width: 160 }}
              options={PAYMENT_OPTIONS}
              value={list.filters.payment_status}
              onChange={(value) => list.setFilter("payment_status", value)}
            />
            <Input
              allowClear
              size="large"
              prefix={<Search size={16} className="text-subtle" />}
              placeholder="Search reference or company"
              style={{ width: 230 }}
              value={list.searchText}
              onChange={(event) => list.setSearchText(event.target.value)}
            />
            <Button size="large" icon={<Download size={16} />} loading={exporting} onClick={exportMonth}>
              Monthly Excel
            </Button>
          </>
        }
      />
      <Table rowKey="id" columns={columns} scroll={{ x: "max-content" }} size="middle" {...list.tableProps} />
      {viewing && <InvoiceViewModal invoice={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
};

export default ServiceQuotesPage;
