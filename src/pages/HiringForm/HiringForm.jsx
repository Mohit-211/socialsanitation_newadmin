/** @format */

import React, { useEffect, useState } from "react";
import { Table, Input, Modal, message, Space, Button } from "antd";
import { useNavigate } from "react-router";
import Box from "@mui/material/Box";
import dayjs from "@/lib/dayjs";
import {
	DeleteHiringForm,
	GetAllHiringForm,
} from "../../services/Api/HiringFormApi";

const HiringForm = () => {
	const navigate = useNavigate();
	const [data, setData] = useState([]);
	const [filteredData, setFilteredData] = useState([]);
	const [loading, setLoading] = useState(false);
	const [searchText, setSearchText] = useState("");
	const [tableParams, setTableParams] = useState({
		pagination: {
			current: 1,
			pageSize: 100,
		},
		sortField: null,
		sortOrder: null,
	});

	const getFullName = (record) => {
		const personalInfoSubmission = record.details_form_submission?.find(
			(sub) => sub.section_name === "personalInfo",
		);
		if (!personalInfoSubmission) return "";

		try {
			const {
				firstName = "",
				middleName = "",
				lastName = "",
			} = JSON.parse(personalInfoSubmission.data);
			return [firstName, middleName, lastName].filter(Boolean).join(" ");
		} catch {
			return "";
		}
	};

	const getEmail = (record) => {
		const personalInfoSubmission = record.details_form_submission?.find(
			(sub) => sub.section_name === "personalInfo",
		);
		if (!personalInfoSubmission) return "";
		try {
			const parsedData = JSON.parse(personalInfoSubmission.data);
			return parsedData.email || "";
		} catch {
			return "";
		}
	};

	const handleDelete = (id) => {
		Modal.confirm({
			title: "Delete Form",
			content: "Are you sure you want to delete this form?",
			onOk: async () => {
				await DeleteHiringForm(id);
				message.success("Form deleted");
				getData();
			},
		});
	};

	const columns = [
		{
			title: "S.No.",
			dataIndex: "index",
			width: "5%",
			sorter: (a, b) => a.index - b.index,
		},
		{
			title: "User's Name",
			dataIndex: "details_form_submission",
			render: (_, record) => getFullName(record) || "N/A",
			sorter: (a, b) => getFullName(a).localeCompare(getFullName(b)),
			width: "25%",
		},
		{
			title: "Email",
			dataIndex: "details_form_submission",
			render: (_, record) => getEmail(record) || "N/A",
			width: "25%",
		},
		{
			title: "Date",
			dataIndex: "created_at",
			width: "25%",
			render: (date) => dayjs(date).format("MM/DD/YYYY HH:mm A"),
		},
		{
			title: "Action",
			dataIndex: "action",
			render: (_, record) => (
				<Space size="middle">
					<Button
						outlined
						primary
						onClick={(event) => navigateToEditService(event, record.id)}
						size="small"
						// style={{ height: "30px", padding: "0 12px", whiteSpace: "nowrap" }}
					>
						View Form
					</Button>
					<Button
						danger
						size="small"
						outlined
						onClick={() => handleDelete([record.id])}
					>
						Delete
					</Button>
				</Space>
			),
		},
	];

	const getData = async (params = {}) => {
		try {
			setLoading(true);
			let result = await GetAllHiringForm(
				localStorage.getItem("adminToken"),
				params,
			);
			const newData = result.data.data.map((item, index) => ({
				...item,
				index: index + 1,
			}));
			setData(newData);
			setFilteredData(newData);
		} catch (e) {
			console.log(e);
			if (e.response && e.response.status === 401) {
				navigate("/error401");
				console.log("You do not have access to this page as a sub-admin.");
			} else {
				console.log("Error loading data. Please try again later.");
			}
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		getData({
			page: tableParams.pagination.current,
			pageSize: tableParams.pagination.pageSize,
			sortField: tableParams.sortField,
			sortOrder: tableParams.sortOrder,
		});
	}, [tableParams]);

	const handleTableChange = (pagination, filters, sorter) => {
		setTableParams({
			pagination,
			filters,
			sortField: sorter.field,
			sortOrder: sorter.order,
		});
	};

	const navigateToEditService = (event, id) => {
		navigate(`/view-form/${id}`);
	};

	// 🔍 Filter data when search changes
	useEffect(() => {
		const lowerSearch = searchText.toLowerCase();
		const filtered = data.filter((item) => {
			const name = getFullName(item).toLowerCase();
			const email = getEmail(item).toLowerCase();
			return name.includes(lowerSearch) || email.includes(lowerSearch);
		});
		setFilteredData(filtered);
	}, [searchText, data]);

	return (
		<Box>
			<Box
				display="flex"
				justifyContent="space-between"
				alignItems="center"
				marginBottom="20px"
			>
				<div>
					<h3 className="page-title">EMPLOYEE HIRING FORM MANAGEMENT</h3>
					<p className="page-sub-title">View Employee Hiring Form</p>
				</div>

				{/* 🔍 Search Box */}
				<Input
					placeholder="Search by name or email"
					value={searchText}
					onChange={(e) => setSearchText(e.target.value)}
					style={{ width: 300 }}
					allowClear
				/>
			</Box>

			<Table
				columns={columns}
				rowKey={(record) => record.id}
				dataSource={filteredData}
				pagination={tableParams.pagination}
				loading={loading}
				onChange={handleTableChange}
			/>
		</Box>
	);
};

export default HiringForm;
