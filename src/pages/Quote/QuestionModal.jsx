/** @format */
import React, { useEffect } from "react";
import { Modal, Form, Input } from "antd";

const QuestionModal = ({ open, onCancel, onSubmit, editingQuestion }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (editingQuestion) {
      form.setFieldsValue({
        question: editingQuestion.question,
      });
    } else {
      form.resetFields();
    }
  }, [editingQuestion, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    onSubmit(values);
  };

  return (
    <Modal
      title={editingQuestion ? "Edit Question" : "Add Question"}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okText={editingQuestion ? "Update" : "Create"}
    >
      <Form layout="vertical" form={form}>
        <Form.Item
          label="Question"
          name="question"
          rules={[{ required: true, message: "Question is required" }]}
        >
          <Input placeholder="Enter question text" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default QuestionModal;
