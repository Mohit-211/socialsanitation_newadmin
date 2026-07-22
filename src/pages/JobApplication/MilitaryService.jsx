import { DatePicker, Form, Input, Radio, Row, Col } from "antd";
import React, { useState } from "react";

const MilitaryService = ({ formData, setFormData }) => {
  const [form] = Form.useForm();
  const [isVeteran, setIsVeteran] = useState(formData.militaryService?.veteran || "no");

  // ✅ Handle form updates
  const handleChange = (changedValues) => {
    setFormData((prev) => ({
      ...prev,
      militaryService: { ...prev.militaryService, ...changedValues },
    }));
  };

  return (
    <Form
      layout="vertical"
      form={form}
      initialValues={formData.militaryService || {}}
      onValuesChange={handleChange}
    >
      {/* ✅ Are you a veteran? */}
      <Form.Item label="ARE YOU A VETERAN?" name="veteran">
        <Radio.Group
          onChange={(e) => {
            setIsVeteran(e.target.value);
            if (e.target.value === "no") {
              form.resetFields([
                "branch",
                "serviceFrom",
                "serviceTo",
                "rank",
                "dischargeType",
                "dischargeExplanation",
              ]);
            }
          }}
          value={isVeteran}
        >
          <Radio value="yes">Yes</Radio>
          <Radio value="no">No</Radio>
        </Radio.Group>
      </Form.Item>

      {/* ✅ Show fields only if the user is a veteran */}
      {isVeteran === "yes" && (
        <>
          <Form.Item label="Branch of Service" name="branch" >
            <Input placeholder="Enter Branch of Service" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="From" name="serviceFrom">
                <DatePicker picker="month" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="To" name="serviceTo" >
                <DatePicker picker="month" style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Rank at Discharge" name="rank">
            <Input placeholder="Enter Rank" />
          </Form.Item>

          <Form.Item label="Type of Discharge" name="dischargeType" >
            <Input placeholder="Enter Type of Discharge" />
          </Form.Item>

          <Form.Item label="If Other Than Honorable, Explain" name="dischargeExplanation">
            <Input.TextArea placeholder="Provide details..." rows={3} />
          </Form.Item>
        </>
      )}
    </Form>
  );
};

export default MilitaryService;
