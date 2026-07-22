/** @format */

import dayjs from "@/lib/dayjs";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import { GetAttendanceByUserId } from "../../services/Api/leaveRequestApi";
import { Table, Select, DatePicker, Image } from "antd";
import { BASE_URL_IMAGE } from "../../services/Host";

const { RangePicker } = DatePicker;

const Attendance = () => {
	const { id } = useParams();
	const [attendanceData, setAttendanceData] = useState([]);
	const [loading, setLoading] = useState(false);
	const [filterType, setFilterType] = useState("TODAY");
	const [dateRange, setDateRange] = useState([]);
	const [tableParams, setTableParams] = useState({
		pagination: {
			current: 1,
			pageSize: 100,
		},
		sortField: null,
		sortOrder: null,
	});

	const handleTableChange = (pagination, filters, sorter) => {
		setTableParams({
			pagination,
			filters,
			sortField: sorter.field,
			sortOrder: sorter.order,
		});
	};
	// 🔹 Fetch Attendance Data
	const getData = async (booking_status) => {
		try {
			setLoading(true);
			const formData = { id, filterType };
			if (filterType === "CUSTOM" && dateRange.length === 2) {
				formData.start_date = dateRange[0];
				formData.end_date = dateRange[1];
			}

			let result = await GetAttendanceByUserId(id, formData);
			// Add an auto-increment ID to each booking
			const dataWithIndex = result.data.data.map((item, index) => ({
				...item,
				autoIncrementId: index + 1,
			}));
			setAttendanceData(dataWithIndex);
			console.log("userbooking==>", dataWithIndex);
		} catch (e) {
			console.log(e);
		} finally {
			setLoading(false);
		}
	};

	// 🔹 Fetch Data on Load
	useEffect(() => {
		if (id) {
			getData(filterType);
		}
	}, [id, filterType, dateRange]);

	// 🔹 Handle Filter Change
	const handleFilterChange = (value) => {
		setFilterType(value);

		// Reset Date Range when switching filters
		if (value !== "CUSTOM") {
			setDateRange([]);
		}
	};

	const handleDateRangeChange = (dates, dateStrings) => {
		setDateRange(dateStrings);
	};
	// 🔹 Define Columns for Table
	const columns = [
		{
			title: "Date",
			dataIndex: "date",
			key: "date",
			width: "10%",
			render: (date) => dayjs(date).format("MM/DD/YYYY"),
		},
		{
			title: "Status",
			dataIndex: "status",
			key: "status",
			render: (status) => {
				let color =
					status === "PRESENT"
						? "green"
						: status === "ON LEAVE"
						? "blue"
						: "red";
				return <span style={{ color, fontWeight: "bold" }}>{status}</span>;
			},
		},
		{
			title: "Clock In",
			dataIndex: "clock_in",
			key: "clock_in",
			render: (clock_in) =>
				clock_in ? dayjs.utc(clock_in).format("hh:mm A") : "---",
		},
		{
			title: "Clock Out",
			dataIndex: "clock_out",
			key: "clock_out",
			render: (clock_out) =>
				clock_out ? dayjs.utc(clock_out).format("hh:mm A") : "---",
		},
		{
			title: "Clock-In Image",
			dataIndex: "clock_in_image_uri",
			key: "clock_in_image_uri",
			render: (uri) =>
				uri ? (
					<Image
						src={`${BASE_URL_IMAGE}${uri}`}
						alt="Clock-In"
						crossOrigin="anonymous"
						width={50}
						height={50}
						style={{
							objectFit: "cover",
							borderRadius: "8px",
							boxShadow: "0 0 6px rgba(0,0,0,0.1)",
						}}
					/>
				) : (
					<span>---</span>
				),
		},

		{
			title: "Clock-Out Image",
			dataIndex: "clock_out_image_uri",
			key: "clock_out_image_uri",
			render: (uri) =>
				uri ? (
					<Image
						src={`${BASE_URL_IMAGE}${uri}`}
						alt="Clock-Out"
						crossOrigin="anonymous"
						width={50}
						height={50}
						style={{
							objectFit: "cover",
							borderRadius: "8px",
							boxShadow: "0 0 6px rgba(0,0,0,0.1)",
						}}
					/>
				) : (
					<span>---</span>
				),
		},
		{
			title: "Total Hours",
			dataIndex: "total_hours",
			key: "total_hours",
			render: (total_hours, record) =>
				record.status === "PRESENT" ? total_hours || "0" : "---", // Show total hours only if Present
		},

		{
			title: "Leave Reason",
			dataIndex: "leave_reason",
			key: "leave_reason",
			render: (leave_reason) => (leave_reason ? leave_reason : "---"),
		},
	];

	return (
		<div>
			<div
				style={{
					display: "flex",
					flexDirection: "row",
					justifyContent: "space-between",
					marginBottom: "20px",
				}}
			>
				<div>
					<h5 style={{ marginBottom: "20px" }}>User Attendance</h5>
				</div>

				{/* 🔹 Filter Dropdown */}
				<div>
					<Select
						value={filterType}
						style={{ width: 200, marginBottom: "15px" }}
						onChange={handleFilterChange}
					>
						<Select.Option value="TODAY">Today</Select.Option>
						<Select.Option value="YESTERDAY">Yesterday</Select.Option>
						<Select.Option value="THIS_WEEK">This Week</Select.Option>
						<Select.Option value="THIS_MONTH">This Month</Select.Option>
						<Select.Option value="PREVIOUS_MONTH">Previous Month</Select.Option>
						<Select.Option value="CUSTOM">Custom Date Range</Select.Option>
					</Select>

					{/* 🔹 Show Date Pickers when "CUSTOM" is selected */}
					{filterType === "CUSTOM" && (
						<RangePicker
							style={{ marginLeft: "10px", marginBottom: "15px" }}
							onChange={handleDateRangeChange}
							disabledDate={(current) =>
								current && current > dayjs().endOf("day")
							}
						/>
					)}
				</div>
			</div>

			{/* 🔹 Attendance Table */}
			<Table
				columns={columns}
				dataSource={attendanceData}
				loading={loading}
				pagination={tableParams.pagination}
				onChange={handleTableChange}
			/>
		</div>
	);
};

export default Attendance;
