import { useNavigate, useParams } from "react-router";
import { Button, Spin, message } from "antd";
import { ArrowLeft } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { useApiQuery } from "@/hooks/useApiQuery";
import { getService, updateService } from "@/services/api/serviceApi";
import { dataOf, errorMessage } from "@/services/apiResult";
import ServiceForm from "./components/ServiceForm";
import "./ServicesPage.scss";

// One service's name, abbreviation, description and checklists.
const EditServicePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: service, loading } = useApiQuery(() => getService(id).then(dataOf), [id], {
    errorText: "Couldn't load the service",
  });

  const submit = async (changes) => {
    try {
      await updateService(id, changes);
      message.success("Service saved");
      navigate(`/viewService/${id}`);
    } catch (error) {
      message.error(errorMessage(error, "Couldn't save the service"));
    }
  };

  return (
    <>
      <PageHeader
        title={`EDIT ${(service?.name || "SERVICE").toUpperCase()}`}
        actions={
          <Button size="large" icon={<ArrowLeft size={16} />} onClick={() => navigate("/services")}>
            All Services
          </Button>
        }
      />
      {loading && !service ? (
        <div className="page-loader">
          <Spin size="large" />
        </div>
      ) : (
        service && (
          <div className="service-form-page">
            <ServiceForm
              key={service.id}
              initialValues={{
                name: service.name,
                abbreviation: service.abbreviation,
                description: service.description,
                service_checklist_ids: (service.checklists || []).map((checklist) => checklist.heading_id),
              }}
              submitLabel="Save the Service"
              onSubmit={submit}
            />
          </div>
        )
      )}
    </>
  );
};

export default EditServicePage;
