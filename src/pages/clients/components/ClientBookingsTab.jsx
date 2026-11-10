import { Button, Empty, Space, Table, Tag, Tooltip } from "antd";
import { useNavigate } from "react-router";
import { Eye, Plus } from "lucide-react";
import IconAction from "@/components/IconAction";
import { formatDate, formatTime } from "@/utils/datetime";
import { NEW_DOCUMENT_PATHS } from "../clientFlow";
import StatusTag from "./StatusTag";

const timeRange = (start, end) => (start ? `${formatTime(start)}${end ? ` – ${formatTime(end)}` : ""}` : "—");
const serviceNames = (services) => (services || []).map((service) => service.name).join(", ") || "—";

// The client's bookings: repeating bookings still running, and their next
// visits. Only the office books; a client can ask to cancel a visit.
const ClientBookingsTab = ({ clientId, flow }) => {
  const navigate = useNavigate();
  const repeating = flow?.bookings?.repeating ?? [];
  const upcoming = flow?.bookings?.upcoming ?? [];

  const visitColumns = [
    { title: "Date", dataIndex: "date", render: (date) => formatDate(date) },
    { title: "Time", key: "time", render: (_, visit) => timeRange(visit.start_time, visit.end_time) },
    { title: "Services", dataIndex: "services", render: serviceNames },
    { title: "Address", dataIndex: "address", render: (address) => address || "—" },
    {
      title: "Status",
      key: "status",
      render: (_, visit) => (
        <Space size={4} wrap>
          <StatusTag code={visit.status} />
          {visit.series_id && <Tag>Repeating</Tag>}
          {visit.cancel_request?.open && (
            <Tooltip title={visit.cancel_request.reason || "No reason given"}>
              <Tag color="red">Cancel requested</Tag>
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: "",
      key: "open",
      width: 60,
      render: (_, visit) => (
        <IconAction icon={Eye} title="Open the visit" onClick={() => navigate(`/viewBooking/${visit.id}`)} />
      ),
    },
  ];

  const seriesColumns = [
    { title: "Booking", dataIndex: "title", render: (title) => title || "Repeating booking" },
    { title: "Schedule", key: "repeat", render: (_, series) => series.repeat?.description || "—" },
    { title: "Time", key: "time", render: (_, series) => timeRange(series.start_time, series.end_time) },
    { title: "Services", dataIndex: "services", render: serviceNames },
    { title: "From", dataIndex: "starts_on", render: (date) => formatDate(date) },
    { title: "Until", dataIndex: "ends_on", render: (date) => formatDate(date) },
    { title: "Status", dataIndex: "status", render: (status) => <StatusTag code={status} /> },
  ];

  return (
    <div className="client-flow__tab">
      <div className="client-flow__tab-head">
        <p className="text-secondary">One-time and repeating visits for this client.</p>
        <Button type="primary" icon={<Plus size={16} />} onClick={() => navigate(NEW_DOCUMENT_PATHS.booking(clientId))}>
          New Booking
        </Button>
      </div>

      <h3 className="section-title">Next Visits</h3>
      <Table
        rowKey="id"
        dataSource={upcoming}
        columns={visitColumns}
        size="middle"
        pagination={false}
        scroll={{ x: "max-content" }}
        locale={{ emptyText: <Empty description="No visits coming up." /> }}
      />

      <h3 className="section-title client-flow__subsection">Repeating Bookings</h3>
      <Table
        rowKey="id"
        dataSource={repeating}
        columns={seriesColumns}
        size="middle"
        pagination={false}
        scroll={{ x: "max-content" }}
        locale={{ emptyText: <Empty description="No repeating bookings running." /> }}
      />
    </div>
  );
};

export default ClientBookingsTab;
