import { useState } from "react";
import { Alert, Button, Card, Form, Input, Select, Space } from "antd";
import { FileText, MapPin } from "lucide-react";
import { EMPLOYEE_ROLES, EMPLOYEE_TYPES } from "@/services/api/employeeApi";
import HiringFormPicker from "./HiringFormPicker";

/**
 * An employee's details: who they are, their roles and pay type, and the
 * hiring form they applied with, whose address becomes their home. A new
 * employee needs a hiring form; an existing one can switch to another.
 * `onSubmit({ values, hiring })` gets the form's values and the hiring form
 * picked here ({ form, place }, or null when it didn't change).
 */
const EmployeeForm = ({ isNew, initialValues, currentHiring, submitLabel, onSubmit }) => {
  const [form] = Form.useForm();
  const [hiring, setHiring] = useState(null);
  const [changingHiring, setChangingHiring] = useState(isNew);
  const [missingHiring, setMissingHiring] = useState(false);
  const [saving, setSaving] = useState(false);

  const pickHiring = ({ form: picked, place }) => {
    setHiring({ form: picked, place });
    setMissingHiring(false);
    setChangingHiring(false);
    // The applicant's name and email fill in what is still empty.
    if (!form.getFieldValue("name") && picked.name) form.setFieldValue("name", picked.name);
    if (isNew && !form.getFieldValue("email") && picked.email) form.setFieldValue("email", picked.email);
  };

  const finish = async (values) => {
    if (isNew && !hiring) {
      setMissingHiring(true);
      return;
    }
    setSaving(true);
    try {
      await onSubmit({ values, hiring });
    } finally {
      setSaving(false);
    }
  };

  const shownHiring = hiring?.form || currentHiring;

  return (
    <Form form={form} layout="vertical" initialValues={initialValues} onFinish={finish} requiredMark="optional">
      <Card title="Hiring Form" className="form-card">
        {shownHiring && !changingHiring && (
          <div className="hiring-picked">
            <div>
              <strong>{shownHiring.name || "Applicant"}</strong>
              <div className="text-secondary">{[shownHiring.email, shownHiring.phone].filter(Boolean).join(" · ")}</div>
              {hiring?.place && (
                <div className="text-subtle">
                  <MapPin size={12} /> Home: {hiring.place.one_line}
                </div>
              )}
            </div>
            <Space wrap>
              {shownHiring.pdf_url && (
                <Button icon={<FileText size={14} />} onClick={() => window.open(shownHiring.pdf_url, "_blank", "noopener")}>
                  PDF
                </Button>
              )}
              <Button onClick={() => setChangingHiring(true)}>{isNew ? "Pick Another" : "Change the Hiring Form"}</Button>
            </Space>
          </div>
        )}
        {!isNew && !shownHiring && !changingHiring && (
          <Space orientation="vertical">
            <span className="text-secondary">No hiring form is linked to this employee.</span>
            <Button onClick={() => setChangingHiring(true)}>Link a Hiring Form</Button>
          </Space>
        )}
        {changingHiring && (
          <>
            <p className="text-secondary">
              {isNew
                ? "Find the applicant's hiring form. Its address becomes the employee's home, used to find who lives near a job."
                : "A different hiring form replaces their home address with the new form's."}
            </p>
            <HiringFormPicker initialQuery={initialValues?.email || ""} pickedId={hiring?.form?.submission_id} onPick={pickHiring} />
            {!isNew && (
              <Button type="link" onClick={() => setChangingHiring(false)}>
                Keep the current one
              </Button>
            )}
          </>
        )}
        {missingHiring && (
          <Alert type="error" showIcon className="form-card__alert" title="Pick the applicant's hiring form first." />
        )}
      </Card>

      <Card title="Employee" className="form-card">
        <div className="form-grid form-grid--2">
          <Form.Item label="Name" name="name" rules={[{ required: true, whitespace: true, message: "Enter their name" }]}>
            <Input autoComplete="off" />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Enter their email" },
              { type: "email", message: "Enter a valid email" },
            ]}
            extra={isNew ? "Their sign-in details go to this address." : undefined}
          >
            <Input type="email" autoComplete="off" />
          </Form.Item>
          <Form.Item
            label="Roles"
            name="roles"
            rules={[{ required: true, type: "array", min: 1, message: "Pick at least one role" }]}
            extra="What they do. A Business Development Manager (BDM) looks after clients and can't sign in to the panel."
          >
            <Select mode="multiple" options={EMPLOYEE_ROLES} placeholder="Cleaner, Supervisor…" />
          </Form.Item>
          <Form.Item
            label="Pay Type"
            name="employee_type"
            rules={[{ required: true, message: "Pick how they are paid" }]}
          >
            <Select options={EMPLOYEE_TYPES} placeholder="W2 or 1099" />
          </Form.Item>
        </div>
      </Card>

      <Button type="primary" htmlType="submit" size="large" loading={saving} block>
        {submitLabel}
      </Button>
    </Form>
  );
};

export default EmployeeForm;
