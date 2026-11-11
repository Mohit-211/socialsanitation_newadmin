import { useState } from "react";
import { useNavigate } from "react-router";
import { Alert, Button, Card, Descriptions, Space, Spin, message } from "antd";
import { ArrowLeft, FileCheck, FileText, ReceiptText, Send } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ShareToggle from "@/components/ShareToggle";
import StatusTag from "@/components/StatusTag";
import { getContract, resendContract, updateContract } from "@/services/api/contractApi";
import { dataOf, errorMessage } from "@/services/apiResult";
import { useApiQuery } from "@/hooks/useApiQuery";
import { useClientFromQuery } from "@/pages/clients/useClientFromQuery";
import { EDIT_DOCUMENT_PATHS, NEW_DOCUMENT_PATHS, editPathFromClient } from "@/pages/clients/clientFlow";
import { canResend, isDraft, savingNote } from "@/utils/signing";
import { formatDate, fromApiDate } from "@/utils/datetime";
import ContractForm from "./components/ContractForm";
import { useRouteParam } from "@/hooks/useRouteParam";
import type { ContractInput } from "@/types";

/** Opens a link in a new tab; an empty one does nothing. */
const open = (url: string | null | undefined) => {
  if (url) window.open(url, "_blank", "noopener");
};

// One contract: where it stands (sent, signed, shared), what to do
// next (resend, share, invoice it), and its fields. Saving sends a new copy.
// A draft made from a signed estimate (step 7 of the client flow) has no
// price or PDF yet: the office prices it, checks it and saves to send it.
// Once signed, it shows what the client filled in when signing.
const EditContractPage = () => {
  const id = useRouteParam();
  const navigate = useNavigate();
  const { clientId, returnPath, backLabel } = useClientFromQuery("contracts", "/contract-agreement");
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

  const submit = async (changes: ContractInput) => {
    try {
      const res = await updateContract(id, changes);
      message.success(res.data?.message || "Contract saved and sent to the client for signature");
      navigate(returnPath);
    } catch (error) {
      message.error(errorMessage(error, "Couldn't save the contract"));
    }
  };

  const draft = isDraft(contract?.status);
  const note: { type: "info" | "warning"; title: string } = draft
    ? {
        type: "info",
        title: contract?.estimate_id
          ? "Drafted from the client's signed estimate. Set the monthly price and date, check the rest, and save: that makes the PDF and sends it to the client for signature."
          : savingNote(contract?.status).title,
      }
    : savingNote(contract?.status);
  const answers = !contract
    ? []
    : [
    { key: "date", label: "Service Start Date", children: contract.service_start_date },
    { key: "time", label: "Service Start Time", children: contract.service_start_time },
    { key: "days", label: "Service Days", children: contract.service_days },
    { key: "pay", label: "Payment Method", children: contract.payment_method },
  ];
  const estimatePath =
    contract?.estimate_id &&
    (clientId
      ? editPathFromClient("estimate", contract.estimate_id, clientId)
      : EDIT_DOCUMENT_PATHS.estimate(contract.estimate_id));

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
              {estimatePath && (
                <Button type="link" size="small" className="table-link" onClick={() => navigate(estimatePath)}>
                  From its estimate
                </Button>
              )}
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
            {contract && canResend(contract.status) && (
              <Button icon={<Send size={16} />} onClick={resend} loading={resending}>
                Resend
              </Button>
            )}
            {contract && (
              <ShareToggle kind="contract" id={contract.id} sharedAt={contract.shared_at} onChanged={reload} />
            )}
            {contract && !draft && (
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
            type={note.type}
            showIcon
            className="form-card"
            title={note.title}
            description="Card payments go through the Square link on each invoice."
          />
          {answers.some((row) => row.children) && (
            <Card title="What the Client Filled In When Signing" size="small" className="form-card">
              <Descriptions
                size="small"
                column={{ xs: 1, sm: 2 }}
                items={answers.map((row) => ({ ...row, children: row.children || "—" }))}
              />
            </Card>
          )}
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
            submitLabel={draft ? "Make the PDF and Send for Signature" : "Save and Send a New Copy"}
            onSubmit={submit}
          />
        </>
      )}
    </>
  );
};

export default EditContractPage;
