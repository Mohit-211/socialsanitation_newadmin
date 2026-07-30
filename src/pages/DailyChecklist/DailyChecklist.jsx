/** @format */

import React, { useEffect, useState } from "react";
import { Table, Space, message, Modal, Input } from "antd";
import { useNavigate } from "react-router";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import TextField from "@mui/material/TextField";
import { Eye, Pencil, Trash2, Plus, Search } from "lucide-react";
import {
	DeleteChecklist,
	GetAllChecklist,
	GetChecklistMainTitle,
	CreateOrUpdateChecklistMainTitle,
} from "../../services/Api/DailyChecklistApi";

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
	const [searchTerm, setSearchTerm] = useState("");

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
				<Stack direction="row" spacing={0.5}>
					<Tooltip title="View Checklist">
						<IconButton
							size="small"
							sx={actionIconBtn("#F59E0B")}
							onClick={(event) => navigateToView(event, record.id)}
						>
							<Eye size={16} />
						</IconButton>
					</Tooltip>

					<Tooltip title="Edit Checklist">
						<IconButton
							size="small"
							sx={actionIconBtn("#6366F1")}
							onClick={(event) => navigateToEdit(event, record.id)}
						>
							<Pencil size={16} />
						</IconButton>
					</Tooltip>

					<Tooltip title="Delete Checklist">
						<IconButton
							size="small"
							sx={actionIconBtn("#EF4444")}
							onClick={() => handleDelete([record.id])}
						>
							<Trash2 size={16} />
						</IconButton>
					</Tooltip>
				</Stack>
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
		<Box>
			{/* HEADER */}
			<Paper
				variant="outlined"
				sx={{
					p: 2.5,
					mb: 2.5,
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
						flexWrap: { xs: "wrap", md: "nowrap" },
					}}
				>
					<Box sx={{ minWidth: 0 }}>
						<Typography className="page-title" noWrap>
							HOUSEKEEPING CHECKLIST MANAGEMENT
						</Typography>
						<Typography
							className="page-sub-title"
							sx={{
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap",
							}}
						>
							View all checklists
						</Typography>
					</Box>

					<Stack
						direction="row"
						spacing={1.5}
						sx={{ alignItems: "center", flexShrink: 0 }}
					>
						<Input
							allowClear
							prefix={<Search size={18} color="#9CA3AF" />}
							placeholder="Search..."
							style={{ width: 240, height: 44 }}
							value={searchTerm}
							onChange={(e) => onSearch(e.target.value)}
						/>

						{selectedRowKeys.length > 0 && (
							<Button
								variant="contained"
								disableElevation
								startIcon={<Trash2 size={16} />}
								onClick={() => handleDelete(selectedRowKeys)}
								sx={{
									height: 44,
									px: 2.5,
									borderRadius: "8px",
									textTransform: "none",
									fontWeight: 600,
									whiteSpace: "nowrap",
									backgroundColor: "#ef4444",
									"&:hover": { backgroundColor: "#dc2626" },
								}}
							>
								Delete Selected ({selectedRowKeys.length})
							</Button>
						)}

						<Button
							variant="contained"
							disableElevation
							startIcon={<Plus size={18} />}
							onClick={navigateToAddUser}
							sx={{
								height: 44,
								px: 2.5,
								borderRadius: "8px",
								textTransform: "none",
								fontWeight: 600,
								whiteSpace: "nowrap",
							}}
						>
							Add Checklist
						</Button>
					</Stack>
				</Stack>
			</Paper>

			{/* MAIN TITLE UPDATE CARD */}
			<Paper
				variant="outlined"
				sx={{
					p: 2.5,
					mb: 2.5,
					borderRadius: "10px",
					borderColor: "#eef0f2",
				}}
			>
				<Stack
	direction="row"
	spacing={2.5}
	alignItems="flex-end"
	flexWrap="wrap"
>
	<Box>
		<Typography
			sx={{
				fontSize: "11.5px",
				fontWeight: 700,
				color: "#6b7280",
				letterSpacing: "0.04em",
				textTransform: "uppercase",
				mb: 0.5,
			}}
		>
			Current Title
		</Typography>
		<Typography sx={{ fontSize: "14.5px", fontWeight: 600, color: "#111827", height: "42px", display: "flex", alignItems: "center" }}>
			{oldChecklist || "Loading..."}
		</Typography>
	</Box>

	<Box sx={{ flexGrow: 1, minWidth: 220 }}>
		<Typography
			sx={{
				fontSize: "11.5px",
				fontWeight: 700,
				color: "#6b7280",
				letterSpacing: "0.04em",
				textTransform: "uppercase",
				mb: 0.5,
			}}
		>
			New Title
		</Typography>
		<TextField
			fullWidth
			size="small"
			value={newChecklist}
			onChange={(e) => setNewChecklist(e.target.value)}
			placeholder="Enter new title"
			sx={{
				"& .MuiOutlinedInput-root": {
					height: "42px",
					borderRadius: "6px",
				},
			}}
		/>
	</Box>

	<Box>
		<Typography
			sx={{
				fontSize: "11.5px",
				fontWeight: 700,
				color: "transparent",
				letterSpacing: "0.04em",
				textTransform: "uppercase",
				mb: 0.5,
				userSelect: "none",
			}}
		>
			.
		</Typography>
		<Button
			variant="contained"
			disableElevation
			disabled={checklistLoading || !newChecklist}
			onClick={handleUpdatePrice}
			sx={{
				height: 42,
				px: 2.5,
				borderRadius: "8px",
				textTransform: "none",
				fontWeight: 600,
				whiteSpace: "nowrap",
			}}
		>
			Update Title
		</Button>
	</Box>
</Stack>
			</Paper>

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
		</Box>
	);
};

export default DailyChecklist;