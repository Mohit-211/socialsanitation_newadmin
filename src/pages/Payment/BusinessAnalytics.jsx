import { useEffect, useState } from "react";
import { Button, Select, message } from "antd";
import { RefreshCw } from "lucide-react";
import dayjs from "@/lib/dayjs";
import { GetInvoiceAnalytics } from "../../services/Api/Api";
import PageHeader from "../../components/PageHeader";
import "./BusinessAnalytics.scss";

/* tiny helpers */
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

// Payment status pill: label + color tone (see .invoice-analytics__badge--*)
const STATUS_BADGE = {
  PAID: { label: "Paid", tone: "success" },
  CHECK_PAID: { label: "Check Paid", tone: "info" },
  NOT_PAID: { label: "Not paid", tone: "warning" },
};

// Text color of a metric value
const ACCENT_COLORS = {
  success: "var(--color-success-strong)",
  error: "var(--color-error-strong)",
  warning: "var(--color-warning-strong)",
  default: "var(--color-text)",
};

/* sub-components */
const MetricCard = ({ label, value, sub, accent }) => (
  <div className="invoice-analytics__metric">
    <p className="invoice-analytics__metric-label">{label}</p>
    <p
      className="invoice-analytics__metric-value"
      style={{ color: ACCENT_COLORS[accent] || ACCENT_COLORS.default }}
    >
      {value}
    </p>
    {sub && <p className="invoice-analytics__metric-sub">{sub}</p>}
  </div>
);

const Badge = ({ status }) => {
  const cfg = STATUS_BADGE[status] || { label: status, tone: "neutral" };
  return (
    <span
      className={`invoice-analytics__badge invoice-analytics__badge--${cfg.tone}`}
    >
      {cfg.label}
    </span>
  );
};

const MiniBar = ({ value, max, color = "var(--color-primary-border)" }) => {
  const w = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className="invoice-analytics__bar-row">
      <div className="invoice-analytics__track">
        <div
          className="invoice-analytics__fill"
          style={{ width: `${w}%`, background: color }}
        />
      </div>
      <span className="invoice-analytics__bar-pct">{w}%</span>
    </div>
  );
};

