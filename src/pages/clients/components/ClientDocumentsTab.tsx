import { Button, Empty, Modal, Space, Table, message, type TableColumnType } from "antd";
import { useNavigate } from "react-router";
import { FilePlus2, FileSignature, Handshake, Pencil, Plus, ReceiptText, ScrollText, Trash2 } from "lucide-react";
import IconAction from "@/components/IconAction";
import { deleteDocument, DOCUMENT_KINDS, type DocumentKind } from "@/services/api/documentApi";
import { createInvoice } from "@/services/api/invoiceApi";
import { dataOf, errorMessage } from "@/services/apiResult";
import { PERMISSION, useCan } from "@/lib/session";
import { isDraft } from "@/utils/signing";
import { EDIT_DOCUMENT_PATHS, NEW_DOCUMENT_PATHS, editPathFromClient, type NewDocumentKind } from "../clientFlow";
import type { ClientFlow, Id } from "@/types";
import ShareToggle from "@/components/ShareToggle";
import { dateColumn, moneyColumn, sharedColumn, statusColumn, titleColumn } from "./flowColumns";

/** A row of any of these lists: each kind's row has some of these fields. */
interface DocRow {
  id: number;
  title: string;
  status?: string | null;
  shared_at?: string | null;
  created_at: string;
  scope_of_work_id?: number | null;
  cost_calculation_id?: number | null;
  estimate_id?: number | null;
  quote_id?: number | null;
}

type SalesKind = Extract<DocumentKind, "estimate" | "quote" | "service_request" | "contract">;

interface KindConfig {
  kind: SalesKind | null;
  flowKey: "estimates" | "quotes" | "service_requests" | "contracts" | "cost_calculations";
  newLabel: string;
  hint: string;
  columns: TableColumnType<DocRow>[];
  newPath?: NewDocumentKind;
  quoteFromRow?: boolean;
  invoiceFromRow?: boolean;
  invoiceFromContract?: boolean;
  documentsFromRow?: boolean;
  requestFromRow?: boolean;
  contractFromRow?: boolean;
}

export type DocumentsTab = "estimates" | "quotes" | "service-requests" | "contracts" | "calculations";

// One kind of sales document on the client page: its list, with Edit, Share,
// Delete and what comes next (an invoice from a quote or a contract).
const KINDS: Record<DocumentsTab, KindConfig> = {
  estimates: {
    kind: "estimate",
    flowKey: "estimates",
    newLabel: "New Estimate",
    hint: "An estimate goes to the client for signature by DocuSign.",
    columns: [statusColumn(), moneyColumn("Price", "total_price"), dateColumn("Signed", "signed_date")],
    quoteFromRow: true,
    requestFromRow: true,
    contractFromRow: true,
  },
  quotes: {
    kind: "quote",
    flowKey: "quotes",
    newLabel: "New Quote",
    hint: "A quote goes to the client by email and text. They pay through the invoice made from it.",
    columns: [statusColumn(), statusColumn("payment_status", "Payment"), moneyColumn("Total", "total_due")],
    invoiceFromRow: true,
    requestFromRow: true,
  },
  "service-requests": {
    kind: "service_request",
    flowKey: "service_requests",
    newLabel: "New Service Request",
    hint: "A service request adds work. Made for one of the client's estimates or quotes, its lines join that document, which goes to the client again; otherwise it goes for signature on its own.",
    columns: [statusColumn(), moneyColumn("Total", "total_due")],
  },
  contracts: {
    kind: "contract",
    flowKey: "contracts",
    newLabel: "New Contract",
    hint: "A contract goes to the client for signature; monthly invoices can then be made from it. When the client signs an estimate, its draft contract appears here: open it, set the monthly price and date, and save to send it.",
    columns: [statusColumn(), moneyColumn("Monthly Price", "total_monthly_price")],
    invoiceFromContract: true,
  },
  calculations: {
    kind: null,
    flowKey: "cost_calculations",
    newLabel: "New Calculation",
    hint: "Calculations price a scope of work and stay in the office: they hold costs, margins and commission.",
    columns: [moneyColumn("Operational Cost", "total_operational_cost")],
    newPath: "calculation",
    documentsFromRow: true,
  },
};

