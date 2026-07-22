import React, { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import {
  Form,
  Input,
  DatePicker,
  Upload,
  Button,
  Row,
  Col,
  Checkbox,
  Space,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";

const PersonalInformation = ({ formData, setFormData }) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);

  const handleChange = (changedValues) => {
    setFormData(changedValues);
  };

  const handleUploadChange = ({ fileList }) => {
    setFileList(fileList);
    handleChange({ signature: fileList.map((file) => file.name) });
  };
 useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);
  return (
    <Container>
      <Form
        layout="vertical"
        form={form}
        initialValues={formData || {}} // ✅ Ensure correct section is used
        onValuesChange={handleChange} // ✅ Sync changes to state
      >
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="First Name"
              name="firstName"
              rules={[
                { required: true, message: "Please enter your first name!" },
              ]}
            >
              <Input placeholder="First" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Middle Name" name="middleName">
              <Input placeholder="Middle" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="Last Name"
              name="lastName"
              rules={[
                { required: true, message: "Please enter your last name!" },
              ]}
            >
              <Input placeholder="Last" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="Date of Birth"
          name="dateOfBirth"
          rules={[
            { required: true, message: "Please select your date of birth!" },
          ]}
        >
          <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Street Address"
              name="streetAddress"
              rules={[
                {
                  required: true,
                  message: "Please enter your street address!",
                },
              ]}
            >
              <Input placeholder="Enter your street address" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Apt/Suite" name="aptSuite">
              <Input placeholder="Apt/Suite" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="City"
              name="city"
              rules={[{ required: true, message: "Please enter your city!" }]}
            >
              <Input placeholder="Enter your city" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="State"
              name="state"
              rules={[{ required: true, message: "Please enter your state!" }]}
            >
              <Input placeholder="Enter your state" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="Zip Code"
              name="zipCode"
              rules={[
                { required: true, message: "Please enter your zip code!" },
              ]}
            >
              <Input placeholder="Enter your zip code" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="E-Mail"
              name="email"
              rules={[
                { required: true, message: "Please enter your email!" },
                { type: "email", message: "Please enter a valid email!" },
              ]}
            >
              <Input type="email" placeholder="Enter your email" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Phone"
              name="phone"
              rules={[
                { required: true, message: "Please enter your phone number!" },
              ]}
            >
              <Input placeholder="Enter your phone number" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="Social Security Number (SSN)"
          name="ssn"
          rules={[{ required: true, message: "Please enter your SSN!" }]}
        >
          <Input placeholder="Enter your SSN" />
        </Form.Item>

        <Form.Item
          label="Date Available"
          name="dateAvailable"
          rules={[{ required: true, message: "Please select a date!" }]}
        >
          <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
        </Form.Item>

        <Form.Item
          label="Position Applied For"
          name="position"
          rules={[
            {
              required: true,
              message: "Please enter the position you're applying for!",
            },
          ]}
        >
          <Input placeholder="Enter the position you're applying for" />
        </Form.Item>

        <Form.Item
          label="Desired Pay"
          name="desiredPay"
          rules={[
            { required: true, message: "Please enter your desired pay!" },
          ]}
        >
          <Input addonBefore="$" placeholder="Enter amount" />
        </Form.Item>

        <Form.Item
          label="Employment Desired"
          name="employmentType"
          rules={[
            {
              required: true,
              message: "Please select at least one employment type!",
            },
          ]}
        >
          <Checkbox.Group>
            <Space>
              <Checkbox value="full-time">Full-Time</Checkbox>
              <Checkbox value="part-time">Part-Time</Checkbox>
              <Checkbox value="seasonal">Seasonal</Checkbox>
            </Space>
          </Checkbox.Group>
        </Form.Item>

        <Form.Item
          label="Upload Signature"
          name="signature"
          rules={[{ required: true, message: "Please upload your signature!" }]}
        >
          <Upload
            fileList={fileList}
            beforeUpload={() => false} // ✅ Prevent auto-upload
            onChange={handleUploadChange}
          >
            <Button icon={<UploadOutlined />}>Click to Upload</Button>
          </Upload>
        </Form.Item>
      </Form>
    </Container>
  );
};

export default PersonalInformation;
