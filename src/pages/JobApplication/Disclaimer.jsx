
import { Button, DatePicker, Form, Input, Space, Upload } from "antd";
import React from "react";
import { UploadOutlined } from "@ant-design/icons";

const Disclaimer = () => {
  return (
    <div><div>
    <p>
      Applicant understands that this is an Equal Opportunity Employer
      and committed to excellence through diversity. In order to ensure
      this application is acceptable, please print or type with the
      application being fully completed in order for it to be
      considered.
    </p>
    <p>
      Please complete each section EVEN IF you decide to attach a
      resume.
    </p>
    <p>
      I, the Applicant, certify that my answers are true and honest to
      the best of my knowledge. If this application leads to my
      eventualemployment, I understand that any false or misleading
      information in my application or interview may result in my
      employment being terminated.
    </p>
    <Form layout="vertical">
      <Space size="large" align="start">
        {/* ✅ Upload Signature - Required */}
        <Form.Item
          label="Upload Signature"
          name="signature"
          rules={[
            {
              required: true,
              message: "Signature upload is required!",
            },
          ]}
        >
          <Upload>
            <Button icon={<UploadOutlined />}>Click to Upload</Button>
          </Upload>
        </Form.Item>
        {/* ✅ Date - Required */}
        <Form.Item
          label="Date"
          name="date"
          rules={[{ required: true, message: "Date is required!" }]}
        >
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>
        {/* ✅ Printed Name - Required */}
        <Form.Item
          label="Printed Name"
          name="printedName"
          rules={[
            { required: true, message: "Printed name is required!" },
          ]}
        >
          <Input placeholder="Enter your name" />
        </Form.Item>
      </Space>
    </Form>
  </div></div>
  )
}

export default Disclaimer