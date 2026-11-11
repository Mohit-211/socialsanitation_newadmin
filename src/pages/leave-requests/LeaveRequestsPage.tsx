import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Button, Input, Modal, Segmented, Space, Table, Tag, message, type TableColumnsType } from "antd";
import { Check, Search, X } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import IconAction from "@/components/IconAction";
import { useApiQuery } from "@/hooks/useApiQuery";
import { answerLeaveRequest, listLeaveRequests } from "@/services/api/attendanceApi";
import { errorMessage, itemsOf } from "@/services/apiResult";
import { formatDate } from "@/utils/datetime";
import "./LeaveRequestsPage.scss";
import type { LeaveRequest, LeaveStatus } from "@/types";

type Shown = LeaveStatus | "ALL";

const STATUS_TAGS: Record<string, { label: string; color: string } | undefined> = {
  PENDING: { label: "Waiting", color: "gold" },
  ACCEPTED: { label: "Approved", color: "green" },
  REJECTED: { label: "Declined", color: "red" },
};

// Employees' leave requests, waiting ones first: approve or decline each.
const LeaveRequestsPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [show, setShow] = useState<Shown>("PENDING");
  const { data: requests, loading, reload } = useApiQuery(() => listLeaveRequests().then(itemsOf), [], {
    initial: [],
    errorText: "Couldn't load the leave requests",
  });

  const shown = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (requests || [])
      .filter((request) => show === "ALL" || request.leave_status === show)
      .filter((request) => !needle || (request.attendence_user?.name || "").toLowerCase().includes(needle))
      .sort((a, b) => String(b.leave_date).localeCompare(String(a.leave_date)));
  }, [requests, search, show]);

  const answer = (request: LeaveRequest, status: "ACCEPTED" | "REJECTED") =>
    Modal.confirm({
      title: `${status === "ACCEPTED" ? "Approve" : "Decline"} ${request.attendence_user?.name || "the"}'s leave on ${formatDate(request.leave_date)}?`,
      content: request.leave_reason ? `Reason: ${request.leave_reason}` : undefined,
      okText: status === "ACCEPTED" ? "Approve" : "Decline",
      okType: status === "ACCEPTED" ? "primary" : "danger",
      onOk: async () => {
        try {
          await answerLeaveRequest(request.id, status);
          message.success(status === "ACCEPTED" ? "Leave approved" : "Leave declined");
          reload();
        } catch (error) {
          message.error(errorMessage(error, "Couldn't answer the request"));
        }
      },
    });

  const columns: TableColumnsType<LeaveRequest> = [
    {
      title: "Employee",
      key: "employee",
      sorter: (a, b) => (a.attendence_user?.name || "").localeCompare(b.attendence_user?.name || ""),
      render: (_value, request) =>
        request.attendence_user ? (
          <Button
            type="link"
            className="table-link"
            onClick={() => navigate(`/viewEmployee/${request.attendence_user?.id}?tab=attendance`)}
          >
            {request.attendence_user.name || request.attendence_user.email}
          </Button>
        ) : (
          "—"
        ),
    },
    { title: "Day", dataIndex: "leave_date", render: (date: string | null) => formatDate(date) },
    { title: "Reason", dataIndex: "leave_reason", render: (reason: string | null) => reason || "—" },
    { title: "Asked", dataIndex: "created_at", render: (date: string) => formatDate(date) },
    {
      title: "Status",
      dataIndex: "leave_status",
      render: (status: LeaveStatus) => {
        const tag = STATUS_TAGS[status] || { label: status, color: "default" };
        return <Tag color={tag.color}>{tag.label}</Tag>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_value, request) =>
        request.leave_status === "PENDING" ? (
          <Space size={4}>
            <IconAction icon={Check} title="Approve" onClick={() => answer(request, "ACCEPTED")} />
            <IconAction icon={X} title="Decline" danger onClick={() => answer(request, "REJECTED")} />
          </Space>
        ) : null,
    },
  ];

  return (
    <div>
      <PageHeader
        className="leave-requests-header"
        title="LEAVE REQUESTS"
        subtitle="Employees ask for a day off from the app"
        actions={
          <Input
            allowClear
            size="large"
            className="leave-requests__search"
            prefix={<Search size={16} className="text-subtle" />}
            placeholder="Search by employee name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        }
      />
      <Segmented<Shown>
        className="leave-requests__show"
        value={show}
        onChange={setShow}
        options={[
          { value: "PENDING", label: "Waiting" },
          { value: "ACCEPTED", label: "Approved" },
          { value: "REJECTED", label: "Declined" },
          { value: "ALL", label: "All" },
        ]}
      />
      <Table
        rowKey="id"
        size="middle"
        loading={loading}
        columns={columns}
        dataSource={shown}
        pagination={{ pageSize: 50 }}
        scroll={{ x: "max-content" }}
        locale={{ emptyText: show === "PENDING" ? "No leave waiting for an answer." : "No leave requests." }}
      />
    </div>
  );
};

export default LeaveRequestsPage;
