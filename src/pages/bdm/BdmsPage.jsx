import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Button, Empty, Input, Modal, Space, Spin, Table, message } from "antd";
import { Eye, Pencil, Plus, Search, Trash2, UserPlus, Users } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import IconAction from "@/components/IconAction";
import { useApiQuery } from "@/hooks/useApiQuery";
import { PERMISSION, useCan } from "@/lib/session";
import { listBdmClients, listBdms, removeBdm } from "@/services/api/bdmApi";
import { errorMessage, itemsOf } from "@/services/apiResult";
import { clientPagePath } from "@/pages/clients/clientFlow";
import "./BdmsPage.scss";

// One BDM's clients, each opening its client page.
const BdmClients = ({ bdm, onClose }) => {
  const navigate = useNavigate();
  const { data: rows, loading } = useApiQuery(() => listBdmClients(bdm.id).then(itemsOf), [bdm.id], {
    initial: [],
    errorText: "Couldn't load the BDM's clients",
  });
  return (
    <Modal open title={`Clients of ${bdm.name || bdm.email}`} footer={null} onCancel={onClose} width={640}>
      <Spin spinning={loading}>
        {!loading && !(rows || []).length ? (
          <Empty description="No clients yet." />
        ) : (
          <ul className="bdm-clients">
            {(rows || []).map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  className="bdm-clients__item"
                  onClick={() => navigate(clientPagePath(row.user_bdm?.id || row.user_id))}
                >
                  <strong>{row.user_bdm?.name || row.user_bdm?.email || `Client ${row.user_id}`}</strong>
                  <span className="text-subtle">{row.user_bdm?.email}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Spin>
    </Modal>
  );
};

// Business Development Managers: employees with the BDM role who look after
// clients. Their clients, who to give them, and removing the role.
const BdmsPage = () => {
  const navigate = useNavigate();
  const canDelete = useCan(PERMISSION.DELETE_RECORDS);
  const [search, setSearch] = useState("");
  const [clientsOf, setClientsOf] = useState(null);

  const { data: bdms, loading, reload } = useApiQuery(() => listBdms().then(itemsOf), [], {
    initial: [],
    errorText: "Couldn't load the BDMs",
  });
  const shown = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (bdms || []).filter(
      (bdm) => !needle || `${bdm.name || ""} ${bdm.email || ""} ${bdm.mobile || ""}`.toLowerCase().includes(needle),
    );
  }, [bdms, search]);

  const confirmRemove = (bdm) =>
    Modal.confirm({
      title: `Take the BDM role off ${bdm.name || bdm.email}?`,
      content:
        "Their clients become unassigned. Someone who only was a BDM loses their account; anyone with other roles keeps them.",
      okText: "Remove the Role",
      okType: "danger",
      onOk: async () => {
        try {
          const res = await removeBdm(bdm.id);
          message.success(res.data?.message || "BDM role removed");
          reload();
        } catch (error) {
          message.error(errorMessage(error, "Couldn't remove the BDM role"));
        }
      },
    });

  const columns = [
    {
      title: "BDM",
      key: "name",
      sorter: (a, b) => (a.name || "").localeCompare(b.name || ""),
      render: (_, bdm) => (
        <Button type="link" className="table-link" onClick={() => navigate(`/viewEmployee/${bdm.id}`)}>
          {bdm.name || bdm.email}
        </Button>
      ),
    },
    { title: "Email", dataIndex: "email" },
    { title: "Phone", dataIndex: "mobile", render: (phone) => phone || "—" },
    {
      title: "Actions",
      key: "actions",
      width: 220,
      render: (_, bdm) => (
        <Space size={4}>
          <IconAction icon={Users} title="Their clients" onClick={() => setClientsOf(bdm)} />
          <IconAction icon={UserPlus} title="Give or take clients" onClick={() => navigate(`/assign/${bdm.id}`)} />
          <IconAction icon={Eye} title="Their page" onClick={() => navigate(`/viewEmployee/${bdm.id}`)} />
          <IconAction icon={Pencil} title="Edit" onClick={() => navigate(`/editEmployee/${bdm.id}`)} />
          {canDelete && <IconAction icon={Trash2} title="Remove the BDM role" danger onClick={() => confirmRemove(bdm)} />}
        </Space>
      ),
    },
  ];

  return (
    <div className="bdm-page">
      <PageHeader
        title="BDMS"
        subtitle="Business Development Managers look after clients. Each is an employee with the BDM role."
        actions={
          <Space wrap>
            <Input
              allowClear
              size="large"
              className="bdm-page__search"
              prefix={<Search size={16} className="text-subtle" />}
              placeholder="Search name, email or phone"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button type="primary" size="large" icon={<Plus size={16} />} onClick={() => navigate("/addEmployee?role=bdm")}>
              Add BDM
            </Button>
          </Space>
        }
      />
      <Table rowKey="id" size="middle" loading={loading} columns={columns} dataSource={shown} scroll={{ x: "max-content" }} />
      {clientsOf && <BdmClients bdm={clientsOf} onClose={() => setClientsOf(null)} />}
    </div>
  );
};

export default BdmsPage;
