import React, { useState } from "react";
import { DatePicker, Form, Input, Radio, Button, Space } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";

const PreviousEmployment = ({ formData, setFormData }) => {
  const [form] = Form.useForm();
  const [hasJob, setHasJob] = useState(formData.previousEmployment?.hasJob || "no");
  const [employers, setEmployers] = useState(formData.previousEmployment?.employers || [{}]);

  // ✅ Handle overall form updates
  const handleChange = (changedValues) => {
    setFormData((prev) => ({
      ...prev,
      previousEmployment: {
        ...prev.previousEmployment,
        ...changedValues,
        employers: employers,
      },
    }));
  };

  // ✅ Add employer
  const addEmployer = () => {
    setEmployers([...employers, {}]);
  };

  // ✅ Remove employer
  const removeEmployer = (index) => {
    const updatedEmployers = employers.filter((_, i) => i !== index);
    setEmployers(updatedEmployers);
  };

  return (
    <Form
      layout="vertical"
      form={form}
      initialValues={formData.previousEmployment || {}}
      onValuesChange={handleChange}
    >
      {/* ✅ Question: Did you have a previous job? */}
      <Form.Item label="Have you had a previous job?" name="hasJob">
        <Radio.Group
          onChange={(e) => {
            setHasJob(e.target.value);
            if (e.target.value === "no") setEmployers([]); // Reset if "No"
            else setEmployers([{}]); // Ensure at least one employer starts
          }}
          value={hasJob}
        >
          <Radio value="yes">Yes</Radio>
          <Radio value="no">No</Radio>
        </Radio.Group>
      </Form.Item>

      {/* ✅ Show employer fields only if "Yes" is selected */}
      {hasJob === "yes" && (
        <>
          {employers.map((_, index) => (
            <div key={index} style={{ border: "1px solid #ddd", padding: "16px", marginBottom: "16px", borderRadius: "5px" }}>
              <h3>Employer {index + 1}</h3>

              <Form.Item
                label="Company / Individual"
                name={['employers', index, 'name']}
                rules={index === 0 ? [{ required: true, message: "Please enter the company name!" }] : []}
              >
                <Input placeholder="Enter Company or Individual Name" />
              </Form.Item>

              <Form.Item
                label="E-Mail"
                name={['employers', index, 'email']}
                rules={index === 0 ? [{ required: true, message: "Please enter a valid email!", type: "email" }] : []}
              >
                <Input type="email" placeholder="Enter E-Mail" />
              </Form.Item>

              <Form.Item
                label="Address"
                name={['employers', index, 'address']}
                rules={index === 0 ? [{ required: true, message: "Please enter the address!" }] : []}
              >
                <Input placeholder="Enter Street Address" />
              </Form.Item>

              <Form.Item
                label="City/State/Zip"
                name={['employers', index, 'cityStateZip']}
                rules={index === 0 ? [{ required: true, message: "Please enter City, State, and Zip Code!" }] : []}
              >
                <Input placeholder="Enter City, State, Zip Code" />
              </Form.Item>

              <Form.Item
                label="Phone"
                name={['employers', index, 'phone']}
                rules={index === 0 ? [{ required: true, message: "Please enter the phone number!" }] : []}
              >
                <Input placeholder="Enter Phone Number" />
              </Form.Item>

              <Form.Item
                label="Job Title"
                name={['employers', index, 'jobTitle']}
                rules={index === 0 ? [{ required: true, message: "Please enter the job title!" }] : []}
              >
                <Input placeholder="Enter Job Title" />
              </Form.Item>

              <Form.Item
                label="From"
                name={['employers', index, 'from']}
                rules={index === 0 ? [{ required: true, message: "Please select the start date!" }] : []}
              >
                <DatePicker picker="month" style={{ width: "100%" }} />
              </Form.Item>

              <Form.Item
                label="To"
                name={['employers', index, 'to']}
                rules={index === 0 ? [{ required: true, message: "Please select the end date!" }] : []}
              >
                <DatePicker picker="month" style={{ width: "100%" }} />
              </Form.Item>

              <Form.Item
                label="Responsibilities"
                name={['employers', index, 'responsibilities']}
                rules={index === 0 ? [{ required: true, message: "Please enter job responsibilities!" }] : []}
              >
                <Input.TextArea placeholder="Enter Responsibilities" />
              </Form.Item>

              <Form.Item
                label="Reason for Leaving"
                name={['employers', index, 'reasonForLeaving']}
                rules={index === 0 ? [{ required: true, message: "Please enter reason for leaving!" }] : []}
              >
                <Input.TextArea placeholder="Enter Reason for Leaving" />
              </Form.Item>

              {/* Remove Employer Button */}
              {index > 0 && (
                <Button
                  type="danger"
                  onClick={() => removeEmployer(index)}
                  icon={<DeleteOutlined />}
                  style={{ marginTop: "8px" }}
                >
                  Remove Employer
                </Button>
              )}
            </div>
          ))}

          {/* ✅ Add More Employer Button */}
          <Button
            type="dashed"
            onClick={addEmployer}
            block
            icon={<PlusOutlined />}
          >
            Add Another Employer
          </Button>
        </>
      )}
    </Form>
  );
};

export default PreviousEmployment;
