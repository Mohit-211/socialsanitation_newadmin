import { useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  Select,
  Row,
  Col,
  message,
  Modal,
  Radio,
  InputNumber,
  Flex,
  Space,
} from "antd";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  MapPin,
  ClipboardList,
} from "lucide-react";
import {
  GetUserById,
  EditUserById,
  StateAPI,
  CityAPI,
  AddNewUserAddress,
  EditAddress,
  DeleteUserAddress,
} from "../../services/Api/Api";
import {
  CheckUserScopeExists,
  GetUserScope,
} from "../../services/Api/ScopeApi";
import PageHeader from "../../components/PageHeader";
import IconAction from "../../components/IconAction";
import { geocodeAddress } from "../../utils/geocode";
import "./Customers.css";

// COUNTRIES
// Client addresses predate the country field — older checklists and
// UserAddress rows with no country on file are treated as USA, same
// convention used on the employee side of this app.

const COUNTRY_IDS = {
  USA: 233,
  CANADA: 39,
};

const COUNTRIES = [
  { id: COUNTRY_IDS.USA, name: "USA" },
  { id: COUNTRY_IDS.CANADA, name: "Canada" },
];

const UpdateCustomer = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [userAddresses, setUserAddresses] = useState([]);
  const [clientType, setClientType] = useState("commercial");
  const [totalCount, setTotalCount] = useState(0);

  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm] = Form.useForm();
  const [addressStates, setAddressStates] = useState([]);
  const [addressCities, setAddressCities] = useState([]);
  const [addressCoordinates, setAddressCoordinates] = useState({
    lat: null,
    lng: null,
  });

  const [checkingScope, setCheckingScope] = useState(false);

  const [scopeExists, setScopeExists] = useState(false);

  const DEFAULT_COMMERCIAL_AREAS = [
    "Entrance / Lobby Areas",
    "Restrooms",
    "Kitchen Areas",
    "Office Areas",
    "Classrooms / Conference Rooms",
    "Group / Common Rooms",
    "All Areas / Hallways",
  ];

  const [commercialAreas, setCommercialAreas] = useState(
    DEFAULT_COMMERCIAL_AREAS.map((name) => ({
      name,
      editable: false,
    })),
  );

  const navigateToUser = () => {
    navigate("/users");
  };

  const carpetPercentage = Form.useWatch("carpet_percentage", form) || 0;
  const concretePercentage = Form.useWatch("concrete_percentage", form) || 0;
  const vctLvtPercentage = Form.useWatch("vct_lvt_percentage", form) || 0;
  const tilePercentage = Form.useWatch("tile_percentage", form) || 0;

  const totalFloorPercentage =
    Number(carpetPercentage) +
    Number(concretePercentage) +
    Number(vctLvtPercentage) +
    Number(tilePercentage);

  const fetchCities = (stateId) => {
    return CityAPI(stateId).then((res) => {
      const citiesList = res?.data?.data?.all_city || [];
      return citiesList; // Needed for chaining
    });
  };

  const watchedStateId = Form.useWatch("state_id", form);

  // Re-fetch cities whenever the main form's state changes (covers both
  // the initial load, via the effect below, and the admin picking a
  // different state via onValuesChange).
  useEffect(() => {
    if (!watchedStateId) {
      return;
    }

    fetchCities(watchedStateId);
  }, [watchedStateId]);

  const refreshUser = () => {
    GetUserById(id).then((res) => {
      const data = res.data.data;
      setUserAddresses(data?.user_address || []);
    });
  };

  useEffect(() => {
    GetUserById(id).then((res) => {
      const data = res.data.data;

      const checklist = data?.user_client_checklist?.[0];
      const details = checklist?.user_client_checklist_details || [];

      const country_id = checklist?.country_id || COUNTRY_IDS.USA;
      const state_id = checklist?.state_id;

      // If client_type is missing, treat as commercial
      const userTypeFromBackend =
        data?.client_type && data.client_type.trim() !== ""
          ? data.client_type.toLowerCase()
          : "commercial";

      setClientType(userTypeFromBackend);

      const serviceAreas = getServiceAreasByType(userTypeFromBackend);

      // INITIAL CLIENT CHART

      if (userTypeFromBackend === "commercial") {
        if (details.length > 0) {
          // Existing checklist details
          setCommercialAreas(
            details.map((detail) => ({
              name: detail.service_area,
              editable:
                detail.service_area.includes("Restrooms") &&
                detail.service_area !== "Restrooms",
            })),
          );
        } else {
          // No checklist details -> show default commercial rows
          setCommercialAreas(
            DEFAULT_COMMERCIAL_AREAS.map((name) => ({
              name,
              editable: false,
            })),
          );
        }
      }

      // BUILD CHECKLIST DETAILS

      const mergedChecklist =
        details.length > 0
          ? details.map((detail) => ({
              service_area: detail.service_area,

              num_desks_trash_cans: Number(detail?.num_desks_trash_cans || 0),

              stalls: Number(detail?.stalls || 0),

              sinks: Number(detail?.sinks || 0),

              restrooms: Number(detail?.restrooms || 0),

              flooring_type: detail?.flooring_type || null,

              special_requests: detail?.special_requests || "",
            }))
          : serviceAreas.map((area) => ({
              service_area: area,

              num_desks_trash_cans: 0,

              stalls: 0,

              sinks: 0,

              restrooms: 0,

              flooring_type: null,

              special_requests: "",
            }));

      // FORM

      form.setFieldsValue({
        name: data?.user_profile?.name,

        client_type: userTypeFromBackend,

        email: data?.email,
        cc_email: data?.cc_email || "",

        sqft: checklist?.estimated_sqft,

        service_days: checklist?.service_days,

        walkaround_minutes: checklist?.walkaround_minutes,

        carpet_percentage: Number(checklist?.carpet_percentage || 0),

        concrete_percentage: Number(checklist?.concrete_percentage || 0),

        vct_lvt_percentage: Number(checklist?.vct_lvt_percentage || 0),

        tile_percentage: Number(checklist?.tile_percentage || 0),

        address: checklist?.address,

        country_id,

        state_id,

        city_id: checklist?.city_id,

        details: mergedChecklist,
      });

      setTimeout(() => {
        calculateTotal();
      }, 0);

      setUserAddresses(data?.user_address || []);
    });
  }, [id, form]);

  const handleSave = async (values) => {
    setLoading(true);
    const payload = {
      name: values.name,
      cc_email: values.cc_email?.trim() || "",
      client_type: clientType,
      checklist: {
        estimated_sqft: values.sqft,
        walkaround_minutes: values.walkaround_minutes,
        service_days: values.service_days,

        carpet_percentage: values.carpet_percentage,
        concrete_percentage: values.concrete_percentage,
        vct_lvt_percentage: values.vct_lvt_percentage,
        tile_percentage: values.tile_percentage,

        address: values.address,
        // Was missing entirely — the backend had nowhere to read a
        // client's country from on this path, even though it already
        // accepts one.
        country_id: values.country_id,
        state_id: values.state_id,
        city_id: values.city_id,
        address_lat: null,
        address_long: null,
        details: values.details || [],
      },
    };

    const totalFloorPercentage =
      Number(values.carpet_percentage || 0) +
      Number(values.concrete_percentage || 0) +
      Number(values.vct_lvt_percentage || 0) +
      Number(values.tile_percentage || 0);

    const hasFloorComposition =
      Number(values.carpet_percentage || 0) > 0 ||
      Number(values.concrete_percentage || 0) > 0 ||
      Number(values.vct_lvt_percentage || 0) > 0 ||
      Number(values.tile_percentage || 0);

    if (hasFloorComposition && totalFloorPercentage !== 100) {
      message.error("Floor composition must total 100%");
      setLoading(false);
      return;
    }

    try {
      await EditUserById(id, payload);
      message.success("User updated successfully");
      setTimeout(() => navigate("/users"), 1000);
    } catch (err) {
      console.error(err);
      message.error("Update failed");
    } finally {
      setLoading(false);
    }
  };

  // ADD ADDRESS MODAL — COUNTRY/STATE FETCHING
  // Separate state lists from the main form's, since this modal has
  // its own Country selection independent of the checklist's.

  const fetchAddressStatesForCountry = (countryId) => {
    return StateAPI(countryId)
      .then((res) => {
        const stateList = res?.data?.data?.all_state || [];
        setAddressStates(stateList);
        return stateList;
      })
      .catch((err) => {
        console.error("Error fetching states:", err);
        setAddressStates([]);
        return [];
      });
  };

  const fetchAddressCities = (stateId) => {
    return CityAPI(stateId).then((res) => {
      const citiesList = res?.data?.data?.all_city || [];
      setAddressCities(citiesList);
      return citiesList;
    });
  };

  const fetchCoordinates = async (address) => {
    if (!address) return;
    try {
      const data = await geocodeAddress(address);
      if (data.status === "OK") {
        const location = data.results[0].geometry.location;
        setAddressCoordinates({ lat: location.lat, lng: location.lng });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openAddAddress = () => {
    setEditingAddress(null);
    addressForm.resetFields();

    // Default to USA — the admin can switch to Canada, which reloads
    // the State dropdown for that country (see onValuesChange below).
    addressForm.setFieldsValue({ country_id: COUNTRY_IDS.USA });
    fetchAddressStatesForCountry(COUNTRY_IDS.USA);
    setAddressCities([]);

    setAddressCoordinates({ lat: null, lng: null });
    setAddressModalVisible(true);
  };

  const openEditAddress = (addr) => {
    setEditingAddress(addr);
    setAddressModalVisible(true);

    // Existing addresses predate the country field on some rows —
    // treated as USA, same convention used everywhere else.
    const addressCountryId = addr.country_id || COUNTRY_IDS.USA;

    setTimeout(() => {
      addressForm.resetFields();

      addressForm.setFieldsValue({
        address: addr.address,
        country_id: addressCountryId,
        state_id: addr.state_id,
      });

      setAddressCoordinates({
        lat: addr.address_lat,
        lng: addr.address_long,
      });

      fetchAddressStatesForCountry(addressCountryId).then(() => {
        addressForm.setFieldsValue({ state_id: addr.state_id });
      });

      fetchAddressCities(addr.state_id).then(() => {
        addressForm.setFieldsValue({
          city_id: addr.city_id,
        });
      });

      setTimeout(() => fetchCoordinates(addr.address), 200);
    }, 100); // Delay ensures modal and form are mounted
  };

  const handleSaveAddress = async () => {
    const values = await addressForm.validateFields();

    // Shared payload for both add/edit
    const basePayload = {
      address: values.address,
      state_id: values.state_id,
      city_id: values.city_id,
      // Was hardcoded to USA (233) regardless of what the admin actually
      // selected — now takes whichever country the Select above was set to.
      country_id: values.country_id,
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

      refreshUser();
      setAddressModalVisible(false);
      setEditingAddress(null);
      addressForm.resetFields();
      setAddressCoordinates({ lat: null, lng: null });
    } catch {
      message.error("Failed to save address");
    }
  };

  const handleDeleteAddress = (addressId) => {
    Modal.confirm({
      title: "Delete Address",
      content: "Are you sure you want to delete this address?",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await DeleteUserAddress(addressId);
          message.success("Address deleted successfully");
          refreshUser();
        } catch (error) {
          console.error(error);
          message.error("Failed to delete address");
        }
      },
    });
  };

  const onClientTypeChange = (type) => {
    setClientType(type);

    const areas = getServiceAreasByType(type);
    const emptyDetails = areas.map((area) => ({
      service_area: area,
      num_desks_trash_cans: 0,
      flooring_type: null,
      special_requests: "",
    }));

    form.setFieldsValue({ details: emptyDetails });
  };

  const getServiceAreasByType = (type) =>
    type === "commercial"
      ? [
          "Entrance / Lobby Areas",
          "Restrooms",
          "Kitchen Areas",
          "Office Areas",
          "Classrooms / Conference Rooms",
          "Group / Common Rooms",
          "All Areas / Hallways",
        ]
      : [
          "Entrance / Lobby Areas",
          "Bathrooms",
          "Kitchen",
          "Bedrooms",
          "Dining Room",
          "Living Room",
          "Foyer",
        ];

  const calculateTotal = () => {
    const details = form.getFieldValue("details") || [];

    const total = details.reduce((sum, item) => {
      const desks = Number(item?.num_desks_trash_cans || 0);
      const stalls = Number(item?.stalls || 0);
      const sinks = Number(item?.sinks || 0);
      const restrooms = Number(item?.restrooms || 0);

      return sum + desks + stalls + sinks + restrooms;
    }, 0);

    setTotalCount(total);
  };

  const checkScopeExists = async () => {
    if (!id) return;

    try {
      const res = await CheckUserScopeExists(id);

      setScopeExists(res?.data?.data?.exists === true);
    } catch (error) {
      console.error("Failed to check scope existence:", error);
      setScopeExists(false);
    }
  };

  useEffect(() => {
    if (!id) return;

    checkScopeExists();
  }, [id]);

  const handleScopeOfWork = async () => {
    if (!id) return;

    try {
      setCheckingScope(true);

      // Always call this API.
      // It validates the current Initial Client Chart
      // even when a scope already exists.
      await GetUserScope(id);

      if (scopeExists) {
        navigate(`/client-scope/${id}`);
        return;
      }

      setScopeExists(true);

      message.success(
        "Client Scope of Work generated successfully. Redirecting...",
      );

      setTimeout(() => {
        navigate(`/client-scope/${id}`);
      }, 1000);
    } catch (err) {
      console.error("Scope of Work error:", err);

      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.data?.message ||
        "Unable to generate Scope of Work.";

      message.error(errorMessage);
    } finally {
      setCheckingScope(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="CLIENT MANAGEMENT"
        subtitle="Update Client Details"
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
          layout="vertical"
          form={form}
          onFinish={handleSave}
          onValuesChange={(changed) => {
            if (changed.country_id) {
              // Switching country invalidates whatever state/city were
              // picked for the old one.
              form.setFieldsValue({ state_id: undefined, city_id: undefined });
            }

            if (changed.state_id) {
              form.setFieldsValue({ city_id: undefined });
            }
          }}
        >
          <Row>
            <Col span={24}>
              <Form.Item
                name="client_type"
                label="Client Type"
                rules={[{ required: true }]}
                style={{ marginBottom: 24 }}
              >
                <Radio.Group
                  value={clientType}
                  onChange={(e) => onClientTypeChange(e.target.value)}
                >
                  <Radio value="residential">Residential</Radio>
                  <Radio value="commercial">Commercial</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="name"
                label="Full Name"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item name="email" label="Email">
                <Input disabled />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item name="cc_email" label="CC Email">
                <Input placeholder="Enter CC email" type="email" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                name="walkaround_minutes"
                label="Walkaround Time (Minutes)"
              >
                <Input type="number" min={0} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item name="sqft" label="Estimated Sq/Ft">
                <Input type="number" min={0} />
              </Form.Item>
            </Col>
          </Row>

          {/* CLIENT LOCATION (checklist-level) — previously these
              values were loaded into the form and resubmitted
              unchanged on every save, but had no actual input to
              edit them. Now a real, editable Country/State/City/
              Address block, same simple pattern as Add Client. */}

          {/* Client Addresses Card */}
          <div className="surface surface--padded surface--flat customer-form__addresses">
            <div className="customer-card-head">
              <div className="customer-card-head__title">
                <MapPin size={18} />
                <span className="customer-label">Client Addresses</span>
              </div>

              <Button
                type="primary"
                icon={<Plus size={16} />}
                onClick={openAddAddress}
              >
                Add Address
              </Button>
            </div>

            {userAddresses.length > 0 ? (
              <div className="customer-address-grid">
                {userAddresses.map((addr) => (
                  <div key={addr.id} className="customer-address-card">
                    <p className="customer-address-card__text">
                      <MapPin size={16} />
                      <span>
                        {addr.address}, {addr.user_city?.name},{" "}
                        {addr.user_state?.name},{" "}
                        {addr.user_country?.name || "USA"}
                      </span>
                    </p>

                    <div className="customer-address-card__actions">
                      <IconAction
                        icon={Pencil}
                        title="Edit Address"
                        onClick={() => openEditAddress(addr)}
                      />
                      <IconAction
                        icon={Trash2}
                        title="Delete Address"
                        danger
                        onClick={() => handleDeleteAddress(addr.id)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="customer-address-empty">
                <MapPin size={20} />
                <p>No address added yet.</p>
              </div>
            )}
          </div>

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

          <Form.Item>
            <div className="customer-form__chart-head customer-form__chart-head--start">
              <div>
                <label className="customer-form__chart-title">
                  Initial Client Chart
                </label>
                {/* 🔹 Short heads-up note per request — flags that this
                    chart feeds the scope of work, which in turn drives
                    the Estimate PDF and Inspection Sheets. */}
                <div className="customer-form__chart-note">
                  Note: The Scope of Work below is also used to generate this
                  client's Estimate PDF and Inspection Sheets — keep it up to
                  date.
                </div>
              </div>

              <Flex gap={8} align="center" wrap>
                <Button
                  type="primary"
                  loading={checkingScope}
                  icon={<ClipboardList size={16} />}
                  onClick={handleScopeOfWork}
                >
                  {scopeExists
                    ? "View Scope of Work"
                    : "Generate Scope of Work"}
                </Button>

                {clientType === "commercial" && (
                  <Button
                    type="primary"
                    onClick={() => {
                      const restroomCount = commercialAreas.filter((area) =>
                        area.name.includes("Restrooms"),
                      ).length;

                      const restroomName = `Restrooms ${restroomCount + 1}`;

                      // Add visible row
                      setCommercialAreas((prev) => [
                        ...prev,
                        {
                          name: restroomName,
                          editable: true,
                        },
                      ]);

                      // Add form row
                      const details = form.getFieldValue("details") || [];

                      form.setFieldsValue({
                        details: [
                          ...details,
                          {
                            service_area: restroomName,
                            stalls: 0,
                            sinks: 0,
                            restrooms: 0,
                            flooring_type: null,
                            special_requests: "",
                          },
                        ],
                      });
                    }}
                  >
                    + Add Rooms
                  </Button>
                )}
              </Flex>
            </div>

            <div className="customer-chart">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: "20%" }}>Service Area</th>

                    {clientType === "commercial" ? (
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
                  {(clientType === "commercial"
                    ? commercialAreas.map((item) => item.name)
                    : getServiceAreasByType(clientType)
                  ).map((area, index) => (
                    <tr key={index}>
                      <td>
                        {clientType === "commercial" &&
                        commercialAreas[index]?.editable ? (
                          <div className="customer-chart__area-input">
                            <Input
                              value={commercialAreas[index]?.name}
                              onChange={(e) => {
                                const value = e.target.value;

                                // Update UI state
                                const updated = [...commercialAreas];
                                updated[index].name = value;
                                setCommercialAreas(updated);

                                // ✅ Update form details also
                                const details =
                                  form.getFieldValue("details") || [];

                                details[index] = {
                                  ...details[index],
                                  service_area: value,
                                };

                                form.setFieldsValue({
                                  details,
                                });
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

                                calculateTotal();
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        ) : (
                          <strong>{area}</strong>
                        )}

                        <Form.Item
                          name={["details", index, "service_area"]}
                          initialValue={area}
                          style={{ display: "none" }}
                        >
                          <Input />
                        </Form.Item>
                      </td>

                      {clientType === "commercial" ? (
                        <>
                          {/* Stalls */}
                          <td>
                            <Form.Item
                              shouldUpdate={(prev, curr) =>
                                prev.details?.[index]?.stalls !==
                                  curr.details?.[index]?.stalls ||
                                prev.details?.[index]?.restrooms !==
                                  curr.details?.[index]?.restrooms
                              }
                              noStyle
                            >
                              {() => {
                                const stalls =
                                  Number(
                                    form.getFieldValue([
                                      "details",
                                      index,
                                      "stalls",
                                    ]),
                                  ) || 0;
                                const rooms =
                                  Number(
                                    form.getFieldValue([
                                      "details",
                                      index,
                                      "restrooms",
                                    ]),
                                  ) || 0;

                                return (
                                  <>
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

                                    {rooms > 0 && stalls > 0 && (
                                      <div className="customer-chart__row-total">
                                        Total: <strong>{rooms * stalls}</strong>
                                      </div>
                                    )}
                                  </>
                                );
                              }}
                            </Form.Item>
                          </td>

                          {/* Sinks */}
                          <td>
                            <Form.Item
                              shouldUpdate={(prev, curr) =>
                                prev.details?.[index]?.sinks !==
                                  curr.details?.[index]?.sinks ||
                                prev.details?.[index]?.restrooms !==
                                  curr.details?.[index]?.restrooms
                              }
                              noStyle
                            >
                              {() => {
                                const sinks =
                                  Number(
                                    form.getFieldValue([
                                      "details",
                                      index,
                                      "sinks",
                                    ]),
                                  ) || 0;
                                const rooms =
                                  Number(
                                    form.getFieldValue([
                                      "details",
                                      index,
                                      "restrooms",
                                    ]),
                                  ) || 0;

                                return (
                                  <>
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

                                    {rooms > 0 && sinks > 0 && (
                                      <div className="customer-chart__row-total">
                                        Total: <strong>{rooms * sinks}</strong>
                                      </div>
                                    )}
                                  </>
                                );
                              }}
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
              <Button type="primary" htmlType="submit" loading={loading}>
                Save
              </Button>
              <Button onClick={() => navigate("/users")}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>

        <Modal
          title={editingAddress ? "Edit Address" : "Add New Address"}
          open={addressModalVisible}
          onCancel={() => {
            setAddressModalVisible(false);
            setEditingAddress(null);
            addressForm.resetFields();
            setAddressCities([]);
            setAddressCoordinates({ lat: null, lng: null });
          }}
          onOk={handleSaveAddress}
          okText={editingAddress ? "Save Changes" : "Add Address"}
          forceRender
        >
          <Form
            form={addressForm}
            layout="vertical"
            onValuesChange={(changedValues, allValues) => {
              if (changedValues.country_id) {
                // Switching country invalidates whatever state/city were
                // picked for the old one — clear both and reload states
                // for the newly selected country.
                addressForm.setFieldsValue({
                  state_id: undefined,
                  city_id: undefined,
                });

                setAddressCities([]);

                fetchAddressStatesForCountry(changedValues.country_id);
              }

              if (changedValues.state_id) {
                addressForm.setFieldsValue({ city_id: undefined }); // reset city
                fetchAddressCities(changedValues.state_id);
              }
              if (changedValues.address) {
                // Build full address string for geocoding
                const fullAddress = `${changedValues.address}, ${
                  addressStates.find((s) => s.id === allValues.state_id)
                    ?.name || ""
                }, ${
                  addressCities.find((c) => c.id === allValues.city_id)?.name ||
                  ""
                }`;
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

            {/* Country Select */}
            <Form.Item
              name="country_id"
              label="Country"
              rules={[{ required: true, message: "Please select a country" }]}
            >
              <Select placeholder="Select Country">
                {COUNTRIES.map((country) => (
                  <Select.Option key={country.id} value={country.id}>
                    {country.name}
                  </Select.Option>
                ))}
              </Select>
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
                {addressStates.map((s) => (
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
                {addressCities.map((c) => (
                  <Select.Option key={c.id} value={c.id}>
                    {c.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            {/* Map Preview */}
            <Form.Item label="Map Preview">
              <div className="customer-map-preview">
                {addressCoordinates.lat && addressCoordinates.lng ? (
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://maps.google.com/maps?q=${addressCoordinates.lat},${addressCoordinates.lng}&z=16&output=embed`}
                    allowFullScreen
                  />
                ) : (
                  <p className="customer-map-preview__empty">
                    Enter address to show map
                  </p>
                )}
              </div>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default UpdateCustomer;
