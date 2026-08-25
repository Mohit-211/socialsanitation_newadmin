/** @format */

import React, { useEffect, useState } from "react";
import { Table, Input, Modal, message, Space, Button } from "antd";
import { Trash2 } from "lucide-react";
import { useNavigate } from "react-router";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
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
	const [selectedRowKeys, setSelectedRowKeys] = useState([]);
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

	// Unified delete handler — always sends an array of ids to the API,
	// e.g. { ids: [12, 15, 18, 21] }. Works for both single-row delete
	// and bulk delete from the selection toolbar.
	const handleDelete = (ids) => {
		const count = ids.length;
		Modal.confirm({
			title: count > 1 ? "Delete Forms" : "Delete Form",
			content:
				count > 1
					? `Are you sure you want to delete these ${count} forms?`
					: "Are you sure you want to delete this form?",
			okText: "Delete",
			okButtonProps: { danger: true },
			onOk: async () => {
				await DeleteHiringForm(ids);
				message.success(count > 1 ? "Forms deleted" : "Form deleted");
				setSelectedRowKeys((prev) =>
					prev.filter((key) => !ids.includes(key)),
				);
				getData();
			},
		});
	};

	const handleBulkDelete = () => {
		if (selectedRowKeys.length === 0) return;
		handleDelete(selectedRowKeys);
	};

	const rowSelection = {
		selectedRowKeys,
		onChange: (keys) => setSelectedRowKeys(keys),
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
			<Paper
				variant="outlined"
				sx={{
					p: 2.5,
					mb: 3,
					borderRadius: "10px",
					borderColor: "#eef0f2",
				}}
			>
				<Stack
					direction="row"
					spacing={2}
					sx={{
						justifyContent: "space-between",
						alignItems: "center",
						flexWrap: "wrap",
					}}
				>
					<Box>
						<Typography className="page-title">
							EMPLOYEE HIRING FORM MANAGEMENT
						</Typography>

						<Typography className="page-sub-title">
							View Employee Hiring Form
						</Typography>
					</Box>

					<Stack direction="row" spacing={1.5} alignItems="center">
						{selectedRowKeys.length > 0 && (
							<Button
								danger
								type="primary"
								icon={<Trash2 size={14} />}
								onClick={handleBulkDelete}
								style={{
									height: 44,
									display: "flex",
									alignItems: "center",
									gap: 6,
								}}
							>
								Delete Selected ({selectedRowKeys.length})
							</Button>
						)}

						<Input
							allowClear
							placeholder="Search by name or email..."
							value={searchText}
							onChange={(e) => setSearchText(e.target.value)}
							style={{
								width: 270,
								height: 44,
							}}
						/>
					</Stack>
				</Stack>
			</Paper>

			<Table
				columns={columns}
				rowKey={(record) => record.id}
				dataSource={filteredData}
				pagination={tableParams.pagination}
				loading={loading}
				onChange={handleTableChange}
				rowSelection={rowSelection}
			/>
		</Box>
	);
};

export default HiringForm;