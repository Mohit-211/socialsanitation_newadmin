/** @format */

import React, { useEffect, useState } from "react";
import { Button, message, Modal, Space, Table } from "antd";
import { useNavigate } from "react-router";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import MuiButton from "@mui/material/Button";
import { Plus } from "lucide-react";
import dayjs from "@/lib/dayjs";
import {
  DeleteContractAgreement,
  GetAllContractAgreements,
  ResumeSigningContract,
} from "../../services/Api/Api";

const ContractAgreement = () => {
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
      title: "Delete Contract",
      content: "Are you sure you want to delete this Contract Agreement?",
      onOk: async () => {
        await DeleteContractAgreement(id);
        message.success("Contract Agreement deleted");
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
      width: "20%",
      render: (_, record) =>
        record.client_name || record.client_company_name || "-",
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
                    navigate(`/edit-contract-agreement/${record.id}`)
                  }
                >
                  Edit
                </Button>

                {/* <Button
                  type="primary"
                  onClick={() => requestSigningUrl(record)}
                >
                  Sign This PDF
                </Button> */}
              </>
            )}

            <Button danger onClick={() => handleDelete(record.id)}>
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
      let result = await GetAllContractAgreements();
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

      const res = await ResumeSigningContract(record.id);
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
      {/* HEADER */}
      <Paper
        variant="outlined"
        sx={{
          p: 2.5,
          mb: 2.5,
          borderRadius: "10px",
          borderColor: "#eef0f2",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
            flexWrap: { xs: "wrap", md: "nowrap" },
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography className="page-title" noWrap>
              CONTRACT AGREEMENT MANAGEMENT
            </Typography>
            <Typography
              className="page-sub-title"
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              View &amp; manage contract agreements
            </Typography>
          </Box>

          <MuiButton
            variant="contained"
            disableElevation
            startIcon={<Plus size={18} />}
            onClick={() => navigate("/create-contract-agreement")}
            sx={{
              height: 44,
              px: 2.5,
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 600,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            Generate Contract
          </MuiButton>
        </Box>
      </Paper>

      <Table
        // rowSelection={rowSelection}
        columns={columns}
        rowKey={(record) => record.id}
        dataSource={data}
        pagination={tableParams.pagination}
        loading={loading}
        onChange={handleTableChange}
        bordered
        size="middle"
      />
    </Box>
  );
};

export default ContractAgreement;