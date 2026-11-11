import { useState } from "react";
import { Empty, Select, Table, message } from "antd";
import { Eye } from "lucide-react";
import IconAction from "@/components/IconAction";
import { ENQUIRY_STATUSES, setEnquiryStatus } from "@/services/api/enquiryApi";
import { errorMessage } from "@/services/apiResult";
import { formatDate, formatDateTime } from "@/utils/datetime";
import EnquiryDrawer from "@/pages/enquiries/components/EnquiryDrawer";
import type { TableColumnsType } from "antd";
import type { EnquiryStatus, FlowEnquiryRow } from "@/types";
import type { ClientTabProps } from "./ClientProfileTab";

// Enquiries the client sent from the app. The office calls them back and
// marks each one contacted, then closed; the client sees the status.
const ClientEnquiriesTab = ({ flow, onChanged }: Pick<ClientTabProps, "flow" | "onChanged">) => {
  const [openId, setOpenId] = useState<number | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const rows = flow?.enquiries ?? [];

  const changeStatus = async (id: number, status: EnquiryStatus) => {
    setSavingId(id);
    try {
      await setEnquiryStatus(id, status);
      message.success("Status changed; the client sees it in the app");
      onChanged?.();
    } catch (error) {
      message.error(errorMessage(error, "Couldn't change the status"));
    } finally {
      setSavingId(null);
    }
  };

  const columns: TableColumnsType<FlowEnquiryRow> = [
    { title: "Received", dataIndex: "created_at", render: (date) => formatDateTime(date) },
    { title: "Needed On", dataIndex: "needed_on", render: (date) => formatDate(date) },
    {
      title: "Status",
      dataIndex: "status",
      render: (status, row) => (
        <Select
          size="small"
          value={status}
          options={ENQUIRY_STATUSES}
          onChange={(value) => changeStatus(row.id, value)}
          loading={savingId === row.id}
          style={{ minWidth: 130 }}
          aria-label="Enquiry status"
        />
      ),
    },
    {
      title: "",
      key: "open",
      width: 60,
      render: (_, row) => <IconAction icon={Eye} title="Open" onClick={() => setOpenId(row.id)} />,
    },
  ];

  return (
    <div className="client-flow__tab">
      <div className="client-flow__tab-head">
        <p className="text-secondary">What the client asked for in the app. Call them back, then mark it contacted.</p>
      </div>
      <Table
        rowKey="id"
        dataSource={rows}
        columns={columns}
        size="middle"
        pagination={false}
        scroll={{ x: "max-content" }}
        locale={{ emptyText: <Empty description="No enquiries from this client." /> }}
      />
      <EnquiryDrawer enquiryId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
};

export default ClientEnquiriesTab;
