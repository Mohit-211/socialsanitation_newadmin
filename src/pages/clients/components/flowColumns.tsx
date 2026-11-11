import { Button, Tag, Tooltip, type TableColumnType } from "antd";
import { formatDate } from "@/utils/datetime";
import { formatMoney } from "@/utils/format";
import StatusTag from "@/components/StatusTag";

// Table columns the client page's lists share.

export const titleColumn = <T extends { title?: string | null }>(
  onOpen?: (row: T) => void,
  title = "Title",
): TableColumnType<T> => ({
  title,
  dataIndex: "title",
  render: (text: string | null, row: T) =>
    onOpen ? (
      <Button type="link" className="client-flow__link" onClick={() => onOpen(row)}>
        {text || "Untitled"}
      </Button>
    ) : (
      text || "Untitled"
    ),
});

export const statusColumn = <T,>(dataIndex = "status", title = "Status"): TableColumnType<T> => ({
  title,
  dataIndex,
  render: (code: string | null) => <StatusTag code={code} />,
});

export const moneyColumn = <T,>(title: string, dataIndex: string): TableColumnType<T> => ({
  title,
  dataIndex,
  align: "right",
  render: (value: number | string | null) => formatMoney(value),
});

export const dateColumn = <T,>(title: string, dataIndex: string): TableColumnType<T> => ({
  title,
  dataIndex,
  render: (value: string | null) => formatDate(value),
});

export const sharedColumn = <T,>(): TableColumnType<T> => ({
  title: "Client App",
  dataIndex: "shared_at",
  render: (sharedAt: string | null) =>
    sharedAt ? (
      <Tooltip title={`Shared on ${formatDate(sharedAt)}`}>
        <Tag color="green">Shared</Tag>
      </Tooltip>
    ) : (
      <Tag>Not shared</Tag>
    ),
});
