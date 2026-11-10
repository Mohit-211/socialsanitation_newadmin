import { useEffect, useState } from "react";
import { Table, Space, message, Modal, Tooltip, Input, Button } from "antd";
import { useNavigate } from "react-router";
import { Pencil, Trash2, Plus, Search } from "lucide-react";
import dayjs from "@/lib/dayjs";
import { DeleteProduct, GetProduct } from "@/services/api/productApi";
import PageHeader from "@/components/PageHeader";
import IconAction from "@/components/IconAction";

const ProductsPage = () => {
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
					<IconAction
						icon={Pencil}
						title="Edit Product"
						onClick={() => navigate(`/editProduct/${record.id}`)}
					/>

					<IconAction
						icon={Trash2}
						title="Delete Product"
						danger
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
			console.error(e);
			if (e.response && e.response.status === 401) {
				navigate("/error401");
				console.error("You do not have access to this page as a sub-admin.");
			} else {
				console.error("Error loading data. Please try again later.");
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
					const newSelectedRowKeys = changeableRowKeys.filter((_, index) => {
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
					const newSelectedRowKeys = changeableRowKeys.filter((_, index) => {
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
		<div>
			{/* HEADER */}
			<PageHeader
				title="PRODUCT MANAGEMENT"
				subtitle="View, delete, and add Product"
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
							onClick={navigateToAddProduct}
						>
							Add Product
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

export default ProductsPage;