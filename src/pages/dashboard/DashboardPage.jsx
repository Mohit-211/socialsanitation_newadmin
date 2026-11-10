import { useEffect, useState } from "react";
import {
  getDashboardCounts,
  listLateEmployees,
  listLiveEmployees,
  listUpcomingVisits,
} from "@/services/api/dashboardApi";
import { listUpcomingInvoices } from "@/services/api/invoiceApi";
import { dataOf, itemsOf } from "@/services/apiResult";
import { useApiQuery } from "@/hooks/useApiQuery";
import { todayInBusinessTz } from "@/utils/datetime";
import { Button } from "antd";
import { ArrowRight } from "lucide-react";
import "./DashboardPage.scss";
import { useNavigate } from "react-router";
import dayjs from "@/lib/dayjs";

/* helpers */
const toAMPM = (value) => {
  if (!value) return "—";

  // Full datetime string
  if (String(value).includes("T") || String(value).includes(" ")) {
    return dayjs(value).format("hh:mm A");
  }

  // Time only
  return dayjs(value, "HH:mm:ss").format("hh:mm A");
};

// MM-DD-YYYY formatter for plain dates
const fmtDate = (value) => {
  if (!value) return "—";
  const d = dayjs(value);
  return d.isValid() ? d.format("MM-DD-YYYY") : String(value);
};

const fmtDateRange = (rangeStr) => {
  if (!rangeStr) return "—";
  const parts = String(rangeStr).split(" - ");
  if (parts.length === 2) {
    return `${fmtDate(parts[0])} - ${fmtDate(parts[1])}`;
  }
  return fmtDate(rangeStr);
};

