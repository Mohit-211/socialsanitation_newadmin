import React from "react";
import { Modal, Tag, Divider, Button } from "antd";
import dayjs from "@/lib/dayjs";

const jobStatusConfig = {
  NOT_BOOKED: { label: "NOT BOOKED", color: "gold" },
  BOOKED: { label: "BOOKED", color: "blue" },
  EXPIRED: { label: "EXPIRED", color: "red" },
};

const paymentStatusConfig = {
  NOT_PAID: { label: "NOT PAID", color: "orange" },
  PAID: { label: "PAID", color: "green" },
  CASH_PAID: { label: "PAID (CASH)", color: "green" },
};

const InvoiceViewModal = ({ invoice, onClose }) => {
  return (
    <Modal
      open
      width={720}
      footer={null}
      onCancel={onClose}
      title={null}
    >
      {/* ===== Header ===== */}
      <div
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          padding: 20,
          borderRadius: 12,
          color: "#fff",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            <Tag color={jobStatusConfig[invoice.job_status]?.color}>
              {jobStatusConfig[invoice.job_status]?.label}
            </Tag>
            <Tag color={paymentStatusConfig[invoice.payment_status]?.color}>
              {paymentStatusConfig[invoice.payment_status]?.label}
            </Tag>
          </div>

          <Tag
            style={{
              background: "rgba(255,255,255,0.25)",
              border: "1px solid rgba(255,255,255,0.4)",
              color: "#fff",
              fontWeight: 600,
              fontSize: 16,
            }}
          >
            ${Number(invoice.total_due).toFixed(2)}
          </Tag>
        </div>

        <div style={{ fontSize: 13, opacity: 0.9 }}>QUOTE REFERENCE</div>
        <div style={{ fontSize: 22, fontWeight: 700 }}>
          {invoice.ref_no}
        </div>
      </div>

      {/* ===== Client Info ===== */}
      <div
        style={{
          background: "#f8f9fa",
          padding: 14,
          borderRadius: 8,
          marginBottom: 16,
        }}
      >
        <div style={{ fontWeight: 600 }}>
          {invoice.payment_user?.user_profile?.name}
        </div>
        <div style={{ fontSize: 13, color: "#6c757d" }}>
          {invoice.payment_user?.email}
        </div>
      </div>

      {/* ===== Dates & Address ===== */}
      <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
        <InfoRow label="Service Date">
          {dayjs(invoice.service_dates).format("MM/DD/YYYY") || "N/A"}
        </InfoRow>

        <InfoRow label="Due Date">
         {dayjs(invoice.due_date).format("MM/DD/YYYY") || "N/A"  }
        </InfoRow>

        <InfoRow label="Expiry Date">
          {dayjs(invoice.expires_at).format("MM/DD/YYYY")}
        </InfoRow>

        <InfoRow label="Address">
          {invoice.address_1} {invoice.address_2}
        </InfoRow>
      </div>

      <Divider />

      {/* ===== Items ===== */}
      <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
        ITEMS
      </h4>

      <div style={{ display: "grid", gap: 8 }}>
        {invoice.service_quote_item?.map((item) => (
          <div
            key={item.id}
            style={{
              background: "#f8f9fa",
              padding: "10px 12px",
              borderRadius: 6,
              borderLeft: "3px solid #667eea",
            }}
          >
            <div style={{ fontWeight: 500 }}>
              {item.description}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                color: "#6c757d",
              }}
            >
              <span>{item.frequency || "N/A"}</span>
              <span style={{ fontWeight: 600, color: "#667eea" }}>
                ${Number(item.amount).toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ===== Payment Link ===== */}
      <div style={{ marginTop: 20 }}>
        {invoice.payment_status === "PAID" ||
        invoice.payment_status === "CASH_PAID" ? (
          <div
            style={{
              background: "#d4edda",
              color: "#155724",
              padding: 12,
              borderRadius: 8,
              textAlign: "center",
              fontWeight: 600,
            }}
          >
            ✅ Payment Completed
          </div>
        ) : invoice.payment_status === "EXPIRED" ? (
          <div
            style={{
              background: "#f8d7da",
              color: "#721c24",
              padding: 12,
              borderRadius: 8,
              textAlign: "center",
              fontWeight: 600,
            }}
          >
            ⏰ Invoice Expired
          </div>
        ) : invoice.square_payment_url ? (
          <Button
            type="primary"
            block
            size="large"
            onClick={() => window.open(invoice.square_payment_url, "_blank")}
          >
            💳 View Payment Link
          </Button>
        ) : (
          <div
            style={{
              background: "#fff3cd",
              color: "#856404",
              padding: 12,
              borderRadius: 8,
              textAlign: "center",
            }}
          >
            ⚠️ Payment Link Not Available
          </div>
        )}
      </div>
    </Modal>
  );
};

const InfoRow = ({ label, children }) => (
  <div style={{ display: "flex" }}>
    <div
      style={{
        minWidth: 120,
        fontSize: 13,
        color: "#6c757d",
        fontWeight: 500,
      }}
    >
      {label}:
    </div>
    <div style={{ fontSize: 14, fontWeight: 500 }}>{children}</div>
  </div>
);

export default InvoiceViewModal;
