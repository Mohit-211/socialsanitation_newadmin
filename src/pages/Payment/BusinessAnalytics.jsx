/** @format */

import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import { message } from "antd";
import axios from "axios";
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

/* ─── sub-components ─── */
const MetricCard = ({ label, value, sub, accent }) => {
  const accentColors = {
    green: "#0F6E56",
    red: "#A32D2D",
    amber: "#854F0B",
    default: "var(--color-text-primary, #111)",
  };
  return (
    <div
      style={{
        background: "var(--color-background-secondary, #f4f4f4)",
        borderRadius: 8,
        padding: "14px 16px",
      }}
    >
      <p style={{ fontSize: 12, color: "#888", margin: "0 0 6px" }}>{label}</p>
      <p
        style={{
          fontSize: 22,
          fontWeight: 500,
          margin: 0,
          lineHeight: 1,
          color: accentColors[accent] || accentColors.default,
        }}
      >
        {value}
      </p>
      {sub && (
        <p style={{ fontSize: 11, color: "#888", margin: "4px 0 0" }}>{sub}</p>
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
        fontWeight: 500,
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
      <span style={{ fontSize: 11, color: "#888", minWidth: 28 }}>{w}%</span>
    </div>
  );
};

/* ─── generate month/year options ─── */
const buildMonthOptions = () => {
  const opts = [];
  for (let y = 2025; y <= 2027; y++) {
    for (let m = 1; m <= 12; m++) {
      const val = `${y}-${String(m).padStart(2, "0")}`;
      const label = dayjs(val, "YYYY-MM").format("MMM YYYY");
      opts.push({ value: val, label });
    }
  }
  return opts;
};

const MONTH_OPTIONS = buildMonthOptions();

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

  const card = {
    background: "#fff",
    border: "0.5px solid rgba(0,0,0,0.1)",
    borderRadius: 12,
    padding: "16px 20px",
    marginBottom: 16,
  };

  const sectionTitle = {
    fontSize: 14,
    fontWeight: 500,
    margin: "0 0 14px",
    display: "flex",
    alignItems: "center",
    gap: 6,
  };

  const thStyle = {
    textAlign: "left",
    padding: "8px 10px",
    fontWeight: 500,
    fontSize: 12,
    color: "#888",
    borderBottom: "0.5px solid rgba(0,0,0,0.08)",
  };

  const tdStyle = {
    padding: "10px 10px",
    borderBottom: "0.5px solid rgba(0,0,0,0.06)",
    fontSize: 13,
  };

  return (
    <Box style={{ fontFamily: "sans-serif" }}>
      {/* ── header ── */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="flex-start"
        style={{ marginBottom: 24, flexWrap: "wrap", gap: 12 }}
      >
        <div>
          <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 500 }}>
            INVOICE ANALYTICS
          </h3>
          <p style={{ margin: 0, fontSize: 13, color: "#888" }}>
            Business overview — invoices, quotes &amp; revenue
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* MONTH */}

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            style={{
              height: 36,
              padding: "0 12px",
              border: "0.5px solid rgba(0,0,0,0.2)",
              borderRadius: 8,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            {Array.from({ length: 12 }, (_, i) =>
              dayjs().month(i).format("MMMM")
            ).map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>

          {/* YEAR */}

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            style={{
              height: 36,
              padding: "0 12px",
              border: "0.5px solid rgba(0,0,0,0.2)",
              borderRadius: 8,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            {[2025, 2026, 2027, 2028].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <button
            onClick={() => fetchData(selectedMonth, selectedYear)}
            disabled={loading}
            style={{
              height: 36,
              padding: "0 16px",
              border: "0.5px solid rgba(0,0,0,0.2)",
              borderRadius: 8,
              background: "#fff",
              fontSize: 13,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Loading…" : "↻ Refresh"}
          </button>
        </div>
      </Box>

      {/* ── overview metrics ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 10,
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
        <div style={card}>
          <p style={sectionTitle}>💳 Payment breakdown</p>
          <div
            style={{
              display: "flex",
              borderRadius: 6,
              overflow: "hidden",
              height: 28,
              marginBottom: 8,
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
                      fontWeight: 500,
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
                      fontWeight: 500,
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
                  background: "#e8e8e8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  color: "#888",
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
                gap: 5,
                fontSize: 12,
                color: "#888",
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
                gap: 5,
                fontSize: 12,
                color: "#888",
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
        <div style={card}>
          <p style={sectionTitle}>📋 Payment status</p>
          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              padding: "4px 0 12px",
            }}
          >
            {[
              {
                label: "Paid",
                val: ov.paid_count,
                color: "#0F6E56",
              },

              {
                label: "Not Paid",
                val: ov.unpaid_count,
                color: "#A32D2D",
              },

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
                    fontSize: 28,
                    fontWeight: 500,
                    color: item.color,
                    lineHeight: 1,
                  }}
                >
                  {item.val || 0}
                </div>
                <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
          {/* simple progress bars */}
          {[
            {
              label: "Paid",
              val: ov.paid_count,
              color: "#0F6E56",
            },
            {
              label: "Unpaid",
              val: ov.unpaid_count,
              color: "#A32D2D",
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 6,
              }}
            >
              <span style={{ fontSize: 12, color: "#888", minWidth: 50 }}>
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
              <span style={{ fontSize: 11, color: "#888", minWidth: 28 }}>
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
        <div style={card}>
          <p style={sectionTitle}>👥 Top clients</p>
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
                      color: "#aaa",
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
                      fontWeight: 500,
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
        <div style={card}>
          <p style={sectionTitle}>📈 Daily activity</p>
          {/* header row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "4px 0 8px",
              borderBottom: "0.5px solid rgba(0,0,0,0.08)",
            }}
          >
            <span style={{ fontSize: 11, color: "#888", minWidth: 80 }}>
              Date
            </span>
            <div style={{ flex: 1 }} />
            <span
              style={{
                fontSize: 11,
                color: "#0F6E56",
                minWidth: 60,
                textAlign: "right",
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
              }}
            >
              Unpaid
            </span>
            <span
              style={{
                fontSize: 11,
                color: "#888",
                minWidth: 72,
                textAlign: "right",
              }}
            >
              Total
            </span>
          </div>
          {daily.length === 0 && (
            <p
              style={{
                textAlign: "center",
                color: "#aaa",
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
                borderBottom: "0.5px solid rgba(0,0,0,0.05)",
              }}
            >
              <span style={{ fontSize: 12, color: "#888", minWidth: 80 }}>
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
                  fontWeight: d.paid > 0 ? 500 : 400,
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
                  fontWeight: 500,
                  minWidth: 72,
                  textAlign: "right",
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
        <div style={{ ...card, marginBottom: 16 }}>
          <p style={sectionTitle}>🧑‍💼 Employee performance</p>
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
                      color: "#888",
                    }}
                  >
                    {e.record_count || e.invoice_count}
                  </td>
                  <td
                    style={{
                      ...tdStyle,
                      textAlign: "right",
                      fontWeight: 500,
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
                        fontWeight: 500,
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
      <div style={card}>
        <p style={sectionTitle}>🧾 Monthly Activity</p>

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
                <th
                  style={{
                    ...thStyle,
                    textAlign: "right",
                  }}
                >
                  Amount
                </th>
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
                      color: "#aaa",
                    }}
                  >
                    No activity
                  </td>
                </tr>
              )}

              {monthlyActivity.map((item) => (
                <tr key={`${item.type}-${item.id}`}>
                  {/* TYPE */}

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

                  {/* REF */}

                  <td
                    style={{
                      ...tdStyle,
                      fontFamily: "monospace",
                      fontSize: 12,
                      color: "#888",
                    }}
                  >
                    {item.ref_no}
                  </td>

                  {/* CLIENT */}

                  <td style={tdStyle}>{item.client_name}</td>

                  {/* DATE */}

                  <td
                    style={{
                      ...tdStyle,
                      fontSize: 12,
                      color: "#888",
                    }}
                  >
                    {dayjs(item.billing_date).format("MMM D, YYYY")}
                  </td>

                  {/* DUE DATE */}

                  <td
                    style={{
                      ...tdStyle,
                      fontSize: 12,
                      color: "#888",
                    }}
                  >
                    {item.due_date
                      ? dayjs(item.due_date).format("MMM D, YYYY")
                      : "—"}
                  </td>

                  {/* AMOUNT */}

                  <td
                    style={{
                      ...tdStyle,
                      textAlign: "right",
                      fontWeight: 500,
                    }}
                  >
                    ${fmt(item.amount)}
                  </td>

                  {/* STATUS */}

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
