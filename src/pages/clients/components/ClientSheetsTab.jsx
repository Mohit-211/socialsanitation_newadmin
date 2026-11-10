import { Button, Empty, Modal, Space, Table, message } from "antd";
import { FileStack, Pencil, Plus, Trash2 } from "lucide-react";
import IconAction from "@/components/IconAction";
import { deleteSheet } from "@/services/api/sheetApi";
import { errorMessage } from "@/services/apiResult";
import { PERMISSION, useCan } from "@/lib/session";
import ShareToggle from "./ShareToggle";
import { dateColumn, sharedColumn, titleColumn } from "./flowColumns";

// Step 1: the client's Initial Client Sheets. Each is a walk-through of the
// site (areas, counts, floors) that a scope of work is made from.
const ClientSheetsTab = ({ flow, onNewSheet, onEditSheet, onNewScope, onChanged }) => {
  const canDelete = useCan(PERMISSION.DELETE_RECORDS);
  const rows = flow?.client_sheets ?? [];

  const confirmDelete = (row) =>
    Modal.confirm({
      title: `Delete "${row.title}"?`,
      content: "Scopes of work already made from it stay as they are.",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await deleteSheet(row.id);
          message.success("Sheet deleted");
          onChanged?.();
        } catch (error) {
          message.error(errorMessage(error, "Couldn't delete the sheet"));
        }
      },
    });

  const columns = [
    titleColumn((row) => onEditSheet(row.id)),
    { title: "Service Address", dataIndex: "address", render: (address) => address || "—" },
    sharedColumn(),
    dateColumn("Updated", "updated_at"),
    {
      title: "Actions",
      key: "actions",
      width: 190,
      render: (_, row) => (
        <Space size={4}>
          <IconAction icon={Pencil} title="Edit" onClick={() => onEditSheet(row.id)} />
          <IconAction icon={FileStack} title="Make a scope of work from this sheet" onClick={() => onNewScope(row.id)} />
          <ShareToggle kind="client_sheet" id={row.id} sharedAt={row.shared_at} onChanged={() => onChanged?.()} />
          {canDelete && <IconAction icon={Trash2} title="Delete" danger onClick={() => confirmDelete(row)} />}
        </Space>
      ),
    },
  ];

  return (
    <div className="client-flow__tab">
      <div className="client-flow__tab-head">
        <p className="text-secondary">
          A sheet records the site: its areas, counts and floors. Make a scope of work from one.
        </p>
        <Button type="primary" icon={<Plus size={16} />} onClick={onNewSheet}>
          New Sheet
        </Button>
      </div>
      <Table
        rowKey="id"
        dataSource={rows}
        columns={columns}
        size="middle"
        pagination={false}
        scroll={{ x: "max-content" }}
        locale={{ emptyText: <Empty description='No sheets yet. Use "New Sheet" to record the site.' /> }}
      />
    </div>
  );
};

export default ClientSheetsTab;
