import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { getQuote, updateQuote } from "@/services/api/serviceQuoteApi";
import { listServiceNames } from "@/services/api/serviceApi";
import { dataOf, errorMessage, itemsOf } from "@/services/apiResult";
import { fromApiDate, toApiDate } from "@/utils/datetime";
import { useClientFromQuery } from "@/pages/clients/useClientFromQuery";
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
import { DatePicker, Tooltip } from "antd";
import { ArrowLeft, FilePlus2 } from "lucide-react";
import SignatureField from "@/components/SignatureField";
import "./EditServiceQuotePage.scss";
import { COMPANY_LOGO_URL } from "@/config/brand";
import { useRouteParam } from "@/hooks/useRouteParam";
import type { Dayjs } from "dayjs";
import type { TableColumnsType } from "antd";
import type { ServiceName } from "@/types";
import { linesTotal, type QuoteFormData, type QuoteLine } from "./quoteForm";

const { Option } = Select;

const EditServiceQuotePage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [services, setServices] = useState<ServiceName[]>([]);
  const [userId, setUserId] = useState<number | null>(null);
  // Opened from a client's page, saving goes back there.
  const { returnPath } = useClientFromQuery("quotes", "/invoices");
  const id = useRouteParam();
  const [formData, setFormData] = useState<QuoteFormData>({
    ref: "",
    reference_type: "",
    serviceDates: null,
    dueDate: null,
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
    date: null,
  });

  // Loads the quote with its own company, address and lines; an answer for an
  // old id is ignored.
  useEffect(() => {
    let current = true;
    getQuote(id)
      .then((res) => {
        if (!current) return;
        const quote = dataOf(res);
        setFormData({
          ref: quote.ref_no ?? "",
          reference_type: quote.ref_type ?? "",
          serviceDates: fromApiDate(quote.service_dates),
          dueDate: fromApiDate(quote.due_date),
          toCompany: quote.to_company_name ?? "",
          address1: quote.address_1 ?? "",
          address2: quote.address_2 ?? "",
          totalAmount: quote.total_due ?? "",
          date: fromApiDate(quote.date),
          signature: quote.signature,
          items:
            quote.items?.map((item) => ({
              description: item.description,
              frequency: item.frequency ?? "",
              quantity: item.quantity,
              calculation_type: item.calculation_type || "na",
              sqft: item.sqft ?? "N/A",
              hour: item.hour ?? "",
              unit_price: item.unit_price,
              amount: item.amount,
              // A line a service request brought goes back as it came (step 6).
              ...(item.service_request_id ? { service_request_id: item.service_request_id } : {}),
            })) || [],
        });
        setUserId(quote.user_id);
      })
      .catch((error) => {
        if (current) message.error(errorMessage(error, "Couldn't load the quote"));
      })
      .finally(() => {
        if (current) setIsLoading(false);
      });
    return () => {
      current = false;
    };
  }, [id]);

  useEffect(() => {
    listServiceNames()
      .then((res) => setServices(itemsOf(res)))
      .catch((error) => message.error(errorMessage(error, "Couldn't load the services")));
  }, []);

  const handleItemChange = <K extends keyof QuoteLine>(index: number, field: K, value: QuoteLine[K]) => {
    const updatedItems = [...formData.items];
    updatedItems[index][field] = value;
    setFormData({ ...formData, items: updatedItems });
  };

  const formatAmount = (value: unknown) => {
    if (value === null || value === undefined || value === "") return "";

    const number = Number(value);

    if (!Number.isFinite(number)) return "";

    return number.toFixed(6).replace(/\.?0+$/, "");
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
      const unitPrice = parseFloat(String(item.unit_price)) || 0;

      let multiplier;

      if (item.calculation_type === "hour") {
        multiplier = parseFloat(String(item.hour)) || 1;
      } else if (item.calculation_type === "sqft") {
        multiplier =
          item.sqft === "N/A" || item.sqft === "" ? 1 : parseFloat(String(item.sqft));
      } else {
        multiplier = 1;
      }

      const quantity = parseFloat(String(item.quantity)) || 1;

      const amount = quantity * multiplier * unitPrice;

      return {
        ...item,
        amount: amount.toFixed(6),
      };
    });

    const total = updatedItems.reduce((sum, item) => {
      return sum + (parseFloat(String(item.amount)) || 0);
    }, 0);

    setFormData({
      ...formData,
      items: updatedItems,
      totalAmount: total.toFixed(6),
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
    const totalAmount = parseFloat(String(formData.totalAmount)) || 0;
    if (totalAmount <= 0) {
      message.error("Total amount must be greater than $0.");
      return;
    }

    setIsLoading(true);
    if (!userId) return;
    const payload = {
      user_id: userId,
      ref_no: formData.ref,
      ref_type: formData.reference_type,
      service_dates: toApiDate(formData.serviceDates) ?? "",
      due_date: toApiDate(formData.dueDate),
      to_company_name: formData.toCompany,
      address_1: formData.address1,
      address_2: formData.address2,
      signature: formData.signature ?? undefined,
      items: formData.items,
      date: toApiDate(formData.date),
    };

    try {
      await updateQuote(id, payload);
      message.success("Quote saved; the client was sent the new copy");
      navigate(returnPath);
    } catch (error) {
      message.error(errorMessage(error, "Couldn't save the quote"));
    } finally {
      setIsLoading(false);
    }
  };

  const deleteItem = (index: number) => {
    if (formData.items.length === 1) {
      message.warning("At least one item is required");
      return;
    }

    // The total follows the lines that are left.
    const items = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items, totalAmount: linesTotal(items).toFixed(6) });
  };

  const onServiceDateChange = (date: Dayjs | null) => {
    setFormData((prev) => ({ ...prev, serviceDates: date }));
  };

  const onDueDateChange = (date: Dayjs | null) => {
    setFormData((prev) => ({ ...prev, dueDate: date }));
  };

  const onQuoteDateChange = (date: Dayjs | null) => {
    setFormData((prev) => ({ ...prev, date }));
  };

  const columns: TableColumnsType<QuoteLine & { key: number }> = [
    {
      title: "Description / Service",
      dataIndex: "description",
      key: "description",
      render: (_text, record, index) => (
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
            suffix={
              record.service_request_id ? (
                <Tooltip title="Added by a service request. Editing the request changes this line; deleting it takes the line out.">
                  <FilePlus2 size={14} className="quote-line__from-request" aria-label="From a service request" />
                </Tooltip>
              ) : undefined
            }
            onChange={(e) =>
              handleItemChange(index, "description", e.target.value)
            }
            disabled={Boolean(record.service_id)} // prevent typing if service is selected
          />
        </div>
      ),
    },
    {
      title: (
        <span>
          Frequency <span className="required-mark">*</span>
        </span>
      ),
      dataIndex: "frequency",
      key: "frequency",
      render: (text, _record, index) => (
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
      render: (text, _record, index) => (
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
      render: (_text, record, index) => (
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
            value={record.sqft === "N/A" ? "" : String(record.sqft ?? "")}
            placeholder="Sqft"
            onChange={(e) => {
              const val = e.target.value;
              // allow empty, digits, and a single decimal point (e.g. "1", "1.", "1.5")
              if (val === "" || /^\d*\.?\d*$/.test(val)) {
                handleItemChange(index, "sqft", val);
              }
            }}
            onBlur={(e) => {
              // only fall back to "N/A" once the user leaves the field empty
              if (e.target.value === "") {
                handleItemChange(index, "sqft", "N/A");
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
      render: (text, _record, index) => (
        <InputNumber
          min={0}
          value={text !== "" ? Number(text) : ""}
          onChange={(value) => handleItemChange(index, "unit_price", value)}
          style={{ width: "100%" }}
          placeholder="Unit Price"
          precision={6}
          formatter={(value) => `$ ${value}`}
          parser={(value) => {
            const digits = (value ?? "").replace(/[^\d.]/g, "");
            return digits === "" ? "" : Number(digits);
          }}
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

  const handleBack = () => {
    navigate(`/viewUser/${userId}`);
  };

  return (
    <Spin spinning={isLoading}>
      <div className="update-service-quote">
        <div className="update-service-quote__header">
          <img
            src={COMPANY_LOGO_URL}
            alt="Logo"
            className="update-service-quote__logo"
          />
          <div className="update-service-quote__title">SERVICE QUOTE</div>
        </div>

        <div className="update-service-quote__toolbar">
          <div>
            <Button
              type="text"
              icon={<ArrowLeft size={16} />}
              onClick={handleBack}
            >
              Back to User
            </Button>
          </div>
        </div>

        <div className="update-service-quote__meta">
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
              SERVICE DATE <span className="required-mark">*</span>:
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
              DUE DATE <span className="required-mark">*</span>:
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

        <div className="update-service-quote__address">
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
              TO: <span className="required-mark">*</span>
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
            <Input value={formatAmount(formData.totalAmount)} readOnly />
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
            <div className="update-service-quote__total">
              Total: ${formatAmount(formData.totalAmount)}
            </div>
          )}
        />

        <div className="update-service-quote__item-actions">
          <Button onClick={addItem}>+ Add Item</Button>
          <Button type="primary" onClick={calculateTotal}>
            Calculate Total
          </Button>
        </div>

        <div className="update-service-quote__footer">
          <div className="update-service-quote__date">
            Date <span className="required-mark">*</span>:{" "}
            <DatePicker
              format="MM-DD-YYYY"
              value={formData.date}
              onChange={onQuoteDateChange}
              style={{ width: "100%" }}
              placeholder="Date"
            />
          </div>
          <div className="update-service-quote__signature">
            <SignatureField formData={formData} setFormData={setFormData} />
          </div>
        </div>

        <div className="update-service-quote__disclaimer">
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

        <div className="update-service-quote__submit">
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={isLoading}
          >
            Update Quote
          </Button>
        </div>
      </div>
    </Spin>
  );
};

export default EditServiceQuotePage;
