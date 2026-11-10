import { Tag } from "antd";
import { statusTag } from "@/utils/format";

/** A status code as a colored tag, in words people read. */
const StatusTag = ({ code }) => {
  const { label, color } = statusTag(code);
  return <Tag color={color}>{label}</Tag>;
};

export default StatusTag;
