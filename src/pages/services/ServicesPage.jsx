import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Button, Input, Modal, Rate, Space, Table, Tooltip, message } from "antd";
import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import IconAction from "@/components/IconAction";
import { useApiQuery } from "@/hooks/useApiQuery";
import { PERMISSION, useCan } from "@/lib/session";
import { deleteService, listServices } from "@/services/api/serviceApi";
import { errorMessage, itemsOf } from "@/services/apiResult";
import "./ServicesPage.scss";

// Every service the company offers: what it is, its rating, its checklists.
const ServicesPage = () => {
  const navigate = useNavigate();
  const canDelete = useCan(PERMISSION.DELETE_RECORDS);
  const [search, setSearch] = useState("");
  const { data: services, loading, reload } = useApiQuery(() => listServices().then(itemsOf), [], {
    initial: [],
    errorText: "Couldn't load the services",
  });
  const shown = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (services || []).filter(
      (service) => !needle || `${service.name} ${service.abbreviation} ${service.description}`.toLowerCase().includes(needle),
    );
  }, [services, search]);

  const confirmDelete = (service) =>
    Modal.confirm({
      title: `Delete "${service.name}"?`,
      content: "It can no longer be booked. This can't be undone.",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await deleteService(service.id);
          message.success("Service deleted");
          reload();
        } catch (error) {
          message.error(errorMessage(error, "Couldn't delete the service"));
        }
      },
    });

  const columns = [
    {
      title: "Service",
      dataIndex: "name",
      sorter: (a, b) => (a.name || "").localeCompare(b.name || ""),
      render: (name, service) => (
        <Button type="link" className="table-link" onClick={() => navigate(`/viewService/${service.id}`)}>
          {name}
        </Button>
      ),
    },
    { title: "Abbreviation", dataIndex: "abbreviation" },
    {
      title: "Description",
      dataIndex: "description",
      render: (text) => (
        <Tooltip title={text}>
          <span className="services-list__description">{text || "—"}</span>
        </Tooltip>
      ),
    },
    {
      title: "Rating",
      dataIndex: "average_rating",
      sorter: (a, b) => (a.average_rating || 0) - (b.average_rating || 0),
      render: (rating) => (rating ? <Rate disabled allowHalf value={Number(rating)} /> : <span className="text-subtle">No reviews</span>),
    },
    {
      title: "Actions",
      key: "actions",
      width: 140,
      render: (_, service) => (
        <Space size={4}>
          <IconAction icon={Eye} title="Open" onClick={() => navigate(`/viewService/${service.id}`)} />
          <IconAction icon={Pencil} title="Edit" onClick={() => navigate(`/editService/${service.id}`)} />
          {canDelete && <IconAction icon={Trash2} title="Delete" danger onClick={() => confirmDelete(service)} />}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="SERVICES"
        subtitle="What clients can book. Prices are agreed per client, on quotes and contracts."
        actions={
          <Space wrap>
            <Input
              allowClear
              size="large"
              className="services-list__search"
              prefix={<Search size={16} className="text-subtle" />}
              placeholder="Search services"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button type="primary" size="large" icon={<Plus size={16} />} onClick={() => navigate("/addService")}>
              Add Service
            </Button>
          </Space>
        }
      />
      <Table rowKey="id" size="middle" loading={loading} columns={columns} dataSource={shown} pagination={{ pageSize: 50 }} scroll={{ x: "max-content" }} />
    </div>
  );
};

export default ServicesPage;
