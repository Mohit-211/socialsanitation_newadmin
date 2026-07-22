/** @format */

import React, { useLayoutEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box } from "@mui/material";
import { Card, Form, Input, Button, message } from "antd";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { ArrowLeftOutlined, DeleteOutlined } from "@ant-design/icons";
import { GetProductById, UpdateProduct } from "../../services/Api/Product";

const EditProduct = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const [form] = Form.useForm();

	const [productData, setProductData] = useState({
		name: "",
		quantity: "",
		description: "",
	});

	// Fetch Product Data
	useLayoutEffect(() => {
		if (id) {
			GetProductById(id)
				.then((res) => {
					const data = res.data.data;
					setProductData(data);
					form.setFieldsValue({
						name: data.name,
						quantity: data.quantity,
						description: data.description,
					});
				})
				.catch((err) => {
					console.error("Error fetching product details:", err);
					message.error("Error loading product details.");
				});
		}
	}, [id, form]);

	const handleEditorChange = (event, editor) => {
		const data = editor.getData();
		setProductData((prevData) => ({
			...prevData,
			description: data,
		}));
	};

	// Handle Submit
	const handleSubmit = () => {
		const formData = new FormData();
		formData.append("name", productData?.name || "");
		formData.append("quantity", productData?.quantity || "");
		formData.append("description", productData?.description || "");

		UpdateProduct(id, formData)
			.then((res) => {
				if (res.status === 200) {
					message.success("Product updated successfully!");
					navigate("/supplies/list");
				}
			})
			.catch((err) => {
				if (err.response && err.response.status === 401) {
					message.error("Token expired!");
					localStorage.removeItem("adminToken");
					setTimeout(() => navigate("/login"), 1000);
				} else {
					message.error("Something went wrong");
				}
			});
	};

	return (
		<Box>
			{/* Header Section */}
			<Box
				display="flex"
				justifyContent="space-between"
				alignItems="center"
				marginBottom="20px"
			>
				<div>
					<h3 className="page-title">UPDATE PRODUCT</h3>
					<p className="page-sub-title">Edit product details</p>
				</div>

				<Button
					style={{ backgroundColor: "lightgray" }}
					onClick={() => navigate("/supplies/list")}
					icon={<ArrowLeftOutlined />}
				>
					Return to Product List
				</Button>
			</Box>

			<Card style={{ width: "100%" }}>
				<Form form={form} layout="vertical" onFinish={handleSubmit}>
					{/* Product Name */}
					<Form.Item
						label="Product Name"
						name="name"
						rules={[{ required: true, message: "Product name is required" }]}
					>
						<Input
							value={productData.name}
							onChange={(e) =>
								setProductData((prev) => ({
									...prev,
									name: e.target.value,
								}))
							}
						/>
					</Form.Item>

					{/* Quantity */}
					<Form.Item
						label="Quantity"
						name="quantity"
						rules={[{ required: true, message: "Quantity is required" }]}
					>
						<Input
							type="number"
							value={productData.quantity}
							onChange={(e) =>
								setProductData((prev) => ({
									...prev,
									quantity: e.target.value,
								}))
							}
						/>
					</Form.Item>

					{/* Description */}
					<Form.Item label="Description" name="description">
						<CKEditor
							editor={ClassicEditor}
							data={productData.description}
							onChange={handleEditorChange}
						/>
					</Form.Item>

					<Box display="flex" gap="10px">
						<Button type="primary" htmlType="submit">
							Save
						</Button>

						<Button
							icon={<DeleteOutlined />}
							onClick={() => navigate("/supplies/list")}
						>
							Cancel
						</Button>
					</Box>
				</Form>
			</Card>
		</Box>
	);
};

export default EditProduct;
