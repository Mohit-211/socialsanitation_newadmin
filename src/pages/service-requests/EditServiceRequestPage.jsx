import { useEffect, useState } from "react";
import "./serviceRequests.scss";
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
import { Alert, DatePicker } from "antd";
import { getServiceRequest, updateServiceRequest } from "@/services/api/serviceRequestApi";
import { listServiceNames } from "@/services/api/serviceApi";
import { errorMessage, dataOf, itemsOf } from "@/services/apiResult";
import { fromApiDate } from "@/utils/datetime";
import { useClientFromQuery } from "@/pages/clients/useClientFromQuery";
import { EDIT_DOCUMENT_PATHS } from "@/pages/clients/clientFlow";
import { useClientDocuments } from "@/hooks/useClientDocuments";
import StatusTag from "@/components/StatusTag";
import { savingNote } from "@/utils/signing";
import { pickedParent } from "./addsTo";
import SignatureField from "@/components/SignatureField";
import { COMPANY_LOGO_URL } from "@/config/brand";

const { Option } = Select;

const EditServiceRequestPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
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
  const [client, setClient] = useState(null);
  // Where it stands: its status, and the estimate or quote it adds to (joined:
  // its lines are in that document, which went to the client instead of it).
  const [standing, setStanding] = useState(null);
  // Opened from a client's page, saving goes back there.
  const { returnPath } = useClientFromQuery("service-requests", "/service-request");

  // Loads the request; an answer for an old id is ignored.
  useEffect(() => {
    let current = true;
    getServiceRequest(id)
      .then((res) => {
        if (!current) return;
        const quote = dataOf(res);
        setFormData({
          user_id: quote.user_id,
          ref: quote.ref_no,
          reference_type: quote.ref_type,
          dueDate: fromApiDate(quote.due_date),
          toCompany: quote.to_company_name,
          address1: quote.address_1,
          address2: quote.address_2,
          totalAmount: quote.total_due,
          date: fromApiDate(quote.date),
          signature: quote.signature,
          service_days: quote.service_days,

          items:
            quote.items?.map((item) => ({
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
        setClient(quote.client || null);
        setStanding({
          status: quote.status,
          estimate_id: quote.estimate_id ?? null,
          quote_id: quote.quote_id ?? null,
          joined: Boolean(quote.joined),
        });
      })
      .catch((error) => {
        if (current) message.error(errorMessage(error, "Couldn't load the service request"));
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

  const { data: documents } = useClientDocuments(formData.user_id);
  const parent = pickedParent(documents, standing ?? {});
  const parentName = parent?.kind === "estimate" ? "Estimate" : "Quote";
  const note = (() => {
    if (standing?.joined && parent) {
      return {
        type: "info",
        title:
          parent.kind === "estimate"
            ? `Its lines are in estimate ${parent.row.title}. Saving changes them there, and the estimate goes to the client again for a new signature.`
            : `Its lines are in quote ${parent.row.title}. Saving changes them there, and the quote goes to the client again (a draft quote just takes the change).`,
      };
    }
    const base = savingNote(standing?.status);
    return parent?.kind === "quote"
      ? { ...base, title: `Made for quote ${parent.row.title}, which was paid, so it went to the client on its own. ${base.title}` }
      : base;
  })();

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

      const res = await updateServiceRequest(id, payload);
      message.success(res.data?.message || "Service request saved; a new copy went to the client for signature");
      navigate(returnPath);
    } catch (error) {
      message.error(errorMessage(error, "Couldn't save the service request"));
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
          Frequency <span className="required-mark">*</span>
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
      <div className="service-request-doc">
        {standing && (
          <Alert
            type={note.type}
            showIcon
            className="service-request-doc__standing"
            title={
              <>
                <StatusTag code={standing.status} /> {note.title}
              </>
            }
            action={
              parent && (
                <Button size="small" onClick={() => navigate(EDIT_DOCUMENT_PATHS[parent.kind](parent.row.id))}>
                  Open the {parentName}
                </Button>
              )
            }
          />
        )}
        <div className="service-request-doc__brand">
          <div className="service-request-doc__header">
            <img
              src={COMPANY_LOGO_URL}
              alt="Logo"
              className="service-request-doc__logo"
            />
            <div className="service-request-doc__title">SERVICE REQUEST</div>
          </div>
        </div>

        {/* ROW — REF TYPE, REF NO, SERVICE DAYS, DUE DATE */}
        <div className="service-request-doc__meta">
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
              SERVICE DAYS <span className="required-mark">*</span>
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
              DUE DATE <span className="required-mark">*</span>
            </strong>

            <DatePicker
              format="MM-DD-YYYY"
              value={formData.dueDate}
              onChange={onDueDateChange}
              style={{ width: "100%", marginTop: 5 }}
            />
          </div>
        </div>

        <div className="service-request-doc__address">
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

            <Input value={client?.name || client?.email || ""} readOnly />
          </div>
          <div>
            <strong>
              TO: <span className="required-mark">*</span>
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
            <div className="service-request-doc__total">
              Total: ${formatAmount(formData.totalAmount)}
            </div>
          )}
        />

        <div className="service-request-doc__item-actions">
          <Button onClick={addItem}>+ Add Item</Button>
          <Button type="primary" onClick={calculateTotal}>
            Calculate Total
          </Button>
        </div>

        <div className="service-request-doc__footer">
          <div className="service-request-doc__date">
            Date <span className="required-mark">*</span>:{" "}
            <DatePicker
              format="MM-DD-YYYY"
              value={formData.date}
              onChange={onQuoteDateChange}
              style={{ width: "100%" }}
              placeholder="Date"
            />
          </div>
          <div className="service-request-doc__signature">
            <SignatureField formData={formData} setFormData={setFormData} />
          </div>
        </div>

        <div className="service-request-doc__disclaimer">
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

        <div className="service-request-doc__submit">
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={isLoading}
          >
            {standing?.joined && parent ? `Save to the ${parentName}` : "Save and Send a New Copy"}
          </Button>
        </div>
      </div>
    </Spin>
  );
};

export default EditServiceRequestPage;
