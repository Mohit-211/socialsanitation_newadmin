/** @format */

import React, { useEffect, useState } from "react";
import { Table, Space, message, Select, Tag, Input } from "antd";
import { Box, Paper, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router";
import {
  GetAllLeaveRequest,
  UpdateLeaveStatus,
} from "../../services/Api/leaveRequestApi";
import dayjs from "@/lib/dayjs";
import { Search } from "lucide-react";

const LeaveRequest = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [tableParams, setTableParams] = useState({
    pagination: {
      current: 1,
      pageSize: 100,
    },
    sortField: null,
    sortOrder: null,
  });

  const columns = [
    {
      title: "S.No.",
      dataIndex: "index",
      width: "5%",
      sorter: (a, b) => a.index - b.index,
    },
    {
      title: "User's Name",
      dataIndex: ["attendence_user", "user_profile", "name"],
      sorter: (a, b) =>
        a.attendence_user?.user_profile?.name?.localeCompare(
          b.attendence_user?.user_profile?.name
        ),
      width: "15%",
      render: (_, record) =>
        record.attendence_user?.user_profile?.name || "---",
    },
    {
      title: "Start Date",
      dataIndex: "start_date",
      width: "15%",
      render: (_, record) => dayjs(record.leave_date).format("MM/DD/YYYY"),
    },
    {
      title: "End Date",
      dataIndex: "end_date",
      width: "15%",
      render: (_, record) => dayjs(record.leave_date).format("MM/DD/YYYY"),
    },
    {
      title: "Number of Days",
      dataIndex: "num_days",
      width: "10%",
      render: (_, record) => 1,
    },
    {
      title: "Reason",
      dataIndex: "leave_reason",
      width: "20%",
    },
    {
      title: "Action",
      dataIndex: "action",
      render: (_, record) => (
        <Space size="middle">
          {record.leave_status === "PENDING" ? (
            <Select
              defaultValue={record.leave_status}
              style={{ width: 150 }}
              onChange={(value) => handleStatusChange(record.id, value)}
            >
              <Select.Option value="PENDING" disabled>
                🟠 PENDING
              </Select.Option>
              <Select.Option value="ACCEPTED">🟢 APPROVED</Select.Option>
              <Select.Option value="REJECTED">🔴 DECLINED</Select.Option>
            </Select>
          ) : (
            <Tag
              color={
                record.leave_status === "APPROVED"
                  ? "green"
                  : record.leave_status === "DECLINED"
                  ? "red"
                  : "orange"
              }
            ></Tag>
          )}
        </Space>
      ),
    },
  ];

  const getData = async () => {
    try {
      setLoading(true);
      let result = await GetAllLeaveRequest(localStorage.getItem("adminToken"));
      const newData = result.data.data.map((item, index) => ({
        ...item,
        index: index + 1,
      }));
      setData(newData);
    } catch (e) {
      if (e.response && e.response.status === 403) {
        navigate("/error401");
      } else {
        console.log("Error loading data.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const handleTableChange = (pagination, filters, sorter) => {
    setTableParams({
      pagination,
      filters,
      sortField: sorter.field,
      sortOrder: sorter.order,
    });
  };

  // Handle Leave Status Update
  const handleStatusChange = async (leaveId, value) => {
    try {
      const response = await UpdateLeaveStatus(leaveId, {
        status: value,
      });
      if (response.status === 201) {
        message.success(`Leave ${value.toLowerCase()} successfully!`);
        await getData(); // Refresh table
      }
    } catch (error) {
      message.error("Failed to update leave status.");
    }
  };

  const filteredData = data.filter((item) =>
    item.attendence_user?.user_profile?.name
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <Box>
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
            <Typography className="page-title">LEAVE REQUESTS</Typography>
            <Typography className="page-sub-title">
              View and manage employee leave requests
            </Typography>
          </Box>

          <Box sx={{ width: 320 }}>
            <Input
              allowClear
              prefix={<Search size={18} color="#9CA3AF" />}
              placeholder="Search by employee name..."
              style={{
                width: "100%",
                height: 44,
              }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Box>
        </Stack>
      </Paper>

      <Table
        columns={columns}
        rowKey={(record) => record.id}
        dataSource={filteredData}
        pagination={tableParams.pagination}
        loading={loading}
        onChange={handleTableChange}
      />
    </Box>
  );
};

export default LeaveRequest;