import dayjs from "@/lib/dayjs";
import { useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  message,
  Row,
  Col,
  DatePicker,
  Select,
  Tabs,
  Modal,
} from "antd";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, ClipboardList, FileText, PenLine } from "lucide-react";
import {
  EditServiceEstimate,
  GetServiceEstimateById,
} from "../../services/Api/Api";
import { GetAllUserName } from "../../services/Api/InvoiceApi";

import "./GenerateEstimate.scss";
import { GetAllBDMS, GetBDMByUserId, AssignUser } from "../../services/Api/bdm";
import SignatureField from "../Customer/SignatureField";
import EstimateScopeBuilder from "./EstimateScopeBuilder/EstimateScopeBuilder";
import { GetUserScopeView } from "../../services/Api/ScopeApi";

const { Option } = Select;

const UpdateServiceEstimate = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [users, setUsers] = useState([]);
  const [scopeLoading, setScopeLoading] = useState(true);
  const [formData, setFormData] = useState({
    signature: "",
  });

  const [bdm, setBdm] = useState(null);
  const [bdmList, setBdmList] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBDM, setSelectedBDM] = useState(null);
  const [scopeSections, setScopeSections] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [hasUserScope, setHasUserScope] = useState(false);

const fetchUserScopeView = async (userId) => {
  try {
    setScopeLoading(true);

    const res = await GetUserScopeView(userId);

    const sections = res?.data?.data?.data || [];

    setScopeSections(sections);
    setHasUserScope(Array.isArray(sections) && sections.length > 0);
  } catch (error) {
    console.error("Failed to fetch user scope:", error);
    setScopeSections([]);
    setHasUserScope(false);
  } finally {
    setScopeLoading(false);
  }
};

  const [activeTab, setActiveTab] = useState("1");
  const navigate = useNavigate();
  const { id } = useParams();

  const formatDate = (date) => (date ? dayjs(date).format("MM/DD/YYYY") : null);

  const onFinish = async (values) => {
    try {
      setLoading(true);
      const res = await EditServiceEstimate({
        estimate_id: id,
        user_id: values.user_id,
        bdm_id: bdm?.id,
        client_company_name: values.client_company_name,
        address_line_1: values.address_line_1,
        address_line_2: values.address_line_2,
        city: values.city,
        state: values.state,
        zip: values.zip,

        contact_name: values.contact_name,
        contact_phone: values.contact_phone,
        contact_fax: values.contact_fax,
        contact_email: values.contact_email,

        signed_date: formatDate(values.signed_date),
        signature: formData.signature,
        scope_sections: scopeSections, // ✅ always up to date
      });

      if (res.status === 200) {
        message.success("PDF generated successfully");
        navigate("/pdf-generation");
      }
    } catch {
      message.error("Error generating PDF");
    } finally {
      setLoading(false);
    }
  };

  const getUsers = async () => {
    try {
      const res = await GetAllUserName();
      setUsers(res.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleUserChange = async (userId) => {
    setSelectedUserId(userId);
    await fetchUserScopeView(userId);
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    const address = user.address || {};

    form.setFieldsValue({
      client_company_name: user.company_name || user.name || "",
      contact_name: user.name || "",
      contact_phone: user.mobile || "",
      contact_email: user.email || "",
      address_line_1: address.address_1 || "",
      address_line_2: address.address_2 || "",
      city: address.city || "",
      state: address.state || "",
      zip: address.zip || "",
    });

    // 🔥 NEW: fetch BDM
    try {
      const res = await GetBDMByUserId(userId);
      setBdm(res?.data?.data || null);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBDMs = async () => {
    try {
      const res = await GetAllBDMS();
      setBdmList(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    getUsers();
    fetchBDMs();

    getEstimate();
  }, [id]);

  const handleAssignBDM = async () => {
    try {
      if (!selectedBDM || !form.getFieldValue("user_id")) {
        message.error("Select BDM and User first");
        return;
      }

      await AssignUser({
        bdm_id: selectedBDM,
        user_id: [form.getFieldValue("user_id")],
      });

      message.success("BDM assigned successfully");

      // 🔥 refetch BDM
      const res = await GetBDMByUserId(form.getFieldValue("user_id"));
      setBdm(res?.data?.data || null);

      setIsModalOpen(false);
      setSelectedBDM(null);
    } catch {
      message.error("Failed to assign BDM");
    }
  };

  const getEstimate = async () => {
    try {
      const res = await GetServiceEstimateById(id);

      const data = res.data.data;

      form.setFieldsValue({
        user_id: data.user_id,

        client_company_name: data.client_company_name,

        address_line_1: data.address_line_1,
        address_line_2: data.address_line_2,
        city: data.city,
        state: data.state,
        zip: data.zip,

        contact_name: data.contact_name,
        contact_phone: data.contact_phone,
        contact_fax: data.contact_fax,
        contact_email: data.contact_email,

        signed_date: data.signed_date
          ? dayjs(data.signed_date, "MM/DD/YYYY")
          : null,
      });

      setSelectedUserId(data.user_id);

      setFormData({
        signature: data.signature || "",
      });

      if (data.user_id) {
        await fetchUserScopeView(data.user_id);
      } else {
        setScopeSections([]);
        setHasUserScope(false);
        setScopeLoading(false);
      }

      if (data.user_id) {
        const bdmRes = await GetBDMByUserId(data.user_id);
        setBdm(bdmRes?.data?.data || null);
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to load estimate");
    }
  };

  /* Tab items */
  const tabItems = [
    {
      key: "1",
      label: (
        <span className="ge-tab-label">
          <span className="ge-tab-label__icon">
            <FileText size={16} />
          </span>
          Estimate Details
        </span>
      ),
      children: (
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <div className="ge-section">
            <div className="ge-section__label">
              <span className="ge-section__num">01</span>
              Client Information
              <span className="ge-section__page">Page 1</span>
            </div>
            <div className="ge-section__body">
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Client Company Name"
                    name="client_company_name"
                    rules={[{ required: true }]}
                  >
                    <Input placeholder="e.g. Acme Corp" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Address Line 1"
                    name="address_line_1"
                    rules={[{ required: true }]}
                  >
                    <Input placeholder="Street address" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Address Line 2" name="address_line_2">
                    <Input placeholder="Suite, unit, etc." />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item
                    label="City"
                    name="city"
                    rules={[{ required: true }]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item
                    label="State"
                    name="state"
                    rules={[{ required: true }]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item
                    label="Zip Code"
                    name="zip"
                  >
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          </div>

          <div className="ge-section">
            <div className="ge-section__label">
              <span className="ge-section__num">02</span>
              Contact Information
            </div>
            <div className="ge-section__body">
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Select Client"
                    name="user_id"
                    rules={[{ required: true }]}
                  >
                    <Select
                      showSearch
                      placeholder="Search and select client"
                      optionFilterProp="children"
                      onChange={handleUserChange}
                      filterOption={(input, option) =>
                        option.children
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                    >
                      {users.map((user) => (
                        <Option key={user.id} value={user.id}>
                          {user.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Contact Name"
                    name="contact_name"
                    rules={[{ required: true }]}
                  >
                    <Input placeholder="Enter contact name" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item
                    label="Phone"
                    name="contact_phone"
                    rules={[{ required: true }]}
                  >
                    <Input placeholder="Enter phone number" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item label="Fax" name="contact_fax">
                    <Input placeholder="Enter fax number" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item
                    label="Email"
                    name="contact_email"
                    rules={[
                      { required: true },
                      { type: "email", message: "Enter valid email" },
                    ]}
                  >
                    <Input placeholder="Enter email address" />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          </div>

          <div className="ge-section">
            <div className="ge-section__label">
              <span className="ge-section__num">03</span>
              Assigned Representative (BDM)
              <span className="ge-section__page">Page 3</span>
            </div>

            <div className="ge-section__body">
              {/* 🚫 No user selected */}
              {!form.getFieldValue("user_id") && (
                <div className="bdm-empty">
                  <p className="text-muted" style={{ marginBottom: 10 }}>
                    Please select a client first to view or assign a BDM
                  </p>

                  <Button disabled type="primary">
                    Assign BDM
                  </Button>
                </div>
              )}

              {/* ✅ User selected */}
              {form.getFieldValue("user_id") && (
                <>
                  {/* ✅ BDM exists */}
                  {bdm ? (
                    <div className="bdm-card">
                      <p>
                        <b>Name:</b> {bdm.name}
                      </p>
                      <p>
                        <b>Email:</b> {bdm.email}
                      </p>
                      <p>
                        <b>Phone:</b> {bdm.mobile || "(813) 296-9695"}
                      </p>

                      <Button
                        style={{ marginTop: 10 }}
                        onClick={() => setIsModalOpen(true)}
                      >
                        Change BDM
                      </Button>
                    </div>
                  ) : (
                    <Button type="primary" onClick={() => setIsModalOpen(true)}>
                      Assign BDM
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="ge-section">
            <div className="ge-section__label">
              <span className="ge-section__num">04</span>
              Date
              <span className="ge-section__page">Page 11</span>
            </div>
            <div className="ge-section__body">
              <Row gutter={16}>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item
                    label="Signed Date"
                    name="signed_date"
                    rules={[{ required: true }]}
                  >
                    <DatePicker style={{ width: "100%" }} format="MM/DD/YYYY" />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          </div>
          <div className="ge-section">
            <div className="ge-section__label">
              <span className="ge-section__num">05</span>
              Admin Signature
              <span className="ge-section__page">Page 11</span>
            </div>

            <div className="ge-section__body">
              <div className="signature-block">
                <SignatureField formData={formData} setFormData={setFormData} />
              </div>
            </div>
          </div>

          <Form.Item style={{ marginTop: 8 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              className="ge-submit-btn"
              icon={<PenLine size={16} />}
            >
              Update &amp; Sign Document
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: "2",
      label: (
        <span className="ge-tab-label">
          <span className="ge-tab-label__icon">
            <ClipboardList size={16} />
          </span>
          Scope of Work
          <span className="ge-section__page">Page 4-5</span>
        </span>
      ),
      children: (
        <div className="ge-scope-tab">
          {scopeLoading ? (
            <div className="ge-scope-loading">
              <span>Loading scope of work…</span>
            </div>
          ) : hasUserScope ? (
            <EstimateScopeBuilder
              estimateId={id}
              userId={selectedUserId}
              sections={scopeSections}
              onChange={setScopeSections}
            />
          ) : (
            <div className="ge-scope-empty">
              <p className="ge-scope-empty__title">No User Scope</p>

              <p className="ge-scope-empty__text">
                This client does not have a Scope of Work yet.
              </p>

              <Button
                type="primary"
                onClick={() => {
                  if (!selectedUserId) return;
                  navigate(`/editUser/${selectedUserId}`);
                }}
              >
                Edit Client Scope
              </Button>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="ge-wrapper">
      {/* Page header */}
      <div className="ge-header">
        <div className="ge-header__left">
          <h2 className="ge-header__title">Update Service Estimate</h2>
          <p className="ge-header__sub">
            Update the estimate and resend it for signature.
          </p>
        </div>
        <button
          className="ge-back-btn"
          onClick={() => navigate("/pdf-generation")}
        >
          <ArrowLeft size={16} />
          Back to All PDFs
        </button>
      </div>

      {/* Tabs */}
      <div className="ge-tabs-wrapper">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
          className="ge-tabs"
        />
      </div>

      <Modal
        title="Assign BDM"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleAssignBDM}
        okText="Assign"
      >
        <Select
          style={{ width: "100%" }}
          placeholder="Select BDM"
          onChange={(value) => setSelectedBDM(value)}
        >
          {bdmList.map((b) => (
            <Option key={b.id} value={b.id}>
              {b.name} ({b.email})
            </Option>
          ))}
        </Select>
      </Modal>
    </div>
  );
};

export default UpdateServiceEstimate;
