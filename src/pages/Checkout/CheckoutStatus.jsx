/** @format */
import React, { useEffect, useState, useRef } from "react";
import {
  Card,
  Spin,
  Result,
  Button,
  Typography,
  Progress,
  Space
} from "antd";
import {
  CheckCircleFilled,
  ClockCircleOutlined,
  CloseCircleFilled,
} from "@ant-design/icons";
import { useParams } from "react-router-dom";
import { GetPaymentStatus } from "../../services/Api/InvoiceApi";

const { Title, Text } = Typography;

const GOOGLE_REVIEW_URL =
  "https://www.google.com/maps/place/Social+Sanitation+Commercial+Cleaning+Solutions";

const REDIRECT_SECONDS = 3;

const CheckoutStatus = () => {
  const { transactionId } = useParams();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);

  const redirectDoneRef = useRef(false);

  // 🔹 Fetch payment status
  useEffect(() => {
    if (!transactionId) {
      setStatus("REJECTED");
      setLoading(false);
      return;
    }

    const fetchStatus = async () => {
      try {
        const res = await GetPaymentStatus(transactionId);
        setStatus(res?.data?.data?.payment_status || "REJECTED");
      } catch {
        setStatus("REJECTED");
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [transactionId]);

  // 🔁 Countdown + redirect
  useEffect(() => {
    if (status !== "SUCCESS" && status !== "PAID") return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);

          if (!redirectDoneRef.current) {
            redirectDoneRef.current = true;
            window.open(GOOGLE_REVIEW_URL, "_blank");
          }

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [status]);

  // 🔄 Loading screen (Square-style)
  if (loading) {
    return (
      <div style={pageStyle}>
        <Spin size="large" tip="Confirming payment..." />
      </div>
    );
  }

  // ✅ SUCCESS
  if (status === "SUCCESS" || status === "PAID") {
    return (
      <div style={pageStyle}>
        <Card style={cardStyle}>
          <Space direction="vertical" size="large" align="center">
            <CheckCircleFilled style={{ fontSize: 72, color: "#22c55e" }} />

            <Title level={3}>Payment complete</Title>
            <Text type="secondary">
              Your payment was processed successfully.
            </Text>

            <Progress
              type="circle"
              percent={(countdown / REDIRECT_SECONDS) * 100}
              format={() => `${countdown}s`}
              size={90}
              strokeColor="#22c55e"
            />

            <Text type="secondary">
              Redirecting you to leave a review…
            </Text>

            <Button
              type="primary"
              size="large"
              block
              onClick={() => window.open(GOOGLE_REVIEW_URL, "_blank")}
            >
              Leave a Review
            </Button>
          </Space>
        </Card>
      </div>
    );
  }

  // ⏳ PENDING
  if (status === "PENDING") {
    return (
      <div style={pageStyle}>
        <Card style={cardStyle}>
          <Space direction="vertical" size="large" align="center">
            <ClockCircleOutlined style={{ fontSize: 72, color: "#1677ff" }} />

            <Title level={3}>Processing payment</Title>
            <Text type="secondary">
              We’re waiting for confirmation from your bank.
            </Text>

            <Spin />

            <Button onClick={() => window.location.reload()}>
              Refresh status
            </Button>
          </Space>
        </Card>
      </div>
    );
  }

  // ❌ FAILED
  return (
    <div style={pageStyle}>
      <Card style={cardStyle}>
        <Space direction="vertical" size="large" align="center">
          <CloseCircleFilled style={{ fontSize: 72, color: "#ef4444" }} />

          <Title level={3}>Payment failed</Title>
          <Text type="secondary">
            The payment could not be completed. No amount was charged.
          </Text>

          <Button
            danger
            type="primary"
            size="large"
            block
            onClick={() => window.history.back()}
          >
            Try again
          </Button>
        </Space>
      </Card>
    </div>
  );
};

// 🎨 Styles
const pageStyle = {
  minHeight: "100vh",
  background: "#f8f9fb",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: 24,
};

const cardStyle = {
  width: "100%",
  maxWidth: 420,
  borderRadius: 16,
  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  textAlign: "center",
  padding: "32px 24px",
};

export default CheckoutStatus;
