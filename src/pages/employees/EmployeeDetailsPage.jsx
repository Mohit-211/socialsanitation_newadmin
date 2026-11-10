import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { Button, Card, Descriptions, Modal, Segmented, Space, Spin, Switch, Table, Tabs, Tag, message } from "antd";
import { ArrowLeft, FileText, KeyRound, Pencil, Send, Trash2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import AddressesCard from "@/components/AddressesCard";
import StatusTag from "@/components/StatusTag";
import { useApiQuery } from "@/hooks/useApiQuery";
import { usePagedList } from "@/hooks/usePagedList";
import { PERMISSION, useCan } from "@/lib/session";
import { listAddresses } from "@/services/api/addressApi";
import { listEmployeeBookings, sendTwoWeekSchedule } from "@/services/api/bookingApi";
import { deleteEmployee, getEmployee, toggleEmployeeLogoutImage } from "@/services/api/employeeApi";
import { getHiringApplication } from "@/services/api/hiringFormApi";
import { dataOf, errorMessage, itemsOf } from "@/services/apiResult";
import { formatDate, formatTime } from "@/utils/datetime";
import EmployeeAttendance from "./components/EmployeeAttendance";
import ResetCredentialsModal from "./components/ResetCredentialsModal";
import { roleCodesOf, roleColor, roleLabel, typeLabel } from "./employeeFields";
import "./EmployeeDetailsPage.scss";

const JOB_LABELS = { CLEANER: "Cleaner", SUPERVISOR: "Supervisor", QUALITY_INSPECTOR: "Quality Inspector" };

// An employee's visits: all, still to come, or done.
const EmployeeBookings = ({ employeeId }) => {
  const navigate = useNavigate();
  const list = usePagedList((query) => listEmployeeBookings(employeeId, query), {
    limit: 20,
    errorText: "Couldn't load the visits",
  });
  const columns = [
    {
      title: "Visit",
      key: "number",
      render: (_, visit) => (
        <Button type="link" className="table-link" onClick={() => navigate(`/viewBooking/${visit.id}`)}>
          {visit.number || visit.title || `Visit ${visit.id}`}
        </Button>
      ),
    },
    { title: "Date", dataIndex: "date", render: (date) => formatDate(date) },
    {
      title: "Time",
      key: "time",
      render: (_, visit) => [formatTime(visit.start_time), visit.end_time && formatTime(visit.end_time)].filter(Boolean).join(" – "),
    },
    { title: "Client", key: "client", render: (_, visit) => visit.client?.name || visit.guest?.name || "—" },
    { title: "Services", dataIndex: "services", render: (services) => (services || []).map((s) => s.name).join(", ") || "—" },
    {
      title: "Their Job",
      key: "job",
      render: (_, visit) =>
        JOB_LABELS[(visit.employees || []).find((person) => person.id === Number(employeeId))?.job_type] || "—",
    },
    { title: "Status", dataIndex: "status", render: (status) => <StatusTag code={status} /> },
  ];
  return (
    <>
      <Segmented
        className="employee-view__segments"
        value={list.filters.booking_status || "ALL"}
        onChange={(value) => list.setFilter("booking_status", value === "ALL" ? undefined : value)}
        options={[
          { value: "ALL", label: "All" },
          { value: "UPCOMING", label: "Upcoming" },
          { value: "COMPLETED", label: "Done" },
        ]}
      />
      <Table rowKey="id" size="middle" columns={columns} scroll={{ x: "max-content" }} {...list.tableProps} />
    </>
  );
};

// One employee: who they are, their roles and home, their visits and their
// attendance, with what the office does for them.
const EmployeeDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "overview";
  const canDelete = useCan(PERMISSION.DELETE_RECORDS);
  const [resetting, setResetting] = useState(false);
  const [togglingPhoto, setTogglingPhoto] = useState(false);

  const { data: employee, loading, setData: setEmployee } = useApiQuery(() => getEmployee(id).then(dataOf), [id], {
    errorText: "Couldn't load the employee",
  });
  const { data: addresses, reload: reloadAddresses } = useApiQuery(() => listAddresses(id).then(itemsOf), [id], {
    initial: [],
    errorText: "Couldn't load the addresses",
  });
  const hiringId = employee?.hiring_form_submission_id;
  const { data: hiring } = useApiQuery(() => getHiringApplication(hiringId).then(dataOf), [hiringId], {
    skip: !hiringId,
    silent: true,
  });

  const sendSchedule = () =>
    Modal.confirm({
      title: "Send their 2-week schedule?",
      content: "They get an email with their visits for the next two weeks.",
      okText: "Send",
      onOk: async () => {
        try {
          const sent = dataOf(await sendTwoWeekSchedule(id));
          message.success(sent?.count ? `Schedule sent: ${sent.count} visit(s)` : "Schedule sent");
        } catch (error) {
          message.error(errorMessage(error, "Couldn't send the schedule"));
        }
      },
    });

  const togglePhoto = async () => {
    setTogglingPhoto(true);
    try {
      await toggleEmployeeLogoutImage(id);
      setEmployee((current) => ({ ...current, logout_image_required: !current.logout_image_required }));
      message.success("Sign-out photo rule changed");
    } catch (error) {
      message.error(errorMessage(error, "Couldn't change the sign-out photo rule"));
    } finally {
      setTogglingPhoto(false);
    }
  };

  const confirmDelete = () =>
    Modal.confirm({
      title: `Delete ${employee?.name || "this employee"}?`,
      content: "They can no longer sign in. This can't be undone.",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await deleteEmployee(id);
          message.success("Employee deleted");
          navigate("/employees");
        } catch (error) {
          message.error(errorMessage(error, "Couldn't delete the employee"));
        }
      },
    });

  if (loading && !employee) {
    return (
      <div className="page-loader">
        <Spin size="large" />
      </div>
    );
  }

  const roles = roleCodesOf(employee);
  const overview = employee && (
    <div className="employee-view__overview">
      <Card title="Details" size="small">
        <Descriptions
          size="small"
          column={{ xs: 1, md: 2 }}
          items={[
            { key: "email", label: "Email", children: employee.email || "—" },
            { key: "phone", label: "Phone", children: employee.phone || "—" },
            {
              key: "roles",
              label: "Roles",
              children: roles.length ? roles.map((code) => <Tag key={code} color={roleColor(code)}>{roleLabel(code)}</Tag>) : "—",
            },
            { key: "type", label: "Pay Type", children: typeLabel(employee.employee_type) },
            {
              key: "photo",
              label: "Sign-Out Photo",
              children: (
                <Space>
                  <Switch checked={Boolean(employee.logout_image_required)} loading={togglingPhoto} onChange={togglePhoto} />
                  {employee.logout_image_required ? "Required" : "Not required"}
                </Space>
              ),
            },
            { key: "since", label: "Employee Since", children: formatDate(employee.created_at) },
          ]}
        />
      </Card>
      <Card title="Hiring Form" size="small">
        {hiring ? (
          <Space wrap>
            <span>
              {hiring.applicant_name} · sent {formatDate(hiring.submitted_at)}
            </span>
            {hiring.pdf_url && (
              <Button icon={<FileText size={14} />} onClick={() => window.open(hiring.pdf_url, "_blank", "noopener")}>
                PDF
              </Button>
            )}
          </Space>
        ) : (
          <span className="text-secondary">No hiring form is linked. Link one from Edit.</span>
        )}
      </Card>
      <AddressesCard userId={id} addresses={addresses || []} onChanged={reloadAddresses} title="Home Address" />
    </div>
  );

  return (
    <>
      <PageHeader
        title={(employee?.name || "EMPLOYEE").toUpperCase()}
        subtitle={
          employee && (
            <Space size={6} wrap>
              {roles.map((code) => (
                <Tag key={code} color={roleColor(code)}>
                  {roleLabel(code)}
                </Tag>
              ))}
              <span>{typeLabel(employee.employee_type)}</span>
            </Space>
          )
        }
        actions={
          <Space wrap>
            <Button icon={<Pencil size={16} />} onClick={() => navigate(`/editEmployee/${id}`)}>
              Edit
            </Button>
            <Button icon={<Send size={16} />} onClick={sendSchedule}>
              Send 2-Week Schedule
            </Button>
            <Button icon={<KeyRound size={16} />} onClick={() => setResetting(true)}>
              New Sign-In Details
            </Button>
            {canDelete && (
              <Button danger icon={<Trash2 size={16} />} onClick={confirmDelete}>
                Delete
              </Button>
            )}
            <Button icon={<ArrowLeft size={16} />} onClick={() => navigate("/employees")}>
              All Employees
            </Button>
          </Space>
        }
      />
      {employee && (
        <Tabs
          activeKey={tab}
          onChange={(key) => setParams(key === "overview" ? {} : { tab: key }, { replace: true })}
          items={[
            { key: "overview", label: "Overview", children: overview },
            { key: "bookings", label: "Visits", children: <EmployeeBookings employeeId={id} /> },
            { key: "attendance", label: "Attendance", children: <EmployeeAttendance employeeId={id} /> },
          ]}
        />
      )}
      {resetting && <ResetCredentialsModal employee={employee} onClose={() => setResetting(false)} />}
    </>
  );
};

export default EmployeeDetailsPage;
