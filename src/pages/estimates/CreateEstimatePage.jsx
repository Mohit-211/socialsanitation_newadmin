import { useState } from "react";
import { useNavigate } from "react-router";
import { Button, Card, Spin, message } from "antd";
import { ArrowLeft } from "lucide-react";
import dayjs from "@/lib/dayjs";
import PageHeader from "@/components/PageHeader";
import { createEstimate } from "@/services/api/estimateApi";
import { errorMessage } from "@/services/apiResult";
import { useClientPicks } from "@/hooks/useClientPicks";
import { useClientFromQuery } from "@/pages/clients/useClientFromQuery";
import ClientBdmSelect from "@/pages/clients/components/ClientBdmSelect";
import EstimateForm from "./components/EstimateForm";
import EstimateScopeNote from "./components/EstimateScopeNote";
import { estimateFieldsFor } from "./estimateFields";
import "./estimates.scss";

// A new service estimate. It prints the client's newest scope of work and goes
// to the client for signature. Opened from a client's page, the client is
// already chosen and saving goes back there.
const CreateEstimatePage = () => {
  const navigate = useNavigate();
  const { clientId, fromClientPage, returnPath, backLabel } = useClientFromQuery("estimates", "/pdf-generation");
  const { data: clients, loading } = useClientPicks();
  const preselected = clients.find((client) => client.id === clientId);
  const [pickedId, setPickedId] = useState(null);
  const chosenId = pickedId ?? preselected?.id;

  const submit = async (estimate) => {
    try {
      await createEstimate(estimate);
      message.success("Estimate made and sent to the client for signature");
      navigate(returnPath);
    } catch (error) {
      message.error(errorMessage(error, "Couldn't make the estimate"));
    }
  };

  return (
    <>
      <PageHeader
        title="NEW SERVICE ESTIMATE"
        subtitle={preselected ? `For ${preselected.name || preselected.email}` : "Make an estimate and send it for signature"}
        actions={
          <Button size="large" icon={<ArrowLeft size={16} />} onClick={() => navigate(returnPath)}>
            {backLabel || "Return to Estimates"}
          </Button>
        }
      />
      {loading ? (
        <div className="page-loader">
          <Spin size="large" />
        </div>
      ) : (
        <div className="estimate-layout">
          <div className="estimate-layout__main">
            <EstimateForm
              key={preselected?.id ?? "new"}
              isNew
              clients={clients}
              lockClient={fromClientPage && Boolean(preselected)}
              initialValues={{ user_id: preselected?.id, signed_date: dayjs(), ...estimateFieldsFor(preselected) }}
              submitLabel="Make the Estimate and Send It for Signature"
              onSubmit={submit}
              onClientPick={(client) => setPickedId(client?.id ?? null)}
            />
          </div>
          <aside className="estimate-layout__side">
            <EstimateScopeNote clientId={chosenId} />
            <Card title="Representative (BDM)" size="small" className="form-card">
              <ClientBdmSelect clientId={chosenId} />
            </Card>
          </aside>
        </div>
      )}
    </>
  );
};

export default CreateEstimatePage;
