/** @format */

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
	Table,
	Card,
	Typography,
	Button,
	Descriptions,
	Space,
	Modal,
} from "antd";
import dayjs from "@/lib/dayjs";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { GetBookingOverviewById } from "../../services/Api/BookingApi";
import { EnvironmentOutlined } from "@ant-design/icons";
const { Title } = Typography;

const DayDetail = () => {
	const { booking_id } = useParams();
	const navigate = useNavigate();
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(false);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedBreaks, setSelectedBreaks] = useState([]);
	const [selectedEmployeeName, setSelectedEmployeeName] = useState("");

	useEffect(() => {
		if (booking_id) fetchData(booking_id);
	}, [booking_id]);

	const fetchData = async (id) => {
		try {
			setLoading(true);
			const res = await GetBookingOverviewById(id);
			setData(res?.data?.data);
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	const haversineDistance = (lat1, lon1, lat2, lon2) => {
		if (!lat1 || !lon1 || !lat2 || !lon2) return "---";

		const toRad = (x) => (x * Math.PI) / 180;
		const R = 6371; // Earth radius in km

		const dLat = toRad(lat2 - lat1);
		const dLon = toRad(lon2 - lon1);

		const a =
			Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.cos(toRad(lat1)) *
				Math.cos(toRad(lat2)) *
				Math.sin(dLon / 2) *
				Math.sin(dLon / 2);

		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		return `${(R * c).toFixed(2)} km`;
	};

	const formatDuration = (minutes) => {
		if (Math.abs(minutes) <= 5) return "No delay";

		const hrs = Math.floor(Math.abs(minutes) / 60);
		const mins = Math.abs(minutes) % 60;

		if (hrs > 0) {
			return `${hrs} hour${hrs > 1 ? "s" : ""}${
				mins > 0 ? ` ${mins} minute${mins !== 1 ? "s" : ""}` : ""
			}`;
		}
		return `${mins} minute${mins !== 1 ? "s" : ""}`;
	};

	const columns = [
		{
			title: "Sr. No",
			render: (_, __, index) => index + 1,
		},
		{
			title: "Employee Name",
			dataIndex: "name",
		},
		{
			title: "Clock In",
			dataIndex: "clock_in",
			key: "clock_in",
			render: (clock_in) =>
				clock_in
					? dayjs(`${data.date} ${clock_in}`, "YYYY-MM-DD HH:mm:ss").format(
							"hh:mm A"
					  )
					: "---",
		},

		{
			title: "Clock Out",
			dataIndex: "clock_out",
			key: "clock_out",
			render: (clock_out) =>
				clock_out
					? dayjs(`${data.date} ${clock_out}`, "YYYY-MM-DD HH:mm:ss").format(
							"hh:mm A"
					  )
					: "---",
		},
		{
			title: "Clock-In Delay",
			key: "clock_in_delay",
			render: (_, record) => {
				if (!record.clock_in || !data?.date || !data?.time) return "---";

				const bookingTime = dayjs(
					`${data.date} ${data.time}`,
					"YYYY-MM-DD HH:mm:ss"
				);
				const clockInTime = dayjs(
					`${data.date} ${record.clock_in}`,
					"YYYY-MM-DD HH:mm:ss"
				);

				if (!bookingTime.isValid() || !clockInTime.isValid()) return "---";

				const diff = clockInTime.diff(bookingTime, "minute");

				if (Math.abs(diff) <= 5) return "No delay";

				const hrs = Math.floor(Math.abs(diff) / 60);
				const mins = Math.abs(diff) % 60;
				const label = diff < 0 ? "early" : "late";

				if (hrs > 0) {
					return `${hrs} hour${hrs > 1 ? "s" : ""}${
						mins > 0 ? ` ${mins} minute${mins !== 1 ? "s" : ""}` : ""
					} ${label}`;
				}
				return `${mins} minute${mins !== 1 ? "s" : ""} ${label}`;
			},
		},
		{
			title: "Total Hours",
			dataIndex: "total_hours",
			key: "total_hours",
			render: (text) => text || "---",
		},
		{
			title: "Breaks",
			key: "breaks",
			render: (_, record) =>
				record.number_of_breaks > 0 ? (
					<Button
						size="small"
						type="link"
						onClick={() => {
							setSelectedBreaks(record.breaks);
							setSelectedEmployeeName(record.name);
							setIsModalOpen(true);
						}}
					>
						View ({record.number_of_breaks})
					</Button>
				) : (
					"---"
				),
		},

		{
			title: "Clock-in Distance",
			key: "clock_in_distance",
			render: (_, record) => {
				const lat = parseFloat(record.clock_in_lat);
				const lng = parseFloat(record.clock_in_lang);
				const distance = haversineDistance(
					parseFloat(data.address?.address_lat),
					parseFloat(data.address?.address_long),
					lat,
					lng
				);

				return lat && lng ? (
					<>
						{distance}{" "}
						<a
							href={`https://www.google.com/maps?q=${lat},${lng}`}
							target="_blank"
							rel="noopener noreferrer"
							title="View on Map"
						>
							<EnvironmentOutlined style={{ color: "#1890ff" }} />
						</a>
					</>
				) : (
					"---"
				);
			},
		},
		{
			title: "Clock-out Distance",
			key: "clock_out_distance",
			render: (_, record) => {
				const lat = parseFloat(record.clock_out_lat);
				const lng = parseFloat(record.clock_out_lang);
				const distance = haversineDistance(
					parseFloat(data.address?.address_lat),
					parseFloat(data.address?.address_long),
					lat,
					lng
				);

				return lat && lng ? (
					<>
						{distance}{" "}
						<a
							href={`https://www.google.com/maps?q=${lat},${lng}`}
							target="_blank"
							rel="noopener noreferrer"
							title="View on Map"
						>
							<EnvironmentOutlined style={{ color: "#1890ff" }} />
						</a>
					</>
				) : (
					"---"
				);
			},
		},
	];

	if (!data) return null;

	return (
		<Card style={{ margin: 20 }}>
			<Space
				style={{
					marginBottom: 20,
					display: "flex",
					flexDirection: "row",
					justifyContent: "space-between",
				}}
			>
				<Title level={4} style={{ margin: 0 }}>
					Booking Overview – {data.booking_unique_id}
				</Title>
				<Button
					type="default"
					icon={<ArrowLeftOutlined />}
					onClick={() => navigate(-1)}
				>
					Back
				</Button>
			</Space>

			<Descriptions
				bordered
				column={1}
				size="small"
				style={{ marginBottom: 30 }}
			>
				<Descriptions.Item label="Booking Date">
					{dayjs(data.date).format("DD MMMM, YYYY")}
				</Descriptions.Item>
				<Descriptions.Item label="Booking Time">
					{dayjs(data.time, "HH:mm:ss").format("hh:mm A")}
				</Descriptions.Item>

				<Descriptions.Item label="Booking Name">
					{data.booking_name}
				</Descriptions.Item>
				<Descriptions.Item label="Client Name">
					{data.client_name}
				</Descriptions.Item>
				<Descriptions.Item label="Address">
					{data.address?.address_line_1
						? [
								data.address.address_line_1,
								data.address.city,
								data.address.state,
								data.address.country,
						  ]
								.filter(Boolean)
								.join(", ")
						: "N/A"}
				</Descriptions.Item>
			</Descriptions>

			<Table
				columns={columns}
				dataSource={data.employees}
				rowKey="id"
				loading={loading}
				pagination={false}
				bordered
			/>

			<Modal
				width={800}
				title={`Break Details – ${selectedEmployeeName}`}
				open={isModalOpen}
				footer={null}
				onCancel={() => setIsModalOpen(false)}
			>
				{selectedBreaks?.length > 0 ? (
					<Table
						columns={[
							{
								title: "Break Start (EST)",
								dataIndex: "break_start_est",
								key: "break_start_est",
							},
							{
								title: "Break End (EST)",
								dataIndex: "break_end_est",
								key: "break_end_est",
							},
							{
								title: "Duration",
								dataIndex: "duration_minutes",
								key: "duration_minutes",
								render: (mins) => `${mins} minutes`,
							},
							{
								title: "Status",
								dataIndex: "status",
								key: "status",
								render: (status) => status || "---",
							},
							{
								title: "Break Start Location",
								key: "break_start_lat",
								render: (_, record) => {
									if (record.break_start_lat && record.break_start_lng) {
										return (
											<a
												href={`https://www.google.com/maps?q=${record.break_start_lat},${record.break_start_lng}`}
												target="_blank"
												rel="noopener noreferrer"
											>
												View on Map
											</a>
										);
									}
									return "---";
								},
							},

							{
								title: "Break End Location",
								key: "break_end_lat",
								render: (_, record) => {
									if (record.break_end_lat && record.break_end_lng) {
										return (
											<a
												href={`https://www.google.com/maps?q=${record.break_end_lat},${record.break_end_lng}`}
												target="_blank"
												rel="noopener noreferrer"
											>
												View on Map
											</a>
										);
									}
									return "---";
								},
							},
						]}
						dataSource={selectedBreaks}
						rowKey={(record, index) => index}
						pagination={false}
						bordered
						size="small"
					/>
				) : (
					<p>No break data available.</p>
				)}
			</Modal>
		</Card>
	);
};

export default DayDetail;
