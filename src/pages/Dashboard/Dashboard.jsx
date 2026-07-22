/** @format */

import React, { useEffect, useState } from "react";
import {
  GetUserCount,
  GetServiceCount,
  GetDriverCount,
  GetAdminCount,
  GetLateAbsentEmployees,
  GetLiveWorkingEmployees,
  GetUpcomingScheduledBookings,
} from "../../services/Api/Api";
import Button from "@mui/material/Button";
import "./Dashboard.css";
import { useNavigate } from "react-router";
import dayjs from "@/lib/dayjs";

/* ─── helpers ─── */
const toAMPM = (value) => {
  if (!value) return "—";

  // Full datetime string
  if (String(value).includes("T") || String(value).includes(" ")) {
    return dayjs(value).format("hh:mm A");
  }

  // Time only
  return dayjs(value, "HH:mm:ss").format("hh:mm A");
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

const getUrgency = (days) => {
  if (days === 0)
    return {
      bar: "#E24B4A",
      badge: { bg: "#FCEBEB", color: "#A32D2D" },
      label: "Today",
    };
  if (days <= 2)
    return {
      bar: "#EF9F27",
      badge: { bg: "#FAEEDA", color: "#854F0B" },
      label: `In ${days} day${days > 1 ? "s" : ""}`,
    };
  return {
    bar: "#1D9E75",
    badge: { bg: "#EAF3DE", color: "#3B6D11" },
    label: `In ${days} days`,
  };
};

/* ─── pulse dot ─── */
const PulseDot = ({ color }) => (
  <span
    style={{
      display: "inline-block",
      width: 10,
      height: 10,
      borderRadius: "50%",
      background: color,
      marginRight: 8,
      flexShrink: 0,
      animation: "livePulse 1.6s infinite",
    }}
  />
);

/* ─── stat card ─── */
const StatCard = ({
  label,
  value,
  btnLabel,
  btnBg,
  btnHover,
  onClick,
  children,
}) => {
  const [hov, setHov] = useState(false);
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: "22px 24px",
        boxShadow: "0 1px 4px rgba(0,0,0,.08)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        flex: 1,
        minWidth: 0,
        transition: "box-shadow .2s",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,.12)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,.08)")
      }
    >
      <div>
        <p
          style={{
            margin: "0 0 6px",
            fontSize: 13,
            color: "#888",
            fontWeight: 500,
          }}
        >
          {label}
        </p>
        <h3
          style={{
            margin: "0 0 10px",
            fontSize: 32,
            fontWeight: 700,
            color: "#1a1a2e",
          }}
        >
          {value ?? 0}
        </h3>
        {children}
      </div>
      {btnLabel && (
        <button
          onClick={onClick}
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}
          style={{
            marginTop: 14,
            padding: "9px 16px",
            background: hov ? btnHover : btnBg,
            border: "none",
            borderRadius: 10,
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 500,
            color: "#1a1a2e",
            display: "flex",
            alignItems: "center",
            gap: 6,
            transition: "background .2s",
          }}
        >
          {btnLabel}{" "}
          <i className="pi pi-arrow-right" style={{ fontSize: 11 }} />
        </button>
      )}
    </div>
  );
};

