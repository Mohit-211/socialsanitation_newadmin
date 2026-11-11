import { useNavigate } from "react-router";
import { Button, Card, Descriptions, Empty, Rate, Space, Spin, Tabs } from "antd";
import { ArrowLeft, Pencil } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { useApiQuery } from "@/hooks/useApiQuery";
import { getService, listServiceReviews } from "@/services/api/serviceApi";
import { dataOf, itemsOf } from "@/services/apiResult";
import { formatDate } from "@/utils/datetime";
import "./ServicesPage.scss";
import { useRouteParam } from "@/hooks/useRouteParam";

// One service: what it is, the checklists its crew works through, and what clients said.
const ServiceDetailsPage = () => {
  const id = useRouteParam();
  const navigate = useNavigate();
  const { data: service, loading } = useApiQuery(() => getService(id).then(dataOf), [id], {
    errorText: "Couldn't load the service",
  });
  const { data: reviews } = useApiQuery(() => listServiceReviews(id).then(itemsOf), [id], {
    initial: [],
    errorText: "Couldn't load the reviews",
  });

  if (loading && !service) {
    return (
      <div className="page-loader">
        <Spin size="large" />
      </div>
    );
  }

  const checklists = service?.checklists ?? [];
  const details = service && (
    <div className="service-view">
      <Card size="small">
        <Descriptions
          size="small"
          column={{ xs: 1, md: 2 }}
          items={[
            { key: "name", label: "Name", children: service.name },
            { key: "abbreviation", label: "Abbreviation", children: service.abbreviation || "—" },
            {
              key: "rating",
              label: "Rating",
              span: "filled",
              children: service.average_rating ? <Rate disabled allowHalf value={Number(service.average_rating)} /> : "No reviews yet",
            },
            { key: "description", label: "Description", span: "filled", children: service.description || "—" },
          ]}
        />
      </Card>
      <Card size="small" title="Checklists">
        {checklists.length === 0 ? (
          <Empty description="No checklists. Pick them on Edit." />
        ) : (
          <div className="service-view__checklists">
            {checklists.map((checklist) => (
              <div key={checklist.heading_id}>
                <strong>{checklist.heading_title}</strong>
                <ol>
                  {(checklist.tasks || []).map((task) => (
                    <li key={task.id}>{task.task}</li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );

  const reviewList =
    (reviews || []).length === 0 ? (
      <Empty description="No reviews for this service yet." />
    ) : (
      <ul className="service-view__reviews">
        {reviews.map((review) => (
          <li key={review.id}>
            <Space size={8} wrap>
              <strong>{review.reviewer_name || "A client"}</strong>
              <Rate disabled allowHalf value={Number(review.rating) || 0} />
              <span className="text-subtle">{formatDate(review.created_at)}</span>
            </Space>
            {review.review && <p>{review.review}</p>}
          </li>
        ))}
      </ul>
    );

  return (
    <>
      <PageHeader
        title={(service?.name || "SERVICE").toUpperCase()}
        subtitle={service?.abbreviation}
        actions={
          <Space wrap>
            <Button icon={<Pencil size={16} />} onClick={() => navigate(`/editService/${id}`)}>
              Edit
            </Button>
            <Button icon={<ArrowLeft size={16} />} onClick={() => navigate("/services")}>
              All Services
            </Button>
          </Space>
        }
      />
      {service && (
        <Tabs
          items={[
            { key: "details", label: "Details", children: details },
            { key: "reviews", label: `Reviews (${(reviews || []).length})`, children: reviewList },
          ]}
        />
      )}
    </>
  );
};

export default ServiceDetailsPage;
