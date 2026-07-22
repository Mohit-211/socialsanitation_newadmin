/** @format */

import dayjs from "@/lib/dayjs";
import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Button,
  message,
  Row,
  Col,
  Typography,
  DatePicker,
  Select,
  Tabs,
  Modal,
} from "antd";
import { useNavigate } from "react-router-dom";
import { GenerateServiceEstimate } from "../../services/Api/Api";
import { GetAllUserName } from "../../services/Api/InvoiceApi";

import { getScope } from "../../services/Api/ScopeApi";
import "./GenerateEstimate.scss";
import { GetAllBDMS, GetBDMByUserId, AssignUser } from "../../services/Api/bdm";
import UserScopeBuilder from "./UserScopeBuilder/UserScopeBuilder";
import SignatureField from "../Customer/SignatureField";

const { Option } = Select;

const GenerateEstimate = () => {
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

  const [activeTab, setActiveTab] = useState("1");
  const navigate = useNavigate();

  const formatDate = (date) => (date ? dayjs(date).format("MM/DD/YYYY") : null);

  const onFinish = async (values) => {
    try {
      setLoading(true);
      const res = await GenerateServiceEstimate({
        user_id: values.user_id,
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
        bdm_id: bdm?.id || null,
        signature: formData.signature,
        scope_sections: scopeSections, // ✅ always up to date
      });

      const signingUrl = res?.data?.data?.data?.signingUrl;
      if (res.status === 200 ) {
        // window.open(signingUrl, "_blank");
        message.success("PDF generated successfully");
        navigate("/pdf-generation");
      } else {
        message.error("Signing URL not found");
      }
    } catch (err) {
      message.error("Error generating PDF");
    } finally {
      setLoading(false);
    }
  };

  const fetchScope = async () => {
    setScopeLoading(true);
    try {
      const res = await getScope();
      const sectionsArray = res?.data?.data?.data || [];
      const formatted = sectionsArray.map((section) => ({
        id: section.id,
        title: section.title,
        is_red: section.is_red,
        items: (section.items || []).map((item) => ({
          id: item.id,
          description: item.description,
          is_daily: item.is_daily,
          is_weekly: item.is_weekly,
          is_monthly: item.is_monthly,
        })),
      }));
      setScopeSections(formatted); // ✅ set directly into parent state
    } catch (err) {
      console.log(err);
    } finally {
      setScopeLoading(false);
    }
  };

  const getUsers = async () => {
    try {
      const res = await GetAllUserName();
      setUsers(res.data.data);
    } catch (error) {
      console.log(error);
    }
  };

  const handleUserChange = async (userId) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    const address = user.address || {};

    form.setFieldsValue({
      client_company_name: user.company_name || user.name || "",
      contact_name: user.name || "",
      contact_phone: user?.mobile || "",
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
      console.log(err);
    }
  };

  const fetchBDMs = async () => {
    try {
      const res = await GetAllBDMS();
      setBdmList(res.data.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    getUsers();
    fetchScope();
    fetchBDMs(); // ✅ NEW
  }, []);

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
    } catch (err) {
      message.error("Failed to assign BDM");
    }
  };

  /* ─── Tab items ─── */
  const tabItems = [
    {
      key: "1",
      label: (
        <span className="ge-tab-label">
          <span className="ge-tab-label__icon">📄</span>
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
                <Col span={12}>
                  <Form.Item
                    label="Client Company Name"
                    name="client_company_name"
                    rules={[{ required: true }]}
                  >
                    <Input placeholder="e.g. Acme Corp" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Address Line 1"
                    name="address_line_1"
                    rules={[{ required: true }]}
                  >
                    <Input placeholder="Street address" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Address Line 2" name="address_line_2">
                    <Input placeholder="Suite, unit, etc." />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="City"
                    name="city"
                    rules={[{ required: true }]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="State"
                    name="state"
                    rules={[{ required: true }]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Zip Code"
                    name="zip"
                    // rules={[{ required: true }]}
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
              {/* <span className="ge-section__page">Page 10</span> */}
            </div>
            <div className="ge-section__body">
              <Row gutter={16}>
                <Col span={12}>
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
                <Col span={12}>
                  <Form.Item
                    label="Contact Name"
                    name="contact_name"
                    rules={[{ required: true }]}
                  >
                    <Input placeholder="Enter contact name" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Phone"
                    name="contact_phone"
                    rules={[{ required: true }]}
                  >
                    <Input placeholder="Enter phone number" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="Fax" name="contact_fax">
                    <Input placeholder="Enter fax number" />
                  </Form.Item>
                </Col>
                <Col span={8}>
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
                  <p style={{ marginBottom: 10, color: "#999" }}>
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
                <Col span={8}>
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
            >
              🖊️ &nbsp; Generate &amp; Sign Document
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: "2",
      label: (
        <span className="ge-tab-label">
          <span className="ge-tab-label__icon">📋</span>
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
          ) : (
            // ✅ Pass sections and setSections directly — no internal state in ScopeBuilder
            <UserScopeBuilder
              userId={form.getFieldValue("user_id")}
              onChange={setScopeSections}
            />
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
          <h2 className="ge-header__title">Generate Service Estimate</h2>
          <p className="ge-header__sub">
            Fill in the details below to generate and send for signing.
          </p>
        </div>
        <button
          className="ge-back-btn"
          onClick={() => navigate("/pdf-generation")}
        >
          ← Back to All PDFs
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

export default GenerateEstimate;
