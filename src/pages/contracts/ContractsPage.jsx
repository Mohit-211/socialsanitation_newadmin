import { Button, Input, Modal, Space, Table, message } from "antd";
import { useNavigate } from "react-router";
import { FileCheck, FileText, Pencil, Plus, ReceiptText, Search, Trash2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import IconAction from "@/components/IconAction";
import ShareToggle from "@/components/ShareToggle";
import StatusTag from "@/components/StatusTag";
import { deleteContract, listContracts } from "@/services/api/contractApi";
import { errorMessage } from "@/services/apiResult";
import { usePagedList } from "@/hooks/usePagedList";
import { PERMISSION, useCan } from "@/lib/session";
import { NEW_DOCUMENT_PATHS } from "@/pages/clients/clientFlow";
import { formatDate } from "@/utils/datetime";
import { formatMoney } from "@/utils/format";

const open = (url) => window.open(url, "_blank", "noopener");

// Every contract agreement, newest first, searchable by company.
const ContractsPage = () => {
  const navigate = useNavigate();
  const canDelete = useCan(PERMISSION.DELETE_RECORDS);
  const list = usePagedList((query) => listContracts(query), { errorText: "Couldn't load the contracts" });

  const confirmDelete = (contract) =>
    Modal.confirm({
      title: `Delete the contract for ${contract.client_company_name}?`,
      content: "Its payment link closes. This can't be undone.",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await deleteContract(contract.id);
          message.success("Contract deleted");
          list.reload();
        } catch (error) {
          message.error(errorMessage(error, "Couldn't delete the contract"));
        }
      },
    });

  const columns = [
    {
      title: "Company",
      dataIndex: "client_company_name",
      render: (company, contract) => (
        <Button type="link" className="table-link" onClick={() => navigate(`/edit-contract-agreement/${contract.id}`)}>
          {company || `Contract ${contract.id}`}
        </Button>
      ),
    },
    {
      title: "Client",
      key: "client",
      render: (_, contract) => (
        <Button type="link" className="table-link" onClick={() => navigate(`/viewUser/${contract.user_id}?tab=contracts`)}>
          {contract.client_name || contract.client_email || "Client"}
        </Button>
      ),
    },
    { title: "Monthly Price", dataIndex: "total_monthly_price", align: "right", render: formatMoney },
    { title: "Contract Date", dataIndex: "contract_date", render: (date) => formatDate(date) },
    { title: "Status", dataIndex: "status", render: (status) => <StatusTag code={status} /> },
    { title: "Sent", dataIndex: "sent_at", render: (date) => formatDate(date) },
    { title: "Signed", dataIndex: "signed_at", render: (date) => formatDate(date) },
    {
      title: "Actions",
      key: "actions",
      width: 230,
      render: (_, contract) => (
        <Space size={4}>
          <IconAction icon={Pencil} title="Open" onClick={() => navigate(`/edit-contract-agreement/${contract.id}`)} />
          {contract.file_url && <IconAction icon={FileText} title="PDF" onClick={() => open(contract.file_url)} />}
          {contract.signed_file_url && (
            <IconAction icon={FileCheck} title="Signed copy" onClick={() => open(contract.signed_file_url)} />
          )}
          <ShareToggle kind="contract" id={contract.id} sharedAt={contract.shared_at} onChanged={list.reload} />
          <IconAction
            icon={ReceiptText}
            title="Make an invoice for this contract"
            onClick={() => navigate(NEW_DOCUMENT_PATHS.invoice(contract.user_id, { contractId: contract.id }))}
          />
          {canDelete && <IconAction icon={Trash2} title="Delete" danger onClick={() => confirmDelete(contract)} />}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="CONTRACTS"
        subtitle="Contract agreements sent to clients for signature"
        actions={
          <>
            <Input
              allowClear
              size="large"
              prefix={<Search size={16} className="text-subtle" />}
              placeholder="Search by company"
              style={{ width: 240 }}
              value={list.searchText}
              onChange={(event) => list.setSearchText(event.target.value)}
            />
            <Button
              type="primary"
              size="large"
              icon={<Plus size={16} />}
              onClick={() => navigate("/create-contract-agreement")}
            >
              New Contract
            </Button>
          </>
        }
      />
      <Table rowKey="id" columns={columns} scroll={{ x: "max-content" }} size="middle" {...list.tableProps} />
    </div>
  );
};

export default ContractsPage;
