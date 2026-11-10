import { Button, DatePicker, Input, Modal, Space, Table, message } from "antd";
import { useNavigate } from "react-router";
import { FileCheck, Pencil, Plus, Search, Trash2 } from "lucide-react";
import dayjs from "@/lib/dayjs";
import PageHeader from "@/components/PageHeader";
import IconAction from "@/components/IconAction";
import ShareToggle from "@/components/ShareToggle";
import StatusTag from "@/components/StatusTag";
import { deleteServiceRequest, listServiceRequests } from "@/services/api/serviceRequestApi";
import { errorMessage } from "@/services/apiResult";
import { usePagedList } from "@/hooks/usePagedList";
import { PERMISSION, useCan } from "@/lib/session";
import { formatDate } from "@/utils/datetime";
import { formatMoney } from "@/utils/format";
import "./serviceRequests.scss";

const MONTH = "YYYY-MM";

// Service requests, newest first: one month at a time (this month to start),
// or every month, searchable by reference or company.
const ServiceRequestsPage = () => {
  const navigate = useNavigate();
  const canDelete = useCan(PERMISSION.DELETE_RECORDS);
  const list = usePagedList((query) => listServiceRequests(query), {
    filters: { month: dayjs().format(MONTH) },
    errorText: "Couldn't load the service requests",
  });

  const confirmDelete = (request) =>
    Modal.confirm({
      title: `Delete service request ${request.ref_no || request.id}?`,
      content: "This can't be undone.",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await deleteServiceRequest(request.id);
          message.success("Service request deleted");
          list.reload();
        } catch (error) {
          message.error(errorMessage(error, "Couldn't delete the service request"));
        }
      },
    });

  const columns = [
    {
      title: "Service Request #",
      dataIndex: "ref_no",
      render: (ref, request) => (
        <Button type="link" className="table-link" onClick={() => navigate(`/edit-service-request/${request.id}`)}>
          {ref || `Request ${request.id}`}
        </Button>
      ),
    },
    {
      title: "Client",
      key: "client",
      render: (_, request) => (
        <Button type="link" className="table-link" onClick={() => navigate(`/viewUser/${request.user_id}?tab=service-requests`)}>
          {request.client?.name || request.to_company_name || "Client"}
        </Button>
      ),
    },
    { title: "Service Days", dataIndex: "service_days", render: (days) => days || "—" },
    { title: "Amount", dataIndex: "total_due", align: "right", render: formatMoney },
    { title: "Date", dataIndex: "date", render: (date) => formatDate(date) },
    { title: "Due", dataIndex: "due_date", render: (date) => formatDate(date) },
    { title: "Status", dataIndex: "status", render: (status) => <StatusTag code={status} /> },
    { title: "Signed", dataIndex: "signed_at", render: (date) => formatDate(date) },
    {
      title: "Actions",
      key: "actions",
      width: 170,
      render: (_, request) => (
        <Space size={4}>
          <IconAction icon={Pencil} title="Open" onClick={() => navigate(`/edit-service-request/${request.id}`)} />
          {request.signed_file_url && (
            <IconAction
              icon={FileCheck}
              title="Signed copy"
              onClick={() => window.open(request.signed_file_url, "_blank", "noopener")}
            />
          )}
          <ShareToggle kind="service_request" id={request.id} sharedAt={request.shared_at} onChanged={list.reload} />
          {canDelete && <IconAction icon={Trash2} title="Delete" danger onClick={() => confirmDelete(request)} />}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="SERVICE REQUESTS"
        subtitle="Extra work sent to clients for signature"
        actions={
          <>
            <DatePicker
              picker="month"
              size="large"
              format="MMMM YYYY"
              placeholder="Every month"
              value={list.filters.month ? dayjs(list.filters.month, MONTH) : null}
              onChange={(value) => list.setFilter("month", value ? value.format(MONTH) : undefined)}
            />
            <Input
              allowClear
              size="large"
              prefix={<Search size={16} className="text-subtle" />}
              placeholder="Search reference or company"
              style={{ width: 240 }}
              value={list.searchText}
              onChange={(event) => list.setSearchText(event.target.value)}
            />
            <Button
              type="primary"
              size="large"
              icon={<Plus size={16} />}
              onClick={() => navigate("/generate-service-request")}
            >
              New Service Request
            </Button>
          </>
        }
      />
      <Table rowKey="id" columns={columns} scroll={{ x: "max-content" }} size="middle" {...list.tableProps} />
    </div>
  );
};

export default ServiceRequestsPage;
