/** @format */

import React, { useEffect, useState } from "react";
import { Card, message, Space, Table, Tooltip } from "antd";
import { useNavigate } from "react-router";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import {
  GetPayment,
  GetServicePrices,
  UpdateServicePrices,
} from "../../services/Api/Api";
import dayjs from "@/lib/dayjs";

const Payment = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [userBackupData, setUserBackupData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [prices, setPrices] = useState([]);
  const [oldPrice, setOldPrice] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [priceLoading, setPriceLoading] = useState(false);

  const [tableParams, setTableParams] = useState({
    pagination: {
      current: 1,
      pageSize: 100,
    },
    sortField: null,
    sortOrder: null,
  });
  const [anchorEl, setAnchorEl] = useState(null); // For managing the menu state
  const [selectedRecord, setSelectedRecord] = useState(null); // For keeping track of the selected record

  const handleClick = (event, record) => {
    setAnchorEl(event.currentTarget);
    setSelectedRecord(record);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleViewReceipt = () => {
    if (selectedRecord && selectedRecord.receipt_url) {
      window.open(selectedRecord.receipt_url, "_blank");
    }
    handleClose();
  };

  const navigateToViewBooking = (id) => {
    navigate(`/viewBooking/${id}`);
  };

  const getAllPrices = async () => {
    try {
      setPriceLoading(true);
      const res = await GetServicePrices();
      setPrices(res?.data?.data);
      setOldPrice(res?.data?.data);
      console.log(res.data.data, "fwefw");
    } catch (e) {
      console.error("Error fetching prices", e);
    } finally {
      setPriceLoading(false);
    }
  };

  useEffect(() => {
    getAllPrices();
  }, []);

  const handleUpdatePrice = async () => {
    if (!oldPrice || !newPrice)
      return message.error("Both fields are required.");

    try {
      const response = await UpdateServicePrices(
        { old_price: oldPrice, new_price: newPrice },
        localStorage.getItem("adminToken")
      );
      if (response.status === 200) {
        message.success(`Prices updated successfully!`);
        setNewPrice("");
        await getAllPrices();
      }
    } catch (e) {
      message.error("Failed to update price.");
    }
  };

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
        let textColor = "#000"; // Default text color

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

    // {
    // 	title: "Payment Mode",
    // 	dataIndex: "payment_mode",
    // 	width: "15%",
    // },
    {
      title: "Transaction Date",
      dataIndex: "created_at",
      width: "20%",
      render: (date) => dayjs(date).format("MM/DD/YYYY HH:mm A"),
    },

    // {
    // 	title: "Actions",
    // 	key: "actions",
    // 	render: (text, record) => (
    // 		<Space size="middle">
    // 			<Tooltip title="View Booking Details">
    // 				<Button
    // 					icon="pi pi-eye"
    // 					rounded
    // 					outlined
    // 					severity="warning"
    // 					style={{ borderRadius: "25px" }}
    // 					onClick={() => navigateToViewBooking(record.booking_id)}
    // 				/>
    // 			</Tooltip>
    // 		</Space>
    // 	),
    // },
    // {
    // 	title: "Action",
    // 	dataIndex: "action",
    // 	render: (_, record) => (
    // 		<Space size="middle">
    // 			<IconButton
    // 				aria-controls="lecture-menu"
    // 				aria-haspopup="true"
    // 				onClick={(event) => handleClick(event, record)}
    // 			>
    // 				<MoreVertIcon />
    // 			</IconButton>
    // 		</Space>
    // 	),
    // },
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
      // console.log(newData, "newData");
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

  const exportToCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "ID,Name,Receipt URL,Payment Mode,Amount,Transaction Date\n" +
      data
        .map((row) => {
          const name =
            row.user_payment?.user_profile?.name ||
            row.corporate_payment?.name ||
            "N/A";
          const receiptUrl = row.receipt_url || "N/A";
          const amount = row.amount || "N/A";
          const paymentMode = row.payment_mode || "N/A";
          const transactionDate =
            dayjs(row.created_at).format("YYYY-MM-DD HH:mm:ss") || "N/A";
          return `${row.id},${name},${receiptUrl},${paymentMode},${amount},${transactionDate}`;
        })
        .join("\n");

    const encodedURI = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedURI);
    link.setAttribute("download", "payments.csv");
    document.body.appendChild(link);
    link.click();
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
          <h3 className="page-title">PAYMENT MANAGEMENT</h3>
          <p className="page-sub-title">View Payment History</p>
        </div>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <span className="p-input-icon-left">
              <i className="pi pi-search" />
              <InputText
                type="search"
                onChange={(e) => {
                  onSearch(e.target.value);
                }}
                placeholder="Search..."
              />
            </span>
          </Box>
        </Box>
      </Box>
      {/* <Card className="p-4 mb-4">
				<div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
					<div>
						<label>
							<strong>Current Price:</strong>
						</label>
						<div style={{ marginTop: "4px" }}>${oldPrice || "Loading..."}</div>
					</div>

					<div style={{ flexGrow: 1 }}>
						<label>
							<strong>New Price</strong>
						</label>
						<input
							type="number"
							className="p-inputtext"
							style={{ width: "100%", padding: "8px" }}
							value={newPrice}
							onChange={(e) => setNewPrice(e.target.value)}
							placeholder="Enter new price"
						/>
					</div>

					<Button
						style={{ marginTop: "19px", height: "39px", borderRadius: "5px" }}
						label="Update Price"
						severity="info"
						icon="pi pi-refresh"
						onClick={handleUpdatePrice}
						disabled={priceLoading || !newPrice}
					/>
				</div>
			</Card> */}

      <Table
        rowSelection={rowSelection} // Add row selection
        columns={columns}
        rowKey={(record) => record.id}
        dataSource={data}
        pagination={tableParams.pagination}
        loading={loading}
        onChange={handleTableChange}
      />
      <Menu
        id="lecture-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem onClick={handleViewReceipt}>View Receipt</MenuItem>
      </Menu>
    </Box>
  );
};

export default Payment;
