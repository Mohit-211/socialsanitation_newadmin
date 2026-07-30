/** @format */

import React, { useEffect, useState } from "react";
import { Table, Modal, message, Space } from "antd";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { useNavigate } from "react-router";
import { DeleteVideos, GetVideos } from "../../services/Api/Api";
import dayjs from "@/lib/dayjs";
import { Pencil, Trash2, Plus } from "lucide-react";

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

const TrainingVideos = () => {
	const navigate = useNavigate();
	const [data, setData] = useState([]);
	const [loading, setLoading] = useState(false);
	const [selectedRowKeys, setSelectedRowKeys] = useState([]);

	const [tableParams, setTableParams] = useState({
		pagination: {
			current: 1,
			pageSize: 100,
		},
		sortField: null,
		sortOrder: null,
	});

	const rowSelection = {
		selectedRowKeys,
		onChange: setSelectedRowKeys,
	};
	const columns = [
		{
			title: "S.No.",
			dataIndex: "index",
			width: "5%",
			sorter: (a, b) => a.index - b.index,
		},
		{
			title: "Title",
			dataIndex: "title",
			width: "20%",
		},
		{
			title: "Video",
			dataIndex: "video_link",
			width: "40%",
			render: (videoLink) => (
				<a href={videoLink} target="_blank" rel="noopener noreferrer">
					{videoLink}
				</a>
			),
		},
		{
			title: "Date Uploaded",
			dataIndex: "created_at",
			width: "20%",
			render: (date) => dayjs(date).format("MM/DD/YYYY HH:mm A"),
		},

		{
			title: "Action",
			dataIndex: "action",
			render: (_, record) => (
				<Stack direction="row" spacing={0.5}>
					<Tooltip title="Edit Video">
						<IconButton
							size="small"
							sx={actionIconBtn("#6366F1")}
							onClick={(event) => navigateToEdit(event, record.id)}
						>
							<Pencil size={16} />
						</IconButton>
					</Tooltip>

					<Tooltip title="Delete Video">
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

	const getData = async () => {
		try {
			setLoading(true);
			let result = await GetVideos(localStorage.getItem("adminToken"));
			const newData = result.data.data.map((item, index) => ({
				...item,
				index: index + 1,
			}));
			setData(newData);
		} catch (e) {
			if (e.response && e.response.status === 403) {
				navigate("/error401");
			} else {
				console.log("Error loading data.");
			}
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		getData();
	}, []);

	const handleTableChange = (pagination, filters, sorter) => {
		setTableParams({
			pagination,
			filters,
			sortField: sorter.field,
			sortOrder: sorter.order,
		});
	};

	const handleDelete = (brandIds) => {
		Modal.confirm({
			title: "Confirm Deletion",
			content: `Are you sure you want to delete ${
				brandIds.length > 1 ? "these videos" : "this video"
			}?`,
			okText: "Yes, Delete",
			okType: "danger",
			cancelText: "No",
			onOk: async () => {
				try {
					await DeleteVideos(brandIds, localStorage.getItem("adminToken"));
					message.success("Video(s) deleted successfully");
					getData();
				} catch (error) {
					message.error("Error deleting Video(s)");
				}
			},
		});
	};

	const navigateToEdit = (event, id) => {
		navigate(`/edit-training-videos/${id}`);
	};

	const navigateToAddUser = () => {
		navigate("/add-training-videos");
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
							TRAINING VIDEOS
						</Typography>
						<Typography
							className="page-sub-title"
							sx={{
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap",
							}}
						>
							View and manage training videos
						</Typography>
					</Box>

					<Stack
						direction="row"
						spacing={1.5}
						sx={{ alignItems: "center", flexShrink: 0 }}
					>
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
							Add Video
						</Button>
					</Stack>
				</Stack>
			</Paper>

			<Table
				columns={columns}
				rowKey={(record) => record.id}
				dataSource={data}
				pagination={tableParams.pagination}
				loading={loading}
				onChange={handleTableChange}
				rowSelection={rowSelection}
				bordered
				size="middle"
			/>
		</Box>
	);
};

export default TrainingVideos;