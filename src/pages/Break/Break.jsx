/** @format */

import React, { useEffect, useState } from "react";
import { GetAllBreaks } from "../../services/Api/leaveRequestApi";
import { Table, DatePicker, Tag, Input } from "antd";
import "./Break.scss";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Search } from "lucide-react";
import dayjs from "@/lib/dayjs";

dayjs.extend(utc);
dayjs.extend(timezone);

const Break = () => {
  const [breakData, setBreakData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [searchTerm, setSearchTerm] = useState("");

  const getData = async () => {
    try {
      setLoading(true);
      const formData = {
        date: selectedDate.format("YYYY-MM-DD"),
      };
      const result = await GetAllBreaks(formData);
      const dataWithIndex = result.data.data.map((item, index) => ({
        ...item,
        autoIncrementId: index + 1,
      }));
      setBreakData(dataWithIndex);
    } catch (e) {
      console.error("Failed to fetch breaks:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

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
      dataIndex: "role_id",
      key: "role",
      width: 140,
      render: (role_id) => {
        const roleMap = {
          7: "Inspector / Supervisor",
          8: "QA Technician",
          9: "Cleaner",
        };
        return roleMap[role_id] || "Unknown";
      },
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
                <Tag color="orange">Ongoing</Tag>
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
                  ? "green"
                  : val === "completed"
                  ? "blue"
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
    <Box className="break-page">
      <Paper
        variant="outlined"
        sx={{ p: 2.5, mb: 2.5, borderRadius: "10px", borderColor: "#eef0f2" }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          <Box>
            <Typography className="page-title">BREAK MONITORING</Typography>
            <Typography className="page-sub-title">
              View Employee Breaks
            </Typography>
          </Box>

          <Stack
            direction="row"
            spacing={1.5}
            useFlexGap
            sx={{ alignItems: "center", flexWrap: "wrap" }}
          >
            <DatePicker
              format="MM/DD/YYYY"
              value={selectedDate}
              onChange={(date) => date && setSelectedDate(date)}
              allowClear={false}
              style={{ width: 180 }}
            />
          </Stack>
        </Stack>

        <Box sx={{ mt: 2.5 }}>
          <Input
            allowClear
            prefix={<Search size={18} color="#9CA3AF" />}
            placeholder="Search by employee name..."
            style={{ width: "100%", maxWidth: 420, height: 44 }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Box>
      </Paper>

      <div style={{ overflowX: "auto" }}>
        <Table
          columns={columns}
          dataSource={breakData.filter((item) =>
            item.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
          )}
          expandedRowRender={expandedRowRender}
          rowKey="user_id"
          loading={loading}
          pagination={{ pageSize: 50 }}
          bordered
          size="middle"
          scroll={{ x: "max-content" }}
        />
      </div>
    </Box>
  );
};

export default Break;