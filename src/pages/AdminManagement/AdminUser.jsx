/** @format */

import React, { useEffect, useState } from "react";
import { Table, message, Space, Modal } from "antd";
import { useNavigate } from "react-router-dom";
import { GetAdmins, DeleteAdmin } from "../../services/Api/Api";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { Pencil, Plus, Trash2 } from "lucide-react";

const actionIconBtn = (color) => ({
	width: 34,
	height: 34,
	border: "1px solid",
	borderColor: color,
	color,
	"&:hover": {
		backgroundColor: `${color}14`,
		borderColor: color,
	},
});

const AdminUser = () => {
	const navigate = useNavigate();
	const [roleData, setRoleData] = useState([]);
	const [loading, setLoading] = useState(false);
	const [tableParams, setTableParams] = useState({
		pagination: {
			current: 1,
			pageSize: 100,
		},
		sortField: null,
		sortOrder: null,
	});

	const getData = async (pagination) => {
		try {
			setLoading(true);
			let result = await GetAdmins(localStorage.getItem("adminToken"));
			setRoleData(result.data.data);
			console.log("admins", result.data.data);
		} catch (e) {
			console.log(e);
			if (e.response && e.response.status === 401) {
				navigate("/error401");
				message.error("You do not have access to this page.");
			} else {
				message.error("Error loading data. Please try again later.");
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

	const navigateToAddAdmin = () => {
		navigate("/addAdmin");
	};

	const navigateToEditAdmin = (id) => {
		navigate(`/editAdmin/${id}`);
	};

	const removeUser = (user_id) => {
		DeleteAdmin(user_id, localStorage.getItem("adminToken"))
			.then((res) => {
				message.success(res?.data?.message);
				getData(); // Reload data after deleting
			})
			.catch((error) => {
				console.log(error);
				message.error("Error deleting admin.");
			});
	};

	const handleDelete = (userId) => {
		Modal.confirm({
			title: "Confirm",
			content: "Are you sure you want to delete this admin?",
			okText: "Yes, Delete",
			okType: "danger",
			cancelText: "No",
			onOk: () => {
				removeUser(userId);
			},
		});
	};

	// Define columns for antd table
	const columns = [
		{
			title: "S.No.",
			dataIndex: "index",
			render: (text, record, index) =>
				(tableParams.pagination.current - 1) * tableParams.pagination.pageSize + index + 1,
		},
		{
			title: "Name",
			dataIndex: "name",
			key: "name",
			width: 350,
		},
		{
			title: "Email",
			dataIndex: "email",
			key: "email",
			width: 350,
		},
		{
			title: "Role",
			dataIndex: ["admin_role", "name"], // Nested field
			key: "role",
			width: 350,
		},
		{
			title: "Actions",
			key: "action",
			width: 350,
			render: (text, record) => (
				<Space>
					<Tooltip title="Edit Admin">
						<IconButton
							size="small"
							sx={actionIconBtn("#6366F1")}
							onClick={() => navigateToEditAdmin(record.id)}
						>
							<Pencil size={16} />
						</IconButton>
					</Tooltip>

					<Tooltip title="Delete Admin">
						<IconButton
							size="small"
							sx={actionIconBtn("#EF4444")}
							onClick={() => handleDelete(record.id)}
						>
							<Trash2 size={16} />
						</IconButton>
					</Tooltip>
				</Space>
			),
		},
	];

	return (
		<Box>
			<Paper
				variant="outlined"
				sx={{
					p: 2.5,
					mb: 2.5,
					borderRadius: "10px",
					borderColor: "#eef0f2",
				}}
			>
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						gap: 2,
						flexWrap: { xs: "wrap", md: "nowrap" },
					}}
				>
					<Box sx={{ minWidth: 0 }}>
						<Typography className="page-title" noWrap>
							ADMIN MANAGEMENT
						</Typography>
						<Typography
							className="page-sub-title"
							sx={{
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap",
							}}
						>
							View, edit, delete, and create admins
						</Typography>
					</Box>

					<Button
						variant="contained"
						disableElevation
						startIcon={<Plus size={18} />}
						onClick={navigateToAddAdmin}
						sx={{
							height: 44,
							px: 2.5,
							borderRadius: "8px",
							textTransform: "none",
							fontWeight: 600,
							whiteSpace: "nowrap",
							flexShrink: 0,
						}}
					>
						Add New Admin
					</Button>
				</Box>
			</Paper>

			<Table
				dataSource={roleData}
				columns={columns}
				rowKey={(record) => record.id}
				pagination={tableParams.pagination}
				loading={loading}
				onChange={handleTableChange}
				bordered
				size="middle"
			/>
		</Box>
	);
};

export default AdminUser;