export interface ClientDocumentsTabProps {
  tab: DocumentsTab;
  clientId: Id;
  flow: ClientFlow | null;
  onChanged?: () => void;
}

const ClientDocumentsTab = ({ tab, clientId, flow, onChanged }: ClientDocumentsTabProps) => {
  const navigate = useNavigate();
  const canDelete = useCan(PERMISSION.DELETE_RECORDS);
  const config = KINDS[tab];
  const rows: DocRow[] = flow?.[config.flowKey] ?? [];
  const kind = config.kind;
  const newKind = config.newPath ?? kind;
  const newPath = newKind ? NEW_DOCUMENT_PATHS[newKind] : null;

  const open = kind ? (row: DocRow) => navigate(editPathFromClient(kind, row.id, clientId)) : undefined;

  const invoiceFromQuote = async (row: DocRow) => {
    try {
      const invoice = dataOf(await createInvoice({ quote_id: row.id }));
      message.success("Invoice made from the quote");
      navigate(EDIT_DOCUMENT_PATHS.invoice(invoice.id));
    } catch (error) {
      message.error(errorMessage(error, "Couldn't make the invoice"));
    }
  };

  const confirmDelete = (row: DocRow, documentKind: SalesKind) =>
    Modal.confirm({
      title: `Delete "${row.title}"?`,
      content: "This can't be undone.",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await deleteDocument(documentKind, row.id);
          message.success(`${DOCUMENT_KINDS[documentKind].name} deleted`);
          onChanged?.();
        } catch (error) {
          message.error(errorMessage(error, "Couldn't delete it"));
        }
      },
    });

  // What a document was made from (step 5 of the client flow): its scope, the
  // calculation that priced it, and for a quote the estimate it goes with. A
  // service request adds to an estimate or quote (step 6); a contract comes
  // from an estimate (step 7).
  const titleIn = (list: "scopes_of_work" | "cost_calculations" | "estimates" | "quotes", id: number | null | undefined) => {
    const named: { id: number; title: string }[] = flow?.[list] ?? [];
    return id ? named.find((row) => row.id === id)?.title : null;
  };
  const sourcesColumn: TableColumnType<DocRow> = {
    title: tab === "calculations" ? "Scope of Work" : tab === "service-requests" ? "Adds To" : "Made From",
    key: "sources",
    render: (_, row: DocRow) => {
      const scope = titleIn("scopes_of_work", row.scope_of_work_id);
      const calculation = tab === "calculations" ? null : titleIn("cost_calculations", row.cost_calculation_id);
      const estimateId = row.estimate_id;
      const quoteId = tab === "service-requests" ? row.quote_id : null;
      const estimate = titleIn("estimates", estimateId);
      const quote = titleIn("quotes", quoteId);
      if (!scope && !calculation && !estimate && !quote) return <span className="text-subtle">—</span>;
      return (
        <div className="client-flow__sources">
          {estimate && estimateId && (
            <Button
              type="link"
              className="table-link"
              onClick={() => navigate(editPathFromClient("estimate", estimateId, clientId))}
            >
              Estimate: {estimate}
            </Button>
          )}
          {quote && quoteId && (
            <Button
              type="link"
              className="table-link"
              onClick={() => navigate(editPathFromClient("quote", quoteId, clientId))}
            >
              Quote: {quote}
            </Button>
          )}
          {scope && (
            <Button type="link" className="table-link" onClick={() => navigate(`/scopes/${row.scope_of_work_id}`)}>
              {tab === "calculations" ? scope : `Scope: ${scope}`}
            </Button>
          )}
          {calculation && <span className="text-secondary">Priced: {calculation}</span>}
        </div>
      );
    },
  };

  // The contract an estimate has (one estimate makes one contract).
  const contractOf = (row: DocRow) => flow?.contracts?.find((contract) => contract.estimate_id === row.id);

  const columns: TableColumnType<DocRow>[] = [
    titleColumn<DocRow>(open),
    ...(["calculations", "estimates", "quotes", "service-requests", "contracts"].includes(tab) ? [sourcesColumn] : []),
    ...config.columns,
    ...(kind ? [sharedColumn<DocRow>()] : []),
    dateColumn<DocRow>("Created", "created_at"),
    {
      title: "Actions",
      key: "actions",
      width: 210,
      render: (_, row: DocRow) => {
        const contract = config.contractFromRow ? contractOf(row) : undefined;
        return (
          <Space size={4}>
            {open && <IconAction icon={Pencil} title="Open" onClick={() => open(row)} />}
            {kind && (
              <ShareToggle kind={kind} id={row.id} sharedAt={row.shared_at} onChanged={() => onChanged?.()} />
            )}
            {config.documentsFromRow && (
              <IconAction
                icon={FileSignature}
                title="Make an estimate priced from this calculation"
                onClick={() =>
                  navigate(
                    NEW_DOCUMENT_PATHS.estimate(clientId, { calculationId: row.id, scopeId: row.scope_of_work_id }),
                  )
                }
              />
            )}
            {config.documentsFromRow && (
              <IconAction
                icon={ScrollText}
                title="Make a quote priced from this calculation"
                onClick={() =>
                  navigate(NEW_DOCUMENT_PATHS.quote(clientId, { calculationId: row.id, scopeId: row.scope_of_work_id }))
                }
              />
            )}
            {config.quoteFromRow && (
              <IconAction
                icon={ScrollText}
                title="Make a quote from this estimate"
                onClick={() => navigate(NEW_DOCUMENT_PATHS.quote(clientId, { estimateId: row.id }))}
              />
            )}
            {config.requestFromRow && (
              <IconAction
                icon={FilePlus2}
                title={`Add a service request to this ${kind === "estimate" ? "estimate" : "quote"}`}
                onClick={() =>
                  navigate(
                    NEW_DOCUMENT_PATHS.service_request(
                      clientId,
                      kind === "estimate" ? { estimateId: row.id } : { quoteId: row.id },
                    ),
                  )
                }
              />
            )}
            {config.contractFromRow && contract && (
              <IconAction
                icon={Handshake}
                title="Open the contract made from this estimate"
                onClick={() => navigate(editPathFromClient("contract", contract.id, clientId))}
              />
            )}
            {config.contractFromRow && !contract && (
              <IconAction
                icon={Handshake}
                title="Make a contract from this estimate"
                onClick={() => navigate(NEW_DOCUMENT_PATHS.contract(clientId, { estimateId: row.id }))}
              />
            )}
            {config.invoiceFromRow && (
              <IconAction icon={ReceiptText} title="Make an invoice from this quote" onClick={() => invoiceFromQuote(row)} />
            )}
            {config.invoiceFromContract && !isDraft(row.status) && (
              <IconAction
                icon={ReceiptText}
                title="Make an invoice for this contract"
                onClick={() => navigate(NEW_DOCUMENT_PATHS.invoice(clientId, { contractId: row.id }))}
              />
            )}
            {kind && canDelete && (
              <IconAction icon={Trash2} title="Delete" danger onClick={() => confirmDelete(row, kind)} />
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div className="client-flow__tab">
      <div className="client-flow__tab-head">
        <p className="text-secondary">{config.hint}</p>
        {newPath && (
          <Button type="primary" icon={<Plus size={16} />} onClick={() => navigate(newPath(clientId))}>
            {config.newLabel}
          </Button>
        )}
      </div>
      <Table
        rowKey="id"
        dataSource={rows}
        columns={columns}
        size="middle"
        pagination={rows.length > 10 ? { pageSize: 10 } : false}
        scroll={{ x: "max-content" }}
        locale={{ emptyText: <Empty description={`Nothing yet. Use "${config.newLabel}" to start one for this client.`} /> }}
      />
    </div>
  );
};

export default ClientDocumentsTab;
