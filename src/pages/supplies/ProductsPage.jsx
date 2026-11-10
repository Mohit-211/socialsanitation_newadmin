import { useEffect, useState } from "react";
import { Table, Space, message, Modal, Tooltip, Input, Button } from "antd";
import { useNavigate } from "react-router";
import { Pencil, Trash2, Plus, Search } from "lucide-react";
import { formatDate } from "@/utils/datetime";
import { deleteProduct, listProducts } from "@/services/api/productApi";
import { errorMessage } from "@/services/apiResult";
import { PERMISSION, useCan } from "@/lib/session";
import PageHeader from "@/components/PageHeader";
import IconAction from "@/components/IconAction";

const ProductsPage = () => {
	const navigate = useNavigate();
	// Deleting is Super Admin only (records.delete); others don't see it.
	const canDelete = useCan(PERMISSION.DELETE_RECORDS);
	const [data, setData] = useState([]);
	const [userBackupData, setUserBackupData] = useState([]);
	const [loading, setLoading] = useState(true);
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
			render: (date) => formatDate(date),
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

					{canDelete && (
						<IconAction
							icon={Trash2}
							title="Delete Product"
							danger
							onClick={() => handleDelete([record.id])}
						/>
					)}
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
					// One at a time: the API deletes a product by its id.
					for (const productId of userIds) await deleteProduct(productId);
					message.success(userIds.length > 1 ? "Products deleted" : "Product deleted");
					getData();
				} catch (error) {
					message.error(errorMessage(error, "Couldn't delete the product"));
					getData();
				}
			},
		});
	};

	// Get all users
	// Every product, numbered; state is set once the request settles.
	const loadData = () =>
		listProducts({ page: 1, limit: 500 })
			.then((result) => {
				const newData = (result.data.data?.items || []).map((item, index) => ({ ...item, index: index + 1 }));
				setData(newData);
				setUserBackupData(newData);
			})
			.catch((error) => message.error(errorMessage(error, "Couldn't load the supplies")))
			.finally(() => setLoading(false));

	const getData = () => {
		setLoading(true);
		return loadData();
	};

	useEffect(() => {
		loadData();
		// Loaded once on opening; the table pages through the loaded list.
	}, []);

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
				rowSelection={canDelete ? rowSelection : undefined}
				bordered
				size="middle"
			/>
		</div>
	);
};

export default ProductsPage;