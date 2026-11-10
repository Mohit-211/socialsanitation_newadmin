import { useEffect, useLayoutEffect, useState } from "react";
import "./CreateServiceQuotePage.scss";
import { useNavigate, useParams, useSearchParams } from "react-router";
import {
  createQuote,
  createQuoteDraft,
  deleteQuoteDraft,
  getLatestQuoteDraft,
  getQuote,
  getNextQuoteRef,
  listQuoteDrafts,
  sendQuoteDraft,
  updateQuoteDraft,
} from "@/services/api/serviceQuoteApi";
import { getClient } from "@/services/api/clientApi";
import { getEstimate, getEstimateDraft, listEstimates } from "@/services/api/estimateApi";
import { useApiQuery } from "@/hooks/useApiQuery";
import { listServiceNames } from "@/services/api/serviceApi";
import { dataOf, errorMessage, itemsOf } from "@/services/apiResult";
import { PERMISSION, useCan } from "@/lib/session";
import { fromApiDate, toApiDate } from "@/utils/datetime";
import { clientPagePath } from "@/pages/clients/clientFlow";
import {
  Alert,
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
import { ArrowLeft, Folder } from "lucide-react";
import SignatureField from "@/components/SignatureField";
import { COMPANY_LOGO_URL } from "@/config/brand";

const { Option } = Select;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const idFrom = (value) => Number(value) || undefined;

// Price lines (of an estimate, or a calculation's draft) as quote lines: each
// is a flat price, charged once.
const itemsFromPriceLines = (lines = []) =>
  lines.map((line) => ({
    description: line.name,
    frequency: line.frequency || "",
    quantity: 1,
    calculation_type: "na",
    sqft: "N/A",
    hour: "",
    unit_price: line.price,
    amount: line.price,
  }));

// The links a quote's body carries (step 5 of the client flow); empty ones stay out.
const linkFields = (links) => Object.fromEntries(Object.entries(links).filter(([, value]) => value));

const CreateServiceQuotePage = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [services, setServices] = useState([]);
  const { id } = useParams();
  const [params] = useSearchParams();
  // What the quote goes with: an estimate (which brings its scope and
  // calculation), or a calculation and its scope, from the client page.
  const [links, setLinks] = useState(() => ({
    estimate_id: idFrom(params.get("estimateId")),
    cost_calculation_id: idFrom(params.get("calculationId")),
    scope_of_work_id: idFrom(params.get("scopeId")),
  }));
  const fromSource = Boolean(links.estimate_id || links.cost_calculation_id);
  const [formData, setFormData] = useState({
    ref: "",
    reference_type: "",
    serviceDates: "",
    dueDate: "",
    toCompany: "",
    address1: "",
    address2: "",
    cc_email: "",
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
  });

  const [drafts, setDrafts] = useState([]);
  const [selectedDraftId, setSelectedDraftId] = useState(null);
  // Deleting a draft is Super Admin only (records.delete); others don't see it.
  const canDelete = useCan(PERMISSION.DELETE_RECORDS);
  const [isDirty, setIsDirty] = useState(false);
  const [quoteStatus, setQuoteStatus] = useState("DRAFT"); // DRAFT | SAVED
  const [isRefManuallyEdited, setIsRefManuallyEdited] = useState(false);

  // CC email is locked when the user record already has one from the API
  const isCcLocked = !!userData?.cc_email;

  // A draft is a quote waiting to be sent: the one picked, or the client's newest.
  const loadDraftById = async (draftId) => {
    setIsLoading(true);
    try {
      const draft = dataOf(draftId ? await getQuote(draftId) : await getLatestQuoteDraft(id));
      if (!draft) return;
      if (draft.estimate_id || draft.cost_calculation_id || draft.scope_of_work_id) {
        setLinks({
          estimate_id: draft.estimate_id ?? undefined,
          cost_calculation_id: draft.cost_calculation_id ?? undefined,
          scope_of_work_id: draft.scope_of_work_id ?? undefined,
        });
      }

      setFormData((prev) => ({
        ref: draft.ref_no || "",
        reference_type: draft.ref_type || "",
        serviceDates: fromApiDate(draft.service_dates),
        dueDate: fromApiDate(draft.due_date),
        toCompany: draft.to_company_name || "",
        address1: draft.address_1 || "",
        address2: draft.address_2 || "",
        // keep the value already on the form (user API value) if the draft has none
        cc_email: draft.cc_email ?? prev.cc_email ?? "",
        items: draft.items?.length
          ? draft.items.map((i) => ({
              description: i.description,
              frequency: i.frequency,
              quantity: i.quantity,
              calculation_type: i.calculation_type || "sqft",
              sqft: i.sqft ?? "N/A",
              hour: i.hour ?? "",
              unit_price: i.unit_price,
              amount: i.amount,
            }))
          : [
              {
                description: "",
                frequency: "",
                quantity: 1,
                calculation_type: "sqft",
                sqft: "N/A",
                unit_price: "",
                amount: "",
              },
            ],
        totalAmount: draft.total_due || "",
        date: fromApiDate(draft.date),
        signature: draft.signature || "",
      }));

      setSelectedDraftId(draft.id);
      setQuoteStatus(draft.status);
      setIsDirty(false);
    } catch (error) {
      message.error(errorMessage(error, "Couldn't load the draft"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadDrafts = async () => {
      try {
        const list = itemsOf(await listQuoteDrafts(id));
        setDrafts(list);
        // Pick up the newest draft, unless the quote starts from an estimate or a calculation.
        if (list.length && !fromSource) loadDraftById(list[0].id);
      } catch (error) {
        message.error(errorMessage(error, "Couldn't load the drafts"));
      }
    };

    loadDrafts();
    // Loaded once per client; the source links are read when the page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useLayoutEffect(() => {
    getClient(id)
      .then((res) => {
        const user = dataOf(res);
        setUserData(user);

        const primaryAddress = user.user_address?.[0] || null;

        // A quote from an estimate is addressed as the estimate is (see below).
        if (links.estimate_id) {
          setFormData((prev) => ({ ...prev, cc_email: user.cc_email || prev.cc_email || "" }));
          return;
        }

        setFormData((prev) => ({
          ...prev,
          toCompany: user.name || "",
          // API value is authoritative; otherwise keep whatever is on the form
          cc_email: user.cc_email || prev.cc_email || "",
          address1: primaryAddress
            ? `${primaryAddress.address || ""}, ${
                primaryAddress.user_city?.name || ""
              }`
            : "",
          address2: primaryAddress
            ? `${primaryAddress.user_state?.name || ""}, ${
                primaryAddress.user_country?.name || ""
              }`
            : "",
        }));
      })
      .catch((err) => message.error(errorMessage(err, "Couldn't load the client")));
    // Loaded once per client; the estimate link is read when the page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // The client's estimates, for the "Goes with" picker.
  const { data: clientEstimates } = useApiQuery(() => listEstimates({ user_id: Number(id), limit: 50 }).then(itemsOf), [id], {
    initial: [],
    silent: true,
  });

  // A quote from an estimate starts from its company, address and price lines;
  // one from a calculation, from the lines its newest bid prices.
  const startFrom = (source) => {
    const loading = source.estimate_id
      ? getEstimate(source.estimate_id).then(dataOf)
      : getEstimateDraft({
          clientId: Number(id),
          calculationId: source.cost_calculation_id,
          scopeId: source.scope_of_work_id,
        }).then(dataOf);
    return loading
      .then((start) => {
        if (!start) return;
        const items = itemsFromPriceLines(start.price_lines);
        const street = [start.address_line_1, start.address_line_2].filter(Boolean).join(", ");
        const place = [start.city, [start.state, start.zip].filter(Boolean).join(" ")].filter(Boolean).join(", ");
        setFormData((prev) => ({
          ...prev,
          ...(source.estimate_id
            ? { toCompany: start.client_company_name || prev.toCompany, address1: street || prev.address1, address2: place || prev.address2 }
            : {}),
          ...(items.length ? { items, totalAmount: String(items.reduce((sum, item) => sum + Number(item.amount || 0), 0)) } : {}),
        }));
        if (items.length) setIsDirty(true);
      })
      .catch((error) => message.error(errorMessage(error, "Couldn't start from the estimate")));
  };

  // Picking the estimate the quote goes with starts its lines from the estimate's prices.
  const pickEstimate = (estimateId) => {
    if (!estimateId) {
      setLinks((prev) => ({ ...prev, estimate_id: undefined }));
      return;
    }
    setLinks({ estimate_id: estimateId });
    startFrom({ estimate_id: estimateId });
  };

  useEffect(() => {
    if (links.estimate_id || links.cost_calculation_id) startFrom(links);
    // The source in the address is read once, when the page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    listServiceNames()
      .then((res) => setServices(itemsOf(res)))
      .catch((error) => message.error(errorMessage(error, "Couldn't load the services")));
  }, []);

  const handleItemChange = (index, field, value) => {
    setIsDirty(true);
    const updatedItems = [...formData.items];
    updatedItems[index][field] = value;
    setFormData({ ...formData, items: updatedItems });
  };

  const addItem = () => {
    setIsDirty(true);
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

  const formatAmount = (value) => {
    if (value === null || value === undefined || value === "") return "";

    const number = Number(value);

    if (!Number.isFinite(number)) return "";

    return number.toFixed(6).replace(/\.?0+$/, "");
  };

  const calculateTotal = () => {
    const updatedItems = formData.items.map((item) => {
      const unitPrice = parseFloat(item.unit_price) || 0;

      let multiplier;

      if (item.calculation_type === "hour") {
        multiplier = parseFloat(item.hour) || 1;
      } else if (item.calculation_type === "sqft") {
        multiplier =
          item.sqft === "N/A" || item.sqft === ""
            ? 1
            : parseFloat(item.sqft) || 0;
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

    // CC email is optional, but if entered it must be a valid email
    const ccEmail = (formData.cc_email || "").trim();
    if (ccEmail && !EMAIL_REGEX.test(ccEmail)) {
      message.error("Please enter a valid CC email address.");
      return;
    }

    // ✅ Validate total amount before proceeding
    const totalAmount = parseFloat(formData.totalAmount) || 0;
    if (totalAmount <= 0) {
      message.error("Total amount must be greater than $0.");
      return;
    }

    setIsLoading(true);
    const payload = {
      user_id: Number(id),
      ref_no: formData.ref,
      ref_type: formData.reference_type,
      service_dates: toApiDate(formData.serviceDates) ?? formData.serviceDates,
      due_date: toApiDate(formData.dueDate),
      to_company_name: formData.toCompany,
      address_1: formData.address1,
      address_2: formData.address2,
      signature: formData.signature,
      items: formData.items,
      date: toApiDate(formData.date),
      cc_email: ccEmail,
      ...linkFields(links),
    };

    try {
      // A saved draft becomes the quote; otherwise a new quote is made.
      if (selectedDraftId) await sendQuoteDraft(selectedDraftId, payload);
      else await createQuote(payload);
      setQuoteStatus("SAVED");
      setIsDirty(false);
      message.success("Quote sent to the client");
      navigate(clientPagePath(id, "quotes"));
    } catch (error) {
      message.error(errorMessage(error, "Couldn't send the quote"));
    } finally {
      setIsLoading(false);
    }
  };

  const deleteItem = (index) => {
    setIsDirty(true);
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

  const handleSaveDraft = async () => {
    if (!isDirty) return false;

    const payload = {
      user_id: Number(id),
      ref_no: formData.ref,
      ref_type: formData.reference_type,
      service_dates: toApiDate(formData.serviceDates) ?? formData.serviceDates,
      due_date: toApiDate(formData.dueDate),
      to_company_name: formData.toCompany,
      address_1: formData.address1,
      address_2: formData.address2,
      cc_email: (formData.cc_email || "").trim(),
      items: formData.items,
      date: toApiDate(formData.date),
      signature: formData.signature,
      ...linkFields(links),
    };

    try {
      const res = selectedDraftId
        ? await updateQuoteDraft(selectedDraftId, payload)
        : await createQuoteDraft(payload);

      setSelectedDraftId(dataOf(res)?.id ?? selectedDraftId);
      setIsDirty(false);

      message.success("Draft saved");
      return true;
    } catch (err) {
      message.destroy();

      message.error(errorMessage(err, "Couldn't save the draft"));

      return false;
    }
  };

  const handleSaveDraftClick = () => {
    if (!isDirty) {
      message.info("No changes to save.");
      return;
    }

    Modal.confirm({
      title: "Save Draft?",
      content: "Do you want to save the current changes as a draft?",
      okText: "Save Draft",
      cancelText: "Cancel",
      onOk: async () => {
        await handleSaveDraft();
      },
    });
  };

  const isLocked = quoteStatus === "SAVED";

  useEffect(() => {
    const handler = (e) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const handleBack = () => {
    confirmLeave(() => navigate(-1));
  };

  const confirmLeave = (nextAction) => {
    if (!isDirty) return nextAction();

    Modal.confirm({
      title: "Unsaved changes",
      content: "Do you want to save changes as draft before leaving?",
      okText: "Save Draft",
      cancelText: "Discard",
      onOk: async () => {
        await handleSaveDraft();
        nextAction();
      },
      onCancel: () => nextAction(),
    });
  };

  const handleDeleteDraft = () => {
    Modal.confirm({
      title: "Delete draft?",
      content: "This will permanently delete this draft and start fresh.",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        await deleteQuoteDraft(selectedDraftId);
        setDrafts((prev) => prev.filter((d) => d.id !== selectedDraftId));

        setSelectedDraftId(null);
        setQuoteStatus("DRAFT");
        setIsDirty(false);
        const primaryAddress = userData.user_address?.[0] || null;
        setFormData({
          ref: "",
          reference_type: "",
          serviceDates: null,
          dueDate: null,
          toCompany: userData?.user_profile?.name || "",

          address1: primaryAddress
            ? `${primaryAddress.address || ""}, ${
                primaryAddress.user_city?.name || ""
              }`
            : "",
          address2: primaryAddress
            ? `${primaryAddress.user_state?.name || ""}, ${
                primaryAddress.user_country?.name || ""
              }`
            : "",
          cc_email: userData?.cc_email || "",

          items: [
            {
              description: "",
              frequency: "",
              quantity: 1,
              calculation_type: "sqft",
              sqft: "N/A",
              unit_price: "",
              amount: "",
            },
          ],
          totalAmount: "",
          date: null,
          signature: "",
        });

        message.success("Draft deleted. You can start fresh.");
      },
    });
  };

  return (
    <Spin spinning={isLoading}>
      <div className="quote-form">
        <div className="quote-form__header">
          <img
            src={COMPANY_LOGO_URL}
            alt="Logo"
            className="quote-form__logo"
          />
          <div className="quote-form__title">SERVICE QUOTE</div>
        </div>

        <div className="quote-form__toolbar">
          <div>
            <Button type="text" icon={<ArrowLeft size={16} />} onClick={handleBack}>
              Back
            </Button>
          </div>

          <div className="quote-form__toolbar-right">
            {!selectedDraftId && (
              <Button
                type="default"
                onClick={handleSaveDraftClick}
                style={{ marginRight: 10 }}
              >
                Save Draft
              </Button>
            )}
            {drafts.length > 0 && (
              <Select
                style={{ width: 280 }}
                value={selectedDraftId}
                placeholder="Load a Draft"
                onChange={(id) => loadDraftById(id)}
              >
                {drafts.map((d) => (
                  <Option key={d.id} value={d.id}>
                    <span className="quote-form__draft-option">
                      <Folder size={14} />
                      {d.ref_type || "Draft"}: {d.ref_no || "No Ref"}
                    </span>
                  </Option>
                ))}
              </Select>
            )}

            {canDelete && quoteStatus === "DRAFT" && selectedDraftId && (
              <Button danger type="link" onClick={handleDeleteDraft}>
                Delete Draft
              </Button>
            )}
          </div>
        </div>

        {(links.estimate_id || links.cost_calculation_id) && (
          <Alert
            type="info"
            showIcon
            className="quote-form__source"
            title={
              links.estimate_id
                ? "This quote goes with the client's estimate: its lines start from the estimate's prices."
                : "This quote is priced from a cost calculation: its lines start from the newest bid."
            }
            description="Change the lines as needed. The quote keeps the link to its scope of work and calculation."
          />
        )}

        {(clientEstimates || []).length > 0 && (
          <div className="quote-form__goes-with">
            <strong>GOES WITH ESTIMATE:</strong>
            <Select
              allowClear
              placeholder="None"
              value={links.estimate_id}
              onChange={pickEstimate}
              style={{ minWidth: 280 }}
              options={clientEstimates.map((estimate) => ({
                value: estimate.id,
                label: `${estimate.client_company_name || `Estimate ${estimate.id}`}${estimate.signed_date ? ` · ${estimate.signed_date}` : ""}`,
              }))}
            />
            <span className="quote-form__hint">Its prices fill the lines; the quote keeps the link.</span>
          </div>
        )}

        <div className="quote-form__meta" style={{ marginBottom: 28 }}>
          <div>
            <strong>
              REF TYPE <span className="required-mark">*</span>:
            </strong>

            <Select
              value={formData.reference_type || undefined}
              placeholder="Select Ref Type"
              style={{ width: "100%", marginTop: 5 }}
              disabled={isLocked}
              onChange={async (value) => {
                setIsDirty(true);

                setFormData((prev) => ({
                  ...prev,
                  reference_type: value,
                }));

                // ❗ only auto-generate if ref is empty OR never edited
                if (!formData.ref || !isRefManuallyEdited) {
                  try {
                    const res = await getNextQuoteRef(value);

                    setFormData((prev) => ({
                      ...prev,
                      ref: dataOf(res)?.ref_no || prev.ref,
                    }));

                    setIsRefManuallyEdited(false); // system-generated
                  } catch (error) {
                    message.error(errorMessage(error, "Couldn't get the next reference number"));
                  }
                }
              }}
            >
              <Option value="RHK">RHK (Residential - Housekeeping)</Option>
              <Option value="RM">RM (Residential - Maintenance)</Option>
              <Option value="RFM">RFM (Residential - Floor Maintenance)</Option>
              <Option value="CHK">CHK (Commercial - Housekeeping)</Option>
              <Option value="CM">CM (Commercial - Maintenance)</Option>
              <Option value="CFM">CFM (Commercial - Floor Maintenance)</Option>
            </Select>
          </div>

          <div>
            <strong>
              REF # <span className="required-mark">*</span>:
            </strong>

            <Input
              value={formData.ref}
              placeholder="Enter reference number"
              onChange={(e) => {
                setIsDirty(true);
                setIsRefManuallyEdited(true); // 👈 user took control
                setFormData({ ...formData, ref: e.target.value });
              }}
            />
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

        <div className="quote-form__address" style={{ marginBottom: 24 }}>
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
              disabled={isLocked}
              placeholder="Company Name"
              value={formData.toCompany}
              onChange={(e) => {
                setIsDirty(true);
                setFormData({ ...formData, toCompany: e.target.value });
              }}
            />
            <br />
            <Input
              disabled={isLocked}
              placeholder="Address 1"
              value={formData.address1}
              onChange={(e) => {
                setIsDirty(true);
                setFormData({ ...formData, address1: e.target.value });
              }}
              style={{ marginTop: 8 }}
            />
            <br />
            <Input
              disabled={isLocked}
              placeholder="Address 2"
              value={formData.address2}
              onChange={(e) => {
                setIsDirty(true);
                setFormData({ ...formData, address2: e.target.value });
              }}
              style={{ marginTop: 8 }}
            />

            {/* CC Email (optional) */}
            <div style={{ marginTop: 12 }}>
              <strong>CC EMAIL:</strong>
              <Input
                disabled={isLocked || isCcLocked}
                placeholder="CC Email (optional)"
                value={formData.cc_email}
                onChange={(e) => {
                  setIsDirty(true);
                  setFormData({ ...formData, cc_email: e.target.value });
                }}
                style={{ marginTop: 5 }}
              />
              {isCcLocked && (
                <div className="quote-form__hint">
                  CC email is set on the customer profile.
                </div>
              )}
            </div>
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

        <div className="quote-form__footer" style={{ marginBottom: 24 }}>
          <div style={{ marginTop: "40px" }}>
            Date <span className="required-mark">*</span>:{" "}
            <DatePicker
              format="MM-DD-YYYY"
              value={formData.date}
              onChange={onQuoteDateChange}
              style={{ width: "100%" }}
              placeholder="Date"
            />
          </div>
          <div className="quote-form__signature" style={{ marginTop: 16 }}>
            <SignatureField formData={formData} setFormData={setFormData} />
          </div>
        </div>

        <div
          className="quote-form__disclaimer"
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

        <div className="quote-form__submit">
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

export default CreateServiceQuotePage;