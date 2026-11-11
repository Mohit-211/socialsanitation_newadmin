import { useEffect, useState } from "react";
import { Button, Table, Modal, Space, message, type TableColumnsType, type TablePaginationConfig, type TableProps } from "antd";
import { useNavigate } from "react-router";
import { deleteVideo, listVideos } from "@/services/api/trainingVideoApi";
import { errorMessage } from "@/services/apiResult";
import { PERMISSION, useCan } from "@/lib/session";
import { formatDateTime } from "@/utils/datetime";
import { Pencil, Trash2, Plus } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import IconAction from "@/components/IconAction";
import type { TrainingVideo } from "@/types";

/** A video, numbered in the list. */
type VideoRow = TrainingVideo & { index: number };

const TrainingVideosPage = () => {
	const navigate = useNavigate();
	// Deleting is Super Admin only (records.delete); others don't see it.
	const canDelete = useCan(PERMISSION.DELETE_RECORDS);
	const [data, setData] = useState<VideoRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);

	const [tableParams, setTableParams] = useState<{ pagination: TablePaginationConfig }>({
		pagination: {
			current: 1,
			pageSize: 100,
		},
	});

	const rowSelection: TableProps<VideoRow>["rowSelection"] = {
		selectedRowKeys,
		onChange: (keys) => setSelectedRowKeys(keys.map(Number)),
	};
	const columns: TableColumnsType<VideoRow> = [
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
			render: (videoLink: string) => (
				<a href={videoLink} target="_blank" rel="noopener noreferrer">
					{videoLink}
				</a>
			),
		},
		{
			title: "Date Uploaded",
			dataIndex: "created_at",
			width: "20%",
			render: (date: string) => formatDateTime(date),
		},

		{
			title: "Action",
			dataIndex: "action",
			render: (_value, record) => (
				<Space>
					<IconAction
						icon={Pencil}
						title="Edit Video"
						onClick={() => navigateToEdit(record.id)}
					/>
					{canDelete && (
						<IconAction
							icon={Trash2}
							title="Delete Video"
							danger
							onClick={() => handleDelete([record.id])}
						/>
					)}
				</Space>
			),
		},
	];

	// The videos, numbered; state is set once the request settles.
	const loadData = () =>
		listVideos()
			.then((result) =>
				setData((result.data.data?.items || []).map((item, index) => ({ ...item, index: index + 1 }))),
			)
			.catch((error) => message.error(errorMessage(error, "Couldn't load the videos")))
			.finally(() => setLoading(false));

	const getData = () => {
		setLoading(true);
		return loadData();
	};

	useEffect(() => {
		loadData();
		// Loaded once on opening.
	}, []);

	const handleTableChange: TableProps<VideoRow>["onChange"] = (pagination) => {
		setTableParams({ pagination });
	};

	const handleDelete = (brandIds: number[]) => {
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
					for (const videoId of brandIds) await deleteVideo(videoId);
					message.success(brandIds.length > 1 ? "Videos deleted" : "Video deleted");
					getData();
				} catch (error) {
					message.error(errorMessage(error, "Couldn't delete the video"));
					getData();
				}
			},
		});
	};

	const navigateToEdit = (id: number) => {
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
						{canDelete && selectedRowKeys.length > 0 && (
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
				rowSelection={canDelete ? rowSelection : undefined}
				bordered
				size="middle"
			/>
		</div>
	);
};

export default TrainingVideosPage;