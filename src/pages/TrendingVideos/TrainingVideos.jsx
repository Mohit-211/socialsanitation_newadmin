/** @format */

import React, { useEffect, useState } from "react";
import { Button, Table, Modal, message, Space } from "antd";
import { Box } from "@mui/material";
import { useNavigate } from "react-router";
import { DeleteVideos, GetVideos } from "../../services/Api/Api";
import dayjs from "@/lib/dayjs";
import { PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";

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
				<Space size="middle">
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
			<Box
				display="flex"
				justifyContent="space-between"
				alignItems="center"
				marginBottom="20px"
			>
				<div>
					<h3 className="page-title">Training Videos</h3>
					<p className="page-sub-title">View and manage training videos</p>
				</div>
				<div
					style={{
						display: "flex",
						flexDirection: "row",
						alignItems: "flex-start",
						gap: "10px",
					}}
				>
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
			</Box>
			<Table
				columns={columns}
				rowKey={(record) => record.id}
				dataSource={data}
				pagination={tableParams.pagination}
				loading={loading}
				onChange={handleTableChange}
				rowSelection={rowSelection}
			/>
		</Box>
	);
};

export default TrainingVideos;
