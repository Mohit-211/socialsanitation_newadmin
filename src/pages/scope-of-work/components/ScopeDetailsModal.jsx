import { useState } from "react";
import { AutoComplete, Form, Input, InputNumber, Modal, Select, message } from "antd";
import { createClientScope, updateScopeOfWork } from "@/services/api/scopeApi";
import { dataOf, errorMessage } from "@/services/apiResult";

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const FREQUENCIES = ["Daily", "Weekly", "Bi-Weekly", "Monthly", "One-time"].map((value) => ({ value }));
const WHOLE_MASTER_LIST = "master";

// Service days arrive as a list or as text; the picker works with a list.
const daysOf = (value) =>
  Array.isArray(value)
    ? value
    : typeof value === "string" && value
      ? value.split(/[,\s]+/).filter((day) => WEEK_DAYS.includes(day))
      : [];

/**
 * A new scope of work for a client (mode "create"), made from one of their
 * sheets or the whole master list, or a scope's title and visit details
 * (mode "edit"). Every field past the title is optional.
 */
const ScopeDetailsModal = ({ open, mode = "create", clientId, sheets = [], scope, onSaved, onCancel }) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const isCreate = mode === "create";

  const initialValues = isCreate
    ? {
        title: "Scope of Work",
        client_sheet_id: sheets[0]?.id ?? WHOLE_MASTER_LIST,
        service_days: [],
      }
    : {
        title: scope?.title,
        visit_frequency: scope?.visit_frequency || undefined,
        service_days: daysOf(scope?.service_days),
        service_time: scope?.service_time || undefined,
        crew_size: scope?.crew_size ?? undefined,
        hours_per_visit: scope?.hours_per_visit ?? undefined,
        notes: scope?.notes || undefined,
      };

  const submit = async () => {
    const values = await form.validateFields();
    // Empty fields clear on an edit and are left out on a create.
    const clean = (value) => (value === undefined || value === "" ? (isCreate ? undefined : null) : value);
    const body = {
      title: values.title?.trim() || undefined,
      visit_frequency: clean(values.visit_frequency?.trim()),
      service_days: values.service_days?.length ? values.service_days : clean(undefined),
      service_time: clean(values.service_time?.trim()),
      crew_size: clean(values.crew_size ?? undefined),
      hours_per_visit: clean(values.hours_per_visit ?? undefined),
      notes: clean(values.notes?.trim()),
    };
    if (isCreate && values.client_sheet_id !== WHOLE_MASTER_LIST) body.client_sheet_id = values.client_sheet_id;
    setSaving(true);
    try {
      const res = isCreate ? await createClientScope(clientId, body) : await updateScopeOfWork(scope.id, body);
      message.success(isCreate ? "Scope of work created" : "Scope of work saved");
      onSaved?.(dataOf(res));
    } catch (error) {
      message.error(errorMessage(error, isCreate ? "Couldn't create the scope of work" : "Couldn't save the scope of work"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title={isCreate ? "New Scope of Work" : "Scope of Work Details"}
      okText={isCreate ? "Create and Edit Tasks" : "Save"}
      onOk={submit}
      confirmLoading={saving}
      onCancel={onCancel}
      destroyOnHidden
      width={620}
    >
      <Form form={form} layout="vertical" initialValues={initialValues} preserve={false} requiredMark="optional">
        <Form.Item label="Title" name="title" rules={[{ required: true, whitespace: true, message: "Give the scope a title" }, { max: 150 }]}>
          <Input placeholder="Scope of Work" />
        </Form.Item>

        {isCreate && (
          <Form.Item
            label="Start From"
            name="client_sheet_id"
            extra="The scope takes the master sections this sheet's areas call for. You can edit every section and task afterwards."
          >
            <Select
              options={[
                ...sheets.map((sheet) => ({ value: sheet.id, label: sheet.title })),
                { value: WHOLE_MASTER_LIST, label: "The whole master list" },
              ]}
            />
          </Form.Item>
        )}

        <div className="form-grid form-grid--2">
          <Form.Item label="Visit Frequency" name="visit_frequency" rules={[{ max: 100 }]}>
            <AutoComplete options={FREQUENCIES} placeholder="Weekly" />
          </Form.Item>
          <Form.Item label="Service Time" name="service_time" rules={[{ max: 50 }]}>
            <Input placeholder="6:00 PM – 10:00 PM" />
          </Form.Item>
        </div>

        <Form.Item label="Service Days" name="service_days">
          <Select mode="multiple" placeholder="Pick the days" options={WEEK_DAYS.map((day) => ({ value: day, label: day }))} />
        </Form.Item>

        <div className="form-grid form-grid--2">
          <Form.Item label="Crew Size" name="crew_size">
            <InputNumber min={1} max={100} precision={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Hours per Visit" name="hours_per_visit">
            <InputNumber min={0} max={24} step={0.25} precision={2} style={{ width: "100%" }} />
          </Form.Item>
        </div>

        <Form.Item label="Notes for the Crew or Client" name="notes" rules={[{ max: 5000 }]}>
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ScopeDetailsModal;
