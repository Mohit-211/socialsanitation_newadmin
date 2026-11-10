import dayjs from "@/lib/dayjs";
import { useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  DatePicker,
  TimePicker,
  Select,
  InputNumber,
  message,
  Card,
  Checkbox,
  Table,
  Modal,
  Row,
  Col,
  Radio,
  Tabs,
  Tooltip,
  Space,
} from "antd";
import { ArrowLeft, Info } from "lucide-react";
import { useNavigate } from "react-router";
import {
  GetAllUserNameByAdmin,
  GetAllServiceNameByAdmin,
  GetUserAddressByUserId,
  CreateBookingByAdmin,
  GetClientChecklistByUserId,
} from "@/services/api/bookingApi";
import PageHeader from "@/components/PageHeader";
import "./bookings.scss";

const { Option } = Select;
const { TextArea } = Input;

const WEEKDAY_LABELS = [
  { label: "Sun", value: "Sun" },
  { label: "Mon", value: "Mon" },
  { label: "Tue", value: "Tue" },
  { label: "Wed", value: "Wed" },
  { label: "Thu", value: "Thu" },
  { label: "Fri", value: "Fri" },
  { label: "Sat", value: "Sat" },
];

const DATE_DISPLAY_FORMAT = "MM-DD-YYYY";

/* label + info tooltip helper */
const LabelWithTip = ({ label, tip }) => (
  <Space size={6} align="center">
    <span>{label}</span>
    <Tooltip title={tip}>
      <Info size={14} className="booking-form__tip-icon" />
    </Tooltip>
  </Space>
);

