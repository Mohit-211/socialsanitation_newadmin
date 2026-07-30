/** @format */
import React, { useState } from "react";
import { Form, Input, Button, message, Card } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { useNavigate } from "react-router-dom";
import { CreateProduct } from "../../services/Api/Product";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import MuiButton from "@mui/material/Button";
import { ArrowLeft } from "lucide-react";

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
		<Box>
			{/* Header Section */}
			<Paper
				variant="outlined"
				sx={{
					p: 2.5,
					mb: 3,
					borderRadius: "10px",
					borderColor: "#eef0f2",
				}}
			>
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						gap: 2,
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
							Add a new product
						</Typography>
					</Box>

					<MuiButton
						variant="contained"
						disableElevation
						startIcon={<ArrowLeft size={18} />}
						onClick={() => navigate("/supplies/list")}
						sx={{
							height: 46,
							px: 3,
							borderRadius: "8px",
							minWidth: 180,
							textTransform: "none",
							fontWeight: 600,
							backgroundColor: "#2c3345",
							flexShrink: 0,
							"&:hover": {
								backgroundColor: "#1f2433",
							},
						}}
					>
						Return to Product List
					</MuiButton>
				</Box>
			</Paper>

			<Card bordered={false}>
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
		</Box>
	);
};

export default AddProduct;