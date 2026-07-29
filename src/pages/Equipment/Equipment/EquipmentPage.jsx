import React, { useEffect, useState } from "react";
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
  List,
} from "antd";
import {
  InboxOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import MuiButton from "@mui/material/Button";
import { Search, Upload as UploadIcon, Plus } from "lucide-react";
import "./EquipmentPage.scss";
import {
  GetAllEquipments,
  CreateEquipment,
  UpdateEquipment,
  DeleteEquipment,
} from "../../../services/Api/equipmentApi";

const { Text } = AntTypography;
const { Dragger } = Upload;

// Parses a simple CSV string with a header row into an array of
// { name, quantity } objects. Expects headers: name,quantity
const parseEquipmentCSV = (csvText) => {
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
  const [equipments, setEquipments] = useState([]);
  const [filteredEquipments, setFilteredEquipments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [parsedRows, setParsedRows] = useState([]);
  const [importing, setImporting] = useState(false);

  const [form] = Form.useForm();

  const fetchEquipments = async () => {
    setLoading(true);
    try {
      const res = await GetAllEquipments();
      const list = res?.data?.data?.equipments || [];
      setEquipments(list);
      setFilteredEquipments(list);
    } catch (err) {
      message.error("Failed to fetch equipments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipments();
  }, []);

  const handleSearch = (value) => {
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

  const openEditModal = (record) => {
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
        await UpdateEquipment(editingRecord.id, payload);
        message.success("Equipment updated successfully.");
      } else {
        await CreateEquipment(payload);
        message.success("Equipment created successfully.");
      }

      setIsModalOpen(false);
      form.resetFields();
      setEditingRecord(null);
      fetchEquipments();
    } catch (err) {
      if (err?.errorFields) return; // validation error, do nothing extra
      message.error(
        editingRecord
          ? "Failed to update equipment."
          : "Failed to create equipment.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await DeleteEquipment(id);
      message.success("Equipment deleted successfully.");
      fetchEquipments();
    } catch (err) {
      message.error("Failed to delete equipment.");
    }
  };

  // ---------- Import (CSV) ----------

  const openImportModal = () => {
    setParsedRows([]);
    setIsImportModalOpen(true);
  };

  const closeImportModal = () => {
    setIsImportModalOpen(false);
    setParsedRows([]);
  };

  const handleFileRead = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const rows = parseEquipmentCSV(e.target.result);
        if (!rows.length) {
          message.error("No valid rows found in this file.");
          return;
        }
        setParsedRows(rows);
      } catch (err) {
        message.error(err.message || "Could not read this CSV file.");
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
        await CreateEquipment({ name: row.name, quantity: row.quantity });
        successCount += 1;
      } catch (err) {
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

  const columns = [
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
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" onClick={() => openEditModal(record)}>
            Edit
          </Button>
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
        </Space>
      ),
    },
  ];

  return (
    <div className="equipment-page">
      {/* ── Standard shared header ── */}
      <Paper
        variant="outlined"
        sx={{
          p: 2.5,
          mb: 2.5,
          borderRadius: "10px",
          borderColor: "#eef0f2",
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: { xs: "wrap", md: "nowrap" },
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography className="page-title" noWrap>
              EQUIPMENT
            </Typography>
            <Typography
              className="page-sub-title"
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              Manage the equipment your team can be assigned.
            </Typography>
          </Box>

          <Stack
            direction="row"
            spacing={1.5}
            sx={{ alignItems: "center", flexShrink: 0 }}
          >
            <Input
              allowClear
              prefix={<Search size={18} color="#9CA3AF" />}
              placeholder="Search equipment by name"
              style={{ width: 220, height: 44 }}
              value={searchText}
              onChange={(e) => handleSearch(e.target.value)}
            />

            <MuiButton
              variant="outlined"
              startIcon={<UploadIcon size={17} />}
              onClick={openImportModal}
              sx={{
                height: 44,
                px: 2.5,
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              Import
            </MuiButton>

            <MuiButton
              variant="contained"
              disableElevation
              startIcon={<Plus size={18} />}
              onClick={openAddModal}
              sx={{
                height: 44,
                px: 2.5,
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              Add Equipment
            </MuiButton>
          </Stack>
        </Stack>
      </Paper>

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
        destroyOnClose
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
        destroyOnClose
      >
        <Text type="secondary">
          Upload a CSV file with <b>name</b> and <b>quantity</b> columns.{" "}
          <Button type="link" size="small" icon={<DownloadOutlined />} onClick={handleDownloadSample}>
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
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Click or drag a CSV file here</p>
        </Dragger>

        {parsedRows.length > 0 && (
          <div className="equipment-import-preview">
            <Text strong>{parsedRows.length} row(s) ready to import</Text>
            <List
              size="small"
              bordered
              dataSource={parsedRows}
              renderItem={(row, index) => (
                <List.Item key={index}>
                  {row.name} — {row.quantity} unit(s)
                </List.Item>
              )}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EquipmentPage;