const formatDelay = (mins) =>
  mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m late` : `${mins}m late`;

const getDaysUntil = (dateStr) => {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
};

// `tone` picks the colour bar and badge styles in DashboardPage.scss.
const getUrgency = (days) => {
  if (days === 0) return { tone: "error", label: "Today" };
  if (days <= 2)
    return {
      tone: "warning",
      label: `In ${days} day${days > 1 ? "s" : ""}`,
    };
  return { tone: "success", label: `In ${days} days` };
};

const PAGE_SIZE = 5;

/* pulse dot: tone = success | error | primary, pulse = live | soft */
const PulseDot = ({ tone = "success", pulse = "live" }) => (
  <span
    className={`ss-dashboard__dot ss-dashboard__dot--${tone} ss-dashboard__dot--${pulse}`}
  />
);

/* load more / show less control */
const LoadMoreControl = ({ total, visible, onMore, onLess }) => {
  if (total <= PAGE_SIZE) return null;
  const hasMore = visible < total;
  const isExpanded = visible >= total;

  return (
    <div className="ss-dashboard__loadmore">
      {hasMore ? (
        <button onClick={onMore} className="ss-loadmore-btn">
          Load More ({total - visible} more)
        </button>
      ) : isExpanded ? (
        <button onClick={onLess} className="ss-loadmore-btn">
          Show Less
        </button>
      ) : null}
    </div>
  );
};

/* stat card */
const StatCard = ({ label, value, btnLabel, onClick, children }) => (
  <div className="ss-dashboard__card ss-dashboard__stat">
    <div>
      <p className="ss-dashboard__stat-label ss-text-label">{label}</p>
      <h3 className="ss-dashboard__stat-value ss-text-dark">{value ?? 0}</h3>
      {children}
    </div>
    {btnLabel && (
      <Button
        size="small"
        className="ss-dashboard__stat-action"
        icon={<ArrowRight size={14} />}
        iconPlacement="end"
        onClick={onClick}
      >
        {btnLabel}
      </Button>
    )}
  </div>
);

/* section header */
const SectionHeader = ({ dot, tone, pulse, title, note, btnLabel, onClick }) => (
  <div className="ss-dashboard__section-head">
    <h4 className="ss-dashboard__section-title ss-text-dark">
      {dot && <PulseDot tone={tone} pulse={pulse} />}
      <span>
        {title}
        {note && (
          <span className="ss-dashboard__section-note ss-text-faint">
            {note}
          </span>
        )}
      </span>
    </h4>
    {btnLabel && (
      <Button
        size="small"
        icon={<ArrowRight size={14} />}
        iconPlacement="end"
        onClick={onClick}
      >
        {btnLabel}
      </Button>
    )}
  </div>
);

/* MAIN COMPONENT */
const DashboardPage = () => {
  const navigate = useNavigate();
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // pagination state
  const [visibleBookings, setVisibleBookings] = useState(PAGE_SIZE);
  const [visibleInvoices, setVisibleInvoices] = useState(PAGE_SIZE);

  // Each card loads on its own, so one slow list doesn't hold up the rest.
  const quiet = { initial: [], silent: true };
  const { data: counts } = useApiQuery(() => getDashboardCounts().then(dataOf), [], { silent: true });
  const { data: liveEmployees, reload: reloadLive } = useApiQuery(
    () =>
      listLiveEmployees(todayInBusinessTz())
        .then(itemsOf)
        .finally(() => setLastRefresh(new Date())),
    [],
    quiet,
  );
  const { data: lateEmployees } = useApiQuery(() => listLateEmployees().then(itemsOf), [], quiet);
  const { data: upcomingBookings } = useApiQuery(() => listUpcomingVisits().then(itemsOf), [], quiet);
  const { data: upcomingInvoices } = useApiQuery(() => listUpcomingInvoices().then(itemsOf), [], quiet);
  const customerData = counts?.clients;
  const driverData = counts?.employees;
  const adminData = counts?.admins;
  const serviceData = counts?.services;

  // Who is working right now refreshes every minute.
  useEffect(() => {
    const interval = setInterval(reloadLive, 60000);
    return () => clearInterval(interval);
  }, [reloadLive]);

  return (
    <div className="ss-dashboard">
      {/* ── Welcome banner ── */}
      <div className="ss-dashboard__banner">
        <div>
          <h2 className="ss-dashboard__banner-title">Welcome Admin 👋🏻</h2>
          <p className="ss-dashboard__banner-text">
            Here's a snapshot of your latest statistics and insights.
          </p>
        </div>
        <div className="ss-dashboard__banner-meta">
          <div className="ss-dashboard__banner-live">
            Live data · refreshes every 30s
          </div>
          <div className="ss-dashboard__banner-updated">
            Last updated: {toAMPM(lastRefresh)}
          </div>
        </div>
      </div>

      {/* LIVE TRACKING */}
      <div className="responsive-grid-2 ss-dashboard__live-grid">
        {/* Currently Working */}
        <div className="ss-dashboard__card ss-dashboard__card--success">
          <SectionHeader
            dot
            tone="success"
            title={`Currently Working (Live) · ${liveEmployees.length}`}
            btnLabel="Day Overview"
            onClick={() => navigate("/overview")}
          />
          {liveEmployees.length === 0 ? (
            <p className="ss-dashboard__empty-text ss-text-faint">
              No employees currently working.
            </p>
          ) : (
            <ul className="ss-dashboard__list">
              {liveEmployees.map((emp, i) => (
                <li key={i} className="ss-dashboard__row ss-dashboard__row--live">
                  <div className="ss-dashboard__row-head">
                    <div className="ss-dashboard__person">
                      <span className="ss-dashboard__avatar ss-dashboard__avatar--success">
                        👤
                      </span>
                      <span className="ss-dashboard__name ss-text-dark">
                        {emp.employee_name}
                      </span>
                    </div>
                    <span className="ss-dashboard__pill ss-dashboard__pill--compact ss-dashboard__pill--success">
                      🕒 Clocked in {toAMPM(emp.clock_in)}
                    </span>
                  </div>
                  <div className="ss-dashboard__row-line ss-text-muted">
                    📋 {emp.booking_name}
                  </div>
                  {emp.clock_in_lat && emp.clock_in_lng ? (
                    <div className="ss-dashboard__location">
                      <span className="ss-dashboard__coords">
                        📍 {parseFloat(emp.clock_in_lat).toFixed(5)},{" "}
                        {parseFloat(emp.clock_in_lng).toFixed(5)}
                      </span>
                      <a
                        href={`https://www.google.com/maps?q=${emp.clock_in_lat},${emp.clock_in_lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="ss-dashboard__map-link"
                      >
                        View on Map 🗺️
                      </a>
                    </div>
                  ) : (
                    <div className="ss-dashboard__location ss-dashboard__location--empty">
                      📍 Location not available
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Not Checked-In */}
        <div className="ss-dashboard__card ss-dashboard__card--error">
          <SectionHeader
            dot
            tone="error"
            title={`Not Checked-In (Late / Absent) · ${lateEmployees.length}`}
            btnLabel="Attendance"
            onClick={() => navigate("/attendance")}
          />
          {lateEmployees.length === 0 ? (
            <p className="ss-dashboard__empty-text ss-text-faint">
              All employees are on time 🎉
            </p>
          ) : (
            <ul className="ss-dashboard__list">
              {lateEmployees.map((emp, i) => {
                const statusTone = emp.status === "ABSENT" ? "error" : "warning";
                return (
                  <li key={i} className="ss-dashboard__row ss-dashboard__row--late">
                    <div className="ss-dashboard__row-head">
                      <div className="ss-dashboard__person">
                        <span
                          className={`ss-dashboard__avatar ss-dashboard__avatar--sm ss-dashboard__avatar--${statusTone}`}
                        >
                          👤
                        </span>
                        <span className="ss-dashboard__name ss-text-dark">
                          {emp.employee_name}
                        </span>
                      </div>
                      <span
                        className={`ss-dashboard__pill ss-dashboard__pill--compact ss-dashboard__pill--${statusTone}`}
                      >
                        {emp.status}
                      </span>
                    </div>
                    <div className="ss-dashboard__row-line ss-text-muted">
                      📍 {emp.booking_name}
                    </div>
                    <div className="ss-dashboard__timing">
                      <span>
                        🕒 Start: <strong>{toAMPM(emp.booking_time)}</strong>
                      </span>
                      <span>
                        🕓 Clock-in:{" "}
                        <strong>
                          {emp.clock_in_time
                            ? toAMPM(emp.clock_in_time)
                            : "Not yet"}
                        </strong>
                      </span>
                      <span className="ss-dashboard__delay">
                        ⏱ {formatDelay(emp.delay_minutes)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* UPCOMING / OUTGOING INVOICES */}
      <div className="ss-dashboard__card ss-dashboard__card--success ss-dashboard__section">
        <SectionHeader
          dot
          tone="success"
          pulse="soft"
          title="Outgoing Invoices"
          btnLabel="All Invoices"
          onClick={() => navigate("/invoices")}
        />

        {/* Notification strip */}
        {upcomingInvoices.length > 0 && (
          <div className="ss-dashboard__notice ss-dashboard__notice--success">
            <span className="ss-dashboard__notice-icon">🧾</span>
            <span>
              <strong>
                {upcomingInvoices.length} invoice
                {upcomingInvoices.length !== 1 ? "s" : ""}
              </strong>{" "}
              going out soon — review before they send.
            </span>
          </div>
        )}

        {upcomingInvoices.length === 0 ? (
          <div className="ss-dashboard__empty ss-text-faint">
            <div className="ss-dashboard__empty-icon">🧾</div>
            No upcoming invoices.
          </div>
        ) : (
          <>
            <div className="ss-dashboard__items">
              {upcomingInvoices.slice(0, visibleInvoices).map((inv, index) => (
                <div key={inv.id ?? index} className="ss-dashboard__item">
                  <div className="ss-dashboard__item-bar ss-dashboard__item-bar--success" />

                  <div className="ss-dashboard__item-body">
                    <div className="ss-dashboard__item-head">
                      <div>
                        <h4 className="ss-dashboard__item-title ss-text-dark">
                          {inv.to_company_name || inv.client_name}
                        </h4>
                        <p className="ss-dashboard__item-sub ss-text-muted">
                          🧾 {inv.custom_ref_no || inv.ref_no}
                        </p>
                      </div>

                      <span className="ss-dashboard__pill ss-dashboard__pill--success">
                        📅 Bills {fmtDate(inv.billing_date)}
                      </span>
                    </div>

                    <div className="ss-dashboard__info-grid ss-dashboard__info-grid--spaced">
                      <div className="ss-dashboard__tile">
                        <div className="ss-dashboard__tile-label ss-text-label">
                          Service Dates
                        </div>
                        <div className="ss-dashboard__tile-value ss-text-dark">
                          🗓️ {fmtDateRange(inv.service_dates)}
                        </div>
                      </div>

                      <div className="ss-dashboard__tile">
                        <div className="ss-dashboard__tile-label ss-text-label">
                          Due Date
                        </div>
                        <div className="ss-dashboard__tile-value ss-text-dark">
                          ⏰ {fmtDate(inv.due_date)}
                        </div>
                      </div>
                    </div>

                    <button
                      className="ss-dashboard__pdf-btn"
                      onClick={() =>
                        window.open(
                          inv.pdf_url,
                          "_blank",
                          "noopener,noreferrer",
                        )
                      }
                    >
                      View PDF <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <LoadMoreControl
              total={upcomingInvoices.length}
              visible={visibleInvoices}
              onMore={() => setVisibleInvoices((v) => v + PAGE_SIZE)}
              onLess={() => setVisibleInvoices(PAGE_SIZE)}
            />
          </>
        )}
      </div>

      {/* UPCOMING BOOKINGS */}
      <div className="ss-dashboard__card ss-dashboard__card--primary ss-dashboard__section">
        <SectionHeader
          dot
          tone="primary"
          pulse="soft"
          title="Upcoming Scheduled Bookings"
          note="· next 7 days"
          btnLabel="All Bookings"
          onClick={() => navigate("/bookings")}
        />

        {/* Notification strip */}
        {upcomingBookings.length > 0 && (
          <div className="ss-dashboard__notice ss-dashboard__notice--primary">
            <span className="ss-dashboard__notice-icon">🔔</span>
            <span>
              <strong>
                {upcomingBookings.length} scheduled booking
                {upcomingBookings.length !== 1 ? "s" : ""}
              </strong>{" "}
              in the next 7 days — stay ahead, no surprises.
            </span>
          </div>
        )}

        {upcomingBookings.length === 0 ? (
          <div className="ss-dashboard__empty ss-text-faint">
            <div className="ss-dashboard__empty-icon">📅</div>
            No upcoming scheduled bookings in the next 7 days.
          </div>
        ) : (
          <>
            <div className="ss-dashboard__items">
              {upcomingBookings
                .slice(0, visibleBookings)
                .map((booking, index) => {
                  const days = getDaysUntil(booking.date);
                  const urgency = days !== null ? getUrgency(days) : null;

                  return (
                    <div key={index} className="ss-dashboard__item">
                      {/* Urgency colour bar */}
                      {urgency && (
                        <div
                          className={`ss-dashboard__item-bar ss-dashboard__item-bar--${urgency.tone}`}
                        />
                      )}

                      <div className="ss-dashboard__item-body">
                        {/* Top row — name + days badge */}
                        <div className="ss-dashboard__item-head">
                          <div>
                            <h4 className="ss-dashboard__item-title ss-text-dark">
                              {booking.booking_name}
                            </h4>
                            <p className="ss-dashboard__item-sub ss-text-muted">
                              👤 {booking.client_name}
                            </p>
                          </div>

                          <div className="ss-dashboard__badges">
                            {/* Days-until badge */}
                            {urgency && (
                              <span
                                className={`ss-dashboard__pill ss-dashboard__pill--${urgency.tone}`}
                              >
                                {urgency.label}
                              </span>
                            )}
                            {/* Date pill */}
                            <span className="ss-dashboard__pill ss-dashboard__pill--primary">
                              📅 {fmtDate(booking.date)}
                            </span>
                          </div>
                        </div>

                        {/* Info grid — Time / Employees / Address */}
                        <div className="ss-dashboard__info-grid">
                          {/* Time */}
                          <div className="ss-dashboard__tile">
                            <div className="ss-dashboard__tile-label ss-text-label">
                              Booking Time
                            </div>
                            <div className="ss-dashboard__tile-value ss-text-dark">
                              🕒 {toAMPM(booking.time)}
                            </div>
                          </div>

                          {/* Employees */}
                          <div className="ss-dashboard__tile">
                            <div className="ss-dashboard__tile-label ss-text-label">
                              Employees Assigned
                            </div>
                            <div className="ss-dashboard__tile-value ss-text-dark">
                              👥 {booking.employees_assigned}
                            </div>
                          </div>

                          {/* Address */}
                          <div className="ss-dashboard__tile">
                            <div className="ss-dashboard__tile-label ss-text-label">
                              Service Address
                            </div>
                            <div className="ss-dashboard__tile-value ss-dashboard__tile-value--address ss-text-dark">
                              📍 {booking.address}
                            </div>
                          </div>
                        </div>

                        {/* Employee name chips */}
                        {booking.employees?.length > 0 && (
                          <div className="ss-dashboard__chips">
                            {booking.employees.map((emp, idx) => (
                              <span
                                key={idx}
                                className="ss-dashboard__pill ss-dashboard__pill--chip"
                              >
                                👤 {emp}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            <LoadMoreControl
              total={upcomingBookings.length}
              visible={visibleBookings}
              onMore={() => setVisibleBookings((v) => v + PAGE_SIZE)}
              onLess={() => setVisibleBookings(PAGE_SIZE)}
            />
          </>
        )}
      </div>

      {/* STATS CARDS */}
      <p className="ss-dashboard__overline ss-text-label">Platform Overview</p>

      {/* Row 1 */}
      <div className="ss-dashboard__stats">
        <StatCard
          label="Clients"
          value={customerData}
          btnLabel="View Clients"
          onClick={() => navigate("/users")}
        />
        <StatCard
          label="BDMs"
          value={driverData?.bdm}
          btnLabel="View BDMs"
          onClick={() => navigate("/bdm-list")}
        />
        <StatCard
          label="Admins"
          value={adminData?.total}
          btnLabel="View Admins"
          onClick={() => navigate("/adminList")}
        />
        <StatCard
          label="Salespeople"
          value={driverData?.salesperson}
          btnLabel="View Employees"
          onClick={() => navigate("/employees")}
        />
      </div>

      {/* Row 2 */}
      <div className="ss-dashboard__split">
        {/* Employees */}
        <div className="ss-dashboard__card ss-dashboard__employees">
          <p className="ss-dashboard__stat-label ss-text-label">
            Total Employees Registered
          </p>
          <h3 className="ss-dashboard__stat-value ss-text-dark">
            {driverData?.total ?? 0}
          </h3>
          <div className="ss-dashboard__roles">
            {[
              { emoji: "👷", label: "Supervisor", val: driverData?.supervisor },
              {
                emoji: "🔍",
                label: "QA Tech",
                val: driverData?.quality_assurance,
              },
              { emoji: "🧹", label: "Cleaner", val: driverData?.cleaner },
              {
                emoji: "🏠",
                label: "Housekeeper",
                val: driverData?.housekeeper,
              },
            ].map(({ emoji, label, val }) => (
              <div key={label} className="ss-dashboard__role">
                <span>{emoji}</span>
                <span className="ss-text-muted">{label}</span>
                <strong className="ss-text-dark">{val ?? 0}</strong>
              </div>
            ))}
          </div>
          <Button
            size="small"
            icon={<ArrowRight size={14} />}
            iconPlacement="end"
            onClick={() => navigate("/employees")}
          >
            View Employees
          </Button>
        </div>

        <StatCard
          label="Total Services"
          value={serviceData}
          btnLabel="View Services"
          onClick={() => navigate("/services")}
        />
      </div>
    </div>
  );
};

export default DashboardPage;
