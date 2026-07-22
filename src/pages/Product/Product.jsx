/** @format */

import React, { useEffect, useState } from "react";
import { Table, Space, message, Modal, Tooltip } from "antd";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import dayjs from "@/lib/dayjs";
import { DeleteProduct, GetProduct } from "../../services/Api/Product";

const Product = () => {
	const navigate = useNavigate();
	const [data, setData] = useState([]);
	const [userBackupData, setUserBackupData] = useState([]);
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
					<Button
						icon="pi pi-pencil"
						rounded
						outlined
						className="mr-2"
						style={{ margin: 0, borderRadius: "25px" }}
						onClick={() => navigate(`/editProduct/${record.id}`)}
					/>
					<Button
						icon="pi pi-trash"
						rounded
						outlined
						severity="danger"
						style={{ borderRadius: "25px", color: "red", borderColor: "red" }}
						onClick={() => handleDelete([record.id])}
					/>
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
		console.log("selectedRowKeys changed: ", newSelectedRowKeys);
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
			<Box
				display="flex"
				justifyContent="space-between"
				alignItems="center"
				marginBottom="20px"
			>
				<div>
					<h3 className="page-title">PRODUCT MANAGEMENT</h3>
					<p className="page-sub-title">View, delete, and add Product</p>
				</div>
				<Box display="flex" justifyContent="space-between" alignItems="center">
					<Box>
						<span className="p-input-icon-left">
							<i className="pi pi-search" />
							<InputText
								type="search"
								onChange={(e) => {
									onSearch(e.target.value);
								}}
								placeholder="Search..."
							/>
						</span>

						<Button
							icon="pi pi-trash"
							severity="danger"
							style={{
								marginLeft: "10px",
								borderRadius: "5px",
								height: "47px",
								cursor: "pointer",
							}}
							onClick={() => handleDelete(selectedRowKeys)}
							disabled={!selectedRowKeys.length}
						/>
						<Button
							icon="pi pi-plus"
							severity="info"
							style={{
								margin: "0px 10px",
								borderRadius: "5px",
								height: "47px",
							}}
							onClick={navigateToAddProduct}
						/>
					</Box>
				</Box>
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

export default Product;
