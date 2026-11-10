import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Alert, Button, Card, Form, Input, Radio, Spin, message } from "antd";
import { ArrowLeft, Check, X } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { CLIENT_TYPES, getClient, updateClient } from "@/services/api/clientApi";
import { dataOf, errorMessage } from "@/services/apiResult";
import { useApiQuery } from "@/hooks/useApiQuery";
import { clientPagePath } from "./clientFlow";
import "./clients.scss";

const FIELDS = ["name", "email", "cc_email", "client_type"];

// A client's own details. Their sheets, scopes of work and addresses are
// kept on the client page, one tab each.
const EditClientPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const { data: client, loading } = useApiQuery(() => getClient(id).then(dataOf), [id], {
    errorText: "Couldn't load the client",
  });

  const submit = async (values) => {
    // Send only what changed: an untouched email is never sent again.
    const changes = {};
    for (const field of FIELDS) {
      const value = typeof values[field] === "string" ? values[field].trim() : values[field];
      if ((value ?? "") !== (client?.[field] ?? "")) changes[field] = value ?? "";
    }
    if (!Object.keys(changes).length) {
      navigate(clientPagePath(id));
      return;
    }
    setSaving(true);
    try {
      await updateClient(id, changes);
      message.success("Client saved");
      navigate(clientPagePath(id));
    } catch (error) {
      message.error(errorMessage(error, "Couldn't save the client"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="EDIT CLIENT"
        subtitle={client?.name || client?.email}
        actions={
          <Button size="large" icon={<ArrowLeft size={16} />} onClick={() => navigate(clientPagePath(id))}>
            Back to Client
          </Button>
        }
      />

      {loading && !client ? (
        <div className="page-loader">
          <Spin size="large" />
        </div>
      ) : (
        <Form
          key={client?.id}
          form={form}
          layout="vertical"
          requiredMark="optional"
          onFinish={submit}
          initialValues={{
            name: client?.name || "",
            email: client?.email || "",
            cc_email: client?.cc_email || "",
            client_type: client?.client_type || "commercial",
          }}
        >
          <Card className="client-form__card">
            <Alert
              type="info"
              showIcon
              className="client-form__note"
              title="Sheets, scopes of work and service addresses are on the client page."
              action={
                <Button size="small" onClick={() => navigate(clientPagePath(id, "sheets"))}>
                  Open
                </Button>
              }
            />
            <Form.Item label="Client Type" name="client_type">
              <Radio.Group optionType="button" buttonStyle="solid" options={CLIENT_TYPES} />
            </Form.Item>
            <div className="form-grid form-grid--2">
              <Form.Item label="Name" name="name" rules={[{ max: 255 }]}>
                <Input />
              </Form.Item>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: "The client signs in with their email" },
                  { type: "email", message: "Enter a valid email" },
                ]}
              >
                <Input type="email" />
              </Form.Item>
              <Form.Item
                label="CC Email"
                name="cc_email"
                rules={[{ type: "email", message: "Enter a valid email" }]}
                extra="Copied on the documents and invoices the client is sent"
              >
                <Input type="email" />
              </Form.Item>
            </div>
          </Card>

          <div className="client-form__actions">
            <Button type="primary" htmlType="submit" size="large" loading={saving} icon={<Check size={16} />}>
              Save
            </Button>
            <Button size="large" icon={<X size={16} />} onClick={() => navigate(clientPagePath(id))}>
              Cancel
            </Button>
          </div>
        </Form>
      )}
    </div>
  );
};

export default EditClientPage;
