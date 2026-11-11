import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button, Card, DatePicker, Form, Input, InputNumber, Select, message } from "antd";
import ClientSelect from "@/components/ClientSelect";
import SignatureField from "@/components/SignatureField";
import { contractFieldsFor, contractFieldsFromEstimate, type ContractFormValues } from "../contractFields";
import type { ClientPick, ContractInput } from "@/types";
import { DATE_FORMAT, toApiDate } from "@/utils/datetime";
import { statusTag } from "@/utils/format";
import { getEstimate } from "@/services/api/estimateApi";
import { dataOf, errorMessage } from "@/services/apiResult";
import { useClientDocuments } from "@/hooks/useClientDocuments";
import { EDIT_DOCUMENT_PATHS } from "@/pages/clients/clientFlow";

/**
 * A contract's fields: the client (on a new contract), the parties, the
 * monthly price, the service address, the date and the admin's signature.
 * A new contract can come from one of the client's estimates (step 7 of the
 * client flow): picking it fills the parties and address from the estimate.
 * `onSubmit` gets the contract as the API takes it.
 */
export interface ContractFormProps {
  initialValues: Partial<ContractFormValues>;
  initialSignature?: string;
  clients?: ClientPick[];
  lockClient?: boolean;
  isNew?: boolean;
  submitLabel: string;
  onSubmit: (contract: ContractInput) => Promise<void> | void;
}

const ContractForm = ({ initialValues, initialSignature = "", clients, lockClient, isNew, submitLabel, onSubmit }: ContractFormProps) => {
  const [form] = Form.useForm<ContractFormValues>();
  const [signature, setSignature] = useState({ signature: initialSignature });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  // The client's estimates, and the contracts already made from them.
  const userId = Form.useWatch<number | undefined>("user_id", form);
  const estimateId = Form.useWatch<number | undefined>("estimate_id", form);
  const { data: documents } = useClientDocuments(isNew ? userId : undefined);
  const estimates = documents?.estimates ?? [];
  const existing = estimateId ? documents?.contracts?.find((row) => row.estimate_id === estimateId) : null;

  const fillFromEstimate = (id: number | undefined) => {
    if (!id) return;
    getEstimate(id)
      .then((res) => form.setFieldsValue(contractFieldsFromEstimate(dataOf(res))))
      .catch((error) => message.error(errorMessage(error, "Couldn't load the estimate")));
  };

  useEffect(() => {
    if (isNew && initialValues?.estimate_id) fillFromEstimate(initialValues.estimate_id);
    // The estimate the form was opened with is read once, when it opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finish = async (values: ContractFormValues) => {
    if (!signature.signature) {
      message.error("Add your signature first");
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        ...(isNew ? { user_id: values.user_id, ...(values.estimate_id ? { estimate_id: values.estimate_id } : {}) } : {}),
        client_company_name: values.client_company_name.trim(),
        client_legal_name: values.client_legal_name.trim(),
        client_representative: values.client_representative?.trim() || "",
        service_address: values.service_address?.trim() || "",
        total_monthly_price: Number(values.total_monthly_price),
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
              onPick={(client) => form.setFieldsValue({ ...contractFieldsFor(client), estimate_id: undefined })}
            />
          </Form.Item>
        )}
        {isNew && (
          <Form.Item
            label="Made From Estimate"
            name="estimate_id"
            extra={
              existing ? (
                <span className="text-warning">
                  This estimate already has a contract ({statusTag(existing.status).label}).{" "}
                  <Button
                    type="link"
                    size="small"
                    className="table-link"
                    onClick={() => navigate(EDIT_DOCUMENT_PATHS.contract(existing.id))}
                  >
                    Open it
                  </Button>{" "}
                  instead of making another.
                </span>
              ) : (
                "Its company, contact and address fill the contract, and the contract keeps the link."
              )
            }
          >
            <Select
              allowClear
              placeholder={estimates.length ? "None" : "The client has no estimates"}
              disabled={!estimates.length}
              onChange={fillFromEstimate}
              options={estimates.map((row) => ({ value: row.id, label: `${row.title} · ${statusTag(row.status).label}` }))}
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
