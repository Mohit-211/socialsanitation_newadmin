/** @format */
import React, { useState } from "react";
import { Form, Input, Button, message, Card } from "antd";
import { PlusOutlined, DeleteOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { useNavigate } from "react-router-dom";
import { CreateProduct } from "../../services/Api/Product";
import { Box } from "@mui/material";

const AddProduct = () => {
	const [form] = Form.useForm();
	const [disable, setDisable] = useState(false);
	const navigate = useNavigate();

	const handleSubmit = async (values) => {
		setDisable(true);
		const { name, quantity, description } = values;

		try {
			const formData = new FormData();
			formData.append("name", name);
			formData.append("quantity", quantity);
			formData.append("description", description || "");

			const response = await CreateProduct(formData);

			if (response.status === 201) {
				message.success("Product added successfully!");
				navigate("/supplies/list"); 
			}
		} catch (error) {
			if (error.response?.status === 401) {
				message.error("Session expired, please login again");
				localStorage.removeItem("adminToken");
				setTimeout(() => navigate("/Login"), 1000);
			} else {
				message.error("Something went wrong");
			}
		}
		setDisable(false);
	};

	return (
		<Card bordered={false}>
			<Box display="flex" justifyContent="space-between" alignItems="center" marginBottom="30px">
				<div>
					<h3 className="page-title">CREATE PRODUCT</h3>
					<p className="page-sub-title">Add a new product</p>
				</div>

				<Button
					style={{ backgroundColor: "lightgray" }}
					onClick={() => navigate("/supplies/list")}
					icon={<ArrowLeftOutlined />}
				>
					Return to Product List
				</Button>
			</Box>

			<Form layout="vertical" form={form} onFinish={handleSubmit}>
				{/* Product Name */}
				<Form.Item
					label="Product Name"
					name="name"
					rules={[{ required: true, message: "Please enter product name" }]}
				>
					<Input placeholder="Enter Product Name" />
				</Form.Item>

				{/* Quantity */}
				<Form.Item
					label="Quantity"
					name="quantity"
					rules={[{ required: true, message: "Please enter quantity" }]}
				>
					<Input type="number" placeholder="Enter Quantity" />
				</Form.Item>

				{/* Description */}
				<Form.Item label="Description" name="description">
					<CKEditor
						editor={ClassicEditor}
						onChange={(event, editor) =>
							form.setFieldsValue({ description: editor.getData() })
						}
					/>
				</Form.Item>

				<Form.Item>
					<Button type="primary" htmlType="submit" loading={disable} icon={<PlusOutlined />}>
						{disable ? "Saving..." : "Save"}
					</Button>

					<Button onClick={() => navigate("/supplies/list")} style={{ marginLeft: "10px" }} icon={<DeleteOutlined />}>
						Cancel
					</Button>
				</Form.Item>
			</Form>
		</Card>
	);
};

export default AddProduct;
