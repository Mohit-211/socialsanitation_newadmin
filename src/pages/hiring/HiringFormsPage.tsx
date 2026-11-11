import { useNavigate } from "react-router";
import { Input, Modal, Select, Space, Table, Tag, Tooltip, message, type TableColumnsType } from "antd";
import { Eye, FileText, RotateCw, Search, Trash2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import IconAction from "@/components/IconAction";
import { usePagedList } from "@/hooks/usePagedList";
import { PERMISSION, useCan } from "@/lib/session";
import {
  deleteHiringApplication,
  listHiringApplications,
  retryHiringApplication,
} from "@/services/api/hiringFormApi";
import { errorMessage } from "@/services/apiResult";
import { formatDateTime } from "@/utils/datetime";
import type { HiringApplicationSummary } from "@/types";

const PROCESSING: Record<string, { label: string; color: string }> = {
  pending: { label: "Being made", color: "gold" },
  done: { label: "Ready", color: "green" },
  failed: { label: "Failed", color: "red" },
};

const STATUS_OPTIONS = [
  { value: "pending", label: "Being made" },
  { value: "done", label: "Ready" },
  { value: "failed", label: "Failed" },
];

/** Opens a link in a new tab; an empty one does nothing. */
const open = (url: string | null | undefined) => {
  if (url) window.open(url, "_blank", "noopener");
};

// Hiring applications from the website, newest first. Each one's PDF and
// emails are made by a worker; one that kept failing can be tried again.
const HiringFormsPage = () => {
  const navigate = useNavigate();
  const canDelete = useCan(PERMISSION.DELETE_RECORDS);
  const list = usePagedList((query) => listHiringApplications(query), {
    limit: 20,
    errorText: "Couldn't load the hiring applications",
  });

  const retry = async (application: HiringApplicationSummary) => {
    try {
      await retryHiringApplication(application.id);
      message.success("Trying again: its PDF and emails follow shortly");
      list.reload();
    } catch (error) {
      message.error(errorMessage(error, "Couldn't try again"));
    }
  };

  const confirmDelete = (application: HiringApplicationSummary) =>
    Modal.confirm({
      title: `Delete ${application.applicant_name || "this"}'s application?`,
      content: "Its answers and files go too. This can't be undone.",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await deleteHiringApplication(application.id);
          message.success("Application deleted");
          list.reload();
        } catch (error) {
          message.error(errorMessage(error, "Couldn't delete the application"));
        }
      },
    });

  const columns: TableColumnsType<HiringApplicationSummary> = [
    { title: "Sent", dataIndex: "submitted_at", render: (date: string) => formatDateTime(date) },
    { title: "Applicant", dataIndex: "applicant_name", render: (name: string | null) => name || "—" },
    { title: "Email", dataIndex: "applicant_email", render: (email: string | null) => email || "—" },
    { title: "Language", dataIndex: "language", render: (language: string | null) => (language || "—").toUpperCase() },
    {
      title: "PDF and Emails",
      dataIndex: "processing_status",
      render: (status: HiringApplicationSummary["processing_status"]) => {
        const tag = status ? PROCESSING[status] : undefined;
        return tag ? <Tag color={tag.color}>{tag.label}</Tag> : <span className="text-subtle">Before the worker</span>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 170,
      render: (_value, application) => (
        <Space size={4}>
          <IconAction icon={Eye} title="Open" onClick={() => navigate(`/view-form/${application.id}`)} />
          {application.pdf_url && (
            <IconAction icon={FileText} title="PDF" onClick={() => open(application.pdf_url)} />
          )}
          {application.processing_status === "failed" && (
            <Tooltip title="Ten tries failed; the office was told">
              <span>
                <IconAction icon={RotateCw} title="Try again" onClick={() => retry(application)} />
              </span>
            </Tooltip>
          )}
          {canDelete && <IconAction icon={Trash2} title="Delete" danger onClick={() => confirmDelete(application)} />}
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="HIRING APPLICATIONS"
        subtitle="Sent from the website. Add an employee from one on Add Employee."
        actions={
          <Space wrap>
            <Input
              allowClear
              size="large"
              prefix={<Search size={16} className="text-subtle" />}
              placeholder="Search by name or email"
              value={list.searchText}
              onChange={(e) => list.setSearchText(e.target.value)}
              style={{ width: 260 }}
            />
            <Select
              allowClear
              size="large"
              placeholder="Any status"
              value={list.filters.status}
              onChange={(value) => list.setFilter("status", value)}
              options={STATUS_OPTIONS}
              style={{ width: 160 }}
            />
          </Space>
        }
      />
      <Table rowKey="id" size="middle" columns={columns} scroll={{ x: "max-content" }} {...list.tableProps} />
    </>
  );
};

export default HiringFormsPage;
