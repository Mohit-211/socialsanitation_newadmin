import { useState } from "react";
import { useNavigate } from "react-router";
import { Button, Card, Form, Input, Radio, Select, Spin, message } from "antd";
import { ArrowLeft, Check, X } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import AddressFields from "@/components/AddressFields";
import { useCountries } from "@/hooks/useCountries";
import { addressBody, hasAddress, type AddressFormValues } from "@/components/addressForm";
import { CLIENT_TYPES, createClient } from "@/services/api/clientApi";
import { listAdmins } from "@/services/api/adminApi";
import { dataOf, errorMessage, itemsOf } from "@/services/apiResult";
import { useApiQuery } from "@/hooks/useApiQuery";
import { useSession } from "@/lib/session";
import SheetFields from "./components/SheetFields";
import { defaultAreas, sheetBody, type SheetFormValues } from "./sheetForm";
import type { ClientType, SheetArea } from "@/types";

/** The new client's details, their first sheet, and an optional address. */
type NewClientValues = SheetFormValues &
  Partial<AddressFormValues> & {
    email: string;
    name?: string;
    client_type: ClientType;
    assigned_to?: number;
  };
import "./clients.scss";

// A new client with their first Initial Client Sheet and, optionally, the
// address it is for. Saving opens the client's page, where the rest of their
// flow (scope, estimate or quote, contract, bookings, invoices) starts.
const AddClientPage = () => {
  const [form] = Form.useForm<NewClientValues>();
  const navigate = useNavigate();
  const selfId = useSession()?.user?.id;
  const [saving, setSaving] = useState(false);
  const clientType: ClientType = Form.useWatch("client_type", form) || "commercial";

  const { data: countries, loading: loadingCountries } = useCountries();
  const { data: admins } = useApiQuery(() => listAdmins().then(itemsOf), [], { initial: [] });
  const usCountryId = countries?.find((country) => country.code === "US")?.id;

  // A new type brings that type's areas, unless some were already filled in.
  const onTypeChange = (type: ClientType) => {
    const areas: Partial<SheetArea>[] = form.getFieldValue("areas") || [];
    const touched = areas.some((area) =>
      ["num_desks_trash_cans", "stalls", "sinks", "restrooms", "flooring_type", "special_requests"].some(
        (field) => {
          const value = area?.[field as keyof SheetArea];
          return value !== undefined && value !== null && value !== "";
        },
      ),
    );
    if (!touched) form.setFieldValue("areas", defaultAreas(type));
  };

  const submit = async (values: NewClientValues) => {
    setSaving(true);
    try {
      const sheet = { ...sheetBody(values), ...(hasAddress(values) ? await addressBody(values as AddressFormValues) : {}) };
      const res = await createClient({
        email: values.email.trim(),
        name: values.name?.trim() || undefined,
        client_type: values.client_type,
        assigned_to: values.assigned_to || undefined,
        sheet,
      });
      const client = dataOf(res);
      // The client is saved either way; the backend says whether the welcome
      // email (their sign-in details) went out.
      if (client?.credentials_emailed === false) {
        message.warning(res.data?.message || "Client added, but the welcome email didn't go out.", 8);
      } else {
        message.success("Client added. Their sign-in details are on the way by email.");
      }
      navigate(client?.id ? `/viewUser/${client.id}` : "/users");
    } catch (error) {
      message.error(errorMessage(error, "Couldn't add the client"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="NEW CLIENT"
        subtitle="Add the client and walk the site: their first sheet becomes the start of their flow"
        actions={
          <Button size="large" icon={<ArrowLeft size={16} />} onClick={() => navigate("/users")}>
            All Clients
          </Button>
        }
      />

      {loadingCountries ? (
        <div className="page-loader">
          <Spin size="large" />
        </div>
      ) : (
        <Form
          form={form}
          layout="vertical"
          requiredMark="optional"
          onFinish={submit}
          scrollToFirstError
          initialValues={{
            client_type: "commercial",
            assigned_to: selfId,
            country_id: usCountryId,
            title: "",
            service_days: [],
            areas: defaultAreas("commercial"),
          }}
          className="client-form"
        >
          <Card title="Client" className="client-form__card">
            <Form.Item label="Client Type" name="client_type">
              <Radio.Group
                optionType="button"
                buttonStyle="solid"
                options={CLIENT_TYPES}
                onChange={(event) => onTypeChange(event.target.value)}
              />
            </Form.Item>
            <div className="form-grid form-grid--2">
              <Form.Item label="Name" name="name" rules={[{ max: 255 }]}>
                <Input placeholder="Company or person" />
              </Form.Item>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: "Enter the client's email" },
                  { type: "email", message: "Enter a valid email" },
                ]}
                extra="They sign in to the client app with it"
              >
                <Input type="email" />
              </Form.Item>
              <Form.Item label="Assigned Admin" name="assigned_to">
                <Select
                  allowClear
                  placeholder="Not assigned"
                  options={(admins || []).map((admin) => ({ value: admin.id, label: admin.name || admin.email }))}
                />
              </Form.Item>
            </div>
          </Card>

          <Card title="Service Address (optional)" className="client-form__card">
            <AddressFields form={form} countries={countries} optional />
          </Card>

          <Card title="Initial Client Sheet" className="client-form__card">
            <SheetFields form={form} clientType={clientType} titleRequired={false} />
          </Card>

          <div className="client-form__actions">
            <Button type="primary" htmlType="submit" size="large" loading={saving} icon={<Check size={16} />}>
              Add Client
            </Button>
            <Button size="large" icon={<X size={16} />} onClick={() => navigate("/users")}>
              Cancel
            </Button>
          </div>
        </Form>
      )}
    </div>
  );
};

export default AddClientPage;
