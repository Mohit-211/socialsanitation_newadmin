import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Alert, Button, Space, Spin, message } from "antd";
import { ArrowLeft, FileCheck, FileText, ReceiptText, Send } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ShareToggle from "@/components/ShareToggle";
import StatusTag from "@/components/StatusTag";
import { getContract, resendContract, updateContract } from "@/services/api/contractApi";
import { dataOf, errorMessage } from "@/services/apiResult";
import { useApiQuery } from "@/hooks/useApiQuery";
import { useClientFromQuery } from "@/pages/clients/useClientFromQuery";
import { NEW_DOCUMENT_PATHS } from "@/pages/clients/clientFlow";
import { formatDate, fromApiDate } from "@/utils/datetime";
import ContractForm from "./components/ContractForm";

const open = (url) => window.open(url, "_blank", "noopener");

// One contract: where it stands (sent, signed, shared), what to do
// next (resend, share, invoice it), and its fields. Saving sends a new copy.
const EditContractPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { returnPath, backLabel } = useClientFromQuery("contracts", "/contract-agreement");
  const [resending, setResending] = useState(false);

  const { data: contract, loading, reload } = useApiQuery(() => getContract(id).then(dataOf), [id], {
    errorText: "Couldn't load the contract",
  });

  const resend = async () => {
    setResending(true);
    try {
      const sentTo = dataOf(await resendContract(id))?.sent_to;
      message.success(sentTo ? `DocuSign emailed ${sentTo} again` : "DocuSign emailed the client again");
    } catch (error) {
      message.error(errorMessage(error, "Couldn't resend the contract"));
    } finally {
      setResending(false);
    }
  };

  const submit = async (changes) => {
    try {
      await updateContract(id, changes);
      message.success("Contract saved; a new copy went to the client for signature");
      navigate(returnPath);
    } catch (error) {
      message.error(errorMessage(error, "Couldn't save the contract"));
    }
  };

  if (loading && !contract) {
    return (
      <div className="page-loader">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={contract?.client_company_name || "CONTRACT"}
        subtitle={
          contract && (
            <Space size={8} wrap>
              <StatusTag code={contract.status} />
              {contract.sent_at && <span>Sent {formatDate(contract.sent_at)}</span>}
              {contract.signed_at && <span>Signed {formatDate(contract.signed_at)}</span>}
              {contract.shared_at && <span>In the client app since {formatDate(contract.shared_at)}</span>}
            </Space>
          )
        }
        actions={
          <Space wrap>
            {contract?.file_url && (
              <Button icon={<FileText size={16} />} onClick={() => open(contract.file_url)}>
                PDF
              </Button>
            )}
            {contract?.signed_file_url && (
              <Button icon={<FileCheck size={16} />} onClick={() => open(contract.signed_file_url)}>
                Signed Copy
              </Button>
            )}
            {contract && !contract.signed_at && (
              <Button icon={<Send size={16} />} onClick={resend} loading={resending}>
                Resend
              </Button>
            )}
            {contract && (
              <ShareToggle kind="contract" id={contract.id} sharedAt={contract.shared_at} onChanged={reload} />
            )}
            {contract && (
              <Button
                icon={<ReceiptText size={16} />}
                onClick={() => navigate(NEW_DOCUMENT_PATHS.invoice(contract.user_id, { contractId: contract.id }))}
              >
                Make an Invoice
              </Button>
            )}
            <Button icon={<ArrowLeft size={16} />} onClick={() => navigate(returnPath)}>
              {backLabel || "Return to Contracts"}
            </Button>
          </Space>
        }
      />
      {contract && (
        <>
          <Alert
            type="info"
            showIcon
            className="form-card"
            title="Saving makes a new PDF and sends the client a new copy to sign. Card payments go through the Square link on each invoice."
          />
          <ContractForm
            key={contract.id}
            initialValues={{
              client_company_name: contract.client_company_name,
              client_legal_name: contract.client_legal_name,
              client_representative: contract.client_representative,
              service_address: contract.service_address,
              total_monthly_price: contract.total_monthly_price,
              contract_date: fromApiDate(contract.contract_date),
            }}
            initialSignature={contract.signature || ""}
            submitLabel="Save and Send a New Copy"
            onSubmit={submit}
          />
        </>
      )}
    </>
  );
};

export default EditContractPage;
