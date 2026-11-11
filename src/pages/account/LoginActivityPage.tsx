import { useEffect, useState } from "react";
import { Button, Spin, Table, message, type TableColumnsType } from "antd";
import { Trash2 } from "lucide-react";
import { listLoginActivity, clearLoginActivity } from "@/services/api/authApi";
import { dataOf, errorMessage } from "@/services/apiResult";
import { PERMISSION, useCan } from "@/lib/session";
import { formatDateTime } from "@/utils/datetime";
import PageHeader from "@/components/PageHeader";
import "./LoginActivityPage.scss";
import type { LoginActivity, LoginRecord } from "@/types";

// Which app a session was in, as people say it.
const APP_LABELS: Record<string, string> = { admin: "Admin panel", client: "Client app", employee: "Employee app" };
const appLabel = (app: string | null) => (app && APP_LABELS[app]) || app || "—";

// One table row per user. The API returns an object keyed by user id whose
// values are that user's login records; `rows` is that list.
interface UserLogins {
  key: string;
  rows: LoginRecord[];
}

const columns: TableColumnsType<UserLogins> = [
  {
    title: "Name",
    key: "name",
    render: (_value, { rows }) => (
      <span className="login-logs__name">
        {rows[0].login_user?.name || "—"}
      </span>
    ),
  },
  {
    title: "Email",
    key: "email",
    align: "right",
    render: (_value, { rows }) => (
      <span className="login-logs__muted">{rows[0].login_user?.email}</span>
    ),
  },
  {
    title: "App",
    key: "app",
    align: "right",
    render: (_value, { rows }) => (
      <span className="login-logs__muted">
        {[...new Set(rows.map((row) => appLabel(row.app)))].join(", ")}
      </span>
    ),
  },
  {
    title: "User ID",
    key: "user_id",
    align: "right",
    render: (_value, { rows }) => (
      <span className="login-logs__muted">{rows[0].user_id}</span>
    ),
  },
];

const LoginHistory = ({ rows }: { rows: LoginRecord[] }) => (
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
          render: (app: string | null) => appLabel(app),
        },
        {
          title: "IP Address",
          dataIndex: "ip_address",
          render: (ip: string | null) => (ip ? String(ip).split(":").pop() : "—"),
        },
        {
          title: "Login Time (Eastern)",
          dataIndex: "login_time_utc",
          align: "right",
          render: (loginTime: string) => formatDateTime(loginTime),
        },
        {
          title: "Logout Time (Eastern)",
          dataIndex: "logout_time_utc",
          align: "right",
          render: (logoutTime: string | null) => (logoutTime ? formatDateTime(logoutTime) : "Signed in"),
        },
        {
          title: "Device Time Zone",
          dataIndex: "time_zone",
          align: "right",
          render: (zone: string | null) => zone || "—",
        },
      ]}
    />
  </div>
);

const LoginActivityPage = () => {
  const [userLoginTimingData, setUserLoginTimingData] = useState<LoginActivity>({});
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
  const dataSource: UserLogins[] = Object.keys(userLoginTimingData || {})
    .map((userId) => ({ key: userId, rows: userLoginTimingData[userId] }))
    .filter(({ rows }) => rows?.[0]?.login_user);

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
