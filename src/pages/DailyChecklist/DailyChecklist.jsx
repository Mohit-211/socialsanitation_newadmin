/** @format */

import React, { useEffect, useState } from "react";
import { Table, Space, message, Modal, Form, Input, Button, Card } from "antd";
import { useNavigate } from "react-router";
import { PlusOutlined, DeleteOutlined, EditOutlined, EyeOutlined } from "@ant-design/icons";
import {
	DeleteChecklist,
	GetAllChecklist,
	GetChecklistMainTitle,
	CreateOrUpdateChecklistMainTitle,
} from "../../services/Api/DailyChecklistApi";

const { Search } = Input;

const DailyChecklist = () => {
	const navigate = useNavigate();
	const [data, setData] = useState([]);
	const [userBackupData, setUserBackupData] = useState([]);
	const [loading, setLoading] = useState(false);
	const [selectedRowKeys, setSelectedRowKeys] = useState([]);
	const [checklist, setChecklist] = useState([]);
	const [oldChecklist, setOldChecklist] = useState("");
	const [newChecklist, setNewChecklist] = useState("");
	const [checklistLoading, setChecklistLoading] = useState(false);

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
		} catch (e) {
			console.log("Error loading data. Please try again later.");
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
				<Space size="middle">
					<Button
						shape="circle"
						icon={<EyeOutlined />}
						size="large"
						onClick={(event) => navigateToView(event, record.id)}
					/>
					<Button
						shape="circle"
						icon={<EditOutlined />}
						size="large"
						onClick={(event) => navigateToEdit(event, record.id)}
					/>
					<Button
						shape="circle"
						icon={<DeleteOutlined />}
						size="large"
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
			onOk: async () => {
				try {
					await DeleteChecklist(brandIds, localStorage.getItem("adminToken"));
					message.success("Checklist(s) deleted successfully");
					getData();
				} catch (error) {
					message.error("Error deleting Checklist(s)");
				}
			},
		});
	};

	const getAllPrices = async () => {
		try {
			setChecklistLoading(true);
			const res = await GetChecklistMainTitle();
			setChecklist(res?.data?.data);
			setOldChecklist(res?.data?.data);
			console.log(res.data.data, "fwefw");
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
		} catch (e) {
			message.error("Failed to update price.");
		}
	};

	return (
		<div>
			{/* HEADER */}
			<div
				style={{
					display: "flex",
					flexDirection: "row",
					justifyContent: "space-between",
					marginBottom: "40px",
				}}
			>
				<div>
					<h3 className="page-title">HOUSEKEEPING CHECKLIST MANAGEMENT</h3>
					<p className="page-sub-title">View all Checklist</p>
				</div>
				<div
					style={{
						display: "flex",
						flexDirection: "row",
						alignItems: "flex-start",
						gap: "10px",
					}}
				>
					<span
						className="p-input-icon-left"
						style={{ display: "inline-block" }}
					>
						<Search
							size="large"
							placeholder="Search..."
							onSearch={onSearch}
							onChange={(e) => onSearch(e.target.value)}
							enterButton
						/>
					</span>

					<Button
						icon={<DeleteOutlined />}
						size="large"
						onClick={() => handleDelete(selectedRowKeys)}
						disabled={!selectedRowKeys.length}
						danger
					/>
					<Button
						icon={<PlusOutlined />}
						size="large"
						onClick={navigateToAddUser}
					/>
				</div>
			</div>

			<Card className="p-4 mb-4">
				<div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
					<div>
						<label>
							<strong>Title:</strong>
						</label>
						<div style={{ marginTop: "4px" }}>
							{oldChecklist || "Loading..."}
						</div>
					</div>

					<div style={{ flexGrow: 1 }}>
						<label>
							<strong>New Title</strong>
						</label>
						<input
							
							className="p-inputtext"
							style={{ width: "100%", padding: "8px" }}
							value={newChecklist}
							onChange={(e) => setNewChecklist(e.target.value)}
							placeholder="Enter new Title"
						/>
					</div>

					<Button
						style={{ marginTop: "19px", height: "39px", borderRadius: "5px" }}
						disabled={checklistLoading || !newChecklist}
						type="primary"
						onClick={handleUpdatePrice}
					>
						Update Title
					</Button>
				</div>
			</Card>

			{/* BRAND TABLE */}
			<Table
				columns={columns}
				rowKey={(record) => record.id}
				dataSource={data}
				loading={loading}
				rowSelection={rowSelection}
			/>
		</div>
	);
};

export default DailyChecklist;
