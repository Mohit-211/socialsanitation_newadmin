/** @format */

import React, { useEffect, useState, useCallback } from "react";
import {
  Form,
  Input,
  Button,
  Select,
  Card,
  Row,
  Col,
  Typography,
  message,
  Modal,
  Radio,
  InputNumber,
} from "antd";
import { Box, Paper, Button as MuiButton, Typography as MuiTypography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate, useParams } from "react-router-dom";
import {
  GetUserById,
  EditUserById,
  StateAPI,
  CityAPI,
  AddNewUserAddress,
  EditAddress,
} from "../../services/Api/Api";

const { Title } = Typography;

const UpdateServiceProvider = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [coordinates, setCoordinates] = useState({ lat: null, lng: null });
  const [loading, setLoading] = useState(false);
  const [userAddresses, setUserAddresses] = useState([]);

  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm] = Form.useForm();
  const [addressCoordinates, setAddressCoordinates] = useState({
    lat: null,
    lng: null,
  });

  const navigateToEmployees = () => {
    navigate("/employees");
  };

  useEffect(() => {
    StateAPI(233).then((res) => {
      setStates(res?.data?.data?.all_state || []);
    });
  }, []);

  const fetchCities = (stateId) => {
    return CityAPI(stateId).then((res) => {
      const citiesList = res?.data?.data?.all_city || [];
      setCities(citiesList);
      return citiesList; // Needed for chaining
    });
  };

  const fetchCoordinates = async (address) => {
    if (!address) return;
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          address,
        )}&key=AIzaSyB45G8TScEmJSSG_PIzLJV2I6Ej1qgc_4o`,
      );
      const data = await res.json();
      if (data.status === "OK") {
        const location = data.results[0].geometry.location;
        setCoordinates({ lat: location.lat, lng: location.lng });
        setAddressCoordinates({ lat: location.lat, lng: location.lng });
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    GetUserById(id).then((res) => {
      const data = res.data.data;
      const checklist = data?.user_client_checklist?.[0];
      const details = checklist?.user_client_checklist_details || [];
      const state_id = checklist?.state_id;

      form.setFieldsValue({
        name: data?.user_profile?.name,
        employee_type: data?.employee_type,

        email: data?.email,
        address: checklist?.address,
        state_id,
        city_id: checklist?.city_id,
      });

      if (state_id) fetchCities(state_id);
      if (checklist?.address) fetchCoordinates(checklist.address);
      setUserAddresses(data?.user_address || []);
    });
  }, [id, form]);

  const handleSave = async (values) => {
    setLoading(true);
    const payload = {
      name: values.name,
      employee_type: values.employee_type,

      checklist: {
        estimated_sqft: values.sqft,
        walkaround_minutes: values.walkaround_minutes,
        service_days: values.service_days,

        carpet_percentage: values.carpet_percentage,
        concrete_percentage: values.concrete_percentage,
        vct_lvt_percentage: values.vct_lvt_percentage,
        tile_percentage: values.tile_percentage,

        address: values.address,
        state_id: values.state_id,
        city_id: values.city_id,
        address_lat: coordinates.lat,
        address_long: coordinates.lng,
        details: values.details || [],
      },
    };

    console.log("Submitting payload", JSON.stringify(payload, null, 2));

    try {
      await EditUserById(id, payload);
      message.success("Employee updated successfully");
      setTimeout(() => navigate("/employees"), 1000);
    } catch (err) {
      console.log(err);
      message.error("Update failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAddress = async () => {
    const values = await addressForm.validateFields();

    // Shared payload for both add/edit
    const basePayload = {
      address: values.address,
      state_id: values.state_id,
      city_id: values.city_id,
      country_id: 233,
      address_lat: addressCoordinates.lat,
      address_long: addressCoordinates.lng,
    };

    try {
      if (editingAddress) {
        const editpayload = {
          user_address_id: editingAddress.id,
          ...basePayload,
        };
        await EditAddress(editpayload);
        message.success("Address updated");
      } else {
        const addpayload = {
          user_id: id,
          ...basePayload,
        };
        await AddNewUserAddress(addpayload);
        message.success("Address added");
      }

      const updated = await GetUserById(id);
      setUserAddresses(updated.data.data?.user_address || []);
      setAddressModalVisible(false);
      setEditingAddress(null);
      addressForm.resetFields();
      setAddressCoordinates({ lat: null, lng: null });
    } catch (err) {
      message.error("Failed to save address");
    }
  };

  return (
    <Box>
      {/* ---- Shared header (matches UpdateCustomer / ServiceProvider / User) ---- */}
      <Paper
        variant="outlined"
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: "10px",
          borderColor: "#eef0f2",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            gap: 2,
          }}
        >
          <Box>
            <MuiTypography className="page-title">
              EMPLOYEE MANAGEMENT
            </MuiTypography>
            <MuiTypography className="page-sub-title">
              Update Employee Details
            </MuiTypography>
          </Box>

          <MuiButton
            variant="contained"
            disableElevation
            startIcon={<ArrowBackIcon />}
            onClick={navigateToEmployees}
            sx={{
              height: 47,
              px: 3,
              borderRadius: "8px",
              minWidth: 180,
              textTransform: "none",
              fontWeight: 600,
              backgroundColor: "#2c3345",
              flexShrink: 0,
              ml: "auto",
              "&:hover": {
                backgroundColor: "#1f2433",
              },
            }}
          >
            Return to Employees
          </MuiButton>
        </Box>
      </Paper>

      <Card>
        <Form
          layout="vertical"
          form={form}
          onFinish={handleSave}
          onValuesChange={(changed) => {
            if (changed.address) fetchCoordinates(changed.address);
            if (changed.state_id) fetchCities(changed.state_id);
          }}
        >
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item
                name="name"
                label="Full Name"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="email" label="Email">
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="employee_type"
                label="Employee Type"
                rules={[
                  {
                    required: true,
                    message: "Please select employee type",
                  },
                ]}
              >
                <Select placeholder="Select Employee Type">
                  <Select.Option value="W2_BI_WEEKLY">
                    W2 Bi-Weekly
                  </Select.Option>

                  <Select.Option value="1099">1099 Contractor</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Card style={{ marginBottom: 24 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Title level={5} style={{ margin: 0 }}>
                User Addresses
              </Title>
              <Button
                type="primary"
                onClick={() => {
                  setEditingAddress(null);
                  addressForm.resetFields();
                  setCoordinates({ lat: null, lng: null });
                  setAddressModalVisible(true);
                }}
              >
                + Add Address
              </Button>
            </div>

            {userAddresses.length === 0 ? (
              <Typography.Text type="secondary">
                No address found
              </Typography.Text>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {userAddresses.map((addr) => (
                  <div
                    key={addr.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 16px",
                      border: "1px solid #f0f0f0",
                      borderRadius: 8,
                      backgroundColor: "#fff",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                    }}
                  >
                    <div style={{ fontSize: 14, color: "#333" }}>
                      {addr.address}, {addr.user_city?.name},{" "}
                      {addr.user_state?.name}, {addr.user_country?.name}
                    </div>
                    <Button
                      type="link"
                      onClick={() => {
                        console.log("Editing Address:", addr);
                        setEditingAddress(addr);
                        setAddressModalVisible(true);

                        // Wait for modal to open
                        setTimeout(() => {
                          addressForm.resetFields();

                          // ✅ Optional debug log for individual fields
                          console.log("Setting address:", addr.address);
                          console.log("Setting state_id:", addr.state_id);
                          console.log("Setting city_id:", addr.city_id);

                          addressForm.setFieldsValue({
                            address: addr.address,
                            state_id: addr.state_id,
                          });
                          console.log(addressForm, "addressForm");

                          setAddressCoordinates({
                            lat: addr.address_lat,
                            lng: addr.address_long,
                          });

                          fetchCities(addr.state_id).then(() => {
                            addressForm.setFieldsValue({
                              city_id: addr.city_id,
                            });
                          });

                          console.log(addr.address, "addres");

                          setTimeout(() => fetchCoordinates(addr.address), 200);
                        }, 100); // Delay ensures modal and form are mounted
                      }}
                    >
                      Edit
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Form.Item style={{ marginTop: "50px" }}>
            <Button type="primary" htmlType="submit" loading={loading}>
              Save
            </Button>
            <Button
              style={{ marginLeft: 8 }}
              onClick={() => navigate("/users")}
            >
              Cancel
            </Button>
          </Form.Item>
        </Form>

        <Modal
          title={editingAddress ? "Edit Address" : "Add New Address"}
          open={addressModalVisible}
          onCancel={() => {
            setAddressModalVisible(false);
            setEditingAddress(null);
            addressForm.resetFields();
            setCities([]);
            setAddressCoordinates({ lat: null, lng: null });
          }}
          onOk={handleSaveAddress}
          forceRender
        >
          <Form
            form={addressForm}
            layout="vertical"
            onValuesChange={(changedValues, allValues) => {
              if (changedValues.state_id) {
                addressForm.setFieldsValue({ city_id: undefined }); // reset city
                fetchCities(changedValues.state_id);
              }
              if (changedValues.address) {
                // Build full address string for geocoding
                const fullAddress = `${changedValues.address}, ${
                  states.find((s) => s.id === allValues.state_id)?.name || ""
                }, ${cities.find((c) => c.id === allValues.city_id)?.name || ""}`;
                fetchCoordinates(fullAddress);
              }
            }}
          >
            {/* Address Field */}
            <Form.Item
              name="address"
              label="Address"
              rules={[{ required: true, message: "Please enter the address" }]}
            >
              <Input placeholder="Enter address" />
            </Form.Item>

            {/* State Select with Search */}
            <Form.Item
              name="state_id"
              label="State"
              rules={[{ required: true, message: "Please select a state" }]}
            >
              <Select
                showSearch
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
                {states.map((s) => (
                  <Select.Option key={s.id} value={s.id}>
                    {s.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            {/* City Select with Search */}
            <Form.Item
              name="city_id"
              label="City"
              rules={[{ required: true, message: "Please select a city" }]}
            >
              <Select
                showSearch
                placeholder="Select City"
                disabled={!addressForm.getFieldValue("state_id")}
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
                {cities.map((c) => (
                  <Select.Option key={c.id} value={c.id}>
                    {c.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            {/* Map Preview */}
            <Form.Item label="Map Preview">
              <div
                style={{
                  border: "1px solid #ccc",
                  height: 250,
                  borderRadius: 8,
                }}
              >
                {addressCoordinates.lat && addressCoordinates.lng ? (
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: "none" }}
                    src={`https://maps.google.com/maps?q=${addressCoordinates.lat},${addressCoordinates.lng}&z=16&output=embed`}
                    allowFullScreen
                  />
                ) : (
                  <p
                    style={{
                      textAlign: "center",
                      paddingTop: 80,
                      color: "#999",
                    }}
                  >
                    Enter address to show map
                  </p>
                )}
              </div>
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </Box>
  );
};

export default UpdateServiceProvider;
