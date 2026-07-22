/** @format */

import dayjs from "@/lib/dayjs";
import React, { useLayoutEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
	Box,
	Card,
	CardContent,
	Typography,
	Divider,
	Button,
} from "@mui/material";
import { Row, Col, Table } from "antd";
import { UserOutlined } from "@ant-design/icons";

import {
	GetBookingById,
	GetAllServiceCheckListByBookingId,
} from "../../services/Api/BookingApi";
import "./Bookings.css";
import { BASE_URL_IMAGE } from "../../services/Host";
import { CheckCircleOutlined } from "@ant-design/icons";

const ViewBooking = () => {
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
				console.log(res.data.data, "chejed");
			} catch (error) {
				console.error("Failed to fetch booking data:", error);
			}
		};
		fetchBookingData();
	}, [id]);

	if (!bookingData) return <Typography>Loading booking details...</Typography>;

	// Extract Employee Details
	const employees = bookingData.booking_employee_details?.map(
		(employee, index) => ({
			key: index,
			name: employee.employee_profile?.user_profile?.name,
			email: employee.employee_profile?.email,
			mobile: employee.employee_profile?.user_profile?.mobile || "--",
			profile_image_uri:
				employee.employee_profile.user_attachments?.[0]?.file_name || null,
		})
	);

	// Extract full address
	const fullAddress = bookingData?.booking_address
		? `${bookingData.booking_address.address}, ${bookingData.booking_address.user_city?.name}, ${bookingData.booking_address.user_state?.name}, ${bookingData.booking_address.user_country?.name}`
		: bookingData?.booking_non_client_address?.[0]
		? `${bookingData.booking_non_client_address[0].address}, ${bookingData.booking_non_client_address[0].non_client_user_city?.name}, ${bookingData.booking_non_client_address[0].non_client_user_state?.name}, ${bookingData.booking_non_client_address[0].non_client_user_country?.name}`
		: "---";

	// Extract booking attachments
	const beforeServiceImages = bookingData.booking_attachment?.filter(
		(att) => att.title === "BEFORE SERVICE"
	);
	const afterServiceImages = bookingData.booking_attachment?.filter(
		(att) => att.title === "AFTER SERVICE"
	);

	return (
		<Box sx={{ padding: 3 }}>
			{/* Header */}
			<Box
				display="flex"
				justifyContent="space-between"
				alignItems="center"
				mb={3}
			>
				<Box>
					<Typography variant="h5" fontWeight="bold">
						Booking Management
					</Typography>
					<Typography variant="body1" color="green">
						View Booking Details
					</Typography>
				</Box>
				<Button
					variant="contained"
					onClick={() => navigate("/bookings")}
					sx={{ borderRadius: "5px", height: "40px" }}
				>
					← Return to Bookings
				</Button>
			</Box>

			{/* Booking Information Card */}
			<Card sx={{ mb: 3, boxShadow: 3, borderRadius: "10px" }}>
				<CardContent>
					<Typography variant="h6" color="primary" fontWeight="bold" mb={2}>
						General Information
					</Typography>
					<Divider />
					<Row gutter={24} style={{ marginTop: "15px" }}>
						<Col span={12}>
							<Typography variant="body1">
								<strong>Booking ID:</strong> {bookingData?.booking_unique_id}
							</Typography>
							<Typography variant="body1">
								<strong>Booking Status:</strong> {bookingData?.booking_status}
							</Typography>
							<Typography variant="body1">
								<strong>Client Name:</strong>{" "}
								{bookingData?.booking_user?.user_profile?.name ||
									bookingData?.client_name ||
									"--"}
							</Typography>
						</Col>
						<Col span={12}>
							<Typography variant="body1">
								<strong>Service Name:</strong>{" "}
								{bookingData?.service_booking?.name ||
									bookingData?.service_booking_archieve?.name ||
									"--"}
							</Typography>

							<Typography variant="body1">
								<strong>Booking Name:</strong>{" "}
								{bookingData?.booking_name || "--"}
							</Typography>

							{/* ✅ Updated Date & Time Section */}
							<Typography variant="body1">
								<strong>Date & Time:</strong>{" "}
								{bookingData?.date && bookingData?.time
									? (() => {
											const dateObj = dayjs(bookingData.date); // parse the ISO date
											const [hours, minutes, seconds] = bookingData.time
												.split(":")
												.map(Number);
											const combined = dateObj
												.hour(hours)
												.minute(minutes)
												.second(seconds);
											return combined.format("MM/DD/YYYY hh:mm A");
									  })()
									: "--"}
							</Typography>
						</Col>
					</Row>
				</CardContent>
			</Card>

			{/* Employees Assigned */}
			<Card sx={{ mb: 3, boxShadow: 3, borderRadius: "10px" }}>
				<CardContent>
					<Typography variant="h6" color="primary" fontWeight="bold" mb={2}>
						Employees Assigned
					</Typography>
					<Divider />
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
												src={`${BASE_URL_IMAGE}${uri}`}
												alt="Profile"
												crossOrigin="anonymous"
												style={{
													width: "40px",
													height: "40px",
													borderRadius: "50%",
													objectFit: "cover",
													boxShadow: "0 0 6px rgba(0,0,0,0.1)",
												}}
											/>
										) : (
											<UserOutlined
												style={{
													fontSize: "24px",
													color: "#ccc",
												}}
											/>
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
						<Typography variant="body1" color="error" mt={2}>
							No Employees Assigned
						</Typography>
					)}
				</CardContent>
			</Card>

			{/* Booking Timings */}
			<Card sx={{ mb: 3, boxShadow: 3, borderRadius: "10px" }}>
				<CardContent>
					<Typography variant="h6" color="primary" fontWeight="bold" mb={2}>
						Booking Schedule
					</Typography>
					<Divider />
					<Row gutter={24} style={{ marginTop: "15px" }}>
						<Col span={12}>
							<Typography variant="body1">
								<strong>Start Time:</strong>{" "}
								{bookingData?.start_time
									? new Date(bookingData.start_time).toLocaleString()
									: "---"}
							</Typography>
						</Col>
						<Col span={12}>
							<Typography variant="body1">
								<strong>End Time:</strong>{" "}
								{bookingData?.end_time
									? new Date(bookingData.end_time).toLocaleString()
									: "---"}
							</Typography>
						</Col>
					</Row>
				</CardContent>
			</Card>

			{/* Booking Address */}
			<Card sx={{ mb: 3, boxShadow: 3, borderRadius: "10px" }}>
				<CardContent>
					<Typography variant="h6" color="primary" fontWeight="bold" mb={2}>
						Address & Notes
					</Typography>
					<Divider />
					<Row gutter={24} style={{ marginTop: "15px" }}>
						<Col span={12}>
							<Typography variant="body1">
								<strong>Address:</strong> {fullAddress}
							</Typography>
						</Col>
						<Col span={12}>
							<Typography variant="body1">
								<strong>Notes:</strong> {bookingData?.notes || "---"}
							</Typography>
						</Col>
					</Row>
				</CardContent>
			</Card>

			<Card sx={{ mb: 3, boxShadow: 3, borderRadius: "10px" }}>
				<CardContent>
					<Typography variant="h6" color="primary" fontWeight="bold" mb={2}>
						Service Images
					</Typography>
					<Divider />
					<Typography variant="body1" fontWeight="bold" mt={2}>
						Before Service
					</Typography>
					{beforeServiceImages?.length > 0 ? (
						beforeServiceImages.map((img) => (
							<img
								key={img.id}
								src={`${BASE_URL_IMAGE}${img.file_name}`}
								alt="Before Service"
								style={{ width: "100px", margin: "10px" }}
								crossOrigin="anonymous"
							/>
						))
					) : (
						<Typography variant="body2" color="error">
							No images uploaded
						</Typography>
					)}

					<Typography variant="body1" fontWeight="bold" mt={2}>
						After Service
					</Typography>
					{afterServiceImages?.length > 0 ? (
						afterServiceImages.map((img) => (
							<img
								key={img.id}
								src={`${BASE_URL_IMAGE}/${img.file_name}`}
								alt="After Service"
								style={{ width: "100px", margin: "10px" }}
								crossOrigin="anonymous"
							/>
						))
					) : (
						<Typography variant="body2" color="error">
							No images uploaded
						</Typography>
					)}
				</CardContent>
			</Card>

			{checkListData?.length > 0 ? (
				checkListData.map((headingGroup, index) => (
					<Card key={index} sx={{ mb: 3, boxShadow: 3, borderRadius: "10px" }}>
						<CardContent>
							<Typography variant="h6" color="primary" fontWeight="bold" mb={2}>
								{headingGroup.heading_title}
							</Typography>

							{headingGroup.tasks && headingGroup.tasks.length > 0 ? (
								<>
									{/* Table Header */}
									<Box
										sx={{
											display: "flex",
											fontWeight: "bold",
											border: "1px solid #ccc",
											backgroundColor: "#f5f5f5",
										}}
									>
										<Box
											sx={{ width: "75%", p: 1, borderRight: "1px solid #ccc" }}
										>
											Task
										</Box>
										<Box
											sx={{
												width: "12%",
												p: 1,
												borderRight: "1px solid #ccc",
												textAlign: "center",
											}}
										>
											Day 1
										</Box>
										<Box sx={{ width: "12%", p: 1, textAlign: "center" }}>
											Day 2
										</Box>
									</Box>

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
												<Box
													key={taskIndex}
													sx={{
														display: "flex",
														borderLeft: "1px solid #ccc",
														borderRight: "1px solid #ccc",
														borderBottom: "1px solid #ccc",
													}}
												>
													<Box
														sx={{
															width: "75%",
															p: 1,
															borderRight: "1px solid #ccc",
														}}
													>
														{task}
													</Box>
													<Box
														sx={{
															width: "12%",
															p: 1,
															borderRight: "1px solid #ccc",
															textAlign: "center",
														}}
													>
														{status.day_1 && (
															<CheckCircleOutlined sx={{ color: "green" }} />
														)}
													</Box>
													<Box sx={{ width: "12%", p: 1, textAlign: "center" }}>
														{status.day_2 && (
															<CheckCircleOutlined sx={{ color: "green" }} />
														)}
													</Box>
												</Box>
											)
										);
									})()}
								</>
							) : (
								<Typography color="text.secondary" mt={2}>
									You haven’t allotted any checklist to this service.{" "}
									<Link
										to={`/edit-checklist/${headingGroup.booking_id}`}
										style={{ textDecoration: "underline", color: "#1976d2" }}
									>
										Click here to allot checklist
									</Link>
								</Typography>
							)}
						</CardContent>
					</Card>
				))
			) : (
				<Card sx={{ p: 3, boxShadow: 3 }}>
					<Typography color="text.secondary">
						You haven’t allotted any checklist to this service.{" "}
						<Link
							to={`/editService/${bookingData?.service_id}`} // <-- make sure this is defined
							style={{ textDecoration: "underline", color: "#1976d2" }}
						>
							Click here to allot checklist
						</Link>
					</Typography>
				</Card>
			)}
		</Box>
	);
};

export default ViewBooking;
