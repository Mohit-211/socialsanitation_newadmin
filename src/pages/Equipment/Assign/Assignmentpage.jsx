import { useEffect, useState } from "react";
import dayjs from "@/lib/dayjs";
import {
  Table,
  Modal,
  Form,
  Select,
  InputNumber,
  DatePicker,
  Input,
  Row,
  Col,
  Card,
  message,
  Typography as AntTypography,
  Alert,
  Tooltip,
  Button,
  Space,
} from "antd";
import {
  Download,
  Plus,
  Pencil,
  History as HistoryIcon,
  LayoutGrid,
  Boxes,
  CheckCircle2,
  ArrowLeftRight,
  Undo2,
  TriangleAlert,
  Info,
  PackageCheck,
  RotateCcw,
  CircleCheck,
} from "lucide-react";
import "./AssignmentPage.scss";
import {
  AssignEquipment,
  GetAllAssignments,
  GetAllEquipments,
  GetAssignmentOverview,
  GetEmployeeDropdown,
  UpdateAssignment,
} from "../../../services/Api/equipmentApi";
import AssignmentHistoryModal from "./AssignmentHistory/AssignmentHistoryModal";
import PageHeader from "../../../components/PageHeader";
import IconAction from "../../../components/IconAction";
import { saveXlsx, excelStyles } from "../../../utils/excel";

const { Text } = AntTypography;
const { Option } = Select;

const ROLE_LABELS = {
  7: "INSPECTOR/SUPERVISOR",
  8: "QUALITY ASSURANCE TECHNICIAN",
  9: "CLEANER",
};

const STATUS_META = {
  ASSIGNED: {
    color: "var(--color-primary-strong)",
    bg: "var(--color-primary-soft)",
    icon: PackageCheck,
    label: "Assigned",
  },
  PARTIALLY_RETURNED: {
    color: "var(--color-warning-strong)",
    bg: "var(--color-warning-subtle)",
    icon: RotateCcw,
    label: "Partially Returned",
  },
  RETURNED: {
    color: "var(--color-success-strong)",
    bg: "var(--color-success-subtle)",
    icon: CircleCheck,
    label: "Returned",
  },
  OVERDUE: {
    color: "var(--color-error-strong)",
    bg: "var(--color-error-subtle)",
    icon: TriangleAlert,
    label: "Overdue",
  },
};

const getStatusMeta = (status) =>
  STATUS_META[status] || {
    color: "var(--color-text-secondary)",
    bg: "var(--color-bg-muted)",
    icon: PackageCheck,
    label: status || "—",
  };

