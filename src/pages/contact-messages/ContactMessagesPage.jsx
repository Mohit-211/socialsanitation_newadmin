import { useState } from "react";
import { Input, Modal, Space, Table, Tooltip, message } from "antd";
import { Eye, Search, Trash2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import IconAction from "@/components/IconAction";
import { usePagedList } from "@/hooks/usePagedList";
import { PERMISSION, useCan } from "@/lib/session";
import { deleteContactMessage, listContactMessages } from "@/services/api/contentApi";
import { errorMessage } from "@/services/apiResult";
import { formatDateTime } from "@/utils/datetime";

const clip = (text, length = 60) => (text && text.length > length ? `${text.slice(0, length)}…` : text || "—");

// What visitors send from the website's contact form, newest first.
const ContactMessagesPage = () => {
  const canDelete = useCan(PERMISSION.DELETE_RECORDS);
  const [open, setOpen] = useState(null);
  const list = usePagedList((query) => listContactMessages(query), {
    limit: 20,
    errorText: "Couldn't load the contact messages",
  });

  const confirmDelete = (row) =>
    Modal.confirm({
      title: `Delete the message from ${row.name || row.email}?`,
      content: "This can't be undone.",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await deleteContactMessage(row.id);
          message.success("Message deleted");
          list.reload();
        } catch (error) {
          message.error(errorMessage(error, "Couldn't delete the message"));
        }
      },
    });

  const columns = [
    { title: "Sent", dataIndex: "created_at", render: (date) => formatDateTime(date) },
    { title: "Name", dataIndex: "name", render: (name) => name || "—" },
    {
      title: "Email",
      dataIndex: "email",
      render: (email) => (email ? <a href={`mailto:${email}`}>{email}</a> : "—"),
    },
    {
      title: "Mobile",
      dataIndex: "mobile",
      render: (mobile) => (mobile ? <a href={`tel:${mobile}`}>{mobile}</a> : "—"),
    },
    { title: "Reason", dataIndex: "reason", render: (reason) => reason || "—" },
    {
      title: "Message",
      dataIndex: "message",
      render: (text) => (
        <Tooltip title={text}>
          <span>{clip(text)}</span>
        </Tooltip>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 100,
      render: (_, row) => (
        <Space size={4}>
          <IconAction icon={Eye} title="Read" onClick={() => setOpen(row)} />
          {canDelete && <IconAction icon={Trash2} title="Delete" danger onClick={() => confirmDelete(row)} />}
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="CONTACT MESSAGES"
        subtitle="Sent from the website's contact form"
        actions={
          <Input
            allowClear
            size="large"
            prefix={<Search size={16} className="text-subtle" />}
            placeholder="Search name, email, mobile or reason"
            value={list.searchText}
            onChange={(e) => list.setSearchText(e.target.value)}
            style={{ width: 300 }}
          />
        }
      />
      <Table rowKey="id" size="middle" columns={columns} scroll={{ x: "max-content" }} {...list.tableProps} />
      <Modal open={Boolean(open)} title={open ? `From ${open.name || open.email}` : ""} footer={null} onCancel={() => setOpen(null)}>
        {open && (
          <Space orientation="vertical" style={{ width: "100%" }}>
            <span className="text-secondary">
              {[open.email, open.mobile, formatDateTime(open.created_at)].filter(Boolean).join(" · ")}
            </span>
            {open.reason && (
              <span>
                <strong>Reason:</strong> {open.reason}
              </span>
            )}
            <p style={{ whiteSpace: "pre-wrap" }}>{open.message}</p>
          </Space>
        )}
      </Modal>
    </>
  );
};

export default ContactMessagesPage;
