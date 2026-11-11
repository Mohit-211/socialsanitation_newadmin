import { useState } from "react";
import { Button, Empty, Modal, Space, Table, message } from "antd";
import { useNavigate } from "react-router";
import { Calculator, Download, FileSignature, Pencil, Plus, Trash2 } from "lucide-react";
import IconAction from "@/components/IconAction";
import { deleteScopeOfWork, getScopeOfWorkPdf } from "@/services/api/scopeApi";
import { dataOf, errorMessage } from "@/services/apiResult";
import { PERMISSION, useCan, useIsSuperAdmin } from "@/lib/session";
import { NEW_DOCUMENT_PATHS } from "../clientFlow";
import ShareToggle from "@/components/ShareToggle";
import { dateColumn, sharedColumn, titleColumn } from "./flowColumns";
import type { TableColumnsType } from "antd";
import type { ScopeRow } from "@/types";
import type { ClientTabProps } from "./ClientProfileTab";

// Step 2: scopes of work. Each is made from a sheet (or the whole master
// list), then edited for this client; estimates and inspections use them.
const ClientScopesTab = ({ clientId, flow, onNewScope, onChanged }: ClientTabProps & { onNewScope: () => void }) => {
  const navigate = useNavigate();
  const canDelete = useCan(PERMISSION.DELETE_RECORDS);
  const isSuperAdmin = useIsSuperAdmin();
  const [pdfFor, setPdfFor] = useState<number | null>(null);
  const rows = flow?.scopes_of_work ?? [];
  const openScope = (row: ScopeRow) => navigate(`/scopes/${row.id}`);

  const openPdf = async (row: ScopeRow) => {
    setPdfFor(row.id);
    try {
      const { file_url: fileUrl } = dataOf(await getScopeOfWorkPdf(row.id)) || {};
      if (!fileUrl) throw new Error("No file link in the answer");
      window.open(fileUrl, "_blank", "noopener");
    } catch (error) {
      message.error(errorMessage(error, "Couldn't make the PDF"));
    } finally {
      setPdfFor(null);
    }
  };

  const confirmDelete = (row: ScopeRow) =>
    Modal.confirm({
      title: `Delete "${row.title}"?`,
      content: "Its sections and tasks go too.",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await deleteScopeOfWork(row.id);
          message.success("Scope of work deleted");
          onChanged?.();
        } catch (error) {
          message.error(errorMessage(error, "Couldn't delete the scope of work"));
        }
      },
    });

  const columns: TableColumnsType<ScopeRow> = [
    titleColumn(openScope),
    { title: "Made From", dataIndex: "client_sheet", render: (sheet) => sheet?.title || "The master list" },
    { title: "Visits", dataIndex: "visit_frequency", render: (frequency) => frequency || "—" },
    sharedColumn(),
    dateColumn("Updated", "updated_at"),
    {
      title: "Actions",
      key: "actions",
      width: 240,
      render: (_, row) => (
        <Space size={4}>
          <IconAction icon={Pencil} title="Edit sections and tasks" onClick={() => openScope(row)} />
          <IconAction icon={Download} title="PDF" onClick={() => openPdf(row)} loading={pdfFor === row.id} />
          {isSuperAdmin && (
            <IconAction
              icon={Calculator}
              title="Price this scope in the calculator"
              onClick={() => navigate(NEW_DOCUMENT_PATHS.calculation(clientId, { scopeId: row.id }))}
            />
          )}
          {isSuperAdmin && (
            <IconAction
              icon={FileSignature}
              title="Make an estimate for this scope"
              onClick={() => navigate(NEW_DOCUMENT_PATHS.estimate(clientId, { scopeId: row.id }))}
            />
          )}
          <ShareToggle kind="scope_of_work" id={row.id} sharedAt={row.shared_at} onChanged={() => onChanged?.()} />
          {canDelete && <IconAction icon={Trash2} title="Delete" danger onClick={() => confirmDelete(row)} />}
        </Space>
      ),
    },
  ];

  return (
    <div className="client-flow__tab">
      <div className="client-flow__tab-head">
        <p className="text-secondary">
          A scope of work lists the tasks for this client. It starts from a sheet and is edited here.
        </p>
        <Button type="primary" icon={<Plus size={16} />} onClick={() => onNewScope()}>
          New Scope of Work
        </Button>
      </div>
      <Table
        rowKey="id"
        dataSource={rows}
        columns={columns}
        size="middle"
        pagination={false}
        scroll={{ x: "max-content" }}
        locale={{ emptyText: <Empty description='No scopes yet. Use "New Scope of Work" to make one from a sheet.' /> }}
      />
    </div>
  );
};

export default ClientScopesTab;
