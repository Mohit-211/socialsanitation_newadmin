/** @format */

import dayjs from "@/lib/dayjs";
import React, { useEffect, useLayoutEffect, useState } from "react";
import Button from "@mui/material/Button";
import { Box } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import Form from "react-bootstrap/Form";
import { GetUserById } from "../../services/Api/Api";
import Card from "@mui/material/Card";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import { Space, Table, Tag, Image } from "antd";
import { GetBookingBySPId } from "../../services/Api/BookingApi";
import { IoArrowForwardCircleOutline } from "react-icons/io5";
import "../Customer/Customers.css";
import Attendance from "../Attendance/Attendance";
import { BASE_URL_IMAGE } from "../../services/Host";
const ViewCustomer = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [userData, setUserData] = useState([]);
  const [bookingData, setBookingData] = useState([]);
  const [activeTab, setActiveTab] = useState("all");

  useLayoutEffect(() => {
    GetUserById(id)
      .then((res) => {
        setUserData(res.data.data);
        console.log("user", res.data.data);
      })
      .catch((err) => {
        console.log(err, "error");
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
      console.log("userbooking==>", dataWithIndex);
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

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return dateString.split("T")[0];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "DELETED":
      case "REJECTED":
        return "red";
      case "SUCCESS":
        return "green";
      case "ACCEPTED":
        return "purple";
      case "PENDING":
        return "yellow";
      case "COMPLETED":
        return "green"; // Assuming you want COMPLETED to have the same color as SUCCESS
      default:
        return "geekblue"; // Default color
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
    // {
    //     title: "Address",
    //     dataIndex: ["bookings", "booking_address", "full_address"],
    //     key: "address",
    // },
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
            {status === "SUCCESS" ? "COMPLETED" : status.toUpperCase()}
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
          style={{ fontSize: "20px" }}
          className="redirect_button"
          onClick={() => navigate(`/viewBooking/${record.id}`)}
        />
      ),
    },
  ];

  const handleTabSelect = (k) => {
    setActiveTab(k);
    let status = k === "all" ? "all" : k;
    getData(status);
  };

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        marginBottom="30px"
      >
        <div>
          <h3 className="page-title">EMPLOYEE MANAGEMENT</h3>
          <p className="page-sub-title">
            View Information related with Employee
          </p>
        </div>
        <div>
          <Button
            icon="pi pi-arrow-left"
            severity="secondary"
            onClick={navigateToUser}
            style={{ borderRadius: "5px", height: "47px" }}
          >
            <span style={{ marginLeft: "5px" }}>Return to Employee List</span>
          </Button>
        </div>
      </Box>

      <Form className="admin_details_form">
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              gap: "20px",
              alignItems: "flex-start",
              marginBottom: "40px",
            }}
          >
            {/* 👉 Profile Image Card on the Left */}
            {userData?.user_attachments?.length > 0 &&
              userData.user_attachments[0].file_type === "Image" && (
                <Card
                  style={{
                    width: "200px",
                    height: "203px",
                    padding: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Image
                    src={`${BASE_URL_IMAGE}${userData.user_attachments[0].file_name}`}
                    alt="User Profile"
                    crossOrigin="anonymous"
                    preview={true}
                    style={{
                      width: "150px",
                      height: "150px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      boxShadow: "0 0 6px rgba(0,0,0,0.1)",
                    }}
                  />
                </Card>
              )}

            {/* 👉 Employee Info Card on the Right */}
            <Card style={{ width: "100%" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "20px",
                  marginBottom: "40px",
                }}
              >
                <div>
                  <h5
                    style={{
                      fontSize: "0.9rem",
                      fontFamily: "Cerebri Sans,sans-serif",
                      fontWeight: "700",
                      marginTop: "14px",
                      color: "black",
                    }}
                  >
                    Employee's Name:
                  </h5>
                  <p>{userData?.user_profile?.name || "---"}</p>
                </div>
                <div>
                  <h5
                    style={{
                      fontSize: "0.9rem",
                      fontFamily: "Cerebri Sans,sans-serif",
                      fontWeight: "700",
                      marginTop: "14px",
                      color: "black",
                    }}
                  >
                    Email
                  </h5>
                  <p>{userData?.email || "---"}</p>
                </div>
                <div>
                  <h5
                    style={{
                      fontSize: "0.9rem",
                      fontFamily: "Cerebri Sans,sans-serif",
                      fontWeight: "700",
                      marginTop: "14px",
                      color: "black",
                    }}
                  >
                    Mobile:
                  </h5>
                  <p>{userData?.user_profile?.mobile || "---"}</p>
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <h5 style={{ marginBottom: "20px" }}>
              View all the bookings associated with{" "}
              {userData?.user_profile?.name}
            </h5>
            <Tabs activeKey={activeTab} onSelect={handleTabSelect}>
              {tabsContent.map((tab) => (
                <Tab eventKey={tab.key} title={tab.label} key={tab.key}>
                  <div style={{ marginTop: "20px" }}>
                    <Table
                      columns={columns}
                      dataSource={bookingData}
                      rowKey="autoIncrementId"
                    />
                  </div>
                </Tab>
              ))}
            </Tabs>
          </Card>

          <Card style={{ marginTop: "40px" }}>
            <Attendance />
          </Card>
        </div>
      </Form>
    </Box>
  );
};

export default ViewCustomer;
