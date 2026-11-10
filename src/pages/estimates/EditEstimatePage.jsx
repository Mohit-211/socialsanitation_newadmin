import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Alert, Button, Card, Space, Spin, Tabs, message } from "antd";
import { ArrowLeft, FileCheck, FileText, Send } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ShareToggle from "@/components/ShareToggle";
import StatusTag from "@/components/StatusTag";
import { getEstimate, resendEstimate, updateEstimate } from "@/services/api/estimateApi";
import { dataOf, errorMessage } from "@/services/apiResult";
import { useApiQuery } from "@/hooks/useApiQuery";
import { useClientFromQuery } from "@/pages/clients/useClientFromQuery";
import ClientBdmSelect from "@/pages/clients/components/ClientBdmSelect";
import { formatDate, fromApiDate } from "@/utils/datetime";
import EstimateForm from "./components/EstimateForm";
import EstimateScopeBuilder from "./components/EstimateScopeBuilder";
import "./estimates.scss";

const open = (url) => window.open(url, "_blank", "noopener");

// One estimate: where it stands, what to do next (resend, share), its fields,
// and its own copy of the scope. Saving makes a new PDF and sends it again.
const EditEstimatePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { returnPath, backLabel } = useClientFromQuery("estimates", "/pdf-generation");
  const [resending, setResending] = useState(false);

  const { data: estimate, loading, reload } = useApiQuery(() => getEstimate(id).then(dataOf), [id], {
    errorText: "Couldn't load the estimate",
  });

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
      await updateEstimate(id, changes);
      message.success("Estimate saved; a new copy went to the client for signature");
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
            {estimate && !estimate.signed_at && (
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
                    <Alert
                      type="info"
                      showIcon
                      className="form-card"
                      title="Saving makes a new PDF and sends the client a new copy to sign."
                    />
                    <EstimateForm
                      key={estimate.id}
                      userId={estimate.user_id}
                      initialValues={{
                        client_company_name: estimate.client_company_name,
                        address_line_1: estimate.address_line_1,
                        address_line_2: estimate.address_line_2,
                        city: estimate.city,
                        state: estimate.state,
                        zip: estimate.zip,
                        contact_name: estimate.contact_name,
                        contact_phone: estimate.contact_phone,
                        contact_fax: estimate.contact_fax,
                        contact_email: estimate.contact_email,
                        frequency: estimate.frequency,
                        signed_date: fromApiDate(estimate.signed_date),
                      }}
                      initialSignature={estimate.signature || ""}
                      submitLabel="Save and Send a New Copy"
                      onSubmit={submit}
                    />
                  </div>
                  <aside className="estimate-layout__side">
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