/* page */
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

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: dayjs().month(i).format("MMMM"),
  }));
  const yearOptions = [2025, 2026, 2027, 2028];

  return (
    <div className="invoice-analytics">
      {/* HEADER */}
      <PageHeader
        title="INVOICE ANALYTICS"
        subtitle="Business overview — invoices, quotes & revenue"
        actions={
          <>
            <Select
              size="large"
              className="invoice-analytics__month"
              value={selectedMonth}
              onChange={(v) => setSelectedMonth(v)}
              options={monthOptions}
            />

            <Select
              size="large"
              className="invoice-analytics__year"
              value={selectedYear}
              onChange={(v) => setSelectedYear(v)}
              options={yearOptions.map((y) => ({ value: y, label: y }))}
            />

            <Button
              size="large"
              icon={<RefreshCw size={16} />}
              onClick={() => fetchData(selectedMonth, selectedYear)}
              disabled={loading}
            >
              {loading ? "Loading…" : "Refresh"}
            </Button>
          </>
        }
      />

      {/* ── overview metrics ── */}
      <div className="invoice-analytics__metrics">
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
          accent="success"
        />

        <MetricCard
          label="Not Paid Revenue"
          value={`$${fmt(ov.unpaid_revenue)}`}
          sub={`${ov.unpaid_count || 0} unpaid`}
          accent="error"
        />

        <MetricCard
          label="Collection Rate"
          value={`${pct(ov.paid_revenue, ov.total_revenue)}%`}
          sub="paid vs total"
          accent={
            pct(ov.paid_revenue, ov.total_revenue) >= 50 ? "success" : "warning"
          }
        />
      </div>

      {/* ── payment breakdown + status ── */}
      <div className="invoice-analytics__grid">
        {/* payment breakdown */}
        <div className="surface invoice-analytics__card">
          <h2 className="section-title invoice-analytics__section-title">
            💳 Payment breakdown
          </h2>
          <div className="invoice-analytics__pay-bar">
            {totalPay > 0 ? (
              <>
                {payBreak.online > 0 && (
                  <div
                    className="invoice-analytics__pay-segment invoice-analytics__pay-segment--online"
                    style={{ width: `${pct(payBreak.online, totalPay)}%` }}
                  >
                    Online
                  </div>
                )}
                {payBreak.check > 0 && (
                  <div
                    className="invoice-analytics__pay-segment invoice-analytics__pay-segment--check"
                    style={{ width: `${pct(payBreak.check, totalPay)}%` }}
                  >
                    Check
                  </div>
                )}
              </>
            ) : (
              <div className="invoice-analytics__pay-segment invoice-analytics__pay-segment--empty">
                No payments
              </div>
            )}
          </div>
          <div className="invoice-analytics__legend">
            <span className="invoice-analytics__legend-item">
              <span className="invoice-analytics__legend-dot invoice-analytics__legend-dot--online" />
              Online — ${fmt(payBreak.online)}
            </span>
            <span className="invoice-analytics__legend-item">
              <span className="invoice-analytics__legend-dot invoice-analytics__legend-dot--check" />
              Check — ${fmt(payBreak.check)}
            </span>
          </div>
        </div>

        {/* invoice status counts */}
        <div className="surface invoice-analytics__card">
          <h2 className="section-title invoice-analytics__section-title">
            📋 Payment status
          </h2>
          <div className="invoice-analytics__counts">
            {[
              {
                label: "Paid",
                val: ov.paid_count,
                color: "var(--color-success-strong)",
              },
              {
                label: "Not Paid",
                val: ov.unpaid_count,
                color: "var(--color-error)",
              },
              {
                label: "Invoice Records",
                val: ov.total_invoices,
                color: "var(--color-primary-strong)",
              },
              {
                label: "Quote Records",
                val: ov.total_quotes,
                color: "var(--color-primary-strong)",
              },
            ].map((item) => (
              <div key={item.label} className="invoice-analytics__count">
                <div
                  className="invoice-analytics__count-value"
                  style={{ color: item.color }}
                >
                  {item.val || 0}
                </div>
                <div className="invoice-analytics__count-label">
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
              color: "var(--color-success-strong)",
            },
            { label: "Unpaid", val: ov.unpaid_count, color: "var(--color-error)" },
          ].map((item) => (
            <div key={item.label} className="invoice-analytics__progress">
              <span className="invoice-analytics__progress-label">
                {item.label}
              </span>
              <div className="invoice-analytics__track">
                <div
                  className="invoice-analytics__fill"
                  style={{
                    width: `${pct(
                      item.val,
                      (ov.total_invoices || 0) + (ov.total_quotes || 0),
                    )}%`,
                    background: item.color,
                  }}
                />
              </div>
              <span className="invoice-analytics__bar-pct">
                {pct(
                  item.val,
                  (ov.total_invoices || 0) + (ov.total_quotes || 0),
                )}
                %
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── top clients + daily breakdown ── */}
      <div className="invoice-analytics__grid">
        {/* top clients */}
        <div className="surface invoice-analytics__card">
          <h2 className="section-title invoice-analytics__section-title">
            👥 Top clients
          </h2>
          <table className="invoice-analytics__table">
            <thead>
              <tr>
                <th>Client</th>
                <th className="is-right">Spent</th>
                <th className="is-right">Share</th>
              </tr>
            </thead>
            <tbody>
              {topClients.length === 0 && (
                <tr>
                  <td colSpan={3} className="is-center is-subtle">
                    No data
                  </td>
                </tr>
              )}
              {topClients.map((c) => (
                <tr key={c.user_id}>
                  <td>{c.name}</td>
                  <td className="is-right is-strong">${fmt(c.total_spent)}</td>
                  <td className="is-right invoice-analytics__share">
                    <MiniBar value={c.total_spent} max={maxClient} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* daily breakdown */}
        <div className="surface invoice-analytics__card invoice-analytics__card--scroll">
          <h2 className="section-title invoice-analytics__section-title">
            📈 Daily activity
          </h2>
          {/* header row */}
          <div className="invoice-analytics__daily-head">
            <span className="invoice-analytics__daily-date">Date</span>
            <div className="invoice-analytics__daily-spacer" />
            <span className="invoice-analytics__daily-num invoice-analytics__daily-num--paid">
              Paid
            </span>
            <span className="invoice-analytics__daily-num invoice-analytics__daily-num--unpaid">
              Unpaid
            </span>
            <span className="invoice-analytics__daily-total">Total</span>
          </div>
          {daily.length === 0 && (
            <p className="invoice-analytics__empty">No daily data</p>
          )}
          {daily.map((d) => (
            <div key={d.date} className="invoice-analytics__daily-row">
              <span className="invoice-analytics__daily-date">
                {dayjs(d.date).format("MMM D")}
              </span>
              <div className="invoice-analytics__track">
                <div
                  className="invoice-analytics__fill"
                  style={{
                    width: `${pct(d.revenue, maxDaily)}%`,
                    background:
                      d.paid > 0
                        ? "var(--color-success)"
                        : "var(--color-primary-border)",
                  }}
                />
              </div>
              <span
                className="invoice-analytics__daily-num invoice-analytics__daily-num--paid"
                style={{ fontWeight: d.paid > 0 ? 600 : 400 }}
              >
                ${fmt(d.paid)}
              </span>
              <span className="invoice-analytics__daily-num invoice-analytics__daily-num--unpaid">
                ${fmt(d.unpaid)}
              </span>
              <span className="invoice-analytics__daily-total">
                ${fmt(d.revenue)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── employees ── */}
      {employees.length > 0 && (
        <div className="surface invoice-analytics__card">
          <h2 className="section-title invoice-analytics__section-title">
            🧑‍💼 Employee performance
          </h2>
          <table className="invoice-analytics__table">
            <thead>
              <tr>
                <th>Employee</th>
                <th className="is-center">Records</th>
                <th className="is-right">Total</th>
                <th className="is-right">Paid</th>
                <th className="is-right">Unpaid</th>
                <th className="is-right">Rate</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.user_id}>
                  <td>{e.name}</td>
                  <td className="is-center is-muted">
                    {e.record_count || e.invoice_count}
                  </td>
                  <td className="is-right is-strong">${fmt(e.total_amount)}</td>
                  <td className="is-right is-success">${fmt(e.paid_amount)}</td>
                  <td className="is-right is-error">${fmt(e.unpaid_amount)}</td>
                  <td className="is-right">
                    <span
                      className="invoice-analytics__rate"
                      style={{
                        color:
                          pct(e.paid_amount, e.total_amount) >= 50
                            ? "var(--color-success-strong)"
                            : "var(--color-error-strong)",
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
      <div className="surface invoice-analytics__card">
        <h2 className="section-title invoice-analytics__section-title">
          🧾 Monthly Activity
        </h2>

        <div className="invoice-analytics__table-scroll">
          <table className="invoice-analytics__table invoice-analytics__table--wide">
            <thead>
              <tr>
                <th>Type</th>
                <th>Ref</th>
                <th>Client</th>
                <th>Date</th>
                <th>Due date</th>
                <th className="is-right">Amount</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {monthlyActivity.length === 0 && (
                <tr>
                  <td colSpan={7} className="is-center is-subtle">
                    No activity
                  </td>
                </tr>
              )}

              {monthlyActivity.map((item) => (
                <tr key={`${item.type}-${item.id}`}>
                  <td>
                    <span
                      className={`invoice-analytics__type invoice-analytics__type--${
                        item.type === "INVOICE" ? "invoice" : "quote"
                      }`}
                    >
                      {item.type}
                    </span>
                  </td>

                  <td className="invoice-analytics__ref">{item.ref_no}</td>

                  <td>{item.client_name}</td>

                  <td className="invoice-analytics__date">
                    {dayjs(item.billing_date).format("MMM D, YYYY")}
                  </td>

                  <td className="invoice-analytics__date">
                    {item.due_date
                      ? dayjs(item.due_date).format("MMM D, YYYY")
                      : "—"}
                  </td>

                  <td className="is-right is-strong">${fmt(item.amount)}</td>

                  <td>
                    <Badge status={item.payment_status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InvoiceAnalytics;