const OVERVIEW_CARDS = [
  { key: "total_equipment_types", label: "Equipment Types", icon: LayoutGrid },
  { key: "total_stock", label: "Total Stock", icon: Boxes },
  { key: "available_stock", label: "Available", icon: CheckCircle2 },
  {
    key: "assigned_stock",
    label: "Pending Return",
    icon: ArrowLeftRight,
    tooltip: "Units currently out with employees, not yet returned.",
  },
  {
    key: "returned_stock",
    label: "Returned (All-Time)",
    icon: Undo2,
    tooltip: "Total units returned across every assignment, past and present.",
  },
  {
    key: "overdue_assignments",
    label: "Overdue",
    icon: TriangleAlert,
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

  // state
  const [historyModal, setHistoryModal] = useState({
    open: false,
    assignmentId: null,
    equipmentName: "",
  });

  const openHistoryModal = (assignmentId, equipmentName) => {
    setHistoryModal({ open: true, assignmentId, equipmentName });
  };

  const closeHistoryModal = () => {
    setHistoryModal({ open: false, assignmentId: null, equipmentName: "" });
  };

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await GetAllAssignments(1, 100);
      setAssignments(res?.data?.data?.assignments || []);
    } catch {
      message.error("Failed to fetch assignments.");
    } finally {
      setLoading(false);
    }
  };

  const fetchOverview = async () => {
    try {
      const res = await GetAssignmentOverview();
      setOverview(res?.data?.data || null);
    } catch {
      message.error("Failed to fetch overview.");
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await GetEmployeeDropdown();
      setEmployees(res?.data?.data || []);
    } catch {
      message.error("Failed to fetch employees.");
    }
  };

  const fetchEquipments = async () => {
    try {
      const res = await GetAllEquipments(1, 100);
      setEquipments(res?.data?.data?.equipments || []);
    } catch {
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
    assignForm.validateFields(["assigned_quantity"]).catch(() => {});
  };

  const handleAssignSubmit = async () => {
    try {
      const values = await assignForm.validateFields();
      const payload = {
        employee_id: values.employee_id,
        equipment_id: values.equipment_id,
        assigned_quantity: values.assigned_quantity,
        expected_return_date: values.expected_return_date.format("MM-DD-YYYY"),
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

  const handleExportCSV = async () => {
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
      item.assigned_date ? dayjs(item.assigned_date).format("MM-DD-YYYY") : "",
      item.expected_return_date
        ? dayjs(item.expected_return_date).format("MM-DD-YYYY")
        : "",
      item.actual_return_date
        ? dayjs(item.actual_return_date).format("MM-DD-YYYY")
        : "",
      item.status,
      item.remarks || "",
    ]);

    const styles = excelStyles();
    const remarksColIndex = 9; // 0-based: Employee=0 ... Remarks=9

    // Header row in the theme's header style, left-aligned as before.
    const headerRow = headers.map((title) => ({
      value: title,
      ...styles.header,
      align: "left",
    }));

    // Wrap text + top-align every Remarks cell, and give data rows enough
    // height (45pt) to show a few wrapped lines rather than clipping them.
    const dataRows = rows.map((row) =>
      row.map((value, col) =>
        col === remarksColIndex
          ? { value, wrap: true, alignVertical: "top", align: "left", height: 45 }
          : value,
      ),
    );

    await saveXlsx(
      [headerRow, ...dataRows],
      {
        sheet: "Assignments",
        // Fixed column widths — Remarks stays a set width; long text wraps
        // down inside the cell instead of overflowing into columns to the right.
        columns: [
          { width: 18 }, // Employee
          { width: 18 }, // Equipment
          { width: 12 }, // Assigned Qty
          { width: 12 }, // Returned Qty
          { width: 12 }, // Pending Qty
          { width: 14 }, // Assigned Date
          { width: 18 }, // Expected Return Date
          { width: 16 }, // Actual Return Date
          { width: 18 }, // Status
          { width: 45 }, // Remarks
        ],
      },
      `equipment-assignments-${dayjs().format("MM-DD-YYYY")}.xlsx`,
    );
  };

  const columns = [
    {
      title: "Employee",
      key: "employee",
      width: 150,
      render: (_, record) => (
        <Text ellipsis className="cell-strong">
          {record.employee?.name}
        </Text>
      ),
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
      width: 170,
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
      width: 150,
      render: (status) => {
        const meta = getStatusMeta(status);
        const Icon = meta.icon;
        return (
          <span
            className="status-badge"
            style={{ background: meta.bg, color: meta.color }}
          >
            <Icon size={12} strokeWidth={2.5} />
            {meta.label}
          </span>
        );
      },
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
          <span className="remarks-empty">—</span>
        ),
    },
    {
      title: "",
      key: "action",
      width: 130, // was 90 — too narrow for two 34px icon buttons + padding
      render: (_, record) => (
        <Space wrap>
          <IconAction
            icon={Pencil}
            title="Update Assignment"
            onClick={() => openUpdateModal(record)}
          />
          <IconAction
            icon={HistoryIcon}
            title="View History"
            onClick={() => openHistoryModal(record.id, record.equipment?.name)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="assignment-page">
      {/* ── Standard shared header ── */}
      <PageHeader
        title="EQUIPMENT ASSIGNMENTS"
        subtitle="Track who has what equipment, expected returns, and current stock levels."
        actions={
          <>
            <Button
              size="large"
              icon={<Download size={16} />}
              onClick={handleExportCSV}
            >
              Export CSV
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<Plus size={16} />}
              onClick={openAssignModal}
            >
              Assign Equipment
            </Button>
          </>
        }
      />
      {overview && (
        <Row gutter={12} className="assignment-page__overview">
          {OVERVIEW_CARDS.map((card) => {
            const Icon = card.icon;
            const isDanger = card.danger && overview[card.key] > 0;
            return (
              <Col xs={12} sm={8} md={4} key={card.key}>
                <Card
                  size="small"
                  className={
                    isDanger ? "overview-card danger" : "overview-card"
                  }
                >
                  <div className="overview-card__icon">
                    <Icon size={17} strokeWidth={2} />
                  </div>
                  <div className="overview-card__value">
                    {overview[card.key]}
                  </div>
                  <div className="overview-card__label">
                    {card.label}
                    {card.tooltip && (
                      <Tooltip title={card.tooltip}>
                        <Info size={11} className="overview-card__info" />
                      </Tooltip>
                    )}
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
      <div className="surface assignment-page__table-paper">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={assignments}
          loading={loading}
          size="small"
          pagination={false}
          tableLayout="fixed"
        />
      </div>
      <Modal
        title="Assign Equipment"
        open={isAssignModalOpen}
        onOk={handleAssignSubmit}
        onCancel={closeAssignModal}
        confirmLoading={submitting}
        okText="Assign"
        destroyOnHidden
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
              title="This equipment currently has no available stock."
              style={{ marginBottom: "var(--space-4)" }}
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
              format="MM-DD-YYYY"
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
        destroyOnHidden
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

      <AssignmentHistoryModal
        open={historyModal.open}
        onClose={closeHistoryModal}
        assignmentId={historyModal.assignmentId}
        equipmentName={historyModal.equipmentName}
      />
    </div>
  );
};

export default AssignmentPage;
