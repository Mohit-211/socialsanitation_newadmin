import dayjs from "@/lib/dayjs";
import { useLayoutEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Row, Col, Table, Button, Divider } from "antd";
import { ArrowLeft, CircleCheck, User } from "lucide-react";

import {
  GetBookingById,
  GetAllServiceCheckListByBookingId,
} from "@/services/api/bookingApi";
import PageHeader from "@/components/PageHeader";
import "./bookings.scss";
import { IMAGE_BASE_URL } from "@/config/env";

const BookingDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState(null);
  const [checkListData, setChecklistData] = useState([]);
  // Fetch booking data
  useLayoutEffect(() => {
    const fetchBookingData = async () => {
      try {
        const res = await GetBookingById(id);
        setBookingData(res.data.data);
      } catch (error) {
        console.error("Failed to fetch booking data:", error);
      }
    };
    fetchBookingData();
  }, [id]);

  useLayoutEffect(() => {
    const fetchBookingData = async () => {
      try {
        const res = await GetAllServiceCheckListByBookingId(id);
        setChecklistData(res.data.data);
      } catch (error) {
        console.error("Failed to fetch booking data:", error);
      }
    };
    fetchBookingData();
  }, [id]);

  if (!bookingData) return <p>Loading booking details...</p>;

  // Extract Employee Details
  const employees = bookingData.booking_employee_details?.map(
    (employee, index) => ({
      key: index,
      name: employee.employee_profile?.user_profile?.name,
      email: employee.employee_profile?.email,
      mobile: employee.employee_profile?.user_profile?.mobile || "--",
      profile_image_uri:
        employee.employee_profile.user_attachments?.[0]?.file_name || null,
    }),
  );

  // Extract full address
  const fullAddress = bookingData?.booking_address
    ? `${bookingData.booking_address.address}, ${bookingData.booking_address.user_city?.name}, ${bookingData.booking_address.user_state?.name}, ${bookingData.booking_address.user_country?.name}`
    : bookingData?.booking_non_client_address?.[0]
      ? `${bookingData.booking_non_client_address[0].address}, ${bookingData.booking_non_client_address[0].non_client_user_city?.name}, ${bookingData.booking_non_client_address[0].non_client_user_state?.name}, ${bookingData.booking_non_client_address[0].non_client_user_country?.name}`
      : "---";

  // Extract booking attachments
  const beforeServiceImages = bookingData.booking_attachment?.filter(
    (att) => att.title === "BEFORE SERVICE",
  );
  const afterServiceImages = bookingData.booking_attachment?.filter(
    (att) => att.title === "AFTER SERVICE",
  );

  return (
    <div>
      <PageHeader
        title="BOOKING MANAGEMENT"
        subtitle="View Booking Details"
        actions={
          <Button
            size="large"
            icon={<ArrowLeft size={16} />}
            onClick={() => navigate("/bookings")}
          >
            Return to Bookings
          </Button>
        }
      />

      {/* Booking Information Card */}
      <section className="surface surface--padded booking-view__card">
        <h2 className="section-title booking-view__title">
          General Information
        </h2>
        <Divider className="booking-view__divider" />
        <Row gutter={24} style={{ marginTop: "15px" }}>
          <Col xs={24} md={12}>
            <p className="booking-view__field">
              <strong>Booking ID:</strong> {bookingData?.booking_unique_id}
            </p>
            <p className="booking-view__field">
              <strong>Booking Status:</strong> {bookingData?.booking_status}
            </p>
            <p className="booking-view__field">
              <strong>Client Name:</strong>{" "}
              {bookingData?.booking_user?.user_profile?.name ||
                bookingData?.client_name ||
                "--"}
            </p>
          </Col>
          <Col xs={24} md={12}>
            <p className="booking-view__field">
              <strong>Service Name:</strong>{" "}
              {bookingData?.service_booking?.name ||
                bookingData?.service_booking_archieve?.name ||
                "--"}
            </p>

            <p className="booking-view__field">
              <strong>Booking Name:</strong>{" "}
              {bookingData?.booking_name || "--"}
            </p>

            {/* ✅ Updated Date & Time Section */}
            <p className="booking-view__field">
              <strong>Date & Time:</strong>{" "}
              {bookingData?.date && bookingData?.time
                ? (() => {
                    const dateStr =
                      typeof bookingData.date === "string"
                        ? bookingData.date.split("T")[0]
                        : dayjs.utc(bookingData.date).format("YYYY-MM-DD");

                    const combined = dayjs.utc(
                      `${dateStr} ${bookingData.time}`,
                      "YYYY-MM-DD HH:mm:ss",
                    );

                    return combined.format("MM/DD/YYYY hh:mm A");
                  })()
                : "--"}
            </p>
          </Col>
        </Row>
      </section>

      {/* Employees Assigned */}
      <section className="surface surface--padded booking-view__card">
        <h2 className="section-title booking-view__title">
          Employees Assigned
        </h2>
        <Divider className="booking-view__divider" />
        {employees?.length > 0 ? (
          <Table
            columns={[
              {
                title: "Profile",
                dataIndex: "profile_image_uri",
                key: "profile_image_uri",
                render: (uri) =>
                  uri ? (
                    <img
                      src={`${IMAGE_BASE_URL}${uri}`}
                      alt="Profile"
                      crossOrigin="anonymous"
                      className="booking-view__avatar"
                    />
                  ) : (
                    <User size={24} color="var(--color-text-subtle)" />
                  ),
              },
              { title: "Name", dataIndex: "name", key: "name" },
              { title: "Email", dataIndex: "email", key: "email" },
              { title: "Mobile", dataIndex: "mobile", key: "mobile" },
            ]}
            dataSource={employees}
            pagination={false}
            bordered
            style={{ marginTop: "15px" }}
          />
        ) : (
          <p className="booking-view__error">No Employees Assigned</p>
        )}
      </section>

      {/* Booking Timings */}
      <section className="surface surface--padded booking-view__card">
        <h2 className="section-title booking-view__title">Booking Schedule</h2>
        <Divider className="booking-view__divider" />
        <Row gutter={24} style={{ marginTop: "15px" }}>
          <Col xs={24} md={12}>
            <p className="booking-view__field">
              <strong>Start Time:</strong>{" "}
              {bookingData?.start_time
                ? new Date(bookingData.start_time).toLocaleString()
                : "---"}
            </p>
          </Col>
          <Col xs={24} md={12}>
            <p className="booking-view__field">
              <strong>End Time:</strong>{" "}
              {bookingData?.end_time
                ? new Date(bookingData.end_time).toLocaleString()
                : "---"}
            </p>
          </Col>
        </Row>
      </section>

      {/* Booking Address */}
      <section className="surface surface--padded booking-view__card">
        <h2 className="section-title booking-view__title">Address & Notes</h2>
        <Divider className="booking-view__divider" />
        <Row gutter={24} style={{ marginTop: "15px" }}>
          <Col xs={24} md={12}>
            <p className="booking-view__field">
              <strong>Address:</strong> {fullAddress}
            </p>
          </Col>
          <Col xs={24} md={12}>
            <p className="booking-view__field">
              <strong>Notes:</strong> {bookingData?.notes || "---"}
            </p>
          </Col>
        </Row>
      </section>

      <section className="surface surface--padded booking-view__card">
        <h2 className="section-title booking-view__title">Service Images</h2>
        <Divider className="booking-view__divider" />
        <h3 className="booking-view__subheading">Before Service</h3>
        {beforeServiceImages?.length > 0 ? (
          beforeServiceImages.map((img) => (
            <img
              key={img.id}
              src={`${IMAGE_BASE_URL}${img.file_name}`}
              alt="Before Service"
              className="booking-view__image"
              crossOrigin="anonymous"
            />
          ))
        ) : (
          <p className="booking-view__error">No images uploaded</p>
        )}

        <h3 className="booking-view__subheading">After Service</h3>
        {afterServiceImages?.length > 0 ? (
          afterServiceImages.map((img) => (
            <img
              key={img.id}
              src={`${IMAGE_BASE_URL}/${img.file_name}`}
              alt="After Service"
              className="booking-view__image"
              crossOrigin="anonymous"
            />
          ))
        ) : (
          <p className="booking-view__error">No images uploaded</p>
        )}
      </section>

      {checkListData?.length > 0 ? (
        checkListData.map((headingGroup, index) => (
          <section
            key={index}
            className="surface surface--padded booking-view__card"
          >
            <h2 className="section-title booking-view__title">
              {headingGroup.heading_title}
            </h2>

            {headingGroup.tasks && headingGroup.tasks.length > 0 ? (
              <>
                {/* Table Header */}
                <div className="booking-view__checklist-head">
                  <div className="booking-view__checklist-task">Task</div>
                  <div className="booking-view__checklist-day">Day 1</div>
                  <div className="booking-view__checklist-day">Day 2</div>
                </div>

                {/* Task Rows */}
                {(() => {
                  const groupedTasks = {};

                  headingGroup.tasks?.forEach((item) => {
                    if (!groupedTasks[item.task]) {
                      groupedTasks[item.task] = {
                        day_1: false,
                        day_2: false,
                      };
                    }
                    if (item.day === "Day 1" && item.is_completed) {
                      groupedTasks[item.task].day_1 = true;
                    }
                    if (item.day === "Day 2" && item.is_completed) {
                      groupedTasks[item.task].day_2 = true;
                    }
                  });

                  return Object.entries(groupedTasks).map(
                    ([task, status], taskIndex) => (
                      <div
                        key={taskIndex}
                        className="booking-view__checklist-row"
                      >
                        <div className="booking-view__checklist-task">
                          {task}
                        </div>
                        <div className="booking-view__checklist-day">
                          {status.day_1 && (
                            <CircleCheck
                              size={16}
                              color="var(--color-success-strong)"
                            />
                          )}
                        </div>
                        <div className="booking-view__checklist-day">
                          {status.day_2 && (
                            <CircleCheck
                              size={16}
                              color="var(--color-success-strong)"
                            />
                          )}
                        </div>
                      </div>
                    ),
                  );
                })()}
              </>
            ) : (
              <p className="text-muted booking-view__note">
                You haven’t allotted any checklist to this service.{" "}
                <Link
                  to={`/edit-checklist/${headingGroup.booking_id}`}
                  className="booking-view__link"
                >
                  Click here to allot checklist
                </Link>
              </p>
            )}
          </section>
        ))
      ) : (
        <section className="surface surface--padded">
          <p className="text-muted booking-view__note booking-view__note--flush">
            You haven’t allotted any checklist to this service.{" "}
            <Link
              to={`/editService/${bookingData?.service_id}`}
              className="booking-view__link"
            >
              Click here to allot checklist
            </Link>
          </p>
        </section>
      )}
    </div>
  );
};

export default BookingDetailsPage;
