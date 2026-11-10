import { useState } from "react";
import { Button, Card, Form, Input, Select } from "antd";
import { useApiQuery } from "@/hooks/useApiQuery";
import { listServiceChecklists } from "@/services/api/serviceChecklistApi";
import { itemsOf } from "@/services/apiResult";
import { jobLabel } from "@/pages/service-checklists/checklistKinds";

/**
 * A service: its name, the three letters booking numbers start with, a short
 * description, and the checklists its crew works through. No price (agreed
 * per client) and no pictures.
 */
const ServiceForm = ({ isNew, initialValues, submitLabel, onSubmit }) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const { data: checklists } = useApiQuery(() => listServiceChecklists().then(itemsOf), [], {
    initial: [],
    errorText: "Couldn't load the checklists",
  });

  const finish = async (values) => {
    setSaving(true);
    try {
      await onSubmit({
        name: values.name.trim(),
        description: values.description?.trim() || "",
        ...(values.abbreviation?.trim() ? { abbreviation: values.abbreviation.trim().toUpperCase() } : {}),
        service_checklist_ids: values.service_checklist_ids || [],
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Form form={form} layout="vertical" requiredMark="optional" initialValues={initialValues} onFinish={finish}>
      <Card className="form-card">
        <div className="form-grid form-grid--2">
          <Form.Item label="Name" name="name" rules={[{ required: true, whitespace: true, message: "Name the service" }]}>
            <Input placeholder="Office Cleaning" />
          </Form.Item>
          <Form.Item
            label="Abbreviation"
            name="abbreviation"
            extra={isNew ? "Three letters that start its booking numbers; made from the name when left empty." : "Three letters that start its booking numbers."}
            rules={[{ pattern: /^[A-Za-z]{3}$/, message: "Exactly three letters" }]}
          >
            <Input maxLength={3} placeholder="OFC" style={{ textTransform: "uppercase" }} />
          </Form.Item>
        </div>
        <Form.Item label="Description" name="description">
          <Input.TextArea rows={4} maxLength={2000} showCount placeholder="What the service covers" />
        </Form.Item>
        <Form.Item
          label="Checklists"
          name="service_checklist_ids"
          extra="What the Supervisor and Quality Inspector check on its visits."
        >
          <Select
            mode="multiple"
            optionFilterProp="label"
            placeholder="Pick checklists"
            options={(checklists || []).map((checklist) => ({
              value: checklist.id,
              label: `${checklist.title}${checklist.job_type ? ` (${jobLabel("service", checklist.job_type)})` : ""}`,
            }))}
          />
        </Form.Item>
      </Card>
      <Button type="primary" htmlType="submit" size="large" loading={saving} block>
        {submitLabel}
      </Button>
    </Form>
  );
};

export default ServiceForm;
