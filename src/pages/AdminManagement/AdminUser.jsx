/** @format */

import React, { useEffect, useState } from "react";
import { Table, message, Space } from "antd";
import { useNavigate } from "react-router-dom";
import { GetAdmins, DeleteAdmin } from "../../services/Api/Api";
import Alert from "../Customer/Alert";
import Button from "@mui/material/Button";

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
					<Button
						icon="pi pi-pencil"
						rounded
						outlined
						severity="info"
						style={{ borderRadius: "25px", marginRight: "10px" }}
						onClick={() => navigateToEditAdmin([record.id])}
					/>
					<Alert title="Admin" handleDelete={() => removeUser(record.id)} />
				</Space>
			),
		},
	];

	return (
		<div s>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					marginBottom: "20px",
				}}
			>
				<div>
					<h3 className="page-title">Admin List</h3>
					<p className="page-sub-title">View, Edit, Delete, and Create Admin</p>
				</div>
				<Button
					label="Add New Admin"
					severity="info"
					icon="pi pi-plus"
					onClick={navigateToAddAdmin}
					style={{ marginLeft: "10px", borderRadius: "5px", height: "47px" }}
				></Button>
			</div>
			<Table
				dataSource={roleData}
				columns={columns}
				rowKey={(record) => record.id}
				pagination={tableParams.pagination}
				loading={loading}
				onChange={handleTableChange}
			/>
		</div>
	);
};

export default AdminUser;
