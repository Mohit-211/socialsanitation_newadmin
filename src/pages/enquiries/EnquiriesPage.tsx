import { useState } from "react";
import { Button, Select, Space, Table, message, type TableColumnsType } from "antd";
import { useNavigate } from "react-router";
import { Eye } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import IconAction from "@/components/IconAction";
import { ENQUIRY_STATUSES, listEnquiries, setEnquiryStatus } from "@/services/api/enquiryApi";
import { errorMessage } from "@/services/apiResult";
import { usePagedList } from "@/hooks/usePagedList";
import { formatDate, formatDateTime } from "@/utils/datetime";
import EnquiryDrawer from "./components/EnquiryDrawer";
import type { Address, Enquiry, EnquiryStatus, Place } from "@/types";

// What clients ask for in the app: services, a date and an address. The office
// calls them back and marks each one contacted, then closed; the client sees it.
const EnquiriesPage = () => {
  const navigate = useNavigate();
  const [openId, setOpenId] = useState<number | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const list = usePagedList((query) => listEnquiries(query), {
    filters: { status: "new" },
    errorText: "Couldn't load the enquiries",
  });

  const changeStatus = async (enquiry: Enquiry, status: EnquiryStatus) => {
    setSavingId(enquiry.id);
    try {
      await setEnquiryStatus(enquiry.id, status);
      list.setItems((items) => items.map((item) => (item.id === enquiry.id ? { ...item, status } : item)));
      message.success("Status changed; the client sees it in the app");
    } catch (error) {
      message.error(errorMessage(error, "Couldn't change the status"));
    } finally {
      setSavingId(null);
    }
  };

  const columns: TableColumnsType<Enquiry> = [
    { title: "Received", dataIndex: "created_at", render: (date: string) => formatDateTime(date) },
    {
      title: "Client",
      key: "client",
      render: (_value, enquiry) => (
        <Space orientation="vertical" size={0}>
          <Button type="link" className="table-link" onClick={() => navigate(`/viewUser/${enquiry.client?.id}?tab=enquiries`)}>
            {enquiry.client?.name || enquiry.client?.email || "Client"}
          </Button>
          {enquiry.client?.phone && <span className="text-subtle">{enquiry.client.phone}</span>}
        </Space>
      ),
    },
    {
      title: "Services",
      dataIndex: "services",
      render: (services: Place[]) => (services || []).map((service) => service.name).join(", ") || "—",
    },
    { title: "Needed On", dataIndex: "needed_on", render: (date: string | null) => formatDate(date) },
    { title: "Address", dataIndex: "address", render: (address: Address | null) => address?.one_line || "—" },
    {
      title: "Status",
      dataIndex: "status",
      render: (status: EnquiryStatus, enquiry) => (
        <Select
          size="small"
          value={status}
          options={ENQUIRY_STATUSES}
          onChange={(value) => changeStatus(enquiry, value)}
          loading={savingId === enquiry.id}
          style={{ minWidth: 130 }}
          aria-label="Enquiry status"
        />
      ),
    },
    {
      title: "",
      key: "open",
      width: 60,
      render: (_value, enquiry) => <IconAction icon={Eye} title="Open" onClick={() => setOpenId(enquiry.id)} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="ENQUIRIES"
        subtitle="Requests from the client app. Call the client back, then mark it contacted."
        actions={
          <Select
            size="large"
            allowClear
            placeholder="Every status"
            style={{ width: 170 }}
            options={ENQUIRY_STATUSES}
            value={list.filters.status}
            onChange={(value) => list.setFilter("status", value)}
          />
        }
      />
      <Table rowKey="id" columns={columns} scroll={{ x: "max-content" }} size="middle" {...list.tableProps} />
      <EnquiryDrawer enquiryId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
};

export default EnquiriesPage;
