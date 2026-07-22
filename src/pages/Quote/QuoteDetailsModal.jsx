/** @format */
import React, { useEffect } from "react";
import { Modal, Descriptions, Tag, Form, Select, InputNumber } from "antd";

const { Option } = Select;

const QuoteDetailsModal = ({
  open,
  onCancel,
  quote,
  onUpdateStatus,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (quote) {
      form.setFieldsValue({
        status: quote.status,
        quoted_price: quote.quoted_price,
      });
    }
  }, [quote, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    onUpdateStatus(values);
  };

  return (
    <Modal
      open={open}
      title="Quote Request Details"
      width={700}
      onCancel={onCancel}
      onOk={handleOk}
      okText="Update Status"
    >
      {quote && (
        <>
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label="Customer">
              {quote.user?.user_profile?.name}
            </Descriptions.Item>

            <Descriptions.Item label="Email">
              {quote.user?.email}
            </Descriptions.Item>

            <Descriptions.Item label="Current Status">
              <Tag color={quote.status === "accepted" ? "green" : "red"}>
                {quote.status.toUpperCase()}
              </Tag>
            </Descriptions.Item>
          </Descriptions>

          <br />

          <Descriptions title="Submitted Answers" bordered size="small" column={1}>
            {quote.answers.map((item) => (
              <Descriptions.Item
                key={item.id}
                label={item.question.question}
              >
                {item.answer}
              </Descriptions.Item>
            ))}
          </Descriptions>

          <br />

          <Form layout="vertical" form={form}>
            <Form.Item
              label="Update Status"
              name="status"
              rules={[{ required: true }]}
            >
              <Select>
                <Option value="accepted">Accepted</Option>
                <Option value="rejected">Rejected</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Quoted Price"
              name="quoted_price"
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (getFieldValue("status") === "accepted" && !value) {
                      return Promise.reject("Price is required when accepted");
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                placeholder="Enter quoted price"
              />
            </Form.Item>
          </Form>
        </>
      )}
    </Modal>
  );
};

export default QuoteDetailsModal;
