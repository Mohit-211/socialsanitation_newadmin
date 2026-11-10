import { useState } from "react";
import { Card, Descriptions, Select, message } from "antd";
import AddressesCard from "@/components/AddressesCard";
import ProfileRequestsTable from "@/pages/profile-requests/components/ProfileRequestsTable";
import "@/pages/profile-requests/profileRequests.scss";
import ClientBdmSelect from "./ClientBdmSelect";
import { assignClientAdmin, getClient, CLIENT_TYPES } from "@/services/api/clientApi";
import { listAdmins } from "@/services/api/adminApi";
import { dataOf, errorMessage, itemsOf } from "@/services/apiResult";
import { useApiQuery } from "@/hooks/useApiQuery";
import { formatDate } from "@/utils/datetime";

const typeLabel = (code) => CLIENT_TYPES.find((type) => type.value === code)?.label || code || "—";

// Who the client is, who looks after them, and where they get serviced.
const ClientProfileTab = ({ clientId, flow, onChanged }) => {
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

      <AddressesCard userId={clientId} addresses={addresses} onChanged={onChanged} title="Service Addresses" showNearest />

      <Card title="Open Account Requests" size="small" className="client-profile__card">
        <p className="text-secondary">
          What the client asked to change from the app. Make the change here, then mark the request done.
        </p>
        <ProfileRequestsTable clientId={clientId} compact />
      </Card>
    </div>
  );
};

export default ClientProfileTab;
