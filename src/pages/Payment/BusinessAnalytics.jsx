/** @format */

import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import { Select as AntSelect, message } from "antd";
import { RefreshCw } from "lucide-react";
import dayjs from "@/lib/dayjs";
import { GetInvoiceAnalytics } from "../../services/Api/Api";

/* ─── tiny helpers ─── */
const fmt = (n) =>
  Number(n || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const pct = (part, total) => {
  const p = Number(part || 0);
  const t = Number(total || 0);

  if (!t || isNaN(p) || isNaN(t)) {
    return 0;
  }

  return Math.round((p / t) * 100);
};

const STATUS_BADGE = {
  PAID: { label: "Paid", bg: "#E1F5EE", color: "#0F6E56" },
  CHECK_PAID: {
    label: "Check Paid",
    bg: "#EEF2FF",
    color: "#4338CA",
  },
  NOT_PAID: { label: "Not paid", bg: "#FAECE7", color: "#993C1D" },
};

/* ─── design tokens (kept local so the rest of the file's inline
      styles stay easy to scan/diff against the original) ─── */
const cardStyle = {
  background: "#fff",
  border: "1px solid #eef0f2",
  borderRadius: 12,
  padding: "18px 20px",
  marginBottom: 16,
  boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
};

const sectionTitleStyle = {
  fontSize: 14,
  fontWeight: 700,
  color: "#111827",
  margin: "0 0 14px",
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const thStyle = {
  textAlign: "left",
  padding: "8px 10px",
  fontWeight: 600,
  fontSize: 11.5,
  color: "#6b7280",
  letterSpacing: "0.02em",
  textTransform: "uppercase",
  borderBottom: "1px solid #eef0f2",
};

const tdStyle = {
  padding: "11px 10px",
  borderBottom: "1px solid #f5f5f5",
  fontSize: 13,
  color: "#374151",
};

/* ─── sub-components ─── */
const MetricCard = ({ label, value, sub, accent }) => {
  const accentColors = {
    green: "#0F6E56",
    red: "#A32D2D",
    amber: "#854F0B",
    default: "#111827",
  };
  return (
    <div
      style={{
        background: "#f9fafb",
        border: "1px solid #eef0f2",
        borderRadius: 10,
        padding: "16px 18px",
      }}
    >
      <p
        style={{
          fontSize: 11.5,
          fontWeight: 700,
          color: "#6b7280",
          letterSpacing: "0.03em",
          textTransform: "uppercase",
          margin: "0 0 8px",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: 23,
          fontWeight: 700,
          margin: 0,
          lineHeight: 1,
          color: accentColors[accent] || accentColors.default,
        }}
      >
        {value}
      </p>
      {sub && (
        <p style={{ fontSize: 11.5, color: "#9ca3af", margin: "6px 0 0" }}>
          {sub}
        </p>
      )}
    </div>
  );
};

const Badge = ({ status }) => {
  const cfg = STATUS_BADGE[status] || {
    label: status,
    bg: "#f0f0f0",
    color: "#555",
  };
  return (
    <span
      style={{
        background: cfg.bg,
        color: cfg.color,
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {cfg.label}
    </span>
  );
};

const MiniBar = ({ value, max, color = "#185FA5" }) => {
  const w = max ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div
        style={{
          flex: 1,
          height: 6,
          borderRadius: 3,
          background: "#e8e8e8",
        }}
      >
        <div
          style={{
            width: `${w}%`,
            height: 6,
            borderRadius: 3,
            background: color,
          }}
        />
      </div>
      <span style={{ fontSize: 11, color: "#9ca3af", minWidth: 28 }}>
        {w}%
      </span>
    </div>
  );
};

/* ─── page ─── */
const InvoiceAnalytics = () => {
  const [selectedMonth, setSelectedMonth] = useState(dayjs().month() + 1);
  const [selectedYear, setSelectedYear] = useState(dayjs().year());
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);

  const fetchData = async (month, year) => {
    try {
      setLoading(true);
      const formattedMonth = `${year}-${String(month).padStart(2, "0")}`;

      const res = await GetInvoiceAnalytics(formattedMonth);
      const d = res?.data?.data?.data;
      setAnalytics(d);
    } catch (e) {
      console.error(e);
      message.error("Failed to load analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(selectedMonth, selectedYear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear]);

  const ov = analytics?.overview || {};
  const payBreak = analytics?.payment_breakdown || {};
  const daily = analytics?.daily_breakdown || [];
  const employees = analytics?.employees || [];
  const topClients = analytics?.top_clients || [];
  const monthlyActivity = analytics?.monthly_activity || [];

  const totalPay =
    (payBreak.online || 0) + (payBreak.cash || 0) + (payBreak.check || 0);
  const maxClient = topClients.length ? topClients[0].total_spent : 1;
  const maxDaily = daily.length ? Math.max(...daily.map((d) => d.revenue)) : 1;

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: dayjs().month(i).format("MMMM"),
  }));
  const yearOptions = [2025, 2026, 2027, 2028];

  return (
    <Box>
      {/* HEADER */}
      <Paper
        variant="outlined"
        sx={{
          p: 2.5,
          mb: 2.5,
          borderRadius: "10px",
          borderColor: "#eef0f2",
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: { xs: "wrap", md: "nowrap" },
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography className="page-title" noWrap>
              INVOICE ANALYTICS
            </Typography>
            <Typography
              className="page-sub-title"
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              Business overview — invoices, quotes &amp; revenue
            </Typography>
          </Box>

          <Stack
            direction="row"
            spacing={1.5}
            sx={{ alignItems: "center", flexShrink: 0 }}
          >
            <AntSelect
              value={selectedMonth}
              onChange={(v) => setSelectedMonth(v)}
              style={{ width: 130, height: 44 }}
              options={monthOptions}
            />

            <AntSelect
              value={selectedYear}
              onChange={(v) => setSelectedYear(v)}
              style={{ width: 100, height: 44 }}
              options={yearOptions.map((y) => ({ value: y, label: y }))}
            />

            <Button
              variant="outlined"
              startIcon={<RefreshCw size={16} />}
              onClick={() => fetchData(selectedMonth, selectedYear)}
              disabled={loading}
              sx={{
                height: 44,
                px: 2.5,
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              {loading ? "Loading…" : "Refresh"}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* ── overview metrics ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <MetricCard
          label="Total Revenue"
          value={`$${fmt(ov.total_revenue)}`}
          sub={`${(ov.total_invoices || 0) + (ov.total_quotes || 0)} records`}
        />

        <MetricCard
          label="Invoice Revenue"
          value={`$${fmt(ov.invoice_revenue)}`}
          sub={`${ov.total_invoices || 0} invoices`}
        />

        <MetricCard
          label="Quote Revenue"
          value={`$${fmt(ov.quote_revenue)}`}
          sub={`${ov.total_quotes || 0} quotes`}
        />

        <MetricCard
          label="Paid Revenue"
          value={`$${fmt(ov.paid_revenue)}`}
          sub={`${ov.paid_count || 0} paid`}
          accent="green"
        />

        <MetricCard
          label="Not Paid Revenue"
          value={`$${fmt(ov.unpaid_revenue)}`}
          sub={`${ov.unpaid_count || 0} unpaid`}
          accent="red"
        />

        <MetricCard
          label="Collection Rate"
          value={`${pct(ov.paid_revenue, ov.total_revenue)}%`}
          sub="paid vs total"
          accent={
            pct(ov.paid_revenue, ov.total_revenue) >= 50 ? "green" : "amber"
          }
        />
      </div>

      {/* ── payment breakdown + status ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
          marginBottom: 16,
        }}
      >
        {/* payment breakdown */}
        <div style={cardStyle}>
          <p style={sectionTitleStyle}>💳 Payment breakdown</p>
          <div
            style={{
              display: "flex",
              borderRadius: 6,
              overflow: "hidden",
              height: 28,
              marginBottom: 10,
            }}
          >
            {totalPay > 0 ? (
              <>
                {payBreak.online > 0 && (
                  <div
                    style={{
                      width: `${pct(payBreak.online, totalPay)}%`,
                      background: "#185FA5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#fff",
                    }}
                  >
                    Online
                  </div>
                )}
                {payBreak.check > 0 && (
                  <div
                    style={{
                      width: `${pct(payBreak.check, totalPay)}%`,
                      background: "#0F6E56",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#fff",
                    }}
                  >
                    Check
                  </div>
                )}
              </>
            ) : (
              <div
                style={{
                  width: "100%",
                  background: "#f3f4f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  color: "#9ca3af",
                }}
              >
                No payments
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12.5,
                color: "#6b7280",
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: "#185FA5",
                  display: "inline-block",
                }}
              />
              Online — ${fmt(payBreak.online)}
            </span>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12.5,
                color: "#6b7280",
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: "#0F6E56",
                  display: "inline-block",
                }}
              />
              Check — ${fmt(payBreak.check)}
            </span>
          </div>
        </div>

        {/* invoice status counts */}
        <div style={cardStyle}>
          <p style={sectionTitleStyle}>📋 Payment status</p>
          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              padding: "4px 0 14px",
            }}
          >
            {[
              { label: "Paid", val: ov.paid_count, color: "#0F6E56" },
              { label: "Not Paid", val: ov.unpaid_count, color: "#A32D2D" },
              {
                label: "Invoice Records",
                val: ov.total_invoices,
                color: "#185FA5",
              },
              {
                label: "Quote Records",
                val: ov.total_quotes,
                color: "#7C3AED",
              },
            ].map((item) => (
              <div key={item.label} style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 700,
                    color: item.color,
                    lineHeight: 1,
                  }}
                >
                  {item.val || 0}
                </div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 6 }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
          {/* simple progress bars */}
          {[
            { label: "Paid", val: ov.paid_count, color: "#0F6E56" },
            { label: "Unpaid", val: ov.unpaid_count, color: "#A32D2D" },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 12, color: "#6b7280", minWidth: 50 }}>
                {item.label}
              </span>
              <div
                style={{
                  flex: 1,
                  height: 6,
                  borderRadius: 3,
                  background: "#e8e8e8",
                }}
              >
                <div
                  style={{
                    width: `${pct(
                      item.val,
                      (ov.total_invoices || 0) + (ov.total_quotes || 0)
                    )}%`,
                    height: 6,
                    borderRadius: 3,
                    background: item.color,
                  }}
                />
              </div>
              <span style={{ fontSize: 11, color: "#9ca3af", minWidth: 28 }}>
                {pct(
                  item.val,
                  (ov.total_invoices || 0) + (ov.total_quotes || 0)
                )}
                %
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── top clients + daily breakdown ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
          marginBottom: 16,
        }}
      >
        {/* top clients */}
        <div style={cardStyle}>
          <p style={sectionTitleStyle}>👥 Top clients</p>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>Client</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Spent</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Share</th>
              </tr>
            </thead>
            <tbody>
              {topClients.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    style={{
                      ...tdStyle,
                      textAlign: "center",
                      color: "#9ca3af",
                    }}
                  >
                    No data
                  </td>
                </tr>
              )}
              {topClients.map((c) => (
                <tr key={c.user_id}>
                  <td style={tdStyle}>{c.name}</td>
                  <td
                    style={{
                      ...tdStyle,
                      textAlign: "right",
                      fontWeight: 600,
                    }}
                  >
                    ${fmt(c.total_spent)}
                  </td>
                  <td style={{ ...tdStyle, textAlign: "right", minWidth: 90 }}>
                    <MiniBar value={c.total_spent} max={maxClient} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* daily breakdown */}
        <div style={cardStyle}>
          <p style={sectionTitleStyle}>📈 Daily activity</p>
          {/* header row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "4px 0 8px",
              borderBottom: "1px solid #eef0f2",
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: "#9ca3af",
                minWidth: 80,
                fontWeight: 600,
                textTransform: "uppercase",
              }}
            >
              Date
            </span>
            <div style={{ flex: 1 }} />
            <span
              style={{
                fontSize: 11,
                color: "#0F6E56",
                minWidth: 60,
                textAlign: "right",
                fontWeight: 600,
              }}
            >
              Paid
            </span>
            <span
              style={{
                fontSize: 11,
                color: "#A32D2D",
                minWidth: 60,
                textAlign: "right",
                fontWeight: 600,
              }}
            >
              Unpaid
            </span>
            <span
              style={{
                fontSize: 11,
                color: "#9ca3af",
                minWidth: 72,
                textAlign: "right",
                fontWeight: 600,
              }}
            >
              Total
            </span>
          </div>
          {daily.length === 0 && (
            <p
              style={{
                textAlign: "center",
                color: "#9ca3af",
                fontSize: 12,
                margin: "16px 0",
              }}
            >
              No daily data
            </p>
          )}
          {daily.map((d) => (
            <div
              key={d.date}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "9px 0",
                borderBottom: "1px solid #f5f5f5",
              }}
            >
              <span style={{ fontSize: 12, color: "#6b7280", minWidth: 80 }}>
                {dayjs(d.date).format("MMM D")}
              </span>
              <div
                style={{
                  flex: 1,
                  height: 6,
                  borderRadius: 3,
                  background: "#e8e8e8",
                }}
              >
                <div
                  style={{
                    width: `${pct(d.revenue, maxDaily)}%`,
                    height: 6,
                    borderRadius: 3,
                    background: d.paid > 0 ? "#1D9E75" : "#378ADD",
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 11,
                  color: "#0F6E56",
                  minWidth: 60,
                  textAlign: "right",
                  fontWeight: d.paid > 0 ? 600 : 400,
                }}
              >
                ${fmt(d.paid)}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: "#A32D2D",
                  minWidth: 60,
                  textAlign: "right",
                }}
              >
                ${fmt(d.unpaid)}
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  minWidth: 72,
                  textAlign: "right",
                  color: "#111827",
                }}
              >
                ${fmt(d.revenue)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── employees ── */}
      {employees.length > 0 && (
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <p style={sectionTitleStyle}>🧑‍💼 Employee performance</p>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>Employee</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Records</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Total</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Paid</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Unpaid</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Rate</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.user_id}>
                  <td style={tdStyle}>{e.name}</td>
                  <td
                    style={{
                      ...tdStyle,
                      textAlign: "center",
                      color: "#6b7280",
                    }}
                  >
                    {e.record_count || e.invoice_count}
                  </td>
                  <td
                    style={{
                      ...tdStyle,
                      textAlign: "right",
                      fontWeight: 600,
                    }}
                  >
                    ${fmt(e.total_amount)}
                  </td>
                  <td
                    style={{
                      ...tdStyle,
                      textAlign: "right",
                      color: "#0F6E56",
                    }}
                  >
                    ${fmt(e.paid_amount)}
                  </td>
                  <td
                    style={{
                      ...tdStyle,
                      textAlign: "right",
                      color: "#A32D2D",
                    }}
                  >
                    ${fmt(e.unpaid_amount)}
                  </td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color:
                          pct(e.paid_amount, e.total_amount) >= 50
                            ? "#0F6E56"
                            : "#A32D2D",
                      }}
                    >
                      {pct(e.paid_amount, e.total_amount)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── recent invoices ── */}
      <div style={cardStyle}>
        <p style={sectionTitleStyle}>🧾 Monthly Activity</p>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: 900,
            }}
          >
            <thead>
              <tr>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Ref</th>
                <th style={thStyle}>Client</th>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Due date</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Amount</th>
                <th style={thStyle}>Status</th>
              </tr>
            </thead>

            <tbody>
              {monthlyActivity.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      ...tdStyle,
                      textAlign: "center",
                      color: "#9ca3af",
                    }}
                  >
                    No activity
                  </td>
                </tr>
              )}

              {monthlyActivity.map((item) => (
                <tr key={`${item.type}-${item.id}`}>
                  <td style={tdStyle}>
                    <span
                      style={{
                        background:
                          item.type === "INVOICE" ? "#EEF4FF" : "#F5F3FF",
                        color: item.type === "INVOICE" ? "#1D4ED8" : "#7C3AED",
                        padding: "3px 10px",
                        borderRadius: 20,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {item.type}
                    </span>
                  </td>

                  <td
                    style={{
                      ...tdStyle,
                      fontFamily: "monospace",
                      fontSize: 12,
                      color: "#9ca3af",
                    }}
                  >
                    {item.ref_no}
                  </td>

                  <td style={tdStyle}>{item.client_name}</td>

                  <td
                    style={{
                      ...tdStyle,
                      fontSize: 12,
                      color: "#9ca3af",
                    }}
                  >
                    {dayjs(item.billing_date).format("MMM D, YYYY")}
                  </td>

                  <td
                    style={{
                      ...tdStyle,
                      fontSize: 12,
                      color: "#9ca3af",
                    }}
                  >
                    {item.due_date
                      ? dayjs(item.due_date).format("MMM D, YYYY")
                      : "—"}
                  </td>

                  <td
                    style={{
                      ...tdStyle,
                      textAlign: "right",
                      fontWeight: 600,
                    }}
                  >
                    ${fmt(item.amount)}
                  </td>

                  <td style={tdStyle}>
                    <Badge status={item.payment_status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Box>
  );
};

export default InvoiceAnalytics;