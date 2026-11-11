import { useEffect, useRef, useState } from "react";
import { Card, Spin, Button, Typography, Progress, Space } from "antd";
import { CircleCheck, CircleX, Clock } from "lucide-react";
import { useParams, useSearchParams } from "react-router";
import { getPaymentStatus } from "@/services/api/paymentApi";
import { dataOf } from "@/services/apiResult";
import "./CheckoutStatusPage.scss";
import { GOOGLE_REVIEW_URL } from "@/config/brand";

const { Title, Text } = Typography;

const REDIRECT_SECONDS = 3;

// Where a client lands after paying an invoice's Square link (/checkout, with
// Square's ids in the query, or /checkout/:transactionId): how the payment went.
const CheckoutStatusPage = () => {
  const { transactionId: fromPath } = useParams();
  const [params] = useSearchParams();
  const transactionId =
    fromPath || params.get("transactionId") || params.get("transaction_id") || params.get("orderId") || "";
  const [loading, setLoading] = useState(Boolean(transactionId));
  // SUCCESS, PENDING, REJECTED, REFUNDED, or UNKNOWN (not found yet, or no id)
  const [status, setStatus] = useState(transactionId ? null : "UNKNOWN");
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);

  const redirectDoneRef = useRef(false);

  useEffect(() => {
    if (!transactionId) return undefined;
    let current = true;
    getPaymentStatus(transactionId)
      .then((res) => dataOf(res)?.payment_status || "UNKNOWN")
      .catch(() => "UNKNOWN")
      .then((next) => {
        if (!current) return;
        setStatus(next);
        setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [transactionId]);

  // 🔁 Countdown + redirect
  useEffect(() => {
    if (status !== "SUCCESS") return undefined;

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
  if (status === "SUCCESS") {
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

  // ⏳ PENDING, or not known yet (Square tells us a moment after the payment)
  if (status === "PENDING" || status === "UNKNOWN") {
    return (
      <div className="checkout-status">
        <Card className="checkout-status__card">
          <Space orientation="vertical" size="large" align="center">
            <Clock size={72} color="var(--color-info)" />

            <Title level={3}>Processing payment</Title>
            <Text type="secondary">
              {status === "UNKNOWN"
                ? "We haven’t heard about this payment yet. It can take a minute; your receipt comes by email."
                : "We’re waiting for confirmation from your bank."}
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

export default CheckoutStatusPage;
