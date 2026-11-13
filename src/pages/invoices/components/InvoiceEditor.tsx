import { useMemo, useRef, useState } from "react";
import {
  Button,
  Checkbox,
  DatePicker,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Table,
  Tooltip,
  message,
  type TableColumnsType,
} from "antd";
import { ChevronDown, GripVertical, Info, Plus, Trash2 } from "lucide-react";
import ClientSelect from "@/components/ClientSelect";
import SignatureField from "@/components/SignatureField";
import { COMPANY_ADDRESS, COMPANY_LOGO_URL } from "@/config/brand";
import { useApiQuery } from "@/hooks/useApiQuery";
import { listAddresses } from "@/services/api/addressApi";
import { getNextInvoiceRef } from "@/services/api/invoiceApi";
import { listServiceNames } from "@/services/api/serviceApi";
import { dataOf, errorMessage, itemsOf } from "@/services/apiResult";
import { DATE_FORMAT } from "@/utils/datetime";
import { formatMoney } from "@/utils/format";
import LineTimesCell from "./LineTimesCell";
import {
  BALANCE_DATE_LOCKED_STAGES,
  CALCULATION_TYPE_OPTIONS,
  DEFAULT_DEPOSIT_PERCENTAGE,
  FREQUENCY_OPTIONS,
  IS_RECURRING_OPTIONS,
  RECURRING_FREQUENCY_OPTIONS,
  REF_TYPE_OPTIONS,
  TERMS_LOCKED_STAGES,
  addressLabel,
  addressLinesOf,
  newLine,
  parseHourRange,
  priceLines,
  type InvoiceFormValues,
  type InvoiceLine,
} from "../invoiceFields";
import type { Address, ClientPick } from "@/types";
import "../invoices.scss";

const chevron = <ChevronDown size={16} color="var(--color-text)" />;

// A line's measure resets with its type: square feet or hours, never both.
const TYPE_RESET: Partial<InvoiceLine> = { sqft: "N/A", hour: "", hour_raw: "" };

/** A line as the table shows it, keyed by its id or place. */
type LineRow = InvoiceLine & { key: number | string };

export interface InvoiceEditorProps {
  mode?: "create" | "edit";
  initialValues: InvoiceFormValues;
  clients?: ClientPick[];
  clientLocked?: boolean;
  clientName?: string | null;
  initialAddresses?: Address[];
  initialAddressId?: number;
  paymentStage?: string | null;
  submitLabel: string;
  submitHint?: string;
  onSubmit: (values: InvoiceFormValues) => Promise<void>;
  /** Saves the order of the saved lines (edit). */
  onReorder?: (items: { id: number }[]) => Promise<unknown>;
}

/**
 * The invoice as a document: its reference, dates, repeat and deposit terms,
 * who it's to, its lines (with the time on site) and the signature. Amounts
 * and the total follow the lines as they change.
 *
 * mode "create": the ref type gives the next reference; the client is picked
 * here, or fixed (`clientLocked`) when the form came from the client page or
 * a contract. mode "edit": the reference and client stay; once a payment is
 * in (`paymentStage`) the deposit terms are fixed. `onReorder(items)` saves
 * the order of saved lines when one is dragged (edit).
 */
