import { Button, Empty, Table, Tooltip } from "antd";
import { useNavigate } from "react-router";
import { Plus } from "lucide-react";
import StatusTag from "@/components/StatusTag";
import InvoiceActions from "@/pages/invoices/components/InvoiceActions";
import { formatDate, formatDateTime } from "@/utils/datetime";
import { formatMoney } from "@/utils/format";
import { NEW_DOCUMENT_PATHS, editPathFromClient } from "../clientFlow";
import type { TableColumnsType } from "antd";
import type { InvoiceSummary } from "@/types";
import type { ClientTabProps } from "./ClientProfileTab";

// The client's invoices, newest first, with what the office does next:
// send it now, remind the client, or record a check or ACH payment.
const ClientInvoicesTab = ({ clientId, flow, onChanged }: ClientTabProps) => {
  const navigate = useNavigate();
  const rows = flow?.invoices ?? [];

  const columns: TableColumnsType<InvoiceSummary> = [
    {
      title: "Invoice",
      key: "ref",
      render: (_, invoice) => (
        <Button type="link" className="client-flow__link" onClick={() => navigate(editPathFromClient("invoice", invoice.id, clientId))}>
          {invoice.custom_ref_no || invoice.ref_no || `Invoice ${invoice.id}`}
        </Button>
      ),
    },
    { title: "Billed", dataIndex: "billing_date", render: (date) => formatDate(date) },
    { title: "Due", dataIndex: "due_date", render: (date) => formatDate(date) },
    { title: "Total", dataIndex: "total_due", align: "right", render: formatMoney },
    { title: "Due Now", dataIndex: "amount_due_now", align: "right", render: formatMoney },
    { title: "State", dataIndex: "state", render: (state) => <StatusTag code={state} /> },
    {
      title: "Reminders",
      key: "reminders",
      render: (_, invoice) =>
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
      width: 200,
      render: (_, invoice) => (
        <InvoiceActions
          invoice={invoice}
          openPath={editPathFromClient("invoice", invoice.id, clientId)}
          onChanged={onChanged}
        />
      ),
    },
  ];

  return (
    <div className="client-flow__tab">
      <div className="client-flow__tab-head">
        <p className="text-secondary">
          Reminders go out by themselves before, on and after the due date. To bill a contract, use its row on the
          Contracts tab.
        </p>
        <Button type="primary" icon={<Plus size={16} />} onClick={() => navigate(NEW_DOCUMENT_PATHS.invoice(clientId))}>
          New Invoice
        </Button>
      </div>
      <Table
        rowKey="id"
        dataSource={rows}
        columns={columns}
        size="middle"
        pagination={rows.length > 10 ? { pageSize: 10 } : false}
        scroll={{ x: "max-content" }}
        locale={{ emptyText: <Empty description="No invoices yet." /> }}
      />
    </div>
  );
};

export default ClientInvoicesTab;