/* ─── section header ─── */
const SectionHeader = ({ dot, dotColor, title, btnLabel, onClick }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 14,
    }}
  >
    <h4
      style={{
        margin: 0,
        fontSize: 16,
        fontWeight: 700,
        color: "#1a1a2e",
        display: "flex",
        alignItems: "center",
      }}
    >
      {dot && <PulseDot color={dotColor} />}
      {title}
    </h4>
    {btnLabel && (
      <Button
        label={btnLabel}
        icon="pi pi-arrow-right"
        iconPos="right"
        onClick={onClick}
        className="p-button-sm p-button-outlined"
      />
    )}
  </div>
);

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
const Dashboard = () => {
  const navigate = useNavigate();
  const [driverData, setDriverData] = useState([]);
  const [customerData, setCustomerData] = useState([]);
  const [adminData, setAdminData] = useState([]);
  const [serviceData, setServiceData] = useState([]);
  const [liveEmployees, setLiveEmployees] = useState([]);
  const [lateEmployees, setLateEmployees] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [upcomingBookings, setUpcomingBookings] = useState([]);

  const getUpcomingBookings = async () => {
    try {
      const result = await GetUpcomingScheduledBookings({});
      setUpcomingBookings(result.data.data.data || []);
    } catch (e) {
      console.log(e);
    }
  };

  const getLiveEmployees = async () => {
    try {
      const result = await GetLiveWorkingEmployees({
        date: new Date().toISOString().split("T")[0],
      });
      setLiveEmployees(result.data.data.data || []);
      setLastRefresh(new Date());
    } catch (e) {
      console.log(e);
    }
  };

  const getLateAbsent = async () => {
    try {
      const result = await GetLateAbsentEmployees({});
      setLateEmployees(result.data.data.data || []);
    } catch (e) {
      console.log(e);
    }
  };

  const getCustomerData = async () => {
    try {
      const result = await GetUserCount(localStorage.getItem("adminToken"));
      setCustomerData(result.data.data);
    } catch (e) {
      console.log(e);
    }
  };

  const getDriverData = async () => {
    try {
      const result = await GetDriverCount(localStorage.getItem("adminToken"));
      setDriverData(result.data.data);
    } catch (e) {
      console.log(e);
    }
  };

  const getAdminData = async () => {
    try {
      const result = await GetAdminCount(localStorage.getItem("adminToken"));
      setAdminData(result.data.data);
    } catch (e) {
      console.log(e);
    }
  };

  const getServiceCount = async () => {
    try {
      const result = await GetServiceCount(localStorage.getItem("adminToken"));
      setServiceData(result.data.data);
    } catch (e) {
      console.log(e);
    }
  };

useEffect(() => {
  const loadDashboard = async () => {
    try {
      await Promise.all([
        getServiceCount(),
        getDriverData(),
        getCustomerData(),
        getAdminData(),
        getLiveEmployees(),
        getLateAbsent(),
        getUpcomingBookings(),
      ]);
    } catch (e) {
      console.log(e);
    }
  };

  loadDashboard();

  const interval = setInterval(() => {
    getLiveEmployees();
  }, 60000);

  return () => clearInterval(interval);
}, []);

  return (
    <div style={{ padding: "24px", background: "#f5f6fa", minHeight: "100vh" }}>
      <style>{`
        @keyframes livePulse {
          0%   { box-shadow: 0 0 0 0 rgba(34,197,94,.7); }
          70%  { box-shadow: 0 0 0 8px rgba(34,197,94,0); }
          100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
        }
        @keyframes softPulse {
          0%,100% { opacity: 1; }
          50%      { opacity: .45; }
        }
        .live-row:hover  { background: #f0fdf4 !important; }
        .late-row:hover  { background: #fff7ed !important; }
        .map-link:hover  { background: #dbeafe !important; }
        .booking-card-hover:hover {
          box-shadow: 0 4px 16px rgba(0,0,0,.09) !important;
          transform: translateY(-1px);
        }
      `}</style>

      {/* ── Welcome banner ── */}
      <div
        style={{
          background:
            "linear-gradient(120deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%)",
          borderRadius: 18,
          padding: "28px 32px",
          marginBottom: 24,
          color: "#fff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h2 style={{ margin: "0 0 6px", fontSize: 26, fontWeight: 700 }}>
            Welcome Admin 👋🏻
          </h2>
          <p style={{ margin: 0, color: "#a3b8d8", fontSize: 14 }}>
            Here's a snapshot of your latest statistics and insights.
          </p>
        </div>
        <div style={{ textAlign: "right", fontSize: 13, color: "#a3b8d8" }}>
          <div style={{ marginBottom: 4 }}>Live data · refreshes every 30s</div>
          <div style={{ fontWeight: 600, color: "#7dd3fc" }}>
            Last updated: {toAMPM(lastRefresh)}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          LIVE TRACKING
      ══════════════════════════════════════════ */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          marginBottom: 24,
        }}
      >
        {/* Currently Working */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: "22px 24px",
            boxShadow: "0 1px 4px rgba(0,0,0,.08)",
            borderTop: "4px solid #22c55e",
          }}
        >
          <SectionHeader
            dot
            dotColor="#22c55e"
            title={`Currently Working (Live) · ${liveEmployees.length}`}
            btnLabel="Day Overview"
            onClick={() => navigate("/overview")}
          />
          {liveEmployees.length === 0 ? (
            <p style={{ color: "#999", fontSize: 14, margin: 0 }}>
              No employees currently working.
            </p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {liveEmployees.map((emp, i) => (
                <li
                  key={i}
                  className="live-row"
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    marginBottom: 8,
                    background: "#f8fffe",
                    transition: "background .15s",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 6,
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <span
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: "50%",
                          background: "#dcfce7",
                          display: "grid",
                          placeItems: "center",
                          fontSize: 15,
                          flexShrink: 0,
                        }}
                      >
                        👤
                      </span>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: 14,
                          color: "#1a1a2e",
                        }}
                      >
                        {emp.employee_name}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: 12,
                        color: "#16a34a",
                        background: "#dcfce7",
                        padding: "3px 10px",
                        borderRadius: 20,
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}
                    >
                      🕒 Clocked in {toAMPM(emp.clock_in)}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "#555",
                      paddingLeft: 42,
                      marginBottom: 5,
                    }}
                  >
                    📋 {emp.booking_name}
                  </div>
                  {emp.clock_in_lat && emp.clock_in_lng ? (
                    <div
                      style={{
                        paddingLeft: 42,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <span style={{ fontSize: 12, color: "#777" }}>
                        📍 {parseFloat(emp.clock_in_lat).toFixed(5)},{" "}
                        {parseFloat(emp.clock_in_lng).toFixed(5)}
                      </span>
                      <a
                        href={`https://www.google.com/maps?q=${emp.clock_in_lat},${emp.clock_in_lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="map-link"
                        style={{
                          fontSize: 12,
                          color: "#2563eb",
                          fontWeight: 600,
                          textDecoration: "none",
                          background: "#eff6ff",
                          padding: "2px 10px",
                          borderRadius: 8,
                          transition: "background .15s",
                        }}
                      >
                        View on Map 🗺️
                      </a>
                    </div>
                  ) : (
                    <div
                      style={{ paddingLeft: 42, fontSize: 12, color: "#ccc" }}
                    >
                      📍 Location not available
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Not Checked-In */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: "22px 24px",
            boxShadow: "0 1px 4px rgba(0,0,0,.08)",
            borderTop: "4px solid #ef4444",
          }}
        >
          <SectionHeader
            dot
            dotColor="#ef4444"
            title={`Not Checked-In (Late / Absent) · ${lateEmployees.length}`}
            btnLabel="Attendance"
            onClick={() => navigate("/attendence")}
          />
          {lateEmployees.length === 0 ? (
            <p style={{ color: "#999", fontSize: 14, margin: 0 }}>
              All employees are on time 🎉
            </p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {lateEmployees.map((emp, i) => (
                <li
                  key={i}
                  className="late-row"
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    marginBottom: 8,
                    background: "#fff9f9",
                    transition: "background .15s",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 5,
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <span
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background:
                            emp.status === "ABSENT" ? "#fee2e2" : "#fff3cd",
                          display: "grid",
                          placeItems: "center",
                          fontSize: 14,
                          flexShrink: 0,
                        }}
                      >
                        👤
                      </span>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: 14,
                          color: "#1a1a2e",
                        }}
                      >
                        {emp.employee_name}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: emp.status === "ABSENT" ? "#dc2626" : "#d97706",
                        background:
                          emp.status === "ABSENT" ? "#fee2e2" : "#fef3c7",
                        padding: "2px 10px",
                        borderRadius: 20,
                      }}
                    >
                      {emp.status}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "#555",
                      paddingLeft: 40,
                      marginBottom: 4,
                    }}
                  >
                    📍 {emp.booking_name}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#777",
                      paddingLeft: 40,
                      display: "flex",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
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
                    <span style={{ color: "#dc2626", fontWeight: 700 }}>
                      ⏱ {formatDelay(emp.delay_minutes)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          UPCOMING BOOKINGS — updated UI
      ══════════════════════════════════════════ */}
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: "22px 24px",
          boxShadow: "0 1px 4px rgba(0,0,0,.08)",
          borderTop: "4px solid #2563eb",
          marginBottom: 24,
        }}
      >
        {/* Section header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <h4
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 700,
              color: "#1a1a2e",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#2563eb",
                flexShrink: 0,
                animation: "softPulse 1.8s infinite",
              }}
            />
            Upcoming Scheduled Bookings
            <span
              style={{
                fontSize: 13,
                fontWeight: 400,
                color: "#888",
                marginLeft: 2,
              }}
            >
              · next 7 days
            </span>
          </h4>
          <Button
            label="All Bookings"
            icon="pi pi-arrow-right"
            iconPos="right"
            onClick={() => navigate("/bookings")}
            className="p-button-sm p-button-outlined"
          />
        </div>

        {/* Notification strip */}
        {upcomingBookings.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: 10,
              padding: "10px 14px",
              marginBottom: 16,
              fontSize: 13,
              color: "#1d4ed8",
            }}
          >
            <span style={{ fontSize: 16 }}>🔔</span>
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
          <div
            style={{
              textAlign: "center",
              padding: "2rem 1rem",
              color: "#999",
              fontSize: 14,
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
            No upcoming scheduled bookings in the next 7 days.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {upcomingBookings.map((booking, index) => {
              const days = getDaysUntil(booking.date);
              const urgency = days !== null ? getUrgency(days) : null;

              return (
                <div
                  key={index}
                  className="booking-card-hover"
                  style={{
                    border: "1px solid #eef2f7",
                    borderRadius: 14,
                    overflow: "hidden",
                    background: "#fafcff",
                    transition: "box-shadow .2s, transform .2s",
                  }}
                >
                  {/* Urgency colour bar */}
                  {urgency && (
                    <div
                      style={{
                        height: 4,
                        width: "100%",
                        background: urgency.bar,
                      }}
                    />
                  )}

                  <div style={{ padding: "16px 18px" }}>
                    {/* Top row — name + days badge */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 12,
                        marginBottom: 12,
                        flexWrap: "wrap",
                      }}
                    >
                      <div>
                        <h4
                          style={{
                            margin: "0 0 4px",
                            fontSize: 15,
                            fontWeight: 700,
                            color: "#1a1a2e",
                          }}
                        >
                          {booking.booking_name}
                        </h4>
                        <p style={{ margin: 0, color: "#666", fontSize: 13 }}>
                          👤 {booking.client_name}
                        </p>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        {/* Days-until badge */}
                        {urgency && (
                          <span
                            style={{
                              background: urgency.badge.bg,
                              color: urgency.badge.color,
                              padding: "5px 12px",
                              borderRadius: 20,
                              fontSize: 12,
                              fontWeight: 700,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {urgency.label}
                          </span>
                        )}
                        {/* Date pill */}
                        <span
                          style={{
                            background: "#dbeafe",
                            color: "#1d4ed8",
                            padding: "5px 12px",
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                          }}
                        >
                          📅 {booking.date}
                        </span>
                      </div>
                    </div>

                    {/* Info grid — Time / Employees / Address */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: 10,
                      }}
                    >
                      {/* Time */}
                      <div
                        style={{
                          background: "#f5f6fa",
                          borderRadius: 10,
                          padding: "10px 12px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            color: "#999",
                            marginBottom: 4,
                            fontWeight: 500,
                          }}
                        >
                          Booking Time
                        </div>
                        <div
                          style={{
                            fontWeight: 700,
                            color: "#1a1a2e",
                            fontSize: 14,
                          }}
                        >
                          🕒 {toAMPM(booking.time)}
                        </div>
                      </div>

                      {/* Employees */}
                      <div
                        style={{
                          background: "#f5f6fa",
                          borderRadius: 10,
                          padding: "10px 12px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            color: "#999",
                            marginBottom: 4,
                            fontWeight: 500,
                          }}
                        >
                          Employees Assigned
                        </div>
                        <div
                          style={{
                            fontWeight: 700,
                            color: "#1a1a2e",
                            fontSize: 14,
                          }}
                        >
                          👥 {booking.employees_assigned}
                        </div>
                      </div>

                      {/* Address */}
                      <div
                        style={{
                          background: "#f5f6fa",
                          borderRadius: 10,
                          padding: "10px 12px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            color: "#999",
                            marginBottom: 4,
                            fontWeight: 500,
                          }}
                        >
                          Service Address
                        </div>
                        <div
                          style={{
                            fontWeight: 600,
                            color: "#1a1a2e",
                            fontSize: 13,
                            lineHeight: 1.5,
                          }}
                        >
                          📍 {booking.address}
                        </div>
                      </div>
                    </div>

                    {/* Employee name chips */}
                    {booking.employees?.length > 0 && (
                      <div
                        style={{
                          marginTop: 12,
                          display: "flex",
                          gap: 7,
                          flexWrap: "wrap",
                        }}
                      >
                        {booking.employees.map((emp, idx) => (
                          <span
                            key={idx}
                            style={{
                              background: "#eff6ff",
                              color: "#1d4ed8",
                              padding: "5px 11px",
                              borderRadius: 20,
                              fontSize: 12,
                              fontWeight: 600,
                            }}
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
        )}
      </div>

      {/* ══════════════════════════════════════════
          STATS CARDS
      ══════════════════════════════════════════ */}
      <p
        style={{
          margin: "0 0 12px",
          fontSize: 12,
          fontWeight: 600,
          color: "#aaa",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        Platform Overview
      </p>

      {/* Row 1 */}
      <div
        style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}
      >
        <StatCard
          label="Total Users Registered"
          value={customerData}
          btnLabel="View Users"
          btnBg="#EFF5FB"
          btnHover="#D7E8F8"
          onClick={() => navigate("/users")}
        />
        <StatCard
          label="Total BDM Registered"
          value={adminData?.bdm}
          btnLabel="View BDM"
          btnBg="#E8F7F0"
          btnHover="#CDE7DB"
          onClick={() => navigate("/adminList")}
        />
        <StatCard
          label="Total Admin"
          value={adminData?.super_admin}
          btnLabel="View Admin"
          btnBg="#FFF0EF"
          btnHover="#F8D9D7"
          onClick={() => navigate("/adminList")}
        />
        <StatCard
          label="Sales Executive Registered"
          value={adminData?.sales_executive}
          btnLabel="View Sales Exec"
          btnBg="#F3E5F5"
          btnHover="#DEC3E8"
          onClick={() => navigate("/clips-list")}
        />
      </div>

      {/* Row 2 */}
      <div
        style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}
      >
        {/* Employees */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: "22px 24px",
            boxShadow: "0 1px 4px rgba(0,0,0,.08)",
            flex: 2,
            minWidth: 260,
          }}
        >
          <p
            style={{
              margin: "0 0 4px",
              fontSize: 13,
              color: "#888",
              fontWeight: 500,
            }}
          >
            Total Employees Registered
          </p>
          <h3
            style={{
              margin: "0 0 14px",
              fontSize: 32,
              fontWeight: 700,
              color: "#1a1a2e",
            }}
          >
            {driverData?.total ?? 0}
          </h3>
          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              marginBottom: 14,
            }}
          >
            {[
              { emoji: "👷", label: "Supervisor", val: driverData?.supervisor },
              {
                emoji: "🔍",
                label: "QA Tech",
                val: driverData?.quality_assurance,
              },
              { emoji: "🧹", label: "Cleaner", val: driverData?.janitor },
              {
                emoji: "🏠",
                label: "Housekeeping",
                val: driverData?.housekeeping,
              },
            ].map(({ emoji, label, val }) => (
              <div
                key={label}
                style={{
                  background: "#f5f6fa",
                  borderRadius: 10,
                  padding: "8px 14px",
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span>{emoji}</span>
                <span style={{ color: "#555" }}>{label}</span>
                <strong style={{ color: "#1a1a2e" }}>{val ?? 0}</strong>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate("/employees")}
            style={{
              padding: "9px 16px",
              background: "#EFF5FB",
              border: "none",
              borderRadius: 10,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
              color: "#1a1a2e",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#D7E8F8")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#EFF5FB")}
          >
            View Employees{" "}
            <i className="pi pi-arrow-right" style={{ fontSize: 11 }} />
          </button>
        </div>

        <StatCard
          label="Total Services"
          value={serviceData}
          btnLabel="View Services"
          btnBg="#EFF5FB"
          btnHover="#D7E8F8"
          onClick={() => navigate("/services")}
        />
      </div>
    </div>
  );
};

export default Dashboard;
