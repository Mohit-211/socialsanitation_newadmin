import dayjs from "@/lib/dayjs";
import { useState } from "react";
import { getGantt } from "@/services/api/dashboardApi";
import { dataOf } from "@/services/apiResult";
import { useApiQuery } from "@/hooks/useApiQuery";
import { DatePicker } from "antd";
import PageHeader from "@/components/PageHeader";
import "./DayOverviewPage.scss";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
// Booking bars cycle through light theme tints (`gantt-view__bar--tone-N`
// in DayOverviewPage.scss).
const BAR_TONE_COUNT = 6;

const DayOverviewPage = () => {
	const [selectedDate, setSelectedDate] = useState(
		dayjs().tz("America/New_York")
	);
	/** Convert EST date to YYYY-MM-DD */
	const getESTDateString = (d) =>
		dayjs(d).tz("America/New_York").format("YYYY-MM-DD");

	const day = getESTDateString(selectedDate);
	const { data: employees, loading } = useApiQuery(
		() => getGantt(day).then((res) => dataOf(res)?.employees || []),
		[day],
		{ initial: [], errorText: "Couldn't load the day's schedule" },
	);

	/** Convert HH:mm → minutes */
	const convertToMinutes = (time) => {
		if (!time) return null;
		const [h, m] = time.split(":").map(Number);
		return h * 60 + m;
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

	/** On date change */
	const onChangeDate = (newDate) => {
		if (!newDate) return; // handles "null" when no date selected
		setSelectedDate(newDate);
	};

	return (
		<div className="gantt-view">
			<PageHeader
				title="Employee Schedule"
				subtitle="View employee bookings for the selected day"
			/>

			<div className="surface surface--padded">
				{/* DATE PICKER */}

				<DatePicker
					value={selectedDate}
					onChange={onChangeDate}
					className="gantt-view__date"
				/>

				{/* LOADING STATE */}
				{loading ? (
					<div className="gantt-view__loading">
						<div className="gantt-view__spinner icon-spin" />
					</div>
				) : (
					<div className="gantt-view__chart">
						<div className="gantt-view__body">
							{/* LEFT COLUMN */}
							<div className="gantt-view__names">
								<div className="gantt-view__names-header">EMPLOYEE</div>

								{employees.map((emp, idx) => (
									<div
										key={emp.id}
										className={`gantt-view__name${
											idx % 2 === 0 ? " gantt-view__name--alt" : ""
										}`}
									>
										{emp.name}
									</div>
								))}
							</div>

							{/* RIGHT GRID */}
							<div className="gantt-view__grid">
								{/* HOURS HEADER */}
								<div className="gantt-view__hours">
									{HOURS.map((h) => (
										<div key={h} className="gantt-view__hour">
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
											className={`gantt-view__row${
												idx % 2 === 0 ? " gantt-view__row--alt" : ""
											}`}
										>
											{HOURS.map((h) => (
												<div key={h} className="gantt-view__cell"></div>
											))}

											{emp.booking_start && emp.booking_end && (
												<div
													className={`gantt-view__bar gantt-view__bar--tone-${
														idx % BAR_TONE_COUNT
													}`}
													style={{
														left: leftOffset,
														width: Math.max(width, 40),
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
					<div className="gantt-view__empty">No bookings for this date</div>
				)}
			</div>
		</div>
	);
};

export default DayOverviewPage;
