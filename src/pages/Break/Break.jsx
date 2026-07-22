/** @format */

import React, { useEffect, useState } from "react";
import { GetAllBreaks } from "../../services/Api/leaveRequestApi";
import { Table, DatePicker, Tag } from "antd";
import "./Break.css";
import { useNavigate } from "react-router";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import TextField from "@mui/material/TextField";
import dayjs from "@/lib/dayjs";

dayjs.extend(utc);
dayjs.extend(timezone);

const Break = () => {
	const navigate = useNavigate();
	const [breakData, setBreakData] = useState([]);
	const [loading, setLoading] = useState(false);
	const [selectedDate, setSelectedDate] = useState(dayjs());
	const [searchTerm, setSearchTerm] = useState("");

	const getData = async () => {
		try {
			setLoading(true);
			const formData = {
				date: selectedDate.format("YYYY-MM-DD"),
			};
			const result = await GetAllBreaks(formData);
			const dataWithIndex = result.data.data.map((item, index) => ({
				...item,
				autoIncrementId: index + 1,
			}));
			setBreakData(dataWithIndex);
		} catch (e) {
			console.error("Failed to fetch breaks:", e);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		getData();
	}, [selectedDate]);

	const columns = [
		{
			title: "S.No.",
			dataIndex: "autoIncrementId",
			key: "sno",
			width: "5%",
			sorter: (a, b) => a.autoIncrementId - b.autoIncrementId,
		},
		{
			title: "Employee Name",
			dataIndex: "user_name",
			key: "name",
			width: "20%",
			sorter: (a, b) => a.user_name.localeCompare(b.user_name),
		},
		{
			title: "Role",
			dataIndex: "role_id",
			key: "role",
			width: "15%",
			render: (role_id) => {
				const roleMap = {
					7: "Inspector / Supervisor",
					8: "QA Technician",
					9: "Cleaner",
				};
				return roleMap[role_id] || "Unknown";
			},
		},
		{
			title: "Date",
			key: "date",
			width: "10%",
			render: (_, record) => {
				const breakDate = record.breaks?.[0]?.break_start_est
					? dayjs
							.utc(record.breaks[0].break_start_est)
							.local()
							.format("MM-DD-YYYY")
					: dayjs(selectedDate).format("MM-DD-YYYY");
				return breakDate;
			},
		},
		{
			title: "No. of Breaks",
			dataIndex: "break_count",
			key: "break_count",
			width: "10%",
			align: "center",
		},
		{
			title: "Clock In",
			key: "clock_in",
			render: (_, record) =>
				record.breaks?.[0]?.attendance?.clock_in
					? dayjs.utc(record.breaks[0].attendance.clock_in).format("hh:mm A")
					: "---",
		},
		{
			title: "Clock Out",
			key: "clock_out",
			render: (_, record) =>
				record.breaks?.[0]?.attendance?.clock_out
					? dayjs.utc(record.breaks[0].attendance.clock_out).format("hh:mm A")
					: "---",
		},
	];

	const expandedRowRender = (record) => {
		if (!record.breaks || record.breaks.length === 0) return <p>No breaks</p>;

		return (
			<Table
				columns={[
					{
						title: "Break Start",
						dataIndex: "break_start_est",
						key: "start",
						render: (break_start_est) =>
							break_start_est
								? dayjs.utc(break_start_est).format("hh:mm A")
								: "---",
					},
					{
						title: "Break End",
						dataIndex: "break_end_est",
						key: "end",
						render: (break_end_est) =>
							break_end_est ? (
								dayjs.utc(break_end_est).format("hh:mm A")
							) : (
								<Tag color="orange">Ongoing</Tag>
							),
					},
					{
						title: "Duration (min)",
						dataIndex: "duration_minutes",
						key: "duration",
						render: (val) => val || "--",
					},
					{
						title: "Status",
						dataIndex: "status",
						key: "status",
						render: (val) => {
							const color =
								val === "active"
									? "green"
									: val === "completed"
									? "blue"
									: "default";
							return <Tag color={color}>{val.toUpperCase()}</Tag>;
						},
					},
				]}
				dataSource={record.breaks.map((b, i) => ({ key: i, ...b }))}
				pagination={false}
				size="small"
			/>
		);
	};

	return (
		<div>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					marginBottom: "20px",
				}}
			>
				<div>
					<h3 className="page-title">BREAK MONITORING</h3>
					<p className="page-sub-title">View Employee Breaks</p>
				</div>

				<div style={{ display: "flex", gap: "10px" }}>
					<DatePicker
						format="MM/DD/YYYY"
						value={selectedDate}
						onChange={(date) => setSelectedDate(date)}
						style={{ width: 200, marginTop: "15px" }}
					/>

					<span className="p-input-icon-left" style={{ marginTop: "15px" }}>
						<i className="pi pi-search" />
						<InputText
							type="search"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							placeholder="Search by name"
							style={{ width: 200, height: "52px" }}
						/>
					</span>
				</div>
			</div>

			<Table
				columns={columns}
				dataSource={breakData.filter((item) =>
					item.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
				)}
				expandedRowRender={expandedRowRender}
				// rowExpandable={(record) => record.breaks && record.breaks.length > 0}

				rowKey="user_id"
				loading={loading}
				pagination={{ pageSize: 50 }}
			/>
		</div>
	);
};

export default Break;
