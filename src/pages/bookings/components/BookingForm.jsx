import { useState } from "react";
import { Button, Card, DatePicker, Divider, Form, Input, Radio, Select, Switch, TimePicker } from "antd";
import { Plus } from "lucide-react";
import ClientSelect from "@/components/ClientSelect";
import AddressFields from "@/components/AddressFields";
import AddressFormModal from "@/components/AddressFormModal";
import { listAddressPicks } from "@/services/api/addressApi";
import { listServiceNames } from "@/services/api/serviceApi";
import { itemsOf } from "@/services/apiResult";
import { useApiQuery } from "@/hooks/useApiQuery";
import { useCountries } from "@/hooks/useCountries";
import { DATE_FORMAT, TIME_FORMAT } from "@/utils/datetime";
import CrewFields from "./CrewFields";
import RepeatFields from "./RepeatFields";

/**
 * A booking's fields. `mode` is "create" (a new visit or series), "visit"
 * (one visit) or "series" (a repeating booking, changed from a date on).
 * `onSubmit` gets the form's values; the page turns them into the API's body.
 */
const BookingForm = ({ mode = "create", initialValues, clients = [], lockClient, isGuest, submitLabel, onSubmit }) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [addingAddress, setAddingAddress] = useState(false);
  const { data: countries } = useCountries();
  const isCreate = mode === "create";
  const forWhom = Form.useWatch("for", form) ?? (isGuest ? "guest" : "client");
  const clientId = Form.useWatch("client_id", form);
  const repeats = Form.useWatch("repeats", form);

  const { data: services } = useApiQuery(() => listServiceNames().then(itemsOf), [], {
    initial: [],
    errorText: "Couldn't load the services",
  });
  const {
    data: addressPicks,
    reload: reloadAddresses,
  } = useApiQuery(() => listAddressPicks(clientId).then(itemsOf), [clientId], {
    initial: [],
    skip: !clientId || forWhom !== "client",
  });

  const finish = async (values) => {
    setSaving(true);
    try {
      await onSubmit(values);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Form form={form} layout="vertical" initialValues={initialValues} onFinish={finish} requiredMark="optional" scrollToFirstError>
      <Card title="Who and Where" className="form-card">
        {isCreate && (
          <Form.Item name="for">
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              disabled={lockClient}
              options={[
                { value: "client", label: "A client" },
                { value: "guest", label: "Someone who isn't a client" },
              ]}
            />
          </Form.Item>
        )}

        {forWhom === "client" ? (
          <div className="form-grid form-grid--2">
            {isCreate ? (
              <Form.Item label="Client" name="client_id" rules={[{ required: true, message: "Choose the client" }]}>
                <ClientSelect
                  clients={clients}
                  locked={lockClient}
                  onPick={() => form.setFieldValue("address_id", undefined)}
                />
              </Form.Item>
            ) : (
              <Form.Item label="Client">
                <Input value={initialValues?.client_name} disabled />
              </Form.Item>
            )}
            <Form.Item
              label="Address"
              name="address_id"
              extra={isCreate ? "Left empty, the client's primary address" : undefined}
            >
              <Select
                allowClear
                placeholder={clientId ? "Their primary address" : "Choose the client first"}
                disabled={!clientId}
                options={(addressPicks || []).map((pick) => ({
                  value: pick.id,
                  label: `${pick.label ? `${pick.label}: ` : ""}${pick.one_line}${pick.is_primary ? " (primary)" : ""}`,
                }))}
                popupRender={(menu) => (
                  <>
                    {menu}
                    <Divider style={{ margin: "4px 0" }} />
                    <Button type="text" block icon={<Plus size={14} />} onClick={() => setAddingAddress(true)}>
                      Add an address
                    </Button>
                  </>
                )}
              />
            </Form.Item>
          </div>
        ) : (
          <>
            <div className="form-grid form-grid--2">
              <Form.Item label="Name" name="name" rules={[{ required: true, whitespace: true, message: "Enter their name" }, { max: 150 }]}>
                <Input />
              </Form.Item>
              <Form.Item label="Company" name="company_name" rules={[{ max: 150 }]}>
                <Input />
              </Form.Item>
              <Form.Item label="Email" name="email" rules={[{ type: "email", message: "Enter a valid email" }]}>
                <Input type="email" />
              </Form.Item>
              <Form.Item label="Phone" name="phone" rules={[{ max: 50 }]}>
                <Input type="tel" />
              </Form.Item>
            </div>
            <AddressFields
              form={form}
              countries={countries}
              currentCity={initialValues?.city_id ? { id: initialValues.city_id, name: initialValues.city_name } : undefined}
              currentStateId={initialValues?.state_id}
            />
          </>
        )}
      </Card>

      <Card title="What and When" className="form-card">
        <Form.Item
          label="Services"
          name="service_ids"
          rules={[{ required: true, type: "array", min: 1, message: "Pick at least one service" }]}
        >
          <Select
            mode="multiple"
            optionFilterProp="label"
            options={(services || []).map((service) => ({ value: service.id, label: service.name }))}
          />
        </Form.Item>
        <div className="form-grid form-grid--3">
          {mode === "series" ? (
            <Form.Item
              label="Change From"
              name="from"
              rules={[{ required: true, message: "Pick the first date the change reaches" }]}
              extra="Visits from this date on that haven't started"
            >
              <DatePicker format={DATE_FORMAT} style={{ width: "100%" }} />
            </Form.Item>
          ) : (
            <Form.Item label="Date" name="date" rules={[{ required: true, message: "Pick the date" }]}>
              <DatePicker format={DATE_FORMAT} style={{ width: "100%" }} />
            </Form.Item>
          )}
          <Form.Item label="Starts" name="start_time" rules={[{ required: true, message: "Pick the start time" }]}>
            <TimePicker format={TIME_FORMAT} use12Hours minuteStep={15} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Ends" name="end_time">
            <TimePicker format={TIME_FORMAT} use12Hours minuteStep={15} style={{ width: "100%" }} />
          </Form.Item>
        </div>
        <Form.Item label="Title" name="title" rules={[{ max: 255 }]}>
          <Input placeholder="Such as Weekly office clean" />
        </Form.Item>
        <Form.Item label="Notes for the Crew" name="notes">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Card>

      <Card title="Crew" className="form-card">
        <CrewFields />
      </Card>

      {mode !== "visit" && (
        <Card
          title="Repeat"
          className="form-card"
          extra={
            isCreate && (
              <Form.Item name="repeats" valuePropName="checked" noStyle>
                <Switch checkedChildren="Repeats" unCheckedChildren="One visit" />
              </Form.Item>
            )
          }
        >
          {isCreate && !repeats ? (
            <p className="text-secondary">A single visit. Turn on Repeats for a weekly or monthly booking.</p>
          ) : (
            <RepeatFields form={form} startField={mode === "series" ? "from" : "date"} />
          )}
        </Card>
      )}

      <Button type="primary" htmlType="submit" size="large" loading={saving} block>
        {submitLabel}
      </Button>

      <AddressFormModal
        open={addingAddress}
        userId={clientId}
        title="Add an Address for This Client"
        onCancel={() => setAddingAddress(false)}
        onSaved={(address) => {
          setAddingAddress(false);
          reloadAddresses();
          if (address?.id) form.setFieldValue("address_id", address.id);
        }}
      />
    </Form>
  );
};

export default BookingForm;
