import { useState } from "react";
import { Button, Card, DatePicker, Form, Input, InputNumber, message } from "antd";
import ClientSelect from "@/components/ClientSelect";
import SignatureField from "@/components/SignatureField";
import { contractFieldsFor } from "../contractFields";
import { DATE_FORMAT, toApiDate } from "@/utils/datetime";

/**
 * A contract's fields: the client (on a new contract), the parties, the
 * monthly price, the service address, the date and the admin's signature.
 * `onSubmit` gets the contract as the API takes it.
 */
const ContractForm = ({ initialValues, initialSignature = "", clients, lockClient, isNew, submitLabel, onSubmit }) => {
  const [form] = Form.useForm();
  const [signature, setSignature] = useState({ signature: initialSignature });
  const [saving, setSaving] = useState(false);

  const finish = async (values) => {
    if (!signature.signature) {
      message.error("Add your signature first");
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        ...(isNew ? { user_id: values.user_id } : {}),
        client_company_name: values.client_company_name.trim(),
        client_legal_name: values.client_legal_name.trim(),
        client_representative: values.client_representative?.trim() || "",
        service_address: values.service_address?.trim() || "",
        total_monthly_price: values.total_monthly_price,
        contract_date: toApiDate(values.contract_date),
        signature: signature.signature,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Form form={form} layout="vertical" initialValues={initialValues} onFinish={finish} requiredMark="optional">
      <Card title="Client" className="form-card">
        {isNew && (
          <Form.Item label="Client" name="user_id" rules={[{ required: true, message: "Choose the client" }]}>
            <ClientSelect
              clients={clients}
              locked={lockClient}
              onPick={(client) => form.setFieldsValue(contractFieldsFor(client))}
            />
          </Form.Item>
        )}
        <div className="form-grid form-grid--3">
          <Form.Item
            label="Company Name"
            name="client_company_name"
            rules={[{ required: true, whitespace: true, message: "Enter the company name" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Legal Name"
            name="client_legal_name"
            rules={[{ required: true, whitespace: true, message: "Enter the legal name" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="Representative" name="client_representative">
            <Input />
          </Form.Item>
        </div>
      </Card>

      <Card title="Service" className="form-card">
        <div className="form-grid form-grid--3">
          <Form.Item
            label="Monthly Price"
            name="total_monthly_price"
            rules={[
              { required: true, message: "Enter the monthly price" },
              { type: "number", min: 0.01, message: "The monthly price must be more than 0" },
            ]}
          >
            <InputNumber prefix="$" min={0} precision={2} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Contract Date" name="contract_date" rules={[{ required: true, message: "Pick the date" }]}>
            <DatePicker format={DATE_FORMAT} style={{ width: "100%" }} />
          </Form.Item>
        </div>
        <Form.Item label="Service Address" name="service_address">
          <Input />
        </Form.Item>
      </Card>

      <Card title="Your Signature" className="form-card">
        <SignatureField formData={signature} setFormData={setSignature} />
      </Card>

      <Button type="primary" htmlType="submit" size="large" loading={saving} block>
        {submitLabel}
      </Button>
    </Form>
  );
};

export default ContractForm;
