/** @format */

import React, { useEffect, useState } from "react";
import { Table, Space, message, Input, Modal } from "antd";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { GetServices, DeleteService } from "../../services/Api/ServiceApi";
import { useNavigate } from "react-router";
import "./Service.scss";

const Service = () => {
  const navigate = useNavigate();
  const [serviceData, setServiceData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
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

  const actionIconBtn = (color) => ({
    width: 34,
    height: 34,
    border: "1px solid",
    borderColor: color,
    color,
    "&:hover": {
      backgroundColor: `${color}14`,
      borderColor: color,
    },
  });

  const columns = [
    {
      title: "S.No.",
      dataIndex: "index",
      width: 60,
      sorter: (a, b) => a.index - b.index,
    },
    {
      title: "Name",
      dataIndex: "name",
      width: 170,
    },
    {
      title: "Abbreviation",
      dataIndex: "abbreviation",
      width: 120,
    },
    {
      title: "Price",
      dataIndex: "price",
      width: 140,
      render: (value) => `Starting Price: $${value}`,
    },
    {
      title: "Description",
      dataIndex: "description",
      width: 220,
      render: (text) => {
        const words = text?.split(" ");
        const truncatedText =
          words?.length > 10 ? words.slice(0, 10).join(" ") + "..." : text;

        return <div dangerouslySetInnerHTML={{ __html: truncatedText }} />;
      },
    },
    {
      title: "Action",
      dataIndex: "action",
      width: 150,
      render: (_, record) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="View Service">
            <IconButton
              size="small"
              sx={actionIconBtn("#F59E0B")}
              onClick={(event) => navigateToViewService(event, record.id)}
            >
              <Eye size={16} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Edit Service">
            <IconButton
              size="small"
              sx={actionIconBtn("#6366F1")}
              onClick={(event) => navigateToEditService(event, record.id)}
            >
              <Pencil size={16} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Delete Service">
            <IconButton
              size="small"
              sx={actionIconBtn("#EF4444")}
              onClick={() => handleDelete(record.id)}
            >
              <Trash2 size={16} />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  const getData = async (params = {}) => {
    try {
      setLoading(true);
      let result = await GetServices(
        localStorage.getItem("adminToken"),
        params,
      );
      const newData = result.data.data.map((item, index) => ({
        ...item,
        index: index + 1,
      }));
      setServiceData(newData);
      setFilteredData(newData); // Initialize filtered data
    } catch (e) {
      console.log(e);
      if (e.response && e.response.status === 401) {
        navigate("/error401");
      } else {
        console.log("Error loading data. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (pagination, filters, sorter) => {
    setTableParams({
      pagination,
      filters,
      sortField: sorter.field,
      sortOrder: sorter.order,
    });
  };

  useEffect(() => {
    getData({
      page: tableParams.pagination.current,
      pageSize: tableParams.pagination.pageSize,
      sortField: tableParams.sortField,
      sortOrder: tableParams.sortOrder,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableParams]);

  const handleDelete = (id) => {
    Modal.confirm({
      title: "Confirm",
      content: "Are you sure you want to delete this service?",
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "No",
      onOk: async () => {
        try {
          const res = await DeleteService(id);
          message.success(res?.data?.message || "Service deleted successfully");
          getData();
        } catch (error) {
          console.error(error);
          message.error("Failed to delete service");
        }
      },
    });
  };

  const navigateToAddService = () => {
    navigate("/addService");
  };

  const navigateToViewService = (event, id) => {
    navigate(`/viewService/${id}`);
  };

  const navigateToEditService = (event, id) => {
    navigate(`/editService/${id}`);
  };

  const onSearch = (searchField) => {
    setSearchTerm(searchField);
    const filteredList = serviceData.filter(
      (item) =>
        item.name.toLowerCase().includes(searchField.toLowerCase()) ||
        item.abbreviation.toLowerCase().includes(searchField.toLowerCase()),
    );
    setFilteredData(filteredList); // Set the filtered data to state
  };

  return (
    <Box className="service-page">
      <Paper
        variant="outlined"
        sx={{
          p: 2.5,
          mb: 2.5,
          borderRadius: "10px",
          borderColor: "#eef0f2",
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: { xs: "wrap", md: "nowrap" },
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography className="page-title" noWrap>
              SERVICE MANAGEMENT
            </Typography>
            <Typography
              className="page-sub-title"
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              View, delete, edit and add Service
            </Typography>
          </Box>

          <Stack
            direction="row"
            spacing={1.5}
            sx={{ alignItems: "center", flexShrink: 0 }}
          >
            <Input
              allowClear
              prefix={<Search size={18} color="#9CA3AF" />}
              placeholder="Search..."
              style={{ width: 240, height: 44 }}
              value={searchTerm}
              onChange={(e) => onSearch(e.target.value)}
            />
            <Button
              variant="contained"
              startIcon={<Plus size={18} />}
              sx={{
                borderRadius: "8px",
                height: 44,
                whiteSpace: "nowrap",
                textTransform: "none",
                fontWeight: 600,
              }}
              onClick={navigateToAddService}
            >
              Add Service
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Table
        className="service-table"
        columns={columns}
        rowKey={(record) => record.id}
        dataSource={filteredData}
        pagination={tableParams.pagination}
        loading={loading}
        onChange={handleTableChange}
        bordered
        size="middle"
        scroll={{ x: 860 }}
      />
    </Box>
  );
};

export default Service;