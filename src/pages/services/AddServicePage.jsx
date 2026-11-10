import { useState } from "react";
import { Form, Input, Button, Upload, message, Card } from "antd";
import { useNavigate } from "react-router";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { CreateSerice } from "@/services/api/serviceApi";
import { compressImage } from "@/utils/compressImage";
import PageHeader from "@/components/PageHeader";
import RichTextEditor from "@/components/RichTextEditor";

const AddServicePage = () => {
	const [form] = Form.useForm();
	const [images, setImages] = useState([]);
	const [disable, setDisable] = useState(false);
	const navigate = useNavigate();

	const handleImageUpload = async ({ file, onSuccess, onError }) => {
		const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

		if (!allowedTypes.includes(file.type)) {
			message.error(
				"Invalid file type. Only JPEG, JPG,WEBP and PNG are allowed."
			);
			onError();
			return;
		}

		try {
			const compressedFile =
				file.size <= 1024 * 1024
					? file
					: await compressImage(file, {
							maxSizeMB: 1,
							maxWidthOrHeight: 1920,
					  });

			setImages((prev) => [...prev, compressedFile]);
			onSuccess("ok");
		} catch (error) {
			message.error("Image compression failed.");
			onError(error);
		}
	};

	const handleRemoveImage = (file) => {
		setImages((prev) => prev.filter((img) => img !== file));
	};

	const handleSubmit = async (values) => {
		setDisable(true);
		const {
			name,
			abbreviation,
			price,
			description,
			productCategoryId = [],
		} = values;

		if (!/^[A-Za-z]{3}$/.test(abbreviation)) {
			message.error("Abbreviation must be exactly three alphabets");
			setDisable(false);
			return;
		}

		try {
			const formData = new FormData();
			formData.append("name", name);
			formData.append("abbreviation", abbreviation);
			formData.append("price", price);
			formData.append("description", description);
			images.forEach((image, index) => {
				formData.append(`images`, image, `compressed_image_${index}.jpg`);
			});

			// Only append categories and types if they exist
			productCategoryId?.forEach((id) => {
				formData.append("service_checklist_ids[]", id);
			});

			const response = await CreateSerice(formData);
			if (response.status === 201) {
				message.success("Service added successfully!");
				navigate("/services");
			}
		} catch (error) {
			if (error.response?.status === 401) {
				message.error("Token expired");
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
				title="SERVICE MANAGEMENT"
				subtitle="Add a new service"
				actions={
					<Button
						size="large"
						icon={<ArrowLeft size={16} />}
						onClick={() => navigate("/services")}
					>
						Return to Services
					</Button>
				}
			/>

			<Card variant="borderless">
				<Form layout="vertical" form={form} onFinish={handleSubmit}>
					<Form.Item
						label="Service Name"
						name="name"
						rules={[{ required: true, message: "Please enter service name" }]}
					>
						<Input placeholder="Enter Service Name" />
					</Form.Item>

					<Form.Item
						label="Abbreviation"
						name="abbreviation"
						rules={[{ required: true, message: "Please enter abbreviation" }]}
					>
						<Input placeholder="Enter Abbreviation" />
					</Form.Item>

					<Form.Item
						label="Price"
						name="price"
						rules={[{ required: true, message: "Please enter price" }]}
					>
						<Input type="number" placeholder="Enter Price" />
					</Form.Item>

					<Form.Item label="Image">
						<Upload
							customRequest={handleImageUpload}
							listType="picture-card"
							onRemove={handleRemoveImage}
							multiple
						>
							{images.length < 5 && <Plus size={16} />}
						</Upload>
					</Form.Item>

					{/* Description (stored in the form field, submitted from values) */}
					<Form.Item label="Description" name="description">
						<RichTextEditor />
					</Form.Item>

					<Form.Item>
						<Button
							type="primary"
							htmlType="submit"
							loading={disable}
							icon={<Plus size={16} />}
						>
							{disable ? "Saving..." : "Save"}
						</Button>
						<Button
							style={{ marginLeft: "10px" }}
							onClick={() => navigate("/services")}
							icon={<Trash2 size={16} />}
						>
							Cancel
						</Button>
					</Form.Item>
				</Form>
			</Card>
		</div>
	);
};

export default AddServicePage;
