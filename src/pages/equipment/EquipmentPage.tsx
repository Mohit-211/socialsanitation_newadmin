import { useEffect, useState } from "react";
import {
  Table,
  Button,
  Input,
  Modal,
  Form,
  InputNumber,
  Popconfirm,
  Upload,
  message,
  Space,
  Typography as AntTypography,
  type TableColumnsType,
} from "antd";
import {
  Download,
  Inbox,
  Search,
  Upload as UploadIcon,
  Plus,
} from "lucide-react";
import "./EquipmentPage.scss";
import {
  listEquipment,
  createEquipment,
  updateEquipment,
  deleteEquipment,
} from "@/services/api/equipmentApi";
import PageHeader from "@/components/PageHeader";
import { PERMISSION, useCan } from "@/lib/session";
import type { Equipment } from "@/types";
import { isFormValidationError } from "./formErrors";

/** A piece of equipment as the form and the CSV import have it. */
type EquipmentFields = { name: string; quantity: number };

const { Text } = AntTypography;
const { Dragger } = Upload;

// Parses a simple CSV string with a header row into an array of
// { name, quantity } objects. Expects headers: name,quantity
const parseEquipmentCSV = (csvText: string): EquipmentFields[] => {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const nameIndex = headers.indexOf("name");
  const quantityIndex = headers.indexOf("quantity");

  if (nameIndex === -1 || quantityIndex === -1) {
    throw new Error("CSV must have 'name' and 'quantity' columns");
  }

  return lines.slice(1).map((line) => {
    const cells = line.split(",").map((c) => c.trim());
    return {
      name: cells[nameIndex],
      quantity: Number(cells[quantityIndex]) || 0,
    };
  });
};

