import { useEffect, useState } from "react";
import { Button, Table, message, Modal, Input, Space } from "antd";
import { useNavigate } from "react-router";
import { Eye, Pencil, Trash2, Plus, Search } from "lucide-react";
import {
	DeleteChecklist,
	GetAllChecklist,
	GetChecklistMainTitle,
	CreateOrUpdateChecklistMainTitle,
} from "@/services/api/dailyChecklistApi";
import PageHeader from "@/components/PageHeader";
import IconAction from "@/components/IconAction";
import "./dailyChecklists.scss";

const DailyChecklistsPage = () => {
	const navigate = useNavigate();
	const [data, setData] = useState([]);
	const [userBackupData, setUserBackupData] = useState([]);
	const [loading, setLoading] = useState(false);
	const [selectedRowKeys, setSelectedRowKeys] = useState([]);
	const [oldChecklist, setOldChecklist] = useState("");
	const [newChecklist, setNewChecklist] = useState("");
	const [checklistLoading, setChecklistLoading] = useState(false);
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
					10: "Cleaner",
					11: "Housekeeping",
				};
				return roleMap[role_id] || "-";
			},
		},
		{
			title: "Action",
			dataIndex: "action",
			render: (_, record) => (
				<Space>
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
		navigate(`/edit-daily-checklist/${id}`);
	};

	const navigateToView = (event, id) => {
		navigate(`/view-daily-checklist/${id}`);
	};

	const navigateToAddUser = () => {
		navigate("/add-daily-checklist");
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

	const getAllPrices = async () => {
		try {
			setChecklistLoading(true);
			const res = await GetChecklistMainTitle();
			setOldChecklist(res?.data?.data);
		} catch (e) {
			console.error("Error fetching prices", e);
		} finally {
			setChecklistLoading(false);
		}
	};

	useEffect(() => {
		getAllPrices();
	}, []);

	const handleUpdatePrice = async () => {
		if (!oldChecklist || !newChecklist)
			return message.error("Both fields are required.");

		try {
			const response = await CreateOrUpdateChecklistMainTitle(
				{ old_main_title: oldChecklist, new_main_title: newChecklist },
				localStorage.getItem("adminToken")
			);
			if (response.status === 201) {
				message.success(`Prices updated successfully!`);
				setNewChecklist("");
				await getAllPrices();
			}
		} catch {
			message.error("Failed to update price.");
		}
	};

	return (
		<div>
			{/* HEADER */}
			<PageHeader
				title="HOUSEKEEPING CHECKLIST MANAGEMENT"
				subtitle="View all checklists"
				actions={
					<>
						<Input
							allowClear
							size="large"
							className="daily-checklist__search"
							prefix={<Search size={16} className="text-subtle" />}
							placeholder="Search..."
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

			{/* MAIN TITLE UPDATE CARD */}
			<div className="surface surface--padded daily-checklist__title-card">
				<div>
					<div className="daily-checklist__label">Current Title</div>
					<div className="daily-checklist__current">
						{oldChecklist || "Loading..."}
					</div>
				</div>

				<div className="daily-checklist__title-input">
					<label className="daily-checklist__label" htmlFor="checklist-new-title">
						New Title
					</label>
					<Input
						id="checklist-new-title"
						size="large"
						value={newChecklist}
						onChange={(e) => setNewChecklist(e.target.value)}
						placeholder="Enter new title"
					/>
				</div>

				<Button
					type="primary"
					size="large"
					disabled={checklistLoading || !newChecklist}
					onClick={handleUpdatePrice}
				>
					Update Title
				</Button>
			</div>

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

export default DailyChecklistsPage;
