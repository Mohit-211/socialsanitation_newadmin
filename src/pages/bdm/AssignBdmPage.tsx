import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Alert, Button, Card, Select, Space, Spin, message } from "antd";
import { ArrowLeft, CircleCheck } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { useApiQuery } from "@/hooks/useApiQuery";
import { assignBdmClients, listBdmClients, listBdms } from "@/services/api/bdmApi";
import { listUnassignedClients } from "@/services/api/clientApi";
import { errorMessage, itemsOf } from "@/services/apiResult";
import "./BdmsPage.scss";
import { useRouteParam } from "@/hooks/useRouteParam";

// Which clients a BDM looks after: theirs now, plus any client without a BDM.
// Saving gives the new ones and takes away the ones removed.
const AssignBdmPage = () => {
  const id = useRouteParam();
  const navigate = useNavigate();
  const bdmId = Number(id);
  const [picked, setPicked] = useState<number[] | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: bdms } = useApiQuery(() => listBdms().then(itemsOf), [], { initial: [], silent: true });
  const { data: current, loading: loadingCurrent } = useApiQuery(() => listBdmClients(bdmId).then(itemsOf), [bdmId], {
    initial: [],
    errorText: "Couldn't load the BDM's clients",
  });
  const { data: unassigned, loading: loadingFree } = useApiQuery(() => listUnassignedClients().then(itemsOf), [], {
    initial: [],
    errorText: "Couldn't load the clients without a BDM",
  });
  const bdm = (bdms || []).find((row) => row.id === bdmId);

  const currentIds = useMemo(() => (current || []).map((row) => row.user_id), [current]);
  const chosen = picked ?? currentIds;
  const options = useMemo(() => {
    const theirs = (current || []).map((row) => ({
      value: row.user_id,
      label: row.user_bdm?.name || row.user_bdm?.email || `Client ${row.user_id}`,
    }));
    const free = (unassigned || [])
      .filter((client) => !currentIds.includes(client.id))
      .map((client) => ({ value: client.id, label: client.name || client.email }));
    return [...theirs, ...free];
  }, [current, unassigned, currentIds]);

  const added = chosen.filter((clientId) => !currentIds.includes(clientId));
  const removed = currentIds.filter((clientId) => !chosen.includes(clientId));

  const save = async () => {
    setSaving(true);
    try {
      const res = await assignBdmClients({ bdmId, addClientIds: added, removeClientIds: removed });
      message.success(res.data?.message || "Clients saved");
      navigate("/bdm-list");
    } catch (error) {
      message.error(errorMessage(error, "Couldn't save the clients"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title={`CLIENTS OF ${(bdm?.name || bdm?.email || "THE BDM").toUpperCase()}`}
        subtitle="Their clients now, and any client without a BDM"
        actions={
          <Button size="large" icon={<ArrowLeft size={16} />} onClick={() => navigate("/bdm-list")}>
            All BDMs
          </Button>
        }
      />
      <Card className="form-card bdm-assign">
        <Spin spinning={loadingCurrent || loadingFree}>
          <label className="field-label" htmlFor="bdm-clients">
            Clients
          </label>
          <Select
            id="bdm-clients"
            mode="multiple"
            size="large"
            style={{ width: "100%" }}
            placeholder="Search clients"
            optionFilterProp="label"
            value={chosen}
            onChange={setPicked}
            options={options}
          />
          {(added.length > 0 || removed.length > 0) && (
            <Alert
              type="info"
              showIcon
              className="bdm-assign__summary"
              title={[added.length && `${added.length} to give`, removed.length && `${removed.length} to take away`]
                .filter(Boolean)
                .join(", ")}
            />
          )}
          <Space className="bdm-assign__actions">
            <Button size="large" onClick={() => navigate("/bdm-list")}>
              Cancel
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<CircleCheck size={16} />}
              loading={saving}
              disabled={!added.length && !removed.length}
              onClick={save}
            >
              Save
            </Button>
          </Space>
        </Spin>
      </Card>
    </>
  );
};

export default AssignBdmPage;
