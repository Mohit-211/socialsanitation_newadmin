/** @format */

import dayjs from "@/lib/dayjs";
import React, { useEffect, useLayoutEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { GetUserById } from "../../services/Api/Api";
import { GetBookingBySPId } from "../../services/Api/BookingApi";
import { BASE_URL_IMAGE } from "../../services/Host";
import Attendance from "../Attendance/Attendance";
import "../Customer/Customers.css";

// MUI Components
import { Box, Paper, Typography, Button, Card } from "@mui/material";

// Ant Design Components
import { Table, Tag, Image, Tabs } from "antd";

// Icons
import { IoArrowForwardCircleOutline } from "react-icons/io5";
import { ArrowLeft } from "lucide-react";

const ViewCustomer = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [userData, setUserData] = useState(null);
  const [bookingData, setBookingData] = useState([]);
  const [activeTab, setActiveTab] = useState("all");

  useLayoutEffect(() => {
    GetUserById(id)
      .then((res) => {
        setUserData(res.data.data);
      })
      .catch((err) => {
        console.log("error", err);
      });
  }, [id]);

  const getData = async (booking_status) => {
    try {
      const formData = { id: id, booking_status };
      let result = await GetBookingBySPId(formData);
      // Add an auto-increment ID to each booking
      const dataWithIndex = result.data.data.map((item, index) => ({
        ...item,
        autoIncrementId: index + 1,
      }));
      setBookingData(dataWithIndex);
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    getData("all");
  }, [id]);

  const navigateToUser = () => {
    navigate("/employees");
  };

  const tabsContent = [
    { label: "All", key: "all" },
    { label: "Ongoing", key: "ONGOING" },
    { label: "Upcoming", key: "UPCOMING" },
    { label: "Completed", key: "COMPLETED" },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "DELETED":
      case "REJECTED":
        return "red";
      case "SUCCESS":
      case "COMPLETED":
        return "green";
      case "ACCEPTED":
        return "purple";
      case "PENDING":
        return "yellow";
      default:
        return "geekblue";
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "autoIncrementId",
      key: "id",
    },
    {
      title: "Booking ID",
      dataIndex: ["employee_details_booking", "booking_unique_id"],
      key: "booking_id",
    },
    {
      title: "Service",
      dataIndex: ["employee_details_booking", "service_booking", "name"],
      key: "service",
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: "10%",
      render: (date) => dayjs(date).format("MM/DD/YYYY"),
    },
    {
      title: "User's Name",
      dataIndex: [
        "employee_details_booking",
        "booking_user",
        "user_profile",
        "name",
      ],
      key: "users",
    },
    {
      title: "Status",
      dataIndex: ["employee_details_booking", "booking_status"],
      key: "status",
      render: (status) => {
        const color = getStatusColor(status);
        return (
          <Tag color={color}>
            {status === "SUCCESS" ? "COMPLETED" : status?.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: "Service Start Time",
      dataIndex: ["employee_details_booking", "start_time"],
      key: "start_time",
      render: (time) => (time ? new Date(time).toLocaleString() : "---"),
    },
    {
      title: "Service End Time",
      dataIndex: ["employee_details_booking", "end_time"],
      key: "end_time",
      render: (time) => (time ? new Date(time).toLocaleString() : "---"),
    },
    {
      title: "",
      key: "redirect",
      render: (text, record) => (
        <IoArrowForwardCircleOutline
          style={{ fontSize: "20px", cursor: "pointer" }}
          className="redirect_button"
          onClick={() => navigate(`/viewBooking/${record.id}`)}
        />
      ),
    },
  ];

  const handleTabSelect = (key) => {
    setActiveTab(key);
    getData(key);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Page Header */}
      <Paper
        variant="outlined"
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: "10px",
          borderColor: "#eef0f2",
          backgroundColor: "#ffffff",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: "1.25rem", color: "#1f2937" }}>
              EMPLOYEE MANAGEMENT
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: "0.875rem", mt: 0.5 }}>
              View Information related with Employee
            </Typography>
          </Box>

          <Button
            variant="contained"
            disableElevation
            startIcon={<ArrowLeft size={18} />}
            onClick={navigateToUser}
            sx={{
              ml: "auto",
              height: 44,
              px: 3,
              borderRadius: "6px",
              textTransform: "none",
              fontWeight: 600,
              backgroundColor: "#5a6a85",
              "&:hover": {
                backgroundColor: "#48556d",
              },
            }}
          >
            Return to Employee List
          </Button>
        </Box>
      </Paper>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {/* Employee Details Header Card */}
        <Box sx={{ display: "flex", gap: 3, alignItems: "stretch" }}>
          {/* Optional Profile Image Preview */}
          {userData?.user_attachments?.length > 0 &&
            userData.user_attachments[0].file_type === "Image" && (
              <Card
                variant="outlined"
                sx={{
                  width: "180px",
                  p: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "10px",
                  borderColor: "#eef0f2",
                }}
              >
                <Image
                  src={`${BASE_URL_IMAGE}${userData.user_attachments[0].file_name}`}
                  alt="User Profile"
                  crossOrigin="anonymous"
                  preview={true}
                  style={{
                    width: "130px",
                    height: "130px",
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              </Card>
            )}

          {/* Info Card */}
          <Card
            variant="outlined"
            sx={{
              width: "100%",
              p: 3,
              borderRadius: "10px",
              borderColor: "#eef0f2",
              boxShadow: "none",
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                gap: 3,
              }}
            >
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", color: "#111827", mb: 0.5 }}>
                  Employee's Name:
                </Typography>
                <Typography sx={{ color: "#4b5563", fontSize: "0.95rem" }}>
                  {userData?.user_profile?.name || "---"}
                </Typography>
              </Box>

              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", color: "#111827", mb: 0.5 }}>
                  Email
                </Typography>
                <Typography sx={{ color: "#4b5563", fontSize: "0.95rem" }}>
                  {userData?.email || "---"}
                </Typography>
              </Box>

              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", color: "#111827", mb: 0.5 }}>
                  Mobile:
                </Typography>
                <Typography sx={{ color: "#4b5563", fontSize: "0.95rem" }}>
                  {userData?.user_profile?.mobile || "---"}
                </Typography>
              </Box>
            </Box>
          </Card>
        </Box>

        {/* Bookings Table Card */}
        <Card
          variant="outlined"
          sx={{
            p: 3,
            borderRadius: "10px",
            borderColor: "#eef0f2",
            boxShadow: "none",
          }}
        >
          <Typography sx={{ fontSize: "1.05rem", fontWeight: 600, color: "#374151", mb: 2 }}>
            View all the bookings associated with {userData?.user_profile?.name || ""}
          </Typography>

          <Tabs
            activeKey={activeTab}
            onChange={handleTabSelect}
            items={tabsContent.map((tab) => ({
              key: tab.key,
              label: tab.label,
              children: (
                <Box sx={{ mt: 2 }}>
                  <Table
                    columns={columns}
                    dataSource={bookingData}
                    rowKey="autoIncrementId"
                    pagination={{ pageSize: 10 }}
                  />
                </Box>
              ),
            }))}
          />
        </Card>

        {/* Attendance Section Card */}
        <Card
          variant="outlined"
          sx={{
            p: 3,
            borderRadius: "10px",
            borderColor: "#eef0f2",
            boxShadow: "none",
          }}
        >
          <Attendance />
        </Card>
      </Box>
    </Box>
  );
};

export default ViewCustomer;