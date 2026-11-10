import { useEffect, useState } from "react";
import "./serviceRequests.scss";
import { useNavigate } from "react-router";

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
import SignatureField from "@/components/SignatureField";
import { createServiceRequest, getNextServiceRequestRef } from "@/services/api/serviceRequestApi";
import { listServiceNames } from "@/services/api/serviceApi";
import { listClientPicks } from "@/services/api/clientApi";
import { dataOf, errorMessage, itemsOf } from "@/services/apiResult";
import { useClientFromQuery } from "@/pages/clients/useClientFromQuery";
import { useClientDocuments } from "@/hooks/useClientDocuments";
import AddsToPicker from "./components/AddsToPicker";
import { joinsParent, pickedParent } from "./addsTo";
import { COMPANY_LOGO_URL } from "@/config/brand";

const { Option } = Select;

const CreateServiceRequestPage = () => {
  const navigate = useNavigate();
  // Opened from a client's page, the client is already chosen and saving goes back there.
  const { clientId, fromClientPage, returnPath, params } = useClientFromQuery("service-requests", "/service-request");
  // What it adds to: an estimate or quote picked here, or passed from the client page.
  const [addsTo, setAddsTo] = useState(() => {
    const estimateId = Number(params.get("estimateId")) || undefined;
    const quoteId = Number(params.get("quoteId")) || undefined;
    return estimateId ? { estimate_id: estimateId } : quoteId ? { quote_id: quoteId } : {};
  });
  const [isLoading, setIsLoading] = useState(false);
  const [services, setServices] = useState([]);
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
  const [users, setUsers] = useState([]);

  const [quoteStatus, setQuoteStatus] = useState("DRAFT"); // DRAFT | SAVED
  const { data: documents } = useClientDocuments(formData.user_id);
  const parent = pickedParent(documents, addsTo);
  const joins = joinsParent(parent);
  const [isRefManuallyEdited, setIsRefManuallyEdited] = useState(false);

  const handleUserChange = (userId, list = users) => {
    const user = list.find((u) => u.id === userId);

    if (!user) return;

    const address = user.address || {};

    setFormData((prev) => ({
      ...prev,
      user_id: user.id,
      toCompany: user.name || "",

      address1: address.address_1
        ? `${address.address_1}, ${address.city || ""}`
        : "",

      address2: `${address.state || ""}${address.country ? ", " + address.country : ""}`,
    }));
  };

  useEffect(() => {
    listServiceNames()
      .then((res) => setServices(itemsOf(res)))
      .catch((error) => message.error(errorMessage(error, "Couldn't load the services")));

    listClientPicks()
      .then((res) => {
        const clients = itemsOf(res);
        setUsers(clients);
        if (clientId) handleUserChange(clientId, clients);
      })
      .catch((error) => message.error(errorMessage(error, "Couldn't load the clients")));
    // The client from the address is read once, when the page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        amount: amount.toFixed(6),
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

  const formatAmount = (value) => {
    if (value === null || value === undefined || value === "") return "";

    const number = Number(value);

    if (!Number.isFinite(number)) return "";

    return number.toFixed(6).replace(/\.?0+$/, "");
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
        user_id: formData.user_id,

        ref_type: formData.reference_type,
        ref_no: formData.ref,

        service_days: formData.service_days,
        due_date: formData.dueDate.format("YYYY-MM-DD"),

        to_company_name: formData.toCompany,
        address_1: formData.address1,
        address_2: formData.address2,

        date: formData.date.format("YYYY-MM-DD"), // admin date
        signature: formData.signature,

        items: formData.items.map((item) => ({
          description: item.description,
          frequency: item.frequency,
          quantity: Number(item.quantity || 1),
          unit_price: Number(item.unit_price || 0),
          amount: Number(item.amount || 0),
        })),
        ...(addsTo.estimate_id ? { estimate_id: addsTo.estimate_id } : {}),
        ...(addsTo.quote_id ? { quote_id: addsTo.quote_id } : {}),
      };

      const res = await createServiceRequest(payload);
      setQuoteStatus("SAVED");
      message.success(res.data?.message || "Service request sent to the client for signature");
      navigate(returnPath);
    } catch (error) {
      message.error(errorMessage(error, "Couldn't send the service request"));
    } finally {
      setIsLoading(false);
    }
  };
  const isLocked = quoteStatus === "SAVED";

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
      render: (text) => (
        <Input disabled={isLocked} value={formatAmount(text)} readOnly />
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
      <div className="service-request-doc">
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
            <strong>
              REF TYPE <span className="required-mark">*</span>:
            </strong>

            <Select
              value={formData.reference_type || undefined}
              placeholder="Select Ref Type"
              style={{ width: "100%", marginTop: 5 }}
              onChange={async (value) => {

                setFormData((prev) => ({
                  ...prev,
                  reference_type: value,
                }));

                if (!formData.ref || !isRefManuallyEdited) {
                  try {
                    const res = await getNextServiceRequestRef(value);

                    setFormData((prev) => ({
                      ...prev,
                      ref: dataOf(res)?.ref_no || prev.ref,
                    }));

                    setIsRefManuallyEdited(false);
                  } catch (error) {
                    message.error(errorMessage(error, "Couldn't get the next reference number"));
                  }
                }
              }}
            >
              <Option value="RHK">RHK (Residential - Housekeeping)</Option>
              <Option value="RM">RM (Residential - Maintenance)</Option>
              <Option value="RFM">
                RFM (Residential - Floor Maintenance)
              </Option>
              <Option value="CHK">CHK (Commercial - Housekeeping)</Option>
              <Option value="CM">CM (Commercial - Maintenance)</Option>
              <Option value="CFM">
                CFM (Commercial - Floor Maintenance)
              </Option>
            </Select>
          </div>

          {/* REF NO */}
          <div>
            <strong>
              REF # <span className="required-mark">*</span>:
            </strong>

            <Input
              value={formData.ref}
              placeholder="Enter reference number"
              onChange={(e) => {
                setIsRefManuallyEdited(true);
                setFormData({ ...formData, ref: e.target.value });
              }}
              style={{ width: "100%", marginTop: 5 }}
            />
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
            <strong>
              CLIENT <span className="required-mark">*</span>
            </strong>

            <Select
              showSearch
              placeholder="Select Client"
              style={{ width: "100%", marginBottom: 10 }}
              optionFilterProp="children"
              value={formData.user_id}
              disabled={fromClientPage}
              onChange={(value) => {
                handleUserChange(value);
                setAddsTo({});
              }}
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {users.map((user) => (
                <Option key={user.id} value={user.id}>
                  {user.name}
                </Option>
              ))}
            </Select>
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
            <Input
              disabled={isLocked}
              value={formatAmount(formData.totalAmount)}
              readOnly
            />
          </div>
        </div>

        <AddsToPicker documents={documents} value={addsTo} onChange={setAddsTo} />

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
            {joins ? `Add to the ${parent.kind === "estimate" ? "Estimate" : "Quote"}` : "Send PDF via Email"}
          </Button>
        </div>
      </div>
    </Spin>
  );
};

export default CreateServiceRequestPage;