const CreateClientBookingPage = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [bookingType, setBookingType] = useState(null); // null initially

  const [recurrenceEndType, setRecurrenceEndType] = useState("after"); // default changed from "never" to "after" (see Ends default below)
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recurringType, setRecurringType] = useState("");
  // controls what the recurrence-type dropdown DISPLAYS (bi-weekly stays visible as bi-weekly)
  const [displayRecurringType, setDisplayRecurringType] = useState("week");
  const [repeatOnDays, setRepeatOnDays] = useState([]);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userSearch, setUserSearch] = useState("");

  const [clientChecklist, setClientChecklist] = useState([]);
  const [loadingChecklist, setLoadingChecklist] = useState(false);

  useEffect(() => {
    GetAllUserNameByAdmin().then((res) => setUsers(res.data.data || []));
    GetAllServiceNameByAdmin().then((res) => setServices(res.data.data || []));
  }, []);
  const [clientType, setClientType] = useState("residential");

  const handleUserChange = async (userId) => {
    // Clear previous checklist data
    form.setFieldsValue({ details: [] });

    setClientChecklist([]);
    setAddresses([]);
    setSelectedUser(null);

    if (!userId) return;

    setSelectedUser(users.find((u) => u.id === userId));

    form.setFieldsValue({
      user_id: userId,
    });

    try {
      setLoadingChecklist(true);

      /*
        ADDRESSES
      */

      const addrRes = await GetUserAddressByUserId(userId);

      setAddresses(addrRes.data.data || []);

      /*
        CHECKLIST
      */

      const checklistRes = await GetClientChecklistByUserId(userId);

      const checklistData = checklistRes?.data?.data?.data?.[0] || {};

      /*
        CLIENT TYPE
      */

      setClientType(checklistData?.client_type || "residential");

      /*
        CHECKLIST DETAILS
      */

      const list = checklistData?.user_client_checklist_details || [];

      setClientChecklist(list);

      /*
        READ ONLY
      */
    } catch (error) {
      console.error("Error fetching checklist:", error);

      setClientChecklist([]);
      setClientType("residential");

      message.error("Failed to fetch client checklist");
    } finally {
      setLoadingChecklist(false);
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    const payload = {
      booking_name: values.booking_name,
      user_id: values.user_id,
      address_id: values.address_id,
      service_id: values.service_id,
      date: dayjs(values.date).format("YYYY-MM-DD"),
      time: dayjs(values.time).format("HH:mm:ss"),
      end_time_by_admin: dayjs(values.end_time_by_admin).format("HH:mm:ss"),
      timezone: "America/New_York",
      type: values.type,
      notes: values.notes,
      is_recurring: values.type === "Recurring Booking",
    };

    if (payload.is_recurring) {
      payload.recurring_every = values.recurring_every;
      payload.recurring_type = values.recurring_type;
      payload.repeat_on_days = values.repeat_on_days || [];
      payload.recurrence_end_type = recurrenceEndType;
      if (recurrenceEndType === "on_date") {
        payload.recurrence_end_value = dayjs(
          values.recurrence_end_value_date,
        ).format("YYYY-MM-DD");
      } else if (recurrenceEndType === "after") {
        payload.recurrence_end_value = values.recurrence_end_value_count;
      } else {
        payload.recurrence_end_value = null;
      }
    }

    try {
      const res = await CreateBookingByAdmin(payload);
      if (res.status === 201) {
        message.success("Booking created successfully!");
        setTimeout(() => {
          navigate(`/editBooking/${res.data?.data?.booking_id}`);
        }, 500);
      } else {
        message.error("Unexpected response. Please try again.");
      }
    } catch {
      message.error("Failed to create booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) =>
    (user?.user_profile?.name || "")
      .toLowerCase()
      .includes(userSearch.toLowerCase()),
  );

  const userColumns = [
    {
      title: "Name",
      dataIndex: ["user_profile", "name"],
      key: "name",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button
          type="link"
          onClick={() => {
            setSelectedUser(record);
            form.setFieldValue("user_id", record.id);
            handleUserChange(record.id);
            setUserModalVisible(false);
          }}
        >
          Select
        </Button>
      ),
    },
  ];

  useEffect(() => {
    if (bookingType === "Recurring Booking") {
      setRecurringType("week"); // default unit
      setDisplayRecurringType("week"); // keep dropdown display in sync
      setRepeatOnDays(["Mon", "Tue"]); // default weekdays
      form.setFieldValue("recurring_type", "week");
      form.setFieldValue("recurring_every", 1);
      form.setFieldValue("repeat_on_days", ["Mon", "Tue"]);
    }
  }, [bookingType]);

  return (
    <div>
      <PageHeader
        title="BOOKING MANAGEMENT"
        subtitle="Create a new client booking"
        actions={
          <Button
            size="large"
            icon={<ArrowLeft size={16} />}
            onClick={() => navigate("/bookings")}
          >
            Return to Bookings
          </Button>
        }
      />

      <div className="surface bookings-tabs">
        <Tabs
          defaultActiveKey="client"
          onChange={(key) => {
            if (key === "guest") {
              navigate("/create-non-client-booking");
            }
          }}
          items={[
            {
              key: "client",
              label: "Client Booking",
              children: null, // we’ll render the form below anyway
            },
            {
              key: "guest",
              label: "Non-Client Booking",
              children: null, // navigation will handle this
            },
          ]}
        />
      </div>

      <Card title="Create New Booking">
        <Form
          layout="vertical"
          form={form}
          onFinish={onFinish}
          initialValues={{
            recurring_every: 1,
            recurring_type: "week",
          }}
        >
          {/* User selection modal trigger */}

          <Row gutter={16} align="middle">
            {/* Booking Name - 40% */}
            <Col xs={24} md={10}>
              <Form.Item
                name="booking_name"
                label="Booking Name"
                rules={[
                  { required: true, message: "Please enter booking name" },
                ]}
              >
                <Input placeholder="Enter Booking Name" />
              </Form.Item>
            </Col>

            {/* User Section - 60% */}
            <Col xs={24} md={14}>
              <Row gutter={8}>
                <Col span={18}>
                  <Input
                    readOnly
                    value={selectedUser?.user_profile?.name || ""}
                    placeholder="Click to select user"
                    onClick={() => setUserModalVisible(true)}
                  />
                </Col>
                <Col span={6}>
                  <Button
                    type="primary"
                    onClick={() => setUserModalVisible(true)}
                    block
                  >
                    Select
                  </Button>
                </Col>
              </Row>
            </Col>
          </Row>

          <Form.Item
            name="user_id"
            noStyle
            rules={[{ required: true, message: "User is required" }]}
          >
            <Input type="hidden" />
          </Form.Item>

          <Form.Item label="Initial Client Chart" style={{ marginBottom: 24 }}>
            {loadingChecklist ? (
              <p className="text-muted">Loading checklist...</p>
            ) : clientChecklist.length > 0 ? (
              <div className="booking-form__chart">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: "20%" }}>Service Area</th>

                      {clientType === "commercial" ? (
                        <>
                          <th style={{ width: "18%" }}>
                            # of Trash Cans
                            <br />
                            <small className="booking-form__chart-hint">
                              or Stalls
                            </small>
                          </th>

                          <th style={{ width: "18%" }}>
                            # of Desks
                            <br />
                            <small className="booking-form__chart-hint">
                              or Sinks
                            </small>
                          </th>

                          <th style={{ width: "18%" }}>
                            # of Rooms
                            <br />
                            <small className="booking-form__chart-hint">
                              or Restrooms
                            </small>
                          </th>
                        </>
                      ) : (
                        <th style={{ width: "22%" }}>
                          # of Desks / Trash Cans (Big Buildings)
                          <br />
                          <strong>OR</strong>
                          <br /># of Restrooms
                        </th>
                      )}

                      <th style={{ width: "26%" }}>
                        Type of Flooring
                        <br />
                        <small className="booking-form__chart-hint">
                          (Carpet, Hard Floor, VCT)
                        </small>
                      </th>

                      <th>Special Requests / Hot Spots</th>
                    </tr>
                  </thead>

                  <tbody>
                    {clientChecklist.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.service_area}</strong>
                        </td>

                        {clientType === "commercial" ? (
                          <>
                            <td>{item.stalls || 0}</td>
                            <td>{item.sinks || 0}</td>
                            <td>{item.restrooms || 0}</td>
                          </>
                        ) : (
                          <td>{item.num_desks_trash_cans || 0}</td>
                        )}

                        <td>{item.flooring_type || "-"}</td>

                        <td>{item.special_requests || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted booking-form__empty">
                No checklist available
              </p>
            )}
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="address_id" label="Address" required>
                <Select placeholder="Select address">
                  {addresses.map((addr) => (
                    <Option key={addr.id} value={addr.id}>
                      {`${addr.address}, ${addr.user_city?.name}, ${addr.user_state?.name}`}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="service_id"
                label="Service"
                rules={[{ required: true }]}
              >
                <Select placeholder="Select service">
                  {services.map((s) => (
                    <Option key={s.id} value={s.id}>
                      {s.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="type"
            label={
              <LabelWithTip
                label="Booking Type"
                tip="One-time books a single appointment. Recurring repeats it on a schedule, just like a recurring Google Calendar event."
              />
            }
            rules={[{ required: true }]}
          >
            <Select
              placeholder="Select booking type"
              onChange={(val) => setBookingType(val)}
            >
              <Option value="One Time Booking">One-time Booking</Option>
              <Option value="Recurring Booking">Recurring Booking</Option>
            </Select>
          </Form.Item>

          {bookingType === "One Time Booking" && (
            <Row gutter={16}>
              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  name="date"
                  label="Date"
                  rules={[{ required: true }]}
                >
                  <DatePicker
                    style={{ width: "100%" }}
                    format={DATE_DISPLAY_FORMAT}
                    disabledDate={(current) =>
                      current && current < dayjs().startOf("day")
                    }
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  name="time"
                  label="Time"
                  rules={[{ required: true }]}
                >
                  <TimePicker
                    minuteStep={5}
                    format="hh:mm A"
                    use12Hours
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  name="end_time_by_admin"
                  label="End Time"
                  rules={[
                    { required: true, message: "Please select end time" },
                  ]}
                >
                  <TimePicker
                    minuteStep={5}
                    format="hh:mm A"
                    use12Hours
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>
            </Row>
          )}

          {bookingType === "Recurring Booking" && (
            <Card title="Custom Recurrence" className="booking-form__recurrence">
              <Row gutter={16}>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item
                    name="date"
                    label={
                      <LabelWithTip
                        label="Start date"
                        tip="The date of the first occurrence in this recurring series."
                      />
                    }
                    rules={[{ required: true }]}
                  >
                    <DatePicker
                      style={{ width: "100%" }}
                      format={DATE_DISPLAY_FORMAT}
                      disabledDate={(current) =>
                        current && current < dayjs().startOf("day")
                      }
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item
                    name="time"
                    label={
                      <LabelWithTip
                        label="Start time"
                        tip="Time each occurrence of this booking begins."
                      />
                    }
                    rules={[{ required: true }]}
                  >
                    <TimePicker
                      minuteStep={5}
                      format="hh:mm A"
                      use12Hours
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item
                    name="end_time_by_admin"
                    label={
                      <LabelWithTip
                        label="End Time"
                        tip="Time each occurrence of this booking is expected to end."
                      />
                    }
                    rules={[
                      { required: true, message: "Please select end time" },
                    ]}
                  >
                    <TimePicker
                      minuteStep={5}
                      format="hh:mm A"
                      use12Hours
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={8}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="recurring_every"
                    label={
                      <LabelWithTip
                        label="Repeat every"
                        tip="How many units between occurrences — e.g. 'every 2' with Weekly means every 2 weeks. Locked to 2 for Bi-weekly."
                      />
                    }
                    rules={[{ required: true }]}
                  >
                    <InputNumber
                      min={1}
                      style={{ width: "100%" }}
                      disabled={
                        form.getFieldValue("recurring_type") === "week" &&
                        form.getFieldValue("recurring_every") === 2
                      }
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={
                      <LabelWithTip
                        label="Frequency"
                        tip="How often this booking repeats — Daily, Weekly, Bi-weekly, Monthly, or Yearly."
                      />
                    }
                  >
                    <Select
                      value={displayRecurringType}
                      onChange={(val) => {
                        setDisplayRecurringType(val);

                        setRecurringType(val);
                        form.setFieldValue("recurring_type", val);

                        if (val === "week") {
                          form.setFieldValue("recurring_every", 1);
                          setRepeatOnDays(["Mon", "Tue"]);
                          form.setFieldValue("repeat_on_days", [
                            "Mon",
                            "Tue",
                          ]);
                        } else {
                          setRepeatOnDays([]);
                          form.setFieldValue("repeat_on_days", []);
                        }

                      }}
                    >
                      <Option value="day">Daily</Option>
                      <Option value="week">Weeks</Option>
                      <Option value="month">Months</Option>
                      <Option value="year">Year</Option>
                    </Select>
                  </Form.Item>

                  {/* Hidden field — carries the actual backend value (bi-weekly stays "week") */}
                  <Form.Item
                    name="recurring_type"
                    hidden
                    rules={[{ required: true }]}
                  >
                    <Input type="hidden" />
                  </Form.Item>
                </Col>
              </Row>

              {recurringType === "week" && (
                <Form.Item
                  label={
                    <LabelWithTip
                      label="Repeat on"
                      tip="Select which day(s) of the week this booking repeats on."
                    />
                  }
                  name="repeat_on_days"
                >
                  <Checkbox.Group
                    options={WEEKDAY_LABELS}
                    value={repeatOnDays}
                    onChange={(days) => {
                      setRepeatOnDays(days);
                      form.setFieldValue("repeat_on_days", days);
                    }}
                  />
                </Form.Item>
              )}

              <Form.Item
                label={
                  <LabelWithTip
                    label="Ends"
                    tip="Choose whether this recurring booking continues indefinitely, stops on a specific date, or stops after a set number of occurrences."
                  />
                }
              >
                <Radio.Group
                  value={recurrenceEndType}
                  onChange={(e) => {
                    setRecurrenceEndType(e.target.value);
                    form.setFieldsValue({
                      recurrence_end_value_date: null,
                      recurrence_end_value_count: null,
                    });
                  }}
                >
                  <Row gutter={16} style={{ marginBottom: 8 }}>
                    <Col xs={24} sm={12} md={6}>
                      <Radio value="never">Never (max 100 entries)</Radio>
                    </Col>
                  </Row>

                  <Row gutter={16} align="middle" style={{ marginBottom: 8 }}>
                    <Col xs={24} sm={12} md={6}>
                      <Radio value="on_date">On</Radio>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="recurrence_end_value_date"
                        noStyle
                        initialValue={dayjs()} // default today
                        rules={
                          recurrenceEndType === "on_date"
                            ? [
                                {
                                  required: true,
                                  message: "Please select end date",
                                },
                              ]
                            : []
                        }
                      >
                        <DatePicker
                          disabled={recurrenceEndType !== "on_date"}
                          format={DATE_DISPLAY_FORMAT}
                          style={{ width: "100%", marginLeft: "50px" }}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16} align="middle">
                    <Col xs={24} sm={12} md={6}>
                      <Radio value="after">After</Radio>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                      <Form.Item
                        name="recurrence_end_value_count"
                        noStyle
                        initialValue={3}
                        rules={
                          recurrenceEndType === "after"
                            ? [
                                {
                                  required: true,
                                  message: "Enter number of occurrences",
                                },
                              ]
                            : []
                        }
                      >
                        {/* default occurrence count changed from 1 to 3 per manager request */}
                        <InputNumber
                          min={1}
                          max={52}
                          disabled={recurrenceEndType !== "after"}
                          style={{ width: "100%", marginLeft: "50px" }}
                        />
                      </Form.Item>
                    </Col>
                    <Col style={{ paddingLeft: "50px" }}>occurrences</Col>
                  </Row>
                </Radio.Group>
              </Form.Item>
            </Card>
          )}

          <Form.Item name="notes" label="Notes">
            <TextArea rows={3} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Next
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* User Selection Modal */}
      <Modal
        title="Select a User"
        open={userModalVisible}
        onCancel={() => setUserModalVisible(false)}
        footer={null}
        width={700}
      >
        <Input.Search
          placeholder="Search users by name"
          onChange={(e) => setUserSearch(e.target.value)}
          style={{ marginBottom: 16 }}
          allowClear
        />

        <Table
          dataSource={filteredUsers}
          columns={userColumns}
          rowKey="id"
          pagination={{ pageSize: 100 }}
        />
      </Modal>
    </div>
  );
};

export default CreateClientBookingPage;