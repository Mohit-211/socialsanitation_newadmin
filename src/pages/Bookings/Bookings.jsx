/** @format */

import React, { useEffect, useState } from "react";
import { Tabs, Tab } from "react-bootstrap";
import { Box } from "@mui/material";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import {
	Tag,
	Table,
	Space,
	Tooltip,
	message,
	Dropdown,
	Spin,
	Image,
	Modal,
} from "antd";
import "./Bookings.css";
import TextField from "@mui/material/TextField";
import { BASE_URL_IMAGE } from "../../services/Host";
import {
	GetBookingRequestCount,
	GetUserBooking,
	DeleteBooking,
	GetBookingById,
} from "../../services/Api/BookingApi";
import { Badge } from "antd";
import { DeleteOutlined, PictureOutlined } from "@ant-design/icons";
import dayjs from "@/lib/dayjs";

const Bookings = () => {
	const navigate = useNavigate();
	const [bookingData, setBookingData] = useState([]);
	const [allBookingData, setAllBookingData] = useState([]); // ALL bookings
	const [searchText, setSearchText] = useState(""); // for tracking current search

	const [loading, setLoading] = useState(false);
	const [activeTab, setActiveTab] = useState("PENDING");
	const [nestedTab, setNestedTab] = useState("all");
	// const [bookingRequestCount, setBookingRequestCount] = useState(0);
	const [tableParams, setTableParams] = useState({
		pagination: {
			current: 1,
			pageSize: 100,
		},
		sortField: null,
		sortOrder: null,
	});
	const [galleryVisible, setGalleryVisible] = useState(false);
	const [galleryLoading, setGalleryLoading] = useState(false);
	const [beforeServiceImages, setBeforeServiceImages] = useState([]);
	const [afterServiceImages, setAfterServiceImages] = useState([]);
	const [originalData, setOriginalData] = useState([]);

	const handleOpenGallery = async (bookingId) => {
		setGalleryVisible(true);
		setGalleryLoading(true);
		try {
			const res = await GetBookingById(bookingId);
			const booking = res.data.data;
			const attachments = booking.booking_attachment || [];

			const beforeImgs = attachments.filter(
				(a) => a.title === "BEFORE SERVICE",
			);
			const afterImgs = attachments.filter((a) => a.title === "AFTER SERVICE");

			setBeforeServiceImages(beforeImgs);
			setAfterServiceImages(afterImgs);
		} catch (err) {
			console.error("Failed to fetch booking gallery:", err);
			message.error("Failed to load images");
		} finally {
			setGalleryLoading(false);
		}
	};

	const getData = async (booking_status, period) => {
		try {
			setLoading(true);
			const result = await GetUserBooking(
				localStorage.getItem("adminToken"),
				booking_status,
				period, // Pass the period parameter only if needed
			);
			const newData = result.data.data.map((item, index) => ({
				...item,
				index: index + 1,
			}));
			setBookingData(newData);
			setOriginalData(newData);
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

	// const fetchBookingRequestCount = async () => {
	// 	try {
	// 		const result = await GetBookingRequestCount(
	// 			localStorage.getItem("adminToken")
	// 		);
	// 		const count = result.data.data.count;
	// 		setBookingRequestCount(count > 0 ? count : null); // Set count or null
	// 	} catch (e) {
	// 		console.log(e);
	// 	}
	// };

	// const fetchAllBookings = async () => {
	// 	try {
	// 		const statuses = [
	// 			"PENDING",
	// 			"UPCOMING",
	// 			"ONGOING",
	// 			"COMPLETED",
	// 			"CANCELLED",
	// 		];
	// 		let all = [];

	// 		for (const status of statuses) {
	// 			const result = await GetUserBooking(
	// 				localStorage.getItem("adminToken"),
	// 				status,
	// 				"all"
	// 			);
	// 			const data = result.data.data.map((item, index) => ({
	// 				...item,
	// 				index: all.length + index + 1,
	// 			}));
	// 			all = [...all, ...data];
	// 		}
	// 		setAllBookingData(all);
	// 	} catch (e) {
	// 		console.error("Error fetching all bookings:", e);
	// 	}
	// };

	useEffect(() => {
		getData(activeTab, nestedTab);
		// fetchBookingRequestCount();
		// fetchAllBookings(); // fetch once for search
	}, [activeTab, nestedTab]);

	const navigateToViewBooking = (id) => {
		navigate(`/viewBooking/${id}`);
	};

	const navigateToEditBooking = (id) => {
		navigate(`/editBooking/${id}`);
	};

	const handleTableChange = (pagination, filters, sorter) => {
		setTableParams({
			pagination,
			filters,
			sortField: sorter.field,
			sortOrder: sorter.order,
		});
	};

	const tabsContent = [
		{
			label: (
				<span>
					Booking Request{" "}
					{/* {bookingRequestCount !== null && (
						<Badge count={bookingRequestCount} status="error" size="small" />
					)} */}
				</span>
			),
			key: "PENDING",
		},
		{ label: "Upcoming Bookings", key: "UPCOMING" },
		{ label: "Ongoing Bookings", key: "ONGOING" },
		{ label: "Booking History", key: "COMPLETED" },
		{ label: "Cancelled Bookings", key: "CANCELLED" },
	];

	const nestedTabsContent = {
		UPCOMING: [
			{ label: "All", key: "all" },
			{ label: "Today", key: "today" },
			{ label: "This Week", key: "current_week" },
			{ label: "This Month", key: "current_month" },
		],
		COMPLETED: [
			{ label: "All", key: "all" },
			{ label: "Past 30 Days", key: "past_30_days" },
			{ label: "Past 90 Days", key: "past_90_days" },
		],
		DELETED: [], // No nested tabs for DELETED
	};

	const columns = [
		{
			title: "S.No.",
			dataIndex: "index",
			 width: 70,
			// sorter: (a, b) => a.index - b.index,
		},
		{
			title: "Booking Type",
			key: "booking_type",
			 width: 100,
			render: (_, record) => {
				const isClient = !!record.user_id;
				const color = isClient ? "green" : "blue";
				const label = isClient ? "Client Booking" : "Non Client Booking";
				return <Tag color={color}>{label}</Tag>;
			},
		},
		{
			title: "Booking Name",
			dataIndex: "booking_name",
			 width: 100,
			key: "booking_name",
			render: (text) => text || "--",
		},
		{
			title: "Client Name",
			key: "name",
			 width: 100,
			render: (_, record) => {
				const name =
					record.booking_user?.user_profile?.name || record.client_name || "--";
				return name;
			},
		},
			{
			title: "Date",
			dataIndex: "date",
			key: "date",
			width: 100,
			render: (date) => dayjs.parseZone(date).format("ddd,MM/DD/YYYY"),
		},

		// {
		// 	title: "Date",
		// 	dataIndex: "date",
		// 	key: "date",
		// 	 width: 100,
		// 	render: (date) => dayjs.parseZone(date).format("MM/DD/YYYY"),
		// 	// sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
		// },
		{
			title: "Employee Assigned",
			dataIndex: "booking_employee_details",
			key: "employee_assigned",
			 width: 150,
			render: (employees) => {
				if (!employees || employees.length === 0) {
					return <span style={{ color: "red" }}>Not Assigned</span>;
				}
				const employeeNames = employees.map(
					(employee) => employee.employee_profile?.user_profile?.name,
				);
				return <span>{employeeNames.join(", ")}</span>;
			},
		},

		{
			title: "Type",
			dataIndex: ["type"],
			 width: 100,
			key: "type",
		},
		{
			title: "Booking Status",
			dataIndex: "booking_status",
			 width: 100,
			key: "status",
			render: (status) => {
				let color;
				let displayStatus = status;
				switch (status) {
					case "PENDING":
						color = "gold";
						break;
					case "SUCCESS":
						color = "green";
						displayStatus = "COMPLETED";
						break;
					case "ACCEPTED":
						color = "blue";
						break;
					case "REJECTED":
						color = "red";
						break;
					case "CANCELLED":
						color = "red";
						break;
					case "DELETED":
						color = "volcano";
						break;
					case "ONGOING":
						color = "purple";
						break;
					default:
						color = "black";
				}
				return (
					<Tag color={color} key={status}>
						{displayStatus}
					</Tag>
				);
			},
		},
		{
			title: "Actions",
			key: "actions",
			 width: 100,
			render: (text, record) => {
				return (
					<Space size="middle">
						<Tooltip title="View Image Gallery" placement="top">
							<Button
								icon={<PictureOutlined />}
								rounded
								outlined
								severity="help"
								style={{ borderRadius: "25px" }}
								onClick={() => handleOpenGallery(record.id)}
							/>
						</Tooltip>

						<Tooltip title="View Details" placement="top">
							<Button
								icon="pi pi-eye"
								rounded
								outlined
								severity="warning"
								style={{ borderRadius: "25px" }}
								onClick={() => navigateToViewBooking(record.id)}
							/>
						</Tooltip>

						{(activeTab === "PENDING" || activeTab === "UPCOMING") && (
							<Tooltip title="Update Details" placement="top">
								<Button
									icon="pi pi-pencil"
									rounded
									outlined
									style={{ borderRadius: "25px" }}
									onClick={() => navigateToEditBooking(record.id)}
								/>
							</Tooltip>
						)}

						{record.type === "Recurring Booking" ? (
							<Dropdown.Button
								icon={<DeleteOutlined />}
								placement="bottomRight"
								menu={{
									items: [
										{
											key: "this",
											label: "Delete This Event",
											onClick: () => handleDelete(record.id, "this"),
										},
										{
											key: "following",
											label: "Delete Following Events",
											onClick: () => handleDelete(record.id, "following"),
										},
										{
											key: "all",
											label: "Delete All Events",
											onClick: () => handleDelete(record.id, "all"),
										},
									],
								}}
							>
								Delete
							</Dropdown.Button>
						) : (
							<Tooltip title="Delete" placement="top">
								<Button
									icon="pi pi-trash"
									rounded
									outlined
									severity="danger"
									style={{ borderRadius: "25px" }}
									onClick={() => handleDelete(record.id, "this")}
								></Button>
							</Tooltip>
						)}
					</Space>
				);
			},
		},
	];

	const handleDelete = (id, delete_mode = "this") => {
		const formData = new FormData();
		formData.append("booking_id", id);
		formData.append("delete_mode", delete_mode); // always pass delete_mode

		DeleteBooking(formData)
			.then((res) => {
				if (res?.status === 200 && res?.data?.success) {
					message.success(res?.data?.message || "Booking deleted successfully");
					getData(activeTab, nestedTab); // refresh list
				} else {
					message.warning(res?.data?.message || "Unexpected response");
				}
			})
			.catch((error) => {
				console.error("❌ Delete Booking Error:", error);
				message.error("Failed to delete booking");
			});
	};

	const navigateToCreateAppointment = () => {
		navigate("/create-client-booking");
	};

	const navigateToMonthlyCalendar = () => {
		navigate("/monthlyCalendar");
	};

	const onSearch = (value) => {
		setSearchText(value);

		if (!value.trim()) {
			setBookingData(originalData);
			return;
		}

		const search = value.toLowerCase();

		const filtered = originalData.filter((item) => {
			return (
				item.booking_name?.toLowerCase().includes(search) ||
				item.client_name?.toLowerCase().includes(search) ||
				item.booking_user?.user_profile?.name?.toLowerCase().includes(search)
			);
		});

		setBookingData(filtered);
	};

	return (
		<Box>
			{/* Heading and tabs */}
			<div className="booking_container">
				<div>
					<h3 className="page-title">BOOKING MANAGEMENT</h3>
					<p className="page-sub-title">View User's Bookings</p>
				</div>
				<div
					className="button-group"
					style={{ display: "flex", gap: "10px", alignItems: "center" }}
				>
					<span className="p-input-icon-left">
						<i className="pi pi-search" />
						<InputText
							type="search"
							value={searchText}
							onChange={(e) => onSearch(e.target.value)}
							placeholder="Search..."
						/>
					</span>

					<Button
						label="Create Appointment"
						icon="pi pi-plus"
						severity="success"
						onClick={navigateToCreateAppointment}
					/>
					<Button
						label="View Monthly Calendar"
						icon="pi pi-calendar"
						severity="info"
						onClick={navigateToMonthlyCalendar}
					/>
				</div>
			</div>

			<div className="tabs-container">
				<Tabs
					defaultActiveKey="all"
					onSelect={(key) => {
						setActiveTab(key);
						setNestedTab("all"); // Reset nested tab to "all" when main tab changes
					}}
					activeKey={activeTab}
				>
					{tabsContent.map((tab) => (
						<Tab eventKey={tab.key} title={tab.label} key={tab.key} />
					))}
				</Tabs>
			</div>

			{/* Nested Tabs */}
			{nestedTabsContent[activeTab] &&
				nestedTabsContent[activeTab].length > 0 && (
					<div className="nested-tabs">
						<Tabs
							defaultActiveKey="all"
							onSelect={(key) => setNestedTab(key)}
							activeKey={nestedTab}
						>
							{nestedTabsContent[activeTab].map((tab) => (
								<Tab eventKey={tab.key} title={tab.label} key={tab.key} />
							))}
						</Tabs>
					</div>
				)}

			{/* Table component */}
			<div className="table-scroll-wrapper">
				<Table
					columns={columns}
					rowKey={(record) => record.id}
					dataSource={bookingData}
					pagination={tableParams.pagination}
					loading={loading}
					onChange={handleTableChange}
					scroll={{ x: 'max-content', y: 840 }}
					// scroll={{ x: 1500 }} // set a min width threshold if you prefer
				/>
			</div>

			<Modal
				title="Service Image Gallery"
				open={galleryVisible}
				onCancel={() => setGalleryVisible(false)}
				footer={null}
				width={800}
			>
				{galleryLoading ? (
					<div style={{ textAlign: "center", padding: "50px 0" }}>
						<Spin size="large" />
					</div>
				) : (
					<div>
						<h4 style={{ marginTop: 10 }}>Before Service</h4>
						{beforeServiceImages?.length > 0 ? (
							<div
								style={{
									display: "flex",
									flexWrap: "wrap",
									gap: "12px", // ← space between images
									marginTop: "10px",
								}}
							>
								<Image.PreviewGroup>
									{beforeServiceImages.map((img) => (
										<Image
											key={img.id}
											src={`${BASE_URL_IMAGE}${img.file_name}`}
											alt="Before Service"
											width={120}
											style={{
												borderRadius: "10px",
												objectFit: "cover",
												boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
											}}
											crossOrigin="anonymous"
										/>
									))}
								</Image.PreviewGroup>
							</div>
						) : (
							<p style={{ color: "red" }}>No images uploaded</p>
						)}

						<h4 style={{ marginTop: 20 }}>After Service</h4>
						{afterServiceImages?.length > 0 ? (
							<div
								style={{
									display: "flex",
									flexWrap: "wrap",
									gap: "12px",
									marginTop: "10px",
								}}
							>
								<Image.PreviewGroup>
									{afterServiceImages.map((img) => (
										<Image
											key={img.id}
											src={`${BASE_URL_IMAGE}${img.file_name}`}
											alt="After Service"
											width={120}
											style={{
												borderRadius: "10px",
												objectFit: "cover",
												boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
											}}
											crossOrigin="anonymous"
										/>
									))}
								</Image.PreviewGroup>
							</div>
						) : (
							<p style={{ color: "red" }}>No images uploaded</p>
						)}
					</div>
				)}
			</Modal>
		</Box>
	);
};

export default Bookings;
