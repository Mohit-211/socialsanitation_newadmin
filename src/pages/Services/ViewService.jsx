/** @format */

import React, { useLayoutEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import Button from "@mui/material/Button";
import { Row, Col, Tabs } from "antd";
import { CheckCircleOutlined, StarFilled } from "@ant-design/icons";
import { ArrowLeft } from "lucide-react";
import { BASE_URL_IMAGE } from "../../services/Host";
import {
  GetServiceById,
  GetReviewsByProductId,
} from "../../services/Api/ServiceApi";
import "./Rating.scss";

const ViewService = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [serviceData, setServiceData] = useState(null);
  const [reviewData, setReviewData] = useState([]);

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
    const validRating = parseFloat(rating);
    if (isNaN(validRating) || validRating < 0) return null;

    const fullStars = Math.floor(validRating);
    const halfStar = validRating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    return (
      <div style={{ display: "flex", alignItems: "center" }}>
        {[...Array(fullStars)].map((_, i) => (
          <StarFilled
            key={`full-${i}`}
            style={{ color: "#ffc107", marginRight: 2, fontSize: 14 }}
          />
        ))}
        {halfStar && (
          <StarFilled
            key="half"
            style={{ color: "#ffc107", marginRight: 2, opacity: 0.5, fontSize: 14 }}
          />
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <StarFilled
            key={`empty-${i}`}
            style={{ color: "#e4e5e9", marginRight: 2, fontSize: 14 }}
          />
        ))}
      </div>
    );
  };

  const fieldLabelSx = {
    fontSize: "11.5px",
    fontWeight: 700,
    color: "#6b7280",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    mb: 0.5,
  };

  const fieldValueSx = {
    fontSize: "14.5px",
    color: "#111827",
    fontWeight: 500,
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
              SERVICE MANAGEMENT
            </Typography>
            <Typography
              className="page-sub-title"
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              View complete details of the service
            </Typography>
          </Box>

          <Button
            variant="contained"
            disableElevation
            startIcon={<ArrowLeft size={18} />}
            onClick={navigateToService}
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
            Return to Services
          </Button>
        </Box>
      </Paper>

      <Tabs
        defaultActiveKey="details"
        items={[
          {
            key: "details",
            label: "Details",
            children: (
              <Card
                variant="outlined"
                sx={{
                  p: 3,
                  borderRadius: "10px",
                  borderColor: "#eef0f2",
                  boxShadow: "none",
                }}
              >
                {/* Top fields */}
                <Row gutter={[24, 20]}>
                  <Col span={12}>
                    <Typography sx={fieldLabelSx}>Service Name</Typography>
                    <Typography sx={fieldValueSx}>
                      {serviceData?.name || "--"}
                    </Typography>
                  </Col>
                  <Col span={6}>
                    <Typography sx={fieldLabelSx}>Abbreviation</Typography>
                    <Typography sx={fieldValueSx}>
                      {serviceData?.abbreviation || "--"}
                    </Typography>
                  </Col>
                  <Col span={6}>
                    <Typography sx={fieldLabelSx}>Price</Typography>
                    <Typography sx={fieldValueSx}>
                      ${serviceData?.price ?? "--"}
                    </Typography>
                  </Col>
                </Row>

                {/* Description */}
                <Box sx={{ mt: 3 }}>
                  <Typography sx={fieldLabelSx}>Description</Typography>
                  <Box
                    sx={{
                      backgroundColor: "#f9fafb",
                      borderRadius: "10px",
                      p: 2,
                      border: "1px solid #eef0f2",
                      fontSize: "14px",
                      color: "#374151",
                      lineHeight: 1.6,
                    }}
                    dangerouslySetInnerHTML={{
                      __html: serviceData?.description || "--",
                    }}
                  />
                </Box>

                {/* Checklist */}
                <Box sx={{ mt: 3 }}>
                  <Typography sx={fieldLabelSx}>Service Checklist</Typography>
                  <Box
                    sx={{
                      p: 2,
                      backgroundColor: "#f9fafb",
                      borderRadius: "10px",
                      border: "1px solid #eef0f2",
                    }}
                  >
                    {serviceData?.checklists?.length > 0 ? (
                      serviceData.checklists.map((checklist, index) => (
                        <Box key={index} sx={{ mb: 2.5, "&:last-child": { mb: 0 } }}>
                          <Typography
                            sx={{
                              fontWeight: 700,
                              fontSize: "14.5px",
                              color: "#1a1a1a",
                              mb: 1,
                            }}
                          >
                            {checklist.heading_title}
                          </Typography>
                          <Box component="ul" sx={{ pl: 0, m: 0, listStyle: "none" }}>
                            {checklist.tasks?.map((taskItem) => (
                              <Box
                                component="li"
                                key={taskItem.id}
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                  color: "#4b5563",
                                  fontSize: "13.5px",
                                  mb: 1,
                                }}
                              >
                                <CheckCircleOutlined
                                  style={{ color: "#16a34a", fontSize: 14 }}
                                />
                                {taskItem.task}
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      ))
                    ) : (
                      <Typography sx={{ color: "#9ca3af", fontSize: "13.5px" }}>
                        No checklist has been assigned to this service.
                      </Typography>
                    )}
                  </Box>
                </Box>

                {/* Images */}
                <Box sx={{ mt: 3 }}>
                  <Typography sx={fieldLabelSx}>Service Images</Typography>
                  {serviceData?.service_attachments?.length > 0 ? (
                    <Row gutter={[16, 16]} style={{ marginTop: 4 }}>
                      {serviceData.service_attachments.map((attachment, index) => (
                        <Col key={index} xs={12} sm={8} md={6} lg={4} xl={3}>
                          <Box
                            component="img"
                            src={`${BASE_URL_IMAGE}${attachment.file_name}`}
                            alt={`Service graphic ${index + 1}`}
                            crossOrigin="anonymous"
                            sx={{
                              width: "100%",
                              height: "150px",
                              objectFit: "cover",
                              borderRadius: "10px",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                            }}
                          />
                        </Col>
                      ))}
                    </Row>
                  ) : (
                    <Typography sx={{ color: "#9ca3af", fontSize: "13.5px", mt: 1 }}>
                      No images uploaded for this service.
                    </Typography>
                  )}
                </Box>
              </Card>
            ),
          },
          {
            key: "reviews",
            label: "Reviews",
            children: (
              <Box>
                {reviewData?.length === 0 && (
                  <Card
                    variant="outlined"
                    sx={{
                      p: 3,
                      borderRadius: "10px",
                      borderColor: "#eef0f2",
                      boxShadow: "none",
                      textAlign: "center",
                    }}
                  >
                    <Typography sx={{ color: "#9ca3af" }}>
                      No reviews available for this service.
                    </Typography>
                  </Card>
                )}

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {reviewData?.map((review) => (
                    <Card
                      key={review.id}
                      variant="outlined"
                      sx={{
                        p: 2.5,
                        borderRadius: "10px",
                        borderColor: "#eef0f2",
                        boxShadow: "none",
                      }}
                    >
                      <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "#eef2ff",
                            color: "#4f46e5",
                            fontWeight: 700,
                            fontSize: "16px",
                            flexShrink: 0,
                          }}
                        >
                          {review.reviews_user?.user_profile?.name
                            ?.charAt(0)
                            ?.toUpperCase() || "?"}
                        </Box>

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              flexWrap: "wrap",
                              gap: 1,
                            }}
                          >
                            <Box>
                              <Typography
                                sx={{ fontWeight: 600, fontSize: "14.5px", color: "#111827" }}
                              >
                                {review.reviews_user?.user_profile?.name || "Anonymous"}
                              </Typography>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                                {renderStars(parseFloat(review.rating))}
                                <Typography sx={{ fontSize: "12.5px", color: "#6b7280" }}>
                                  {review.rating}
                                </Typography>
                              </Box>
                            </Box>
                            <Typography sx={{ fontSize: "12.5px", color: "#9ca3af" }}>
                              {new Date(review.created_at).toLocaleDateString()}
                            </Typography>
                          </Box>

                          <Typography
                            sx={{
                              mt: 1.5,
                              fontSize: "13.5px",
                              color: "#374151",
                              lineHeight: 1.6,
                            }}
                          >
                            {review.review}
                          </Typography>
                        </Box>
                      </Box>
                    </Card>
                  ))}
                </Box>
              </Box>
            ),
          },
        ]}
      />
    </Box>
  );
};

export default ViewService;