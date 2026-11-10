import { useEffect, useState } from "react";
import { Button, Table, Modal, Space, message } from "antd";
import { useNavigate } from "react-router";
import { DeleteVideos, GetVideos } from "../../services/Api/Api";
import dayjs from "@/lib/dayjs";
import { Pencil, Trash2, Plus } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import IconAction from "../../components/IconAction";

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
				<Space>
					<IconAction
						icon={Pencil}
						title="Edit Video"
						onClick={(event) => navigateToEdit(event, record.id)}
					/>
					<IconAction
						icon={Trash2}
						title="Delete Video"
						danger
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
				console.error("Error loading data.");
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
				} catch {
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
		<div>
			{/* HEADER */}
			<PageHeader
				title="TRAINING VIDEOS"
				subtitle="View and manage training videos"
				actions={
					<>
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
							Add Video
						</Button>
					</>
				}
			/>

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
		</div>
	);
};

export default TrainingVideos;