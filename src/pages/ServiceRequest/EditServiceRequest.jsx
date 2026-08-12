/** @format */

import dayjs from "@/lib/dayjs";
import React, { useEffect, useState } from "react";
import "./Servicerequest.scss";
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
import {
  UpdateServiceRequest,
  GetServiceRequestById,
} from "../../services/Api/ServiceRequestApi";
import { GetUserById } from "../../services/Api/Api";
import SignatureField from "../Customer/SignatureField";
import { GetAllServiceNameByAdmin } from "../../services/Api/BookingApi";

const { Option } = Select;

const EditServiceRequest = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [services, setServices] = useState([]);
  const { id } = useParams();
  const [formData, setFormData] = useState({
    ref: "",
    reference_type: "",

    service_days: null,
    dueDate: null,

    toCompany: "",
    address1: "",
    address2: "",

    items: [
      {
        description: "",
        frequency: "",
        quantity: "",
        sqft: "N/A",
        unit_price: "",
        amount: "",
      },
    ],

    totalAmount: "",
    date: null,
  });
  const [userId, setUserId] = useState(null);
  const [userData, setUserData] = useState(null);

  const loadQuote = async () => {
    setIsLoading(true);

    try {
      const res = await GetServiceRequestById(id);

      const quote = res.data.data;

      console.log("QUOTE", quote);
      console.log("ITEMS", quote.service_request_quote_item);

      setFormData({
        user_id: quote.user_id,
        ref: quote.ref_no,
        reference_type: quote.ref_type,
        dueDate: dayjs(quote.due_date),
        toCompany: quote.to_company_name,
        address1: quote.address_1,
        address2: quote.address_2,
        totalAmount: quote.total_due,
        date: dayjs(quote.date),
        signature: quote.signature,
        service_days: quote.service_days,

        items:
          quote.service_request_quote_item?.map((item) => ({
            description: item.description,
            frequency: item.frequency,
            quantity: item.quantity,
            calculation_type: item.calculation_type || "na",
            sqft: item.sqft ?? "N/A",
            hour: item.hour ?? "",
            unit_price: item.unit_price,
            amount: item.amount,
          })) || [],
      });

      console.log(
        quote.service_request_quote_item?.map((item) => ({
          description: item.description,
          frequency: item.frequency,
          quantity: item.quantity,
          unit_price: item.unit_price,
          amount: item.amount,
        })),
      );

      setUserId(quote.user_id);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuote();
  }, [id]);

  useEffect(() => {
    if (!userId) return;

    GetUserById(userId)
      .then((res) => {
        const user = res.data.data;

        setUserData(user);

        const primaryAddress = user.user_address?.[0];

        setFormData((prev) => ({
          ...prev,
          toCompany: user.user_profile?.name || "",
          address1: primaryAddress
            ? `${primaryAddress.address}, ${primaryAddress.user_city?.name}`
            : "",
          address2: primaryAddress
            ? `${primaryAddress.user_state?.name}, ${primaryAddress.user_country?.name}`
            : "",
        }));
      })
      .catch(() => {
        message.error("Failed to load user");
      });
  }, [userId]);

  useEffect(() => {
    GetAllServiceNameByAdmin().then((res) => setServices(res.data.data || []));
  }, []);

  const formatAmount = (value) => {
    if (value === null || value === undefined || value === "") {
      return "";
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
      return "";
    }

    return number.toFixed(6).replace(/\.?0+$/, "");
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index][field] = value;

    const quantity = parseFloat(updatedItems[index].quantity) || 1;
    const price = parseFloat(updatedItems[index].unit_price) || 0;

    updatedItems[index].amount = formatAmount(quantity * price);

    const total = updatedItems.reduce(
      (sum, item) => sum + (parseFloat(item.amount) || 0),
      0,
    );

    setFormData({
      ...formData,
      items: updatedItems,
      totalAmount: total.toFixed(6),
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
          quantity: "",
          sqft: "N/A",
          unit_price: "",
          amount: "",
        },
      ],
    });
  };

  const calculateTotal = () => {
    const updatedItems = formData.items.map((item) => {
      const quantity = parseFloat(item.quantity) || 1;
      const unitPrice = parseFloat(item.unit_price) || 0;

      const amount = quantity * unitPrice;

      return {
        ...item,
        amount: formatAmount(amount),
      };
    });

    const total = updatedItems.reduce((sum, item) => {
      const amt = parseFloat(item.amount);
      return sum + (isNaN(amt) ? 0 : amt);
    }, 0);

    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
      totalAmount: total.toFixed(6),
    }));
  };

  const handleSubmit = async () => {
    if (
      !formData.reference_type ||
      !formData.service_days ||
      !formData.dueDate ||
      !formData.date ||
      !formData.toCompany ||
      !formData.address1 ||
      !formData.signature ||
      !formData.items.every(
        (item) => item.description && item.frequency && item.unit_price,
      )
    ) {
      message.error("Please fill all required fields.");
      return;
    }

    const totalAmount = parseFloat(formData.totalAmount) || 0;

    if (totalAmount <= 0) {
      message.error("Total amount must be greater than $0.");
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        request_id: Number(id),

        user_id: formData.user_id,

        ref_type: formData.reference_type,
        ref_no: formData.ref,

        service_days: formData.service_days,
        due_date: formData.dueDate.format("YYYY-MM-DD"),

        to_company_name: formData.toCompany,
        address_1: formData.address1,
        address_2: formData.address2,

        date: formData.date.format("YYYY-MM-DD"),
        signature: formData.signature,

        items: formData.items.map((item) => ({
          description: item.description,
          frequency: item.frequency,
          quantity: Number(item.quantity || 1),
          unit_price: Number(item.unit_price || 0),
          amount: Number(item.amount || 0),
        })),
      };

      const response = await UpdateServiceRequest(payload);

      if (response.status === 200) {
        message.success("Service request sent for signature successfully.");

        setTimeout(() => navigate("/service-request"), 1000);
      } else {
        message.error("Something went wrong");
      }
    } catch (error) {
      message.error("Error: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteItem = (index) => {
    if (formData.items.length === 1) {
      message.warning("At least one item is required");
      return;
    }

    const items = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items }, calculateTotal);
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
      render: (text) => <Input value={formatAmount(text)} readOnly />,
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
            <div className="quote-title">SERVICE REQUEST</div>
          </div>
        </div>

        <div className="invoice-meta-container">
          {/* ROW — REF TYPE, REF NO, SERVICE DAYS, DUE DATE */}
          <div className="meta-table">
            {/* REF TYPE */}
            <div>
              <strong>REF TYPE:</strong>
              <Input value={formData.reference_type} readOnly />
            </div>

            {/* REF NO */}
            <div>
              <strong>REF #:</strong>
              <Input value={formData.ref} readOnly />
            </div>

            {/* SERVICE DAYS */}
            <div>
              <strong>
                SERVICE DAYS <span style={{ color: "red" }}>*</span>
              </strong>

              <Input
                placeholder="e.g. 2 Business Days, Same Day, Within 48 Hours"
                value={formData.service_days}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    service_days: e.target.value,
                  }))
                }
                style={{ width: "100%", marginTop: 5 }}
              />
            </div>

            {/* DUE DATE */}
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
            <strong>CLIENT</strong>

            <Input value={userData?.user_profile?.name || ""} readOnly />
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
          <Input
  value={formatAmount(formData.totalAmount)}
  readOnly
/>
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
             Total: ${formatAmount(formData.totalAmount)}
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
          All service requests are in addition to the monthly or weekly price.
          Total price is due at the next invoice, for all services provided in
          this document. Ten business days after the signed date, this document
          and price becomes void, unless signed in contractual agreement. All
          services offered are appointment-based services. "Single Services" are
          scheduled with time and date for any given service. "Reoccurring
          Service Customers" must have a time and date specified in a service
          request for time specific services. Any holiday scheduling must be
          done thirty days prior to the scheduled service date. All charges are
          final. If any questions, changes, or adjustments are needed, contact
          our representative.
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

export default EditServiceRequest;
