import dayjs from "@/lib/dayjs";
import { useEffect, useState } from "react";
import "./invoice.css";
import { useNavigate, useParams } from "react-router";
import { ChevronDown, GripVertical, Info } from "lucide-react";
import {
  message,
  Spin,
  Table,
  Input,
  InputNumber,
  Button,
  Select,
  Popconfirm,
  Checkbox,
  Tooltip,
} from "antd";
import { DatePicker } from "antd";
import { GetAllServiceNameByAdmin } from "../../services/Api/BookingApi";
import {
  GetInvoiceById,
  ReorderInvoiceItems,
  UpdateInvoice,
} from "../../services/Api/InvoiceApi";
import SignatureField from "../Customer/SignatureField";

// Converts "2:00 pm", "14:05", "2pm" etc into minutes-since-midnight.
// Returns null if it can't confidently parse the text.
const parseClockTimeToMinutes = (raw) => {
  const cleaned = raw
    .trim()
    .toLowerCase()
    .replace(/\s*:\s*/g, ":");
  const match = cleaned.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);

  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const meridiem = match[3];

  if (minutes > 59) return null;

  if (meridiem) {
    if (hours < 1 || hours > 12) return null;
    hours =
      meridiem === "am"
        ? hours === 12
          ? 0
          : hours
        : hours === 12
          ? 12
          : hours + 12;
  } else if (hours > 23) {
    return null;
  }

  return hours * 60 + minutes;
};

// Accepts "2:00 pm to 4:00 pm", "14:05 - 16:00", "2pm-4pm", or a plain
// number ("2"). Returns a decimal hour count, or null if unparseable.
const parseHourRangeToDecimal = (rawInput) => {
  if (!rawInput || typeof rawInput !== "string") return null;

  const normalized = rawInput
    .trim()
    .replace(/–|—/g, "-")
    .replace(/\bto\b/gi, "-");

  const parts = normalized
    .split("-")
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length !== 2) {
    const plain = parseFloat(rawInput);
    return Number.isFinite(plain) ? plain : null;
  }

  const startMinutes = parseClockTimeToMinutes(parts[0]);
  const endMinutes = parseClockTimeToMinutes(parts[1]);

  if (startMinutes === null || endMinutes === null) return null;

  let diff = endMinutes - startMinutes;
  if (diff <= 0) diff += 24 * 60; // handles overnight ranges like 10pm-2am

  return Math.round((diff / 60) * 100) / 100;
};

// Static option lists — plain arrays instead of <Select.Option> children,
// since antd v6 deprecates the children API in favor of `options`.
const FREQUENCY_OPTIONS = [
  { value: "One-Time", label: "One-Time" },
  { value: "Weekly", label: "Weekly" },
  { value: "Bi-Weekly", label: "Bi-Weekly" },
  { value: "Monthly", label: "Monthly" },
  { value: "Quarterly", label: "Quarterly" },
  { value: "Yearly", label: "Yearly" },
];

const CALCULATION_TYPE_OPTIONS = [
  { value: "na", label: "N/A" },
  { value: "sqft", label: "Sqft" },
  { value: "hour", label: "Hour" },
];

const IS_RECURRING_OPTIONS = [
  { value: false, label: "No" },
  { value: true, label: "Yes" },
];

