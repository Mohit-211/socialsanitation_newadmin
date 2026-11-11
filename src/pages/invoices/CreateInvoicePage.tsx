import { useNavigate } from "react-router";
import { Alert, Button, Spin, message } from "antd";
import { ArrowLeft } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { useApiQuery } from "@/hooks/useApiQuery";
import { useClientPicks } from "@/hooks/useClientPicks";
import { listAddresses } from "@/services/api/addressApi";
import { getClient } from "@/services/api/clientApi";
import { createInvoice, getContractInvoiceDraft } from "@/services/api/invoiceApi";
import { dataOf, errorMessage, itemsOf } from "@/services/apiResult";
import { useClientFromQuery } from "@/pages/clients/useClientFromQuery";
import InvoiceEditor from "./components/InvoiceEditor";
import {
  addressLinesOf,
  blankValues,
  createBody,
  createProblem,
  valuesFromDraft,
  type InvoiceFormValues,
} from "./invoiceFields";
import type { Address } from "@/types";

// Where a new invoice starts: blank; for a client (their primary address); or
// for a contract (its draft: the client, company, service address, the month
// ahead, its monthly price as the line, repeating monthly).
interface StartingPoint {
  values: InvoiceFormValues;
  addresses: Address[];
  addressId?: number;
}

async function startingPoint({
  clientId,
  contractId,
}: {
  clientId?: number;
  contractId?: number;
}): Promise<StartingPoint> {
  if (contractId) {
    const draft = await getContractInvoiceDraft(contractId).then(dataOf);
    const addresses = await listAddresses(draft.user_id)
      .then(itemsOf)
      .catch((): Address[] => []);
    return { values: valuesFromDraft(draft), addresses };
  }
  if (!clientId) return { values: blankValues(), addresses: [] };
  const [client, addresses] = await Promise.all([
    getClient(clientId).then(dataOf),
    listAddresses(clientId).then(itemsOf),
  ]);
  const primary = addresses.find((address) => address.is_primary) || addresses[0];
  return {
    values: { ...blankValues(), user_id: clientId, toCompany: client?.name || "", ...addressLinesOf(primary) },
    addresses,
    addressId: primary?.id,
  };
}

// A new invoice. From the client page (?clientId=) the client is fixed; from a
// contract (?contractId=) the form starts from the contract. Saving returns
// to where the form was opened.
const CreateInvoicePage = () => {
  const navigate = useNavigate();
  const { clientId, params, returnPath, backLabel } = useClientFromQuery("invoices", "/all-invoices");
  const contractId = Number(params.get("contractId")) || undefined;
  const { data: clients } = useClientPicks();
  const {
    data: start,
    loading,
    error,
    reload,
  } = useApiQuery(() => startingPoint({ clientId, contractId }), [clientId, contractId], {
    errorText: contractId ? "Couldn't load the contract" : "Couldn't load the client",
  });

  const submit = async (values: InvoiceFormValues) => {
    const problem = createProblem(values);
    if (problem) {
      message.error(problem);
      return;
    }
    try {
      const res = await createInvoice(createBody(values));
      // When Square or the PDF fails, the invoice is saved and the message says they come when it's sent.
      message.success(res.data?.message || "Invoice saved");
      navigate(returnPath);
    } catch (failure) {
      message.error(errorMessage(failure, "Couldn't save the invoice"));
    }
  };

  return (
    <>
      <PageHeader
        title="NEW INVOICE"
        subtitle={
          contractId
            ? "For a contract: its client, company, service address, dates and monthly price are filled in"
            : "Pick the reference and dates, then add the lines"
        }
        actions={
          <Button size="large" icon={<ArrowLeft size={16} />} onClick={() => navigate(returnPath)}>
            {backLabel || "All Invoices"}
          </Button>
        }
      />
      {start ? (
        <InvoiceEditor
          key={`${clientId || ""}-${contractId || ""}`}
          mode="create"
          initialValues={start.values}
          clients={clients}
          clientLocked={Boolean(clientId || contractId)}
          initialAddresses={start.addresses}
          initialAddressId={start.addressId}
          submitLabel="Save Invoice"
          submitHint="It goes to the client at 9 AM on its billing date, or within about 30 minutes if that date has passed."
          onSubmit={submit}
        />
      ) : loading ? (
        <div className="page-loader">
          <Spin size="large" />
        </div>
      ) : (
        error && (
          <Alert
            type="error"
            showIcon
            title={errorMessage(error, "Couldn't start the invoice")}
            action={
              <Button size="small" onClick={reload}>
                Try Again
              </Button>
            }
          />
        )
      )}
    </>
  );
};

export default CreateInvoicePage;
