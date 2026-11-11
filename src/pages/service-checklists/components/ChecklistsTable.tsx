import { useNavigate } from "react-router";
import { Modal, Space, Table, message, type TableColumnsType } from "antd";
import { Pencil, Trash2 } from "lucide-react";
import IconAction from "@/components/IconAction";
import { useApiQuery } from "@/hooks/useApiQuery";
import { PERMISSION, useCan } from "@/lib/session";
import { errorMessage, itemsOf } from "@/services/apiResult";
import { CHECKLIST_KINDS, jobLabel, type AnyChecklist, type ChecklistKind } from "../checklistKinds";
import type { ApiCall } from "@/services/apiResult";
import type { ChecklistTask, Id, Items } from "@/types";

/**
 * Every checklist of a kind; a row opens to show its tasks. `load` and
 * `remove` are the kind's API calls, `editPath(id)` its edit page.
 */
interface ChecklistsTableProps<T extends AnyChecklist> {
  kind: ChecklistKind;
  load: () => ApiCall<Items<T>>;
  remove: (id: Id) => ApiCall<null>;
  editPath: (id: number) => string;
}

const ChecklistsTable = <T extends AnyChecklist>({ kind, load, remove, editPath }: ChecklistsTableProps<T>) => {
  const navigate = useNavigate();
  const canDelete = useCan(PERMISSION.DELETE_RECORDS);
  const { data: checklists, loading, reload } = useApiQuery(() => load().then(itemsOf), [], {
    initial: [],
    errorText: "Couldn't load the checklists",
  });
  const field = CHECKLIST_KINDS[kind].field;

  const confirmDelete = (checklist: T) =>
    Modal.confirm({
      title: `Delete "${checklist.title}"?`,
      content: "Its tasks go too. This can't be undone.",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await remove(checklist.id);
          message.success("Checklist deleted");
          reload();
        } catch (error) {
          message.error(errorMessage(error, "Couldn't delete the checklist"));
        }
      },
    });

  const columns: TableColumnsType<T> = [
    { title: "Heading", dataIndex: "title", sorter: (a, b) => (a.title || "").localeCompare(b.title || "") },
    { title: CHECKLIST_KINDS[kind].label, dataIndex: field, render: (code: string | null | undefined) => jobLabel(kind, code) },
    { title: "Tasks", dataIndex: "tasks", render: (tasks: ChecklistTask[] | undefined) => (tasks || []).length },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_value, checklist) => (
        <Space size={4}>
          <IconAction icon={Pencil} title="Edit" onClick={() => navigate(editPath(checklist.id))} />
          {canDelete && <IconAction icon={Trash2} title="Delete" danger onClick={() => confirmDelete(checklist)} />}
        </Space>
      ),
    },
  ];

  return (
    <Table
      rowKey="id"
      size="middle"
      loading={loading}
      columns={columns}
      dataSource={checklists || []}
      pagination={false}
      expandable={{
        expandedRowRender: (checklist) => (
          <ol className="checklist-tasks">
            {(checklist.tasks || []).map((task) => (
              <li key={task.id}>{task.task}</li>
            ))}
          </ol>
        ),
      }}
    />
  );
};

export default ChecklistsTable;
