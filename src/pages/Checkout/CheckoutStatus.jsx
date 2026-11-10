import { useEffect, useState, useRef } from "react";
import { Card, Spin, Button, Typography, Progress, Space } from "antd";
import { CircleCheck, CircleX, Clock } from "lucide-react";
import { useParams } from "react-router";
import { GetPaymentStatus } from "../../services/Api/InvoiceApi";
import "./CheckoutStatus.scss";

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
      <div className="checkout-status">
        <Spin size="large" description="Confirming payment..." />
      </div>
    );
  }

  // ✅ SUCCESS
  if (status === "SUCCESS" || status === "PAID") {
    return (
      <div className="checkout-status">
        <Card className="checkout-status__card">
          <Space orientation="vertical" size="large" align="center">
            <CircleCheck size={72} color="var(--color-success)" />

            <Title level={3}>Payment complete</Title>
            <Text type="secondary">
              Your payment was processed successfully.
            </Text>

            <Progress
              type="circle"
              percent={(countdown / REDIRECT_SECONDS) * 100}
              format={() => `${countdown}s`}
              size={90}
              strokeColor="var(--color-success)"
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
      <div className="checkout-status">
        <Card className="checkout-status__card">
          <Space orientation="vertical" size="large" align="center">
            <Clock size={72} color="var(--color-info)" />

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
    <div className="checkout-status">
      <Card className="checkout-status__card">
        <Space orientation="vertical" size="large" align="center">
          <CircleX size={72} color="var(--color-error)" />

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

export default CheckoutStatus;
