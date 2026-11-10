import { Button, Empty, Modal, Space, Table, message } from "antd";
import { useNavigate } from "react-router";
import { FileSignature, Pencil, Plus, ReceiptText, ScrollText, Trash2 } from "lucide-react";
import IconAction from "@/components/IconAction";
import { deleteDocument, DOCUMENT_KINDS } from "@/services/api/documentApi";
import { createInvoice } from "@/services/api/invoiceApi";
import { dataOf, errorMessage } from "@/services/apiResult";
import { PERMISSION, useCan } from "@/lib/session";
import { EDIT_DOCUMENT_PATHS, NEW_DOCUMENT_PATHS, editPathFromClient } from "../clientFlow";
import ShareToggle from "@/components/ShareToggle";
import { dateColumn, moneyColumn, sharedColumn, statusColumn, titleColumn } from "./flowColumns";

// One kind of sales document on the client page: its list, with Edit, Share,
// Delete and what comes next (an invoice from a quote or a contract).
const KINDS = {
  estimates: {
    kind: "estimate",
    flowKey: "estimates",
    newLabel: "New Estimate",
    hint: "An estimate goes to the client for signature by DocuSign.",
    columns: [statusColumn(), moneyColumn("Price", "total_price"), dateColumn("Signed", "signed_date")],
    quoteFromRow: true,
  },
  quotes: {
    kind: "quote",
    flowKey: "quotes",
    newLabel: "New Quote",
    hint: "A quote goes to the client by email and text. They pay through the invoice made from it.",
    columns: [statusColumn(), statusColumn("payment_status", "Payment"), moneyColumn("Total", "total_due")],
    invoiceFromRow: true,
  },
  "service-requests": {
    kind: "service_request",
    flowKey: "service_requests",
    newLabel: "New Service Request",
    hint: "A service request adds work and goes to the client for signature.",
    columns: [statusColumn(), moneyColumn("Total", "total_due")],
  },
  contracts: {
    kind: "contract",
    flowKey: "contracts",
    newLabel: "New Contract",
    hint: "A contract goes to the client for signature; monthly invoices can then be made from it.",
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

const ClientDocumentsTab = ({ tab, clientId, flow, onChanged }) => {
  const navigate = useNavigate();
  const canDelete = useCan(PERMISSION.DELETE_RECORDS);
  const config = KINDS[tab];
  const rows = flow?.[config.flowKey] ?? [];
  const kind = config.kind;
  const editPath = kind && EDIT_DOCUMENT_PATHS[kind];
  const newPath = NEW_DOCUMENT_PATHS[config.newPath || kind];

  const open = editPath ? (row) => navigate(editPathFromClient(kind, row.id, clientId)) : undefined;

  const invoiceFromQuote = async (row) => {
    try {
      const invoice = dataOf(await createInvoice({ quote_id: row.id }));
      message.success("Invoice made from the quote");
      navigate(EDIT_DOCUMENT_PATHS.invoice(invoice.id));
    } catch (error) {
      message.error(errorMessage(error, "Couldn't make the invoice"));
    }
  };

  const confirmDelete = (row) =>
    Modal.confirm({
      title: `Delete "${row.title}"?`,
      content: "This can't be undone.",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await deleteDocument(kind, row.id);
          message.success(`${DOCUMENT_KINDS[kind].name} deleted`);
          onChanged?.();
        } catch (error) {
          message.error(errorMessage(error, "Couldn't delete it"));
        }
      },
    });

  // A calculation names the scope of work it priced.
  const scopeColumn = {
    title: "Scope of Work",
    dataIndex: "scope_of_work_id",
    render: (scopeId) => flow?.scopes_of_work?.find((scope) => scope.id === scopeId)?.title || "—",
  };

  const columns = [
    titleColumn(open),
    ...(tab === "calculations" ? [scopeColumn] : []),
    ...config.columns,
    ...(kind ? [sharedColumn()] : []),
    dateColumn("Created", "created_at"),
    {
      title: "Actions",
      key: "actions",
      width: 170,
      render: (_, row) => (
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
          {config.invoiceFromRow && (
            <IconAction icon={ReceiptText} title="Make an invoice from this quote" onClick={() => invoiceFromQuote(row)} />
          )}
          {config.invoiceFromContract && (
            <IconAction
              icon={ReceiptText}
              title="Make an invoice for this contract"
              onClick={() => navigate(NEW_DOCUMENT_PATHS.invoice(clientId, { contractId: row.id }))}
            />
          )}
          {kind && canDelete && (
            <IconAction icon={Trash2} title="Delete" danger onClick={() => confirmDelete(row)} />
          )}
        </Space>
      ),
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
