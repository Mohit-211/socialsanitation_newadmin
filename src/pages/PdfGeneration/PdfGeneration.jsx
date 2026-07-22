/** @format */

import React, { useEffect, useState } from "react";
import { Button, message, Modal, Space, Table } from "antd";
import { useNavigate } from "react-router";
import Box from "@mui/material/Box";

import dayjs from "@/lib/dayjs";
import {
  DeleteServiceEstimate,
  GetAllServiceEstimate,
  ResumeSigning,
} from "../../services/Api/Api";

const PdfGeneration = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [tableParams, setTableParams] = useState({
    pagination: {
      current: 1,
      pageSize: 100,
    },
    sortField: null,
    sortOrder: null,
  });

  const handleDelete = (id) => {
    Modal.confirm({
      title: "Delete Service Estimate",
      content: "Are you sure you want to delete this service estimate?",
      onOk: async () => {
        await DeleteServiceEstimate(id);
        message.success("Service Estimate deleted");
        getData();
      },
    });
  };

  const columns = [
    {
      title: "S.No.",
      dataIndex: "index",
      sorter: (a, b) => a.index - b.index,
      width: "10%",
    },
    {
      title: "Client Name",
      dataIndex: "client_company_name",
      width: "20%",
    },

    {
      title: "File",
      width: "20%",
      render: (_, record) => {
        let url = "";

        if (record.status === "signed" && record.signed_file_name) {
          url = `https://node.socialsanitation.com/api/v1/docs/${record.signed_file_name}`;
        } else if (record.file_url) {
          url = record.file_url;
        }

        if (!url) return "-";

        return (
          <a href={url} target="_blank" rel="noopener noreferrer">
            View PDF
          </a>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      width: "20%",
      render: (status) => {
        if (status === "signed") return "Signed";
        if (status === "pending_signature") return "Pending Signature";
        return status;
      },
    },

    {
      title: "Created Date",
      dataIndex: "created_at",
      width: "20%",
      render: (date) => dayjs(date).format("MM/DD/YYYY HH:mm A"),
    },
    {
      title: "Action",
      width: "20%",
      render: (_, record) => {
        return (
          <Space size="middle">
            {record.status !== "signed" && (
              <>
                <Button
                  onClick={() =>
                    navigate(`/edit-service-estimate/${record.id}`)
                  }
                >
                  Edit
                </Button>
              </>
            )}

            <Button danger outlined onClick={() => handleDelete(record.id)}>
              Delete
            </Button>
          </Space>
        );
      },
    },
  ];

  // Get all users
  const getData = async () => {
    try {
      setLoading(true);
      let result = await GetAllServiceEstimate();
      // Adding index for serial number
      const newData = result.data.data.map((item, index) => ({
        ...item,
        index: index + 1,
      }));
      setData(newData);
    } catch (e) {
      console.log(e);
      if (e.response && e.response.status === 403) {
        navigate("/error401");
        console.log("Access denied. You do not have the required permissions.");
      } else {
        console.log("Error loading data. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData({
      page: tableParams.pagination.current,
      pageSize: tableParams.pagination.pageSize,
      sortField: tableParams.sortField,
      sortOrder: tableParams.sortOrder,
    });
  }, [tableParams]);

  const handleTableChange = (pagination, filters, sorter) => {
    setTableParams({
      pagination,
      filters,
      sortField: sorter.field,
      sortOrder: sorter.order,
    });
  };

  const requestSigningUrl = async (record) => {
    try {
      setLoading(true);

      const res = await ResumeSigning(record.id);
      console.log(res, "res");

      const signingUrl = res?.data?.data?.data?.signingUrl;

      if (signingUrl) {
        window.open(signingUrl, "_blank");
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        marginBottom="20px"
      >
        <div>
          <h3 className="page-title">Service Estimate Management</h3>
          <p className="page-sub-title">View & Generate PDFs</p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <Button
            onClick={() => navigate("/universal-scope-of-work")}
            style={{
              borderRadius: "6px",
            }}
          >
            Universal Scope Of Work
          </Button>

          <Button type="primary" onClick={() => navigate("/generate-estimate")}>
            Generate PDF
          </Button>
        </div>
      </Box>

      <Table
        // rowSelection={rowSelection}
        columns={columns}
        rowKey={(record) => record.id}
        dataSource={data}
        pagination={tableParams.pagination}
        loading={loading}
        onChange={handleTableChange}
      />
    </Box>
  );
};

export default PdfGeneration;
