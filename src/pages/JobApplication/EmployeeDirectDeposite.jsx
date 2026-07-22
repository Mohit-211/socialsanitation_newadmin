import { Button, Checkbox, DatePicker, Form, Input, Space, Table } from "antd";
import React, { useEffect } from "react";
import { PlusOutlined, MinusCircleOutlined } from "@ant-design/icons";
const EmployeeDirectDeposite = () => {
    const [form] = Form.useForm();

    useEffect(() => {
      form.setFieldsValue({ banks: [{}] }); // Set initial row
    }, [form]);
    const accountTypes = ["Checking", "Savings"]; 
  return (
    <div>
      <ul>
        <p>I, [employee] ____________________________________, : hereby</p>
        <li>
          authorize my employer, ___________________________ and its agents,
          including financial institutions, to initiate electronic credit
          entries, and if necessary, debit entries and adjustments for any
          credit entries in error to my checking and/or savings accounts listed
          below. This authorization will remain in effect until I have informed
          my employer in writing that I wish to cancel it and my employer has
          had reasonable time to effect such cancellation. I understand I should
          contact my bank to verify receipt of funds
        </li>
        <li>revise direct deposit bank account(s) as indicated below</li>
        <li>
          cancel direct deposit of my paycheck completely. This cancellation is
          to take effect immediately and remain in full force and effect until
          the Company has received written notification from me of authorization
          to deposit my paycheck automatically. I acknowledge that I will now
          receive paychecks for which I am responsible for depositing and/or
          cashing
        </li>
      </ul>
      <Form layout="vertical">
        <Form.Item label="Employee’s Signature" name="employeeSignature">
          <Input placeholder="Sign here" />
        </Form.Item>

        <Form.Item label="Date" name="date">
          <DatePicker format="DD / MM / YYYY" />
        </Form.Item>
      </Form>
      <Form form={form} layout="vertical">
      <Form.List name="banks">
        {(fields, { add, remove }) => (
          <>
            <Table
              columns={[
                {
                  title: "Bank Name / Address / Phone",
                  dataIndex: "bankInfo",
                  render: (_, __, index) => (
                    <Form.Item
                      name={[index, "bankInfo"]}
                      rules={[{ required: true, message: "Required" }]}
                    >
                      <Input placeholder="Enter bank details" />
                    </Form.Item>
                  ),
                },
                {
                  title: "Acct. Type",
                  dataIndex: "accountType",
                  render: (_, __, index) => (
                    <Form.Item
                      name={[index, "accountType"]}
                      rules={[{ required: true, message: "Select account type" }]}
                    >
                      <Checkbox.Group options={accountTypes} />
                    </Form.Item>
                  ),
                },
                {
                  title: "Routing Number",
                  dataIndex: "routingNumber",
                  render: (_, __, index) => (
                    <Form.Item
                      name={[index, "routingNumber"]}
                      rules={[{ required: true, message: "Required" }]}
                    >
                      <Input placeholder="Routing Number" />
                    </Form.Item>
                  ),
                },
                {
                  title: "Account Number",
                  dataIndex: "accountNumber",
                  render: (_, __, index) => (
                    <Form.Item
                      name={[index, "accountNumber"]}
                      rules={[{ required: true, message: "Required" }]}
                    >
                      <Input placeholder="Account Number" />
                    </Form.Item>
                  ),
                },
                {
                  title: "Amount",
                  dataIndex: "amount",
                  render: (_, __, index) => (
                    <Form.Item
                      name={[index, "amount"]}
                      rules={[{ required: true, message: "Required" }]}
                    >
                      <Input placeholder="Amount" />
                    </Form.Item>
                  ),
                },
                {
                  title: "Pct.",
                  dataIndex: "percentage",
                  render: (_, __, index) => (
                    <Form.Item
                      name={[index, "percentage"]}
                      rules={[{ required: true, message: "Required" }]}
                    >
                      <Input placeholder="Percentage" />
                    </Form.Item>
                  ),
                },
                {
                  title: "Action",
                  dataIndex: "action",
                  render: (_, __, index) =>
                    fields.length > 1 ? (
                      <Button
                        type="text"
                        danger
                        icon={<MinusCircleOutlined />}
                        onClick={() => remove(index)}
                      />
                    ) : null, // Hide remove button if only one row exists
                },
              ]}
              dataSource={fields.map((field) => ({ key: field.key }))}
              pagination={false}
              bordered
            />

            <Space style={{ marginTop: 16 }}>
              <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />}>
                Add Row
              </Button>
            </Space>
          </>
        )}
      </Form.List>
    </Form>
    </div>
  );
};

export default EmployeeDirectDeposite;
