/** @format */

import dayjs from "@/lib/dayjs";
import React, { useEffect, useLayoutEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  EditServiceQuote,
  GetNextQuoteRef,
  GetServiceQuoteById,
  GetUserById,
} from "../../services/Api/Api";
import { useContext } from "react";
import {
  message,
  Spin,
  Table,
  Input,
  InputNumber,
  Button,
  Select,
  Popconfirm,
  Modal,
} from "antd";
import { DatePicker } from "antd";
import { GetAllServiceNameByAdmin } from "../../services/Api/BookingApi";
import SignatureField from "../Customer/SignatureField";

const { Option } = Select;

const UpdateServiceQuote = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [userId, setUserId] = useState(null);
  const { id } = useParams();
  const [formData, setFormData] = useState({
    ref: "",
    reference_type: "",
    serviceDates: "",
    dueDate: "",
    toCompany: "",
    address1: "",
    address2: "",
    tip: "",
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
    date: "",
    // square_payment_url: "",
  });

  const loadQuote = async () => {
    setIsLoading(true);

    try {
      const res = await GetServiceQuoteById(id);

      const quote = res.data.data;

      setFormData({
        ref: quote.ref_no,
        reference_type: quote.ref_type,
        serviceDates: dayjs(quote.service_dates),
        dueDate: dayjs(quote.due_date),
        toCompany: quote.to_company_name,
        address1: quote.address_1,
        address2: quote.address_2,
        totalAmount: quote.total_due,
        date: dayjs(quote.date),
        signature: quote.signature,

        items:
          quote.service_quote_item?.map((item) => ({
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

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index][field] = value;
    setFormData({ ...formData, items: updatedItems });
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

  const handleSubmit = async () => {
    if (
      !formData.ref ||
      !formData.reference_type ||
      !formData.serviceDates ||
      !formData.dueDate ||
      !formData.toCompany ||
      !formData.address1 ||
      !formData.items.every(
        (item) => item.description && item.frequency && item.unit_price,
      )
    ) {
      message.error("Please fill all required fields.");
      return;
    }

    // ✅ Validate total amount before proceeding
    const totalAmount = parseFloat(formData.totalAmount) || 0;
    if (totalAmount <= 0.01) {
      message.error(
        "Total amount must be greater than $0.01 to generate a payment link or send the quote.",
      );
      return;
    }

    setIsLoading(true);
    const payload = {
      quote_id: id,
      user_id: userId,
      ref_no: formData.ref,
      ref_type: formData.reference_type,
      service_dates: formData.serviceDates,
      due_date: formData.dueDate,
      to_company_name: formData.toCompany,
      address_1: formData.address1,
      address_2: formData.address2,
      signature: formData.signature,
      items: formData.items,
      date: formData.date,

      // tip: parseFloat(formData.tip || 0),
      // square_payment_url: formData.square_payment_url,
    };

    try {
      const response = await EditServiceQuote(payload);
      if (response.status === 200) {
        message.success("Quote updated successfully.");
        setTimeout(() => navigate(`/viewUser/${userId}`), 1000);
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
      render: (text) => <Input value={text} readOnly />,
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

  const handleBack = () => {
    navigate(`/viewUser/${userId}`);
  };

  return (
    <Spin spinning={isLoading}>
      <div className="quote-form">
        <div className="header">
          <img
            src="https://socialsanitation.com/wp-content/uploads/2022/12/New-Logo.jpg"
            alt="Logo"
            className="logo1"
          />
          <div className="quote-title">SERVICE QUOTE</div>
        </div>

        <div className="quote-form-toolbar">
          <div className="toolbar-left">
            <Button type="text" icon={<span>←</span>} onClick={handleBack}>
              Back to User
            </Button>
          </div>
        </div>

        <div className="meta-table" style={{ marginBottom: 28 }}>
          <div>
            <strong>REF TYPE:</strong>
            <Input value={formData.reference_type} readOnly />
          </div>

          <div>
            <strong>REF #:</strong>
            <Input value={formData.ref} readOnly />
          </div>

          <div>
            <strong>
              SERVICE DATE <span style={{ color: "red" }}>*</span>:
            </strong>
            <DatePicker
              format="MM-DD-YYYY"
              value={formData.serviceDates}
              onChange={onServiceDateChange}
              style={{ width: "100%", marginTop: 5 }}
              placeholder="Service Date"
            />
          </div>
          <div>
            <strong>
              DUE DATE <span style={{ color: "red" }}>*</span>:
            </strong>
            <DatePicker
              format="MM-DD-YYYY"
              value={formData.dueDate}
              onChange={onDueDateChange}
              style={{ width: "100%", marginTop: 5 }}
              placeholder="Due Date"
            />
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
              TO: <span style={{ color: "red" }}>*</span>
            </strong>
            <br />

            <Input
              placeholder="Company Name"
              value={formData.toCompany}
              onChange={(e) => {
                setFormData({ ...formData, toCompany: e.target.value });
              }}
            />
            <br />
            <Input
              placeholder="Address 1"
              value={formData.address1}
              onChange={(e) => {
                setFormData({ ...formData, address1: e.target.value });
              }}
              style={{ marginTop: 8 }}
            />
            <br />
            <Input
              placeholder="Address 2"
              value={formData.address2}
              onChange={(e) => {
                setFormData({ ...formData, address2: e.target.value });
              }}
              style={{ marginTop: 8 }}
            />
          </div>
          <div>
            <strong>TOTAL DUE:</strong>
            <Input value={formData.totalAmount} readOnly />
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
              Total: ${formData.totalAmount}
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

        {/* Square Payment Link Section */}
        {/* <div
					style={{
						marginTop: "40px",
						textAlign: "center",
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						gap: "10px",
					}}
				>
					<strong>Square Payment Link</strong>
					<Input
						placeholder="Enter Square Payment Link"
						style={{ width: "60%" }}
						value={formData.square_payment_url}
						onChange={(e) =>
							setFormData({
								...formData,
								square_payment_url: e.target.value,
							})
						}
					/>
				</div> */}

        <div
          className="disclaimer"
          style={{
            marginTop: "60px", // ✅ increased from 0 to 60 for better spacing
            textAlign: "justify",
          }}
        >
          All quotes and estimates are valid within thirty days from signed
          date. Prices are set for a thirty-day period, once the document is
          signed and dated by by a Social Sanitation legal representative.
          Thirty days after customer's signature, this document and price
          becomes void, unless signed in contractual agreement. All services
          offered are appointment-based services. "Recurring Service Customers"
          must have a time and date specified in a service request for
          additional services. Any holiday scheduling must be done thirty days
          prior to the scheduled service date. If billed monthly, all charges
          are final. If any questions, changes, or adjustments are needed,
          contact your representative.
        </div>

        <div className="quote-form">
          <Button
            type="primary"
            style={{ left: "85%" }}
            onClick={handleSubmit}
            loading={isLoading}
            // disabled={isLoading}
          >
            Update Quote
          </Button>
        </div>
      </div>
    </Spin>
  );
};

export default UpdateServiceQuote;
