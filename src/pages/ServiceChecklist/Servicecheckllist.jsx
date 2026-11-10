import { useEffect, useState } from "react";
import { Table, message, Modal, Input, Button, Space } from "antd";
import { useNavigate } from "react-router";
import { Eye, Pencil, Trash2, Plus, Search } from "lucide-react";
import { DeleteChecklist, GetAllChecklist } from "../../services/Api/checklistApi";
import PageHeader from "../../components/PageHeader";
import IconAction from "../../components/IconAction";

const ServiceChecklist = () => {
	const navigate = useNavigate();
	const [data, setData] = useState([]);
	const [userBackupData, setUserBackupData] = useState([]);
	const [loading, setLoading] = useState(false);
	const [selectedRowKeys, setSelectedRowKeys] = useState([]);
	const [searchTerm, setSearchTerm] = useState("");

	useEffect(() => {
		getData();
	}, []);

	const getData = async () => {
		try {
			setLoading(true);
			const result = await GetAllChecklist(localStorage.getItem("adminToken"));
			const newData = result.data.data.map((item, index) => ({
				...item,
				index: index + 1,
			}));
			setData(newData);
			setUserBackupData(newData);
		} catch {
			console.error("Error loading data. Please try again later.");
		} finally {
			setLoading(false);
		}
	};

	const columns = [
		{
			title: "S.No.",
			dataIndex: "index",
			width: "10%",
		},
		{
			title: "Title",
			dataIndex: "title",
			width: "40%",
		},
		{
			title: "Role",
			dataIndex: "role_id",
			width: "20%",
			render: (role_id) => {
				const roleMap = {
					7: "Inspector/ Supervisor",
					8: "Quality Assurance Technician",
				};
				return roleMap[role_id] || "-";
			},
		},
		{
			title: "Action",
			dataIndex: "action",
			render: (_, record) => (
				<Space size={4} wrap>
					<IconAction
						icon={Eye}
						title="View Checklist"
						onClick={(event) => navigateToView(event, record.id)}
					/>

					<IconAction
						icon={Pencil}
						title="Edit Checklist"
						onClick={(event) => navigateToEdit(event, record.id)}
					/>

					<IconAction
						icon={Trash2}
						title="Delete Checklist"
						danger
						onClick={() => handleDelete([record.id])}
					/>
				</Space>
			),
		},
	];

	const rowSelection = {
		selectedRowKeys,
		onChange: setSelectedRowKeys,
	};

	const navigateToEdit = (event, id) => {
		navigate(`/edit-checklist/${id}`);
	};

	const navigateToView = (event, id) => {
		navigate(`/view-daily-checklist/${id}`);
	};

	const navigateToAddUser = () => {
		navigate("/add-checklist");
	};

	const onSearch = (searchField) => {
		setSearchTerm(searchField);
		if (!searchField) {
			setData(userBackupData);
			return;
		}
		const searchList = userBackupData.filter((item) =>
			item?.title?.toLowerCase().includes(searchField?.toLowerCase())
		);
		setData(searchList);
	};

	// **Handle Delete**
	const handleDelete = (brandIds) => {
		Modal.confirm({
			title: "Confirm Deletion",
			content: `Are you sure you want to delete ${
				brandIds.length > 1 ? "these checklist" : "this checklist"
			}?`,
			okText: "Yes, Delete",
			okType: "danger",
			cancelText: "No",
			onOk: async () => {
				try {
					await DeleteChecklist(brandIds, localStorage.getItem("adminToken"));
					message.success("Checklist(s) deleted successfully");
					getData();
				} catch {
					message.error("Error deleting Checklist(s)");
				}
			},
		});
	};

	return (
		<div>
			{/* HEADER */}
			<PageHeader
				title="SERVICE CHECKLIST MANAGEMENT"
				subtitle="View all checklists"
				actions={
					<>
						<Input
							allowClear
							size="large"
							prefix={<Search size={16} color="var(--color-text-subtle)" />}
							placeholder="Search..."
							style={{ width: 240, maxWidth: "100%" }}
							value={searchTerm}
							onChange={(e) => onSearch(e.target.value)}
						/>

						{selectedRowKeys.length > 0 && (
							<Button
								type="primary"
								danger
								size="large"
								icon={<Trash2 size={16} />}
								onClick={() => handleDelete(selectedRowKeys)}
							>
								Delete Selected ({selectedRowKeys.length})
							</Button>
						)}

						<Button
							type="primary"
							size="large"
							icon={<Plus size={16} />}
							onClick={navigateToAddUser}
						>
							Add Checklist
						</Button>
					</>
				}
			/>

			{/* CHECKLIST TABLE */}
			<Table
				columns={columns}
				rowKey={(record) => record.id}
				dataSource={data}
				loading={loading}
				rowSelection={rowSelection}
				bordered
				size="middle"
			/>
		</div>
	);
};

export default ServiceChecklist;