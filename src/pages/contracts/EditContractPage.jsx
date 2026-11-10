import dayjs from "@/lib/dayjs";
import { useEffect, useState } from "react";
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
} from "antd";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { UpdateContractAgreement, GetContractAgreementById } from "@/services/api/contractApi";
import SignatureField from "@/components/SignatureField";

const EditContractPage = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    signature: "",
  });

  const formatDate = (date) => (date ? dayjs(date).format("MM/DD/YYYY") : null);

  const onFinish = async (values) => {
    try {
      setLoading(true);

      const res = await UpdateContractAgreement({
        contract_id: id,
        user_id: values.user_id,
        client_company_name: values.client_company_name,
        total_monthly_price: values.total_monthly_price,
        service_address: values.service_address,
        client_legal_name: values.client_legal_name,
        client_representative: values.client_representative,
        contract_date: formatDate(values.current_date),
        signature: formData.signature,
      });

      if (res.status === 200) {
        navigate("/contract-agreement");
        message.success("Contract updated successfully");
      }
    } catch {
      message.error("Error generating contract");
    } finally {
      setLoading(false);
    }
  };

  const getContract = async () => {
    try {
      const res = await GetContractAgreementById(id);

      const data = res.data.data;

      form.setFieldsValue({
        user_id: data.user_id,
        client_company_name: data.client_company_name,
        client_legal_name: data.client_legal_name,
        client_representative: data.client_representative,
        service_address: data.service_address,
        total_monthly_price: Number(data.total_monthly_price),
        current_date: data.contract_date
          ? dayjs(data.contract_date, "MM/DD/YYYY")
          : null,
      });
      setFormData((prev) => ({
        ...prev,
        signature: data.signature || "",
      }));
    } catch (err) {
      console.error(err);
      message.error("Failed to load contract");
    }
  };

  useEffect(() => {
    if (id) {
      getContract();
    }
  }, [id]);

  return (
    <>
      <PageHeader
        title="CONTRACT AGREEMENT MANAGEMENT"
        subtitle="Update an existing contract agreement"
        actions={
          <Button
            size="large"
            icon={<ArrowLeft size={16} />}
            onClick={() => navigate("/contract-agreement")}
          >
            Return to Contracts
          </Button>
        }
      />

      <Form form={form} layout="vertical" onFinish={onFinish}>
        {/* CLIENT */}
        <Card title="Contract Information" style={{ marginBottom: 20 }}>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Company Name"
                name="client_company_name"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Client Legal Name"
                name="client_legal_name"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
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
            <Col xs={24} md={12}>
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
          <div className="signature-block" style={{ marginTop: 16 }}>
            <SignatureField formData={formData} setFormData={setFormData} />
          </div>
        </Card>

        <Button type="primary" htmlType="submit" loading={loading} block>
          Update Contract
        </Button>
      </Form>
    </>
  );
};

export default EditContractPage;