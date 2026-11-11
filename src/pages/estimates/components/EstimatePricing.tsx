import { useState } from "react";
import { useNavigate } from "react-router";
import { Alert, AutoComplete, Button, Card, Form, Input, InputNumber, Select, Space, Spin, Tooltip, message } from "antd";
import { Calculator, FilePlus2, FileStack, Plus, Trash2 } from "lucide-react";
import { useApiQuery } from "@/hooks/useApiQuery";
import { getCostCalculation, listCostCalculations } from "@/services/api/costCalculatorApi";
import { getEstimateDraft } from "@/services/api/estimateApi";
import { listClientScopes } from "@/services/api/scopeApi";
import { dataOf, errorMessage, itemsOf } from "@/services/apiResult";
import { NEW_DOCUMENT_PATHS, clientPagePath } from "@/pages/clients/clientFlow";
import { formatDate } from "@/utils/datetime";
import { formatMoney } from "@/utils/format";
import { FREQUENCY_OPTIONS, priceLinesOf, priceTotal, requestLinesOf, type PriceLineValues } from "../estimateFields";
import type { Id } from "@/types";

const needsALine = {
  validator: async (_: unknown, lines: PriceLineValues[] | undefined) => {
    if (!(lines || []).some((line) => line?.name?.trim())) {
      throw new Error("Add a price line, or pick a calculation to price the estimate");
    }
  },
};

/**
 * What an estimate is made from and what it charges (step 5 of the client
 * flow): the scope of work it prints, the cost calculation and bid it is
 * priced from, and the price lines the client sees, which the office can
 * change. Picking a calculation or a bid prices the lines again; the client
 * never sees the costs, margins or commission behind them. Inside the
 * estimate's Form.
 */
