import dayjs from "@/lib/dayjs";
import { useEffect, useLayoutEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { GetUserById } from "@/services/api/userApi";
import { StateAPI, CityAPI, AddNewUserAddress, EditAddress, DeleteUserAddress } from "@/services/api/addressApi";
import { GetBookingBySPId } from "@/services/api/bookingApi";
import { IMAGE_BASE_URL } from "@/config/env";
import { geocodeAddress } from "@/utils/geocode";
import EmployeeAttendance from "./components/EmployeeAttendance";
import PageHeader from "@/components/PageHeader";
import IconAction from "@/components/IconAction";
import "./employeeForm.scss";
import "./EmployeeDetailsPage.scss";

// Ant Design Components
import {
  Button,
  Divider,
  Table,
  Tag,
  Image,
  Tabs,
  Modal,
  Form,
  Input,
  Select,
  Tooltip,
  message,
} from "antd";

// Icons
import {
  ArrowLeft,
  CircleArrowRight,
  Plus,
  Pencil,
  Trash2,
  MapPin,
  ClipboardList,
  Wrench,
  UserCog,
} from "lucide-react";

// 🔹 Employee type value -> readable label
const EMPLOYEE_TYPE_LABELS = {
  W2_BI_WEEKLY: "W2 Bi-Weekly",
  1099: "1099 Contractor",
};

// COUNTRIES

const COUNTRY_IDS = {
  USA: 233,
  CANADA: 39,
};

// GENERIC "COMING SOON" COMPONENT

const ComingSoon = ({ icon, label }) => (
  <div className="surface surface--padded surface--flat">
    <div className="employee-view__coming-soon">
      {icon}

      <p className="employee-view__coming-soon-label">{label}</p>

      <p className="employee-view__coming-soon-text">Coming soon</p>
    </div>
  </div>
);

const EmployeeDetailsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [userData, setUserData] = useState(null);
  const [bookingData, setBookingData] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [mainTab, setMainTab] = useState("overview");

  /* Address: state                                                   */

  const [addressModalVisible, setAddressModalVisible] =
    useState(false);

  const [editingAddress, setEditingAddress] =
    useState(null);

  const [addressForm] = Form.useForm();

  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  const [addressCoordinates, setAddressCoordinates] =
    useState({
      lat: null,
      lng: null,
    });

  // Employees may only ever have a single address on file.
  const hasAddress =
    (userData?.user_address?.length || 0) >= 1;

  /* Refresh user                                                     */

  const refreshUser = () => {
    GetUserById(id)
      .then((res) => {
        setUserData(res.data.data);
      })
      .catch((err) => {
        console.error("error", err);
      });
  };

  useLayoutEffect(() => {
    refreshUser();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /* Address: states / cities / geocoding                             */

  // FETCH STATES FOR SELECTED COUNTRY

  const fetchStatesForCountry = (countryId) => {
    return StateAPI(countryId)
      .then((res) => {
        const stateList =
          res?.data?.data?.all_state || [];

        setStates(stateList);

        return stateList;
      })
      .catch((err) => {
        console.error(err);
        setStates([]);
        return [];
      });
  };

  // PREFETCH USA STATES

  useEffect(() => {
    fetchStatesForCountry(COUNTRY_IDS.USA);

  }, []);

  // FETCH CITIES

  const fetchCities = (stateId) => {
    return CityAPI(stateId).then((res) => {
      const citiesList =
        res?.data?.data?.all_city || [];

      setCities(citiesList);

      return citiesList;
    });
  };

  // GEOCODE ADDRESS

  const fetchAddressCoordinates = async (address) => {
    if (!address) return;

    try {
      const data = await geocodeAddress(address);

      if (data.status === "OK") {
        const location =
          data.results[0]?.geometry?.location;

        if (!location) return;

        setAddressCoordinates({
          lat: location.lat,
          lng: location.lng,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // OPEN ADD ADDRESS

  const openAddAddress = () => {
    if (hasAddress) return;

    setEditingAddress(null);

    addressForm.resetFields();

    // Default country = USA
    addressForm.setFieldsValue({
      country_id: COUNTRY_IDS.USA,
    });

    // Load USA states
    fetchStatesForCountry(COUNTRY_IDS.USA);

    setCities([]);

    setAddressCoordinates({
      lat: null,
      lng: null,
    });

    setAddressModalVisible(true);
  };

  // OPEN EDIT ADDRESS

  const openEditAddress = (addr) => {
    setEditingAddress(addr);

    setAddressModalVisible(true);

    // Existing rows created before country_id existed
    // are treated as USA.
    const addressCountryId =
      Number(addr.country_id) || COUNTRY_IDS.USA;

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

      // Load states for the existing country first.
      fetchStatesForCountry(addressCountryId).then(() => {
        addressForm.setFieldsValue({
          state_id: addr.state_id,
        });
      });

      // Then load cities for the existing state.
      if (addr.state_id) {
        fetchCities(addr.state_id).then(() => {
          addressForm.setFieldsValue({
            city_id: addr.city_id,
          });
        });
      } else {
        setCities([]);
      }

      if (addr.address) {
        const existingCountry =
          addressCountryId === COUNTRY_IDS.CANADA
            ? "Canada"
            : "USA";

        const existingState =
          addr.user_state?.name || "";

        const existingCity =
          addr.user_city?.name || "";

        const fullAddress = [
          addr.address,
          existingCity,
          existingState,
          existingCountry,
        ]
          .filter(Boolean)
          .join(", ");

        fetchAddressCoordinates(fullAddress);
      }
    }, 100);
  };

  // SAVE ADDRESS

  const handleSaveAddress = async () => {
    try {
      const values =
        await addressForm.validateFields();

      if (
        addressCoordinates.lat === null ||
        addressCoordinates.lng === null
      ) {
        message.error(
          "Unable to get address coordinates",
        );

        return;
      }

      const basePayload = {
        address: values.address,

        country_id: values.country_id,

        state_id: values.state_id,

        city_id: values.city_id,

        address_lat:
          addressCoordinates.lat,

        address_long:
          addressCoordinates.lng,
      };

      if (editingAddress) {
        await EditAddress({
          user_address_id: editingAddress.id,
          ...basePayload,
        });

        message.success("Address updated");
      } else {
        await AddNewUserAddress({
          user_id: id,
          ...basePayload,
        });

        message.success("Address added");
      }

      await refreshUser();

      setAddressModalVisible(false);

      setEditingAddress(null);

      addressForm.resetFields();

      setCities([]);

      setAddressCoordinates({
        lat: null,
        lng: null,
      });
    } catch (err) {
      console.error(
        "Error saving address:",
        err,
      );

      // Ant Design validation error
      if (err?.errorFields) {
        return;
      }

      message.error(
        err?.response?.data?.message ||
          "Failed to save address",
      );
    }
  };

  // DELETE ADDRESS

  const handleDeleteAddress = (addressId) => {
    Modal.confirm({
      title: "Delete Address",

      content:
        "Are you sure you want to delete this address?",

      okText: "Delete",

      okType: "danger",

      onOk: async () => {
        try {
          await DeleteUserAddress(addressId);

          message.success(
            "Address deleted successfully",
          );

          refreshUser();
        } catch (error) {
          console.error(error);

          message.error(
            "Failed to delete address",
          );
        }
      },
    });
  };

  /* Booking                                                           */

  const getData = async (booking_status) => {
    try {
      const formData = {
        id: id,
        booking_status,
      };

      let result =
        await GetBookingBySPId(formData);

      const dataWithIndex =
        result.data.data.map(
          (item, index) => ({
            ...item,
            autoIncrementId: index + 1,
          }),
        );

      setBookingData(dataWithIndex);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    getData("all");
  }, [id]);

  const navigateToUser = () => {
    navigate("/employees");
  };

  const tabsContent = [
    {
      label: "All",
      key: "all",
    },
    {
      label: "Ongoing",
      key: "ONGOING",
    },
    {
      label: "Upcoming",
      key: "UPCOMING",
    },
    {
      label: "Completed",
      key: "COMPLETED",
    },
  ];

  // antd Tag status presets (themed from the design tokens).
  const getStatusColor = (status) => {
    switch (status) {
      case "DELETED":
      case "REJECTED":
        return "error";

      case "SUCCESS":
      case "COMPLETED":
        return "success";

      case "ACCEPTED":
        return "processing";

      case "PENDING":
        return "warning";

      default:
        return "default";
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "autoIncrementId",
      key: "id",
    },

    {
      title: "Booking ID",
      dataIndex: [
        "employee_details_booking",
        "booking_unique_id",
      ],
      key: "booking_id",
    },

    {
      title: "Service",
      dataIndex: [
        "employee_details_booking",
        "service_booking",
        "name",
      ],
      key: "service",
    },

    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: "10%",
      render: (date) =>
        dayjs(date).format("MM/DD/YYYY"),
    },

    {
      title: "User's Name",
      dataIndex: [
        "employee_details_booking",
        "booking_user",
        "user_profile",
        "name",
      ],
      key: "users",
    },

    {
      title: "Status",
      dataIndex: [
        "employee_details_booking",
        "booking_status",
      ],
      key: "status",

      render: (status) => {
        const color =
          getStatusColor(status);

        return (
          <Tag color={color}>
            {status === "SUCCESS"
              ? "COMPLETED"
              : status?.toUpperCase()}
          </Tag>
        );
      },
    },

    {
      title: "Service Start Time",
      dataIndex: [
        "employee_details_booking",
        "start_time",
      ],
      key: "start_time",

      render: (time) =>
        time
          ? new Date(time).toLocaleString()
          : "---",
    },

    {
      title: "Service End Time",
      dataIndex: [
        "employee_details_booking",
        "end_time",
      ],
      key: "end_time",

      render: (time) =>
        time
          ? new Date(time).toLocaleString()
          : "---",
    },

    {
      title: "",
      key: "redirect",

      render: (text, record) => (
        <CircleArrowRight
          size={20}
          className="employee-view__redirect"
          onClick={() =>
            navigate(
              `/viewBooking/${record.id}`,
            )
          }
        />
      ),
    },
  ];

  const handleTabSelect = (key) => {
    setActiveTab(key);
    getData(key);
  };

  const employeeTypeLabel =
    EMPLOYEE_TYPE_LABELS[
      userData?.employee_type
    ] ||
    userData?.employee_type ||
    "---";

  /* Overview tab content                                               */

  const overviewContent = (
    <div className="employee-view__overview">
      {/* Employee Details Header Card */}

      <div className="employee-view__summary">
        {/* Optional Profile Image Preview */}

        {userData?.user_attachments?.length >
          0 &&
          userData.user_attachments[0]
            .file_type === "Image" && (
            <div className="surface surface--flat employee-view__photo">
              <Image
                src={`${IMAGE_BASE_URL}${userData.user_attachments[0].file_name}`}
                alt="User Profile"
                crossOrigin="anonymous"
                preview={true}
                style={{
                  width: 130,
                  height: 130,
                  borderRadius: "var(--radius-full)",
                  objectFit: "cover",
                }}
              />
            </div>
          )}

        {/* Info Card */}

        <div className="surface surface--padded surface--flat employee-view__info">
          <div className="employee-view__info-grid">
            <div>
              <p className="employee-view__info-label">
                Employee's Name:
              </p>

              <p className="employee-view__info-value">
                {userData?.user_profile?.name ||
                  "---"}
              </p>
            </div>

            <div>
              <p className="employee-view__info-label">
                Email
              </p>

              <p className="employee-view__info-value">
                {userData?.email || "---"}
              </p>
            </div>

            <div>
              <p className="employee-view__info-label">
                Mobile:
              </p>

              <p className="employee-view__info-value">
                {userData?.user_profile?.mobile ||
                  "---"}
              </p>
            </div>

            <div>
              <p className="employee-view__info-label">
                Employee Type:
              </p>

              <p className="employee-view__info-value">
                {employeeTypeLabel}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Employee Address Card */}

      <section className="surface surface--padded surface--flat">
        <div className="employee-section__header employee-address__header">
          <h3 className="employee-eyebrow">
            <MapPin
              size={18}
              className="employee-address__icon"
            />
            Employee Address
          </h3>

          <Tooltip
            title={
              hasAddress
                ? "An employee can only have one address. Delete the existing address to add a new one."
                : ""
            }
          >
            <span className="employee-address__tooltip-target">
              <Button
                type="primary"
                disabled={hasAddress}
                icon={<Plus size={16} />}
                onClick={openAddAddress}
              >
                Add Address
              </Button>
            </span>
          </Tooltip>
        </div>

        {hasAddress ? (
          <div className="employee-address__grid">
            {userData.user_address.map(
              (addr) => (
                <div
                  key={addr.id}
                  className="employee-address__card"
                >
                  <div className="employee-address__line">
                    <MapPin
                      size={16}
                      className="employee-address__pin"
                    />

                    <p className="employee-address__text">
                      {addr.address},{" "}
                      {addr.user_city
                        ?.name}
                      ,{" "}
                      {addr.user_state
                        ?.name}
                      ,{" "}
                      {addr.user_country
                        ?.name}
                    </p>
                  </div>

                  <Divider className="employee-address__divider" />

                  <div className="employee-address__actions">
                    <IconAction
                      icon={Pencil}
                      iconSize={14}
                      title="Edit Address"
                      onClick={() =>
                        openEditAddress(
                          addr,
                        )
                      }
                    />

                    <IconAction
                      icon={Trash2}
                      iconSize={14}
                      title="Delete Address"
                      danger
                      onClick={() =>
                        handleDeleteAddress(
                          addr.id,
                        )
                      }
                    />
                  </div>
                </div>
              ),
            )}
          </div>
        ) : (
          <div className="employee-address__empty">
            <MapPin
              size={20}
              className="employee-address__empty-icon"
            />

            <p className="employee-address__empty-text">
              No address added yet.
              This employee can have
              one address.
            </p>
          </div>
        )}
      </section>
    </div>
  );

  /* Booking tab content                                              */

  const bookingContent = (
    <div className="surface surface--padded surface--flat">
      <h2 className="employee-view__bookings-title">
        View all the bookings associated
        with{" "}
        {userData?.user_profile?.name ||
          ""}
      </h2>

      <Tabs
        activeKey={activeTab}
        onChange={handleTabSelect}
        items={tabsContent.map(
          (tab) => ({
            key: tab.key,
            label: tab.label,
            children: (
              <div className="employee-view__bookings-table">
                <Table
                  columns={columns}
                  dataSource={
                    bookingData
                  }
                  rowKey="autoIncrementId"
                  pagination={{
                    pageSize: 10,
                  }}
                />
              </div>
            ),
          }),
        )}
      />
    </div>
  );

  /* Attendance tab content                                           */

  const attendanceContent = (
    <div className="surface surface--padded surface--flat">
      <EmployeeAttendance />
    </div>
  );

  const mainTabItems = [
    {
      key: "overview",
      label: "Overview",
      children: overviewContent,
    },

    {
      key: "booking",
      label: "Booking",
      children: bookingContent,
    },

    {
      key: "attendance",
      label: "Attendance",
      children: attendanceContent,
    },

    {
      key: "hiringForm",
      label: "Hiring Form",
      children: (
        <ComingSoon
          icon={
            <UserCog
              size={28}
              color="var(--color-text-subtle)"
            />
          }
          label="Hiring Form"
        />
      ),
    },

    {
      key: "equipment",
      label: "Equipment",
      children: (
        <ComingSoon
          icon={
            <Wrench
              size={28}
              color="var(--color-text-subtle)"
            />
          }
          label="Equipment"
        />
      ),
    },

    {
      key: "inspection",
      label: "Inspection",
      children: (
        <ComingSoon
          icon={
            <ClipboardList
              size={28}
              color="var(--color-text-subtle)"
            />
          }
          label="Inspection"
        />
      ),
    },
  ];

  return (
    <div>
      {/* Page Header */}

      <PageHeader
        title="EMPLOYEE MANAGEMENT"
        subtitle="View Information related with Employee"
        actions={
          <Button
            size="large"
            icon={<ArrowLeft size={16} />}
            onClick={navigateToUser}
          >
            Return to Employees
          </Button>
        }
      />

      <Tabs
        activeKey={mainTab}
        onChange={(k) =>
          setMainTab(k)
        }
        items={mainTabItems}
      />

      {/* Add / Edit Address modal                                        */}

      {addressModalVisible && (
        <Modal
          title={
            <div className="employee-view__modal-title">
              <span className="employee-view__modal-badge">
                <MapPin size={17} />
              </span>

              <span>
                {editingAddress
                  ? "Edit Address"
                  : "Add New Address"}
              </span>
            </div>
          }
          open={addressModalVisible}
          onCancel={() => {
            setAddressModalVisible(
              false,
            );

            setEditingAddress(null);

            addressForm.resetFields();

            setStates([]);

            setCities([]);

            setAddressCoordinates({
              lat: null,
              lng: null,
            });
          }}
          onOk={handleSaveAddress}
          okText={
            editingAddress
              ? "Save Changes"
              : "Add Address"
          }
          forceRender
        >
          <Divider className="employee-view__modal-divider" />

          <Form
            form={addressForm}
            layout="vertical"
            onValuesChange={(
              changedValues,
              allValues,
            ) => {
              // COUNTRY CHANGED

              if (
                changedValues.country_id
              ) {
                // Clear old state/city
                // because they belong to
                // the previous country.

                addressForm.setFieldsValue(
                  {
                    state_id:
                      undefined,
                    city_id:
                      undefined,
                  },
                );

                setCities([]);

                // Load states for the
                // newly selected country.

                fetchStatesForCountry(
                  changedValues.country_id,
                );

                return;
              }

              // STATE CHANGED

              if (
                changedValues.state_id
              ) {
                addressForm.setFieldsValue(
                  {
                    city_id:
                      undefined,
                  },
                );

                setCities([]);

                fetchCities(
                  changedValues.state_id,
                );
              }

              // ADDRESS CHANGED

              if (
                changedValues.address
              ) {
                const selectedState =
                  states.find(
                    (s) =>
                      s.id ===
                      allValues.state_id,
                  )?.name || "";

                const selectedCity =
                  cities.find(
                    (c) =>
                      c.id ===
                      allValues.city_id,
                  )?.name || "";

                const selectedCountry =
                  Number(
                    allValues.country_id,
                  ) ===
                  COUNTRY_IDS.CANADA
                    ? "Canada"
                    : "USA";

                const fullAddress = [
                  changedValues.address,
                  selectedCity,
                  selectedState,
                  selectedCountry,
                ]
                  .filter(Boolean)
                  .join(", ");

                fetchAddressCoordinates(
                  fullAddress,
                );
              }
            }}
          >
            {/* Address */}

            <Form.Item
              name="address"
              label="Address"
              rules={[
                {
                  required: true,
                  message:
                    "Please enter the address",
                },
              ]}
            >
              <Input placeholder="Enter address" />
            </Form.Item>

            {/* Country */}

            <Form.Item
              name="country_id"
              label="Country"
              rules={[
                {
                  required: true,
                  message:
                    "Please select a country",
                },
              ]}
            >
              <Select
                placeholder="Select Country"
              >
                <Select.Option
                  value={
                    COUNTRY_IDS.USA
                  }
                >
                  USA
                </Select.Option>

                <Select.Option
                  value={
                    COUNTRY_IDS.CANADA
                  }
                >
                  Canada
                </Select.Option>
              </Select>
            </Form.Item>

            {/* State */}

            <Form.Item
              name="state_id"
              label="State"
              rules={[
                {
                  required: true,
                  message:
                    "Please select a state",
                },
              ]}
            >
              <Select
                showSearch
                placeholder="Select State"
                optionFilterProp="children"
                disabled={
                  !addressForm.getFieldValue(
                    "country_id",
                  )
                }
                filterOption={(
                  input,
                  option,
                ) =>
                  option.children
                    .toLowerCase()
                    .includes(
                      input.toLowerCase(),
                    )
                }
              >
                {states.map(
                  (state) => (
                    <Select.Option
                      key={state.id}
                      value={state.id}
                    >
                      {state.name}
                    </Select.Option>
                  ),
                )}
              </Select>
            </Form.Item>

            {/* City */}

            <Form.Item
              name="city_id"
              label="City"
              rules={[
                {
                  required: true,
                  message:
                    "Please select a city",
                },
              ]}
            >
              <Select
                showSearch
                placeholder="Select City"
                disabled={
                  !addressForm.getFieldValue(
                    "state_id",
                  )
                }
                optionFilterProp="children"
                filterOption={(
                  input,
                  option,
                ) =>
                  option.children
                    .toLowerCase()
                    .includes(
                      input.toLowerCase(),
                    )
                }
              >
                {cities.map(
                  (city) => (
                    <Select.Option
                      key={city.id}
                      value={city.id}
                    >
                      {city.name}
                    </Select.Option>
                  ),
                )}
              </Select>
            </Form.Item>

            {/* Map */}

            <Form.Item label="Map Preview">
              <div className="employee-address__map">
                {addressCoordinates.lat !==
                  null &&
                addressCoordinates.lng !==
                  null ? (
                  <iframe
                    title="Map Preview"
                    src={`https://maps.google.com/maps?q=${addressCoordinates.lat},${addressCoordinates.lng}&z=16&output=embed`}
                    allowFullScreen
                  />
                ) : (
                  <p className="employee-address__map-placeholder">
                    Enter address to
                    show map
                  </p>
                )}
              </div>
            </Form.Item>
          </Form>
        </Modal>
      )}
    </div>
  );
};

export default EmployeeDetailsPage;
