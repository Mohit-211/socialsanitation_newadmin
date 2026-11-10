import { useState } from "react";
import { listBreaks } from "@/services/api/attendanceApi";
import { itemsOf } from "@/services/apiResult";
import { useApiQuery } from "@/hooks/useApiQuery";
import { Table, DatePicker, Tag, Input } from "antd";
import "./BreaksPage.scss";
import { Search } from "lucide-react";
import dayjs from "@/lib/dayjs";
import PageHeader from "@/components/PageHeader";

const BreaksPage = () => {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [searchTerm, setSearchTerm] = useState("");
  const day = selectedDate.format("YYYY-MM-DD");

  // A row per employee for the day, numbered.
  const { data: breakData, loading } = useApiQuery(
    () =>
      listBreaks(day)
        .then(itemsOf)
        .then((rows) => rows.map((item, index) => ({ ...item, autoIncrementId: index + 1 }))),
    [day],
    { initial: [], errorText: "Couldn't load the breaks" },
  );

  const columns = [
    {
      title: "S.No.",
      dataIndex: "autoIncrementId",
      key: "sno",
      width: 70,
      sorter: (a, b) => a.autoIncrementId - b.autoIncrementId,
    },
    {
      title: "Employee Name",
      dataIndex: "user_name",
      key: "name",
      width: 160,
      sorter: (a, b) => a.user_name.localeCompare(b.user_name),
    },
    {
      title: "Role",
      dataIndex: "job_title",
      key: "role",
      width: 160,
      render: (title, record) => title || (record.roles || []).map((role) => role.name).join(", ") || "—",
    },
    {
      title: "Date",
      key: "date",
      width: 110,
      render: (_, record) => {
        const breakDate = record.breaks?.[0]?.break_start_est
          ? dayjs
              .utc(record.breaks[0].break_start_est)
              .local()
              .format("MM-DD-YYYY")
          : dayjs(selectedDate).format("MM-DD-YYYY");
        return breakDate;
      },
    },
    {
      title: "No. of Breaks",
      dataIndex: "break_count",
      key: "break_count",
      width: 110,
      align: "center",
    },
    {
      title: "Clock In",
      key: "clock_in",
      width: 110,
      render: (_, record) =>
        record.breaks?.[0]?.attendance?.clock_in
          ? dayjs.utc(record.breaks[0].attendance.clock_in).format("hh:mm A")
          : "---",
    },
    {
      title: "Clock Out",
      key: "clock_out",
      width: 110,
      render: (_, record) =>
        record.breaks?.[0]?.attendance?.clock_out
          ? dayjs.utc(record.breaks[0].attendance.clock_out).format("hh:mm A")
          : "---",
    },
  ];

  const expandedRowRender = (record) => {
    if (!record.breaks || record.breaks.length === 0) return <p>No breaks</p>;

    return (
      <Table
        columns={[
          {
            title: "Break Start",
            dataIndex: "break_start_est",
            key: "start",
            render: (break_start_est) =>
              break_start_est
                ? dayjs.utc(break_start_est).format("hh:mm A")
                : "---",
          },
          {
            title: "Break End",
            dataIndex: "break_end_est",
            key: "end",
            render: (break_end_est) =>
              break_end_est ? (
                dayjs.utc(break_end_est).format("hh:mm A")
              ) : (
                <Tag color="warning">Ongoing</Tag>
              ),
          },
          {
            title: "Duration (min)",
            dataIndex: "duration_minutes",
            key: "duration",
            render: (val) => val || "--",
          },
          {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (val) => {
              const color =
                val === "active"
                  ? "success"
                  : val === "completed"
                  ? "processing"
                  : "default";
              return <Tag color={color}>{val.toUpperCase()}</Tag>;
            },
          },
        ]}
        dataSource={record.breaks.map((b, i) => ({ key: i, ...b }))}
        pagination={false}
        size="small"
        scroll={{ x: "max-content" }}
      />
    );
  };

  return (
    <div>
      <PageHeader
        className="break-header"
        title="BREAK MONITORING"
        subtitle="View Employee Breaks"
        actions={
          <div className="break__controls">
            {/* Top Row */}
            <div className="break__date-row">
              <DatePicker
                format="MM/DD/YYYY"
                value={selectedDate}
                onChange={(date) => date && setSelectedDate(date)}
                allowClear={false}
                style={{ width: 180 }}
              />
            </div>

            {/* Search */}
            <Input
              allowClear
              size="large"
              prefix={<Search size={16} color="var(--color-text-subtle)" />}
              placeholder="Search by employee name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        }
      />

      <div className="break__table">
        <Table
          columns={columns}
          dataSource={breakData.filter((item) =>
            item.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
          )}
          expandable={{ expandedRowRender }}
          rowKey="user_id"
          loading={loading}
          pagination={{ pageSize: 50 }}
          bordered
          size="middle"
          scroll={{ x: "max-content" }}
        />
      </div>
    </div>
  );
};

export default BreaksPage;
