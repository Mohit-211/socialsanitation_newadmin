/** @format */
import React, { useLayoutEffect, useState } from "react";
import { Form, Input, Button, Upload, message, Card, Select } from "antd";
import {
	PlusOutlined,
	DeleteOutlined,
	ArrowLeftOutlined,
} from "@ant-design/icons";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { useNavigate } from "react-router-dom";
import imageCompression from "browser-image-compression";
import { CreateSerice } from "../../services/Api/ServiceApi";
import { Box } from "@mui/material";
import { GetAllChecklist } from "../../services/Api/checklistApi";

const { Option } = Select;
const AddService = () => {
	const [form] = Form.useForm();
	const [images, setImages] = useState([]);
	const [disable, setDisable] = useState(false);
	const [categoryNameData, setCategoryNameData] = useState([]);
	const [productCategoryId, setProductCategoryId] = useState("");
	const navigate = useNavigate();

	useLayoutEffect(() => {
		GetAllChecklist()
			.then((res) => setCategoryNameData(res.data.data))
			.catch((err) => console.log(err));
	}, []);

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
					: await imageCompression(file, {
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
		<Card bordered={false}>
			<Box
				display="flex"
				justifyContent="space-between"
				alignItems="center"
				marginBottom="30px"
			>
				<div>
					<h3 className="page-title">CREATE SERVICE</h3>
					<p className="page-sub-title">Add a new service</p>
				</div>
				<div>
					<Button
						style={{ marginLeft: "10px", backgroundColor: "lightgray" }}
						onClick={() => navigate("/services")}
						icon={<ArrowLeftOutlined />}
					>
						Return to Services
					</Button>
				</div>
			</Box>
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
						{images.length < 5 && <PlusOutlined />}
					</Upload>
				</Form.Item>

				{/* <Form.Item
					label="Checklist"
					name="productCategoryId"
					// rules={[
					// 	{
					// 		required: true,
					// 		message: "Please select category!",
					// 	},
					// ]}
				>
					<Select
						mode="multiple"
						placeholder="Select Checklist"
						value={productCategoryId}
						onChange={(value) => setProductCategoryId(value)}
					>
						{categoryNameData?.map((category) => (
							<Option key={category.id} value={category.id}>
								{category?.task}
							</Option>
						))}
					</Select>
				</Form.Item> */}

				<Form.Item label="Description" name="description">
					<CKEditor
						editor={ClassicEditor}
						onChange={(event, editor) =>
							form.setFieldsValue({ description: editor.getData() })
						}
					/>
				</Form.Item>

				<Form.Item>
					<Button
						type="primary"
						htmlType="submit"
						loading={disable}
						icon={<PlusOutlined />}
					>
						{disable ? "Saving..." : "Save"}
					</Button>
					<Button
						style={{ marginLeft: "10px" }}
						onClick={() => navigate("/services")}
						icon={<DeleteOutlined />}
					>
						Cancel
					</Button>
				</Form.Item>
			</Form>
		</Card>
	);
};

export default AddService;