const EquipmentPage = () => {
  // Deleting is Super Admin only (records.delete); others don't see it.
  const canDelete = useCan(PERMISSION.DELETE_RECORDS);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [filteredEquipments, setFilteredEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Equipment | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [parsedRows, setParsedRows] = useState<EquipmentFields[]>([]);
  const [importing, setImporting] = useState(false);

  const [form] = Form.useForm<EquipmentFields>();

  // Sets state only once the request settles, so the opening load can run in an effect.
  const loadEquipments = () =>
    listEquipment({ page: 1, limit: 500 })
      .then((res) => {
        const list = res?.data?.data?.items || [];
        setEquipments(list);
        setFilteredEquipments(list);
      })
      .catch(() => message.error("Couldn't load the equipment."))
      .finally(() => setLoading(false));

  const fetchEquipments = () => {
    setLoading(true);
    return loadEquipments();
  };

  useEffect(() => {
    loadEquipments();
    // Loaded once on opening.
  }, []);

  const handleSearch = (value: string) => {
    setSearchText(value);
    if (!value) {
      setFilteredEquipments(equipments);
      return;
    }
    const filtered = equipments.filter((item) =>
      item.name.toLowerCase().includes(value.toLowerCase()),
    );
    setFilteredEquipments(filtered);
  };

  const openAddModal = () => {
    setEditingRecord(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const openEditModal = (record: Equipment) => {
    setEditingRecord(record);
    form.setFieldsValue({
      name: record.name,
      quantity: record.quantity,
    });
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingRecord(null);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        name: values.name,
        quantity: values.quantity,
      };

      setSubmitting(true);

      if (editingRecord) {
        await updateEquipment(editingRecord.id, payload);
        message.success("Equipment updated successfully.");
      } else {
        await createEquipment(payload);
        message.success("Equipment created successfully.");
      }

      setIsModalOpen(false);
      form.resetFields();
      setEditingRecord(null);
      fetchEquipments();
    } catch (err) {
      if (isFormValidationError(err)) return; // validation error, do nothing extra
      message.error(
        editingRecord
          ? "Failed to update equipment."
          : "Failed to create equipment.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteEquipment(id);
      message.success("Equipment deleted successfully.");
      fetchEquipments();
    } catch {
      message.error("Failed to delete equipment.");
    }
  };

  // Import (CSV)

  const openImportModal = () => {
    setParsedRows([]);
    setIsImportModalOpen(true);
  };

  const closeImportModal = () => {
    setIsImportModalOpen(false);
    setParsedRows([]);
  };

  const handleFileRead = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        const rows = parseEquipmentCSV(typeof text === "string" ? text : "");
        if (!rows.length) {
          message.error("No valid rows found in this file.");
          return;
        }
        setParsedRows(rows);
      } catch (err) {
        message.error((err instanceof Error && err.message) || "Could not read this CSV file.");
      }
    };
    reader.readAsText(file);
    return false; // prevent antd's default auto-upload behaviour
  };

  const handleDownloadSample = () => {
    const sample = "name,quantity\nCommercial Vacuum,15\nMicrofiber Rags,200\n";
    const blob = new Blob([sample], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "equipment-import-sample.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportConfirm = async () => {
    if (!parsedRows.length) {
      message.info("Choose a CSV file to import first.");
      return;
    }

    setImporting(true);
    let successCount = 0;
    let failCount = 0;

    for (const row of parsedRows) {
      try {
        await createEquipment({ name: row.name, quantity: row.quantity });
        successCount += 1;
      } catch {
        failCount += 1;
      }
    }

    setImporting(false);

    if (successCount) {
      message.success(`Imported ${successCount} equipment item(s).`);
    }
    if (failCount) {
      message.error(`${failCount} row(s) failed to import.`);
    }

    closeImportModal();
    fetchEquipments();
  };

  const columns: TableColumnsType<Equipment> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
    },
    {
      title: "Action",
      key: "action",
      render: (_value, record) => (
        <Space size="middle">
          <Button type="link" onClick={() => openEditModal(record)}>
            Edit
          </Button>
          {canDelete && (
            <Popconfirm
              title="Delete equipment"
              description="Are you sure you want to delete this equipment?"
              onConfirm={() => handleDelete(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button type="link" danger>
                Delete
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="equipment-page">
      {/* ── Standard shared header ── */}
      <PageHeader
        title="EQUIPMENT"
        subtitle="Manage the equipment your team can be assigned."
        actions={
          <>
            <Input
              allowClear
              size="large"
              prefix={<Search size={16} color="var(--color-text-subtle)" />}
              placeholder="Search equipment by name"
              className="equipment-page__search"
              value={searchText}
              onChange={(e) => handleSearch(e.target.value)}
            />

            <Button
              size="large"
              icon={<UploadIcon size={16} />}
              onClick={openImportModal}
            >
              Import
            </Button>

            <Button
              type="primary"
              size="large"
              icon={<Plus size={16} />}
              onClick={openAddModal}
            >
              Add Equipment
            </Button>
          </>
        }
      />

      <Table
        rowKey="id"
        columns={columns}
        dataSource={filteredEquipments}
        loading={loading}
        pagination={{ pageSize: 10 }}
        bordered
        size="middle"
      />

      <Modal
        title={editingRecord ? "Edit Equipment" : "Add Equipment"}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={handleCancel}
        confirmLoading={submitting}
        okText={editingRecord ? "Update" : "Create"}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: "Please enter equipment name" }]}
          >
            <Input placeholder="Enter equipment name" />
          </Form.Item>

          <Form.Item
            label="Quantity"
            name="quantity"
            rules={[{ required: true, message: "Please enter quantity" }]}
          >
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              placeholder="Enter quantity"
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Import Equipment"
        open={isImportModalOpen}
        onCancel={closeImportModal}
        onOk={handleImportConfirm}
        okText={`Import${parsedRows.length ? ` ${parsedRows.length} item(s)` : ""}`}
        confirmLoading={importing}
        destroyOnHidden
      >
        <Text type="secondary">
          Upload a CSV file with <b>name</b> and <b>quantity</b> columns.{" "}
          <Button
            type="link"
            size="small"
            icon={<Download size={14} />}
            onClick={handleDownloadSample}
          >
            Download sample
          </Button>
        </Text>

        <Dragger
          accept=".csv"
          multiple={false}
          showUploadList={false}
          beforeUpload={handleFileRead}
          className="equipment-import-dragger"
        >
          <p className="ant-upload-drag-icon">
            <Inbox
              size={48}
              strokeWidth={1.5}
              className="equipment-import-dragger__icon"
            />
          </p>
          <p className="ant-upload-text">Click or drag a CSV file here</p>
        </Dragger>

        {parsedRows.length > 0 && (
          <div className="equipment-import-preview">
            <Text strong>{parsedRows.length} row(s) ready to import</Text>
            <ul className="equipment-import-preview__list">
              {parsedRows.map((row, index) => (
                <li key={index} className="equipment-import-preview__item">
                  {row.name} — {row.quantity} unit(s)
                </li>
              ))}
            </ul>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EquipmentPage;
