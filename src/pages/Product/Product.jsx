/** @format */

import React, { useEffect, useState } from "react";
import { Table, Space, message, Modal, Tooltip, Input } from "antd";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import { useNavigate } from "react-router";
import { Pencil, Trash2, Plus, Search } from "lucide-react";
import dayjs from "@/lib/dayjs";
import { DeleteProduct, GetProduct } from "../../services/Api/Product";

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

const Product = () => {
	const navigate = useNavigate();
	const [data, setData] = useState([]);
	const [userBackupData, setUserBackupData] = useState([]);
	const [loading, setLoading] = useState(false);
	const [selectedRowKeys, setSelectedRowKeys] = useState([]);
	const [searchTerm, setSearchTerm] = useState("");
	const [tableParams, setTableParams] = useState({
		pagination: {
			current: 1,
			pageSize: 100,
		},
		sortField: null,
		sortOrder: null,
	});

	const columns = [
		{
			title: "S.No.",
			dataIndex: "index",
			width: "5%",
			sorter: (a, b) => a.index - b.index,
		},
		{
			title: "Product Name",
			dataIndex: "name",
			width: "25%",
			sorter: (a, b) => a.name.localeCompare(b.name),
		},
		{
			title: "Description",
			dataIndex: "description",
			width: "40%",
			render: (html) => {
				// Remove HTML tags for preview text
				const plainText = html?.replace(/<[^>]+>/g, "") || "";

				const shortText =
					plainText.length > 50
						? plainText.substring(0, 50) + "..."
						: plainText;

				return (
					<Tooltip title={<div dangerouslySetInnerHTML={{ __html: html }} />}>
						<div
							dangerouslySetInnerHTML={{
								__html: shortText,
							}}
						/>
					</Tooltip>
				);
			},
		},
		{
			title: "Quantity",
			dataIndex: "quantity",
			width: "10%",
			sorter: (a, b) => a.quantity - b.quantity,
		},
		{
			title: "Created On",
			dataIndex: "created_at",
			width: "20%",
			render: (date) => dayjs(date).format("MM/DD/YYYY"),
		},
		{
			title: "Action",
			dataIndex: "action",
			render: (_, record) => (
				<Space size="middle">
					<Tooltip title="Edit Product">
						<IconButton
							size="small"
							sx={actionIconBtn("#6366F1")}
							onClick={() => navigate(`/editProduct/${record.id}`)}
						>
							<Pencil size={16} />
						</IconButton>
					</Tooltip>

					<Tooltip title="Delete Product">
						<IconButton
							size="small"
							sx={actionIconBtn("#EF4444")}
							onClick={() => handleDelete([record.id])}
						>
							<Trash2 size={16} />
						</IconButton>
					</Tooltip>
				</Space>
			),
		},
	];

	const handleDelete = (userIds) => {
		Modal.confirm({
			title: "Confirm",
			content: `Are you sure you want to delete ${
				userIds.length > 1 ? "these products" : "this product"
			}?`,
			okText: "Yes, Delete",
			okType: "danger",
			cancelText: "No",
			onOk: async () => {
				try {
					await DeleteProduct(userIds);
					message.success("Product(s) deleted successfully");
					getData();
				} catch (error) {
					console.error("Error deleting product(s):", error);
					message.error("Error deleting product(s)");
				}
			},
		});
	};

	// Get all users
	const getData = async () => {
		try {
			setLoading(true);
			let result = await GetProduct();
			const newData = result.data.data.map((item, index) => ({
				...item,
				index: index + 1,
			}));
			setData(newData);
			setUserBackupData(newData);
		} catch (e) {
			console.log(e);
			if (e.response && e.response.status === 401) {
				navigate("/error401");
				console.log("You do not have access to this page as a sub-admin.");
			} else {
				console.log("Error loading data. Please try again later.");
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

	const onSearch = (searchField) => {
		setSearchTerm(searchField);
		if (!searchField) {
			setData(userBackupData); // reset when empty search
			return;
		}

		const lower = searchField.toLowerCase();
		const filtered = userBackupData.filter(
			(item) =>
				item.name?.toLowerCase().includes(lower) ||
				item.description?.toLowerCase().includes(lower)
		);

		setData(filtered);
	};

	const navigateToAddProduct = () => {
		navigate("/addProduct");
	};

	const onSelectChange = (newSelectedRowKeys) => {
		setSelectedRowKeys(newSelectedRowKeys);
	};

	const rowSelection = {
		selectedRowKeys,
		onChange: onSelectChange,
		selections: [
			Table.SELECTION_ALL,
			Table.SELECTION_INVERT,
			Table.SELECTION_NONE,
			{
				key: "odd",
				text: "Select Odd Row",
				onSelect: (changeableRowKeys) => {
					let newSelectedRowKeys = [];
					newSelectedRowKeys = changeableRowKeys.filter((_, index) => {
						if (index % 2 !== 0) {
							return false;
						}
						return true;
					});
					setSelectedRowKeys(newSelectedRowKeys);
				},
			},
			{
				key: "even",
				text: "Select Even Row",
				onSelect: (changeableRowKeys) => {
					let newSelectedRowKeys = [];
					newSelectedRowKeys = changeableRowKeys.filter((_, index) => {
						if (index % 2 !== 0) {
							return true;
						}
						return false;
					});
					setSelectedRowKeys(newSelectedRowKeys);
				},
			},
		],
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
							PRODUCT MANAGEMENT
						</Typography>
						<Typography
							className="page-sub-title"
							sx={{
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap",
							}}
						>
							View, delete, and add Product
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
							onClick={navigateToAddProduct}
							sx={{
								height: 44,
								px: 2.5,
								borderRadius: "8px",
								textTransform: "none",
								fontWeight: 600,
								whiteSpace: "nowrap",
							}}
						>
							Add Product
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

export default Product;