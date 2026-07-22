/** @format */

import React, { useLayoutEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box } from "@mui/material";
import { List, Row as AntRow, Col as AntCol } from "antd";
import Form from "react-bootstrap/Form";
import "./Service.css";
import Button from "@mui/material/Button";
import "./Rating.scss"
import { BASE_URL_IMAGE } from "../../services/Host";
import {
	GetServiceById,
	GetReviewsByProductId,
} from "../../services/Api/ServiceApi";
import { CheckCircleOutlined } from "@ant-design/icons";
import { FaStar } from "react-icons/fa";
import { Row, Col, Tabs, Tab, Container, Card } from "react-bootstrap";

const ViewService = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const [serviceData, setServiceData] = useState(null);
	const [reviewData, setReviewData] = useState([]);
	const [key, setKey] = useState("details");

	useLayoutEffect(() => {
		GetServiceById(id)
			.then((res) => {
				setServiceData(res.data.data);
			})
			.catch((err) => {
				console.log(err, "error");
			});
	}, [id]);

	useLayoutEffect(() => {
		GetReviewsByProductId(id)
			.then((res) => {
				setReviewData(res.data.data);
			})
			.catch((err) => {
				console.log(err, "error");
			});
	}, [id]);

	const navigateToService = () => {
		navigate("/services");
	};

	const renderStars = (rating) => {
		const validRating = parseFloat(rating); // Ensure rating is a valid number
		if (isNaN(validRating) || validRating < 0) return null; // Return null if the rating is invalid

		const fullStars = Math.floor(validRating); // Full stars
		const halfStar = validRating % 1 >= 0.5; // Half star check
		const emptyStars = 5 - fullStars - (halfStar ? 1 : 0); // Empty stars

		return (
			<div style={{ display: "flex", alignItems: "center" }}>
				{/* Full Stars */}
				{[...Array(fullStars)].map((_, i) => (
					<FaStar
						key={`full-${i}`}
						color="#ffc107"
						style={{ marginRight: "2px" }}
					/>
				))}
				{/* Half Star */}
				{halfStar && (
					<FaStar
						key="half"
						color="#ffc107"
						style={{ marginRight: "2px", opacity: 0.5 }}
					/>
				)}
				{/* Empty Stars */}
				{[...Array(emptyStars)].map((_, i) => (
					<FaStar
						key={`empty-${i}`}
						color="#e4e5e9"
						style={{ marginRight: "2px" }}
					/>
				))}
			</div>
		);
	};

	return (
		<Box>
			<Box
				display="flex"
				justifyContent="space-between"
				alignItems="center"
				marginBottom="30px"
			>
				<div>
					<h3 className="page-title">Service Details</h3>
					<p className="page-sub-title">View complete details of the service</p>
				</div>
				<div>
					<Button
						icon="pi pi-arrow-left"
						severity="secondary"
						onClick={navigateToService}
						style={{ borderRadius: "5px", height: "40px" }}
					>
						<span style={{ marginLeft: "5px" }}>Return to Services</span>
					</Button>
				</div>
			</Box>

			<Tabs
				id="product-tabs"
				activeKey={key}
				onSelect={(k) => setKey(k)}
				className="mb-3"
			>
				<Tab eventKey="details" title="Details">
					<Card
						style={{ width: "100%", padding: "20px", borderRadius: "10px" }}
					>
						<Form>
							{/* Service Details */}
							<AntRow gutter={[16, 16]}>
								<AntCol span={12}>
									<Form.Group className="mb-3">
										<Form.Label>Service Name:</Form.Label>
										<Form.Control value={serviceData?.name} disabled />
									</Form.Group>
								</AntCol>
								<AntCol span={6}>
									<Form.Group className="mb-3">
										<Form.Label>Abbreviation:</Form.Label>
										<Form.Control value={serviceData?.abbreviation} disabled />
									</Form.Group>
								</AntCol>
								<AntCol span={6}>
									<Form.Group className="mb-3">
										<Form.Label>Price:</Form.Label>
										<Form.Control value={`$${serviceData?.price}`} disabled />
									</Form.Group>
								</AntCol>
							</AntRow>

							{/* Description */}
							<Form.Group className="mb-3">
								<Form.Label>Description:</Form.Label>
								<div
									style={{
										backgroundColor: "#f5f5f5",
										borderRadius: "8px",
										padding: "15px",
										border: "1px solid #ddd",
									}}
									dangerouslySetInnerHTML={{ __html: serviceData?.description }}
								/>
							</Form.Group>

							{/* Checklist Section */}
							<Form.Group className="mb-3">
								<Form.Label>Service Checklist:</Form.Label>
								<div
									style={{
										padding: "15px",
										backgroundColor: "#fafafa",
										borderRadius: "10px",
										border: "1px solid #eee",
									}}
								>
									{serviceData?.checklists?.map((checklist, index) => (
										<div key={index} style={{ marginBottom: "20px" }}>
											<div
												style={{
													fontWeight: "bold",
													fontSize: "16px",
													marginBottom: "10px",
													color: "#333",
												}}
											>
												{checklist.heading_title}
											</div>
											<ul style={{ paddingLeft: "20px", marginBottom: 0 }}>
												{checklist.tasks?.map((taskItem) => (
													<li
														key={taskItem.id}
														style={{
															listStyleType: "none",
															marginBottom: "8px",
															display: "flex",
															alignItems: "center",
															color: "#555",
														}}
													>
														<CheckCircleOutlined
															style={{ color: "green", marginRight: "8px" }}
														/>
														{taskItem.task}
													</li>
												))}
											</ul>
										</div>
									))}
								</div>
							</Form.Group>

							{/* Images Section */}
							<Form.Group className="mb-3">
								<Form.Label>Service Images:</Form.Label>
								<AntRow gutter={[16, 16]} style={{ marginTop: "10px" }}>
									{serviceData?.service_attachments.map((attachment, index) => (
										<AntCol key={index} xs={12} sm={8} md={6} lg={4} xl={3}>
											<img
												src={`${BASE_URL_IMAGE}${attachment.file_name}`}
												alt={`Service graphic ${index + 1}`}
												crossOrigin="anonymous"
												style={{
													width: "100%",
													height: "150px",
													objectFit: "cover",
													borderRadius: "10px",
													boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
												}}
											/>
										</AntCol>
									))}
								</AntRow>
							</Form.Group>
						</Form>
					</Card>
				</Tab>
				<Tab eventKey="reviews" title="Reviews">
					<Container className="reviews-container">
						{reviewData?.length === 0 && (
							<Card className="no-reviews-card">
								<Card.Body>
									<p>No reviews available for this product.</p>
								</Card.Body>
							</Card>
						)}

						{reviewData?.map((review) => (
							<Card key={review.id} className="review-card">
								<Card.Body>
									<Row>
										<Col md={1} className="user-icon">
											<div className="user-circle">
												{review.reviews_user?.user_profile?.name.charAt(0)}
											</div>
										</Col>
										<Col md={11}>
											<div className="review-header">
												<div style={{ display: "flex", flexDirection: "row" }}>
													<div>
														<div className="review-name">
															{review.reviews_user?.user_profile?.name}
														</div>
														<div className="review-rating">
															{renderStars(parseFloat(review.rating))}{" "}
															{/* Individual rating stars */}
															<div className="rating-number">
																{review.rating}
															</div>
														</div>
													</div>
													<div className="review-date">
														{new Date(review.created_at).toLocaleDateString()}
													</div>
												</div>
											</div>
											<Card.Text className="review-comment">
												{review.review}
											</Card.Text>
										</Col>
									</Row>
								</Card.Body>
							</Card>
						))}
					</Container>
				</Tab>
			</Tabs>
		</Box>
	);
};

export default ViewService;
