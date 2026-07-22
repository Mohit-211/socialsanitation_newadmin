import React from "react";
import { Col, Form, Input, Row } from "antd";

const References = ({ formData, setFormData }) => {
  const [form] = Form.useForm();

  // ✅ Handle form changes
  const handleChange = (changedValues) => {
    setFormData((prev) => ({
      ...prev,
      references: { ...prev.references, ...changedValues },
    }));
  };

  return (
    <Form
      layout="vertical"
      form={form}
      initialValues={formData.references || {}} 
      onValuesChange={handleChange} 
    >
      {[1, 2, 3].map((num) => (
        <div key={num} style={{ borderBottom: "1px solid #ddd", paddingBottom: "16px", marginBottom: "16px" }}>
          <h3>Reference {num}</h3>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="First Name"
                name={['references', num - 1, 'firstName']}
                rules={num <= 2 ? [{ required: true, message: "Please enter first name!" }] : []}
              >
                <Input placeholder="First" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Last Name"
                name={['references', num - 1, 'lastName']}
                rules={num <= 2 ? [{ required: true, message: "Please enter last name!" }] : []}
              >
                <Input placeholder="Last" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label="Relationship"
            name={['references', num - 1, 'relationship']}
            rules={num <= 2 ? [{ required: true, message: "Please enter relationship!" }] : []}
          >
            <Input placeholder="Relationship" />
          </Form.Item>
          <Form.Item
            label="Company"
            name={['references', num - 1, 'company']}
            rules={num <= 2 ? [{ required: true, message: "Please enter company name!" }] : []}
          >
            <Input placeholder="Company Name" />
          </Form.Item>
          <Form.Item
            label="Title"
            name={['references', num - 1, 'title']}
            rules={num <= 2 ? [{ required: true, message: "Please enter title!" }] : []}
          >
            <Input placeholder="Title" />
          </Form.Item>
          <Form.Item
            label="E-mail"
            name={['references', num - 1, 'email']}
            rules={num <= 2 ? [{ required: true, message: "Please enter a valid email!", type: "email" }] : []}
          >
            <Input type="email" placeholder="Email Address" />
          </Form.Item>
          <Form.Item
            label="Phone"
            name={['references', num - 1, 'phone']}
            rules={num <= 2 ? [{ required: true, message: "Please enter phone number!" }] : []}
          >
            <Input placeholder="Phone Number" />
          </Form.Item>
        </div>
      ))}
    </Form>
  );
};

export default References;
