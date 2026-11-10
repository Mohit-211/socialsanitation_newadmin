import { useEffect, useState } from "react";
import { Button, Spin, Table, message } from "antd";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { getUserLoginTimings, clearUserLoginTimings } from "@/services/api/userApi";
import PageHeader from "@/components/PageHeader";
import "./LoginActivityPage.scss";

const DATE_TIME_FORMAT = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
};

const roleLabel = (roleId) =>
  roleId === 6 ? "User" : roleId === 7 ? "Driver" : "";

// One table row per user. The API returns an object keyed by user id whose
// values are that user's login records; `rows` is that list.
const columns = [
  {
    title: "Name",
    key: "name",
    render: (_, { rows }) => (
      <span className="login-logs__name">
        {rows[0].login_user?.user_profile?.name}
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
    title: "Role",
    key: "role",
    align: "right",
    render: (_, { rows }) => (
      <span className="login-logs__muted">{roleLabel(rows[0].role_id)}</span>
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
          title: "IP Address",
          key: "ip_address",
          render: () => rows[0].ip_address.split(":").pop(),
        },
        {
          title: "Login Time",
          dataIndex: "login_time_utc",
          align: "right",
          render: (loginTime) =>
            new Date(loginTime).toLocaleString("en-US", DATE_TIME_FORMAT),
        },
        {
          title: "Logout Time",
          dataIndex: "logout_time_utc",
          align: "right",
          render: (logoutTime) =>
            logoutTime
              ? new Date(logoutTime).toLocaleString("en-US", DATE_TIME_FORMAT)
              : "----",
        },
      ]}
    />
  </div>
);

const LoginActivityPage = () => {
  const [userLoginTimingData, setUserLoginTimingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clearLoading, setClearLoading] = useState(false);

  useEffect(() => {
    const loginTimingsFunc = async () => {
      try {
        let data = await getUserLoginTimings();
        setUserLoginTimingData(data.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loginTimingsFunc();
  }, []);

  const handleClearButtonClick = async () => {
    setClearLoading(true);
    try {
      await clearUserLoginTimings();
      setUserLoginTimingData([]);
      message.success("Login Record Cleared Successfully");
    } catch {
      message.error("Failed to Clear Login Record");
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
          <Button
            type="primary"
            danger
            size="large"
            icon={<Trash2 size={16} />}
            onClick={handleClearButtonClick}
            disabled={clearLoading}
          >
            {clearLoading ? "Clearing..." : "Clear Logs"}
          </Button>
        }
      />

      {loading ? (
        <div className="login-logs__loading">
          <Spin size="large" />
        </div>
      ) : userLoginTimingData && userLoginTimingData.length !== 0 ? (
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
