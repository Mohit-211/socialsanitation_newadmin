import { useState } from "react";
import { Button, Card, Form, Input, Select } from "antd";
import { Plus, Trash2 } from "lucide-react";
import { CHECKLIST_KINDS } from "../checklistKinds";

/**
 * A checklist: its heading, who works through it, and its tasks. `kind` is
 * "service" (a Supervisor's or Quality Inspector's) or "daily" (a Cleaner's
 * or Housekeeper's). A saved task keeps its id, so its ticks stay with it.
 * `onSubmit(body)` gets the checklist as the API takes it.
 */
const ChecklistForm = ({ kind, initialValues, submitLabel, onSubmit }) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const config = CHECKLIST_KINDS[kind];

  const finish = async (values) => {
    setSaving(true);
    try {
      await onSubmit({
        heading: values.heading.trim(),
        ...(values[config.field] ? { [config.field]: values[config.field] } : {}),
        tasks: (values.tasks || [])
          .filter((row) => row?.task?.trim())
          .map((row) => (row.id ? { id: row.id, task: row.task.trim() } : row.task.trim())),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      requiredMark="optional"
      initialValues={{ tasks: [{ task: "" }], ...initialValues }}
      onFinish={finish}
    >
      <Card className="form-card">
        <div className="form-grid form-grid--2">
          <Form.Item label="Heading" name="heading" rules={[{ required: true, whitespace: true, message: "Name the checklist" }]}>
            <Input placeholder="Restrooms" />
          </Form.Item>
          <Form.Item
            label={config.label}
            name={config.field}
            rules={config.required ? [{ required: true, message: "Pick who works through it" }] : []}
          >
            <Select allowClear={!config.required} options={config.options} placeholder="Pick" />
          </Form.Item>
        </div>
        <span className="field-label">Tasks</span>
        <Form.List
          name="tasks"
          rules={[
            {
              validator: async (_, rows) => {
                if (!(rows || []).some((row) => row?.task?.trim())) throw new Error("Add at least one task");
              },
            },
          ]}
        >
          {(fields, { add, remove }, { errors }) => (
            <>
              <ol className="checklist-form__tasks">
                {fields.map((field, index) => (
                  <li key={field.key} className="checklist-form__task">
                    <Form.Item name={[field.name, "id"]} hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item name={[field.name, "task"]} className="checklist-form__task-input">
                      <Input placeholder={`Task ${index + 1}`} aria-label={`Task ${index + 1}`} />
                    </Form.Item>
                    <Button type="text" danger aria-label="Remove task" icon={<Trash2 size={16} />} onClick={() => remove(field.name)} />
                  </li>
                ))}
              </ol>
              <Form.ErrorList errors={errors} />
              <Button icon={<Plus size={16} />} onClick={() => add({ task: "" })}>
                Add Task
              </Button>
            </>
          )}
        </Form.List>
      </Card>
      <Button type="primary" htmlType="submit" size="large" loading={saving} block>
        {submitLabel}
      </Button>
    </Form>
  );
};

export default ChecklistForm;
