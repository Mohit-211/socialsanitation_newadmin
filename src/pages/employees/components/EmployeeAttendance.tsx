import { useState } from "react";
import { DatePicker, Image, Select, Space, Table, type TableColumnsType } from "antd";
import type { Dayjs } from "dayjs";
import StatusTag from "@/components/StatusTag";
import { useApiQuery } from "@/hooks/useApiQuery";
import { listEmployeeAttendance } from "@/services/api/employeeApi";
import { itemsOf } from "@/services/apiResult";
import { DATE_FORMAT, formatDate, formatTime, toApiDate } from "@/utils/datetime";
import { imageUrl } from "@/utils/files";
import type { EmployeeAttendanceDay, Id } from "@/types";

const PERIODS = [
  { value: "TODAY", label: "Today" },
  { value: "YESTERDAY", label: "Yesterday" },
  { value: "THIS_WEEK", label: "This Week" },
  { value: "THIS_MONTH", label: "This Month" },
  { value: "PREVIOUS_MONTH", label: "Previous Month" },
  { value: "CUSTOM", label: "Dates I Pick" },
];

const photo = (uri: string | null) =>
  uri ? <Image src={imageUrl(uri)} width={48} height={48} className="employee-attendance__photo" /> : "—";

// An employee's days: present (with clock-in and -out times and photos),
// absent, or on leave, for a period (Eastern days).
const EmployeeAttendance = ({ employeeId }: { employeeId: Id }) => {
  const [period, setPeriod] = useState("THIS_WEEK");
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const custom = period === "CUSTOM";
  const query = {
    filterType: period,
    ...(custom && range ? { start_date: toApiDate(range[0]), end_date: toApiDate(range[1]) } : {}),
  };

  const { data: days, loading } = useApiQuery(
    () => listEmployeeAttendance(employeeId, query).then(itemsOf),
    [employeeId, query],
    { initial: [], skip: custom && !range, errorText: "Couldn't load the attendance" },
  );

  const columns: TableColumnsType<EmployeeAttendanceDay> = [
    { title: "Date", dataIndex: "date", render: (date: string) => formatDate(date) },
    { title: "Status", dataIndex: "status", render: (status: string) => <StatusTag code={status} /> },
    { title: "Clock In", dataIndex: "clock_in_est", render: (time: string | null) => formatTime(time) },
    { title: "Clock Out", dataIndex: "clock_out_est", render: (time: string | null) => formatTime(time) },
    { title: "Clock-In Photo", dataIndex: "clock_in_image_uri", render: photo },
    { title: "Clock-Out Photo", dataIndex: "clock_out_image_uri", render: photo },
    { title: "Hours", dataIndex: "total_hours", render: (hours: string | number | null) => (hours ? Number(hours).toFixed(2) : "—") },
    { title: "Leave Reason", dataIndex: "leave_reason", render: (reason: string | null) => reason || "—" },
  ];

  return (
    <>
      <Space wrap className="employee-attendance__filters">
        <Select value={period} onChange={setPeriod} options={PERIODS} style={{ width: 180 }} />
        {custom && <DatePicker.RangePicker format={DATE_FORMAT} value={range} onChange={setRange} />}
      </Space>
      <Table
        rowKey="date"
        size="middle"
        loading={loading}
        columns={columns}
        dataSource={days || []}
        pagination={(days || []).length > 31 ? { pageSize: 31 } : false}
        scroll={{ x: "max-content" }}
        locale={{ emptyText: custom && !range ? "Pick the dates." : "No days in this period." }}
      />
    </>
  );
};

export default EmployeeAttendance;
