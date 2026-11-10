import { useState } from "react";
import { Button, Card, Descriptions, Empty, Modal, Select, Space, Tag, Tooltip, message } from "antd";
import { MapPin, Pencil, Plus, Star, Trash2, Users } from "lucide-react";
import IconAction from "@/components/IconAction";
import AddressFormModal from "@/components/AddressFormModal";
import NearestEmployeesModal from "@/components/NearestEmployeesModal";
import ClientBdmSelect from "./ClientBdmSelect";
import { assignClientAdmin, getClient, CLIENT_TYPES } from "@/services/api/clientApi";
import { deleteAddress, listEmployeesNearAddress, makeAddressPrimary } from "@/services/api/addressApi";
import { listAdmins } from "@/services/api/adminApi";
import { dataOf, errorMessage, itemsOf } from "@/services/apiResult";
import { useApiQuery } from "@/hooks/useApiQuery";
import { PERMISSION, useCan } from "@/lib/session";
import { formatDate } from "@/utils/datetime";

const typeLabel = (code) => CLIENT_TYPES.find((type) => type.value === code)?.label || code || "—";

// Who the client is, who looks after them, and where they get serviced.
const ClientProfileTab = ({ clientId, flow, onChanged }) => {
  const canDelete = useCan(PERMISSION.DELETE_RECORDS);
  const [addressForm, setAddressForm] = useState(null); // { address } to edit, {} to add
  const [nearestFor, setNearestFor] = useState(null);
  const [savingAdmin, setSavingAdmin] = useState(false);
  const addresses = flow?.addresses ?? [];

  const { data: client, setData: setClient } = useApiQuery(() => getClient(clientId).then(dataOf), [clientId], {
    errorText: "Couldn't load the client",
  });
  const { data: admins } = useApiQuery(() => listAdmins().then(itemsOf), [], { initial: [] });

  const changeAdmin = async (adminId) => {
    setSavingAdmin(true);
    try {
      await assignClientAdmin(clientId, adminId);
      setClient((current) => ({ ...current, assigned_to: adminId }));
      message.success("Assigned admin changed");
    } catch (error) {
      message.error(errorMessage(error, "Couldn't change the assigned admin"));
    } finally {
      setSavingAdmin(false);
    }
  };

  const setPrimary = async (address) => {
    try {
      await makeAddressPrimary(address.id);
      message.success("Primary address changed");
      onChanged?.();
    } catch (error) {
      message.error(errorMessage(error, "Couldn't change the primary address"));
    }
  };

  const confirmDeleteAddress = (address) =>
    Modal.confirm({
      title: "Delete this address?",
      content: address.one_line,
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await deleteAddress(address.id);
          message.success("Address deleted");
          onChanged?.();
        } catch (error) {
          message.error(errorMessage(error, "Couldn't delete the address"));
        }
      },
    });

  return (
    <div className="client-flow__tab client-profile">
      <Card title="Details" size="small" className="client-profile__card">
        <Descriptions
          size="small"
          column={{ xs: 1, md: 2 }}
          items={[
            { key: "name", label: "Name", children: flow?.client?.name || "—" },
            { key: "type", label: "Client Type", children: typeLabel(flow?.client?.client_type) },
            { key: "email", label: "Email", children: flow?.client?.email || "—" },
            { key: "cc", label: "CC Email", children: client?.cc_email || "—" },
            { key: "phone", label: "Phone", children: flow?.client?.phone || "—" },
            { key: "since", label: "Client Since", children: formatDate(client?.created_at) },
          ]}
        />
      </Card>

      <Card title="Looked After By" size="small" className="client-profile__card">
        <div className="form-grid form-grid--2">
          <div>
            <label className="field-label" htmlFor="client-assigned-admin">
              Assigned Admin
            </label>
            <Select
              id="client-assigned-admin"
              value={client?.assigned_to ?? undefined}
              placeholder="Not assigned"
              loading={savingAdmin}
              onChange={changeAdmin}
              options={(admins || []).map((admin) => ({ value: admin.id, label: admin.name || admin.email }))}
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="client-bdm">
              Business Development Manager
            </label>
            <ClientBdmSelect id="client-bdm" clientId={clientId} />
          </div>
        </div>
      </Card>

      <Card
        title="Service Addresses"
        size="small"
        className="client-profile__card"
        extra={
          <Button icon={<Plus size={14} />} onClick={() => setAddressForm({})}>
            Add Address
          </Button>
        }
      >
        {addresses.length === 0 ? (
          <Empty description="No addresses yet." />
        ) : (
          <ul className="client-addresses">
            {addresses.map((address) => (
              <li key={address.id} className="client-addresses__item">
                <MapPin size={18} className="client-addresses__icon text-subtle" />
                <div className="client-addresses__body">
                  <Space size={6} wrap className="client-addresses__title">
                    <span>{address.label || "Address"}</span>
                    {address.is_primary && <Tag color="blue">Primary</Tag>}
                    {!address.postal_code && (
                      <Tooltip title="Add the ZIP or postal code when you next edit it">
                        <Tag color="gold">No ZIP</Tag>
                      </Tooltip>
                    )}
                  </Space>
                  <div>{address.one_line}</div>
                  {address.access_notes && <div className="text-subtle">Access: {address.access_notes}</div>}
                </div>
                <Space size={4} className="client-addresses__actions">
                  <IconAction icon={Pencil} title="Edit" onClick={() => setAddressForm({ address })} />
                  {!address.is_primary && (
                    <IconAction icon={Star} title="Make primary" onClick={() => setPrimary(address)} />
                  )}
                  <IconAction icon={Users} title="Nearest employees" onClick={() => setNearestFor(address)} />
                  {canDelete && (
                    <IconAction icon={Trash2} title="Delete" danger onClick={() => confirmDeleteAddress(address)} />
                  )}
                </Space>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <AddressFormModal
        open={Boolean(addressForm)}
        userId={clientId}
        address={addressForm?.address}
        onCancel={() => setAddressForm(null)}
        onSaved={() => {
          setAddressForm(null);
          onChanged?.();
        }}
      />
      <NearestEmployeesModal
        open={Boolean(nearestFor)}
        subtitle={nearestFor?.one_line}
        load={() => listEmployeesNearAddress(nearestFor.id)}
        onClose={() => setNearestFor(null)}
      />
    </div>
  );
};

export default ClientProfileTab;
