/** @format */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import Box from "@mui/material/Box";
import { Select, Tooltip, message, Table, Drawer } from "antd";
import { GetAllReports, UpdateReport } from "../../services/Api/ReportApi";
import dayjs from "@/lib/dayjs";
import Button from "@mui/material/Button";
import { BASE_URL_IMAGE } from "../../services/Host";

const Report = () => {
	const navigate = useNavigate();
	const [serviceData, setServiceData] = useState([]);
	const [loading, setLoading] = useState(false);
	const [selectedStatus, setSelectedStatus] = useState({});
	const [drawerVisible, setDrawerVisible] = useState(false);
	const [selectedReport, setSelectedReport] = useState(null);

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
		// {
		// 	title: "Type",
		// 	dataIndex: "report_type",
		// 	width: "15%",
		// },
		{
			title: "Reported By",
			dataIndex: ["report_user", "user_profile", "name"],
			width: "15%",
		},

		{
			title: "Booking Date",
			dataIndex: ["report_booking", "date"],
			key: "date_and_time",
			width: "15%",
			render: (date) => (date ? dayjs(date).format("MM/DD/YYYY") : "N/A"),
		},
		{
			title: "Reason",
			dataIndex: "report_reason",
			width: "25%",
			render: (text) =>
				text ? (
					<Tooltip title={text}>
						<span>{text.length > 20 ? `${text.slice(0, 20)}...` : text}</span>
					</Tooltip>
				) : (
					"---"
				),
		},
		{
			title: "Status",
			dataIndex: "status",
			width: "15%",
			render: (status, record) => {
				// Default selected status for each record (if not set)
				const currentStatus = selectedStatus[record.id] || status;

				const handleStatusChange = async (value) => {
					try {
						// Show loading indicator
						message.loading({
							content: "Updating status...",
							key: "status_update",
						});

						// Call the API to update the status
						await UpdateReport({
							reportId: record.id,
							action: value,
						});

						// Update the selected status
						setSelectedStatus((prevState) => ({
							...prevState,
							[record.id]: value, // Set the updated status for this record
						}));

						// Show success message
						message.success({
							content: `Status updated to ${value}.`,
							key: "status_update",
						});

						// Optionally, reload data to reflect changes from the server
						getData(tableParams);
					} catch (error) {
						// Handle any errors
						message.error({
							content: "Failed to update status. Please try again.",
							key: "status_update",
						});
					}
				};

				// Show Select dropdown if status is PENDING
				if (status === "PENDING") {
					return (
						<Select
							value={currentStatus}
							style={{ width: 150 }}
							onChange={handleStatusChange}
						>
							<Select.Option value="COMPLETED">COMPLETED</Select.Option>
						</Select>
					);
				} else {
					// Show static status if it's not PENDING
					return (
						<span
							style={{
								fontWeight: "bold",
								color: status === "COMPLETED" ? "green" : "red",
							}}
						>
							{status}
						</span>
					);
				}
			},
		},
		{
			title: "Reported On",
			dataIndex: "created_at",
			width: "30%",
			render: (date) =>
				date ? dayjs(date).format("MM/DD/YYYY HH:mm A") : "N/A",
		},
		{
			title: "Action",
			dataIndex: "action",
			width: "10%",
			render: (_, record) => (
				<Button
					icon="pi pi-eye"
					rounded
					outlined
					severity="warning"
					style={{ borderRadius: "25px" }}
					onClick={() => {
						setSelectedReport(record);
						setDrawerVisible(true);
					}}
				></Button>
			),
		},
	];

	const formatDateTime = (date, time) => {
		if (!date || !time) return "---";
		const dateObj = new Date(`${date}T${time}`);
		return dateObj.toLocaleString("en-US", {
			day: "2-digit",
			month: "short",
			year: "numeric",
			hour: "numeric",
			minute: "2-digit",
			hour12: true,
		});
	};

	const getData = async (params = {}) => {
		try {
			setLoading(true);

			const { pagination } = params;

			// Fetch appointments with pagination and sorting
			const result = await GetAllReports(localStorage.getItem("adminToken"));

			// Adding index for serial number
			const newData = result.data.map((item, index) => ({
				...item,
				index: index + 1 + (pagination.current - 1) * pagination.pageSize, // Adjusting index based on pagination
			}));

			// Update state with fetched data
			setServiceData(newData);
			setTableParams({
				...tableParams,
				pagination: {
					...pagination,
					total: result.count,
				},
			});
		} catch (e) {
			// Log the full error object to inspect the structure
			console.log("Error object: ", e);

			if (e.response && e.response.status === 401) {
				navigate("/error401");
				console.log("You do not have access to this page as a sub-admin.");
			} else if (e.response && e.response.status === 500) {
				// Handling specific 500 error
				const errorMessage = e.response.data?.message || e.response.message;
				if (errorMessage === "jwt expired") {
					message.error("Session Expired");
					navigate("/login");
				} else {
					console.log("Server error. Please try again later.");
				}
			} else {
				console.log("Error loading data. Please try again later.");
			}
		} finally {
			setLoading(false);
		}
	};

	const handleTableChange = (pagination, filters, sorter) => {
		setTableParams({
			pagination,
			sortField: sorter.field,
			sortOrder: sorter.order,
		});
	};

	useEffect(() => {
		getData({
			pagination: tableParams.pagination,
			sortField: tableParams.sortField,
			sortOrder: tableParams.sortOrder,
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<Box>
			<Box
				display="flex"
				justifyContent="space-between"
				alignItems="center"
				marginBottom="20px"
			>
				<div>
					<h3 className="page-title">REPORT Management</h3>
					<p className="page-sub-title">View All Reports</p>
				</div>
			</Box>
			<Table
				columns={columns}
				rowKey={(record) => record.id}
				dataSource={serviceData}
				pagination={tableParams.pagination}
				loading={loading}
				onChange={handleTableChange}
			/>

			<Drawer
				width={400}
				visible={drawerVisible}
				onClose={() => setDrawerVisible(false)}
				title="Report Details"
			>
				<Box padding={2}>
					{selectedReport && (
						<>
							<p>
								<strong>Reported By:</strong>{" "}
								{selectedReport?.report_user?.user_profile?.name}
							</p>
							<p>
								<strong>Service Name:</strong>{" "}
								{selectedReport?.report_booking?.service_booking?.name}
							</p>
							<p>
								<strong>Reason:</strong> {selectedReport?.report_reason}
							</p>
							<p>
								<strong>Status:</strong> {selectedReport?.status}
							</p>
							<p>
								<strong>Images:</strong>
							</p>
							{selectedReport?.report_booking?.booking_attachment?.length >
							0 ? (
								selectedReport.report_booking.booking_attachment.map(
									(img, index) => (
										<img
											key={index}
											src={`https://node.socialsanitation.com/api/v1/images/${img.file_name}`}
											alt="Report Attachment"
											crossOrigin="anonymous"
											style={{
												width: "100%",
												height: "150px",
												objectFit: "cover",
												marginTop: "10px",
												marginBottom: "10px",
												borderRadius: "8px",
											}}
										/>
									),
								)
							) : (
								<p>No images available</p>
							)}
						</>
					)}
				</Box>
			</Drawer>
		</Box>
	);
};

export default Report;
