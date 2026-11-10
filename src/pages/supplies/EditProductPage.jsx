import { useLayoutEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Card, Flex, Form, Input, Button, message } from "antd";
import { ArrowLeft, Trash2 } from "lucide-react";
import { getProduct, updateProduct } from "@/services/api/productApi";
import { errorMessage } from "@/services/apiResult";
import PageHeader from "@/components/PageHeader";
import RichTextEditor from "@/components/RichTextEditor";

const EditProductPage = () => {
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
			getProduct(id)
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

	const handleEditorChange = (html) => {
		setProductData((prevData) => ({
			...prevData,
			description: html,
		}));
	};

	// Handle Submit
	const handleSubmit = () => {
		const formData = new FormData();
		formData.append("name", productData?.name || "");
		formData.append("quantity", productData?.quantity || "");
		formData.append("description", productData?.description || "");

		updateProduct(id, formData)
			.then(() => {
				message.success("Product saved");
				navigate("/supplies/list");
			})
			.catch((err) => message.error(errorMessage(err, "Couldn't save the product")));
	};

	return (
		<div>
			{/* Header Section */}
			<PageHeader
				title="PRODUCT MANAGEMENT"
				subtitle="Edit product details"
				actions={
					<Button
						size="large"
						icon={<ArrowLeft size={16} />}
						onClick={() => navigate("/supplies/list")}
					>
						Return to Product List
					</Button>
				}
			/>

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

					{/* Description (kept in productData state, submitted from state) */}
					<Form.Item label="Description" name="description">
						<RichTextEditor
							value={productData.description}
							onChange={handleEditorChange}
						/>
					</Form.Item>

					<Flex gap={10}>
						<Button type="primary" htmlType="submit">
							Save
						</Button>

						<Button
							icon={<Trash2 size={16} />}
							onClick={() => navigate("/supplies/list")}
						>
							Cancel
						</Button>
					</Flex>
				</Form>
			</Card>
		</div>
	);
};

export default EditProductPage;
