import { Button, DatePicker, Form, Input, Space, Upload } from "antd";
import React, { useEffect } from "react";
import { UploadOutlined } from "@ant-design/icons";

const AuthorizationToObtain = () => {
   useEffect(() => {
        
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        }, []);
  return (
    <div>
    
      <p>
        Under the Fair Credit Reporting Act, before the Company may obtain a
        consumer report and/or investigative consumer report about you for
        employment or partnership purposes, we must have your written
        authorization. By signing below, you hereby authorize the Company and
        its employees, agents and representatives to obtain consumer reports
        and/or investigative consumer reports during the application process
        and/or during your employment or partnership with the Company.
      </p>
      <div className="section_form_layout">
        <Form layout="vertical">
          <Space>
            <Form.Item
              label="Upload Signature"
              name="signature"
              rules={[
                {
                  required: true,
                  message: "Please upload your signature!",
                },
              ]}
            >
              <Upload>
                <Button icon={<UploadOutlined />}>Click to Upload</Button>
              </Upload>
            </Form.Item>
            <Form.Item
              label="Date"
              name="date"
              rules={[{ required: true, message: "Please select a date!" }]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              label="Printed Name"
              name="printedName"
              rules={[{ required: true, message: "Please enter your name!" }]}
            >
              <Input placeholder="Enter your name" />
            </Form.Item>
          </Space>
        </Form>
      </div>
      <p>
        Enclosures: A Summary of Your Rights Under the Fair Credit Reporting Act
      </p>
    </div>
  );
};

export default AuthorizationToObtain;
