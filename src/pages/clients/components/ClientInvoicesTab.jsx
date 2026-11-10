import { Button, Dropdown, Empty, Modal, Space, Table, Tooltip, message } from "antd";
import { useNavigate } from "react-router";
import { BellRing, Ellipsis, ExternalLink, FileText, Pencil, Plus, Send } from "lucide-react";
import IconAction from "@/components/IconAction";
import { deleteInvoice, markInvoicePaid, remindInvoice, sendInvoice } from "@/services/api/invoiceApi";
import { errorMessage } from "@/services/apiResult";
import { PERMISSION, useCan } from "@/lib/session";
import { formatDate, formatDateTime } from "@/utils/datetime";
import { NEW_DOCUMENT_PATHS, editPathFromClient } from "../clientFlow";
import { formatMoney } from "@/utils/format";
import StatusTag from "@/components/StatusTag";

const OPEN_STATES = new Set(["sent", "deposit_paid", "overdue"]);

// The client's invoices, newest first, with what the office does next:
// send it now, remind the client, or record a check or ACH payment.
const ClientInvoicesTab = ({ clientId, flow, onChanged }) => {
  const navigate = useNavigate();
  const canDelete = useCan(PERMISSION.DELETE_RECORDS);
  const rows = flow?.invoices ?? [];

  const act = async (action, success, failure) => {
    try {
      await action();
      message.success(success);
      onChanged?.();
    } catch (error) {
      message.error(errorMessage(error, failure));
    }
  };

  const menuFor = (invoice) => {
    const items = [];
    if (invoice.state === "draft" || invoice.state === "scheduled") {
      items.push({ key: "send", icon: <Send size={14} />, label: "Send now" });
    }
    if (OPEN_STATES.has(invoice.state)) {
      items.push({ key: "remind", icon: <BellRing size={14} />, label: "Send a reminder" });
    }
    if (invoice.state !== "paid" && invoice.state !== "cancelled") {
      items.push({ key: "paid-check", label: "Mark paid by check" }, { key: "paid-ach", label: "Mark paid by ACH" });
    }
    if (canDelete) items.push({ type: "divider" }, { key: "delete", danger: true, label: "Delete" });
    return items;
  };

  const onMenu = (invoice, key) => {
    if (key === "send") act(() => sendInvoice(invoice.id), "Invoice sent", "Couldn't send the invoice");
    if (key === "remind") act(() => remindInvoice(invoice.id), "Reminder sent", "Couldn't send the reminder");
    if (key === "paid-check" || key === "paid-ach") {
      const method = key === "paid-check" ? "CHECK" : "ACH";
      Modal.confirm({
        title: `Mark this invoice paid by ${method === "CHECK" ? "check" : "ACH"}?`,
        content: "Its online payment link closes.",
        okText: "Mark Paid",
        onOk: () => act(() => markInvoicePaid(invoice.id, method), "Invoice marked paid", "Couldn't mark it paid"),
      });
    }
    if (key === "delete") {
      Modal.confirm({
        title: "Delete this invoice?",
        content: "Any waiting payment link closes. This can't be undone.",
        okText: "Delete",
        okType: "danger",
        onOk: () => act(() => deleteInvoice(invoice.id), "Invoice deleted", "Couldn't delete the invoice"),
      });
    }
  };

  const columns = [
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
        <Space size={4}>
          <IconAction icon={Pencil} title="Open" onClick={() => navigate(editPathFromClient("invoice", invoice.id, clientId))} />
          {invoice.pdf_url && (
            <IconAction icon={FileText} title="PDF" onClick={() => window.open(invoice.pdf_url, "_blank", "noopener")} />
          )}
          {invoice.payment_url && (
            <IconAction
              icon={ExternalLink}
              title="Payment link"
              onClick={() => window.open(invoice.payment_url, "_blank", "noopener")}
            />
          )}
          <Dropdown
            trigger={["click"]}
            menu={{ items: menuFor(invoice), onClick: ({ key }) => onMenu(invoice, key) }}
            disabled={!menuFor(invoice).length}
          >
            <Button aria-label="More actions" icon={<Ellipsis size={16} />} className="icon-action" />
          </Dropdown>
        </Space>
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
