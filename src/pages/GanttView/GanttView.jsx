/** @format */
import dayjs from "@/lib/dayjs";
import React, { useEffect, useState } from "react";
import { Calendar } from "lucide-react";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { GantOverview } from "../../services/Api/BookingApi";
import { DatePicker } from "antd";

dayjs.extend(utc);
dayjs.extend(timezone);

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const PASTEL_COLORS = [
	"#FFE6E9", // very soft pink
	"#FFEFD9", // light peach
	"#FFFBD1", // pale yellow
	"#E3FFE8", // mint wash
	"#E6F4FF", // soft sky blue

	"#F0E6FF", // lilac haze
	"#FFE6F7", // baby rose
	"#FFF3DF", // honey cream
	"#DFFFF3", // aqua mint
	"#E3E6FF", // powder blue

	"#FFE0EC", // blush pink
	"#E6FAFF", // breezy cyan
	"#F5E1FF", // lavender milk
	"#FFE7D9", // coral mist
	"#DAFFF4", // very pale teal
];

const GanttView = () => {
	const [selectedDate, setSelectedDate] = useState(
		dayjs().tz("America/New_York")
	);
	const [employees, setEmployees] = useState([]);
	const [loading, setLoading] = useState(false);

	/** Convert EST date to YYYY-MM-DD */
	const getESTDateString = (d) =>
		dayjs(d).tz("America/New_York").format("YYYY-MM-DD");

	/** Convert HH:mm → minutes */
	const convertToMinutes = (time) => {
		if (!time) return null;
		const [h, m] = time.split(":").map(Number);
		return h * 60 + m;
	};

	/** Fetch API */
	const fetchData = async (dateObj) => {
		setLoading(true);
		try {
			const formattedDate = getESTDateString(dateObj);

			const res = await GantOverview({ date: formattedDate });

			setEmployees(res.data.data.employees || []);
		} catch (error) {
			console.error("Gantt API Error:", error);
		}
		setLoading(false);
	};

	const formatTimeAMPM = (time) => {
		if (!time) return "";
		const [h, m] = time.split(":").map(Number);
		const hourLabel = h === 0 ? 12 : h > 12 ? h - 12 : h;
		const suffix = h >= 12 ? "PM" : "AM";
		return `${hourLabel}:${String(m).padStart(2, "0")} ${suffix}`;
	};

	const formatHourAMPM = (hour) => {
		if (hour === 0) return "12 AM";
		if (hour < 12) return `${hour} AM`;
		if (hour === 12) return "12 PM";
		return `${hour - 12} PM`;
	};

	/** Initial load */
	useEffect(() => {
		fetchData(selectedDate);
	}, []);

	/** On date change */
	const onChangeDate = (newDate) => {
		if (!newDate) return; // handles "null" when no date selected
		setSelectedDate(newDate);
		fetchData(newDate);
	};

	return (
		<div
			style={{
				// margin: 20,
				padding: 24,
				borderRadius: 12,
				boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
				backgroundColor: "white",
			}}
		>
			<div style={{ marginBottom: 24 }}>
				<h2
					style={{
						margin: 0,
						marginBottom: 8,
						fontSize: 24,
						fontWeight: 600,
						color: "#1a1a1a",
					}}
				>
					Employee Schedule
				</h2>
				<p style={{ margin: 0, color: "#666", fontSize: 14 }}>
					View employee bookings for the selected day
				</p>
			</div>

			{/* DATE PICKER */}

			<DatePicker
				value={selectedDate}
				onChange={onChangeDate}
				style={{ marginBottom: 20 }}
			/>

			{/* LOADING STATE */}
			{loading ? (
				<div style={{ textAlign: "center", padding: 60 }}>
					<div
						style={{
							border: "3px solid #f3f3f3",
							borderTop: "3px solid #3498db",
							borderRadius: "50%",
							width: 40,
							height: 40,
							animation: "spin 1s linear infinite",
							margin: "0 auto",
						}}
					/>
					<style>{`
            @keyframes spin { 
              0% { transform: rotate(0deg); } 
              100% { transform: rotate(360deg); } 
            }
          `}</style>
				</div>
			) : (
				<div
					style={{
						border: "1px solid #e8e8e8",
						borderRadius: 12,
						overflow: "hidden",
						backgroundColor: "white",
					}}
				>
					<div style={{ display: "flex" }}>
						{/* LEFT COLUMN */}
						<div
							style={{
								minWidth: 160,
								maxWidth: 160,
								borderRight: "2px solid #e8e8e8",
								backgroundColor: "#fafafa",
							}}
						>
							<div
								style={{
									height: 50,
									display: "flex",
									alignItems: "center",
									paddingLeft: 16,
									fontWeight: 600,
									fontSize: 13,
									color: "#666",
									borderBottom: "2px solid #e8e8e8",
									backgroundColor: "#f5f5f5",
								}}
							>
								EMPLOYEE
							</div>

							{employees.map((emp, idx) => (
								<div
									key={emp.id}
									style={{
										height: 56,
										display: "flex",
										alignItems: "center",
										paddingLeft: 16,
										borderBottom: "1px solid #f0f0f0",
										backgroundColor: idx % 2 === 0 ? "#fafafa" : "white",
										fontSize: 14,
										fontWeight: 500,
									}}
								>
									{/* <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: PASTEL_COLORS[idx % PASTEL_COLORS.length],
                      marginRight: 10,
                    }}
                  ></div> */}
									{emp.name}
								</div>
							))}
						</div>

						{/* RIGHT GRID */}
						<div
							style={{ flexGrow: 1, overflowX: "auto", overflowY: "hidden" }}
						>
							{/* HOURS HEADER */}
							<div
								style={{
									display: "flex",
									minWidth: 24 * 60,
									backgroundColor: "#f5f5f5",
									borderBottom: "2px solid #e8e8e8",
								}}
							>
								{HOURS.map((h) => (
									<div
										key={h}
										style={{
											minWidth: 60,
											height: 50,
											borderRight: "1px solid #e8e8e8",
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											fontWeight: 600,
											fontSize: 12,
											color: "#666",
										}}
									>
										{formatHourAMPM(h)}
									</div>
								))}
							</div>

							{/* EMPLOYEE ROWS */}
							{employees.map((emp, idx) => {
								const startMin = convertToMinutes(emp.booking_start);
								const endMin = convertToMinutes(emp.booking_end);

								const leftOffset = startMin ? (startMin / 60) * 60 : 0;
								const width = endMin ? ((endMin - startMin) / 60) * 60 : 0;

								return (
									<div
										key={emp.id}
										style={{
											position: "relative",
											height: 56,
											minWidth: 24 * 60,
											borderBottom: "1px solid #f0f0f0",
											backgroundColor: idx % 2 === 0 ? "#fafafa" : "white",
										}}
									>
										{HOURS.map((h) => (
											<div
												key={h}
												style={{
													minWidth: 60,
													height: "100%",
													borderRight: "1px solid #f0f0f0",
												}}
											></div>
										))}

										{emp.booking_start && emp.booking_end && (
											<div
												style={{
													position: "absolute",
													left: leftOffset,
													top: 8,
													height: 40,
													width: Math.max(width, 40),
													background: PASTEL_COLORS[idx % PASTEL_COLORS.length],
													borderRadius: 8,
													display: "flex",
													alignItems: "center",
													justifyContent: "center",
													fontSize: 12,
													fontWeight: 600,
													color: "#1a1a1a",
													boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
													border: "2px solid white",
												}}
											>
												{formatTimeAMPM(emp.booking_start)} -{" "}
												{formatTimeAMPM(emp.booking_end)}
											</div>
										)}
									</div>
								);
							})}
						</div>
					</div>
				</div>
			)}

			{/* No data */}
			{!loading && employees.length === 0 && (
				<div
					style={{
						textAlign: "center",
						padding: 60,
						color: "#999",
						fontSize: 14,
					}}
				>
					No bookings for this date
				</div>
			)}
		</div>
	);
};

export default GanttView;
