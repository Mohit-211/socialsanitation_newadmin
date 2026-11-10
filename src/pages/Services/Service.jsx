import { useEffect, useState } from "react";
import { Table, message, Input, Modal, Button, Space } from "antd";
import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { GetServices, DeleteService } from "../../services/Api/ServiceApi";
import { useNavigate } from "react-router";
import PageHeader from "../../components/PageHeader";
import IconAction from "../../components/IconAction";
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
        <Space size={4} wrap>
          <IconAction
            icon={Eye}
            title="View Service"
            onClick={(event) => navigateToViewService(event, record.id)}
          />

          <IconAction
            icon={Pencil}
            title="Edit Service"
            onClick={(event) => navigateToEditService(event, record.id)}
          />

          <IconAction
            icon={Trash2}
            title="Delete Service"
            danger
            onClick={() => handleDelete(record.id)}
          />
        </Space>
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
      console.error(e);
      if (e.response && e.response.status === 401) {
        navigate("/error401");
      } else {
        console.error("Error loading data. Please try again later.");
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
    <div className="service-page">
      <PageHeader
        title="SERVICE MANAGEMENT"
        subtitle="View, delete, edit and add Service"
        actions={
          <>
            <Input
              allowClear
              size="large"
              prefix={<Search size={16} color="var(--color-text-subtle)" />}
              placeholder="Search..."
              className="service-page__search"
              value={searchTerm}
              onChange={(e) => onSearch(e.target.value)}
            />
            <Button
              type="primary"
              size="large"
              icon={<Plus size={16} />}
              onClick={navigateToAddService}
            >
              Add Service
            </Button>
          </>
        }
      />

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
    </div>
  );
};

export default Service;