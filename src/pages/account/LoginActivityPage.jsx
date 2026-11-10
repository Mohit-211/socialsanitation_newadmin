import { useEffect, useState } from "react";
import { Button, Spin, Table, message } from "antd";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { listLoginActivity, clearLoginActivity } from "@/services/api/authApi";
import { dataOf, errorMessage } from "@/services/apiResult";
import { PERMISSION, useCan } from "@/lib/session";
import { formatDateTime } from "@/utils/datetime";
import PageHeader from "@/components/PageHeader";
import "./LoginActivityPage.scss";

// Which app a session was in, as people say it.
const APP_LABELS = { admin: "Admin panel", client: "Client app", employee: "Employee app" };
const appLabel = (app) => APP_LABELS[app] || app || "—";

// One table row per user. The API returns an object keyed by user id whose
// values are that user's login records; `rows` is that list.
const columns = [
  {
    title: "Name",
    key: "name",
    render: (_, { rows }) => (
      <span className="login-logs__name">
        {rows[0].login_user?.name || "—"}
      </span>
    ),
  },
  {
    title: "Email",
    key: "email",
    align: "right",
    render: (_, { rows }) => (
      <span className="login-logs__muted">{rows[0].login_user.email}</span>
    ),
  },
  {
    title: "App",
    key: "app",
    align: "right",
    render: (_, { rows }) => (
      <span className="login-logs__muted">
        {[...new Set(rows.map((row) => appLabel(row.app)))].join(", ")}
      </span>
    ),
  },
  {
    title: "User ID",
    key: "user_id",
    align: "right",
    render: (_, { rows }) => (
      <span className="login-logs__muted">{rows[0].user_id}</span>
    ),
  },
];

// Expand/collapse toggle shown at the start of each user row.
const ExpandToggle = ({ expanded, expandable, onClick }) =>
  expandable ? (
    <Button
      aria-label="expand row"
      aria-expanded={expanded}
      icon={expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      onClick={onClick}
    />
  ) : null;

const TABLE_COMPONENTS = { ExpandIcon: ExpandToggle };

const LoginHistory = ({ rows }) => (
  <div className="login-logs__history">
    <h3 className="login-logs__history-title">Login History</h3>
    <Table
      className="login-logs__history-table"
      size="small"
      rowKey="id"
      pagination={false}
      dataSource={rows}
      columns={[
        {
          title: "App",
          dataIndex: "app",
          render: (app) => appLabel(app),
        },
        {
          title: "IP Address",
          dataIndex: "ip_address",
          render: (ip) => (ip ? String(ip).split(":").pop() : "—"),
        },
        {
          title: "Login Time (Eastern)",
          dataIndex: "login_time_utc",
          align: "right",
          render: (loginTime) => formatDateTime(loginTime),
        },
        {
          title: "Logout Time (Eastern)",
          dataIndex: "logout_time_utc",
          align: "right",
          render: (logoutTime) => (logoutTime ? formatDateTime(logoutTime) : "Signed in"),
        },
        {
          title: "Device Time Zone",
          dataIndex: "time_zone",
          align: "right",
          render: (zone) => zone || "—",
        },
      ]}
    />
  </div>
);

const LoginActivityPage = () => {
  const [userLoginTimingData, setUserLoginTimingData] = useState({});
  const canClear = useCan(PERMISSION.DELETE_RECORDS);
  const [loading, setLoading] = useState(true);
  const [clearLoading, setClearLoading] = useState(false);

  useEffect(() => {
    const loginTimingsFunc = async () => {
      try {
        setUserLoginTimingData(dataOf(await listLoginActivity()) || {});
      } catch (err) {
        message.error(errorMessage(err, "Couldn't load the login activity"));
      } finally {
        setLoading(false);
      }
    };

    loginTimingsFunc();
  }, []);

  const handleClearButtonClick = async () => {
    setClearLoading(true);
    try {
      await clearLoginActivity();
      // Live sessions stay, so reload what is left.
      setUserLoginTimingData(dataOf(await listLoginActivity()) || {});
      message.success("Ended sessions cleared");
    } catch (err) {
      message.error(errorMessage(err, "Couldn't clear the login activity"));
    } finally {
      setClearLoading(false);
    }
  };

  // Users without login records (or without a user attached) are skipped.
  const dataSource = Object.keys(userLoginTimingData || {})
    .map((userId) => ({ key: userId, rows: userLoginTimingData[userId] }))
    .filter(({ rows }) => rows && rows[0] && rows[0]?.login_user);

  return (
    <div>
      {/* HEADER */}
      <PageHeader
        title="USER LOGIN ACTIVITY"
        subtitle="Login track record of all users"
        actions={
          canClear && (
            <Button
              type="primary"
              danger
              size="large"
              icon={<Trash2 size={16} />}
              onClick={handleClearButtonClick}
              disabled={clearLoading}
            >
              {clearLoading ? "Clearing..." : "Clear Ended Sessions"}
            </Button>
          )
        }
      />

      {loading ? (
        <div className="login-logs__loading">
          <Spin size="large" />
        </div>
      ) : dataSource.length > 0 ? (
        <Table
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          bordered
          size="middle"
          scroll={{ x: "max-content", y: "64.5vh" }}
          components={TABLE_COMPONENTS}
          expandable={{
            expandedRowRender: ({ rows }) => <LoginHistory rows={rows} />,
          }}
        />
      ) : (
        <div className="surface login-logs__empty">
          No login activity recorded yet.
        </div>
      )}
    </div>
  );
};

export default LoginActivityPage;
