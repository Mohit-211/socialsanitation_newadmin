import { useState } from "react";
import { useNavigate } from "react-router";
import { Button, Input, Modal, Select, Space, Table, Tooltip, message } from "antd";
import { Check, Trash2, X } from "lucide-react";
import IconAction from "@/components/IconAction";
import StatusTag from "@/components/StatusTag";
import { usePagedList } from "@/hooks/usePagedList";
import { PERMISSION, useCan } from "@/lib/session";
import {
  PROFILE_REQUEST_KINDS,
  PROFILE_REQUEST_STATUSES,
  answerProfileRequest,
  deleteAccountForRequest,
  listProfileRequests,
} from "@/services/api/profileRequestApi";
import { errorMessage } from "@/services/apiResult";
import { clientPagePath } from "@/pages/clients/clientFlow";
import { formatDate, formatDateTime } from "@/utils/datetime";

/**
 * Clients' account requests, open ones first by default: mark one done or
 * decline it (with a note the client sees), and delete the account for an
 * account-deletion request. `clientId` keeps it to one client.
 */
const ProfileRequestsTable = ({ clientId, compact = false }) => {
  const navigate = useNavigate();
  const canDelete = useCan(PERMISSION.DELETE_RECORDS);
  const [answering, setAnswering] = useState(null); // { request, status }
  const [note, setNote] = useState("");
  const list = usePagedList((query) => listProfileRequests(query), {
    limit: compact ? 5 : 20,
    filters: { status: "open", ...(clientId ? { client_id: clientId } : {}) },
    errorText: "Couldn't load the account requests",
  });

  const answer = async () => {
    try {
      await answerProfileRequest(answering.request.id, { status: answering.status, note });
      message.success(answering.status === "done" ? "Marked done" : "Declined");
      setAnswering(null);
      list.reload();
    } catch (error) {
      message.error(errorMessage(error, "Couldn't answer the request"));
    }
  };

  const deleteAccount = (request) =>
    Modal.confirm({
      title: `Delete ${request.client?.name || "the client"}'s account?`,
      content: "They can no longer sign in, and the request is marked done. This can't be undone.",
      okText: "Delete the Account",
      okType: "danger",
      onOk: async () => {
        try {
          await deleteAccountForRequest(request.id);
          message.success("Account deleted");
          list.reload();
        } catch (error) {
          message.error(errorMessage(error, "Couldn't delete the account"));
        }
      },
    });

  const columns = [
    ...(clientId
      ? []
      : [
          {
            title: "Client",
            key: "client",
            render: (_, request) =>
              request.client ? (
                <Button type="link" className="table-link" onClick={() => navigate(clientPagePath(request.client.id))}>
                  {request.client.name || request.client.email}
                </Button>
              ) : (
                "—"
              ),
          },
        ]),
    { title: "Asks For", dataIndex: "kind_name" },
    {
      title: "Details",
      dataIndex: "details",
      render: (details) =>
        details ? (
          <Tooltip title={details}>
            <span className="profile-requests__details">{details}</span>
          </Tooltip>
        ) : (
          "—"
        ),
    },
    { title: "Asked", dataIndex: "created_at", render: (date) => formatDate(date) },
    {
      title: "Status",
      key: "status",
      render: (_, request) => (
        <Space orientation="vertical" size={2}>
          <StatusTag code={request.status} />
          {request.handled_at && <span className="text-subtle">{formatDateTime(request.handled_at)}</span>}
          {request.office_note && <span className="text-subtle">"{request.office_note}"</span>}
        </Space>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      render: (_, request) =>
        request.status === "open" ? (
          <Space size={4}>
            <IconAction icon={Check} title="Mark done" onClick={() => setAnswering({ request, status: "done" })} />
            <IconAction icon={X} title="Decline" onClick={() => setAnswering({ request, status: "declined" })} />
            {request.kind === "delete_account" && canDelete && (
              <IconAction icon={Trash2} title="Delete the account" danger onClick={() => deleteAccount(request)} />
            )}
          </Space>
        ) : null,
    },
  ];

  return (
    <>
      {!compact && (
        <Space wrap className="profile-requests__filters">
          <Select
            allowClear
            placeholder="Any status"
            value={list.filters.status}
            onChange={(value) => list.setFilter("status", value)}
            options={PROFILE_REQUEST_STATUSES}
            style={{ width: 160 }}
          />
          <Select
            allowClear
            placeholder="Any request"
            value={list.filters.kind}
            onChange={(value) => list.setFilter("kind", value)}
            options={PROFILE_REQUEST_KINDS}
            style={{ width: 200 }}
          />
        </Space>
      )}
      <Table
        rowKey="id"
        size={compact ? "small" : "middle"}
        columns={columns}
        scroll={{ x: "max-content" }}
        locale={{ emptyText: "No open requests." }}
        {...list.tableProps}
      />
      <Modal
        open={Boolean(answering)}
        title={answering?.status === "done" ? "Mark the request done" : "Decline the request"}
        okText={answering?.status === "done" ? "Mark Done" : "Decline"}
        onOk={answer}
        onCancel={() => setAnswering(null)}
        afterOpenChange={(open) => open && setNote("")}
        destroyOnHidden
      >
        <p className="text-secondary">
          {answering?.request?.kind_name}: make the change on the client's page first. The client sees this note.
        </p>
        <Input.TextArea
          rows={3}
          maxLength={2000}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional: what was done, or why not"
        />
      </Modal>
    </>
  );
};

export default ProfileRequestsTable;