const InvoiceEditor = ({
  mode = "create",
  initialValues,
  clients = [],
  clientLocked = false,
  clientName,
  initialAddresses = [],
  initialAddressId,
  paymentStage,
  submitLabel,
  submitHint,
  onSubmit,
  onReorder,
}: InvoiceEditorProps) => {
  const isEdit = mode === "edit";
  const [values, setValues] = useState<InvoiceFormValues>(initialValues);
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [addressId, setAddressId] = useState<number | undefined>(initialAddressId);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragged, setDragged] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const pickedClient = useRef<number | undefined>(initialValues.user_id);

  const { data: services } = useApiQuery(() => listServiceNames().then(itemsOf), [], {
    initial: [],
    errorText: "Couldn't load the services",
  });

  const priced = useMemo(() => priceLines(values.items), [values.items]);
  const termsLocked = TERMS_LOCKED_STAGES.includes(paymentStage);
  const balanceDateLocked = BALANCE_DATE_LOCKED_STAGES.includes(paymentStage);
  const depositPercent = Number(values.deposit_percentage) || DEFAULT_DEPOSIT_PERCENTAGE;
  const depositNow = (priced.total * depositPercent) / 100;

  const set = <K extends keyof InvoiceFormValues>(field: K, value: InvoiceFormValues[K]) =>
    setValues((prev) => ({ ...prev, [field]: value }));
  const setLine = (index: number, changes: Partial<InvoiceLine>) =>
    setValues((prev) => ({
      ...prev,
      items: prev.items.map((line, i) => (i === index ? { ...line, ...changes } : line)),
    }));

  // ----- reference and client (create)

  const pickRefType = async (refType: string) => {
    set("reference_type", refType);
    try {
      const { ref_no: ref } = await getNextInvoiceRef(refType).then(dataOf);
      setValues((prev) => (prev.reference_type === refType ? { ...prev, ref } : prev));
    } catch (error) {
      message.error(errorMessage(error, "Couldn't get the next reference"));
    }
  };

  const pickAddress = (id: number, list: Address[] = addresses) => {
    setAddressId(id);
    const lines = addressLinesOf(list.find((address) => address.id === id));
    setValues((prev) => ({ ...prev, ...lines }));
  };

  const pickClient = async (client: ClientPick | undefined) => {
    pickedClient.current = client?.id;
    setValues((prev) => ({ ...prev, user_id: client?.id, toCompany: client?.name || "", address1: "", address2: "" }));
    setAddresses([]);
    setAddressId(undefined);
    if (!client) return;
    setLoadingAddresses(true);
    try {
      const list = await listAddresses(client.id).then(itemsOf);
      if (pickedClient.current !== client.id) return;
      setAddresses(list);
      const primary = list.find((address) => address.is_primary) || list[0];
      if (primary) pickAddress(primary.id, list);
    } catch (error) {
      message.error(errorMessage(error, "Couldn't load the client's addresses"));
    } finally {
      setLoadingAddresses(false);
    }
  };

  // ----- lines

  const addLine = () => setValues((prev) => ({ ...prev, items: [...prev.items, newLine()] }));

  const deleteLine = (index: number) => {
    if (values.items.length === 1) {
      message.warning("An invoice needs at least one line");
      return;
    }
    setValues((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const pickService = (index: number, serviceId: number | undefined) => {
    const service = services.find((s) => s.id === serviceId);
    setLine(index, { service_id: serviceId, description: service?.name || "" });
  };

  const readHours = (index: number, text: string) => {
    const hours = parseHourRange(text);
    if (hours === null) {
      if (text.trim()) message.warning('Couldn\'t read that time. Try "2:00 PM - 4:00 PM" or "14:00 - 16:00".');
      return;
    }
    setLine(index, { hour: hours });
  };

  const drop = async (dropIndex: number) => {
    const from = dragged;
    setDragged(null);
    setDragOver(null);
    if (from === null || from < 0 || dropIndex < 0 || from === dropIndex) return;
    const previous = values.items;
    const items = [...previous];
    const [moved] = items.splice(from, 1);
    items.splice(dropIndex, 0, moved);
    set("items", items);
    const saved = items.flatMap((item) => (item.id ? [{ id: item.id }] : []));
    if (!onReorder || !saved.length) return;
    try {
      await onReorder(saved);
      message.success("Line order saved");
    } catch (error) {
      message.error(errorMessage(error, "Couldn't save the line order"));
      set("items", previous);
    }
  };

  const submit = async () => {
    setSaving(true);
    try {
      await onSubmit({ ...values, items: priced.items });
    } finally {
      setSaving(false);
    }
  };

  const columns: TableColumnsType<LineRow> = [
    {
      title: "",
      key: "drag_handle",
      width: 36,
      render: () => (
        <div title="Drag to reorder" className="invoice-editor__drag-handle">
          <GripVertical size={16} />
        </div>
      ),
    },
    {
      title: (
        <span>
          Description / Service <span className="required-mark">*</span>
        </span>
      ),
      key: "description",
      width: 240,
      render: (_value, line, index) => (
        <div className="invoice-editor__description">
          <Select
            placeholder="Pick a service"
            value={line.service_id || undefined}
            onChange={(value) => pickService(index, value)}
            allowClear
            showSearch
            optionFilterProp="label"
            options={services.map((service) => ({ value: service.id, label: service.name }))}
          />
          <Input
            placeholder="Or type a description"
            value={line.description}
            onChange={(e) => setLine(index, { description: e.target.value })}
            disabled={Boolean(line.service_id)}
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
      key: "frequency",
      width: 140,
      render: (_value, line, index) => (
        <Select
          value={line.frequency || undefined}
          placeholder="Frequency"
          style={{ width: "100%" }}
          onChange={(value) => setLine(index, { frequency: value })}
          allowClear
          options={FREQUENCY_OPTIONS}
        />
      ),
    },
    {
      title: "Quantity",
      key: "quantity",
      width: 90,
      render: (_value, line, index) => (
        <InputNumber
          min={1}
          step={1}
          value={line.quantity}
          onChange={(value) => setLine(index, { quantity: value ?? 1 })}
          style={{ width: "100%" }}
        />
      ),
    },
    {
      title: "Type",
      key: "calculation_type",
      width: 100,
      render: (_value, line, index) => (
        <Select
          value={line.calculation_type || "na"}
          style={{ width: "100%" }}
          onChange={(value) => setLine(index, { calculation_type: value, ...TYPE_RESET })}
          options={CALCULATION_TYPE_OPTIONS}
        />
      ),
    },
    {
      title: (
        <span className="invoice-editor__column-title">
          Sqft / Hours
          <Tooltip title='For hours, type a time range like "2:00 PM - 4:00 PM" or "14:00 - 16:00", or the number of hours.'>
            <Info size={14} className="invoice-editor__info-icon" />
          </Tooltip>
        </span>
      ),
      key: "measurement",
      width: 170,
      render: (_value, line, index) => {
        if (line.calculation_type === "hour") {
          return (
            <div>
              <Input
                value={line.hour_raw ?? ""}
                placeholder="e.g. 2:00 PM - 4:00 PM"
                onChange={(e) => setLine(index, { hour_raw: e.target.value })}
                onBlur={(e) => readHours(index, e.target.value)}
              />
              {line.hour !== "" && line.hour !== undefined && line.hour !== null && (
                <div className="invoice-editor__hint invoice-editor__hint--tight">= {line.hour} hrs</div>
              )}
            </div>
          );
        }
        if (line.calculation_type === "sqft") {
          return (
            <Input
              value={line.sqft === "N/A" ? "" : line.sqft}
              placeholder="Sqft"
              inputMode="numeric"
              onChange={(e) => {
                const text = e.target.value;
                if (text === "" || /^\d*$/.test(text)) setLine(index, { sqft: text === "" ? "N/A" : text });
              }}
            />
          );
        }
        return <Input value="N/A" disabled />;
      },
    },
    {
      title: (
        <span>
          Unit Price <span className="required-mark">*</span>
        </span>
      ),
      key: "unit_price",
      width: 130,
      render: (_value, line, index) => (
        <InputNumber
          min={0}
          prefix="$"
          value={line.unit_price === "" ? null : Number(line.unit_price)}
          onChange={(value) => setLine(index, { unit_price: value ?? "" })}
          style={{ width: "100%" }}
          placeholder="0.00"
        />
      ),
    },
    {
      title: "Amount",
      key: "amount",
      width: 120,
      align: "right",
      render: (_value, _line, index) => formatMoney(priced.items[index]?.amount ?? 0),
    },
    {
      title: (
        <span className="invoice-editor__column-title">
          Time on Site
          <Tooltip title="When the crew was there, printed on the PDF. Both times or neither; an end before the start ran past midnight. It doesn't change the amount.">
            <Info size={14} className="invoice-editor__info-icon" />
          </Tooltip>
        </span>
      ),
      key: "time_on_site",
      width: 220,
      render: (_value, line, index) => (
        <LineTimesCell start={line.start_time} end={line.end_time} onChange={(changes) => setLine(index, changes)} />
      ),
    },
    {
      title: "",
      key: "action",
      width: 56,
      render: (_value, _line, index) => (
        <Popconfirm title="Delete this line?" onConfirm={() => deleteLine(index)}>
          <Button danger type="text" aria-label="Delete line" icon={<Trash2 size={16} />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="invoice-form-container">
      <div className="invoice-form">
        <div className="header">
          <img src={COMPANY_LOGO_URL} alt="Logo" className="logo1" />
          <div className="quote-title">INVOICE</div>
        </div>
      </div>

      <div className="invoice-meta-container">
        {/* Reference */}
        <div className="meta-table" style={{ gap: 20, marginBottom: 20 }}>
          <div>
            <strong>
              REF TYPE {!isEdit && <span className="required-mark">*</span>}
            </strong>
            {isEdit ? (
              <Input style={{ marginTop: 5 }} value={values.reference_type} disabled />
            ) : (
              <Select
                value={values.reference_type}
                placeholder="Pick a ref type"
                style={{ width: "100%", marginTop: 5 }}
                suffix={chevron}
                onChange={pickRefType}
                options={REF_TYPE_OPTIONS}
              />
            )}
          </div>

          <div>
            <strong>REF #</strong>
            <div className="invoice-editor__ref">{values.ref || "—"}</div>
            {!isEdit && (
              <div className="invoice-editor__hint">
                {values.ref ? "The next free number, given when the invoice is saved" : "Comes with the ref type"}
              </div>
            )}
            <div style={{ marginTop: 8 }}>
              <Checkbox
                checked={values.useCustomRef}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    useCustomRef: e.target.checked,
                    custom_ref_no: e.target.checked ? prev.custom_ref_no : "",
                  }))
                }
              >
                Use a custom reference number
              </Checkbox>
              {values.useCustomRef && (
                <Input
                  style={{ marginTop: 8 }}
                  placeholder="e.g. RHK100"
                  value={values.custom_ref_no}
                  onChange={(e) => set("custom_ref_no", e.target.value)}
                />
              )}
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="meta-table" style={{ gap: 20, marginBottom: 20 }}>
          <div>
            <strong>
              BILLING DATE <span className="required-mark">*</span>
            </strong>
            <DatePicker
              value={values.billing_date}
              onChange={(date) => set("billing_date", date)}
              format={DATE_FORMAT}
              style={{ width: "100%", marginTop: 5 }}
            />
            <div className="invoice-editor__hint">It goes to the client on this date</div>
          </div>
          <div>
            <strong>
              SERVICE START <span className="required-mark">*</span>
            </strong>
            <DatePicker
              value={values.service_start}
              onChange={(date) => set("service_start", date)}
              format={DATE_FORMAT}
              style={{ width: "100%", marginTop: 5 }}
            />
          </div>
          <div>
            <strong>
              SERVICE END <span className="required-mark">*</span>
            </strong>
            <DatePicker
              value={values.service_end}
              onChange={(date) => set("service_end", date)}
              format={DATE_FORMAT}
              style={{ width: "100%", marginTop: 5 }}
            />
          </div>
          <div>
            <strong>
              DUE DATE <span className="required-mark">*</span>
            </strong>
            <DatePicker
              value={values.dueDate}
              onChange={(date) => set("dueDate", date)}
              format={DATE_FORMAT}
              style={{ width: "100%", marginTop: 5 }}
            />
          </div>
        </div>

        {/* Repeat */}
        <div className="meta-table" style={{ gap: 20, marginBottom: 20 }}>
          <div>
            <strong>REPEATING INVOICE?</strong>
            <Select
              value={values.is_recurring}
              style={{ width: "100%", marginTop: 5 }}
              suffix={chevron}
              onChange={(value) => set("is_recurring", value)}
              options={IS_RECURRING_OPTIONS}
            />
          </div>
          <div style={{ visibility: values.is_recurring ? "visible" : "hidden" }}>
            <strong>HOW OFTEN</strong>
            <Select
              value={values.recurring_frequency}
              style={{ width: "100%", marginTop: 5 }}
              suffix={chevron}
              onChange={(value) => set("recurring_frequency", value)}
              options={RECURRING_FREQUENCY_OPTIONS}
            />
          </div>
          <div style={{ visibility: values.is_recurring ? "visible" : "hidden" }}>
            <strong>REPEAT UNTIL</strong>
            <DatePicker
              value={values.recurring_end_date}
              onChange={(date) => set("recurring_end_date", date)}
              format={DATE_FORMAT}
              style={{ width: "100%", marginTop: 5 }}
            />
            <div className="invoice-editor__hint">At most 6 months after the billing date</div>
          </div>
          <div style={{ visibility: values.is_recurring ? "visible" : "hidden" }}>
            <strong>OR A NUMBER OF TIMES</strong>
            <InputNumber
              min={1}
              max={10}
              value={values.recurring_max_occurrences}
              onChange={(value) => set("recurring_max_occurrences", value)}
              style={{ width: "100%", marginTop: 5 }}
            />
            <div className="invoice-editor__hint">At most 10</div>
          </div>
        </div>

        {/* Deposit */}
        <div className="meta-table" style={{ gap: 20, marginBottom: 20 }}>
          <div>
            <strong>DEPOSIT</strong>
            <div style={{ marginTop: 5 }}>
              <Checkbox
                checked={values.deposit_required}
                disabled={termsLocked}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    deposit_required: e.target.checked,
                    balance_date: e.target.checked ? prev.balance_date : null,
                  }))
                }
              >
                Collect {depositPercent}% now, the balance later
              </Checkbox>
            </div>
            {values.deposit_required && (
              <div className="invoice-editor__hint">
                Due now: {formatMoney(depositNow)} · Balance: {formatMoney(priced.total - depositNow)}
              </div>
            )}
            {termsLocked && <div className="invoice-editor__hint">A payment is in, so the deposit terms stay.</div>}
          </div>
          {values.deposit_required && (
            <div>
              <strong>
                BALANCE SENT ON <span className="required-mark">*</span>
              </strong>
              <DatePicker
                value={values.balance_date}
                onChange={(date) => set("balance_date", date)}
                format={DATE_FORMAT}
                style={{ width: "100%", marginTop: 5 }}
                disabled={balanceDateLocked}
              />
              <div className="invoice-editor__hint">The balance invoice goes to the client on this date</div>
            </div>
          )}
        </div>
      </div>

      <div className="address-table" style={{ gap: 24, marginBottom: 24, alignItems: "start" }}>
        <div>
          <strong>FROM:</strong>
          <br />
          SOCIAL SANITATION COMMERCIAL CLEANING SOLUTIONS
          <br />
          {COMPANY_ADDRESS.line1}
          <br />
          {COMPANY_ADDRESS.line2}
        </div>
        <div>
          <strong>
            CLIENT <span className="required-mark">*</span>
          </strong>
          {isEdit ? (
            <Input style={{ marginTop: 5 }} value={clientName || values.toCompany} disabled />
          ) : (
            <ClientSelect
              clients={clients}
              value={values.user_id}
              locked={clientLocked}
              onPick={pickClient}
              style={{ width: "100%", marginTop: 5 }}
            />
          )}
        </div>
        <div>
          <strong>
            TO: <span className="required-mark">*</span>
          </strong>
          {addresses.length > 1 && (
            <Select
              placeholder="Pick an address"
              style={{ width: "100%", marginTop: 5, marginBottom: 8 }}
              value={addressId}
              loading={loadingAddresses}
              onChange={(id) => pickAddress(id)}
              options={addresses.map((address) => ({ value: address.id, label: addressLabel(address) }))}
            />
          )}
          <div className="invoice-editor__to">
            <Input placeholder="Company name" value={values.toCompany} onChange={(e) => set("toCompany", e.target.value)} />
            <Input placeholder="Address line 1" value={values.address1} onChange={(e) => set("address1", e.target.value)} />
            <Input placeholder="Address line 2" value={values.address2} onChange={(e) => set("address2", e.target.value)} />
          </div>
        </div>
        <div>
          <strong>TOTAL DUE:</strong>
          <div className="invoice-editor__total-due">{formatMoney(priced.total)}</div>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <strong>EVENT NAME</strong>
        <Input
          style={{ width: "100%", marginTop: 5 }}
          placeholder="Optional"
          value={values.event_name}
          onChange={(e) => set("event_name", e.target.value)}
        />
      </div>

      <div className="invoice-editor__drag-tip">
        <span>
          Drag <GripVertical size={12} /> to reorder lines
        </span>
      </div>

      <div className="invoice-editor__items">
        <Table
          size="small"
          tableLayout="fixed"
          scroll={{ x: 1300 }}
          rowKey={(line) => line.key}
          dataSource={values.items.map((line, index) => ({ ...line, key: line.id ?? `new-${index}` }))}
          columns={columns}
          pagination={false}
          onRow={(_, index = -1) => ({
            draggable: true,
            onDragStart: () => setDragged(index),
            onDragOver: (e) => {
              e.preventDefault();
              if (index !== dragOver) setDragOver(index);
            },
            onDrop: () => drop(index),
            onDragEnd: () => {
              setDragged(null);
              setDragOver(null);
            },
            style: {
              cursor: "grab",
              opacity: dragged === index ? 0.5 : 1,
              backgroundColor: dragOver === index && dragged !== index ? "var(--color-primary-subtle)" : undefined,
              transition: "background-color 0.15s ease, opacity 0.15s ease",
            },
          })}
          footer={() => <div className="invoice-editor__total">Total: {formatMoney(priced.total)}</div>}
        />
      </div>

      <div style={{ marginTop: 16, marginBottom: 16 }}>
        <Button icon={<Plus size={16} />} onClick={addLine}>
          Add Line
        </Button>
      </div>

      <div className="footer-section" style={{ marginBottom: 24 }}>
        <div style={{ marginTop: 40 }}>
          Date <span className="required-mark">*</span>:{" "}
          <DatePicker
            format={DATE_FORMAT}
            value={values.date}
            onChange={(date) => set("date", date)}
            style={{ width: "100%" }}
            placeholder="Invoice date"
          />
        </div>
        <div className="signature-block" style={{ marginTop: 16 }}>
          <SignatureField formData={values} setFormData={setValues} />
        </div>
      </div>

      <div className="disclaimer" style={{ marginTop: 60, textAlign: "justify" }}>
        Invoices are sent on the last business day of each month and are to be paid within 5 business days of due
        date. All late payments are subject to late fees of $30, every 5-business day period after the service month.
        If needed, the pay options above can change but it is necessary to change payment arrangements 5 business days
        before the end of the current service month if check or ACH. Payments made via credit or debit card can be
        made at any time. All late fees will be added to the invoice of the following service month, to fully satisfy
        the invoice for the previous service month.
      </div>

      <div className="invoice-editor__submit">
        {submitHint && <span className="invoice-editor__hint">{submitHint}</span>}
        <Button type="primary" size="large" onClick={submit} loading={saving}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );
};

export default InvoiceEditor;
