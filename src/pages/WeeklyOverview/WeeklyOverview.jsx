/** @format */

import React, { useEffect, useState } from "react";
import {
	Table,
	Button,
	Card,
	Space,
	Row,
	Col,
	Statistic,
	Typography,
} from "antd";
import {
	LeftOutlined,
	RightOutlined,
	TeamOutlined,
	FileDoneOutlined,
} from "@ant-design/icons";
import dayjs from "@/lib/dayjs";
import { useNavigate } from "react-router-dom";
import { GetDayOverview } from "../../services/Api/BookingApi";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import ExcelJS from "exceljs";

const { Title } = Typography;

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
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Weekly Overview");
        
        // ----------------------------------------------------
        // 1. DEFINE STYLES 🎨
        // ----------------------------------------------------
        const DATE_HEADER_STYLE = {
            font: { bold: true, size: 16, color: { argb: 'FFFFFF' } }, // White text
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '4CAF50' } }, // Green background
            alignment: { vertical: 'middle', horizontal: 'center' },
            border: { top: { style: 'medium' }, bottom: { style: 'medium' } }
        };

        const TABLE_HEADER_STYLE = {
            font: { bold: true, size: 11, color: { argb: '000000' } }, // Black text
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0E0E0' } }, // Light Gray background
            alignment: { vertical: 'middle', horizontal: 'center' },
            border: {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            }
        };

        const BOOKING_SUMMARY_STYLE = {
            font: { bold: true, size: 11 },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F5F5F5' } }, // Very Light Gray background
            border: {
                top: { style: 'medium' }, // Thicker line above the booking summary
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            }
        };

        const EMPLOYEE_ROW_BORDER = {
            border: {
                left: { style: 'thin' },
                bottom: { style: 'dotted', color: { argb: 'BDBDBD' } },
                right: { style: 'thin' }
            }
        };
        // ----------------------------------------------------
        // 2. BUG FIX & COLUMN DEFINITION (Sets widths) ✅
        // ----------------------------------------------------
        worksheet.columns = [
            { header: 'Booking Name', key: 'booking_name', width: 25 },
            { header: 'Client', key: 'client', width: 20 },
            { header: 'Employee Count', key: 'emp_count', width: 15 },
            { header: 'Address', key: 'address', width: 30 },
            { header: 'Employee Name', key: 'emp_name', width: 20 },
            { header: 'Clock In', key: 'clock_in', width: 15 },
            { header: 'Clock Out', key: 'clock_out', width: 15 },
            { header: 'Breaks', key: 'breaks', width: 10 },
            { header: 'Break Timings', key: 'break_timings', width: 25 },
        ];
        // ----------------------------------------------------
        
        let rowIndex = 1;

        for (const d of weekDates) {
            // 1. Date Header
            worksheet.mergeCells(`A${rowIndex}:I${rowIndex}`); 
            const dateHeaderCell = worksheet.getCell(`A${rowIndex}`);
            dateHeaderCell.value = d.display;
            Object.assign(dateHeaderCell, DATE_HEADER_STYLE);
            rowIndex++;

            // 2. Table headers
            const headerRow = worksheet.addRow([
                "Booking Name", "Client", "Employee Count", "Address", "Employee Name", 
                "Clock In", "Clock Out", "Breaks", "Break Timings",
            ]);
            headerRow.eachCell((cell) => {
                Object.assign(cell, TABLE_HEADER_STYLE);
            });
            rowIndex++;

            // 3. Bookings data
            const formData = new FormData();
            formData.append("date", d.date);
            const res = await GetDayOverview(formData);
            const bookings = res?.data?.data?.bookings || [];

            for (const booking of bookings) {
                // Booking summary row
                const bookingSummaryRow = worksheet.addRow([
                    booking.booking_name || "",
                    booking.client_name || "",
                    booking.number_of_employees || "",
                    booking.address?.address_line_1 || "",
                    "", "", "", "", "", // Empty cells for employee columns
                ]);
                bookingSummaryRow.eachCell((cell) => {
                    Object.assign(cell, BOOKING_SUMMARY_STYLE);
                });
                rowIndex++;

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
                        
                    const employeeRow = worksheet.addRow([
                        "", "", "", "", 
                        emp.name || "", 
                        emp.clock_in ? dayjs(emp.clock_in).format("hh:mm A") : "--", 
                        emp.clock_out ? dayjs(emp.clock_out).format("hh:mm A") : "--", 
                        emp.breaks ? emp.breaks.length : "", 
                        breakTimes, 
                    ]);
                    
                    // Apply border style and center alignment for time/breaks
                    employeeRow.eachCell((cell, colNumber) => {
                        Object.assign(cell, EMPLOYEE_ROW_BORDER);
                        // Center align Clock In (col 6) through Break Timings (col 9)
                        if (colNumber >= 6 && colNumber <= 9) {
                            cell.alignment = { horizontal: 'center' };
                        }
                    });

                    rowIndex++;
                }
            }
            
            // 4. Blank separator rows
            worksheet.addRow([]);
            worksheet.addRow([]);
            rowIndex += 2;
        }

        // Save
        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(
            new Blob([buffer]),
            `Weekly_Bookings_${dayjs().format("YYYY-MM-DD")}.xlsx`
        );
    } catch (err) {
        console.error("Error exporting Excel:", err); 
    } finally {
        setLoading(false);
    }
};

	return (
		<div style={{ padding: 20 }}>
			<Card>
				<Title level={4} style={{ marginBottom: 20 }}>
					Weekly Booking Overview
				</Title>

				{/* Week Tabs with Day + Date */}
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						gap: 10,
						padding: "0 16px",
						flexWrap: "wrap",
						marginBottom: 30,
					}}
				>
					<Button
						style={{ alignSelf: "center" }}
						icon={<LeftOutlined />}
						onClick={() => setOffset((prev) => prev - 7)}
					/>
					<div
						style={{
							display: "flex",
							flex: 1,
							justifyContent: "space-evenly",
							flexWrap: "wrap",
							gap: 10,
						}}
					>
						{weekDates.map((d) => (
							<Button
								key={d.date}
								type={d.date === selectedDate ? "primary" : "default"}
								style={{
									width: 100,
									height: 60,
									textAlign: "center",
									padding: "5px 6px",
									display: "flex",
									flexDirection: "column",
									alignItems: "center",
									justifyContent: "center",
									borderRadius: 8,
									fontSize: 12,
								}}
								onClick={() => setSelectedDate(d.date)}
							>
								<strong>{d.label}</strong>
								<span>{d.display}</span>
							</Button>
						))}
					</div>

					<Button
						style={{ alignSelf: "center" }}
						icon={<RightOutlined />}
						onClick={() => setOffset((prev) => prev + 7)}
					/>
				</div>

				<Title level={5} style={{ marginBottom: 20 }}>
					Summary – {dayjs(selectedDate).format("dddd, MMMM Do YYYY")}
				</Title>

				{/* Statistics */}
				<Row gutter={16} style={{ marginBottom: 30 }}>
					<Col xs={12} sm={8} md={6}>
						<Card
							style={{ backgroundColor: "#e6f4ff", borderRadius: 10 }}
							bodyStyle={{ padding: 20 }}
						>
							<Statistic
								title="Total Bookings"
								value={bookings.length}
								prefix={<FileDoneOutlined />}
							/>
						</Card>
					</Col>

					<Col xs={12} sm={8} md={6}>
						<Card
							style={{ backgroundColor: "#fce4ff", borderRadius: 10 }}
							bodyStyle={{ padding: 20 }}
						>
							<Statistic
								title="Total Employees Working"
								value={bookings.reduce(
									(acc, b) => acc + b.number_of_employees,
									0
								)}
								prefix={<TeamOutlined />}
							/>
						</Card>
					</Col>
				</Row>

				<Row justify="end" style={{ marginBottom: 20 }}>
					<Col>
						<Button type="primary" onClick={downloadExcel}>
							Download Weekly Bookings (Excel)
						</Button>
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
			</Card>
		</div>
	);
};

export default DayOverview;