const RECURRING_FREQUENCY_OPTIONS = [
  { value: "WEEKLY", label: "Weekly" },
  { value: "BIWEEKLY", label: "Bi-Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "YEARLY", label: "Yearly" },
];

const EditInvoice = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [services, setServices] = useState([]);
  const { id } = useParams();
  const [formData, setFormData] = useState({
    ref: "",
    reference_type: "",

    custom_ref_no: "",
    useCustomRef: false,

    is_recurring: false,
    recurring_frequency: "MONTHLY",
    recurring_end_date: null,
    recurring_max_occurrences: null,

    billing_date: null,
    service_start: null,
    service_end: null,

    serviceDates: null,
    dueDate: null,

    toCompany: "",
    address1: "",
    address2: "",
    event_name: "",

    items: [
      {
        description: "",
        frequency: "",
        quantity: 1,

        calculation_type: "sqft",
        sqft: "N/A",
        hour: "",
        hour_raw: "",

        unit_price: "",
        amount: "",
      },
    ],

    totalAmount: "",
    date: null,
  });

   // DRAFT | SAVED
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);
  // tracks which row is currently the drop target, purely for the
  // visual highlight — the reorder + API-persist logic is unchanged.
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const fetchInvoice = async () => {
    try {
      setIsLoading(true);

      const res = await GetInvoiceById(id);
      const inv = res.data.data.data;

      const [start, end] = (inv.service_dates || "").split(" - ");

      const items = (inv.service_invoice_item || []).map((i) => ({
        id: i.id,
        description: i.description,
        frequency: i.frequency,
        quantity: i.quantity,

        calculation_type: i.calculation_type || "na",

        sqft: i.sqft ?? "N/A",
        hour: i.hour ?? "",
        // Pre-fill the visible box with the stored decimal hour value so
        // existing invoices still show something sensible on load. Admin
        // can overwrite it with a time range like "2:00 PM - 4:00 PM".
        hour_raw: i.hour !== null && i.hour !== undefined ? String(i.hour) : "",

        unit_price: i.unit_price,
        amount: i.amount,
      }));

      // derive recurring state from the nested `recurring` object
      const recurring = inv.recurring;
      const isRecurringActive = !!recurring && recurring.status !== "CANCELLED";

      setFormData((prev) => ({
        ...prev,
        ref: inv.ref_no,
        reference_type: inv.ref_type,

        custom_ref_no: inv.custom_ref_no || "",
        useCustomRef: !!inv.custom_ref_no,

        is_recurring: isRecurringActive,
        recurring_frequency: recurring?.frequency || "MONTHLY",
        recurring_end_date: recurring?.end_date
          ? dayjs(recurring.end_date, "YYYY-MM-DD")
          : null,
        recurring_max_occurrences: recurring?.max_occurrences ?? null,

        billing_date: inv.billing_date
          ? dayjs(inv.billing_date, "YYYY-MM-DD")
          : null,
        service_start: start ? dayjs(start) : null,
        service_end: end ? dayjs(end) : null,
        dueDate: inv.due_date ? dayjs(inv.due_date, "YYYY-MM-DD") : null,

        date: inv.date ? dayjs(inv.date, "YYYY-MM-DD") : null,

        toCompany: inv.to_company_name,
        address1: inv.address_1,
        address2: inv.address_2,
        event_name: inv.event_name || "",

        items,
        totalAmount: inv.total_due,

        user_id: inv.user_id, // ✅ locked
        signature: inv.signature,
      }));
    } catch {
      message.error("Failed to load invoice");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    GetAllServiceNameByAdmin().then((res) => setServices(res.data.data || []));

    fetchInvoice(); // ✅ THIS WAS MISSING
  }, []);

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index][field] = value;

    setFormData({
      ...formData,
      items: updatedItems,
    });
  };

  const handleDragStart = (index) => {
    setDraggedItemIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (index !== dragOverIndex) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = async (dropIndex) => {
    if (draggedItemIndex === null || draggedItemIndex === dropIndex) {
      setDraggedItemIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updatedItems = [...formData.items];

    const draggedItem = updatedItems[draggedItemIndex];

    updatedItems.splice(draggedItemIndex, 1);
    updatedItems.splice(dropIndex, 0, draggedItem);

    // Update UI immediately
    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
    }));

    setDraggedItemIndex(null);
    setDragOverIndex(null);

    // Only existing invoice items have IDs.
    // New unsaved items do not have an ID yet.
    const reorderItems = updatedItems
      .filter((item) => item.id)
      .map((item) => ({
        id: item.id,
      }));

    // If there are no existing items, there is nothing to reorder in DB.
    if (reorderItems.length === 0) {
      return;
    }

    try {
      await ReorderInvoiceItems(id, reorderItems);

      message.success("Invoice item order updated");
    } catch (error) {
      message.error(
        error?.response?.data?.message || "Failed to update invoice item order",
      );

      // Reload from DB if reorder failed
      await fetchInvoice();
    }
  };

  // clears the drag visuals if a drag ends without a drop (e.g. Esc,
  // or dropped outside the table). Purely cosmetic — the reorder + API
  // call still only happens in handleDrop.
  const handleDragEnd = () => {
    setDraggedItemIndex(null);
    setDragOverIndex(null);
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          description: "",
          frequency: "",
          quantity: 1,

          calculation_type: "sqft",
          sqft: "N/A",
          hour: "",
          hour_raw: "",

          unit_price: "",
          amount: "",
        },
      ],
    });
  };

  const deleteItem = (index) => {
    if (formData.items.length === 1) {
      message.warning("At least one item is required");
      return;
    }

    const items = formData.items.filter((_, i) => i !== index);

    const total = items.reduce(
      (sum, item) => sum + (parseFloat(item.amount) || 0),
      0,
    );

    setFormData({
      ...formData,
      items,
      totalAmount: total.toFixed(6),
    });
  };

  const calculateTotal = () => {
    const updatedItems = formData.items.map((item) => {
      const unitPrice = parseFloat(item.unit_price) || 0;

      let multiplier;

      if (item.calculation_type === "hour") {
        multiplier = parseFloat(item.hour) || 1;
      } else if (item.calculation_type === "sqft") {
        multiplier =
          item.sqft === "N/A" || item.sqft === "" ? 1 : parseFloat(item.sqft);
      } else {
        multiplier = 1;
      }

      const quantity = parseFloat(item.quantity) || 1;

      const amount = quantity * multiplier * unitPrice;

      return {
        ...item,
        amount: amount.toFixed(6),
      };
    });

    const total = updatedItems.reduce((sum, item) => {
      return sum + (parseFloat(item.amount) || 0);
    }, 0);

    setFormData({
      ...formData,
      items: updatedItems,
      totalAmount: total.toFixed(6),
    });
  };

  const formatAmount = (value) => {
    if (value === null || value === undefined || value === "") return "";

    const number = Number(value);

    if (!Number.isFinite(number)) return "";

    return number.toFixed(6).replace(/\.?0+$/, "");
  };

  /* UPDATE */

  const handleSubmit = async () => {
    try {
      setIsLoading(true);

      const payload = {
        billing_date: formData.billing_date.format("YYYY-MM-DD"),
        date: formData.date.format("YYYY-MM-DD"),
        service_start: formData.service_start.format("YYYY-MM-DD"),
        service_end: formData.service_end.format("YYYY-MM-DD"),
        due_date: formData.dueDate.format("YYYY-MM-DD"),

        custom_ref_no:
          formData.useCustomRef && formData.custom_ref_no.trim() !== ""
            ? formData.custom_ref_no.trim()
            : null,

        // recurring fields — backend's updateInvoice reads these directly off `body`
        is_recurring: formData.is_recurring,
        recurring_frequency: formData.is_recurring
          ? formData.recurring_frequency
          : null,
        recurring_end_date:
          formData.is_recurring && formData.recurring_end_date
            ? formData.recurring_end_date.format("YYYY-MM-DD")
            : null,
        recurring_max_occurrences: formData.is_recurring
          ? formData.recurring_max_occurrences
          : null,

        to_company_name: formData.toCompany,
        address_1: formData.address1,
        address_2: formData.address2,
        event_name: formData.event_name?.trim() || null,

        items: formData.items.map((item) => ({
          id: item.id,

          description: item.description,
          frequency: item.frequency,

          quantity: Number(item.quantity || 1),

          calculation_type: item.calculation_type,

          sqft: item.calculation_type === "sqft" ? item.sqft : null,

          hour:
            item.calculation_type === "hour" ? Number(item.hour || 0) : null,

          unit_price: Number(item.unit_price || 0),

          amount: Number(item.amount || 0),
        })),
      };

      await UpdateInvoice(id, payload);

      message.success("Invoice updated successfully");

      setTimeout(() => navigate("/all-invoices"), 1000);
    } catch {
      message.error("Update failed");
    } finally {
      setIsLoading(false);
    }
  };

  const onDueDateChange = (date) => {
    setFormData((prev) => ({ ...prev, dueDate: date }));
  };

  const onQuoteDateChange = (date) => {
    setFormData((prev) => ({ ...prev, date }));
  };

  const columns = [
    // explicit drag handle column so the reorder affordance is visible
    // instead of relying on the whole row silently being draggable.
    {
      title: "",
      key: "drag_handle",
      width: 36,
      render: () => (
        <div
          title="Drag to reorder"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            color: "#a3a9b3",
            cursor: "grab",
          }}
        >
          <GripVertical size={16} />
        </div>
      ),
    },
    {
      title: "Description / Service",
      dataIndex: "description",
      key: "description",
      width: 300,
      render: (text, record, index) => (
        <div style={{ display: "flex", gap: 8, minWidth: 0 }}>
          <Select
            placeholder="Select service"
            style={{ flex: "1 1 55%", minWidth: 0 }}
            value={record.service_id || undefined}
            onChange={(value) => {
              const selectedService = services.find((s) => s.id === value);
              handleItemChange(index, "service_id", value);
              handleItemChange(
                index,
                "description",
                selectedService?.name || "",
              );
              handleItemChange(
                index,
                "unit_price",
                selectedService?.price || "",
              );
            }}
            allowClear
            options={services.map((s) => ({ value: s.id, label: s.name }))}
          />

          <Input
            placeholder="Or type description"
            style={{ flex: "1 1 45%", minWidth: 0 }}
            value={record.description}
            onChange={(e) =>
              handleItemChange(index, "description", e.target.value)
            }
            disabled={record.service_id} // prevent typing if service is selected
          />
        </div>
      ),
    },
    {
      title: (
        <span>
          Frequency <span style={{ color: "red" }}>*</span>
        </span>
      ),
      dataIndex: "frequency",
      key: "frequency",
      width: 140,
      render: (text, record, index) => (
        <Select
          value={text || undefined}
          placeholder="Select Frequency"
          style={{ width: "100%" }}
          onChange={(value) => handleItemChange(index, "frequency", value)}
          allowClear
          options={FREQUENCY_OPTIONS}
        />
      ),
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      width: 90,
      render: (text, record, index) => (
        <InputNumber
          min={1}
          step={1}
          value={text !== "" ? Number(text) : undefined}
          onChange={(value) => handleItemChange(index, "quantity", value)}
          style={{ width: "100%" }}
          placeholder="Quantity"
        />
      ),
    },

    {
      title: "Type",
      dataIndex: "calculation_type",
      key: "calculation_type",
      width: 100,
      render: (text, record, index) => (
        <Select
          value={record.calculation_type || "sqft"}
          style={{ width: "100%" }}
          onChange={(value) => {
            handleItemChange(index, "calculation_type", value);

            if (value === "sqft") {
              handleItemChange(index, "sqft", "");
              handleItemChange(index, "hour", "");
            }

            if (value === "hour") {
              handleItemChange(index, "hour", "");
              handleItemChange(index, "hour_raw", "");
              handleItemChange(index, "sqft", "N/A");
            }

            if (value === "na") {
              handleItemChange(index, "sqft", "N/A");
              handleItemChange(index, "hour", "");
            }
          }}
          options={CALCULATION_TYPE_OPTIONS}
        />
      ),
    },

    {
      title: (
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          Sqft / Hour
          <Tooltip title='For Hour type, enter a time range like "2:00 PM - 4:00 PM" or "14:00 - 16:00" — we calculate the total hours for you.'>
            <Info size={14} color="#888" style={{ cursor: "help" }} />
          </Tooltip>
        </span>
      ),
      key: "measurement",
      width: 190,
      render: (_, record, index) => {
        if (record.calculation_type === "na") {
          return <Input value="N/A" disabled />;
        }

        if (record.calculation_type === "hour") {
          return (
            <div>
              <Input
                value={record.hour_raw ?? ""}
                placeholder="e.g. 2:00 PM - 4:00 PM"
                style={{ width: "100%", minWidth: 170 }}
                onChange={(e) =>
                  handleItemChange(index, "hour_raw", e.target.value)
                }
                onBlur={(e) => {
                  const parsed = parseHourRangeToDecimal(e.target.value);

                  if (parsed === null) {
                    if (e.target.value.trim() !== "") {
                      message.warning(
                        'Could not read that time. Try a format like "2:00 PM - 4:00 PM" or "14:00 - 16:00".',
                      );
                    }
                    return;
                  }

                  handleItemChange(index, "hour", parsed);
                }}
              />
              {record.hour !== "" && record.hour !== undefined && (
                <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
                  = {record.hour} hrs
                </div>
              )}
            </div>
          );
        }

        return (
          <Input
            value={record.sqft === "N/A" ? "" : record.sqft}
            placeholder="Sqft"
            onChange={(e) => {
              const val = e.target.value;

              if (val === "" || /^\d*$/.test(val)) {
                handleItemChange(index, "sqft", val === "" ? "N/A" : val);
              }
            }}
          />
        );
      },
    },

    {
      title: "Unit Price",
      dataIndex: "unit_price",
      key: "unit_price",
      width: 130,
      render: (text, record, index) => (
        <InputNumber
          min={0}
          value={text !== "" ? Number(text) : ""}
          onChange={(value) => handleItemChange(index, "unit_price", value)}
          style={{ width: "100%" }}
          placeholder="Unit Price"
          precision={6}
          formatter={(value) => `$ ${value}`}
          parser={(value) => value.replace(/[^\d.]/g, "")}
        />
      ),
    },
    {
      title: "Amount ($)",
      dataIndex: "amount",
      key: "amount",
      width: 120,
      render: (text) => <Input value={formatAmount(text)} disabled readOnly />,
    },
    {
      title: "Action",
      key: "action",
      width: 90,
      render: (_, __, index) => (
        <Popconfirm
          title="Delete this item?"
          onConfirm={() => deleteItem(index)}
        >
          <Button danger size="small">
            Delete
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <Spin spinning={isLoading}>
      <div className="invoice-form-container">
        <div className="invoice-form">
          <div className="header">
            <img
              src="https://socialsanitation.com/wp-content/uploads/2022/12/New-Logo.jpg"
              alt="Logo"
              className="logo1"
            />
            <div className="quote-title">INVOICE</div>
          </div>
        </div>

        <div className="invoice-meta-container">
          {/* ROW 1 — REF TYPE + REF NO */}
          <div className="meta-table" style={{ gap: 20, marginBottom: 20 }}>
            <div>
              <strong>REF TYPE :</strong>
              <Input
                style={{ marginTop: 5 }}
                value={formData.reference_type || undefined}
                disabled
              />
            </div>

            <div>
              <strong>REF #:</strong>
              <Input style={{ marginTop: 5 }} value={formData.ref} disabled />

              {/* custom ref toggle */}
              <div style={{ marginTop: 8 }}>
                <Checkbox
                  checked={formData.useCustomRef}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      useCustomRef: e.target.checked,
                      custom_ref_no: e.target.checked ? prev.custom_ref_no : "",
                    }));
                  }}
                >
                  Use custom reference number
                </Checkbox>

                {formData.useCustomRef && (
                  <Input
                    style={{ marginTop: 8 }}
                    placeholder="e.g. RHK100"
                    value={formData.custom_ref_no}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        custom_ref_no: e.target.value,
                      }));
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* ROW 2 — ALL DATES */}

          <div className="meta-table" style={{ gap: 20, marginBottom: 20 }}>
            <div>
              <strong>
                BILLING DATE<span style={{ color: "red" }}>*</span>
              </strong>
              <DatePicker
                value={formData.billing_date}
                onChange={(d) =>
                  setFormData((prev) => ({ ...prev, billing_date: d }))
                }
                format="MM-DD-YYYY"
                style={{ width: "100%", marginTop: 5 }}
              />
            </div>

            <div>
              <strong>
                SERVICE START<span style={{ color: "red" }}>*</span>
              </strong>
              <DatePicker
                value={formData.service_start}
                onChange={(d) =>
                  setFormData((prev) => ({ ...prev, service_start: d }))
                }
                format="MM-DD-YYYY"
                style={{ width: "100%", marginTop: 5 }}
              />
            </div>

            <div>
              <strong>
                SERVICE END<span style={{ color: "red" }}>*</span>
              </strong>
              <DatePicker
                value={formData.service_end}
                onChange={(d) =>
                  setFormData((prev) => ({ ...prev, service_end: d }))
                }
                format="MM-DD-YYYY"
                style={{ width: "100%", marginTop: 5 }}
              />
            </div>

            <div>
              <strong>
                DUE DATE <span style={{ color: "red" }}>*</span>
              </strong>
              <DatePicker
                format="MM-DD-YYYY"
                value={formData.dueDate}
                onChange={onDueDateChange}
                style={{ width: "100%", marginTop: 5 }}
              />
            </div>
          </div>

          {/* ROW 3 — RECURRING */}
          <div className="meta-table" style={{ gap: 20, marginBottom: 20 }}>
            <div>
              <strong>IS RECURRING INVOICE?</strong>
              <Select
                value={formData.is_recurring}
                style={{ width: "100%", marginTop: 5 }}
                suffixIcon={<ChevronDown size={16} color="#2c3345" />}
                onChange={(value) => {
                  setFormData((prev) => ({ ...prev, is_recurring: value }));
                }}
                options={IS_RECURRING_OPTIONS}
              />
            </div>

            <div
              style={{
                visibility: formData.is_recurring ? "visible" : "hidden",
              }}
            >
              <strong>RECURRING FREQUENCY</strong>
              <Select
                value={formData.recurring_frequency}
                style={{ width: "100%", marginTop: 5 }}
                suffixIcon={<ChevronDown size={16} color="#2c3345" />}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    recurring_frequency: value,
                  }))
                }
                options={RECURRING_FREQUENCY_OPTIONS}
              />
            </div>

            <div
              style={{
                visibility: formData.is_recurring ? "visible" : "hidden",
              }}
            >
              <strong>RECURRING END DATE</strong>
              <DatePicker
                value={formData.recurring_end_date}
                onChange={(d) =>
                  setFormData((prev) => ({ ...prev, recurring_end_date: d }))
                }
                format="MM-DD-YYYY"
                style={{ width: "100%", marginTop: 5 }}
              />
              <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
                Max 6 months from billing date
              </div>
            </div>

            <div
              style={{
                visibility: formData.is_recurring ? "visible" : "hidden",
              }}
            >
              <strong>MAX OCCURRENCES (optional)</strong>
              <InputNumber
                min={1}
                max={10}
                value={formData.recurring_max_occurrences}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    recurring_max_occurrences: value,
                  }))
                }
                style={{ width: "100%", marginTop: 5 }}
                placeholder="Leave blank for unlimited"
              />
              <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
                Max 10 occurrences
              </div>
            </div>
          </div>
        </div>

        <div
          className="address-table"
          style={{ gap: 24, marginBottom: 24, alignItems: "start" }}
        >
          <div>
            <strong>FROM:</strong>
            <br />
            SOCIAL SANITATION COMMERCIAL CLEANING SOLUTIONS
            <br />
            5201 N 44TH ST
            <br />
            Tampa FL 33610
          </div>
          <div>
            <strong>
              CLIENT <span style={{ color: "red" }}>*</span>
            </strong>

            <Input
              style={{ marginTop: 5 }}
              value={formData.toCompany}
              disabled
            />
          </div>
          <div>
            <strong>
              TO: <span style={{ color: "red" }}>*</span>
            </strong>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                marginTop: 5,
              }}
            >
              <Input
                placeholder="Company Name"
                value={formData.toCompany}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    toCompany: e.target.value,
                  }))
                }
              />

              <Input
                placeholder="Address 1"
                value={formData.address1}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    address1: e.target.value,
                  }))
                }
              />

              <Input
                placeholder="Address 2"
                value={formData.address2}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    address2: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <div>
            <strong>TOTAL DUE:</strong>
            <Input
              style={{ marginTop: 5 }}
              disabled
              value={formatAmount(formData.totalAmount)}
              readOnly
            />
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <strong>EVENT NAME</strong>

          <Input
            style={{ width: "100%", marginTop: 5 }}
            placeholder="Enter event name (optional)"
            value={formData.event_name}
            onChange={(e) => {

              setFormData((prev) => ({
                ...prev,
                event_name: e.target.value,
              }));
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 12, color: "#888" }}>
            Drag <GripVertical size={12} style={{ verticalAlign: "middle" }} />{" "}
            to reorder items
          </span>
        </div>

        <div
          style={{
            overflowX: "auto",
            border: "1px solid #eef0f2",
            borderRadius: 8,
          }}
        >
          <Table
            size="small"
            tableLayout="fixed"
            scroll={{ x: 1200 }}
            dataSource={formData.items.map((item, idx) => ({
              ...item,
              key: item.id || `new-${idx}`,
            }))}
            columns={columns}
            pagination={false}
            onRow={(_, index) => ({
              draggable: true,

              onDragStart: () => handleDragStart(index),

              onDragOver: (e) => handleDragOver(e, index),

              onDrop: () => handleDrop(index),

              onDragEnd: handleDragEnd,

              style: {
                cursor: "grab",
                opacity: draggedItemIndex === index ? 0.5 : 1,
                backgroundColor:
                  dragOverIndex === index && draggedItemIndex !== index
                    ? "#f0f7ff"
                    : undefined,
                transition: "background-color 0.15s ease, opacity 0.15s ease",
              },
            })}
            footer={() => (
              <div style={{ textAlign: "right", fontWeight: "bold" }}>
                Total: ${formatAmount(formData.totalAmount)}
              </div>
            )}
          />
        </div>

        <div style={{ marginTop: 16, marginBottom: 16 }}>
          <Button onClick={addItem} style={{ marginRight: 8 }}>
            + Add Item
          </Button>
          <Button type="primary" onClick={calculateTotal}>
            Calculate Total
          </Button>
        </div>

        <div className="footer-section" style={{ marginBottom: 24 }}>
          <div style={{ marginTop: "40px" }}>
            Date <span style={{ color: "red" }}>*</span>:{" "}
            <DatePicker
              format="MM-DD-YYYY"
              value={formData.date}
              onChange={onQuoteDateChange}
              style={{ width: "100%" }}
              placeholder="Date"
            />
          </div>
          <div className="signature-block" style={{ marginTop: 16 }}>
            <SignatureField formData={formData} setFormData={setFormData} />
          </div>
        </div>

        <div
          className="disclaimer"
          style={{
            marginTop: "60px", // ✅ increased from 0 to 60 for better spacing
            textAlign: "justify",
          }}
        >
          Invoices are sent on the last business day of each month and are to be
          paid within 5 business days of due date. All late payments are subject
          to late fees of $30, every 5-business day period after the service
          month. If needed, the pay options above can change but it is necessary
          to change payment arrangements 5 business days before the end of the
          current service month if check or ACH. Payments made via credit or
          debit card can be made at any time. All late fees will be added to the
          invoice of the following service month, to fully satisfy the invoice
          for the previous service month.
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={isLoading}
          >
            Send PDF via Email
          </Button>
        </div>
      </div>
    </Spin>
  );
};

export default EditInvoice;
