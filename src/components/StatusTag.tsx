import { Tag } from "antd";
import { statusTag } from "@/utils/format";

/** A status code as a colored tag, in words people read. */
const StatusTag = ({ code }: { code: string | null | undefined }) => {
  const { label, color } = statusTag(code);
  return <Tag color={color}>{label}</Tag>;
};

export default StatusTag;
