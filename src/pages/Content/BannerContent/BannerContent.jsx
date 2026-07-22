import React, { useEffect, useState } from "react";
import { Table, Space, message } from "antd";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router";
import Box from "@mui/material/Box";
import Alert from "../../Customer/Alert";
import { DeleteBanner, GetBanner } from "../../../services/Api/ContentApi";
import { BASE_URL_IMAGE } from "../../../services/Host";

const BannerContent = () => {
  const navigate = useNavigate();
  const [serviceData, setServiceData] = useState([]);
  const [loading, setLoading] = useState(false);
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
      sorter: (a, b) => a.index - b.index,
    },
    {
      title: "Image",
      dataIndex: "file_name",
      render: (text, record) => (
        <img src={`${BASE_URL_IMAGE}${record.file_name}`} alt="Banner" style={{ width: "100px" }} crossOrigin="anonymous" />
      ),
      width: "30%",
    },
    {
      title: "Action",
      dataIndex: "action",
      render: (_, record) => (
        <Space size="middle">
          <Button
            icon="pi pi-pencil"
            rounded
            outlined
            style={{ borderRadius: "25px" }}
            onClick={() => navigateToEditBanner(record.id)}
          />
          <Alert title="Banner" handleDelete={() => handleDelete(record.id)} />
        </Space>
      ),
    },
  ];

  const getData = async (params = {}) => {
    try {
      setLoading(true);
      const result = await GetBanner(localStorage.getItem("adminToken"), params);
      const newData = result.data.data.banners.map((item, index) => ({
        ...item,
        index: index + 1,
      }));
      setServiceData(newData);
    } catch (e) {
      console.log(e);
      if (e.response && e.response.status === 401) {
        navigate("/error401");
        console.log("You do not have access to this page as a sub-admin.");
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
  }, [tableParams]);

  const handleDelete = async (id) => {
    try {
      const res = await DeleteBanner(id);
      message.success(res?.data?.message);
      getData();
    } catch (error) {
      console.log(error, "error");
    }
  };

  const navigateToAddBanner = () => {
    navigate("/addBanner");
  };

  const navigateToEditBanner = (id) => {
    navigate(`/editBanner/${id}`);
  };

  return (
    <Box>
      <Box
        display="flex"
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        marginBottom="20px"
      >
        <div>
          <h3 className="page-title">BANNER</h3>
          <p className="page-sub-title">Add image that you want to show on home page of app</p>
        </div>
        <Box>
          <Button
            label="Add Banner"
            icon="pi pi-plus"
            severity="info"
            style={{
              margin: "0px 10px",
              borderRadius: "5px",
              height: "47px",
            }}
            onClick={navigateToAddBanner}
          />
        </Box>
      </Box>
      <Table
        columns={columns}
        rowKey={(record) => record.id}
        dataSource={serviceData}
        pagination={tableParams.pagination}
        loading={loading}
        onChange={handleTableChange}
      />
    </Box>
  );
};

export default BannerContent;
