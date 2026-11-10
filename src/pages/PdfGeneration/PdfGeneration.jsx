import { useEffect, useState } from "react";
import { Button, message, Modal, Space, Table } from "antd";
import { useNavigate } from "react-router";

import dayjs from "@/lib/dayjs";
import PageHeader from "../../components/PageHeader";
import { DeleteServiceEstimate, GetAllServiceEstimate } from "../../services/Api/Api";
import { BASE_URL } from "../../services/Host";

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
          url = `${BASE_URL}docs/${record.signed_file_name}`;
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
      let result = await GetAllServiceEstimate();
      // Adding index for serial number
      const newData = result.data.data.map((item, index) => ({
        ...item,
        index: index + 1,
      }));
      setData(newData);
    } catch (e) {
      console.error(e);
      if (e.response && e.response.status === 403) {
        navigate("/error401");
        console.error("Access denied. You do not have the required permissions.");
      } else {
        console.error("Error loading data. Please try again later.");
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

  return (
    <div>
      <PageHeader
        title="Service Estimate Management"
        subtitle="View & Generate PDFs"
        actions={
          <>
            <Button
              size="large"
              onClick={() => navigate("/universal-scope-of-work")}
            >
              Universal Scope Of Work
            </Button>

            <Button
              type="primary"
              size="large"
              onClick={() => navigate("/generate-estimate")}
            >
              Generate PDF
            </Button>
          </>
        }
      />

      <Table
        columns={columns}
        rowKey={(record) => record.id}
        dataSource={data}
        pagination={tableParams.pagination}
        loading={loading}
        onChange={handleTableChange}
      />
    </div>
  );
};

export default PdfGeneration;
