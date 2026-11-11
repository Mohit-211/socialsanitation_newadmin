import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Button, Dropdown, Input, Modal, Select, Space, Table, Tooltip, message, type MenuProps, type TableColumnsType } from "antd";
import {
  ClipboardCheck,
  Download,
  Ellipsis,
  KeyRound,
  Mail,
  MapPin,
  Pencil,
  Plus,
  ScrollText,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import IconAction from "@/components/IconAction";
import NearestEmployeesModal from "@/components/NearestEmployeesModal";
import {
  assignClientAdmin,
  deleteClient,
  listClients,
  listEmployeesNearClient,
  resetClientCredentials,
} from "@/services/api/clientApi";
import { listAdmins } from "@/services/api/adminApi";
import { sendReviewEmail } from "@/services/api/reviewApi";
import { errorMessage, itemsOf } from "@/services/apiResult";
import { useApiQuery } from "@/hooks/useApiQuery";
import { PERMISSION, useCan } from "@/lib/session";
import { formatDateTime } from "@/utils/datetime";
import { downloadBlob } from "@/utils/download";
import "./clients.scss";
import "./ClientsPage.scss";
import type { Key } from "react";
import type { Client } from "@/types";

// The first address on file, as one line: street, then city, state, country.
const addressParts = (client: Client | null | undefined) => {
  const address = client?.user_address?.[0];
  if (!address) return null;
  const place = [address.user_city?.name, address.user_state?.name, address.user_country?.name]
    .filter(Boolean)
    .join(", ");
  return { street: address.address || "", place };
};

const renderAddress = (client: Client) => {
  const parts = addressParts(client);
  if (!parts) {
    return (
      <span className="client-list__address client-list__address--empty">
        <MapPin size={14} />
        <span>No address</span>
      </span>
    );
  }
  return (
    <Tooltip title={[parts.street, parts.place].filter(Boolean).join(", ")}>
      <div className="client-list__address" style={{ maxWidth: 230 }}>
        <MapPin size={14} className="client-list__address-icon" />
        <div className="client-list__address-text">
          <div className="client-list__address-street">{parts.street || "—"}</div>
          {parts.place && <div className="client-list__address-location">{parts.place}</div>}
        </div>
      </div>
    </Tooltip>
  );
};

const csvCell = (value: unknown) => {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

// Clicks on the row's own controls don't open the client.
const isControl = (target: EventTarget) => target instanceof Element && Boolean(target.closest("button, a, input, .ant-select, .ant-dropdown, .ant-checkbox-wrapper"));

// Every client. Clicking one opens their page, where their whole flow is
// worked: sheets, scopes, estimates, quotes, contracts, bookings, invoices.
const ClientsPage = () => {
  const navigate = useNavigate();
  const canDelete = useCan(PERMISSION.DELETE_RECORDS);
  const [search, setSearch] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [resetFor, setResetFor] = useState<Client | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [nearestFor, setNearestFor] = useState<Client | null>(null);

  const {
    data: clients,
    loading,
    reload,
    setData: setClients,
  } = useApiQuery(() => listClients().then(itemsOf), [], { initial: [], errorText: "Couldn't load the clients" });
  const { data: admins } = useApiQuery(() => listAdmins().then(itemsOf), [], { initial: [] });

  const rows = useMemo(() => {
    const text = search.trim().toLowerCase();
    if (!text) return clients;
    return clients.filter((client) => {
      const parts = addressParts(client);
      return [client.name, client.email, client.phone, parts?.street, parts?.place]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(text));
    });
  }, [clients, search]);

  const changeAdmin = async (client: Client, adminId: number | null) => {
    try {
      await assignClientAdmin(client.id, adminId);
      setClients((list) => list.map((item) => (item.id === client.id ? { ...item, assigned_to: adminId } : item)));
      message.success("Assigned admin changed");
    } catch (error) {
      message.error(errorMessage(error, "Couldn't change the assigned admin"));
    }
  };

  const sendReview = async (client: Client) => {
    try {
      await sendReviewEmail(client.id);
      message.success("Review links emailed to the client");
    } catch (error) {
      message.error(errorMessage(error, "Couldn't email the review links"));
    }
  };

  const resetCredentials = async () => {
    if (!resetFor) return;
    try {
      await resetClientCredentials(resetFor.id, newEmail.trim() === resetFor.email ? "" : newEmail.trim());
      message.success("New sign-in details sent");
      setResetFor(null);
      reload();
    } catch (error) {
      message.error(errorMessage(error, "Couldn't reset the sign-in details"));
    }
  };

  // Clients are deleted one at a time.
  const confirmDelete = (ids: Key[]) =>
    Modal.confirm({
      title: ids.length > 1 ? `Delete ${ids.length} clients?` : "Delete this client?",
      content: "They can no longer sign in to the app. This can't be undone.",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        let deleted = 0;
        for (const id of ids) {
          try {
            await deleteClient(String(id));
            deleted += 1;
          } catch (error) {
            message.error(errorMessage(error, "Couldn't delete a client"));
            break;
          }
        }
        if (deleted) message.success(deleted > 1 ? `${deleted} clients deleted` : "Client deleted");
        setSelectedRowKeys([]);
        reload();
      },
    });

  const exportCsv = () => {
    const lines = [
      ["ID", "Name", "Email", "Phone", "Address"].join(","),
      ...rows.map((client) => {
        const parts = addressParts(client);
        return [client.id, client.name, client.email, client.phone, parts && [parts.street, parts.place].join(", ")]
          .map(csvCell)
          .join(",");
      }),
    ];
    downloadBlob(new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" }), "clients.csv");
  };

  const moreItems: MenuProps["items"] = [
    { key: "quote", icon: <ScrollText size={14} />, label: "New quote" },
    { key: "inspections", icon: <ClipboardCheck size={14} />, label: "Inspections" },
    { key: "review", icon: <Mail size={14} />, label: "Email review links" },
    { key: "reset", icon: <KeyRound size={14} />, label: "Send new sign-in details" },
    { key: "edit", icon: <Pencil size={14} />, label: "Edit details" },
    ...(canDelete ? [{ type: "divider" as const }, { key: "delete", icon: <Trash2 size={14} />, label: "Delete", danger: true }] : []),
  ];

  const onMore = (client: Client, key: string) => {
    if (key === "quote") navigate(`/service-quote/${client.id}`);
    if (key === "inspections") navigate(`/clientInspections/${client.id}`);
    if (key === "review") sendReview(client);
    if (key === "reset") {
      setResetFor(client);
      setNewEmail(client.email || "");
    }
    if (key === "edit") navigate(`/editUser/${client.id}`);
    if (key === "delete") confirmDelete([client.id]);
  };

  const columns: TableColumnsType<Client> = [
    {
      title: "Name",
      dataIndex: "name",
      sorter: (a, b) => (a.name || "").localeCompare(b.name || ""),
      render: (name, client) => (
        <Button type="link" className="client-list__open" onClick={() => navigate(`/viewUser/${client.id}`)}>
          {name || client.email}
        </Button>
      ),
    },
    { title: "Email", dataIndex: "email", render: (email) => <span className="client-list__email">{email}</span> },
    { title: "Phone", dataIndex: "phone", render: (phone) => phone || "—" },
    {
      title: "Assigned To",
      dataIndex: "assigned_to",
      render: (assignedTo, client) => (
        <Select
          value={assignedTo || undefined}
          placeholder="Assign an admin"
          style={{ width: 170 }}
          onChange={(value) => changeAdmin(client, value)}
          options={(admins || []).map((admin) => ({ value: admin.id, label: admin.name || admin.email }))}
          aria-label="Assigned admin"
        />
      ),
    },
    { title: "Address", key: "address", render: (_, client) => renderAddress(client) },
    {
      title: "Client Since",
      dataIndex: "created_at",
      sorter: (a, b) => new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime(),
      render: (date) => formatDateTime(date),
    },
    {
      title: "Actions",
      key: "actions",
      width: 110,
      render: (_, client) => (
        <Space size={4}>
          <IconAction icon={Users} title="Nearest employees" onClick={() => setNearestFor(client)} />
          <Dropdown trigger={["click"]} menu={{ items: moreItems, onClick: ({ key }) => onMore(client, key) }}>
            <Button aria-label="More actions" icon={<Ellipsis size={16} />} className="icon-action" />
          </Dropdown>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="CLIENT MANAGEMENT"
        subtitle="Open a client to work their sheets, scopes, documents, bookings and invoices"
        actions={
          <>
            <Input
              allowClear
              size="large"
              prefix={<Search size={16} className="text-subtle" />}
              placeholder="Search name, email, phone or address"
              style={{ width: 280 }}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Tooltip title="Export CSV">
              <Button size="large" icon={<Download size={18} />} aria-label="Export CSV" onClick={exportCsv} />
            </Tooltip>
            {canDelete && (
              <Tooltip title="Delete selected">
                <span className="client-list__tooltip-wrap">
                  <Button
                    size="large"
                    type="primary"
                    danger
                    icon={<Trash2 size={18} />}
                    aria-label="Delete selected"
                    disabled={!selectedRowKeys.length}
                    onClick={() => confirmDelete(selectedRowKeys)}
                  />
                </span>
              </Tooltip>
            )}
            <Button size="large" type="primary" icon={<Plus size={18} />} onClick={() => navigate("/addUser")}>
              New Client
            </Button>
          </>
        }
      />

      <Table
        className="client-list"
        columns={columns}
        rowKey="id"
        dataSource={rows}
        loading={loading}
        pagination={{ pageSize: 50, showSizeChanger: true, pageSizeOptions: [25, 50, 100] }}
        rowSelection={canDelete ? { selectedRowKeys, onChange: setSelectedRowKeys } : undefined}
        scroll={{ x: "max-content" }}
        size="middle"
        onRow={(client) => ({
          onClick: (event) => {
            if (!isControl(event.target)) navigate(`/viewUser/${client.id}`);
          },
        })}
      />

      <Modal
        open={Boolean(resetFor)}
        title={
          <div className="customer-modal-title">
            <span className="customer-modal-title__icon customer-modal-title__icon--warning">
              <KeyRound size={17} />
            </span>
            <span className="customer-modal-title__text">Send New Sign-in Details</span>
          </div>
        }
        onCancel={() => setResetFor(null)}
        onOk={resetCredentials}
        okText="Send New Password"
        width={460}
        destroyOnHidden
      >
        <p className="client-list__hint">
          {resetFor?.name || resetFor?.email} gets a new temporary password by email. Change the address below to sign
          them in with a different email.
        </p>
        <label htmlFor="client-new-email" className="field-label client-list__field-label">
          Email Address
        </label>
        <Input
          id="client-new-email"
          type="email"
          value={newEmail}
          onChange={(event) => setNewEmail(event.target.value)}
          size="large"
        />
      </Modal>

      <NearestEmployeesModal
        open={Boolean(nearestFor)}
        subtitle={nearestFor?.name}
        load={() => listEmployeesNearClient(nearestFor?.id ?? 0)}
        onClose={() => setNearestFor(null)}
      />
    </div>
  );
};

export default ClientsPage;
