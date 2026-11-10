import { useEffect, useState } from "react";
import { Button, Table, message, Space, Modal } from "antd";
import { useNavigate } from "react-router";
import { GetAdmins, DeleteAdmin } from "@/services/api/adminApi";
import { Pencil, Plus, Trash2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import IconAction from "@/components/IconAction";

const AdminsPage = () => {
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

	const getData = async () => {
		try {
			setLoading(true);
			let result = await GetAdmins(localStorage.getItem("adminToken"));
			setRoleData(result.data.data);
		} catch (e) {
			console.error(e);
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
				console.error(error);
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
					<IconAction
						icon={Pencil}
						title="Edit Admin"
						onClick={() => navigateToEditAdmin(record.id)}
					/>
					<IconAction
						icon={Trash2}
						title="Delete Admin"
						danger
						onClick={() => handleDelete(record.id)}
					/>
				</Space>
			),
		},
	];

	return (
		<div>
			<PageHeader
				title="ADMIN MANAGEMENT"
				subtitle="View, edit, delete, and create admins"
				actions={
					<Button
						type="primary"
						size="large"
						icon={<Plus size={16} />}
						onClick={navigateToAddAdmin}
					>
						Add New Admin
					</Button>
				}
			/>

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
		</div>
	);
};

export default AdminsPage;
