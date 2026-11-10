import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Alert, Button, Card, Space, Spin, Tabs, message } from "antd";
import { ArrowLeft, FileCheck, FilePlus2, FileText, Handshake, Send } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ShareToggle from "@/components/ShareToggle";
import StatusTag from "@/components/StatusTag";
import { getEstimate, resendEstimate, updateEstimate } from "@/services/api/estimateApi";
import { dataOf, errorMessage } from "@/services/apiResult";
import { useApiQuery } from "@/hooks/useApiQuery";
import { useClientFromQuery } from "@/pages/clients/useClientFromQuery";
import { EDIT_DOCUMENT_PATHS, NEW_DOCUMENT_PATHS, editPathFromClient } from "@/pages/clients/clientFlow";
import { useClientDocuments } from "@/hooks/useClientDocuments";
import { canResend, savingNote } from "@/utils/signing";
import ClientBdmSelect from "@/pages/clients/components/ClientBdmSelect";
import { formatDate } from "@/utils/datetime";
import { formatMoney, statusTag } from "@/utils/format";
import EstimateForm from "./components/EstimateForm";
import EstimateScopeBuilder from "./components/EstimateScopeBuilder";
import { valuesFromEstimate } from "./estimateFields";
import "./estimates.scss";

const open = (url) => window.open(url, "_blank", "noopener");

// One estimate: where it stands, what to do next (resend, share), its fields,
// and its own copy of the scope. Saving makes a new PDF and sends it again.
const EditEstimatePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { clientId, returnPath, backLabel } = useClientFromQuery("estimates", "/pdf-generation");
  const [resending, setResending] = useState(false);

  const { data: estimate, loading, reload } = useApiQuery(() => getEstimate(id).then(dataOf), [id], {
    errorText: "Couldn't load the estimate",
  });

  // What comes next (steps 6 and 7 of the client flow): its contract, and
  // service requests whose lines join it.
  const { data: documents } = useClientDocuments(estimate?.user_id);
  const contract = estimate && documents?.contracts?.find((row) => row.estimate_id === estimate.id);
  const requests = (estimate && documents?.service_requests?.filter((row) => row.estimate_id === estimate.id)) || [];
  const editPath = (kind, docId) => (clientId ? editPathFromClient(kind, docId, clientId) : EDIT_DOCUMENT_PATHS[kind](docId));
  const note = savingNote(estimate?.status);

  const resend = async () => {
    setResending(true);
    try {
      const sentTo = dataOf(await resendEstimate(id))?.sent_to;
      message.success(sentTo ? `DocuSign emailed ${sentTo} again` : "DocuSign emailed the client again");
    } catch (error) {
      message.error(errorMessage(error, "Couldn't resend the estimate"));
    } finally {
      setResending(false);
    }
  };

  const submit = async (changes) => {
    try {
      const res = await updateEstimate(id, changes);
      message.success(res.data?.message || "Estimate saved; a new copy went to the client for signature");
      navigate(returnPath);
    } catch (error) {
      message.error(errorMessage(error, "Couldn't save the estimate"));
    }
  };

  if (loading && !estimate) {
    return (
      <div className="page-loader">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={estimate?.client_company_name || "SERVICE ESTIMATE"}
        subtitle={
          estimate && (
            <Space size={8} wrap>
              <StatusTag code={estimate.status} />
              {estimate.total_price > 0 && <span>{formatMoney(estimate.total_price)}</span>}
              {estimate.sent_at && <span>Sent {formatDate(estimate.sent_at)}</span>}
              {estimate.signed_at && <span>Signed {formatDate(estimate.signed_at)}</span>}
              {estimate.shared_at && <span>In the client app since {formatDate(estimate.shared_at)}</span>}
            </Space>
          )
        }
        actions={
          <Space wrap>
            {estimate?.file_url && (
              <Button icon={<FileText size={16} />} onClick={() => open(estimate.file_url)}>
                PDF
              </Button>
            )}
            {estimate?.signed_file_url && (
              <Button icon={<FileCheck size={16} />} onClick={() => open(estimate.signed_file_url)}>
                Signed Copy
              </Button>
            )}
            {estimate && canResend(estimate.status) && (
              <Button icon={<Send size={16} />} onClick={resend} loading={resending}>
                Resend
              </Button>
            )}
            {estimate && (
              <ShareToggle kind="estimate" id={estimate.id} sharedAt={estimate.shared_at} onChanged={reload} />
            )}
            <Button icon={<ArrowLeft size={16} />} onClick={() => navigate(returnPath)}>
              {backLabel || "Return to Estimates"}
            </Button>
          </Space>
        }
      />
      {estimate && (
        <Tabs
          className="estimate-tabs"
          items={[
            {
              key: "details",
              label: "Details",
              children: (
                <div className="estimate-layout">
                  <div className="estimate-layout__main">
                    <Alert type={note.type} showIcon className="form-card" title={note.title} />
                    <EstimateForm
                      key={estimate.id}
                      userId={estimate.user_id}
                      initialValues={valuesFromEstimate(estimate)}
                      initialSignature={estimate.signature || ""}
                      submitLabel="Save and Send a New Copy"
                      onSubmit={submit}
                    />
                  </div>
                  <aside className="estimate-layout__side">
                    <Card title="Next Steps" size="small" className="form-card">
                      <div className="estimate-next">
                        {contract ? (
                          <Button block icon={<Handshake size={16} />} onClick={() => navigate(editPath("contract", contract.id))}>
                            Open Its Contract ({statusTag(contract.status).label})
                          </Button>
                        ) : (
                          <>
                            <Button
                              block
                              icon={<Handshake size={16} />}
                              onClick={() =>
                                navigate(NEW_DOCUMENT_PATHS.contract(estimate.user_id, { estimateId: estimate.id }))
                              }
                            >
                              Make a Contract
                            </Button>
                            <span className="text-secondary">
                              When the client signs, a draft contract is made from this estimate for you to price and
                              send.
                            </span>
                          </>
                        )}
                        <Button
                          block
                          icon={<FilePlus2 size={16} />}
                          onClick={() =>
                            navigate(NEW_DOCUMENT_PATHS.service_request(estimate.user_id, { estimateId: estimate.id }))
                          }
                        >
                          Add a Service Request
                        </Button>
                        {requests.length > 0 && (
                          <div className="estimate-next__requests">
                            <span className="text-secondary">Service requests in it:</span>
                            {requests.map((request) => (
                              <Button
                                key={request.id}
                                type="link"
                                className="table-link"
                                onClick={() => navigate(editPath("service_request", request.id))}
                              >
                                {request.title}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </Card>
                    <Card title="Representative (BDM)" size="small" className="form-card">
                      <ClientBdmSelect clientId={estimate.user_id} />
                    </Card>
                  </aside>
                </div>
              ),
            },
            {
              key: "scope",
              label: "Scope of Work",
              children: <EstimateScopeBuilder estimateId={estimate.id} userId={estimate.user_id} />,
            },
          ]}
        />
      )}
    </>
  );
};

export default EditEstimatePage;
