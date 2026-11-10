import dayjs from "@/lib/dayjs";
import { useEffect, useState } from "react";
import {
	Calendar,
	Badge,
	Modal,
	Typography,
	Spin,
	Row,
	Col,
	Button,
	Tag,
	Space,
} from "antd";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";
import { GetMonthlyBookingCalendar } from "../../services/Api/BookingApi";
import PageHeader from "../../components/PageHeader";
import "./Bookings.css";

const { Text } = Typography;

const MonthlyBooking = () => {
	const [currentDate, setCurrentDate] = useState(dayjs());
	const [bookingData, setBookingData] = useState({});
	const [loading, setLoading] = useState(false);
	const [modalVisible, setModalVisible] = useState(false);
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
						className="booking-calendar__entry"
						onClick={() => {
							setSelectedBookings(bookings);
							setModalVisible(true);
						}}
					>
						<Badge
							color="var(--color-primary-border)"
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
						className="booking-calendar__more"
						onClick={() => {
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
		<Spin spinning={loading} description="Loading bookings...">
			<PageHeader
				title="Calendar View"
				subtitle="View bookings by day, just like Google Calendar."
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
			<div className="surface surface--padded">
				<Calendar
					value={currentDate}
					onPanelChange={onPanelChange}
					onSelect={onSelect}
					cellRender={(current, info) =>
						info.type === "date" ? dateCellRender(current) : null
					}
					fullscreen
				/>
			</div>

			<Modal
				title="Bookings on July 22"
				open={modalVisible}
				onCancel={() => setModalVisible(false)}
				footer={null}
				width={700}
				styles={{
					body: {
						padding: "var(--space-6)",
						background: "var(--color-bg-subtle)",
					},
				}}
			>
				<ul className="booking-calendar__list">
					{selectedBookings.map((item) => {
						const clientName =
							item.client_name ||
							item.booking_user?.user_profile?.name ||
							"Unnamed";
						const isClient = !!item.user_id;
						const color = isClient ? "success" : "processing";
						const label = isClient ? "Client Booking" : "Non-client Booking";

						return (
							<li
								key={item.id}
								className="booking-calendar__item"
								onClick={() => navigate(`/viewBooking/${item.id}`)}
							>
								<Row justify="space-between" align="middle" gutter={[16, 16]}>
									<Col xs={24} sm={18}>
										<Space orientation="vertical" size={4}>
											<Space size="small">
												<Text strong className="booking-calendar__client">
													{clientName}
												</Text>
												<Tag color={color} className="booking-calendar__tag">
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
										>
											View
										</Button>
									</Col>
								</Row>
							</li>
						);
					})}
				</ul>
			</Modal>
		</Spin>
	);
};

export default MonthlyBooking;
