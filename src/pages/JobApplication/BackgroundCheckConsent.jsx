import { Form, Radio } from "antd";
import React from "react";

const BackgroundCheckConsent = ({ formData, setFormData }) => {
  const [form] = Form.useForm();

  // ✅ Handle form updates inside "backgroundCheck"
  const handleChange = (changedValues) => {
    setFormData((prev) => ({
      ...prev,
      backgroundCheck: { ...prev.backgroundCheck, ...changedValues },
    }));
  };

  return (
    <Form
      layout="vertical"
      form={form}
      initialValues={formData.backgroundCheck || {}} // ✅ Uses correct section
      onValuesChange={handleChange} // ✅ Ensures updates sync correctly
    >
      <Form.Item
        label="IF ASKED, ARE YOU WILLING TO CONSENT TO A BACKGROUND CHECK?"
        name="consent"
      >
        <Radio.Group>
          <Radio value="yes">Yes</Radio>
          <Radio value="no">No</Radio>
        </Radio.Group>
      </Form.Item>
    </Form>
  );
};

export default BackgroundCheckConsent;
