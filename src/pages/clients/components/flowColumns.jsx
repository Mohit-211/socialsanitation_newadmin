import { Button, Tag, Tooltip } from "antd";
import { formatDate } from "@/utils/datetime";
import { formatMoney } from "@/utils/format";
import StatusTag from "@/components/StatusTag";

// Table columns the client page's lists share.

export const titleColumn = (onOpen, title = "Title") => ({
  title,
  dataIndex: "title",
  render: (text, row) =>
    onOpen ? (
      <Button type="link" className="client-flow__link" onClick={() => onOpen(row)}>
        {text || "Untitled"}
      </Button>
    ) : (
      text || "Untitled"
    ),
});

export const statusColumn = (dataIndex = "status", title = "Status") => ({
  title,
  dataIndex,
  render: (code) => <StatusTag code={code} />,
});

export const moneyColumn = (title, dataIndex) => ({
  title,
  dataIndex,
  align: "right",
  render: (value) => formatMoney(value),
});

export const dateColumn = (title, dataIndex) => ({
  title,
  dataIndex,
  render: (value) => formatDate(value),
});

export const sharedColumn = () => ({
  title: "Client App",
  dataIndex: "shared_at",
  render: (sharedAt) =>
    sharedAt ? (
      <Tooltip title={`Shared on ${formatDate(sharedAt)}`}>
        <Tag color="green">Shared</Tag>
      </Tooltip>
    ) : (
      <Tag>Not shared</Tag>
    ),
});
