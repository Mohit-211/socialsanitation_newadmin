/** @format */

import { Box } from "@mui/material";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AddUser, CityAPI, StateAPI } from "../../services/Api/Api";
import { useNavigate } from "react-router-dom";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
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
  Button as AntButton,
} from "antd";
import { debounce } from "lodash";

// ---- table style tokens (kept local so this file is self-contained) ----
const tableWrapStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  overflow: "hidden",
};

const thStyle = {
  textAlign: "left",
  padding: "14px 16px",
  background: "#fafafa",
  borderBottom: "1px solid #e5e7eb",
  borderRight: "1px solid #e5e7eb",
  fontSize: "13px",
  fontWeight: 600,
  color: "#374151",
  verticalAlign: "top",
};

const tdStyle = {
  padding: "14px 16px",
  borderBottom: "1px solid #e5e7eb",
  borderRight: "1px solid #e5e7eb",
  verticalAlign: "middle",
  background: "#fff",
};

const AddCustomer = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sqft, setSqft] = useState("");
  const [serviceDays, setServiceDays] = useState("");
  const [address, setAddress] = useState("");
  const [disable, setDisable] = useState(false);
  const [userType, setUserType] = useState("residential");
  const [assignedTo, setAssignedTo] = useState(null);

  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [coordinates, setCoordinates] = useState({ lat: null, lng: null });
  const [totalCount, setTotalCount] = useState(0);

  const [commercialAreas, setCommercialAreas] = useState([
    { name: "Entrance / Lobby Areas", editable: false },
    { name: "Restrooms", editable: false },
    { name: "Kitchen Areas", editable: false },
    { name: "Office Areas", editable: false },
    { name: "Classrooms / Conference Rooms", editable: false },
    { name: "Group / Common Rooms", editable: false },
    { name: "All Areas / Hallways", editable: false },
  ]);

  useEffect(() => {
    StateAPI(233)
      .then((res) => setStates(res?.data?.data?.all_state || []))
      .catch((err) => console.log("Error fetching states:", err));
  }, []);

  const carpetPercentage = Form.useWatch("carpet_percentage", form) || 0;
  const concretePercentage = Form.useWatch("concrete_percentage", form) || 0;
  const vctLvtPercentage = Form.useWatch("vct_lvt_percentage", form) || 0;
  const tilePercentage = Form.useWatch("tile_percentage", form) || 0;

  const totalFloorPercentage =
    Number(carpetPercentage) +
    Number(concretePercentage) +
    Number(vctLvtPercentage) +
    Number(tilePercentage);

  const handleStateChange = (stateId) => {
    setSelectedState(stateId);
    setSelectedCity(null);
    setCities([]);
    setCoordinates({ lat: null, lng: null });

    CityAPI(stateId)
      .then((res) => {
        const newCities = res?.data?.data?.all_city || [];
        setCities(newCities);
      })
      .catch((err) => {
        console.log("Error fetching cities:", err);
        setCities([]);
      });
  };

  const fetchCoordinates = useCallback(async (address) => {
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
      } else {
        setCoordinates({ lat: null, lng: null }); // reset if not found
      }
    } catch (error) {
      console.error("Error fetching coordinates:", error);
      setCoordinates({ lat: null, lng: null });
    }
  }, []);

  const debouncedFetchCoordinates = useMemo(
    () => debounce(fetchCoordinates, 1000),
    [fetchCoordinates],
  );

  useEffect(() => {
    debouncedFetchCoordinates(address);
  }, [address, debouncedFetchCoordinates]);

  const mapRef = React.useRef(null);
  const markerRef = React.useRef(null);
  const mapInstance = React.useRef(null);

  useEffect(() => {
    if (!window.google) {
      const script = document.createElement("script");
      script.src =
        "https://maps.googleapis.com/maps/api/js?key=AIzaSyB45G8TScEmJSSG_PIzLJV2I6Ej1qgc_4o&libraries=places";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);

      script.onload = () => {
        console.log("Google Maps script loaded");
      };
    }
  }, []);

  useEffect(() => {
    if (
      !coordinates.lat ||
      !coordinates.lng ||
      typeof window.google === "undefined" ||
      !mapRef.current
    )
      return;

    // Initialize map only once
    if (!mapInstance.current) {
      mapInstance.current = new window.google.maps.Map(mapRef.current, {
        center: coordinates,
        zoom: 16,
      });
    } else {
      mapInstance.current.setCenter(coordinates);
    }

    // Clear old marker
    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    // Add new draggable marker
    markerRef.current = new window.google.maps.Marker({
      position: coordinates,
      map: mapInstance.current,
      draggable: true,
    });

    markerRef.current.addListener("dragend", (event) => {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      setCoordinates({ lat, lng });
    });
  }, [coordinates]);

  const handleSubmit = async (values) => {
    setDisable(true);

    try {
      const {
        name,
        email,
        sqft,
        walkaround_minutes,

        carpet_percentage,
        concrete_percentage,
        vct_lvt_percentage,
        tile_percentage,

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

      // Check if address is partially filled
      if (address && (!selectedState || !selectedCity)) {
        message.error(
          "Please select both state and city if address is provided",
        );
        setDisable(false);
        return;
      }

      const totalFloorPercentage =
        Number(carpet_percentage || 0) +
        Number(concrete_percentage || 0) +
        Number(vct_lvt_percentage || 0) +
        Number(tile_percentage || 0);

      if (totalFloorPercentage !== 100) {
        message.error("Floor composition must total 100%");
        setDisable(false);
        return;
      }
      const payload = {
        name,
        email,
        role_id: 6,
        client_type: userType, // ✅ send to backend
        assigned_to,
        checklist: {
          estimated_sqft: sqft,
          walkaround_minutes,
          service_days: serviceDays,

          carpet_percentage,
          concrete_percentage,
          vct_lvt_percentage,
          tile_percentage,

          address,
          state_id: selectedState,
          city_id: selectedCity,
          address_lat: coordinates.lat,
          address_long: coordinates.lng,
          details: details.map((item, index) => ({
            service_area: serviceAreas[index], // ✅ dynamic based on userType
            ...item,
          })),
        },
      };

      console.log(payload, "payload");

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
    form.resetFields(["details"]); // Or resetFields() for everything
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
    <Box>
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
      gap: 2,
    }}
  >
    <Box>
      <Typography className="page-title">
        CLIENT MANAGEMENT
      </Typography>
      <Typography className="page-sub-title">
        Create New Client
      </Typography>
    </Box>

    <Button
      variant="contained"
      disableElevation
      startIcon={<ArrowLeft size={18} />}
      onClick={navigateToUser}
      sx={{
        ml: "auto",
        height: 47,
        px: 3,
        borderRadius: "8px",
        minWidth: 185,
        textTransform: "none",
        fontWeight: 600,
        backgroundColor: "#2c3345",
        "&:hover": {
          backgroundColor: "#1f2433",
        },
      }}
    >
      Return to Clients
    </Button>
  </Box>
</Paper>

      <Paper
        variant="outlined"
        sx={{
          p: 4,
          borderRadius: "10px",
          borderColor: "#eef0f2",
        }}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
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
            <Col span={6}>
              <Form.Item
                label="Full Name"
                name="name"
                rules={[{ required: true, message: "Please enter name" }]}
              >
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </Form.Item>
            </Col>

            <Col span={6}>
              <Form.Item
                label="Email Address"
                name="email"
                rules={[{ required: true, message: "Please enter email" }]}
              >
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Form.Item>
            </Col>

            <Col span={6}>
              <Form.Item
                label="Assign To"
                name="assigned_to"
                rules={[
                  { required: true, message: "Please select account manager" },
                ]}
              >
                <Select
                  placeholder="Select Account Manager"
                  onChange={(value) => setAssignedTo(value)}
                  value={assignedTo}
                >
                  <Select.Option value={2}>Marco Williams</Select.Option>
                  <Select.Option value={5}>Yovanna C</Select.Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={6}>
              <Form.Item label="Estimated Sq/Ft" name="sqft">
                <Input
                  type="number"
                  min={0}
                  value={sqft}
                  onChange={(e) => setSqft(e.target.value)}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[24, 24]}>
            <Col span={12}>
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
                  value={selectedState}
                  onChange={handleStateChange}
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

            <Col span={12}>
              <Form.Item label="City" name="city">
                <Select
                  showSearch
                  value={selectedCity}
                  onChange={(val) => setSelectedCity(val)}
                  disabled={!selectedState}
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
          </Row>

          <Row gutter={[24, 24]}>
            <Col span={12}>
              <Form.Item label="Address" name="address">
                <Input.TextArea
                  rows={5}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter complete address including city/state"
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="Map Preview">
                {!window.google ? (
                  <div style={{ color: "red" }}>
                    Google Maps script not loaded
                  </div>
                ) : (
                  <div
                    ref={mapRef}
                    style={{
                      border: "1px solid #d9d9d9",
                      borderRadius: "8px",
                      overflow: "hidden",
                      height: "280px",
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                    }}
                  />
                )}
              </Form.Item>
            </Col>
          </Row>

          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "20px",
              marginBottom: "24px",
              background: "#fff",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <div>
                <div style={{ fontSize: "16px", fontWeight: 600 }}>
                  Overall Building Floor Composition
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    color: "#6b7280",
                    marginTop: "4px",
                  }}
                >
                  Enter the percentage of each flooring type for the entire
                  building. Total must equal 100%.
                </div>
              </div>
              <div
                style={{
                  background:
                    totalFloorPercentage === 100 ? "#ecfdf5" : "#fef2f2",
                  color: totalFloorPercentage === 100 ? "#15803d" : "#dc2626",
                  border:
                    totalFloorPercentage === 100
                      ? "1px solid #bbf7d0"
                      : "1px solid #fecaca",
                  borderRadius: "20px",
                  padding: "6px 14px",
                  fontWeight: 600,
                }}
              >
                Total: {totalFloorPercentage}% / 100%
              </div>
            </div>

            <Row gutter={[24, 24]}>
              <Col span={6}>
                <Form.Item
                  label="Carpet (%)"
                  name="carpet_percentage"
                  initialValue={0}
                >
                  <InputNumber min={0} max={100} style={{ width: "100%" }} />
                </Form.Item>
              </Col>

              <Col span={6}>
                <Form.Item
                  label="Concrete (%)"
                  name="concrete_percentage"
                  initialValue={0}
                >
                  <InputNumber min={0} max={100} style={{ width: "100%" }} />
                </Form.Item>
              </Col>

              <Col span={6}>
                <Form.Item
                  label="VCT/LVT (%)"
                  name="vct_lvt_percentage"
                  initialValue={0}
                >
                  <InputNumber min={0} max={100} style={{ width: "100%" }} />
                </Form.Item>
              </Col>

              <Col span={6}>
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
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <label style={{ fontSize: "16px", fontWeight: 600 }}>
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

            <div style={tableWrapStyle}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, width: "20%" }}>Service Area</th>

                    {userType === "commercial" ? (
                      <>
                        <th style={{ ...thStyle, width: "18%" }}>
                          # of Trash Cans
                          <br />
                          <small style={{ fontWeight: 400, color: "#9ca3af" }}>
                            or Stalls
                          </small>
                        </th>

                        <th style={{ ...thStyle, width: "18%" }}>
                          # of Desks
                          <br />
                          <small style={{ fontWeight: 400, color: "#9ca3af" }}>
                            or Sinks
                          </small>
                        </th>

                        <th style={{ ...thStyle, width: "18%" }}>
                          # of Rooms
                          <br />
                          <small style={{ fontWeight: 400, color: "#9ca3af" }}>
                            or Restrooms
                          </small>
                        </th>
                      </>
                    ) : (
                      <th style={{ ...thStyle, width: "22%" }}>
                        # of Desks / Trash Cans (Big Buildings)
                        <br />
                        <strong>OR</strong>
                        <br /># of Restrooms
                      </th>
                    )}

                    <th style={{ ...thStyle, width: "26%" }}>
                      Type of Flooring
                      <br />
                      <small style={{ fontWeight: 400, color: "#9ca3af" }}>
                        (Carpet, Hard Floor, VCT)
                      </small>
                    </th>

                    <th style={{ ...thStyle, borderRight: "none" }}>
                      Special Requests / Hot Spots
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {serviceAreas.map((area, index) => (
                    <tr key={index}>
                      <td style={tdStyle}>
                        {userType === "commercial" &&
                        commercialAreas[index]?.editable ? (
                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              alignItems: "center",
                            }}
                          >
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
                          <td style={tdStyle}>
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
                          <td style={tdStyle}>
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
                          <td style={tdStyle}>
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
                        <td style={tdStyle}>
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
                      <td style={tdStyle}>
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
                      <td style={{ ...tdStyle, borderRight: "none" }}>
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

            <div
              style={{
                marginTop: 16,
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <div
                style={{
                  background: "#f5f7fa",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "10px 16px",
                  minWidth: "180px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 12, color: "#6b7280" }}>
                  Total Count
                </div>
                <div
                  style={{ fontSize: 20, fontWeight: 600, color: "#111827" }}
                >
                  {totalCount}
                </div>
              </div>
            </div>
          </Form.Item>

          <Form.Item style={{ marginTop: "24px", marginBottom: 0 }}>
            <AntButton type="primary" htmlType="submit" loading={disable}>
              Save
            </AntButton>
            <AntButton style={{ marginLeft: 8 }} onClick={navigateToUser}>
              Cancel
            </AntButton>
          </Form.Item>
        </Form>
      </Paper>
    </Box>
  );
};

export default AddCustomer;
