import { useState } from "react";
import { Select, message } from "antd";
import { getClientBdm } from "@/services/api/clientApi";
import { assignBdmClients, listBdms } from "@/services/api/bdmApi";
import { dataOf, errorMessage, itemsOf } from "@/services/apiResult";
import { useApiQuery } from "@/hooks/useApiQuery";
import { useIsSuperAdmin } from "@/lib/session";
import type { Id } from "@/types";

/**
 * The client's Business Development Manager, changed in place. Giving the
 * client to a BDM takes them from any other; clearing it removes their BDM.
 * BDM changes are Super Admin work, as in the sidebar.
 */
const ClientBdmSelect = ({ clientId, id }: { clientId?: Id | null; id?: string }) => {
  const isSuperAdmin = useIsSuperAdmin();
  const [saving, setSaving] = useState(false);
  const { data: bdms } = useApiQuery(() => listBdms().then(itemsOf), [], { initial: [] });
  const { data: bdm, setData: setBdm } = useApiQuery(() => getClientBdm(clientId ?? 0).then(dataOf), [clientId], {
    skip: !clientId,
  });

  const change = async (bdmId: number | null) => {
    setSaving(true);
    try {
      if (bdmId) await assignBdmClients({ bdmId, addClientIds: [Number(clientId)] });
      else if (bdm?.id) await assignBdmClients({ bdmId: bdm.id, removeClientIds: [Number(clientId)] });
      setBdm(bdmId ? (bdms.find((item) => item.id === bdmId) ?? null) : null);
      message.success(bdmId ? "BDM assigned" : "BDM removed");
    } catch (error) {
      message.error(errorMessage(error, "Couldn't change the BDM"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Select
      id={id}
      value={bdm?.id ?? undefined}
      placeholder={clientId ? "No BDM" : "Choose the client first"}
      allowClear
      disabled={!clientId || !isSuperAdmin}
      title={isSuperAdmin ? undefined : "BDM changes are for Super Admins"}
      loading={saving}
      onChange={(value) => change(value ?? null)}
      options={(bdms || []).map((item) => ({ value: item.id, label: item.name || item.email }))}
      style={{ width: "100%" }}
    />
  );
};

export default ClientBdmSelect;
