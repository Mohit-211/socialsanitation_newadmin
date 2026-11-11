import type { ReactNode } from "react";
import { useNavigate } from "react-router";
import { Modal, Tag, Divider, Button } from "antd";
import { formatDate } from "@/utils/datetime";
import type { Quote } from "@/types";
import "./InvoiceViewModal.scss";

// Status colors are antd Tag presets, themed by the app's antd theme.
type StatusLook = { label: string; color: string };

const jobStatusConfig: Record<string, StatusLook> = {
  NOT_BOOKED: { label: "NOT BOOKED", color: "warning" },
  BOOKED: { label: "BOOKED", color: "processing" },
  EXPIRED: { label: "EXPIRED", color: "error" },
};

const paymentStatusConfig: Record<string, StatusLook> = {
  NOT_PAID: { label: "NOT PAID", color: "warning" },
  PAID: { label: "PAID", color: "success" },
  CASH_PAID: { label: "PAID (CASH)", color: "success" },
  CHECK_PAID: { label: "PAID (CHECK)", color: "success" },
  ACH_PAID: { label: "PAID (ACH)", color: "success" },
};

interface InvoiceViewModalProps {
  invoice: Quote;
  onClose: () => void;
}

// A quote at a glance. Quotes have no payment link of their own: the client
// pays through the invoice made from the quote.
const InvoiceViewModal = ({ invoice, onClose }: InvoiceViewModalProps) => {
  const navigate = useNavigate();
  const jobStatus = jobStatusConfig[invoice.job_status ?? ""];
  const paymentStatus = paymentStatusConfig[invoice.payment_status ?? ""];
  return (
    <Modal
      open
      width={720}
      footer={null}
      onCancel={onClose}
      title={null}
    >
      {/* Header */}
      <div className="invoice-view__hero">
        <div className="invoice-view__hero-top">
          <div className="invoice-view__tags">
            <Tag color={jobStatus?.color}>{jobStatus?.label}</Tag>
            <Tag color={paymentStatus?.color}>{paymentStatus?.label}</Tag>
          </div>

          <Tag className="invoice-view__amount">
            ${Number(invoice.total_due).toFixed(2)}
          </Tag>
        </div>

        <div className="invoice-view__ref-label">QUOTE REFERENCE</div>
        <div className="invoice-view__ref">{invoice.ref_no}</div>
      </div>

      {/* Client Info */}
      <div className="invoice-view__client">
        <div className="invoice-view__client-name">
          {invoice.client?.name || invoice.to_company_name}
        </div>
        <div className="invoice-view__client-email">
          {invoice.client?.email}
        </div>
      </div>

      {/* Dates & Address */}
      <div className="invoice-view__info">
        <InfoRow label="Service Date">
          {formatDate(invoice.service_dates, "N/A")}
        </InfoRow>

        <InfoRow label="Due Date">
          {formatDate(invoice.due_date, "N/A")}
        </InfoRow>

        <InfoRow label="Expiry Date">
          {formatDate(invoice.expires_at, "N/A")}
        </InfoRow>

        <InfoRow label="Address">
          {invoice.address_1} {invoice.address_2}
        </InfoRow>
      </div>

      <Divider />

      {/* Items */}
      <h4 className="invoice-view__items-title">ITEMS</h4>

      <div className="invoice-view__items">
        {invoice.items?.map((item) => (
          <div key={item.id} className="invoice-view__item">
            <div className="invoice-view__item-name">{item.description}</div>
            <div className="invoice-view__item-meta">
              <span>{item.frequency || "N/A"}</span>
              <span className="invoice-view__item-amount">
                ${Number(item.amount).toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Payment Link */}
      <div className="invoice-view__payment">
        {["PAID", "CASH_PAID", "CHECK_PAID", "ACH_PAID"].includes(invoice.payment_status ?? "") ? (
          <div className="invoice-view__notice invoice-view__notice--success">
            ✅ Payment Completed
          </div>
        ) : invoice.payment_status === "EXPIRED" ? (
          <div className="invoice-view__notice invoice-view__notice--error">
            ⏰ Invoice Expired
          </div>
        ) : invoice.invoice_id ? (
          <Button type="primary" block size="large" onClick={() => navigate(`/edit-invoice/${invoice.invoice_id}`)}>
            Open Its Invoice
          </Button>
        ) : (
          <div className="invoice-view__notice invoice-view__notice--warning">
            No invoice yet: the client pays through the invoice made from this quote.
          </div>
        )}
      </div>
    </Modal>
  );
};

const InfoRow = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="invoice-view__info-row">
    <div className="invoice-view__info-label">{label}:</div>
    <div className="invoice-view__info-value">{children}</div>
  </div>
);

export default InvoiceViewModal;
