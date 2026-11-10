import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Plus, Trash2, X } from "lucide-react";
import { Card, Flex, Form, Input, Select, Button, message } from "antd";
import { GetServiceById, UpdateService } from "../../services/Api/ServiceApi";
import { GetAllChecklist } from "../../services/Api/checklistApi";
import { BASE_URL_IMAGE } from "../../services/Host";
import PageHeader from "../../components/PageHeader";
import RichTextEditor from "../../components/RichTextEditor";
import "./EditService.scss";

const { Option } = Select;

const EditService = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const [form] = Form.useForm();
	const [serviceData, setServiceData] = useState({
		name: "",
		description: "",
		price: "",
		abbreviation: "",
		service_attachments: [],
		service_checklist_ids: [],
	});
	const [removedImages, setRemovedImages] = useState([]);
	const [checklistData, setChecklistData] = useState([]);
	const fileInputRef = useRef(null);

	// 🔹 Fetch Service Data
	useLayoutEffect(() => {
		if (id) {
			GetServiceById(id)
				.then((res) => {
					const data = res.data.data;
					setServiceData(data);
					form.setFieldsValue({
						name: data.name,
						price: data.price,
						description: data.description,
						abbreviation: data.abbreviation,
						service_checklist_ids: data.checklists.map((cat) => cat.heading_id),
					});
					setServiceData((prev) => ({
						...prev,
						service_checklist_ids: data.checklists.map((cat) => cat.heading_id),
					}));
				})
				.catch((err) => {
					console.error("Error fetching product details:", err);
					message.error("Error loading product details.");
				});
		}
	}, [id, form]);

	// 🔹 Fetch Checklist Data
	useLayoutEffect(() => {
		GetAllChecklist()
			.then((res) => {
				setChecklistData(res.data.data);
			})
			.catch((err) => console.error(err));
	}, []);

	const handleProfilePhotoClick = useCallback(() => {
		if (fileInputRef.current) {
			fileInputRef.current.click();
		}
	}, []);

	const handleFileChange = (event) => {
		const files = Array.from(event.target.files);
		const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

		// Filter files by type
		const validFiles = files.filter((file) => allowedTypes.includes(file.type));
		if (validFiles.length !== files.length) {
			message.error("Only Images (.jpeg, .jpg, .png,.webp) are allowed!");
			return;
		}

		// Create new file previews
		const newFilePreviews = validFiles.map((file) => ({
			file_name: URL.createObjectURL(file), // Temporary preview
			newFile: file, // Mark as new file for upload
		}));

		// Update state to show previews immediately
		setServiceData((prevData) => ({
			...prevData,
			service_attachments: [
				...prevData.service_attachments,
				...newFilePreviews,
			],
		}));
	};

	const handleRemoveExistingImage = (imageId) => {
		setRemovedImages((prev) => [...prev, imageId]);
		setServiceData((prevData) => ({
			...prevData,
			service_attachments: prevData.service_attachments.filter(
				(image) => image.id !== imageId
			),
		}));
	};

	// 🔹 Handle Description Change (rich-text editor, HTML)
	const handleEditorChange = (html) => {
		setServiceData((prevData) => ({
			...prevData,
			description: html,
		}));
	};

	// 🔹 Handle Form Submission

	const handleSubmit = () => {
		const formData = new FormData();
		formData.append("name", serviceData?.name || "");
		formData.append("description", serviceData?.description || "");
		formData.append("price", serviceData?.price || "");
		formData.append("abbreviation", serviceData?.abbreviation || "");

		// Append selected categories
		const categoryIds =
			serviceData.service_checklist_ids ||
			form.getFieldValue("service_checklist_ids");
		categoryIds.forEach((id) => {
			formData.append("service_checklist_ids[]", id);
		});

		// Append new images
		serviceData.service_attachments.forEach((attachment) => {
			if (attachment.newFile) {
				formData.append("images", attachment.newFile);
			}
		});

		// Append IDs of images to remove
		if (removedImages.length > 0) {
			removedImages.forEach((id) => {
				formData.append("removeImageIds[]", id); // ✅ Fix: Using array notation
			});
		}

		UpdateService(id, formData)
			.then((res) => {
				if (res.status === 200) {
					message.success("Service edited successfully!");
					navigate("/services");
				}
			})
			.catch((err) => {
				if (err.response && err.response.status === 401) {
					message.error("Token expired!");
					localStorage.removeItem("adminToken");
					setTimeout(() => {
						navigate("/login");
					}, 3000);
				} else {
					message.error("Something went wrong");
				}
			});
	};

	return (
		<div>
			{/* Header Section */}
			<PageHeader
				title="SERVICE MANAGEMENT"
				subtitle="Edit details of this service"
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

			<Card style={{ width: "100%" }}>
				<Form form={form} layout="vertical" onFinish={handleSubmit}>
					<Form.Item
						label="Service Name"
						name="name"
						rules={[{ required: true, message: "Name is required" }]}
					>
						<Input
							value={serviceData.name}
							onChange={(e) =>
								setServiceData((prev) => ({ ...prev, name: e.target.value }))
							}
						/>
					</Form.Item>

					<Form.Item
						label="Abbreviation"
						name="abbreviation"
						rules={[{ required: true, message: "Abbreviation is required" }]}
					>
						<Input
							value={serviceData.abbreviation}
							onChange={(e) =>
								setServiceData((prev) => ({
									...prev,
									abbreviation: e.target.value,
								}))
							}
						/>
					</Form.Item>

					<Form.Item
						label="Price"
						name="price"
						rules={[{ required: true, message: "Price is required" }]}
					>
						<Input
							type="number"
							onChange={(e) =>
								setServiceData((prev) => ({
									...prev,
									price: e.target.value,
								}))
							}
						/>
					</Form.Item>

					<Form.Item label="Checklist" name="service_checklist_ids">
						<Select
							mode="multiple"
							placeholder="Select Checklist"
							value={serviceData.service_checklist_ids}
							onChange={(value) =>
								setServiceData((prev) => ({
									...prev,
									service_checklist_ids: value,
								}))
							}
						>
							{checklistData.map((item) => (
								<Option key={item.id} value={item.id}>
									{item.title}
								</Option>
							))}
						</Select>
					</Form.Item>

					{/* Description (kept in serviceData state, submitted from state) */}
					<Form.Item label="Description:" name="description">
						<RichTextEditor
							value={serviceData.description}
							onChange={handleEditorChange}
						/>
					</Form.Item>

					<Form.Item label="Upload Images:">
						<div className="edit-service__images">
							{serviceData.service_attachments.map((attachment, index) => (
								<div key={index} className="edit-service__image">
									<img
										src={
											attachment.newFile
												? attachment.file_name
												: `${BASE_URL_IMAGE}${attachment.file_name}`
										}
										crossOrigin="anonymous"
										alt="Service"
										className="edit-service__image-preview"
									/>
									<Button
										type="text"
										danger
										size="small"
										shape="circle"
										aria-label="Remove image"
										className="edit-service__image-remove"
										icon={<X size={12} />}
										onClick={() => handleRemoveExistingImage(attachment.id)}
									/>
								</div>
							))}

							{/* Add Image Button */}
							<div>
								<Button
									icon={<Plus size={16} />}
									onClick={handleProfilePhotoClick}
								>
									Add Image
								</Button>
								<input
									type="file"
									ref={fileInputRef}
									style={{ display: "none" }}
									multiple
									onChange={handleFileChange}
								/>
							</div>
						</div>
					</Form.Item>

					<Flex gap={10}>
						<Button type="primary" htmlType="submit">
							Save
						</Button>
						<Button
							onClick={() => navigate("/services")}
							icon={<Trash2 size={16} />}
						>
							Cancel
						</Button>
					</Flex>
				</Form>
			</Card>
		</div>
	);
};

export default EditService;