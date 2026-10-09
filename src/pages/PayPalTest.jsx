import React, {
  useEffect,
  useState,
} from "react";

// HARD CODE THIS FOR TESTING
const TEST_ORDER_ID = 15;

const API_BASE_URL =
  "https://node.hashtagbillionaire.com/api/v1/payment";

// Use your existing access token for testing.
// DO NOT commit a real token to source control.
const ACCESS_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImlhdCI6MTc4OTAyMDc2MywiZXhwIjoxNzg5NjI1NTYzLCJ0eXBlIjoiYWNjZXNzIiwicm9sZV9pZCI6Nn0.IqAlj-7T7qgbtlsXj8Ds7Y0W-zqy1sUBDyPjMn7A1vs";

const PayPalTest = () => {
  const [
    paypalOrderId,
    setPaypalOrderId,
  ] = useState(null);

  const [
    approvalUrl,
    setApprovalUrl,
  ] = useState(null);

  const [
    captureResult,
    setCaptureResult,
  ] = useState(null);

  const [
    error,
    setError,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  /*
   * ==================================================
   * CAPTURE PAYPAL ORDER
   * ==================================================
   */

  const capturePayPalOrder =
    async (paypalOrderId) => {
      try {
        setError("");
        setLoading(true);

        console.log(
          "💰 Capturing PayPal order...",
        );

        console.log(
          "Internal Order ID:",
          TEST_ORDER_ID,
        );

        console.log(
          "PayPal Order ID:",
          paypalOrderId,
        );

        const response =
          await fetch(
            `${API_BASE_URL}/paypal/capture-order`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                "x-access-token":
                  ACCESS_TOKEN,
              },

              body: JSON.stringify({
                order_id:
                  TEST_ORDER_ID,

                paypal_order_id:
                  paypalOrderId,
              }),
            },
          );

        const result =
          await response.json();

        console.log(
          "💳 Capture PayPal Order Response:",
          result,
        );

        if (!response.ok) {
          throw new Error(
            result.message ||
              "Failed to capture PayPal order",
          );
        }

        setCaptureResult(
          result,
        );

        return result;
      } catch (error) {
        console.error(
          "❌ Capture PayPal Order Error:",
          error,
        );

        setError(
          error.message ||
            "Failed to capture PayPal order.",
        );

        throw error;
      } finally {
        setLoading(false);
      }
    };

  /*
   * ==================================================
   * HANDLE PAYPAL RETURN
   * ==================================================
   *
   * PayPal redirects back to:
   *
   * /paypal?token=PAYPAL_ORDER_ID
   *
   * We automatically capture the order.
   */

  useEffect(() => {
    const handlePayPalReturn =
      async () => {
        try {
          const params =
            new URLSearchParams(
              window.location.search,
            );

          const token =
            params.get("token");

          const payerId =
            params.get(
              "PayerID",
            );

          /*
           * If there is no token,
           * this is the normal page.
           */

          if (!token) {
            return;
          }

          console.log(
            "🔄 PayPal returned to application.",
          );

          console.log(
            "PayPal Order ID from URL:",
            token,
          );

          console.log(
            "PayPal Payer ID:",
            payerId,
          );

          setPaypalOrderId(
            token,
          );

          setLoading(true);

          /*
           * Automatically capture.
           */

          await capturePayPalOrder(
            token,
          );

          /*
           * Remove PayPal query
           * parameters from browser URL.
           */

          window.history.replaceState(
            {},
            document.title,
            window.location.pathname,
          );
        } catch (error) {
          console.error(
            "❌ PayPal return handling error:",
            error,
          );

          setError(
            error.message ||
              "Failed to process PayPal return.",
          );

          setLoading(false);
        }
      };

    handlePayPalReturn();
  }, []);

  /*
   * ==================================================
   * CREATE PAYPAL ORDER
   * ==================================================
   */

  const createPayPalOrder =
    async () => {
      try {
        setError("");
        setCaptureResult(null);
        setApprovalUrl(null);

        setLoading(true);

        console.log(
          "🚀 Creating PayPal order...",
        );

        console.log(
          "Internal Order ID:",
          TEST_ORDER_ID,
        );

        const response =
          await fetch(
            `${API_BASE_URL}/paypal/create-order`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                "x-access-token":
                  ACCESS_TOKEN,
              },

              body: JSON.stringify({
                order_id:
                  TEST_ORDER_ID,
              }),
            },
          );

        const result =
          await response.json();

        console.log(
          "📦 Create PayPal Order Response:",
          result,
        );

        if (!response.ok) {
          throw new Error(
            result.message ||
              "Failed to create PayPal order",
          );
        }

        const paypalOrderId =
          result.data
            ?.paypal_order_id ||
          result.paypal_order_id;

        const approvalUrl =
          result.data
            ?.approval_url ||
          result.approval_url;

        if (!paypalOrderId) {
          throw new Error(
            "PayPal order ID missing from response",
          );
        }

        if (!approvalUrl) {
          throw new Error(
            "PayPal approval URL missing from response",
          );
        }

        console.log(
          "✅ PayPal Order ID:",
          paypalOrderId,
        );

        console.log(
          "🔗 PayPal Approval URL:",
          approvalUrl,
        );

        setPaypalOrderId(
          paypalOrderId,
        );

        setApprovalUrl(
          approvalUrl,
        );

        /*
         * Open PayPal checkout
         * in a NEW TAB.
         */

        const paypalWindow =
          window.open(
            approvalUrl,
            "_blank",
            "noopener,noreferrer",
          );

        /*
         * Browser may block popup
         * in some situations.
         */

        if (!paypalWindow) {
          console.warn(
            "⚠️ PayPal popup was blocked.",
          );

          setError(
            "PayPal checkout was blocked by the browser. Please allow popups and try again.",
          );
        }
      } catch (error) {
        console.error(
          "❌ Create PayPal Order Error:",
          error,
        );

        setError(
          error.message ||
            "Failed to create PayPal order.",
        );
      } finally {
        setLoading(false);
      }
    };

  /*
   * ==================================================
   * UI
   * ==================================================
   */

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "50px auto",
        padding: "30px",
        background: "#fff",
        border: "1px solid #ddd",
        borderRadius: "10px",
      }}
    >
      <h2>
        PayPal Sandbox Test
      </h2>

      <p>
        <strong>
          Internal Order ID:
        </strong>{" "}
        {TEST_ORDER_ID}
      </p>

      <p>
        <strong>
          Environment:
        </strong>{" "}
        Sandbox
      </p>

      {/* ==========================================
          PAYPAL BUTTON
          ========================================== */}

      <button
        type="button"
        onClick={
          createPayPalOrder
        }
        disabled={loading}
        style={{
          width: "100%",
          padding: "14px",
          marginTop: "25px",
          background:
            "#0070ba",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          fontSize: "16px",
          fontWeight: "600",
          cursor: loading
            ? "not-allowed"
            : "pointer",
          opacity: loading
            ? 0.6
            : 1,
        }}
      >
        {loading
          ? "Processing..."
          : "Pay with PayPal"}
      </button>

      {/* ==========================================
          PAYPAL ORDER ID
          ========================================== */}

      {paypalOrderId && (
        <div
          style={{
            marginTop: "20px",
            padding: "12px",
            background:
              "#f5f5f5",
            borderRadius: "6px",
            wordBreak:
              "break-word",
          }}
        >
          <strong>
            PayPal Order ID:
          </strong>

          <div
            style={{
              marginTop: "5px",
            }}
          >
            {paypalOrderId}
          </div>
        </div>
      )}

      {/* ==========================================
          APPROVAL URL
          ========================================== */}

      {approvalUrl && (
        <div
          style={{
            marginTop: "20px",
            padding: "12px",
            background:
              "#f5f5f5",
            borderRadius: "6px",
            wordBreak:
              "break-word",
          }}
        >
          <strong>
            PayPal Approval URL:
          </strong>

          <div
            style={{
              marginTop: "8px",
            }}
          >
            <a
              href={approvalUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open PayPal Checkout
            </a>
          </div>
        </div>
      )}

      {/* ==========================================
          LOADING
          ========================================== */}

      {loading && (
        <div
          style={{
            marginTop: "20px",
          }}
        >
          Processing...
        </div>
      )}

      {/* ==========================================
          ERROR
          ========================================== */}

      {error && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            background:
              "#ffe5e5",
            color: "#b00000",
            borderRadius: "8px",
          }}
        >
          <strong>
            Error:
          </strong>{" "}
          {error}
        </div>
      )}

      {/* ==========================================
          CAPTURE RESPONSE
          ========================================== */}

      {captureResult && (
        <div
          style={{
            marginTop: "30px",
          }}
        >
          <h3>
            Capture Response
          </h3>

          <pre
            style={{
              padding: "15px",
              background:
                "#f5f5f5",
              borderRadius: "6px",
              overflow: "auto",
              whiteSpace:
                "pre-wrap",
            }}
          >
            {JSON.stringify(
              captureResult,
              null,
              2,
            )}
          </pre>

          <p>
            ✅ PayPal capture
            completed.
          </p>

          <p>
            Now check the
            backend logs for
            the PayPal webhook.
          </p>
        </div>
      )}
    </div>
  );
};

export default PayPalTest;