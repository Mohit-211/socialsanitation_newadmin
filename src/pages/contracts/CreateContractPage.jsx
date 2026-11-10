import { useNavigate } from "react-router";
import { Button, Spin, message } from "antd";
import { ArrowLeft } from "lucide-react";
import dayjs from "@/lib/dayjs";
import PageHeader from "@/components/PageHeader";
import { createContract } from "@/services/api/contractApi";
import { errorMessage } from "@/services/apiResult";
import { useClientPicks } from "@/hooks/useClientPicks";
import { useClientFromQuery } from "@/pages/clients/useClientFromQuery";
import ContractForm from "./components/ContractForm";
import { contractFieldsFor } from "./contractFields";

// A new contract agreement. Opened from a client's page, the client is
// already chosen and saving goes back there.
const CreateContractPage = () => {
  const navigate = useNavigate();
  const { clientId, fromClientPage, returnPath, backLabel } = useClientFromQuery("contracts", "/contract-agreement");
  const { data: clients, loading } = useClientPicks();
  const preselected = clients.find((client) => client.id === clientId);

  const submit = async (contract) => {
    try {
      await createContract(contract);
      message.success("Contract made and sent to the client for signature");
      navigate(returnPath);
    } catch (error) {
      message.error(errorMessage(error, "Couldn't make the contract"));
    }
  };

  return (
    <>
      <PageHeader
        title="NEW CONTRACT"
        subtitle={preselected ? `For ${preselected.name || preselected.email}` : "Make a contract and send it for signature"}
        actions={
          <Button size="large" icon={<ArrowLeft size={16} />} onClick={() => navigate(returnPath)}>
            {backLabel || "Return to Contracts"}
          </Button>
        }
      />
      {loading ? (
        <div className="page-loader">
          <Spin size="large" />
        </div>
      ) : (
        <ContractForm
          key={preselected?.id ?? "new"}
          isNew
          clients={clients}
          lockClient={fromClientPage && Boolean(preselected)}
          initialValues={{ user_id: preselected?.id, contract_date: dayjs(), ...contractFieldsFor(preselected) }}
          submitLabel="Make the Contract and Send It for Signature"
          onSubmit={submit}
        />
      )}
    </>
  );
};

export default CreateContractPage;
