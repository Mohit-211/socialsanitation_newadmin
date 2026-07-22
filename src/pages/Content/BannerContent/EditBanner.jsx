/** @format */

import React, { useLayoutEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box } from "@mui/material";
import { Card } from "antd";
import { message } from "antd";
import Form from "react-bootstrap/Form";
import { Row } from "react-bootstrap";
import Button from "@mui/material/Button";
import { BASE_URL_IMAGE } from "../../../services/Host";
import DeleteIcon from "@mui/icons-material/Delete";
import { GetBannerById, UpdateBanner } from "../../../services/Api/ContentApi";

const EditBanner = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const [serviceData, setServiceData] = useState({
		banners: [],
	});
	const [images, setImages] = useState([]);
	const [imagePreviews, setImagePreviews] = useState([]);
	const [removeImageIds, setRemoveImageIds] = useState([]);

	useLayoutEffect(() => {
		GetBannerById(id)
			.then((res) => {
				setServiceData(res.data.data);
				console.log(serviceData, "banner");
				if (
					res.data.data.banners &&
					res.data.data.banners.length > 0
				) {
					const attachment = res.data.data.banners[0];
					setImagePreviews(`${BASE_URL_IMAGE}${attachment.file_name}`);
					setRemoveImageIds(attachment.id);
				}
			})
			.catch((err) => {
				console.log(err, "error");
			});
	}, [id]);

	const handleImageChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			setImages(file);
			const previewUrl = URL.createObjectURL(file);
			setImagePreviews(previewUrl);
		}
	};

	const handleRemoveImage = () => {
		setImages(null);
		setImagePreviews(null);
		setRemoveImageIds(null);
		document.getElementById("imageInput").value = "";
	};

	const onChange = (e) => {
		setServiceData({ ...serviceData, [e.target.name]: e.target.value });
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		const formData = new FormData();

		if (images) {
			formData.append("images", images);
		}

		if (removeImageIds) {
			formData.append("removeImageIds", removeImageIds);
		}

		UpdateBanner(id, formData)
			.then((res) => {
				if (res.status === 200) {
					message.success("Banner edited successfully!");
					navigate("/banner");
				}
			})
			.catch((err) => {
				if (err.response && err.response.status === 401) {
					message.error("Token expired!");
					localStorage.removeItem("adminToken");
					setTimeout(() => {
						navigate("/Login");
					}, 3000);
				} else {
					message.error("Something went wrong");
				}
			});
	};

	const navigateToService = () => {
		navigate("/banner");
	};

	return (
		<Box>
			<Box style={{ marginBottom: "30px" }}>
				<h3 className="page-title">Update Banner</h3>
				<p className="page-sub-title">Edit Banner Image</p>
			</Box>
			<Card style={{ width: "100%" }}>
				<Form>
					<Row>
						{/* <Form.Group className="mb-3">
							<Form.Label>Images:</Form.Label>
							<Form.Control
								type="file"
								name="images"
								accept="image/*"
								id="imageInput"
								onChange={handleImageChange}
								
							/>
							{imagePreviews.map((preview, index) => (
								<div
									key={index}
									style={{
										border: "1px solid #ccc",
										borderRadius: "5px",
										padding: "10px",
										marginBottom: "10px",
										marginTop: "20px",
									}}
								>
									<div style={{ display: "flex", alignItems: "center" }}>
										<img
											src={preview}
											alt={`Preview ${index}`}
											crossOrigin="anonymous"
											style={{
												height: "80px",
												width: "80px",
												marginRight: "10px",
											}}
										/>
										<DeleteIcon
											fontSize="large"
											color="warning"
											style={{ marginLeft: "auto", cursor: "pointer" }}
											onClick={() => handleRemoveImage(index)}
										/>
									</div>
								</div>
							))}
						</Form.Group> */}

<Form.Group className="mb-3">
								<Form.Label>Image:</Form.Label>
								<Form.Control
									type="file"
									accept="image/*"
									id="imageInput"
									onChange={handleImageChange}
								/>
							</Form.Group>

							{imagePreviews && (
								<div
									style={{
										border: "1px solid #ccc",
										borderRadius: "5px",
										padding: "10px",
										marginBottom: "10px",
									}}
								>
									<div style={{ display: "flex", alignItems: "center" }}>
										<img
											src={imagePreviews}
											alt="Preview"
											style={{
												height: "80px",
												width: "80px",
												marginRight: "10px",
											}}
										/>
										<DeleteIcon
											fontSize="large"
											color="warning"
											style={{ marginLeft: "auto", cursor: "pointer" }}
											onClick={handleRemoveImage}
										/>
									</div>
								</div>
							)}
					</Row>

					<div>
						<Button
							icon="pi pi-check"
							severity="info"
							onClick={handleSubmit}
							style={{
								height: "45px",
								padding: "20px",
								borderRadius: "5px",
							}}
						>
							Save
						</Button>

						<Button
							icon="pi pi-times"
							severity="secondary"
							onClick={navigateToService}
							style={{
								marginLeft: "10px",
								marginTop: "10px",
								height: "45px",
								padding: "20px",
								borderRadius: "5px",
							}}
						>
							Cancel
						</Button>
					</div>
				</Form>
			</Card>
		</Box>
	);
};

export default EditBanner;