const EstimatePricing = ({ clientId, isEdit = false }: { clientId?: Id | null; isEdit?: boolean }) => {
  const form = Form.useFormInstance();
  const navigate = useNavigate();
  const scopeId = Form.useWatch<number | undefined>("scope_of_work_id", form);
  const calculationId = Form.useWatch<number | undefined>("cost_calculation_id", form);
  const lines = Form.useWatch<PriceLineValues[] | undefined>("price_lines", form);
  const [pricing, setPricing] = useState(false);

  const { data: scopes, loading: loadingScopes } = useApiQuery(
    () => listClientScopes(clientId ?? 0).then(itemsOf),
    [clientId],
    { initial: [], skip: !clientId, errorText: "Couldn't load the client's scopes" },
  );
  const { data: calculations } = useApiQuery(
    () => listCostCalculations({ client_id: clientId, limit: 50 }).then(itemsOf),
    [clientId],
    { initial: [], skip: !clientId, errorText: "Couldn't load the client's calculations" },
  );
  const { data: calculation } = useApiQuery(() => getCostCalculation(calculationId ?? 0).then(dataOf), [calculationId], {
    skip: !calculationId,
    errorText: "Couldn't load the calculation's bids",
  });
  const bids = calculationId && calculation && calculation.id === calculationId ? (calculation.bids ?? []) : [];

  // The draft for these sources: the links it settles on, and the lines when it has a calculation.
  const reprice = async (sources: { scopeId?: Id | null; calculationId?: Id | null; bidId?: Id | null }) => {
    if (!clientId) return;
    setPricing(true);
    try {
      const draft = dataOf(await getEstimateDraft({ clientId, ...sources }));
      const priced = draft.price_lines?.length > 0;
      form.setFieldsValue({
        scope_of_work_id: draft.scope_of_work_id ?? undefined,
        cost_calculation_id: draft.cost_calculation_id ?? undefined,
        bid_id: draft.bid_id ?? undefined,
        // The calculation's lines, and any a service request added (those stay)
        ...(priced
          ? { price_lines: [...priceLinesOf(draft.price_lines), ...requestLinesOf(form.getFieldValue("price_lines"))] }
          : {}),
        ...(draft.frequency && !form.getFieldValue("frequency") ? { frequency: draft.frequency } : {}),
      });
      if (priced) message.success("Prices filled in from the calculation; change them as needed");
    } catch (error) {
      message.error(errorMessage(error, "Couldn't price the estimate"));
    } finally {
      setPricing(false);
    }
  };

  const pickScope = (id: number | undefined) => {
    const current = calculations.find((calc) => calc.id === form.getFieldValue("cost_calculation_id"));
    const keepCalculation = current && (!id || current.scope_of_work_id === id);
    form.setFieldsValue({
      scope_of_work_id: id,
      ...(keepCalculation ? {} : { cost_calculation_id: undefined, bid_id: undefined }),
    });
  };

  const pickCalculation = (id: number | undefined) => {
    const calc = calculations.find((row) => row.id === id);
    form.setFieldsValue({
      cost_calculation_id: id,
      bid_id: undefined,
      ...(calc?.scope_of_work_id ? { scope_of_work_id: calc.scope_of_work_id } : {}),
    });
    if (id) reprice({ scopeId: calc?.scope_of_work_id ?? form.getFieldValue("scope_of_work_id"), calculationId: id });
  };

  const pickBid = (id: number | undefined) => {
    form.setFieldsValue({ bid_id: id });
    reprice({ scopeId, calculationId, bidId: id });
  };

  if (!clientId) {
    return (
      <Card title="Scope and Price" className="form-card">
        <p className="text-secondary">Choose the client to pick the scope of work and price the estimate.</p>
      </Card>
    );
  }

  const scopeOptions = scopes.map((scope) => ({
    value: scope.id,
    label: `${scope.title}${scope.client_sheet ? ` (from "${scope.client_sheet.title}")` : ""}`,
  }));
  const calculationOptions = calculations
    .filter((calc) => !scopeId || !calc.scope_of_work_id || calc.scope_of_work_id === scopeId)
    .map((calc) => ({
      value: calc.id,
      label: `${calc.property_name || `Calculation ${calc.id}`} · cost ${formatMoney(calc.total_operational_cost)} · ${formatDate(calc.created_at)}`,
    }));
  const bidOptions = bids.map((bid, index) => ({
    value: bid.id,
    label: `${formatMoney(bid.recommended_bid)} recommended · ${bid.profit_margin_percentage}% margin · ${formatDate(bid.created_at)}${index === 0 ? " (newest)" : ""}`,
  }));

  return (
    <Card title="Scope and Price" className="form-card">
      <Spin spinning={pricing}>
        {!loadingScopes && scopes.length === 0 && (
          <Alert
            type="warning"
            showIcon
            className="estimate-pricing__alert"
            title="This client has no scope of work yet, so the estimate would print no tasks."
            action={
              <Button size="small" onClick={() => navigate(clientPagePath(clientId, "scopes"))}>
                Make One
              </Button>
            }
          />
        )}
        <div className="form-grid form-grid--2">
          <Form.Item
            label="Scope of Work"
            name="scope_of_work_id"
            extra={
              isEdit
                ? "Another scope replaces this estimate's copy of the tasks when it is saved."
                : "The tasks the estimate prints."
            }
          >
            <Select allowClear placeholder="Pick a scope" options={scopeOptions} onChange={pickScope} />
          </Form.Item>
          <Form.Item label="Priced From" name="cost_calculation_id" extra="A calculation of this client's, for that scope.">
            <Select
              allowClear
              placeholder={calculationOptions.length ? "Pick a calculation" : "No calculation for this scope yet"}
              options={calculationOptions}
              onChange={pickCalculation}
            />
          </Form.Item>
        </div>
        {calculationId ? (
          <Form.Item label="Bid" name="bid_id" extra="The bid's recommended price is shared out over the lines.">
            <Select placeholder="The newest bid" options={bidOptions} onChange={pickBid} />
          </Form.Item>
        ) : (
          <Form.Item name="bid_id" hidden>
            <Input />
          </Form.Item>
        )}
        <Space wrap className="estimate-pricing__links">
          {scopeId && (
            <Button size="small" icon={<FileStack size={14} />} onClick={() => navigate(`/scopes/${scopeId}`)}>
              Check the Scope's Tasks
            </Button>
          )}
          {!calculationId && (
            <Button
              size="small"
              icon={<Calculator size={14} />}
              onClick={() => navigate(NEW_DOCUMENT_PATHS.calculation(clientId, { scopeId }))}
            >
              Price the Scope in the Calculator
            </Button>
          )}
        </Space>

        <span className="field-label">Price Lines (what the client sees)</span>
        <Form.List name="price_lines" rules={[needsALine]}>
          {(fields, { add, remove }, { errors }) => (
            <>
              <div className="price-lines">
                <div className="price-lines__row price-lines__row--head" aria-hidden="true">
                  <span>Service</span>
                  <span>Frequency</span>
                  <span>Price</span>
                  <span>Hours</span>
                  <span>Crew</span>
                  <span />
                </div>
                {fields.map((field) => (
                  <div key={field.key} className="price-lines__row">
                    <Form.Item
                      name={[field.name, "name"]}
                      rules={[{ required: true, whitespace: true, message: "Name the service" }]}
                    >
                      <Input
                        placeholder="Advance Cleaning Services"
                        aria-label="Service"
                        suffix={
                          lines?.[field.name]?.service_request_id ? (
                            <Tooltip title="Added by a service request. Editing the request changes this line; deleting it takes the line out.">
                              <FilePlus2 size={14} className="price-lines__from-request" aria-label="From a service request" />
                            </Tooltip>
                          ) : undefined
                        }
                      />
                    </Form.Item>
                    <Form.Item name={[field.name, "service_request_id"]} hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item name={[field.name, "frequency"]}>
                      <AutoComplete options={FREQUENCY_OPTIONS} placeholder="Weekly" aria-label="Frequency" />
                    </Form.Item>
                    <Form.Item name={[field.name, "price"]} rules={[{ required: true, message: "Price it" }]}>
                      <InputNumber min={0} prefix="$" style={{ width: "100%" }} aria-label="Price" />
                    </Form.Item>
                    <Form.Item name={[field.name, "hours"]}>
                      <InputNumber min={0} style={{ width: "100%" }} aria-label="Hours" />
                    </Form.Item>
                    <Form.Item name={[field.name, "personnel"]}>
                      <InputNumber min={0} precision={0} style={{ width: "100%" }} aria-label="Crew" />
                    </Form.Item>
                    <Button
                      type="text"
                      danger
                      aria-label="Remove line"
                      icon={<Trash2 size={16} />}
                      onClick={() => remove(field.name)}
                    />
                  </div>
                ))}
              </div>
              <Form.ErrorList errors={errors} />
              <div className="price-lines__foot">
                <Button
                  icon={<Plus size={16} />}
                  onClick={() => add({ name: "", frequency: form.getFieldValue("frequency") || undefined, price: null })}
                >
                  Add Line
                </Button>
                <strong>Total {formatMoney(priceTotal(lines))}</strong>
              </div>
            </>
          )}
        </Form.List>
      </Spin>
    </Card>
  );
};

export default EstimatePricing;
