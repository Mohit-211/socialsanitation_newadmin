import React, { useEffect, useState } from "react";
import dayjs from "@/lib/dayjs";
import {
  Table,
  Button,
  Modal,
  Form,
  Select,
  InputNumber,
  DatePicker,
  Input,
  Tag,
  Row,
  Col,
  Card,
  message,
  Space,
  Typography,
  Alert,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  DownloadOutlined,
  AppstoreOutlined,
  DatabaseOutlined,
  CheckCircleOutlined,
  SwapOutlined,
  RollbackOutlined,
  WarningOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import "./AssignmentPage.scss";
import {
  AssignEquipment,
  GetAllAssignments,
  GetAllEquipments,
  GetAssignmentOverview,
  GetEmployeeDropdown,
  UpdateAssignment,
} from "../../../services/Api/equipmentApi";

const { Title, Text } = Typography;
const { Option } = Select;

const ROLE_LABELS = {
  7: "INSPECTOR/SUPERVISOR",
  8: "QUALITY ASSURANCE TECHNICIAN",
  9: "CLEANER",
};

const STATUS_COLORS = {
  ASSIGNED: "blue",
  PARTIALLY_RETURNED: "orange",
  RETURNED: "green",
  OVERDUE: "red",
};

// NOTE: "assigned_stock" and "returned_stock" from the overview API are not
// a matched pair — assigned_stock is units currently out (pending, not yet
// returned) while returned_stock is a cumulative all-time count. Showing
// them side by side as plain "Assigned" / "Returned" reads like assigned
// should be >= returned, which isn't true. Labels + tooltips below make the
// distinction explicit instead of changing what the numbers mean.
const OVERVIEW_CARDS = [
  {
    key: "total_equipment_types",
    label: "Equipment Types",
    icon: <AppstoreOutlined />,
  },
  { key: "total_stock", label: "Total Stock", icon: <DatabaseOutlined /> },
  { key: "available_stock", label: "Available", icon: <CheckCircleOutlined /> },
  {
    key: "assigned_stock",
    label: "Pending Return",
    icon: <SwapOutlined />,
    tooltip: "Units currently out with employees, not yet returned.",
  },
  {
    key: "returned_stock",
    label: "Returned (All-Time)",
    icon: <RollbackOutlined />,
    tooltip: "Total units returned across every assignment, past and present.",
  },
  {
    key: "overdue_assignments",
    label: "Overdue",
    icon: <WarningOutlined />,
    danger: true,
  },
];

const AssignmentPage = () => {
  const [assignments, setAssignments] = useState([]);
  const [overview, setOverview] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(false);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);

  const [assignForm] = Form.useForm();
  const [updateForm] = Form.useForm();

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await GetAllAssignments(1, 100);
      setAssignments(res?.data?.data?.assignments || []);
    } catch (err) {
      message.error("Failed to fetch assignments.");
    } finally {
      setLoading(false);
    }
  };

  const fetchOverview = async () => {
    try {
      const res = await GetAssignmentOverview();
      setOverview(res?.data?.data || null);
    } catch (err) {
      message.error("Failed to fetch overview.");
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await GetEmployeeDropdown();
      setEmployees(res?.data?.data || []);
    } catch (err) {
      message.error("Failed to fetch employees.");
    }
  };

  const fetchEquipments = async () => {
    try {
      const res = await GetAllEquipments(1, 100);
      setEquipments(res?.data?.data?.equipments || []);
    } catch (err) {
      message.error("Failed to fetch equipments.");
    }
  };

  useEffect(() => {
    fetchAssignments();
    fetchOverview();
    fetchEmployees();
    fetchEquipments();
  }, []);

  const openAssignModal = () => {
    assignForm.resetFields();
    setSelectedEquipment(null);
    setIsAssignModalOpen(true);
  };

  const closeAssignModal = () => {
    setIsAssignModalOpen(false);
    setSelectedEquipment(null);
    assignForm.resetFields();
  };

  const openUpdateModal = (record) => {
    setEditingRecord(record);
    updateForm.setFieldsValue({
      returned_quantity: record.returned_quantity,
      remarks: record.remarks,
    });
    setIsUpdateModalOpen(true);
  };

  const closeUpdateModal = () => {
    setIsUpdateModalOpen(false);
    setEditingRecord(null);
    updateForm.resetFields();
  };

  const handleEquipmentChange = (equipmentId) => {
    const eq = equipments.find((item) => item.id === equipmentId);
    setSelectedEquipment(eq || null);
    // re-validate quantity field against the newly selected equipment's stock
    assignForm.validateFields(["assigned_quantity"]).catch(() => {});
  };

  const handleAssignSubmit = async () => {
    try {
      const values = await assignForm.validateFields();
      const payload = {
        employee_id: values.employee_id,
        equipment_id: values.equipment_id,
        assigned_quantity: values.assigned_quantity,
        expected_return_date: values.expected_return_date.format("YYYY-MM-DD"),
      };

      setSubmitting(true);
      await AssignEquipment(payload);
      message.success("Equipment assigned successfully.");
      closeAssignModal();
      fetchAssignments();
      fetchOverview();
      fetchEquipments();
    } catch (err) {
      if (err?.errorFields) return;
      message.error("Failed to assign equipment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSubmit = async () => {
    try {
      const values = await updateForm.validateFields();
      const payload = {
        returned_quantity: values.returned_quantity,
        remarks: values.remarks,
      };

      setSubmitting(true);
      await UpdateAssignment(editingRecord.id, payload);
      message.success("Assignment updated successfully.");
      closeUpdateModal();
      fetchAssignments();
      fetchOverview();
    } catch (err) {
      if (err?.errorFields) return;
      message.error("Failed to update assignment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    if (!assignments.length) {
      message.info("No assignments to export.");
      return;
    }

    const headers = [
      "Employee",
      "Equipment",
      "Assigned Qty",
      "Returned Qty",
      "Pending Qty",
      "Assigned Date",
      "Expected Return Date",
      "Actual Return Date",
      "Status",
      "Remarks",
    ];

    const rows = assignments.map((item) => [
      item.employee?.name || "",
      item.equipment?.name || "",
      item.assigned_quantity,
      item.returned_quantity,
      item.pending_quantity,
      item.assigned_date ? dayjs(item.assigned_date).format("YYYY-MM-DD") : "",
      item.expected_return_date
        ? dayjs(item.expected_return_date).format("YYYY-MM-DD")
        : "",
      item.actual_return_date
        ? dayjs(item.actual_return_date).format("YYYY-MM-DD")
        : "",
      item.status,
      item.remarks || "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `equipment-assignments-${dayjs().format("YYYY-MM-DD")}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const columns = [
    {
      title: "Employee",
      key: "employee",
      width: 150,
      render: (_, record) => <Text ellipsis>{record.employee?.name}</Text>,
    },
    {
      title: "Equipment",
      key: "equipment",
      width: 150,
      render: (_, record) => <Text ellipsis>{record.equipment?.name}</Text>,
    },
    {
      title: "Quantity",
      key: "quantity",
      width: 160,
      render: (_, record) => (
        <div className="qty-cell">
          <span>
            Assigned <b>{record.assigned_quantity}</b>
          </span>
          <span>
            Returned <b>{record.returned_quantity}</b>
          </span>
          <span>
            Pending <b>{record.pending_quantity}</b>
          </span>
        </div>
      ),
    },
    {
      title: "Dates",
      key: "dates",
      width: 190,
      render: (_, record) => (
        <div className="date-cell">
          <span>
            Out:{" "}
            {record.assigned_date
              ? dayjs(record.assigned_date).format("DD MMM YY")
              : "-"}
          </span>
          <span>
            Due:{" "}
            {record.expected_return_date
              ? dayjs(record.expected_return_date).format("DD MMM YY")
              : "-"}
          </span>
          {record.actual_return_date && (
            <span>
              Returned: {dayjs(record.actual_return_date).format("DD MMM YY")}
            </span>
          )}
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 160,
      render: (status) => (
        <div className="status-cell">
          <Tag color={STATUS_COLORS[status] || "default"}>
            {status?.replace("_", " ")}
          </Tag>
        </div>
      ),
    },
    {
      title: "Remarks",
      dataIndex: "remarks",
      key: "remarks",
      render: (remarks) =>
        remarks ? (
          <Text className="remarks-cell" ellipsis={{ tooltip: remarks }}>
            {remarks}
          </Text>
        ) : (
          "-"
        ),
    },
    {
      title: "",
      key: "action",
      width: 90,
      render: (_, record) => (
        <Button size="small" onClick={() => openUpdateModal(record)}>
          Update
        </Button>
      ),
    },
  ];

  return (
    <div className="assignment-page">
      <div className="assignment-page__header">
        <div>
          <Title level={3} className="assignment-page__heading">
            Equipment Assignments
          </Title>
          <Text type="secondary" className="assignment-page__subheading">
            Track who has what equipment, expected returns, and current stock
            levels.
          </Text>
        </div>
        <Space>
          <Button icon={<DownloadOutlined />} onClick={handleExportCSV}>
            Export CSV
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openAssignModal}
          >
            Assign Equipment
          </Button>
        </Space>
      </div>

      {overview && (
        <Row gutter={12} className="assignment-page__overview">
          {OVERVIEW_CARDS.map((card) => (
            <Col span={4} key={card.key}>
              <Card
                size="small"
                className={
                  card.danger && overview[card.key] > 0
                    ? "overview-card danger"
                    : "overview-card"
                }
              >
                <div className="overview-card__icon">{card.icon}</div>
                <div className="overview-card__value">{overview[card.key]}</div>
                <div className="overview-card__label">
                  {card.label}
                  {card.tooltip && (
                    <Tooltip title={card.tooltip}>
                      <InfoCircleOutlined className="overview-card__info" />
                    </Tooltip>
                  )}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Table
        rowKey="id"
        columns={columns}
        dataSource={assignments}
        loading={loading}
        size="small"
        pagination={false}
        tableLayout="fixed"
      />

      <Modal
        title="Assign Equipment"
        open={isAssignModalOpen}
        onOk={handleAssignSubmit}
        onCancel={closeAssignModal}
        confirmLoading={submitting}
        okText="Assign"
        destroyOnClose
      >
        <Form form={assignForm} layout="vertical">
          <Form.Item
            label="Employee"
            name="employee_id"
            rules={[{ required: true, message: "Please select an employee" }]}
          >
            <Select
              showSearch
              placeholder="Select employee"
              optionFilterProp="label"
            >
              {employees.map((emp) => (
                <Option
                  key={emp.id}
                  value={emp.id}
                  label={`${emp.name} ${ROLE_LABELS[emp.role_id] || ""}`}
                >
                  {emp.name} ({ROLE_LABELS[emp.role_id] || "N/A"})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Equipment"
            name="equipment_id"
            rules={[{ required: true, message: "Please select equipment" }]}
          >
            <Select
              showSearch
              placeholder="Select equipment"
              optionFilterProp="label"
              onChange={handleEquipmentChange}
            >
              {equipments.map((eq) => (
                <Option
                  key={eq.id}
                  value={eq.id}
                  label={eq.name}
                  disabled={eq.quantity <= 0}
                >
                  {eq.name} — {eq.quantity} available
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Assigned Quantity"
            name="assigned_quantity"
            extra={
              selectedEquipment
                ? `${selectedEquipment.quantity} unit(s) currently in stock`
                : "Select equipment to see available stock"
            }
            rules={[
              { required: true, message: "Please enter assigned quantity" },
              {
                validator: (_, value) => {
                  if (!selectedEquipment || value == null)
                    return Promise.resolve();
                  if (value > selectedEquipment.quantity) {
                    return Promise.reject(
                      new Error(
                        `Only ${selectedEquipment.quantity} unit(s) available in stock`,
                      ),
                    );
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <InputNumber
              min={1}
              max={selectedEquipment ? selectedEquipment.quantity : undefined}
              style={{ width: "100%" }}
              placeholder="Enter quantity"
            />
          </Form.Item>

          {selectedEquipment && selectedEquipment.quantity <= 0 && (
            <Alert
              type="warning"
              showIcon
              message="This equipment currently has no available stock."
              style={{ marginBottom: 16 }}
            />
          )}

          <Form.Item
            label="Expected Return Date"
            name="expected_return_date"
            rules={[
              { required: true, message: "Please select expected return date" },
            ]}
          >
            <DatePicker
              style={{ width: "100%" }}
              format="YYYY-MM-DD"
              disabledDate={(current) =>
                current && current < dayjs().startOf("day")
              }
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Update Assignment"
        open={isUpdateModalOpen}
        onOk={handleUpdateSubmit}
        onCancel={closeUpdateModal}
        confirmLoading={submitting}
        okText="Save"
        destroyOnClose
      >
        {editingRecord && (
          <div className="update-modal-summary">
            <div>
              <Text type="secondary">Employee</Text>
              <div>{editingRecord.employee?.name}</div>
            </div>
            <div>
              <Text type="secondary">Equipment</Text>
              <div>{editingRecord.equipment?.name}</div>
            </div>
            <div>
              <Text type="secondary">Assigned Qty</Text>
              <div>{editingRecord.assigned_quantity}</div>
            </div>
          </div>
        )}

        <Form form={updateForm} layout="vertical">
          <Form.Item
            label="Returned Quantity"
            name="returned_quantity"
            extra={`Cannot exceed the assigned quantity (${editingRecord?.assigned_quantity ?? 0})`}
            rules={[
              { required: true, message: "Please enter returned quantity" },
              {
                validator: (_, value) => {
                  if (value == null || !editingRecord) return Promise.resolve();
                  if (value > editingRecord.assigned_quantity) {
                    return Promise.reject(
                      new Error(
                        `Cannot return more than ${editingRecord.assigned_quantity} unit(s)`,
                      ),
                    );
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <InputNumber
              min={0}
              max={editingRecord?.assigned_quantity}
              style={{ width: "100%" }}
              placeholder="Enter returned quantity"
            />
          </Form.Item>

          <Form.Item label="Remarks" name="remarks">
            <Input.TextArea
              rows={3}
              placeholder="Add a note about this return, if any"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AssignmentPage;
