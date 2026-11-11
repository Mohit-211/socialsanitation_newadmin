import { useState } from "react";
import { AutoComplete, Button, Card, DatePicker, Form, Input, message } from "antd";
import ClientSelect from "@/components/ClientSelect";
import SignatureField from "@/components/SignatureField";
import { getEstimateDraft } from "@/services/api/estimateApi";
import { dataOf, errorMessage } from "@/services/apiResult";
import { DATE_FORMAT } from "@/utils/datetime";
import { FREQUENCY_OPTIONS, estimateBody, valuesFromDraft, type EstimateFormValues } from "../estimateFields";
import type { ClientPick, EstimateInput } from "@/types";
import EstimatePricing from "./EstimatePricing";

/**
 * An estimate's fields: the client (on a new estimate), the company and its
 * address, the scope and price, the contact, the visit frequency, the date
 * and the admin's signature. Choosing a client fills in what the API's draft
 * has for them. `onSubmit` gets the estimate as the API takes it;
 * `onClientPick` hears which client was chosen.
 */
export interface EstimateFormProps {
  initialValues: EstimateFormValues;
  initialSignature?: string;
  /** The client of an existing estimate. */
  userId?: number;
  clients?: ClientPick[];
  lockClient?: boolean;
  isNew?: boolean;
  submitLabel: string;
  onSubmit: (estimate: EstimateInput) => Promise<void> | void;
  onClientPick?: (client: ClientPick | undefined) => void;
}

const EstimateForm = ({
  initialValues,
  initialSignature = "",
  userId,
  clients,
  lockClient,
  isNew,
  submitLabel,
  onSubmit,
  onClientPick,
}: EstimateFormProps) => {
  const [form] = Form.useForm<EstimateFormValues>();
  const [signature, setSignature] = useState({ signature: initialSignature });
  const [saving, setSaving] = useState(false);
  const pickedClientId = Form.useWatch<number | undefined>("user_id", form);
  const clientId = isNew ? pickedClientId : userId;

  const startFor = async (client: ClientPick | undefined) => {
    onClientPick?.(client);
    if (!client) return;
    try {
      const draft = dataOf(await getEstimateDraft({ clientId: client.id }));
      form.setFieldsValue(valuesFromDraft(draft));
    } catch (error) {
      message.error(errorMessage(error, "Couldn't fill in the client's details"));
    }
  };

  const finish = async (values: EstimateFormValues) => {
    if (!signature.signature) {
      message.error("Add your signature first");
      return;
    }
    setSaving(true);
    try {
      await onSubmit(estimateBody(values, { userId: isNew ? values.user_id : userId, signature: signature.signature }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Form form={form} layout="vertical" initialValues={initialValues} onFinish={finish} requiredMark="optional">
      <Card title="Client and Company" className="form-card">
        {isNew && (
          <Form.Item label="Client" name="user_id" rules={[{ required: true, message: "Choose the client" }]}>
            <ClientSelect clients={clients} locked={lockClient} onPick={startFor} />
          </Form.Item>
        )}
        <Form.Item
          label="Company Name"
          name="client_company_name"
          rules={[{ required: true, whitespace: true, message: "Enter the company name" }]}
        >
          <Input />
        </Form.Item>
        <div className="form-grid form-grid--2">
          <Form.Item label="Address Line 1" name="address_line_1">
            <Input />
          </Form.Item>
          <Form.Item label="Address Line 2" name="address_line_2">
            <Input />
          </Form.Item>
        </div>
        <div className="form-grid form-grid--3">
          <Form.Item label="City" name="city">
            <Input />
          </Form.Item>
          <Form.Item label="State" name="state">
            <Input />
          </Form.Item>
          <Form.Item label="ZIP Code" name="zip">
            <Input />
          </Form.Item>
        </div>
      </Card>

      <EstimatePricing clientId={clientId} isEdit={!isNew} />

      <Card title="Contact" className="form-card">
        <div className="form-grid form-grid--2">
          <Form.Item label="Contact Name" name="contact_name">
            <Input />
          </Form.Item>
          <Form.Item label="Email" name="contact_email" rules={[{ type: "email", message: "Enter a valid email" }]}>
            <Input type="email" />
          </Form.Item>
          <Form.Item label="Phone" name="contact_phone">
            <Input type="tel" />
          </Form.Item>
          <Form.Item label="Fax" name="contact_fax">
            <Input />
          </Form.Item>
        </div>
      </Card>

      <Card title="Service and Signature" className="form-card">
        <div className="form-grid form-grid--2">
          <Form.Item label="Visit Frequency" name="frequency" extra="Printed on the estimate">
            <AutoComplete options={FREQUENCY_OPTIONS} placeholder="Weekly" />
          </Form.Item>
          <Form.Item label="Date" name="signed_date" rules={[{ required: true, message: "Pick the date" }]}>
            <DatePicker format={DATE_FORMAT} style={{ width: "100%" }} />
          </Form.Item>
        </div>
        <span className="field-label">Your Signature</span>
        <SignatureField formData={signature} setFormData={setSignature} />
      </Card>

      <Button type="primary" htmlType="submit" size="large" loading={saving} block>
        {submitLabel}
      </Button>
    </Form>
  );
};

export default EstimateForm;
