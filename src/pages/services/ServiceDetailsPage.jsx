import { useLayoutEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Button, Col, Flex, Row, Tabs } from "antd";
import { ArrowLeft, CircleCheck, Star } from "lucide-react";
import { IMAGE_BASE_URL } from "@/config/env";
import {
  GetServiceById,
  GetReviewsByProductId,
} from "@/services/api/serviceApi";
import PageHeader from "@/components/PageHeader";
import "./ServiceDetailsPage.scss";

const ServiceDetailsPage = () => {
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
        console.error(err, "error");
      });
  }, [id]);

  useLayoutEffect(() => {
    GetReviewsByProductId(id)
      .then((res) => {
        setReviewData(res.data.data);
      })
      .catch((err) => {
        console.error(err, "error");
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
      <div className="view-service__stars">
        {[...Array(fullStars)].map((_, i) => (
          <Star
            key={`full-${i}`}
            size={14}
            fill="currentColor"
            className="view-service__star view-service__star--filled"
          />
        ))}
        {halfStar && (
          <Star
            key="half"
            size={14}
            fill="currentColor"
            className="view-service__star view-service__star--half"
          />
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star
            key={`empty-${i}`}
            size={14}
            fill="currentColor"
            className="view-service__star view-service__star--empty"
          />
        ))}
      </div>
    );
  };

  return (
    <div className="view-service">
      {/* Header Section */}
      <PageHeader
        title="SERVICE MANAGEMENT"
        subtitle="View complete details of the service"
        actions={
          <Button
            size="large"
            icon={<ArrowLeft size={16} />}
            onClick={navigateToService}
          >
            Return to Services
          </Button>
        }
      />

      <Tabs
        defaultActiveKey="details"
        items={[
          {
            key: "details",
            label: "Details",
            children: (
              <div className="surface surface--flat view-service__card">
                {/* Top fields */}
                <Row gutter={[24, 20]}>
                  <Col xs={24} md={12}>
                    <p className="view-service__label">Service Name</p>
                    <p className="view-service__value">
                      {serviceData?.name || "--"}
                    </p>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <p className="view-service__label">Abbreviation</p>
                    <p className="view-service__value">
                      {serviceData?.abbreviation || "--"}
                    </p>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <p className="view-service__label">Price</p>
                    <p className="view-service__value">
                      ${serviceData?.price ?? "--"}
                    </p>
                  </Col>
                </Row>

                {/* Description */}
                <div className="view-service__section">
                  <p className="view-service__label">Description</p>
                  <div
                    className="view-service__panel view-service__description"
                    dangerouslySetInnerHTML={{
                      __html: serviceData?.description || "--",
                    }}
                  />
                </div>

                {/* Checklist */}
                <div className="view-service__section">
                  <p className="view-service__label">Service Checklist</p>
                  <div className="view-service__panel">
                    {serviceData?.checklists?.length > 0 ? (
                      serviceData.checklists.map((checklist, index) => (
                        <div key={index} className="view-service__checklist">
                          <h4 className="view-service__checklist-title">
                            {checklist.heading_title}
                          </h4>
                          <ul className="view-service__tasks">
                            {checklist.tasks?.map((taskItem) => (
                              <li key={taskItem.id} className="view-service__task">
                                <CircleCheck
                                  size={14}
                                  className="view-service__task-icon"
                                />
                                {taskItem.task}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))
                    ) : (
                      <p className="view-service__empty">
                        No checklist has been assigned to this service.
                      </p>
                    )}
                  </div>
                </div>

                {/* Images */}
                <div className="view-service__section">
                  <p className="view-service__label">Service Images</p>
                  {serviceData?.service_attachments?.length > 0 ? (
                    <Row gutter={[16, 16]} style={{ marginTop: 4 }}>
                      {serviceData.service_attachments.map((attachment, index) => (
                        <Col key={index} xs={12} sm={8} md={6} lg={4} xl={3}>
                          <img
                            src={`${IMAGE_BASE_URL}${attachment.file_name}`}
                            alt={`Service graphic ${index + 1}`}
                            crossOrigin="anonymous"
                            className="view-service__image"
                          />
                        </Col>
                      ))}
                    </Row>
                  ) : (
                    <p className="view-service__empty view-service__empty--spaced">
                      No images uploaded for this service.
                    </p>
                  )}
                </div>
              </div>
            ),
          },
          {
            key: "reviews",
            label: "Reviews",
            children: (
              <div>
                {reviewData?.length === 0 && (
                  <div className="surface surface--flat view-service__card view-service__card--center">
                    <p className="view-service__reviews-empty">
                      No reviews available for this service.
                    </p>
                  </div>
                )}

                <Flex vertical gap={16}>
                  {reviewData?.map((review) => (
                    <div
                      key={review.id}
                      className="surface surface--flat surface--padded"
                    >
                      <div className="view-service__review">
                        <div className="view-service__avatar">
                          {review.reviews_user?.user_profile?.name
                            ?.charAt(0)
                            ?.toUpperCase() || "?"}
                        </div>

                        <div className="view-service__review-content">
                          <div className="view-service__review-header">
                            <div>
                              <p className="view-service__review-name">
                                {review.reviews_user?.user_profile?.name || "Anonymous"}
                              </p>
                              <div className="view-service__rating">
                                {renderStars(parseFloat(review.rating))}
                                <span className="view-service__rating-value">
                                  {review.rating}
                                </span>
                              </div>
                            </div>
                            <span className="view-service__review-date">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>

                          <p className="view-service__review-text">
                            {review.review}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </Flex>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};

export default ServiceDetailsPage;
