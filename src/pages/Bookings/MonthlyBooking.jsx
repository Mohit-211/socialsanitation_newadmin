/** @format */

import dayjs from "@/lib/dayjs";
import React, { useEffect, useState } from "react";
import {
	Calendar,
	Badge,
	Modal,
	List,
	Typography,
	Spin,
	Row,
	Col,
	Button,
	Tag,
	Space,
} from "antd";
import { useNavigate } from "react-router-dom";
import { GetMonthlyBookingCalendar } from "../../services/Api/BookingApi";

const { Text } = Typography;

const MonthlyBooking = () => {
	const [currentDate, setCurrentDate] = useState(dayjs());
	const [bookingData, setBookingData] = useState({});
	const [loading, setLoading] = useState(false);
	const [modalVisible, setModalVisible] = useState(false);
	const [selectedDate, setSelectedDate] = useState(null);
	const [selectedBookings, setSelectedBookings] = useState([]);
	const navigate = useNavigate();

	const fetchBookingData = async (month, year) => {
		setLoading(true);
		try {
			const formData = new FormData();
			formData.append("month", month);
			formData.append("year", year);
			const res = await GetMonthlyBookingCalendar(formData);
			const map = {};
			res.data.data.forEach((entry) => {
				map[entry.date] = entry.bookings;
			});
			setBookingData(map);
		} catch (error) {
			console.error("Failed to fetch bookings", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchBookingData(currentDate.month() + 1, currentDate.year());
	}, [currentDate]);

	const onPanelChange = (value) => {
		setCurrentDate(value);
	};

	const onSelect = (value) => {
		const dateStr = value.format("YYYY-MM-DD");
		const bookings = bookingData[dateStr] || [];
		if (bookings.length > 0) {
			setSelectedDate(dateStr);
			setSelectedBookings(bookings);
			setModalVisible(true);
		}
	};

	const dateCellRender = (value) => {
		const dateStr = value.format("YYYY-MM-DD");
		const bookings = bookingData[dateStr];
		if (!bookings || bookings.length === 0) return null;

		return (
			<div>
				{bookings.slice(0, 3).map((booking) => (
					<div
						key={booking.id}
						style={{ cursor: "pointer" }}
						onClick={() => {
							setSelectedDate(dateStr);
							setSelectedBookings(bookings);
							setModalVisible(true);
						}}
					>
						<Badge
							color="blue"
							text={
								booking.booking_name
									? booking.booking_name
									: booking.booking_user?.user_profile?.name || "No Name"
							}
						/>
					</div>
				))}
				{bookings.length > 3 && (
					<Text
						type="secondary"
						style={{ fontSize: 12, cursor: "pointer" }}
						onClick={() => {
							setSelectedDate(dateStr);
							setSelectedBookings(bookings);
							setModalVisible(true);
						}}
					>
						+{bookings.length - 3} more
					</Text>
				)}
			</div>
		);
	};

	return (
		<Spin spinning={loading} tip="Loading bookings...">
			<Row justify="space-between" style={{ marginBottom: 16 }}>
				<Col>
					<h3 style={{ marginBottom: 0 }}>Calendar View</h3>
					<p>View bookings by day, just like Google Calendar.</p>
				</Col>
				<Button
					icon={<i className="pi pi-arrow-left" />}
					onClick={() => navigate("/bookings")}
					style={{ borderRadius: "5px", height: "47px" }}
				>
					Return to Bookings
				</Button>
			</Row>
			<Calendar
				value={currentDate}
				onPanelChange={onPanelChange}
				onSelect={onSelect}
				dateCellRender={dateCellRender}
				fullscreen
			/>

			<Modal
				title="Bookings on July 22"
				open={modalVisible}
				onCancel={() => setModalVisible(false)}
				footer={null}
				width={700}
				bodyStyle={{ padding: "24px", background: "#fafafa" }}
			>
				<List
					itemLayout="vertical"
					dataSource={selectedBookings}
					renderItem={(item) => {
						const clientName =
							item.client_name ||
							item.booking_user?.user_profile?.name ||
							"Unnamed";
						const isClient = !!item.user_id;
						const color = isClient ? "green" : "blue";
						const label = isClient ? "Client Booking" : "Non-client Booking";

						return (
							<List.Item
								style={{
									background: "#fff",
									border: "1px solid #f0f0f0",
									borderRadius: "12px",
									boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
									padding: "16px 20px",
									marginBottom: "16px",
									transition: "all 0.3s ease-in-out",
									cursor: "pointer",
								}}
								onClick={() => navigate(`/viewBooking/${item.id}`)}
							>
								<Row justify="space-between" align="middle" gutter={[16, 16]}>
									<Col xs={24} sm={18}>
										<Space direction="vertical" size={4}>
											<Space size="small">
												<Text strong style={{ fontSize: 16 }}>
													{clientName}
												</Text>
												<Tag
													color={color}
													style={{
														borderRadius: "8px",
														fontSize: 12,
														padding: "2px 8px",
														fontWeight: 500,
													}}
												>
													{label}
												</Tag>
											</Space>

											<Text type="secondary">
												📋 Service:{" "}
												<strong>
													{item.service_booking?.name || "Not Assigned"}
												</strong>
											</Text>
											<Text type="secondary">
												🕒 Time:{" "}
												<strong>
													{dayjs(item.time, "HH:mm:ss").format("hh:mm A")}
												</strong>
											</Text>
										</Space>
									</Col>

									<Col xs={24} sm={6} style={{ textAlign: "right" }}>
										<Button
											type="primary"
											onClick={(e) => {
												e.stopPropagation();
												navigate(`/viewBooking/${item.id}`);
											}}
											style={{
												borderRadius: "6px",
												fontWeight: 500,
											}}
										>
											View
										</Button>
									</Col>
								</Row>
							</List.Item>
						);
					}}
				/>
			</Modal>
		</Spin>
	);
};

export default MonthlyBooking;
