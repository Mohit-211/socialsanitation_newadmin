/** @format */

import dayjs from "@/lib/dayjs";
import React, { useEffect, useState } from "react";
import "./invoice.css";
import { useNavigate, useParams } from "react-router";
import {
  message,
  Spin,
  Table,
  Input,
  InputNumber,
  Button,
  Select,
  Popconfirm,
} from "antd";
import { DatePicker } from "antd";
import { GetAllServiceNameByAdmin } from "../../services/Api/BookingApi";
import { GetInvoiceById, UpdateInvoice } from "../../services/Api/InvoiceApi";
import SignatureField from "../Customer/SignatureField";

const { Option } = Select;

const EditInvoice = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [services, setServices] = useState([]);
  const { id } = useParams();
  const [formData, setFormData] = useState({
    ref: "",
    reference_type: "",

    billing_date: null,
    service_start: null,
    service_end: null,

    serviceDates: null,
    dueDate: null,

    toCompany: "",
    address1: "",
    address2: "",

    items: [
      {
        description: "",
        frequency: "",
        quantity: 1,

        calculation_type: "sqft",
        sqft: "N/A",
        hour: "",

        unit_price: "",
        amount: "",
      },
    ],

    totalAmount: "",
    date: null,
  });
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const [selectedDraftId, setSelectedDraftId] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [quoteStatus, setQuoteStatus] = useState("DRAFT"); // DRAFT | SAVED
  const [isRefManuallyEdited, setIsRefManuallyEdited] = useState(false);

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

        unit_price: i.unit_price,
        amount: i.amount,
      }));

      setFormData((prev) => ({
        ...prev,
        ref: inv.ref_no,
        reference_type: inv.ref_type,

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

        items,
        totalAmount: inv.total_due,

        user_id: inv.user_id, // ✅ locked
        signature: inv.signature,
      }));
    } catch (err) {
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
      totalAmount: total.toFixed(2),
    });
  };

  const calculateTotal = () => {
    const updatedItems = formData.items.map((item) => {
      const unitPrice = parseFloat(item.unit_price) || 0;

      let multiplier = 1;

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
        amount: amount.toFixed(2),
      };
    });

    const total = updatedItems.reduce((sum, item) => {
      return sum + (parseFloat(item.amount) || 0);
    }, 0);

    setFormData({
      ...formData,
      items: updatedItems,
      totalAmount: total.toFixed(2),
    });
  };

  /* ================= UPDATE ================= */

  const handleSubmit = async () => {
    try {
      setIsLoading(true);

      const payload = {
        billing_date: formData.billing_date.format("YYYY-MM-DD"),
        date: formData.date.format("YYYY-MM-DD"),
        service_start: formData.service_start.format("YYYY-MM-DD"),
        service_end: formData.service_end.format("YYYY-MM-DD"),
        due_date: formData.dueDate.format("YYYY-MM-DD"),

        to_company_name: formData.toCompany,
        address_1: formData.address1,
        address_2: formData.address2,

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
    } catch (error) {
      message.error("Update failed");
    } finally {
      setIsLoading(false);
    }
  };

  const onServiceDateChange = (date) => {
    setFormData((prev) => ({ ...prev, serviceDates: date }));
  };

  const onDueDateChange = (date) => {
    setFormData((prev) => ({ ...prev, dueDate: date }));
  };

  const onQuoteDateChange = (date) => {
    setFormData((prev) => ({ ...prev, date }));
  };

  const columns = [
    {
      title: "Description / Service",
      dataIndex: "description",
      key: "description",
      render: (text, record, index) => (
        <div style={{ display: "flex", gap: "8px" }}>
          <Select
            placeholder="Select service"
            style={{ width: "70%" }}
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
          >
            {services.map((s) => (
              <Option key={s.id} value={s.id}>
                {s.name}
              </Option>
            ))}
          </Select>

          <Input
            placeholder="Or type description"
            style={{ width: "50%" }}
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
      render: (text, record, index) => (
        <Select
          value={text || undefined}
          placeholder="Select Frequency"
          style={{ width: "100%" }}
          onChange={(value) => handleItemChange(index, "frequency", value)}
          allowClear
        >
          <Option value="One-Time">One-Time</Option>
          <Option value="Weekly">Weekly</Option>
          <Option value="Bi-Weekly">Bi-Weekly</Option>
          <Option value="Monthly">Monthly</Option>
          <Option value="Quarterly">Quarterly</Option>
          <Option value="Yearly">Yearly</Option>
        </Select>
      ),
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      render: (text, record, index) => (
        <InputNumber
          min={1}
          // precision={0}
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
              handleItemChange(index, "sqft", "N/A");
            }

            if (value === "na") {
              handleItemChange(index, "sqft", "N/A");
              handleItemChange(index, "hour", "");
            }
          }}
        >
          <Option value="na">N/A</Option>
          <Option value="sqft">Sqft</Option>
          <Option value="hour">Hour</Option>
        </Select>
      ),
    },

    {
      title: "Sqft / Hour",
      key: "measurement",
      render: (_, record, index) => {
        if (record.calculation_type === "na") {
          return <Input value="N/A" disabled />;
        }

        if (record.calculation_type === "hour") {
          return (
            <InputNumber
              min={1}
              value={record.hour || undefined}
              placeholder="Hours"
              style={{ width: "100%" }}
              onChange={(value) => handleItemChange(index, "hour", value)}
            />
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
      render: (text, record, index) => (
        <InputNumber
          min={0}
          value={text !== "" ? Number(text) : ""}
          onChange={(value) => handleItemChange(index, "unit_price", value)}
          style={{ width: "100%" }}
          placeholder="Unit Price"
          precision={2}
          formatter={(value) => `$ ${value}`}
          parser={(value) => value.replace(/[^\d.]/g, "")}
        />
      ),
    },
    {
      title: "Amount ($)",
      dataIndex: "amount",
      key: "amount",
      render: (text) => (
        <Input value={Number(text || 0).toFixed(2)} disabled readOnly />
      ),
    },
    {
      title: "Action",
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

          <div className="meta-table">
            <div>
              <strong>REF TYPE :</strong>

              <Input value={formData.reference_type || undefined} disabled />
            </div>

            <div style={{ marginTop: "25px" }}>
              <strong>REF #:</strong>

              <Input value={formData.ref} disabled />
            </div>
          </div>

          {/* ROW 2 — ALL DATES */}

          <div className="meta-table">
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
        </div>

        <div className="address-table" style={{ marginBottom: 24 }}>
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

            <Input value={formData.toCompany} disabled />
          </div>
          <div>
            <strong>
              TO: <span style={{ color: "red" }}>*</span>
            </strong>
            <br />

            <Input
              placeholder="Company Name"
              value={formData.toCompany}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, toCompany: e.target.value }))
              }
            />

            <br />

            <Input
              placeholder="Address 1"
              value={formData.address1}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, address1: e.target.value }))
              }
            />

            <br />

            <Input
              placeholder="Address 2"
              value={formData.address2}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, address2: e.target.value }))
              }
            />
          </div>
          <div>
            <strong>TOTAL DUE:</strong>
            <Input disabled value={formData.totalAmount} readOnly />
          </div>
        </div>

        <Table
          dataSource={formData.items.map((item, idx) => ({
            ...item,
            key: idx,
          }))}
          columns={columns}
          pagination={false}
          footer={() => (
            <div style={{ textAlign: "right", fontWeight: "bold" }}>
              Total: $ {Number(formData.totalAmount || 0).toFixed(2)}
            </div>
          )}
        />

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

        <div>
          <Button
            type="primary"
            style={{ left: "85%" }}
            onClick={handleSubmit}
            loading={isLoading}
            // disabled={isLoading}
          >
            Send PDF via Email
          </Button>
        </div>
      </div>
    </Spin>
  );
};

export default EditInvoice;
