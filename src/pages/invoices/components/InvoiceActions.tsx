import { useRef } from "react";
import { useNavigate } from "react-router";
import { Button, Dropdown, Modal, Space, message, type MenuProps, type ModalFuncProps } from "antd";
import { BellRing, Ellipsis, ExternalLink, FileText, FileUp, Pencil, Send } from "lucide-react";
import IconAction from "@/components/IconAction";
import {
  deleteInvoice,
  markInvoicePaid,
  remindInvoice,
  sendInvoice,
  sendInvoiceBalance,
  uploadInvoicePdf,
} from "@/services/api/invoiceApi";
import { errorMessage } from "@/services/apiResult";
import { PERMISSION, useCan } from "@/lib/session";
import type { InvoiceSummary } from "@/types";

type MenuItem = NonNullable<MenuProps["items"]>[number];

// States in which the client has the invoice and something is due.
const OPEN_STATES = new Set(["sent", "deposit_paid", "overdue"]);

/** Opens a link in a new tab; an empty one does nothing. */
const openTab = (url: string | null | undefined) => {
  if (url) window.open(url, "_blank", "noopener");
};

export interface InvoiceActionsProps {
  invoice: InvoiceSummary;
  /** Where Open goes; no Open without it. */
  openPath?: string;
  onChanged?: () => void;
}

/**
 * What the office does with one invoice, on the invoice list and the client
 * page: open it, its PDF and payment link; and from the menu, send it now,
 * remind the client, send the balance of a deposit invoice, record a check or
 * ACH payment, add the PDF of an imported one, or delete it.
 */
const InvoiceActions = ({ invoice, openPath, onChanged }: InvoiceActionsProps) => {
  const navigate = useNavigate();
  const canDelete = useCan(PERMISSION.DELETE_RECORDS);
  const fileInput = useRef<HTMLInputElement>(null);
  const closed = invoice.state === "paid" || invoice.state === "cancelled";
  const imported = Boolean(invoice.is_historical);
  const ref = invoice.custom_ref_no || invoice.ref_no || "this invoice";

  const act = async (action: () => Promise<unknown>, success: string, failure: string) => {
    try {
      await action();
      message.success(success);
      onChanged?.();
    } catch (error) {
      message.error(errorMessage(error, failure));
    }
  };

  const confirmThen = (
    title: string,
    content: string,
    okText: string,
    run: () => Promise<void>,
    okType?: ModalFuncProps["okType"],
  ) =>
    Modal.confirm({ title, content, okText, okType, onOk: run });

  const items: MenuItem[] = [];
  if (!imported && (invoice.state === "draft" || invoice.state === "scheduled")) {
    items.push({ key: "send", icon: <Send size={14} />, label: "Send now" });
  }
  if (!imported && OPEN_STATES.has(invoice.state)) {
    items.push({ key: "remind", icon: <BellRing size={14} />, label: "Send a reminder" });
  }
  if (invoice.payment_stage === "DEPOSIT_PAID") {
    items.push({ key: "balance", icon: <Send size={14} />, label: "Send the balance now" });
  }
  if (!closed) {
    items.push({ key: "paid-check", label: "Mark paid by check" }, { key: "paid-ach", label: "Mark paid by ACH" });
  }
  if (imported) {
    items.push({ key: "pdf", icon: <FileUp size={14} />, label: invoice.pdf_url ? "Replace the PDF" : "Upload the PDF" });
  }
  if (canDelete) {
    if (items.length) items.push({ type: "divider" });
    items.push({ key: "delete", danger: true, label: "Delete" });
  }

  const onMenu: MenuProps["onClick"] = ({ key }) => {
    if (key === "send") {
      confirmThen(`Send ${ref} now?`, "The client gets it by email at once, whatever its billing date.", "Send Now", () =>
        act(() => sendInvoice(invoice.id), "Invoice sent", "Couldn't send the invoice"),
      );
    }
    if (key === "remind") {
      confirmThen(`Remind the client about ${ref}?`, "They get an email with the payment link and a note in the app.", "Send Reminder", () =>
        act(() => remindInvoice(invoice.id), "Reminder sent", "Couldn't send the reminder"),
      );
    }
    if (key === "balance") {
      confirmThen(
        `Send the balance of ${ref} now?`,
        "The client gets the remaining balance today, not on its balance date.",
        "Send Balance",
        () => act(() => sendInvoiceBalance(invoice.id), "Balance sent", "Couldn't send the balance"),
      );
    }
    if (key === "paid-check" || key === "paid-ach") {
      const method = key === "paid-check" ? "CHECK" : "ACH";
      confirmThen(
        `Mark ${ref} paid by ${method === "CHECK" ? "check" : "ACH"}?`,
        "Its online payment link closes.",
        "Mark Paid",
        () => act(() => markInvoicePaid(invoice.id, method), "Invoice marked paid", "Couldn't mark it paid"),
      );
    }
    if (key === "pdf") fileInput.current?.click();
    if (key === "delete") {
      confirmThen(
        `Delete ${ref}?`,
        "Any waiting payment link closes. This can't be undone.",
        "Delete",
        () => act(() => deleteInvoice(invoice.id), "Invoice deleted", "Couldn't delete the invoice"),
        "danger",
      );
    }
  };

  const uploadPdf = (file: File) => {
    if (file.type !== "application/pdf") {
      message.error("Please pick a PDF file");
      return;
    }
    act(() => uploadInvoicePdf(invoice.id, file), "PDF saved to the invoice", "Couldn't upload the PDF");
  };

  return (
    <Space size={4}>
      {!imported && openPath && <IconAction icon={Pencil} title="Open" onClick={() => navigate(openPath)} />}
      {invoice.pdf_url && <IconAction icon={FileText} title="PDF" onClick={() => openTab(invoice.pdf_url)} />}
      {invoice.payment_url && !closed && (
        <IconAction icon={ExternalLink} title="Payment link" onClick={() => openTab(invoice.payment_url)} />
      )}
      <Dropdown trigger={["click"]} menu={{ items, onClick: onMenu }} disabled={!items.length}>
        <Button aria-label="More actions" icon={<Ellipsis size={16} />} className="icon-action" />
      </Dropdown>
      {imported && (
        <input
          ref={fileInput}
          type="file"
          accept="application/pdf"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) uploadPdf(file);
          }}
        />
      )}
    </Space>
  );
};

export default InvoiceActions;
