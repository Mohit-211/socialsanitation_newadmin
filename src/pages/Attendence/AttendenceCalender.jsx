/** @format */

import dayjs from "@/lib/dayjs";
import React, { useEffect, useState } from "react";
import { Calendar, Badge, Spin, Modal, Button, TimePicker } from "antd";
import Box from "@mui/material/Box";
import {
	GetDailyPresenceForMonth,
	ManualClockInOut,
} from "../../services/Api/leaveRequestApi";
import { useNavigate } from "react-router";

const AttendanceCalendar = () => {
	const navigate = useNavigate();
	const [attendanceData, setAttendanceData] = useState({});
	const [loading, setLoading] = useState(false);
	const [isManualModalOpen, setIsManualModalOpen] = useState(false);
	const [manualForm, setManualForm] = useState({
		user_id: "",
		role_id: "",
		user_name: "",
		date: "",
		clock_in: "",
		clock_out: "",
	});
	const [isDayModalOpen, setIsDayModalOpen] = useState(false);
	const [selectedDayUsers, setSelectedDayUsers] = useState([]);
	const [selectedDay, setSelectedDay] = useState("");

	const toHHMM = (val) => {
		if (!val) return "";
		if (/^\d{2}:\d{2}$/.test(val)) return val;
		return dayjs.utc(val).format("HH:mm");
	};

	const fetchAttendance = async (month, year) => {
		try {
			setLoading(true);

			const formData = new FormData();
			formData.append("month", month);
			formData.append("year", year);

			const res = await GetDailyPresenceForMonth(formData);
			const result = res.data.data; // ✅ correct structure

			const dataMap = {};
			result.forEach((item) => {
				dataMap[item.date] = item.present_users;
			});

			setAttendanceData(dataMap);
			setLoading(false);
		} catch (error) {
			console.error("Error fetching attendance:", error);
			setLoading(false);
		}
	};

	const handlePanelChange = (value) => {
		const month = value.format("MM");
		const year = value.format("YYYY");
		fetchAttendance(month, year);
	};

	const handleDateClick = (value) => {
		const dateStr = value.format("YYYY-MM-DD");
		const users = attendanceData[dateStr] || [];
		setSelectedDay(value.format("YYYY-MM-DD"));
		setSelectedDayUsers(users);
		setIsDayModalOpen(true);
	};

	const dateCellRender = (value) => {
		const dateStr = value.format("YYYY-MM-DD");
		const users = attendanceData[dateStr];

		if (!users || users.length === 0) return null;

		const maxToShow = 2;
		const visibleUsers = users.slice(0, maxToShow);
		const remaining = users.length - maxToShow;

		return (
			<div style={{ fontSize: "12px", cursor: "pointer" }}>
				{visibleUsers.map((user, idx) => (
					<div key={idx} style={{ whiteSpace: "nowrap", overflow: "hidden" }}>
						<Badge color="blue" text={user.name} />
					</div>
				))}
				{remaining > 0 && (
					<div style={{ color: "#888" }}>+{remaining} more</div>
				)}
			</div>
		);
	};

	const handleManualSubmit = async () => {
		try {
			const formData = new FormData();
			formData.append("employee_id", manualForm.user_id);
			formData.append("role_id", manualForm.role_id);
			formData.append("date", manualForm.date);
			formData.append("clock_in", manualForm.clock_in || "");
			formData.append("clock_out", manualForm.clock_out || "");

			const res = await ManualClockInOut(formData);

			if (res?.status === 200) {
				setIsManualModalOpen(false);
				handlePanelChange(dayjs(manualForm.date)); // 🔄 refresh calendar
			}
		} catch (err) {
			console.error(err);
		}
	};

	useEffect(() => {
		const now = dayjs();
		fetchAttendance(now.format("MM"), now.format("YYYY"));
	}, []);

	return (
		<div className="p-4">
			<Box
				display="flex"
				justifyContent="space-between"
				alignItems="center"
				marginBottom="20px"
			>
				<div>
					<h3 className="page-title">ATTENDANCE MANAGEMENT</h3>
					<p className="page-sub-title">View Monthly Attendance</p>
				</div>
				<Box>
					<Button
						icon={<i className="pi pi-arrow-left" />}
						onClick={() => navigate("/attendence")}
						style={{ borderRadius: "5px", height: "47px" }}
					>
						Return to Attendance
					</Button>
				</Box>
			</Box>
			<Spin spinning={loading}>
				<Calendar
					fullscreen
					dateCellRender={dateCellRender}
					onPanelChange={handlePanelChange}
					onSelect={(value, info) => {
						// ✅ ONLY open modal when a DATE cell is clicked
						if (info?.source !== "date") return;
						handleDateClick(value);
					}}
				/>
			</Spin>
			<Modal
				title={`Edit Attendance - ${manualForm.user_name}`}
				open={isManualModalOpen}
				onCancel={() => setIsManualModalOpen(false)}
				onOk={handleManualSubmit}
				okText="Save"
				destroyOnClose
			>
				<p>
					<strong>Date:</strong> {manualForm.date}
				</p>

				<div style={{ marginBottom: 12 }}>
					<label>Clock In</label>
					<TimePicker
						use12Hours
						format="hh:mm A"
						value={
							manualForm.clock_in ? dayjs(manualForm.clock_in, "HH:mm") : null
						}
						onChange={(t) =>
							setManualForm({
								...manualForm,
								clock_in: t ? t.format("HH:mm") : "",
							})
						}
						style={{ width: "100%" }}
					/>
				</div>

				<div>
					<label>Clock Out</label>
					<TimePicker
						use12Hours
						format="hh:mm A"
						value={
							manualForm.clock_out ? dayjs(manualForm.clock_out, "HH:mm") : null
						}
						onChange={(t) =>
							setManualForm({
								...manualForm,
								clock_out: t ? t.format("HH:mm") : "",
							})
						}
						style={{ width: "100%" }}
					/>
				</div>
			</Modal>
			<Modal
				title={`Attendance on ${dayjs(selectedDay).format("DD MMM YYYY")}`}
				open={isDayModalOpen}
				onCancel={() => setIsDayModalOpen(false)}
				footer={null}
				width={700}
				destroyOnClose
			>
				{selectedDayUsers.length > 0 ? (
					<table
						style={{
							width: "100%",
							borderCollapse: "collapse",
							fontSize: "14px",
						}}
					>
						<thead>
							<tr style={{ backgroundColor: "#f5f5f5" }}>
								<th style={{ padding: 10 }}>Name</th>
								<th style={{ padding: 10 }}>Clock In</th>
								<th style={{ padding: 10 }}>Clock Out</th>
								<th style={{ padding: 10 }}>Total Hours</th>
								<th style={{ padding: 10 }}>Action</th>
							</tr>
						</thead>
						<tbody>
							{selectedDayUsers.map((u, idx) => (
								<tr key={idx}>
									<td style={{ padding: 10 }}>{u.name}</td>
									<td style={{ padding: 10 }}>
										{u.clock_in
											? dayjs.utc(u.clock_in).format("hh:mm A")
											: "---"}
									</td>
									<td style={{ padding: 10 }}>
										{u.clock_out
											? dayjs.utc(u.clock_out).format("hh:mm A")
											: "---"}
									</td>
									<td style={{ padding: 10 }}>{u.total_hours || "--"}</td>
									<td style={{ padding: 10 }}>
										<Button
											type="link"
											size="small"
											onClick={() => {
												setManualForm({
													user_id: u.user_id,
													role_id: u.role_id,
													user_name: u.name,
													date: selectedDay,
													clock_in: toHHMM(u.clock_in),
													clock_out: toHHMM(u.clock_out),
												});

												setIsDayModalOpen(false); // ✅ CLOSE DAY MODAL
												setIsManualModalOpen(true); // ✅ OPEN EDIT MODAL
											}}
										>
											Edit
										</Button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				) : (
					<p>No users were present.</p>
				)}
			</Modal>
		</div>
	);
};

export default AttendanceCalendar;
