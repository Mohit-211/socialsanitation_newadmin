import { Badge, Button, Dropdown, Input, Segmented, Select, Space, Table, Tag, Tooltip, type TableColumnsType } from "antd";
import { useNavigate } from "react-router";
import { CalendarDays, ChevronDown, Eye, Pencil, Plus, Repeat, Search } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import IconAction from "@/components/IconAction";
import StatusTag from "@/components/StatusTag";
import { listBookings } from "@/services/api/bookingApi";
import { pageOf } from "@/services/apiResult";
import { useApiQuery } from "@/hooks/useApiQuery";
import { usePagedList } from "@/hooks/usePagedList";
import { formatDate, formatTime } from "@/utils/datetime";
import "./bookings.scss";
import type { CrewMember, Option, Place, VisitRow } from "@/types";

const STATUS_TABS = [
  { value: "UPCOMING", label: "Upcoming" },
  { value: "ONGOING", label: "In progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "", label: "All" },
];

// The periods a status can be narrowed to.
const PERIODS: Record<string, Option[] | undefined> = {
  UPCOMING: [
    { value: "today", label: "Today" },
    { value: "current_week", label: "This week" },
    { value: "current_month", label: "This month" },
    { value: "all", label: "All upcoming" },
  ],
  COMPLETED: [
    { value: "today", label: "Today" },
    { value: "past_30_days", label: "Past 30 days" },
    { value: "past_90_days", label: "Past 90 days" },
    { value: "all", label: "All completed" },
  ],
};

const OPEN_STATUSES = new Set(["PENDING", "ACCEPTED", "ONGOING"]);

// Every visit, by status and period, searchable by title, client, guest or
// booking number. Cancellation requests from clients get their own filter.
const BookingsPage = () => {
  const navigate = useNavigate();
  const list = usePagedList((query) => listBookings(query), {
    filters: { booking_status: "UPCOMING", period: "all" },
    errorText: "Couldn't load the bookings",
  });
  const showingRequests = list.filters.cancel_requested === true;

  // How many visits a client asked to cancel, not yet answered.
  const { data: openRequests } = useApiQuery(
    () => listBookings({ cancel_requested: true, limit: 1 }).then((res) => pageOf(res).pagination?.total ?? 0),
    [],
    { initial: 0, silent: true },
  );

  const setStatus = (status: string | null) => {
    list.setFilter("cancel_requested", undefined);
    list.setFilter("booking_status", status || undefined);
    list.setFilter("period", PERIODS[status ?? ""] ? "all" : undefined);
  };

  const columns: TableColumnsType<VisitRow> = [
    {
      title: "Visit",
      dataIndex: "number",
      render: (number: string | null, visit) => (
        <Button type="link" className="table-link" onClick={() => navigate(`/viewBooking/${visit.id}`)}>
          {number || visit.id}
        </Button>
      ),
    },
    {
      title: "Client",
      key: "who",
      render: (_value, visit) =>
        visit.client ? (
          <Button type="link" className="table-link" onClick={() => navigate(`/viewUser/${visit.client?.id}?tab=bookings`)}>
            {visit.client.name}
          </Button>
        ) : (
          <span>
            {visit.guest?.name} <Tag>Guest</Tag>
          </span>
        ),
    },
    { title: "Date", dataIndex: "date", render: (date: string) => formatDate(date) },
    {
      title: "Time",
      key: "time",
      render: (_value, visit) => `${formatTime(visit.start_time)}${visit.end_time ? ` – ${formatTime(visit.end_time)}` : ""}`,
    },
    {
      title: "Services",
      dataIndex: "services",
      render: (services: Place[]) => (services || []).map((service) => service.name).join(", ") || "—",
    },
    {
      title: "Crew",
      dataIndex: "employees",
      render: (employees: CrewMember[]) => (employees || []).map((employee) => employee.name).join(", ") || "—",
    },
    { title: "Address", dataIndex: "address", render: (address: string | null) => address || "—" },
    {
      title: "Status",
      key: "status",
      render: (_value, visit) => (
        <Space size={4} wrap>
          <StatusTag code={visit.status} />
          {visit.series_id && (
            <Tooltip title="Part of a repeating booking">
              <Repeat size={14} className="text-subtle" />
            </Tooltip>
          )}
          {visit.cancel_request?.open && <Tag color="red">Cancel requested</Tag>}
        </Space>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      render: (_value, visit) => (
        <Space size={4}>
          <IconAction icon={Eye} title="Open" onClick={() => navigate(`/viewBooking/${visit.id}`)} />
          {OPEN_STATUSES.has(visit.status) && (
            <IconAction icon={Pencil} title="Edit" onClick={() => navigate(`/editBooking/${visit.id}`)} />
          )}
        </Space>
      ),
    },
  ];

  const status = String(list.filters.booking_status ?? "");
  const periods = PERIODS[status];

  return (
    <div>
      <PageHeader
        title="BOOKINGS"
        subtitle="Visits for clients and guests; only the office books"
        actions={
          <>
            <Input
              allowClear
              size="large"
              prefix={<Search size={16} className="text-subtle" />}
              placeholder="Title, client, guest or number"
              style={{ width: 250 }}
              value={list.searchText}
              onChange={(event) => list.setSearchText(event.target.value)}
            />
            <Button size="large" icon={<CalendarDays size={16} />} onClick={() => navigate("/monthlyCalendar")}>
              Calendar
            </Button>
            <Button size="large" icon={<Repeat size={16} />} onClick={() => navigate("/repeating-bookings")}>
              Repeating
            </Button>
            <Dropdown
              trigger={["click"]}
              menu={{
                items: [
                  { key: "/create-client-booking", label: "For a client" },
                  { key: "/create-non-client-booking", label: "For someone who isn't a client" },
                ],
                onClick: ({ key }) => navigate(key),
              }}
            >
              <Button type="primary" size="large" icon={<Plus size={16} />}>
                New Booking <ChevronDown size={14} />
              </Button>
            </Dropdown>
          </>
        }
      />

      <div className="bookings-filters">
        {/* No tab is picked while the cancellation requests show. */}
        <Segmented<string | null>
          options={STATUS_TABS}
          value={showingRequests ? null : status}
          onChange={setStatus}
        />
        {periods && !showingRequests && (
          <Select
            style={{ width: 170 }}
            options={periods}
            value={list.filters.period}
            onChange={(value) => list.setFilter("period", value)}
          />
        )}
        <Badge count={openRequests} size="small">
          <Button
            type={showingRequests ? "primary" : "default"}
            onClick={() => {
              if (showingRequests) setStatus("UPCOMING");
              else {
                list.setFilter("booking_status", undefined);
                list.setFilter("period", undefined);
                list.setFilter("cancel_requested", true);
              }
            }}
          >
            Cancellation Requests
          </Button>
        </Badge>
      </div>

      <Table rowKey="id" columns={columns} scroll={{ x: "max-content" }} size="middle" {...list.tableProps} />
    </div>
  );
};

export default BookingsPage;
