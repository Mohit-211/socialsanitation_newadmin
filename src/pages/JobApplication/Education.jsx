import React, { useEffect } from "react";
import { Form, Input, DatePicker, Radio } from "antd";

const Education = ({ formData, setFormData }) => {
  const [form] = Form.useForm();

  // ✅ Handle updates inside "education"
  const handleChange = (changedValues) => {
    setFormData((prev) => ({
      ...prev,
      education: { ...prev.education, ...changedValues },
    }));
  };
  useEffect(() => {
      
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);
  return (
    <Form
      layout="vertical"
      form={form}
      initialValues={formData.education || {}} // ✅ Uses correct section
      onValuesChange={handleChange} // ✅ Ensures updates sync correctly
    >
      {/* High School Section */}
      <h3>High School</h3>
      <Form.Item label="High School Name" name="highSchoolName">
        <Input placeholder="Enter High School Name" />
      </Form.Item>
      <Form.Item label="City/State" name="highSchoolLocation">
        <Input placeholder="Enter City/State" />
      </Form.Item>
      <Form.Item label="From" name="highSchoolFrom">
        <DatePicker picker="year" style={{ width: "100%" }} />
      </Form.Item>
      <Form.Item label="To" name="highSchoolTo">
        <DatePicker picker="year" style={{ width: "100%" }} />
      </Form.Item>
      <Form.Item label="Graduate?" name="highSchoolGraduate">
        <Radio.Group>
          <Radio value="yes">Yes</Radio>
          <Radio value="no">No</Radio>
        </Radio.Group>
      </Form.Item>
      <Form.Item label="Diploma" name="highSchoolDiploma">
        <Input placeholder="Enter Diploma" />
      </Form.Item>

      {/* College Section */}
      <h3>College</h3>
      <Form.Item label="College Name" name="collegeName">
        <Input placeholder="Enter College Name" />
      </Form.Item>
      <Form.Item label="City/State" name="collegeLocation">
        <Input placeholder="Enter City/State" />
      </Form.Item>
      <Form.Item label="From" name="collegeFrom">
        <DatePicker picker="year" style={{ width: "100%" }} />
      </Form.Item>
      <Form.Item label="To" name="collegeTo">
        <DatePicker picker="year" style={{ width: "100%" }} />
      </Form.Item>
      <Form.Item label="Graduate?" name="collegeGraduate">
        <Radio.Group>
          <Radio value="yes">Yes</Radio>
          <Radio value="no">No</Radio>
        </Radio.Group>
      </Form.Item>
      <Form.Item label="Degree" name="collegeDegree">
        <Input placeholder="Enter Degree" />
      </Form.Item>

      {/* Other Education Section */}
      <h3>Other Education</h3>
      <Form.Item label="Institution Name" name="otherEducation">
        <Input placeholder="Enter Institution Name" />
      </Form.Item>
      <Form.Item label="City/State" name="otherLocation">
        <Input placeholder="Enter City/State" />
      </Form.Item>
      <Form.Item label="From" name="otherFrom">
        <DatePicker picker="year" style={{ width: "100%" }} />
      </Form.Item>
      <Form.Item label="Degree/Certification" name="otherDegree">
        <Input placeholder="Enter Degree/Certification" />
      </Form.Item>
    </Form>
  );
};

export default Education;
