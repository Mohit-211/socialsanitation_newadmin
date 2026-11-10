import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Select, message, Table, Drawer, Tooltip } from "antd";
import { GetAllReports, UpdateReport } from "@/services/api/reportApi";
import { IMAGE_BASE_URL } from "@/config/env";
import dayjs from "@/lib/dayjs";
import { Eye } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import IconAction from "@/components/IconAction";

const ComplaintsPage = () => {
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
					} catch {
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
							options={[{ value: "COMPLETED", label: "COMPLETED" }]}
						/>
					);
				} else {
					// Show static status if it's not PENDING
					return (
						<span
							style={{
								fontWeight: "var(--font-weight-bold)",
								color:
									status === "COMPLETED"
										? "var(--color-success-strong)"
										: "var(--color-error)",
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
				<IconAction
					icon={Eye}
					title="View Report"
					onClick={() => {
						setSelectedReport(record);
						setDrawerVisible(true);
					}}
				/>
			),
		},
	];

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
			console.error("Error object: ", e);

			if (e.response && e.response.status === 401) {
				navigate("/error401");
				console.error("You do not have access to this page as a sub-admin.");
			} else if (e.response && e.response.status === 500) {
				// Handling specific 500 error
				const errorMessage = e.response.data?.message || e.response.message;
				if (errorMessage === "jwt expired") {
					message.error("Session Expired");
					navigate("/login");
				} else {
					console.error("Server error. Please try again later.");
				}
			} else {
				console.error("Error loading data. Please try again later.");
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
		<div>
			{/* HEADER */}
			<PageHeader title="REPORT MANAGEMENT" subtitle="View all reports" />

			<Table
				columns={columns}
				rowKey={(record) => record.id}
				dataSource={serviceData}
				pagination={tableParams.pagination}
				loading={loading}
				onChange={handleTableChange}
				bordered
				size="middle"
			/>

			<Drawer
				size={400}
				open={drawerVisible}
				onClose={() => setDrawerVisible(false)}
				title="Report Details"
			>
				<div style={{ padding: "var(--space-4)" }}>
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
											src={`${IMAGE_BASE_URL}${img.file_name}`}
											alt="Report Attachment"
											crossOrigin="anonymous"
											style={{
												width: "100%",
												height: 150,
												objectFit: "cover",
												margin: "10px 0",
												borderRadius: "var(--radius-md)",
											}}
										/>
									),
								)
							) : (
								<p>No images available</p>
							)}
						</>
					)}
				</div>
			</Drawer>
		</div>
	);
};

export default ComplaintsPage;