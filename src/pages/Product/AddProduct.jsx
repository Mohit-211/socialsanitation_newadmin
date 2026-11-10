import { useState } from "react";
import { Form, Input, Button, message, Card } from "antd";
import { useNavigate } from "react-router";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { CreateProduct } from "../../services/Api/Product";
import PageHeader from "../../components/PageHeader";
import RichTextEditor from "../../components/RichTextEditor";

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
		<div>
			{/* Header Section */}
			<PageHeader
				title="PRODUCT MANAGEMENT"
				subtitle="Add a new product"
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

			<Card variant="borderless">
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

					{/* Description (stored in the form field, submitted from values) */}
					<Form.Item label="Description" name="description">
						<RichTextEditor />
					</Form.Item>

					<Form.Item>
						<Button type="primary" htmlType="submit" loading={disable} icon={<Plus size={16} />}>
							{disable ? "Saving..." : "Save"}
						</Button>

						<Button onClick={() => navigate("/supplies/list")} style={{ marginLeft: "10px" }} icon={<Trash2 size={16} />}>
							Cancel
						</Button>
					</Form.Item>
				</Form>
			</Card>
		</div>
	);
};

export default AddProduct;
