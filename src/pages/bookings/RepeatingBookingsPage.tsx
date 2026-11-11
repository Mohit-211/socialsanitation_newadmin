import { Button, Segmented, Space, Table, type TableColumnsType } from "antd";
import { useNavigate } from "react-router";
import { ArrowLeft, Eye } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import IconAction from "@/components/IconAction";
import StatusTag from "@/components/StatusTag";
import { listBookingSeries } from "@/services/api/bookingApi";
import { usePagedList } from "@/hooks/usePagedList";
import { formatDate, formatTime } from "@/utils/datetime";
import SeriesActions from "./components/SeriesActions";
import "./bookings.scss";
import type { BookingSeries } from "@/types";

const STATUS_FILTERS = [
  { value: "active", label: "Running" },
  { value: "ending", label: "Ending soon" },
  { value: "ended", label: "Ended" },
  { value: "", label: "All" },
];

// Repeating bookings, the soonest to end first. "Ending soon" lists the ones
// ending within 2 weeks (the office also gets an email) so they can be extended.
const RepeatingBookingsPage = () => {
  const navigate = useNavigate();
  const list = usePagedList((query) => listBookingSeries(query), {
    filters: { status: "active" },
    errorText: "Couldn't load the repeating bookings",
  });

  const columns: TableColumnsType<BookingSeries> = [
    {
      title: "Booking",
      key: "title",
      render: (_value, series) => (
        <Button type="link" className="table-link" onClick={() => navigate(`/booking-series/${series.id}`)}>
          {series.title || series.client?.name || series.guest?.name || `Series ${series.id}`}
        </Button>
      ),
    },
    {
      title: "Client",
      key: "who",
      render: (_value, series) =>
        series.client ? (
          <Button type="link" className="table-link" onClick={() => navigate(`/viewUser/${series.client?.id}?tab=bookings`)}>
            {series.client.name || series.client.email}
          </Button>
        ) : (
          `${series.guest?.name || "Guest"} (not a client)`
        ),
    },
    { title: "Schedule", key: "repeat", render: (_value, series) => series.repeat?.description || "—" },
    { title: "Time", dataIndex: "start_time", render: (time: string | null) => formatTime(time) },
    { title: "From", dataIndex: "starts_on", render: (date: string) => formatDate(date) },
    { title: "Until", dataIndex: "ends_on", render: (date: string) => formatDate(date) },
    { title: "Status", dataIndex: "status", render: (status: string) => <StatusTag code={status} /> },
    {
      title: "Actions",
      key: "actions",
      width: 190,
      render: (_value, series) => (
        <Space size={4}>
          <IconAction icon={Eye} title="Open" onClick={() => navigate(`/booking-series/${series.id}`)} />
          <SeriesActions series={series} compact onChanged={list.reload} onDeleted={list.reload} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="REPEATING BOOKINGS"
        subtitle="Weekly and monthly bookings; visits are booked 4 weeks ahead"
        actions={
          <>
            <Segmented
              size="large"
              options={STATUS_FILTERS}
              value={list.filters.status ?? ""}
              onChange={(value) => list.setFilter("status", value || undefined)}
            />
            <Button size="large" icon={<ArrowLeft size={16} />} onClick={() => navigate("/bookings")}>
              All Bookings
            </Button>
          </>
        }
      />
      <Table rowKey="id" columns={columns} scroll={{ x: "max-content" }} size="middle" {...list.tableProps} />
    </div>
  );
};

export default RepeatingBookingsPage;
