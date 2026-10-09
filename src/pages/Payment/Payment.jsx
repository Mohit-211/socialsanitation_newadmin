import { useEffect, useState } from "react";
import { Input, Table } from "antd";
import { Search } from "lucide-react";
import { useNavigate } from "react-router";
import Box from "@mui/material/Box";
import { GetPayment } from "../../services/Api/Api";
import dayjs from "@/lib/dayjs";

const Payment = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [userBackupData, setUserBackupData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

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
      width: "5%",
    },
    {
      title: "Name",
      dataIndex: ["payment_user", "user_profile", "name"],
      sorter: (a, b) => a.user_profile.name.localeCompare(b.user_profile.name),
      width: "20%",
    },
    {
      title: "Amount",
      dataIndex: "amount",
      width: "15%",
      render: (text) => `$${text}`,
    },
    {
      title: "Status",
      dataIndex: "payment_status",
      width: "20%",
      render: (status) => {
        let textColor;

        switch (status) {
          case "PENDING":
            textColor = "#FFD700"; // Yellow
            break;
          case "ACCEPTED":
            textColor = "#800080"; // Purple
            break;
          case "SUCCESS":
            textColor = "#28a745"; // Green
            break;
          case "ONGOING":
            textColor = "#FFA500"; // Orange
            break;
          case "REJECTED":
          case "CANCELED":
            textColor = "#FF4D4F"; // Red
            break;
          default:
            textColor = "#000"; // Default to black if status is unknown
        }

        return (
          <span
            style={{
              color: textColor,
              padding: "5px 10px",
              borderRadius: "5px",
              fontWeight: "bold",
              backgroundColor: "#fff", // Set background to white
            }}
          >
            {status}
          </span>
        );
      },
    },
    {
      title: "Payment Type",
      dataIndex: "booking_id",
      width: "20%",
      render: (bookingId) => {
        if (bookingId) {
          return (
            <span
              style={{
                color: "#1890ff",
                fontWeight: "bold",
              }}
            >
              Booking Payment
            </span>
          );
        }
        return (
          <span
            style={{
              color: "#722ed1",
              fontWeight: "bold",
            }}
          >
            Service Quote Payment
          </span>
        );
      },
    },

    {
      title: "Transaction Date",
      dataIndex: "created_at",
      width: "20%",
      render: (date) => dayjs(date).format("MM/DD/YYYY HH:mm A"),
    },

  ];

  // Get all users
  const getData = async (params = {}) => {
    try {
      setLoading(true);
      let result = await GetPayment(localStorage.getItem("adminToken"), params);
      // Adding index for serial number
      const newData = result.data.data.map((item, index) => ({
        ...item,
        index: index + 1,
      }));
      setData(newData);
      setUserBackupData(newData);
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

  const onSearch = (searchField) => {
    const LIST = [...userBackupData];
    const searchList = [];

    for (let i in LIST) {
      if (
        LIST[i]?.payment_user?.user_profile?.name
          ?.toLowerCase()
          ?.includes(searchField?.toLowerCase()) ||
        LIST[i]?.payment_user?.user_profile?.email
          ?.toLowerCase()
          ?.includes(searchField?.toLowerCase())
      ) {
        searchList.push(LIST[i]);
      }
    }

    setData(searchList);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys) => {
      setSelectedRowKeys(selectedRowKeys);
    },
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: { xs: "wrap", md: "nowrap" }, rowGap: 1.5, alignItems: "center", marginBottom: "20px" }}
      >
        <div>
          <h3 className="page-title">PAYMENT MANAGEMENT</h3>
          <p className="page-sub-title">View Payment History</p>
        </div>
        <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: { xs: "wrap", md: "nowrap" }, rowGap: 1.5, alignItems: "center" }}>
          <Box>
            <Input
              allowClear
              prefix={<Search size={18} color="#9CA3AF" />}
              placeholder="Search..."
              style={{ width: "100%", height: 44 }}
              onChange={(e) => onSearch(e.target.value)}
            />
          </Box>
        </Box>
      </Box>

      <Table
        rowSelection={rowSelection} // Add row selection
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

export default Payment;
