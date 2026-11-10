import { useEffect, useState } from "react";
import { AddUser, CityAPI, StateAPI } from "../../services/Api/Api";
import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";

import {
  Input,
  message,
  Select,
  Row,
  Col,
  Form,
  Radio,
  InputNumber,
  Button,
  Space,
} from "antd";
import PageHeader from "../../components/PageHeader";
import "./Customers.css";

// Static — never changes, so this doesn't need to be component state.
const COUNTRIES = [
  { id: 233, name: "USA" },
  { id: 39, name: "Canada" },
];

const AddCustomer = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [disable, setDisable] = useState(false);
  const [userType, setUserType] = useState("residential");

  // LOCATION — Country/State/City are owned ENTIRELY by the Form
  // now (name="country"/"state"/"city"). Previously these Selects
  // were double-controlled — bound to the Form via `name` AND
  // manually driven by external `value`/`onChange` React state at
  // the same time. Antd's Form ends up with a stale internal value
  // that never matches what's actually shown on screen, which is
  // why `values.country`/`values.address` etc. were coming through
  // empty when the form was submitted. Reading the live selection
  // via Form.useWatch (below) instead of a parallel state removes
  // that desync entirely.
  // Lat/long and the Google Maps preview have been dropped — the
  // backend never required them for a client's address (it falls
  // back to null), so they were pure complexity for no benefit, and
  // were part of the same double-controlled-input bug on the
  // Address field itself.

  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  const watchedCountry = Form.useWatch("country", form);
  const watchedState = Form.useWatch("state", form);

  const [commercialAreas, setCommercialAreas] = useState([
    { name: "Entrance / Lobby Areas", editable: false },
    { name: "Restrooms", editable: false },
    { name: "Kitchen Areas", editable: false },
    { name: "Office Areas", editable: false },
    { name: "Classrooms / Conference Rooms", editable: false },
    { name: "Group / Common Rooms", editable: false },
    { name: "All Areas / Hallways", editable: false },
  ]);

  // Fetch states whenever the selected country changes (including the
  // initial value on first render, since Form.useWatch reports that too).
  useEffect(() => {
    if (!watchedCountry) {
      setStates([]);
      return;
    }

    StateAPI(watchedCountry)
      .then((res) => setStates(res?.data?.data?.all_state || []))
      .catch((err) => {
        console.error("Error fetching states:", err);
        setStates([]);
      });
  }, [watchedCountry]);

  // Fetch cities whenever the selected state changes.
  useEffect(() => {
    if (!watchedState) {
      setCities([]);
      return;
    }

    CityAPI(watchedState)
      .then((res) => setCities(res?.data?.data?.all_city || []))
      .catch((err) => {
        console.error("Error fetching cities:", err);
        setCities([]);
      });
  }, [watchedState]);

  const carpetPercentage = Form.useWatch("carpet_percentage", form) || 0;
  const concretePercentage = Form.useWatch("concrete_percentage", form) || 0;
  const vctLvtPercentage = Form.useWatch("vct_lvt_percentage", form) || 0;
  const tilePercentage = Form.useWatch("tile_percentage", form) || 0;

  const totalFloorPercentage =
    Number(carpetPercentage) +
    Number(concretePercentage) +
    Number(vctLvtPercentage) +
    Number(tilePercentage);

  const handleSubmit = async (values) => {
    setDisable(true);

    try {
      const {
        name,
        email,
        sqft,
        walkaround_minutes,
        service_days,

        carpet_percentage,
        concrete_percentage,
        vct_lvt_percentage,
        tile_percentage,

        country,
        state,
        city,
        address,
        details = [],
        assigned_to,
      } = values;

      if (!name || !email) {
        message.error("Please fill all required fields");
        setDisable(false);
        return;
      }

      if (address && (!country || !state || !city)) {
        message.error(
          "Please select country, state and city if address is provided",
        );
        setDisable(false);
        return;
      }

      const totalFloorPercentage =
        Number(carpet_percentage || 0) +
        Number(concrete_percentage || 0) +
        Number(vct_lvt_percentage || 0) +
        Number(tile_percentage || 0);

      const hasFloorComposition =
        Number(carpet_percentage || 0) > 0 ||
        Number(concrete_percentage || 0) > 0 ||
        Number(vct_lvt_percentage || 0) > 0 ||
        Number(tile_percentage || 0) > 0;

      if (hasFloorComposition && totalFloorPercentage !== 100) {
        message.error("Floor composition must total 100%");
        setDisable(false);
        return;
      }

      const payload = {
        name,
        email,
        role_id: 6,
        client_type: userType,
        assigned_to,
        checklist: {
          estimated_sqft: sqft,
          walkaround_minutes,
          service_days,

          carpet_percentage,
          concrete_percentage,
          vct_lvt_percentage,
          tile_percentage,

          // Address is optional for a client. When provided, country/
          // state/city are required alongside it (validated above).
          // Lat/long are no longer collected here — the backend treats
          // them as optional and defaults to null.
          address: address || null,
          country_id: country || null,
          state_id: state || null,
          city_id: city || null,
          address_lat: null,
          address_long: null,

          details: details.map((item, index) => ({
            service_area: serviceAreas[index], // ✅ dynamic based on userType
            ...item,
          })),
        },
      };

      const response = await AddUser(payload);

      if (response.status === 200) {
        message.success("User added successfully");
        setTimeout(() => {
          navigate("/users");
        }, 1000);
      } else {
        message.error("Failed to add user");
        setDisable(false);
      }
    } catch (error) {
      const backendMessage =
        error.response?.data?.message ||
        error.message ||
        "Something went wrong";

      if (error.response?.status === 401) {
        message.error(backendMessage);
        localStorage.removeItem("adminToken");
        setTimeout(() => {
          navigate("/Login");
        }, 3000);
      } else {
        message.error(backendMessage);
      }
    } finally {
      setDisable(false);
    }
  };

  const navigateToUser = () => {
    navigate("/users");
  };

  const serviceAreas =
    userType === "residential"
      ? [
          "Entrance / Lobby Areas",
          "Bathrooms",
          "Kitchen",
          "Bedrooms",
          "Dining Room",
          "Living Room",
          "Foyer",
        ]
      : commercialAreas.map((item) => item.name);

  useEffect(() => {
    form.resetFields(["details"]);
  }, [userType]);

  const calculateTotal = () => {
    const details = form.getFieldValue("details") || [];

    const total = details.reduce((sum, item) => {
      // Residential
      const desks = Number(item?.num_desks_trash_cans || 0);

      // Commercial
      const stalls = Number(item?.stalls || 0);
      const sinks = Number(item?.sinks || 0);
      const restrooms = Number(item?.restrooms || 0);

      return sum + desks + stalls + sinks + restrooms;
    }, 0);

    setTotalCount(total);
  };

  return (
    <div>
      <PageHeader
        title="CLIENT MANAGEMENT"
        subtitle="Create New Client"
        actions={
          <Button
            size="large"
            icon={<ArrowLeft size={16} />}
            onClick={navigateToUser}
          >
            Return to Clients
          </Button>
        }
      />

      <div className="surface customer-form">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          onValuesChange={(changedValues) => {
            // Switching country invalidates whatever state/city were
            // picked for the old one.
            if (changedValues.country) {
              form.setFieldsValue({ state: undefined, city: undefined });
            }

            // Switching state invalidates whatever city was picked.
            if (changedValues.state) {
              form.setFieldsValue({ city: undefined });
            }
          }}
        >
          {/* Client Type — full width row on its own */}
          <Row>
            <Col span={24}>
              <Form.Item
                label="Client Type"
                name="userType"
                initialValue="residential"
                rules={[{ required: true, message: "Please select user type" }]}
                style={{ marginBottom: 24 }}
              >
                <Radio.Group
                  onChange={(e) => setUserType(e.target.value)}
                  value={userType}
                >
                  <Radio value="residential">Residential</Radio>
                  <Radio value="commercial">Commercial</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                label="Full Name"
                name="name"
                rules={[{ required: true, message: "Please enter name" }]}
              >
                <Input />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item
                label="Email Address"
                name="email"
                rules={[{ required: true, message: "Please enter email" }]}
              >
                <Input />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item
                label="Assign To"
                name="assigned_to"
                rules={[
                  { required: true, message: "Please select account manager" },
                ]}
              >
                <Select placeholder="Select Account Manager">
                  <Select.Option value={2}>Marco Williams</Select.Option>
                  <Select.Option value={5}>Yovanna C</Select.Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Estimated Sq/Ft" name="sqft">
                <Input type="number" min={0} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item
                label="Country"
                name="country"
                initialValue={COUNTRIES[0].id}
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const addr = getFieldValue("address");
                      if (!addr || value) return Promise.resolve();

                      return Promise.reject(
                        new Error(
                          "Country is required when address is provided",
                        ),
                      );
                    },
                  }),
                ]}
              >
                <Select
                  showSearch
                  placeholder="Select Country"
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
                  filterSort={(optionA, optionB) =>
                    optionA.children
                      .toLowerCase()
                      .localeCompare(optionB.children.toLowerCase())
                  }
                >
                  {COUNTRIES.map((country) => (
                    <Select.Option key={country.id} value={country.id}>
                      {country.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item
                label="State"
                name="state"
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const addr = getFieldValue("address");
                      if (!addr || value) return Promise.resolve();

                      return Promise.reject(
                        new Error("State is required when address is provided"),
                      );
                    },
                  }),
                ]}
              >
                <Select
                  showSearch
                  disabled={!watchedCountry}
                  placeholder="Select State"
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
                  filterSort={(optionA, optionB) =>
                    optionA.children
                      .toLowerCase()
                      .localeCompare(optionB.children.toLowerCase())
                  }
                >
                  {states.map((state) => (
                    <Select.Option key={state.id} value={state.id}>
                      {state.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item label="City" name="city">
                <Select
                  showSearch
                  disabled={!watchedState}
                  placeholder="Select City"
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
                  filterSort={(optionA, optionB) =>
                    optionA.children
                      .toLowerCase()
                      .localeCompare(optionB.children.toLowerCase())
                  }
                >
                  {cities.map((city) => (
                    <Select.Option key={city.id} value={city.id}>
                      {city.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Address" name="address">
                <Input placeholder="Street address" />
              </Form.Item>
            </Col>
          </Row>

          <div className="customer-floor">
            <div className="customer-floor__head">
              <div>
                <div className="customer-floor__title">
                  Overall Building Floor Composition
                </div>
                <div className="customer-floor__hint">
                  Enter the percentage of each flooring type for the entire
                  building. Total must equal 100%.
                </div>
              </div>
              <div
                className={`customer-pill ${
                  totalFloorPercentage === 100
                    ? "customer-pill--success"
                    : "customer-pill--error"
                }`}
              >
                Total: {totalFloorPercentage}% / 100%
              </div>
            </div>

            <Row gutter={[24, 24]}>
              <Col xs={24} sm={12} md={6}>
                <Form.Item
                  label="Carpet (%)"
                  name="carpet_percentage"
                  initialValue={0}
                >
                  <InputNumber min={0} max={100} style={{ width: "100%" }} />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Form.Item
                  label="Concrete (%)"
                  name="concrete_percentage"
                  initialValue={0}
                >
                  <InputNumber min={0} max={100} style={{ width: "100%" }} />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Form.Item
                  label="VCT/LVT (%)"
                  name="vct_lvt_percentage"
                  initialValue={0}
                >
                  <InputNumber min={0} max={100} style={{ width: "100%" }} />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Form.Item
                  label="Tile (%)"
                  name="tile_percentage"
                  initialValue={0}
                >
                  <InputNumber min={0} max={100} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <Form.Item key={userType}>
            <div className="customer-form__chart-head">
              <label className="customer-form__chart-title">
                Initial Client Chart
              </label>

              {userType === "commercial" && (
                <Button
                  type="primary"
                  onClick={() => {
                    const restroomCount = commercialAreas.filter((area) =>
                      area.name.includes("Restrooms"),
                    ).length;

                    setCommercialAreas((prev) => [
                      ...prev,
                      {
                        name: `Restrooms ${restroomCount}`,
                        editable: true,
                      },
                    ]);
                  }}
                >
                  + Add Rooms
                </Button>
              )}
            </div>

            <div className="customer-chart">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: "20%" }}>Service Area</th>

                    {userType === "commercial" ? (
                      <>
                        <th style={{ width: "18%" }}>
                          # of Trash Cans
                          <br />
                          <small className="customer-chart__sub">or Stalls</small>
                        </th>

                        <th style={{ width: "18%" }}>
                          # of Desks
                          <br />
                          <small className="customer-chart__sub">or Sinks</small>
                        </th>

                        <th style={{ width: "18%" }}>
                          # of Rooms
                          <br />
                          <small className="customer-chart__sub">
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
                      <small className="customer-chart__sub">
                        (Carpet, Hard Floor, VCT)
                      </small>
                    </th>

                    <th>Special Requests / Hot Spots</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceAreas.map((area, index) => (
                    <tr key={index}>
                      <td>
                        {userType === "commercial" &&
                        commercialAreas[index]?.editable ? (
                          <div className="customer-chart__area-input">
                            <Input
                              value={commercialAreas[index]?.name}
                              onChange={(e) => {
                                const updated = [...commercialAreas];
                                updated[index].name = e.target.value;
                                setCommercialAreas(updated);
                              }}
                            />

                            <Button
                              danger
                              type="text"
                              onClick={() => {
                                const updated = commercialAreas.filter(
                                  (_, i) => i !== index,
                                );

                                setCommercialAreas(updated);

                                const details =
                                  form.getFieldValue("details") || [];

                                details.splice(index, 1);

                                form.setFieldsValue({ details });
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        ) : (
                          <strong>{area}</strong>
                        )}
                      </td>

                      {userType === "commercial" ? (
                        <>
                          {/* Stalls */}
                          <td>
                            <Form.Item
                              name={["details", index, "stalls"]}
                              initialValue={0}
                              style={{ marginBottom: 0 }}
                            >
                              <InputNumber
                                min={0}
                                style={{ width: "100%" }}
                                onChange={calculateTotal}
                              />
                            </Form.Item>
                          </td>

                          {/* Sinks */}
                          <td>
                            <Form.Item
                              name={["details", index, "sinks"]}
                              initialValue={0}
                              style={{ marginBottom: 0 }}
                            >
                              <InputNumber
                                min={0}
                                style={{ width: "100%" }}
                                onChange={calculateTotal}
                              />
                            </Form.Item>
                          </td>

                          {/* Restrooms */}
                          <td>
                            <Form.Item
                              name={["details", index, "restrooms"]}
                              initialValue={0}
                              style={{ marginBottom: 0 }}
                            >
                              <InputNumber
                                min={0}
                                style={{ width: "100%" }}
                                onChange={calculateTotal}
                              />
                            </Form.Item>
                          </td>
                        </>
                      ) : (
                        <td>
                          <Form.Item
                            name={["details", index, "num_desks_trash_cans"]}
                            initialValue={0}
                            style={{ marginBottom: 0 }}
                          >
                            <Input
                              type="number"
                              min={0}
                              onChange={calculateTotal}
                            />
                          </Form.Item>
                        </td>
                      )}

                      {/* Flooring */}
                      <td>
                        <Form.Item
                          name={["details", index, "flooring_type"]}
                          style={{ marginBottom: 0 }}
                        >
                          <Radio.Group
                            style={{ display: "flex", flexWrap: "nowrap" }}
                          >
                            <Radio value="Carpet">Carpet</Radio>
                            <Radio value="Concrete">Concrete</Radio>
                            <Radio value="VCT/LVT">VCT/LVT</Radio>
                            <Radio value="Tile">Tile</Radio>
                          </Radio.Group>
                        </Form.Item>
                      </td>

                      {/* Special Requests */}
                      <td>
                        <Form.Item
                          name={["details", index, "special_requests"]}
                          style={{ marginBottom: 0 }}
                        >
                          <Input.TextArea
                            rows={2}
                            placeholder="Enter any special notes"
                          />
                        </Form.Item>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="customer-total">
              <div className="customer-total__box">
                <div className="customer-total__label">Total Count</div>
                <div className="customer-total__value">{totalCount}</div>
              </div>
            </div>
          </Form.Item>

          <Form.Item className="customer-form__actions">
            <Space>
              <Button type="primary" htmlType="submit" loading={disable}>
                Save
              </Button>
              <Button onClick={navigateToUser}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default AddCustomer;
