import React from "react";
import { Form, Radio, Input } from "antd";

const EmploymentEligibility = ({ formData, setFormData }) => {
  const [form] = Form.useForm();

 
  const handleChange = (changedValues) => {
    setFormData((prev) => ({
      ...prev,
      employmentEligibility: { ...prev.employmentEligibility, ...changedValues },
    }));
  };

  return (
    <Form
    layout="vertical"
    form={form}
    initialValues={formData.employmentEligibility || {}} // ✅ Uses correct section
    onValuesChange={handleChange} // ✅ Ensures updates sync correctly
  >
    <Form.Item
      label="ARE YOU LEGALLY ELIGIBLE TO WORK IN THE U.S?"
      name="eligibleToWork"
      rules={[{ required: true, message: "Please select an option!" }]}
    >
      <Radio.Group>
        <Radio value="yes">YES</Radio>
        <Radio value="no">NO</Radio>
      </Radio.Group>
    </Form.Item>
  
    <Form.Item
      label="HAVE YOU EVER WORKED FOR THIS EMPLOYER?"
      name="workedBefore"
      rules={[{ required: true, message: "Please select an option!" }]}
    >
      <Radio.Group>
        <Radio value="yes">YES</Radio>
        <Radio value="no">NO</Radio>
      </Radio.Group>
    </Form.Item>
  
    <Form.Item
      label="IF YES, WRITE THE START AND END DATES:"
      name="employmentDates"
      dependencies={["workedBefore"]}
      rules={[
        ({ getFieldValue }) =>
          getFieldValue("workedBefore") === "yes"
            ? { required: true, message: "Please enter the start and end dates!" }
            : {},
      ]}
    >
      <Input placeholder="Start - End" disabled={form.getFieldValue("workedBefore") !== "yes"} />
    </Form.Item>
  
    <Form.Item
      label="HAVE YOU EVER BEEN CONVICTED OF A FELONY?"
      name="convictedFelony"
      rules={[{ required: true, message: "Please select an option!" }]}
    >
      <Radio.Group>
        <Radio value="yes">YES</Radio>
        <Radio value="no">NO</Radio>
      </Radio.Group>
    </Form.Item>
  
    <Form.Item
      label="IF YES, PLEASE EXPLAIN:"
      name="felonyExplanation"
      dependencies={["convictedFelony"]}
      rules={[
        ({ getFieldValue }) =>
          getFieldValue("convictedFelony") === "yes"
            ? { required: true, message: "Please provide an explanation!" }
            : {},
      ]}
    >
      <Input.TextArea rows={3} placeholder="Provide details..." disabled={form.getFieldValue("convictedFelony") !== "yes"} />
    </Form.Item>
  </Form>
  
  );
};

export default EmploymentEligibility;
