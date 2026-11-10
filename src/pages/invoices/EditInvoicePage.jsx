import { useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { Button, Space, Spin, message } from "antd";
import { ArrowLeft, ExternalLink, FileText } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import StatusTag from "@/components/StatusTag";
import { useApiQuery } from "@/hooks/useApiQuery";
import { getInvoice, reorderInvoiceItems, updateInvoice } from "@/services/api/invoiceApi";
import { dataOf, errorMessage } from "@/services/apiResult";
import { useClientFromQuery } from "@/pages/clients/useClientFromQuery";
import { formatMoney } from "@/utils/format";
import InvoiceEditor from "./components/InvoiceEditor";
import { editProblem, invoiceChanges, valuesFromInvoice } from "./invoiceFields";

const open = (url) => window.open(url, "_blank", "noopener");

// One invoice: where it stands, its PDF and payment link, and its fields.
// Saving sends only what changed; a change the client can see sends it to
// them again while it still waits for its first payment.
const EditInvoicePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { returnPath, backLabel } = useClientFromQuery("invoices", "/all-invoices");

  const { data: invoice, loading } = useApiQuery(() => getInvoice(id).then(dataOf), [id], {
    errorText: "Couldn't load the invoice",
  });
  const original = useMemo(() => (invoice ? valuesFromInvoice(invoice) : null), [invoice]);

  const submit = async (values) => {
    const problem = editProblem(values);
    if (problem) {
      message.error(problem);
      return;
    }
    const changes = invoiceChanges(values, original);
    if (!Object.keys(changes).length) {
      navigate(returnPath);
      return;
    }
    try {
      await updateInvoice(id, changes);
      message.success("Invoice saved");
      navigate(returnPath);
    } catch (error) {
      message.error(errorMessage(error, "Couldn't save the invoice"));
    }
  };

  if (loading && !invoice) {
    return (
      <div className="page-loader">
        <Spin size="large" />
      </div>
    );
  }

  const paid = invoice?.state === "paid";

  return (
    <>
      <PageHeader
        title={`INVOICE ${invoice?.custom_ref_no || invoice?.ref_no || ""}`.trim()}
        subtitle={
          invoice && (
            <Space size={8} wrap>
              <StatusTag code={invoice.state} />
              <span>{invoice.client_name || invoice.to_company_name}</span>
              <span>
                {formatMoney(invoice.total_due)}
                {!paid && invoice.amount_due_now !== invoice.total_due && ` · ${formatMoney(invoice.amount_due_now)} due now`}
              </span>
            </Space>
          )
        }
        actions={
          <Space wrap>
            {invoice?.pdf_url && (
              <Button icon={<FileText size={16} />} onClick={() => open(invoice.pdf_url)}>
                PDF
              </Button>
            )}
            {invoice?.payment_url && !paid && (
              <Button icon={<ExternalLink size={16} />} onClick={() => open(invoice.payment_url)}>
                Payment Link
              </Button>
            )}
            <Button icon={<ArrowLeft size={16} />} onClick={() => navigate(returnPath)}>
              {backLabel || "All Invoices"}
            </Button>
          </Space>
        }
      />
      {invoice && (
        <InvoiceEditor
          key={`${invoice.id}-${invoice.last_sent_at || ""}`}
          mode="edit"
          initialValues={original}
          clientName={invoice.client_name}
          paymentStage={invoice.payment_stage}
          submitLabel="Save Invoice"
          submitHint="A change the client can see sends them the invoice again, while it waits for its first payment."
          onSubmit={submit}
          onReorder={(items) => reorderInvoiceItems(id, items)}
        />
      )}
    </>
  );
};

export default EditInvoicePage;
