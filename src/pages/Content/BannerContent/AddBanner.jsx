/** @format */

import React, { useState } from "react";
import { Box } from "@mui/material";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Form from "react-bootstrap/Form";

import { useNavigate } from "react-router-dom";
import imageCompression from "browser-image-compression";
import { message } from "antd";
import DeleteIcon from "@mui/icons-material/Delete";
import { CreateBanner } from "../../../services/Api/ContentApi";

const AddBanner = () => {

	const [images, setImages] = useState([]);
	const [imagePreviews, setImagePreviews] = useState([]);
	const [disable, setDisable] = useState(false);
	const navigate = useNavigate();

	const handleImageChange = async (e) => {
		const files = e.target.files;

		if (files.length > 0) {
			const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];

			const compressedImages = [];
			const imagePreviews = [];

			for (const file of files) {
				if (!allowedTypes.includes(file.type)) {
					console.error(
						"Error: Invalid file type. Images (JPEG, JPG, PNG) only!"
					);
					return;
				}

				const compressedFile =
					file.size <= 1024 * 1024
						? file
						: await imageCompression(file, {
								maxSizeMB: 1,
								maxWidthOrHeight: 1920,
						  });

				compressedImages.push(
					new Blob([compressedFile], { type: "image/jpeg" })
				);

				// Create image preview URL
				const previewUrl = URL.createObjectURL(compressedFile);
				imagePreviews.push({ name: file.name, previewUrl });
			}

			setImages(compressedImages);
			setImagePreviews(imagePreviews);
		}
	};

	const handleRemoveImage = (index) => {
		const updatedImages = [...images];
		const updatedPreviews = [...imagePreviews];

		updatedImages.splice(index, 1);
		updatedPreviews.splice(index, 1);

		setImages(updatedImages);
		setImagePreviews(updatedPreviews);
	};



	const handleSubmit = async (event) => {
		event.preventDefault();

		setDisable(true);


		try {
			const formData = new FormData();
			if (images.length > 0) {
				images.forEach((image, index) => {
					formData.append(`images`, image, `compressed_image_${index}.jpg`);
				});
			}

			const response = await CreateBanner(formData);

			if (response.status === 201) {
				message.success("Banner addedd successfully!");
			}
			navigate("/banner");
			setDisable(false);
		} catch (error) {
			if (error.response.status === 401) {
				message.error("Token expired");
				localStorage.removeItem("adminToken");
				setTimeout(() => {
					navigate("/Login");
				}, 1000);
			} else {
				message.error("Something went wrong");
			}
			setDisable(false);
		}
	};

	const navigateToService = () => {
		navigate("/banner");
	};

	return (
		<Box>
			<Box style={{ marginBottom: "30px" }}>
				<h3 className="page-title">Create Banner</h3>
				<p className="page-sub-title">Add new Banner</p>
			</Box>
			<Card className="service_card">
				<div>
					<Form onSubmit={handleSubmit}>
						

					

						<Form.Group className="mb-3">
							<Form.Label>Image:</Form.Label>
							<Form.Control
								type="file"
								required
								accept="image/*"
								id="imageInput"
								onChange={handleImageChange}
								multiple
							/>
						</Form.Group>

						{imagePreviews.map((preview, index) => (
							<div
								key={index}
								style={{
									border: "1px solid #ccc",
									borderRadius: "5px",
									padding: "10px",
									marginBottom: "10px",
								}}
							>
								<div style={{ display: "flex", alignItems: "center" }}>
									<img
										src={preview.previewUrl}
										alt={`Preview ${index}`}
										style={{
											height: "80px",
											width: "80px",
											marginRight: "10px",
										}}
									/>
									<span>{preview.name}</span>
									<DeleteIcon
										fontSize="large"
										color="warning"
										style={{ marginLeft: "auto", cursor: "pointer" }}
										onClick={() => handleRemoveImage(index)}
									/>
								</div>
							</div>
						))}


						<div>
							<Button
								icon="pi pi-check"
								severity="info"
								onClick={handleSubmit}
								disabled={disable}
								style={{
              
									height:"45px",
									padding:"20px",
									borderRadius:"5px"
								  }}
							>
								{disable ? "Saving...." : "Save"}
							</Button>
							<Button
								icon="pi pi-times"
								severity="secondary"
								onClick={navigateToService}
								style={{
									marginLeft: "10px",
									marginTop: "10px",
									height:"45px",
									padding:"20px",
									borderRadius:"5px"
								  }}
							>
								Cancel
							</Button>
						</div>
					</Form>
				</div>
			</Card>
		</Box>
	);
};

export default AddBanner;


