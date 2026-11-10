import { useState } from "react";
import { useNavigate } from "react-router";
import { Button, Card, Spin, message } from "antd";
import { ArrowLeft } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { createEstimate, getEstimateDraft } from "@/services/api/estimateApi";
import { dataOf, errorMessage } from "@/services/apiResult";
import { useApiQuery } from "@/hooks/useApiQuery";
import { useClientPicks } from "@/hooks/useClientPicks";
import { useClientFromQuery } from "@/pages/clients/useClientFromQuery";
import ClientBdmSelect from "@/pages/clients/components/ClientBdmSelect";
import EstimateForm from "./components/EstimateForm";
import { newEstimateValues } from "./estimateFields";
import "./estimates.scss";

const idFrom = (value) => Number(value) || undefined;

// A new service estimate, made from a scope of work and priced from a cost
// calculation and its bid, then sent to the client for signature. From the
// client page (?clientId=, and ?scopeId=, ?calculationId=, ?bidId= from a
// scope or a calculation) it starts from the API's draft and goes back there.
const CreateEstimatePage = () => {
  const navigate = useNavigate();
  const { clientId, fromClientPage, params, returnPath, backLabel } = useClientFromQuery("estimates", "/pdf-generation");
  const sources = {
    scopeId: idFrom(params.get("scopeId")),
    calculationId: idFrom(params.get("calculationId")),
    bidId: idFrom(params.get("bidId")),
  };
  const { data: clients, loading: loadingClients } = useClientPicks();
  const { data: draft, loading: loadingDraft } = useApiQuery(
    () => getEstimateDraft({ clientId, ...sources }).then(dataOf),
    [clientId, sources.scopeId, sources.calculationId, sources.bidId],
    { skip: !clientId, errorText: "Couldn't fill in the client's details" },
  );
  const [pickedId, setPickedId] = useState(null);
  const chosenId = pickedId ?? clientId;
  const client = clients.find((row) => row.id === clientId);

  const submit = async (estimate) => {
    try {
      await createEstimate(estimate);
      message.success("Estimate made and sent to the client for signature");
      navigate(returnPath);
    } catch (error) {
      message.error(errorMessage(error, "Couldn't make the estimate"));
    }
  };

  const loading = loadingClients || (Boolean(clientId) && loadingDraft && !draft);

  return (
    <>
      <PageHeader
        title="NEW SERVICE ESTIMATE"
        subtitle={client ? `For ${client.name || client.email}` : "Make an estimate and send it for signature"}
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
              key={draft ? `draft-${clientId}` : "new"}
              isNew
              clients={clients}
              lockClient={fromClientPage}
              initialValues={{ user_id: clientId, ...newEstimateValues(draft) }}
              submitLabel="Make the Estimate and Send It for Signature"
              onSubmit={submit}
              onClientPick={(picked) => setPickedId(picked?.id ?? null)}
            />
          </div>
          <aside className="estimate-layout__side">
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
