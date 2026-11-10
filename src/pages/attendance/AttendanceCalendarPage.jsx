import dayjs from "@/lib/dayjs";
import { useMemo, useState } from "react";
import { Calendar, Badge, Spin, Modal, Button, TimePicker, message } from "antd";
import { ArrowLeft } from "lucide-react";
import { correctAttendance, getMonthPresence } from "@/services/api/attendanceApi";
import { errorMessage, itemsOf } from "@/services/apiResult";
import { useApiQuery } from "@/hooks/useApiQuery";
import { useNavigate } from "react-router";
import PageHeader from "@/components/PageHeader";
import "./attendance.scss";

const AttendanceCalendarPage = () => {
	const navigate = useNavigate();
	const [month, setMonth] = useState(() => dayjs());
	const { data: days, loading, reload } = useApiQuery(
		() => getMonthPresence({ month: month.month() + 1, year: month.year() }).then(itemsOf),
		[month.month(), month.year()],
		{ initial: [], errorText: "Couldn't load the month's attendance" },
	);
	// Who was present, by date
	const attendanceData = useMemo(
		() => Object.fromEntries((days || []).map((item) => [item.date, item.present_users || []])),
		[days],
	);
	const [isManualModalOpen, setIsManualModalOpen] = useState(false);
	const [manualForm, setManualForm] = useState({
		user_id: "",
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

	const handlePanelChange = (value) => setMonth(value);

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
			<div className="attendance-calendar__cell">
				{visibleUsers.map((user, idx) => (
					<div key={idx} className="attendance-calendar__name">
						<Badge color="var(--color-primary-border)" text={user.name} />
					</div>
				))}
				{remaining > 0 && (
					<div className="attendance-calendar__more">+{remaining} more</div>
				)}
			</div>
		);
	};

	const handleManualSubmit = async () => {
		try {
			await correctAttendance({
				employee_id: manualForm.user_id,
				date: manualForm.date,
				clock_in: manualForm.clock_in || "",
				clock_out: manualForm.clock_out || "",
			});
			message.success("Clock in and out saved");
			setIsManualModalOpen(false);
			reload();
		} catch (err) {
			message.error(errorMessage(err, "Couldn't save the clock in and out"));
		}
	};

	return (
		<div>
			<PageHeader
				title="ATTENDANCE MANAGEMENT"
				subtitle="View Monthly Attendance"
				actions={
					<Button
						size="large"
						icon={<ArrowLeft size={16} />}
						onClick={() => navigate("/attendance")}
					>
						Return to Attendance
					</Button>
				}
			/>
			<Spin spinning={loading}>
				<div className="surface surface--padded">
					<Calendar
						fullscreen
						cellRender={(current, info) =>
							info.type === "date" ? dateCellRender(current) : null
						}
						onPanelChange={handlePanelChange}
						onSelect={(value, info) => {
							// ✅ ONLY open modal when a DATE cell is clicked
							if (info?.source !== "date") return;
							handleDateClick(value);
						}}
					/>
				</div>
			</Spin>
			<Modal
				title={`Edit Attendance - ${manualForm.user_name}`}
				open={isManualModalOpen}
				onCancel={() => setIsManualModalOpen(false)}
				onOk={handleManualSubmit}
				okText="Save"
				destroyOnHidden
			>
				<p>
					<strong>Date:</strong> {manualForm.date}
				</p>

				<div style={{ marginBottom: 12 }}>
					<label className="field-label">Clock In</label>
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
					<label className="field-label">Clock Out</label>
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
				destroyOnHidden
			>
				{selectedDayUsers.length > 0 ? (
					<div className="attendance-calendar__table-wrap">
						<table className="attendance-calendar__table">
							<thead>
								<tr>
									<th>Name</th>
									<th>Clock In</th>
									<th>Clock Out</th>
									<th>Total Hours</th>
									<th>Action</th>
								</tr>
							</thead>
							<tbody>
								{selectedDayUsers.map((u, idx) => (
									<tr key={idx}>
										<td>{u.name}</td>
										<td>
											{u.clock_in
												? dayjs.utc(u.clock_in).format("hh:mm A")
												: "---"}
										</td>
										<td>
											{u.clock_out
												? dayjs.utc(u.clock_out).format("hh:mm A")
												: "---"}
										</td>
										<td>{u.total_hours || "--"}</td>
										<td>
											<Button
												type="link"
												size="small"
												onClick={() => {
													setManualForm({
														user_id: u.user_id,
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
					</div>
				) : (
					<p>No users were present.</p>
				)}
			</Modal>
		</div>
	);
};

export default AttendanceCalendarPage;
