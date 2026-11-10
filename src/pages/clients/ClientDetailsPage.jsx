import dayjs from "@/lib/dayjs";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { DeleteContractAgreement } from "@/services/api/contractApi";
import { DeleteServiceEstimate } from "@/services/api/estimateApi";
import { GetUserById, GetClosestEmployeesByAddress } from "@/services/api/userApi";
import { StateAPI, CityAPI, AddNewUserAddress, EditAddress, DeleteUserAddress } from "@/services/api/addressApi";
import {
  CheckUserScopeExists,
} from "@/services/api/scopeApi";
import {
  Button,
  Divider,
  Table,
  Tag,
  Tooltip,
  message,
  Modal,
  Tabs,
  Input,
  Select,
  Form,
} from "antd";
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from "@react-google-maps/api";

import {
  DeleteServiceQuote,
  GetBookingByUserId,
  GetContractAgreementsByUserId,
  GetMonthlyInvoicesByUserId,
  GetServiceEstimatesByUserId,
  GetServiceQuotesByUserId,
  GetServiceRequestsByUserId,
} from "@/services/api/bookingApi";
import {
  AlarmClock,
  ArrowLeft,
  Building2,
  Calendar,
  CircleArrowRight,
  CircleCheck,
  ClipboardList,
  CreditCard,
  FileText,
  Mail,
  MapPin,
  Navigation,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  TriangleAlert,
  User as UserIcon,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import IconAction from "@/components/IconAction";
import { GOOGLE_MAPS_API_KEY } from "@/config/env";
import { geocodeAddress } from "@/utils/geocode";
import { cssVar } from "@/theme/antdTheme";
import "./clients.scss";
import "./ClientDetailsPage.scss";
import { CreateInvoice, DeleteInvoice } from "@/services/api/invoiceApi";

/* Shared presentational helpers for the Invoices / Contracts / Estimates tabs */

// Status chip tones; the colors live in ClientDetailsPage.scss
// (.view-customer__status-tag--<tone>).
const STATUS_STYLES = {
  PAID: { tone: "success", label: "PAID" },
  CASH_PAID: { tone: "success", label: "PAID (CASH)" },
  NOT_PAID: { tone: "warning", label: "NOT PAID" },
  EXPIRED: { tone: "neutral", label: "EXPIRED" },
  SIGNED: { tone: "success", label: "SIGNED" },
  PENDING: { tone: "warning", label: "PENDING" },
  DRAFT: { tone: "neutral", label: "DRAFT" },
  SENT: { tone: "info", label: "SENT" },
};

const getStatusStyle = (status) => {
  const key = status?.toUpperCase();
  if (STATUS_STYLES[key]) return STATUS_STYLES[key];
  return {
    tone: "neutral",
    label: status ? status.replace(/_/g, " ").toUpperCase() : "N/A",
  };
};

const StatusTag = ({ tone = "neutral", children }) => (
  <span className={`view-customer__status-tag view-customer__status-tag--${tone}`}>
    {children}
  </span>
);

const SectionHeader = ({ title }) => (
  <div className="view-customer__section-header">
    <h2 className="section-title view-customer__section-title">{title}</h2>
  </div>
);

const EmptyState = ({ message }) => (
  <div className="view-customer__empty">
    <p>{message}</p>
  </div>
);

const CardGrid = ({ children }) => (
  <div className="view-customer__card-grid">{children}</div>
);

/**
 * Generic "document" card used for Monthly Invoices, Contract Agreements
 * and Service Estimates so all three share one clean, consistent look.
 */
const DocumentCard = ({
  statusTags = [],
  eyebrow,
  title,
  company,
  details = [],
  actions = [],
  onEdit,
  onDelete,
}) => (
  <div className="view-customer__doc-card">
    {/* Header */}
    <div className="view-customer__doc-head">
      <div className="view-customer__doc-head-row">
        <div className="view-customer__doc-tags">
          {statusTags.map((tag, i) => (
            <StatusTag key={i} tone={tag.tone}>
              {tag.label}
            </StatusTag>
          ))}
        </div>

        {(onEdit || onDelete) && (
          <div className="view-customer__doc-actions">
            {onEdit && <IconAction icon={Pencil} title="Edit" onClick={onEdit} />}
            {onDelete && (
              <IconAction icon={Trash2} title="Delete" danger onClick={onDelete} />
            )}
          </div>
        )}
      </div>

      <div>
        <span className="view-customer__eyebrow">{eyebrow}</span>
        <div className="view-customer__doc-title">{title}</div>
      </div>
    </div>

    {/* Body */}
    <div className="view-customer__doc-body">
      {company && (
        <div className="view-customer__company">
          <Building2 size={16} />
          <p>{company}</p>
        </div>
      )}

      <div
        className={`view-customer__details${
          actions.length ? " view-customer__details--spaced" : ""
        }`}
      >
        {details.map((d, i) => (
          <div key={i} className="view-customer__detail">
            {d.icon && <span className="view-customer__detail-icon">{d.icon}</span>}
            <span className="view-customer__detail-label">{d.label}:</span>
            <span className="view-customer__detail-value">{d.value || "N/A"}</span>
          </div>
        ))}
      </div>

      {actions.length > 0 && (
        <div className="view-customer__doc-links">
          {actions.map((a, i) =>
            a.disabledMessage ? (
              <div
                key={i}
                className="view-customer__notice"
                style={{ background: a.bg, color: a.color }}
              >
                {a.disabledMessage}
              </div>
            ) : (
              <a
                key={i}
                href={a.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`view-customer__doc-link${
                  a.tone === "success" ? " view-customer__doc-link--success" : ""
                }`}
              >
                {a.icon} {a.label}
              </a>
            ),
          )}
        </div>
      )}
    </div>
  </div>
);

const NEARBY_ROLE_LABELS = {
  7: "INSPECTOR/SUPERVISOR",
  8: "QUALITY ASSURANCE TECHNICIAN",
  9: "CLEANER",
};

// Google Maps needs real color values, so the tokens are resolved at runtime.
const getNearbyMarkerColors = () => ({
  address: cssVar("--color-primary-strong"),
  employee: cssVar("--color-success-strong"),
  selected: cssVar("--color-warning"),
  stroke: cssVar("--color-bg"),
  label: cssVar("--color-text-inverse"),
  selectedLabel: cssVar("--color-on-primary"),
});

/* Initial Client Chart helpers (read-only view)                       */

const COMMERCIAL_DEFAULT_AREAS = [
  "Entrance / Lobby Areas",
  "Restrooms",
  "Kitchen Areas",
  "Office Areas",
  "Classrooms / Conference Rooms",
  "Group / Common Rooms",
  "All Areas / Hallways",
];

const RESIDENTIAL_DEFAULT_AREAS = [
  "Entrance / Lobby Areas",
  "Bathrooms",
  "Kitchen",
  "Bedrooms",
  "Dining Room",
  "Living Room",
  "Foyer",
];

const FLOORING_COMPOSITION_FIELDS = [
  { label: "Carpet", key: "carpet_percentage" },
  { label: "Concrete", key: "concrete_percentage" },
  { label: "VCT/LVT", key: "vct_lvt_percentage" },
  { label: "Tile", key: "tile_percentage" },
];

const ClientDetailsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [userData, setUserData] = useState([]);
  const [bookingData, setBookingData] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [mainTab, setMainTab] = useState("overview");
  const [serviceQuotes, setServiceQuotes] = useState([]);

  const [monthlyInvoices, setMonthlyInvoices] = useState([]);
  const [contractAgreements, setContractAgreements] = useState([]);
  const [serviceEstimates, setServiceEstimates] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);

  const [creatingInvoiceId, setCreatingInvoiceId] = useState(null);

  /* Initial Client Chart + Scope of Work (view only)                   */
  const [scopeExists, setScopeExists] = useState(false);

  const handleCreateInvoiceFromQuote = async (quote) => {
    setCreatingInvoiceId(quote.id);
    try {
      const res = await CreateInvoice({ quote_id: quote.id });

      message.success("Invoice created successfully");

      const newInvoiceId = res?.data?.data?.id;

      // Refresh quotes so invoice_created / invoice_id reflect the new state
      await fetchQuotes();

      if (newInvoiceId) {
        navigate(`/edit-invoice/${newInvoiceId}`);
      }
    } catch (error) {
      console.error("Create invoice error:", error);
      message.error(
        error?.response?.data?.message || "Failed to create invoice",
      );
    } finally {
      setCreatingInvoiceId(null);
    }
  };

  /* Address: edit modal state                                          */
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm] = Form.useForm();
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [addressCoordinates, setAddressCoordinates] = useState({
    lat: null,
    lng: null,
  });

  /* Address: nearest-employees modal state                             */
  const [nearbyModalVisible, setNearbyModalVisible] = useState(false);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyEmployees, setNearbyEmployees] = useState([]);
  const [nearbyClientLocation, setNearbyClientLocation] = useState(null);
  const [nearbyAddress, setNearbyAddress] = useState(null);
  const [selectedNearbyId, setSelectedNearbyId] = useState(null);
  const nearbyMapRef = useRef(null);
  const NEARBY_CLUSTER_THRESHOLD_MI = 2;
  const markerColors = useMemo(() => getNearbyMarkerColors(), []);

  const { isLoaded: isNearbyMapLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ["maps"],
  });

  const fetchServiceRequests = async () => {
    try {
      const res = await GetServiceRequestsByUserId(id);
      setServiceRequests(res?.data?.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const clientName = userData?.user_profile?.name || "Client";

  /* Refresh client (used after address add/edit/delete)                */
  const refreshUser = async () => {
    try {
      const res = await GetUserById(id);
      setUserData(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  /* Address: fetch states / cities                                     */
  useEffect(() => {
    StateAPI(233)
      .then((res) => setStates(res?.data?.data?.all_state || []))
      .catch((err) => console.error(err));
  }, []);

  const fetchCities = (stateId) => {
    return CityAPI(stateId).then((res) => {
      const citiesList = res?.data?.data?.all_city || [];
      setCities(citiesList);
      return citiesList;
    });
  };

  const fetchAddressCoordinates = async (address) => {
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
    setAddressCoordinates({ lat: null, lng: null });
    setAddressModalVisible(true);
  };

  const openEditAddress = (addr) => {
    setEditingAddress(addr);
    setAddressModalVisible(true);

    setTimeout(() => {
      addressForm.resetFields();
      addressForm.setFieldsValue({
        address: addr.address,
        state_id: addr.state_id,
      });
      setAddressCoordinates({
        lat: addr.address_lat,
        lng: addr.address_long,
      });
      fetchCities(addr.state_id).then(() => {
        addressForm.setFieldsValue({ city_id: addr.city_id });
      });
      if (addr.address) fetchAddressCoordinates(addr.address);
    }, 100);
  };

  const handleSaveAddress = async () => {
    const values = await addressForm.validateFields();

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
        await EditAddress({
          user_address_id: editingAddress.id,
          ...basePayload,
        });
        message.success("Address updated");
      } else {
        await AddNewUserAddress({ user_id: id, ...basePayload });
        message.success("Address added");
      }

      await refreshUser();
      setAddressModalVisible(false);
      setEditingAddress(null);
      addressForm.resetFields();
      setAddressCoordinates({ lat: null, lng: null });
    } catch {
      message.error("Failed to save address");
    }
  };

  /* Address: delete                                                    */
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

  /* Address: nearest employees                                         */
  const capZoom = (max) => {
    window.google.maps.event.addListenerOnce(
      nearbyMapRef.current,
      "idle",
      () => {
        if (nearbyMapRef.current.getZoom() > max) {
          nearbyMapRef.current.setZoom(max);
        }
      },
    );
  };

  const fitDefaultView = () => {
    if (!nearbyMapRef.current || !nearbyClientLocation) return;

    const closeEmployees = nearbyEmployees.filter(
      (emp) => emp.distance <= NEARBY_CLUSTER_THRESHOLD_MI,
    );
    const employeesToShow =
      closeEmployees.length > 0 ? closeEmployees : nearbyEmployees.slice(0, 1);

    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend({
      lat: nearbyClientLocation.address_lat,
      lng: nearbyClientLocation.address_long,
    });
    employeesToShow.forEach((emp) => {
      bounds.extend({ lat: emp.address_lat, lng: emp.address_long });
    });

    nearbyMapRef.current.fitBounds(bounds, 60);
    capZoom(18);
  };

  const focusOnEmployee = (emp) => {
    if (!nearbyMapRef.current || !nearbyClientLocation || !emp) return;

    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend({
      lat: nearbyClientLocation.address_lat,
      lng: nearbyClientLocation.address_long,
    });
    bounds.extend({ lat: emp.address_lat, lng: emp.address_long });

    nearbyMapRef.current.fitBounds(bounds, 80);
    capZoom(18);
  };

  const handleSelectNearbyEmployee = (emp) => {
    setSelectedNearbyId(emp.id);
    focusOnEmployee(emp);
  };

  const handleResetMapView = () => {
    setSelectedNearbyId(null);
    fitDefaultView();
  };

  useEffect(() => {
    if (!isNearbyMapLoaded || !nearbyClientLocation) return;
    fitDefaultView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNearbyMapLoaded, nearbyClientLocation, nearbyEmployees]);

  const openNearestEmployeesModal = async (addr) => {
    setNearbyAddress(addr);
    setNearbyModalVisible(true);
    setNearbyLoading(true);
    setSelectedNearbyId(null);
    try {
      const res = await GetClosestEmployeesByAddress(addr.id);
      const payload = res.data.data || {};
      setNearbyClientLocation(payload.selected_address || null);
      setNearbyEmployees(payload.employees || []);
    } catch (error) {
      console.error("Error fetching nearest employees:", error);
      message.error("Failed to fetch nearest employees");
    } finally {
      setNearbyLoading(false);
    }
  };

  const selectedNearbyEmployee = nearbyEmployees.find(
    (emp) => emp.id === selectedNearbyId,
  );

  const handleDeleteServiceEstimate = (estimateId) => {
    Modal.confirm({
      title: "Delete Service Estimate",
      content: "Are you sure you want to delete this service estimate?",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await DeleteServiceEstimate(estimateId);
          message.success("Service Estimate deleted successfully");
          fetchServiceEstimates();
        } catch (error) {
          console.error(error);
          message.error("Failed to delete service estimate");
        }
      },
    });
  };

  const handleDeleteContractAgreement = (contractId) => {
    Modal.confirm({
      title: "Delete Contract Agreement",
      content: "Are you sure you want to delete this contract agreement?",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await DeleteContractAgreement(contractId);
          message.success("Contract Agreement deleted successfully");
          fetchContractAgreements();
        } catch (error) {
          console.error(error);
          message.error("Failed to delete contract agreement");
        }
      },
    });
  };

  const handleDeleteMonthlyInvoice = (invoiceId) => {
    Modal.confirm({
      title: "Delete Invoice",
      content: "Are you sure you want to delete this monthly invoice?",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await DeleteInvoice(invoiceId);
          message.success("Invoice deleted successfully");
          fetchMonthlyInvoices();
        } catch (error) {
          console.error(error);
          message.error("Failed to delete invoice");
        }
      },
    });
  };

  const fetchServiceEstimates = async () => {
    try {
      const res = await GetServiceEstimatesByUserId(id);
      setServiceEstimates(res?.data?.data?.data || []);
    } catch (err) {
      console.error("Error fetching service estimates:", err);
    }
  };

  const fetchContractAgreements = async () => {
    try {
      const res = await GetContractAgreementsByUserId(id);
      setContractAgreements(res?.data?.data?.data || []);
    } catch (err) {
      console.error("Error fetching contract agreements:", err);
    }
  };

  const fetchMonthlyInvoices = async () => {
    try {
      const res = await GetMonthlyInvoicesByUserId(id);
      setMonthlyInvoices(res?.data?.data?.data || []);
    } catch (err) {
      console.error("Error fetching monthly invoices:", err);
    }
  };

  useLayoutEffect(() => {
    GetUserById(id)
      .then((res) => {
        setUserData(res.data.data);
      })
      .catch((err) => {
        console.error(err, "error");
      });
  }, [id]);

  /* Scope of Work existence check (view only — never generates)        */
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

  const getData = async (booking_status) => {
    try {
      const formData = { id: id, booking_status };
      let result = await GetBookingByUserId(formData);
      const dataWithIndex = result.data.data.map((item, index) => ({
        ...item,
        autoIncrementId: index + 1,
      }));
      setBookingData(dataWithIndex);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    setBookingData([]);
    getData("all");
  }, [id]);

  const fetchQuotes = async () => {
    try {
      const res = await GetServiceQuotesByUserId(id);
      setServiceQuotes(res.data.data || []);
    } catch (err) {
      console.error("Error fetching service quotes:", err);
    }
  };
  useEffect(() => {
    if (id) {
      fetchQuotes();
      fetchMonthlyInvoices();
      fetchContractAgreements();
      fetchServiceEstimates();
      fetchServiceRequests();
      checkScopeExists();
    }
  }, [id]);

  const navigateToUser = () => {
    navigate("/users");
  };

  const handleDelete = (invoiceId) => {
    Modal.confirm({
      title: "Delete Invoice",
      content: "Are you sure you want to delete this invoice?",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await DeleteServiceQuote(invoiceId);
          message.success("Invoice deleted successfully");
          fetchQuotes();
        } catch (error) {
          console.error("Delete error:", error);
          message.error("Failed to delete invoice");
        }
      },
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "DELETED":
      case "REJECTED":
        return "error";
      case "SUCCESS":
        return "success";
      case "ACCEPTED":
        return "processing";
      case "PENDING":
        return "warning";
      case "COMPLETED":
        return "success";
      default:
        return "processing";
    }
  };

  const columns = [
    { title: "ID", dataIndex: "autoIncrementId", key: "id" },
    { title: "Booking ID", dataIndex: "booking_unique_id", key: "booking_id" },
    {
      title: "Service",
      dataIndex: ["service_booking", "name"],
      key: "service",
    },
    { title: "Type", dataIndex: "type", key: "type" },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: "10%",
      render: (date) => dayjs(date).format("MM/DD/YYYY"),
    },
    {
      title: "Employees",
      dataIndex: "booking_employee_details",
      key: "employees",
      render: (employees) => {
        if (employees && employees.length > 0) {
          const employeeNames = employees
            .map((employee) => employee.employee_profile?.user_profile?.name)
            .join(", ");
          return (
            employeeNames || (
              <span className="view-customer__no-employee">
                No Employee Assigned
              </span>
            )
          );
        }
        return (
          <span className="view-customer__no-employee">
            No Employee Assigned
          </span>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "booking_status",
      key: "status",
      render: (status) => {
        const color = getStatusColor(status);
        return (
          <Tag color={color}>
            {status === "SUCCESS" ? "COMPLETED" : status.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: "Start Time",
      dataIndex: "start_time",
      key: "start_time",
      render: (time) => (time ? new Date(time).toLocaleString() : "---"),
    },
    {
      title: "End Time",
      dataIndex: "end_time",
      key: "end_time",
      render: (time) => (time ? new Date(time).toLocaleString() : "---"),
    },
    {
      title: "",
      key: "redirect",
      render: (text, record) => (
        <IconAction
          icon={CircleArrowRight}
          title="View Booking"
          onClick={() => navigate(`/viewBooking/${record.id}`)}
        />
      ),
    },
  ];

  const handleTabSelect = (k) => {
    setActiveTab(k);
    let status = k === "all" ? "all" : k;
    getData(status);
  };

  const jobStatusConfig = {
    NOT_BOOKED: { label: "NOT BOOKED", tone: "warning" },
    BOOKED: { label: "BOOKED", tone: "info" },
    EXPIRED: { label: "EXPIRED", tone: "error" },
  };

  const paymentStatusConfig = {
    NOT_PAID: { label: "NOT PAID", tone: "warning" },
    PAID: { label: "PAID", tone: "success" },
    CASH_PAID: { label: "PAID (CASH)", tone: "success" },
    EXPIRED: { label: "EXPIRED", tone: "neutral" },
  };

    /* Booking status sub-tabs (All / Ongoing / Upcoming / Completed)     */
  const bookingStatusTabItems = [
    { label: "All", key: "all" },
    { label: "Ongoing", key: "ONGOING" },
    { label: "Upcoming", key: "UPCOMING" },
    { label: "Completed", key: "COMPLETED" },
  ].map((tab) => ({
    key: tab.key,
    label: tab.label,
    children: (
      <div className="view-customer__booking-table">
        <Table
          columns={columns}
          dataSource={bookingData}
          rowKey="autoIncrementId"
        />
      </div>
    ),
  }));

  /* Initial Client Chart: derived read-only data                       */
  const clientChecklist = userData?.user_client_checklist?.[0];
  const checklistDetails = clientChecklist?.user_client_checklist_details || [];
  const chartClientType =
    userData?.client_type && userData.client_type.trim() !== ""
      ? userData.client_type.toLowerCase()
      : "commercial";
  const isCommercialChart = chartClientType === "commercial";

  const chartRows =
    checklistDetails.length > 0
      ? checklistDetails.map((detail) => ({
          service_area: detail.service_area,
          num_desks_trash_cans: Number(detail?.num_desks_trash_cans || 0),
          stalls: Number(detail?.stalls || 0),
          sinks: Number(detail?.sinks || 0),
          restrooms: Number(detail?.restrooms || 0),
          flooring_type: detail?.flooring_type || null,
          special_requests: detail?.special_requests || "",
        }))
      : (isCommercialChart
          ? COMMERCIAL_DEFAULT_AREAS
          : RESIDENTIAL_DEFAULT_AREAS
        ).map((area) => ({
          service_area: area,
          num_desks_trash_cans: 0,
          stalls: 0,
          sinks: 0,
          restrooms: 0,
          flooring_type: null,
          special_requests: "",
        }));

  const chartTotalCount = chartRows.reduce(
    (sum, row) =>
      sum +
      row.num_desks_trash_cans +
      row.stalls +
      row.sinks +
      row.restrooms,
    0,
  );

  const floorCompositionTotal = FLOORING_COMPOSITION_FIELDS.reduce(
    (sum, f) => sum + Number(clientChecklist?.[f.key] || 0),
    0,
  );

  const renderCountCell = (value) => (
    <span
      className={`view-customer__count${
        value ? "" : " view-customer__count--empty"
      }`}
    >
      {value || 0}
    </span>
  );

  const initialClientChartContent = (
    <div className="view-customer__panel">
      <div className="customer-card-head">
        <div className="customer-card-head__title">
          <ClipboardList size={18} />
          <span className="customer-label">Initial Client Chart</span>
        </div>

        <div className="view-customer__pills">
          <span className="customer-pill customer-pill--sm customer-pill--neutral">
            Total Count: {chartTotalCount}
          </span>
          <span
            className={`customer-pill customer-pill--sm ${
              floorCompositionTotal === 100
                ? "customer-pill--success"
                : "customer-pill--error"
            }`}
          >
            Floor Composition: {floorCompositionTotal}% / 100%
          </span>
        </div>
      </div>

      <div className="view-customer__floor-breakdown">
        {FLOORING_COMPOSITION_FIELDS.map((f) => (
          <span key={f.key}>
            <span className="text-muted">{f.label}:</span>{" "}
            <strong>{Number(clientChecklist?.[f.key] || 0)}%</strong>
          </span>
        ))}
      </div>

      <div className="customer-chart customer-chart--compact">
        <table>
          <thead>
            <tr>
              <th style={{ minWidth: 200 }}>Service Area</th>
              {isCommercialChart ? (
                <>
                  <th>
                    # of Trash Cans
                    <br />
                    <small className="customer-chart__sub">or Stalls</small>
                  </th>
                  <th>
                    # of Desks
                    <br />
                    <small className="customer-chart__sub">or Sinks</small>
                  </th>
                  <th>
                    # of Rooms
                    <br />
                    <small className="customer-chart__sub">or Restrooms</small>
                  </th>
                </>
              ) : (
                <th>
                  # of Desks / Trash Cans (Big Buildings)
                  <br />
                  <strong>OR</strong>
                  <br /># of Restrooms
                </th>
              )}
              <th>
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
            {chartRows.map((row, index) => (
              <tr key={`${row.service_area}-${index}`}>
                <td>
                  <strong>{row.service_area}</strong>
                </td>
                {isCommercialChart ? (
                  <>
                    <td>{renderCountCell(row.stalls)}</td>
                    <td>{renderCountCell(row.sinks)}</td>
                    <td>{renderCountCell(row.restrooms)}</td>
                  </>
                ) : (
                  <td>{renderCountCell(row.num_desks_trash_cans)}</td>
                )}
                <td>
                  {row.flooring_type ? (
                    <Tag color="processing" style={{ margin: 0 }}>
                      {row.flooring_type}
                    </Tag>
                  ) : (
                    <span className="text-subtle">—</span>
                  )}
                </td>
                <td
                  className={`view-customer__requests${
                    row.special_requests
                      ? ""
                      : " view-customer__requests--empty"
                  }`}
                >
                  {row.special_requests || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Divider />

      <div className="view-customer__scope">
        <div>
          <div className="view-customer__scope-title">Client Scope of Work</div>
          <div className="view-customer__scope-text">
            {scopeExists
              ? "A scope of work has been generated for this client."
              : "No scope of work has been generated for this client yet."}
          </div>
        </div>

        {scopeExists && (
          <Button
            type="primary"
            icon={<FileText size={16} />}
            onClick={() => navigate(`/client-scope/${id}`)}
          >
            View Scope of Work
          </Button>
        )}
      </div>
    </div>
  );

  /* Overview tab content                                               */
  const overviewContent = (
    <>
      <div className="view-customer__panel view-customer__panel--first">
        <div className="responsive-grid-3 view-customer__info-grid">
          <div>
            <div className="customer-label view-customer__info-label">
              User's Name
            </div>
            <p className="view-customer__info-value">
              {userData?.user_profile?.name || "---"}
            </p>
          </div>
          <div>
            <div className="customer-label view-customer__info-label">Email</div>
            <p className="view-customer__info-value">{userData?.email || "---"}</p>
          </div>
          <div>
            <div className="customer-label view-customer__info-label">Mobile</div>
            <p className="view-customer__info-value">
              {userData?.user_profile?.mobile || "---"}
            </p>
          </div>
        </div>
      </div>

      {/* Client Addresses */}
      <div className="view-customer__panel">
        <div className="customer-card-head">
          <div className="customer-card-head__title">
            <MapPin size={18} />
            <span className="customer-label">Client's Addresses</span>
          </div>

          <Button type="primary" icon={<Plus size={16} />} onClick={openAddAddress}>
            Add Address
          </Button>
        </div>

        {userData?.user_address?.length > 0 ? (
          <div className="customer-address-grid">
            {userData.user_address.map((address) => (
              <div key={address.id} className="customer-address-card">
                <p className="customer-address-card__text">
                  <MapPin size={16} />
                  <span>
                    {address.address}, {address.user_city?.name},{" "}
                    {address.user_state?.name}, {address.user_country?.name}
                  </span>
                </p>

                <div className="customer-address-card__actions">
                  <IconAction
                    icon={Pencil}
                    title="Edit Address"
                    onClick={() => openEditAddress(address)}
                  />
                  <IconAction
                    icon={Trash2}
                    title="Delete Address"
                    danger
                    onClick={() => handleDeleteAddress(address.id)}
                  />
                  <IconAction
                    icon={Navigation}
                    title="View Nearest Employees"
                    onClick={() => openNearestEmployeesModal(address)}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="view-customer__info-value view-customer__info-value--empty">
            No address available
          </p>
        )}
      </div>

      {/* Initial Client Chart + Scope of Work (view only) */}
      {initialClientChartContent}

      <div className="view-customer__panel view-customer__panel--last">
        <h3 className="section-title view-customer__bookings-title">
          View all the bookings associated with {clientName}
        </h3>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabSelect}
          items={bookingStatusTabItems}
        />
      </div>
    </>
  );

  /* Service Quotes tab content                                         */
  const quotesContent = (
    <section className="view-customer__section">
      <SectionHeader title={`Service Quotes for ${clientName}`} />

      {serviceQuotes.length === 0 ? (
        <EmptyState message="No service quotes available for this client." />
      ) : (
        <CardGrid>
          {serviceQuotes.map((quote) => (
            <div
              key={quote.id}
              className="view-customer__doc-card view-customer__doc-card--interactive"
            >
              <div className="view-customer__doc-head">
                <div className="view-customer__doc-head-row">
                  <div className="view-customer__doc-tags">
                    <StatusTag tone={jobStatusConfig[quote.job_status]?.tone}>
                      {jobStatusConfig[quote.job_status]?.label}
                    </StatusTag>

                    <StatusTag
                      tone={paymentStatusConfig[quote.payment_status]?.tone}
                    >
                      {paymentStatusConfig[quote.payment_status]?.label}
                    </StatusTag>
                  </div>

                  <div className="view-customer__doc-actions">
                    <IconAction
                      icon={Pencil}
                      title="Edit"
                      onClick={() =>
                        navigate(`/edit-service-quote/${quote.id}`)
                      }
                    />
                    <IconAction
                      icon={Trash2}
                      title="Delete"
                      danger
                      onClick={() => handleDelete(quote.id)}
                    />
                  </div>
                </div>

                <div className="view-customer__doc-head-row view-customer__doc-head-row--flush">
                  <div>
                    <span className="view-customer__eyebrow">QUOTE REFERENCE</span>
                    <div className="view-customer__doc-title">{quote.ref_no}</div>
                  </div>

                  <span className="view-customer__amount-tag">
                    ${Number(quote.total_due).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="view-customer__doc-body">
                <div className="view-customer__company">
                  <p>{quote.to_company_name}</p>
                </div>

                <div className="view-customer__details view-customer__details--quote">
                  <div className="view-customer__detail">
                    <span className="view-customer__detail-label view-customer__detail-label--wide">
                      Service Dates:
                    </span>
                    <span className="view-customer__detail-value">
                      {quote.service_dates
                        ? dayjs(quote.service_dates).format(
                            "MM-DD-YYYY hh:mm A",
                          )
                        : "N/A"}
                    </span>
                  </div>

                  <div className="view-customer__detail">
                    <span className="view-customer__detail-label view-customer__detail-label--wide">
                      Due Date:
                    </span>
                    <span className="view-customer__detail-value">
                      {quote.due_date
                        ? dayjs(quote.due_date).format("MM-DD-YYYY hh:mm A")
                        : "N/A"}
                    </span>
                  </div>

                  {(quote.address_1 || quote.address_2) && (
                    <div className="view-customer__detail">
                      <span className="view-customer__detail-label view-customer__detail-label--wide">
                        Address:
                      </span>
                      <span className="view-customer__detail-value view-customer__detail-value--regular">
                        {quote.address_1 || ""} {quote.address_2 || ""}
                      </span>
                    </div>
                  )}
                </div>

                <div className="view-customer__items">
                  <h6 className="view-customer__items-title">Items</h6>
                  <div className="view-customer__items-list">
                    {quote.service_quote_item?.map((item) => (
                      <div key={item.id} className="view-customer__item">
                        <div className="view-customer__item-desc">
                          {item.description}
                        </div>
                        <div className="view-customer__item-meta">
                          <span>{item.frequency || "N/A"}</span>
                          <span className="view-customer__item-amount">
                            ${Number(item.amount).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="view-customer__payment">
                  {quote.payment_status === "PAID" ? (
                    <div className="view-customer__notice view-customer__notice--success">
                      <CircleCheck size={16} /> Payment Completed
                    </div>
                  ) : quote.payment_status === "EXPIRED" ? (
                    <div className="view-customer__notice view-customer__notice--warning">
                      <AlarmClock size={16} /> Payment Link Expired
                    </div>
                  ) : quote.square_payment_url ? (
                    <a
                      href={quote.square_payment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="view-customer__doc-link"
                    >
                      <CreditCard size={16} /> View Payment Link
                    </a>
                  ) : (
                    <div className="view-customer__notice view-customer__notice--muted">
                      <TriangleAlert size={16} /> Payment Link Not Available
                    </div>
                  )}
                </div>

                {/* Create/Edit Invoice button */}
                <div className="view-customer__invoice-action">
                  {quote.invoice_created ? (
                    <Button
                      type="primary"
                      size="large"
                      block
                      icon={<Pencil size={16} />}
                      onClick={() => navigate(`/edit-invoice/${quote.invoice_id}`)}
                    >
                      Edit Invoice
                    </Button>
                  ) : (
                    <Button
                      type="primary"
                      size="large"
                      block
                      icon={<Plus size={16} />}
                      loading={creatingInvoiceId === quote.id}
                      disabled={creatingInvoiceId === quote.id}
                      onClick={() => handleCreateInvoiceFromQuote(quote)}
                    >
                      {creatingInvoiceId === quote.id
                        ? "Creating..."
                        : "Create Invoice"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardGrid>
      )}
    </section>
  );

  /* Monthly Invoices tab content                                       */
  const invoicesContent = (
    <section className="view-customer__section">
      <SectionHeader title={`Monthly Invoices for ${clientName}`} />

      {monthlyInvoices.length === 0 ? (
        <EmptyState message="No monthly invoices available for this client." />
      ) : (
        <CardGrid>
          {monthlyInvoices.map((invoice) => {
            const paymentStatus = getStatusStyle(invoice.payment_status);
            return (
              <DocumentCard
                key={invoice.id}
                statusTags={[
                  { label: paymentStatus.label, tone: paymentStatus.tone },
                ]}
                eyebrow="INVOICE REF"
                title={invoice.ref_no}
                company={invoice.to_company_name}
                onEdit={() => navigate(`/edit-invoice/${invoice.id}`)}
                onDelete={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDeleteMonthlyInvoice(invoice.id);
                }}
                details={[
                  {
                    icon: <Calendar size={15} />,
                    label: "Billing Date",
                    value: invoice.billing_date
                      ? dayjs(invoice.billing_date).format("MM/DD/YYYY")
                      : null,
                  },
                  {
                    icon: <Calendar size={15} />,
                    label: "Due Date",
                    value: invoice.due_date
                      ? dayjs(invoice.due_date).format("MM/DD/YYYY")
                      : null,
                  },
                  {
                    icon: <FileText size={15} />,
                    label: "Service Dates",
                    value: invoice.service_dates,
                  },
                  {
                    icon: <CreditCard size={15} />,
                    label: "Amount Due",
                    value: `$${Number(invoice.total_due || 0).toFixed(2)}`,
                  },
                ]}
                actions={[
                  invoice.pdf_url && {
                    href: invoice.pdf_url,
                    label: "View Invoice",
                    icon: <FileText size={16} />,
                  },
                  invoice.payment_url && {
                    href: invoice.payment_url,
                    label: "Payment Link",
                    icon: <CreditCard size={16} />,
                    tone: "success",
                  },
                ].filter(Boolean)}
              />
            );
          })}
        </CardGrid>
      )}
    </section>
  );

  /* Contract Agreements tab content                                    */
  const contractsContent = (
    <section className="view-customer__section">
      <SectionHeader title={`Contract Agreements for ${clientName}`} />

      {contractAgreements.length === 0 ? (
        <EmptyState message="No contract agreements available for this client." />
      ) : (
        <CardGrid>
          {contractAgreements.map((agreement) => {
            const status = getStatusStyle(agreement.status);
            return (
              <DocumentCard
                key={agreement.id}
                statusTags={[{ label: status.label, tone: status.tone }]}
                eyebrow="AGREEMENT"
                title="Contract Agreement"
                company={agreement.client_company_name}
                onEdit={() =>
                  navigate(`/edit-contract-agreement/${agreement.id}`)
                }
                onDelete={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDeleteContractAgreement(agreement.id);
                }}
                details={[
                  {
                    icon: <UserIcon size={15} />,
                    label: "Client",
                    value: agreement.client_name,
                  },
                  {
                    icon: <Mail size={15} />,
                    label: "Email",
                    value: agreement.client_email,
                  },
                  {
                    icon: <Calendar size={15} />,
                    label: "Created",
                    value: agreement.created_at
                      ? dayjs(agreement.created_at).format("MM/DD/YYYY")
                      : null,
                  },
                ]}
                actions={[
                  agreement.file_url && {
                    href: agreement.file_url,
                    label: "View Agreement",
                    icon: <FileText size={16} />,
                  },
                  agreement.payment_url && {
                    href: agreement.payment_url,
                    label: "Payment Link",
                    icon: <CreditCard size={16} />,
                    tone: "success",
                  },
                ].filter(Boolean)}
              />
            );
          })}
        </CardGrid>
      )}
    </section>
  );

  /* Service Estimates tab content                                      */
  const estimatesContent = (
    <section className="view-customer__section">
      <SectionHeader title={`Service Estimates for ${clientName}`} />

      {serviceEstimates.length === 0 ? (
        <EmptyState message="No service estimates available for this client." />
      ) : (
        <CardGrid>
          {serviceEstimates.map((estimate) => {
            const status = getStatusStyle(estimate.status);
            return (
              <DocumentCard
                key={estimate.id}
                statusTags={[{ label: status.label, tone: status.tone }]}
                eyebrow="ESTIMATE"
                title="Service Estimate"
                company={estimate.client_company_name}
                onEdit={() => navigate(`/edit-service-estimate/${estimate.id}`)}
                onDelete={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDeleteServiceEstimate(estimate.id);
                }}
                details={[
                  {
                    icon: <Mail size={15} />,
                    label: "Email",
                    value: estimate.client_email,
                  },
                  {
                    icon: <Calendar size={15} />,
                    label: "Created",
                    value: estimate.created_at
                      ? dayjs(estimate.created_at).format("MM/DD/YYYY")
                      : null,
                  },
                ]}
                actions={[
                  estimate.file_url && {
                    href: estimate.file_url,
                    label: "View Service Estimate",
                    icon: <FileText size={16} />,
                  },
                ].filter(Boolean)}
              />
            );
          })}
        </CardGrid>
      )}
    </section>
  );

  /* Service Requests tab content                                       */
  const serviceRequestsContent = (
    <section className="view-customer__section">
      <SectionHeader title={`Service Requests for ${clientName}`} />

      {serviceRequests.length === 0 ? (
        <EmptyState message="No service requests available for this client." />
      ) : (
        <CardGrid>
          {serviceRequests.map((request) => {
            const paymentStatus = getStatusStyle(request.payment_status);

            return (
              <DocumentCard
                key={request.id}
                statusTags={[
                  { label: paymentStatus.label, tone: paymentStatus.tone },
                ]}
                eyebrow="SERVICE REQUEST"
                title={request.ref_no}
                company={request.to_company_name}
                onEdit={() => navigate(`/edit-service-request/${request.id}`)}
                onDelete={() => handleDelete(request.id)}
                details={[
                  {
                    icon: <Calendar size={15} />,
                    label: "Date",
                    value: request.date
                      ? dayjs(request.date).format("MM/DD/YYYY")
                      : null,
                  },
                  {
                    icon: <Calendar size={15} />,
                    label: "Due Date",
                    value: request.due_date
                      ? dayjs(request.due_date).format("MM/DD/YYYY")
                      : null,
                  },
                  {
                    icon: <FileText size={15} />,
                    label: "Service Days",
                    value: request.service_days,
                  },
                  {
                    icon: <CreditCard size={15} />,
                    label: "Amount",
                    value: `$${Number(request.total_due || 0).toFixed(2)}`,
                  },
                ]}
                actions={[
                  request.file_url && {
                    href: request.file_url,
                    label: "View Service Request",
                    icon: <FileText size={16} />,
                  },
                ].filter(Boolean)}
              />
            );
          })}
        </CardGrid>
      )}
    </section>
  );

  const mainTabItems = [
    { key: "overview", label: "Overview", children: overviewContent },
    {
      key: "quotes",
      label: `Service Quotes (${serviceQuotes.length})`,
      children: quotesContent,
    },
    {
      key: "invoices",
      label: `Monthly Invoices (${monthlyInvoices.length})`,
      children: invoicesContent,
    },
    {
      key: "contracts",
      label: `Contract Agreements (${contractAgreements.length})`,
      children: contractsContent,
    },
    {
      key: "estimates",
      label: `Service Estimates (${serviceEstimates.length})`,
      children: estimatesContent,
    },
    {
      key: "serviceRequests",
      label: `Service Requests (${serviceRequests.length})`,
      children: serviceRequestsContent,
    },
  ];

  return (
    <div className="view-customer">
      <PageHeader
        title="CLIENT MANAGEMENT"
        subtitle="View Information related with Client"
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

      <Tabs
        activeKey={mainTab}
        onChange={(k) => setMainTab(k)}
        className="view-customer__tabs"
        items={mainTabItems}
      />

      {/* Add / Edit Address modal                                           */}
      {addressModalVisible && (
        <Modal
          title={
            <div className="customer-modal-title">
              <span className="customer-modal-title__icon customer-modal-title__icon--primary">
                <MapPin size={17} />
              </span>
              <span className="customer-modal-title__text">
                {editingAddress ? "Edit Address" : "Add New Address"}
              </span>
            </div>
          }
          open={addressModalVisible}
          onCancel={() => {
            setAddressModalVisible(false);
            setEditingAddress(null);
            addressForm.resetFields();
            setCities([]);
            setAddressCoordinates({ lat: null, lng: null });
          }}
          onOk={handleSaveAddress}
          okText={editingAddress ? "Save Changes" : "Add Address"}
          forceRender
        >
          <Divider className="customer-modal-divider" />
          <Form
            form={addressForm}
            layout="vertical"
            onValuesChange={(changedValues, allValues) => {
              if (changedValues.state_id) {
                addressForm.setFieldsValue({ city_id: undefined });
                fetchCities(changedValues.state_id);
              }
              if (changedValues.address) {
                const fullAddress = `${changedValues.address}, ${
                  states.find((s) => s.id === allValues.state_id)?.name || ""
                }, ${
                  cities.find((c) => c.id === allValues.city_id)?.name || ""
                }`;
                fetchAddressCoordinates(fullAddress);
              }
            }}
          >
            <Form.Item
              name="address"
              label="Address"
              rules={[{ required: true, message: "Please enter the address" }]}
            >
              <Input placeholder="Enter address" />
            </Form.Item>

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
              >
                {states.map((s) => (
                  <Select.Option key={s.id} value={s.id}>
                    {s.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

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
              >
                {cities.map((c) => (
                  <Select.Option key={c.id} value={c.id}>
                    {c.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

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
      )}

      {/* Nearest Employees modal (map + list)                               */}
      {nearbyModalVisible && (
        <Modal
          title={
            <div className="customer-modal-title">
              <span className="customer-modal-title__icon customer-modal-title__icon--neutral">
                <MapPin size={17} />
              </span>
              <div>
                <div className="customer-modal-title__text">Nearest Employees</div>
                {nearbyAddress?.address && (
                  <div className="customer-modal-title__sub">
                    For {nearbyAddress.address}
                  </div>
                )}
              </div>
            </div>
          }
          open={nearbyModalVisible}
          onCancel={() => setNearbyModalVisible(false)}
          footer={null}
          width={900}
        >
          <Divider className="customer-modal-divider" />

          <div className="customer-nearby__bar">
            <div className="customer-nearby__controls">
              <p className="customer-nearby__hint">
                <Navigation size={14} />
                Address & closest employees
              </p>
              <Tooltip title="Zoom back out to all nearby employees">
                <Button
                  type="link"
                  size="small"
                  className="customer-nearby__reset"
                  icon={<RefreshCw size={14} />}
                  onClick={handleResetMapView}
                >
                  Reset View
                </Button>
              </Tooltip>
            </div>

            <p className="customer-nearby__hint">
              {nearbyEmployees.length > 0
                ? `${nearbyEmployees.length} employee${
                    nearbyEmployees.length > 1 ? "s" : ""
                  } found`
                : "Closest employees"}
            </p>
          </div>

          <div className="customer-nearby__panels">
            {/* Map Panel */}
            <div className="customer-nearby__panel">
              {nearbyLoading || !isNearbyMapLoaded ? (
                <div className="customer-nearby__loading">Loading map...</div>
              ) : (
                <GoogleMap
                  mapContainerStyle={{ width: "100%", height: "100%" }}
                  center={
                    nearbyClientLocation
                      ? {
                          lat: nearbyClientLocation.address_lat,
                          lng: nearbyClientLocation.address_long,
                        }
                      : { lat: 0, lng: 0 }
                  }
                  zoom={nearbyClientLocation ? 15 : 2}
                  onLoad={(map) => {
                    nearbyMapRef.current = map;
                    fitDefaultView();
                  }}
                >
                  {nearbyClientLocation && (
                    <Marker
                      position={{
                        lat: nearbyClientLocation.address_lat,
                        lng: nearbyClientLocation.address_long,
                      }}
                      icon={{
                        path: window.google.maps.SymbolPath.CIRCLE,
                        scale: 12,
                        fillColor: markerColors.address,
                        fillOpacity: 1,
                        strokeColor: markerColors.stroke,
                        strokeWeight: 2,
                      }}
                      label={{
                        text: "A",
                        color: markerColors.label,
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                      title={`Address — ${nearbyClientLocation.address || ""}`}
                      onClick={() => setSelectedNearbyId(null)}
                      zIndex={999}
                    />
                  )}

                  {nearbyEmployees.map((emp, index) => {
                    const isSelected = emp.id === selectedNearbyId;
                    return (
                      <Marker
                        key={emp.id}
                        position={{
                          lat: emp.address_lat,
                          lng: emp.address_long,
                        }}
                        icon={{
                          path: window.google.maps.SymbolPath.CIRCLE,
                          scale: isSelected ? 14 : 11,
                          fillColor: isSelected
                            ? markerColors.selected
                            : markerColors.employee,
                          fillOpacity: 1,
                          strokeColor: markerColors.stroke,
                          strokeWeight: 2,
                        }}
                        label={{
                          text: `${index + 1}`,
                          color: isSelected
                            ? markerColors.selectedLabel
                            : markerColors.label,
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                        title={`${emp.name} — ${emp.distance} mi away`}
                        zIndex={isSelected ? 1000 : index}
                        onClick={() => handleSelectNearbyEmployee(emp)}
                      />
                    );
                  })}

                  {selectedNearbyEmployee && (
                    <InfoWindow
                      position={{
                        lat: selectedNearbyEmployee.address_lat,
                        lng: selectedNearbyEmployee.address_long,
                      }}
                      onCloseClick={() => setSelectedNearbyId(null)}
                    >
                      <div>
                        <p>
                          <strong>{selectedNearbyEmployee.name}</strong>
                        </p>
                        <p>
                          {NEARBY_ROLE_LABELS[selectedNearbyEmployee.role_id] ||
                            "-"}
                        </p>
                        <p>{selectedNearbyEmployee.address}</p>
                        <p>
                          <strong>{selectedNearbyEmployee.distance} mi</strong>{" "}
                          away
                        </p>
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              )}
            </div>

            {/* List Panel */}
            <div className="customer-nearby__panel customer-nearby__panel--list">
              <Table
                columns={[
                  {
                    title: "#",
                    width: 40,
                    align: "center",
                    render: (_, __, index) => (
                      <span className="customer-nearby__index">{index + 1}</span>
                    ),
                  },
                  {
                    title: "Name",
                    dataIndex: "name",
                    render: (name) => (
                      <span className="customer-nearby__medium">{name}</span>
                    ),
                  },
                  {
                    title: "Role",
                    dataIndex: "role_id",
                    width: 190,
                    render: (role_id) => (
                      <strong className="customer-nearby__role">
                        {NEARBY_ROLE_LABELS[role_id] || "-"}
                      </strong>
                    ),
                  },
                  {
                    title: "Distance",
                    dataIndex: "distance",
                    width: 100,
                    align: "right",
                    sorter: (a, b) => a.distance - b.distance,
                    defaultSortOrder: "ascend",
                    render: (distance) => (
                      <span className="customer-nearby__medium">
                        {distance} mi
                      </span>
                    ),
                  },
                ]}
                rowKey={(record) => record.id}
                dataSource={nearbyEmployees}
                loading={nearbyLoading}
                pagination={false}
                size="small"
                locale={{ emptyText: "No employees found." }}
                onRow={(record) => ({
                  onClick: () => handleSelectNearbyEmployee(record),
                  style: {
                    cursor: "pointer",
                    background:
                      record.id === selectedNearbyId
                        ? "var(--color-warning-subtle)"
                        : undefined,
                  },
                })}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ClientDetailsPage;
