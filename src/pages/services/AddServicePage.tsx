import { useNavigate } from "react-router";
import { Button, message } from "antd";
import { ArrowLeft } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { createService, type ServiceInput } from "@/services/api/serviceApi";
import { dataOf, errorMessage } from "@/services/apiResult";
import ServiceForm from "./components/ServiceForm";
import "./ServicesPage.scss";

// A new service.
const AddServicePage = () => {
  const navigate = useNavigate();
  const submit = async (service: ServiceInput) => {
    try {
      const saved = dataOf(await createService(service));
      message.success("Service added");
      navigate(saved?.id ? `/viewService/${saved.id}` : "/services");
    } catch (error) {
      message.error(errorMessage(error, "Couldn't add the service"));
    }
  };
  return (
    <>
      <PageHeader
        title="ADD SERVICE"
        subtitle="A service is a name and a short description; prices are agreed per client"
        actions={
          <Button size="large" icon={<ArrowLeft size={16} />} onClick={() => navigate("/services")}>
            All Services
          </Button>
        }
      />
      <div className="service-form-page">
        <ServiceForm isNew initialValues={{ service_checklist_ids: [] }} submitLabel="Add the Service" onSubmit={submit} />
      </div>
    </>
  );
};

export default AddServicePage;
