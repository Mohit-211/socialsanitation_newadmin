/** @format */

import dayjs from "@/lib/dayjs";
import React, { useEffect, useState } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  message,
  Row,
  Col,
  InputNumber,
  DatePicker,
  Select,
} from "antd";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import MuiButton from "@mui/material/Button";
import { ArrowLeft } from "lucide-react";
import { GenerateContractAgreement } from "../../services/Api/Api";
import { GetAllUserName } from "../../services/Api/InvoiceApi";
import SignatureField from "../Customer/SignatureField";

const { Option } = Select;

const CreateContractAgreement = () => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    signature: "",
  });
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const formatDate = (date) => (date ? dayjs(date).format("MM/DD/YYYY") : null);

  const onFinish = async (values) => {
    try {
      setLoading(true);

      if (!formData.signature) {
        message.error("Please add your signature.");
        return;
      }

      const res = await GenerateContractAgreement({
        user_id: values.user_id,
        client_company_name: values.client_company_name,
        total_monthly_price: values.total_monthly_price,
        service_address: values.service_address,
        client_legal_name: values.client_legal_name,
        client_representative: values.client_representative,
        contract_date: formatDate(values.current_date),
        signature: formData.signature,
      });

      const signingUrl = res?.data?.data?.data?.signingUrl;

      if (res.status === 200) {
        // window.open(signingUrl, "_blank");
        navigate("/contract-agreement");
        message.success("Contract generated successfully");
      }
    } catch (err) {
      message.error("Error generating contract");
    } finally {
      setLoading(false);
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

  useEffect(() => {
    getUsers();
  }, []);

  /* ================= UPDATED AUTO-FILL ================= */

  const handleUserChange = (userId) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    const address = user.address || {};

    const fullAddress = [
      address.address_1,
      address.city,
      address.state,
      address.country,
    ]
      .filter(Boolean)
      .join(", ");

    form.setFieldsValue({
      client_company_name: user.name || "",
      client_legal_name: user.name || "",
      client_representative: user.name || "",
      service_address: fullAddress,
    });
  };

  return (
    <>
      {/* HEADER */}
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
            flexWrap: { xs: "wrap", md: "nowrap" },
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography className="page-title" noWrap>
              CONTRACT AGREEMENT MANAGEMENT
            </Typography>
            <Typography
              className="page-sub-title"
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              Generate a new contract agreement
            </Typography>
          </Box>

          <MuiButton
            variant="contained"
            disableElevation
            startIcon={<ArrowLeft size={18} />}
            onClick={() => navigate("/contract-agreement")}
            sx={{
              height: 46,
              px: 3,
              borderRadius: "8px",
              minWidth: 180,
              textTransform: "none",
              fontWeight: 600,
              backgroundColor: "#2c3345",
              flexShrink: 0,
              "&:hover": {
                backgroundColor: "#1f2433",
              },
            }}
          >
            Return to Contracts
          </MuiButton>
        </Box>
      </Paper>

      <Form form={form} layout="vertical" onFinish={onFinish}>
        {/* CLIENT */}
        <Card title="Client Information" style={{ marginBottom: 20 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Select Client"
                name="user_id"
                rules={[{ required: true }]}
              >
                <Select
                  showSearch
                  placeholder="Select Client"
                  optionFilterProp="label"
                  onChange={handleUserChange}
                  options={users.map((u) => ({
                    value: u.id,
                    label: u.name,
                  }))}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Client Company Name"
                name="client_company_name"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Client Legal Name"
                name="client_legal_name"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Client Representative"
                name="client_representative"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* SERVICE DETAILS */}
        <Card title="Service Details" style={{ marginBottom: 20 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Total Monthly Price"
                name="total_monthly_price"
                rules={[{ required: true }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  prefix="$"
                  precision={6}
                />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                label="Service Address"
                name="service_address"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* CONTRACT DATE */}
        <Card title="Contract Date" style={{ marginBottom: 20 }}>
          <Form.Item
            label="Current Date"
            name="current_date"
            rules={[{ required: true }]}
          >
            <DatePicker style={{ width: "100%" }} format="MM/DD/YYYY" />
          </Form.Item>
        </Card>

        <Card title="Admin Signature" style={{ marginBottom: 20 }}>
          <div className="signature-block">
            <SignatureField formData={formData} setFormData={setFormData} />
          </div>
        </Card>

        <Button type="primary" htmlType="submit" loading={loading} block>
          Generate Contract
        </Button>
      </Form>
    </>
  );
};

export default CreateContractAgreement;