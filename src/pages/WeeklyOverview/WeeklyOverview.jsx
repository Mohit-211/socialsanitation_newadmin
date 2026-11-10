import { useEffect, useState } from "react";
import { Table, Button, Card, Row, Col, Statistic } from "antd";
import { ChevronLeft, ChevronRight, FileCheck, Users } from "lucide-react";
import dayjs from "@/lib/dayjs";
import { useNavigate } from "react-router";
import { GetDayOverview } from "../../services/Api/BookingApi";
import PageHeader from "../../components/PageHeader";
import { excelStyles, saveXlsx } from "../../utils/excel";
import "./WeeklyOverview.scss";

// Excel export columns (title + width in characters)
const EXPORT_COLUMNS = [
	{ title: "Booking Name", width: 25 },
	{ title: "Client", width: 20 },
	{ title: "Employee Count", width: 15 },
	{ title: "Address", width: 30 },
	{ title: "Employee Name", width: 20 },
	{ title: "Clock In", width: 15 },
	{ title: "Clock Out", width: 15 },
	{ title: "Breaks", width: 10 },
	{ title: "Break Timings", width: 25 },
];

const DayOverview = () => {
	const navigate = useNavigate();
	const [offset, setOffset] = useState(0);
	const [selectedDate, setSelectedDate] = useState(
		dayjs().format("YYYY-MM-DD")
	);
	const [weekDates, setWeekDates] = useState([]);
	const [loading, setLoading] = useState(false);
	const [bookings, setBookings] = useState([]);

	useEffect(() => {
		const base = dayjs().add(offset, "days");
		generateWeek(base);
	}, [offset]);

	useEffect(() => {
		if (selectedDate) fetchBookings(selectedDate);
	}, [selectedDate]);

	const generateWeek = (baseDate) => {
		const days = [];
		for (let i = 0; i < 7; i++) {
			const dateObj = dayjs(baseDate).add(i, "days");
			days.push({
				label: dateObj.format("ddd"),
				date: dateObj.format("YYYY-MM-DD"),
				display: dateObj.format("MM/DD/YYYY"),
			});
		}
		setWeekDates(days);
	};

	const fetchBookings = async (date) => {
		try {
			setLoading(true);
			const formData = new FormData();
			formData.append("date", date);
			const res = await GetDayOverview(formData);
			setBookings(res?.data?.data?.bookings || []);
		} catch (err) {
			console.error("Error loading bookings", err);
		} finally {
			setLoading(false);
		}
	};

	const columns = [
		{
			title: "Sr. No",
			render: (_, __, index) => index + 1,
			width: 70,
		},
		{
			title: "Date",
			render: () => dayjs(selectedDate).format("MM/DD/YYYY"),
			width: 120,
		},
		{
			title: "Booking ID",
			dataIndex: "booking_unique_id",
		},
		{
			title: "Client Name",
			dataIndex: "client_name",
		},
		{
			title: "Total Employees",
			dataIndex: "number_of_employees",
			align: "center",
		},
		{
			title: "Employee Names",
			dataIndex: "employees",
			render: (employees) =>
				employees
					.map((emp) => emp.name)
					.filter(Boolean)
					.join(", "),
		},
		{
			title: "Action",
			align: "center",
			render: (_, record) => (
				<Button
					type="link"
					onClick={() => navigate(`/day-overview/${record.booking_id}`)}
				>
					View
				</Button>
			),
		},
	];

const downloadExcel = async () => {
    setLoading(true);
    try {
        // 1. DEFINE STYLES 🎨 (theme colors from excelStyles())
        const styles = excelStyles();

        // Date header: merged across all columns, medium top/bottom border
        const DATE_HEADER_STYLE = {
            ...styles.header,
            fontSize: 16,
            topBorderStyle: "medium",
            bottomBorderStyle: "medium",
        };

        const TABLE_HEADER_STYLE = {
            ...styles.subheader,
            fontSize: 11,
            align: "center",
            alignVertical: "center",
        };

        const BOOKING_SUMMARY_STYLE = {
            ...styles.border,
            ...styles.muted,
            fontWeight: "bold",
            fontSize: 11,
            topBorderStyle: "medium", // Thicker line above the booking summary
        };

        const EMPLOYEE_ROW_BORDER = {
            leftBorderStyle: "thin",
            leftBorderColor: styles.border.borderColor,
            bottomBorderStyle: "dotted",
            bottomBorderColor: styles.border.borderColor,
            rightBorderStyle: "thin",
            rightBorderColor: styles.border.borderColor,
        };

        const rows = [];

        for (const d of weekDates) {
            // 1. Date Header
            rows.push([
                {
                    value: d.display,
                    ...DATE_HEADER_STYLE,
                    columnSpan: EXPORT_COLUMNS.length,
                },
                ...Array(EXPORT_COLUMNS.length - 1).fill(null),
            ]);

            // 2. Table headers
            rows.push(
                EXPORT_COLUMNS.map(({ title }) => ({
                    value: title,
                    ...TABLE_HEADER_STYLE,
                })),
            );

            // 3. Bookings data
            const formData = new FormData();
            formData.append("date", d.date);
            const res = await GetDayOverview(formData);
            const bookings = res?.data?.data?.bookings || [];

            for (const booking of bookings) {
                // Booking summary row
                rows.push(
                    [
                        booking.booking_name || "",
                        booking.client_name || "",
                        booking.number_of_employees || "",
                        booking.address?.address_line_1 || "",
                        "", "", "", "", "", // Empty cells for employee columns
                    ].map((value) => ({ value, ...BOOKING_SUMMARY_STYLE })),
                );

                // Employee details rows
                for (const emp of booking.employees || []) {
                    // Break timings logic
                    const breakTimes = (emp.breaks || [])
                        .map((br) => {
                            const formatTime = (timeStr) =>
                                timeStr && dayjs(timeStr, "HH:mm:ss").isValid()
                                    ? dayjs(timeStr, "HH:mm:ss").format("hh:mm A")
                                    : "--";

                            const start = formatTime(br?.break_start_est);
                            const end = formatTime(br?.break_end_est);
                            return `${start}-${end}`;
                        })
                        .join(", ");

                    rows.push(
                        [
                            "", "", "", "",
                            emp.name || "",
                            emp.clock_in ? dayjs(emp.clock_in).format("hh:mm A") : "--",
                            emp.clock_out ? dayjs(emp.clock_out).format("hh:mm A") : "--",
                            emp.breaks ? emp.breaks.length : "",
                            breakTimes,
                        ].map((value, index) => ({
                            value,
                            ...EMPLOYEE_ROW_BORDER,
                            // Center align Clock In (col 6) through Break Timings (col 9)
                            ...(index >= 5 ? { align: "center" } : {}),
                        })),
                    );
                }
            }

            // 4. Blank separator rows
            rows.push([], []);
        }

        // Save
        await saveXlsx(
            rows,
            {
                sheet: "Weekly Overview",
                columns: EXPORT_COLUMNS.map(({ width }) => ({ width })),
            },
            `Weekly_Bookings_${dayjs().format("YYYY-MM-DD")}.xlsx`
        );
    } catch (err) {
        console.error("Error exporting Excel:", err);
    } finally {
        setLoading(false);
    }
};

	return (
		<>
			<PageHeader
				title="Weekly Booking Overview"
				actions={
					<Button
						type="primary"
						onClick={downloadExcel}
						className="weekly-overview__download"
					>
						Download Weekly Bookings (Excel)
					</Button>
				}
			/>

			<div className="surface surface--padded weekly-overview">
				{/* Week Tabs with Day + Date */}
				<div className="weekly-overview__week">
					<Button
						className="weekly-overview__nav"
						icon={<ChevronLeft size={16} />}
						aria-label="Previous week"
						onClick={() => setOffset((prev) => prev - 7)}
					/>
					<div className="weekly-overview__days">
						{weekDates.map((d) => (
							<Button
								key={d.date}
								type={d.date === selectedDate ? "primary" : "default"}
								className="weekly-overview__day"
								onClick={() => setSelectedDate(d.date)}
							>
								<strong>{d.label}</strong>
								<span>{d.display}</span>
							</Button>
						))}
					</div>

					<Button
						className="weekly-overview__nav"
						icon={<ChevronRight size={16} />}
						aria-label="Next week"
						onClick={() => setOffset((prev) => prev + 7)}
					/>
				</div>

				<h2 className="section-title weekly-overview__summary">
					Summary – {dayjs(selectedDate).format("dddd, MMMM Do YYYY")}
				</h2>

				{/* Statistics */}
				<Row gutter={16} className="weekly-overview__stats">
					<Col xs={12} sm={8} md={6}>
						<Card
							className="weekly-overview__stat weekly-overview__stat--bookings"
							styles={{ body: { padding: 20 } }}
						>
							<Statistic
								title="Total Bookings"
								value={bookings.length}
								prefix={<FileCheck size={20} />}
							/>
						</Card>
					</Col>

					<Col xs={12} sm={8} md={6}>
						<Card
							className="weekly-overview__stat weekly-overview__stat--employees"
							styles={{ body: { padding: 20 } }}
						>
							<Statistic
								title="Total Employees Working"
								value={bookings.reduce(
									(acc, b) => acc + b.number_of_employees,
									0
								)}
								prefix={<Users size={20} />}
							/>
						</Card>
					</Col>
				</Row>

				{/* Booking Table */}
				<Table
					columns={columns}
					dataSource={bookings}
					rowKey="booking_id"
					loading={loading}
					pagination={false}
					bordered
					size="middle"
				/>
			</div>
		</>
	);
};

export default DayOverview;
