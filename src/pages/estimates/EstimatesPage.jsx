import { Button, Input, Modal, Select, Space, Table, message } from "antd";
import { useNavigate } from "react-router";
import { FileCheck, FileText, Pencil, Plus, Search, Trash2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import IconAction from "@/components/IconAction";
import ShareToggle from "@/components/ShareToggle";
import StatusTag from "@/components/StatusTag";
import { deleteEstimate, listEstimates } from "@/services/api/estimateApi";
import { errorMessage } from "@/services/apiResult";
import { usePagedList } from "@/hooks/usePagedList";
import { SIGNING_STATUS_OPTIONS } from "@/utils/signing";
import { PERMISSION, useCan } from "@/lib/session";
import { formatDate } from "@/utils/datetime";

const open = (url) => window.open(url, "_blank", "noopener");

// Every service estimate, newest first, searchable by company.
const EstimatesPage = () => {
  const navigate = useNavigate();
  const canDelete = useCan(PERMISSION.DELETE_RECORDS);
  const list = usePagedList((query) => listEstimates(query), { errorText: "Couldn't load the estimates" });

  const confirmDelete = (estimate) =>
    Modal.confirm({
      title: `Delete the estimate for ${estimate.client_company_name}?`,
      content: "This can't be undone.",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await deleteEstimate(estimate.id);
          message.success("Estimate deleted");
          list.reload();
        } catch (error) {
          message.error(errorMessage(error, "Couldn't delete the estimate"));
        }
      },
    });

  const columns = [
    {
      title: "Company",
      dataIndex: "client_company_name",
      render: (company, estimate) => (
        <Button type="link" className="table-link" onClick={() => navigate(`/edit-service-estimate/${estimate.id}`)}>
          {company || `Estimate ${estimate.id}`}
        </Button>
      ),
    },
    {
      title: "Client",
      key: "client",
      render: (_, estimate) => (
        <Button type="link" className="table-link" onClick={() => navigate(`/viewUser/${estimate.user_id}?tab=estimates`)}>
          {estimate.contact_name || estimate.client_email || "Client"}
        </Button>
      ),
    },
    { title: "Frequency", dataIndex: "frequency", render: (frequency) => frequency || "—" },
    { title: "Status", dataIndex: "status", render: (status) => <StatusTag code={status} /> },
    { title: "Sent", dataIndex: "sent_at", render: (date) => formatDate(date) },
    { title: "Signed", dataIndex: "signed_at", render: (date) => formatDate(date) },
    {
      title: "Actions",
      key: "actions",
      width: 200,
      render: (_, estimate) => (
        <Space size={4}>
          <IconAction icon={Pencil} title="Open" onClick={() => navigate(`/edit-service-estimate/${estimate.id}`)} />
          {estimate.file_url && <IconAction icon={FileText} title="PDF" onClick={() => open(estimate.file_url)} />}
          {estimate.signed_file_url && (
            <IconAction icon={FileCheck} title="Signed copy" onClick={() => open(estimate.signed_file_url)} />
          )}
          <ShareToggle kind="estimate" id={estimate.id} sharedAt={estimate.shared_at} onChanged={list.reload} />
          {canDelete && <IconAction icon={Trash2} title="Delete" danger onClick={() => confirmDelete(estimate)} />}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="SERVICE ESTIMATES"
        subtitle="Estimates sent to clients for signature"
        actions={
          <>
            <Select
              size="large"
              allowClear
              placeholder="Any status"
              style={{ width: 200 }}
              options={SIGNING_STATUS_OPTIONS}
              value={list.filters.status}
              onChange={(value) => list.setFilter("status", value)}
            />
            <Input
              allowClear
              size="large"
              prefix={<Search size={16} className="text-subtle" />}
              placeholder="Search by company"
              style={{ width: 240 }}
              value={list.searchText}
              onChange={(event) => list.setSearchText(event.target.value)}
            />
            <Button type="primary" size="large" icon={<Plus size={16} />} onClick={() => navigate("/generate-estimate")}>
              New Estimate
            </Button>
          </>
        }
      />
      <Table rowKey="id" columns={columns} scroll={{ x: "max-content" }} size="middle" {...list.tableProps} />
    </div>
  );
};

export default EstimatesPage;
