import { useEffect, useState } from "react";
import { getSquarePayments } from "../utils/square";

const API_BASE_URL = "https://node.hashtagbillionaire.com/api/v1/payment";

const TEST_ORDER_ID = 5;

// TEMPORARY TEST TOKEN
// Replace this with your actual current token.
// Do NOT commit this token to source control.
const ACCESS_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImlhdCI6MTc4ODk1NTk5MywiZXhwIjoxNzg5NTYwNzkzLCJ0eXBlIjoiYWNjZXNzIiwicm9sZV9pZCI6Nn0.Lnk_OwVt1383wc_SMiaccHXLneyRaHgBvtq74Z4jq80";

const CashAppTest = () => {
  const [status, setStatus] = useState("Initializing...");
  const [paymentResponse, setPaymentResponse] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cashAppPay;

    const initializeCashApp = async () => {
      try {
        setStatus("Initializing Square...");

        // SQUARE

        const payments = await getSquarePayments();

        console.log("Square Payments initialized:", payments);

        // PAYMENT REQUEST

        const paymentRequest = payments.paymentRequest({
          countryCode: "US",
          currencyCode: "USD",
          total: {
            amount: "1.00",
            label: "Total",
          },
        });

        console.log("Payment request created:", paymentRequest);

        // CASH APP PAY

        cashAppPay = await payments.cashAppPay(paymentRequest, {
          redirectURL: window.location.href,
          referenceId: `cash-app-test-${TEST_ORDER_ID}`,
        });

        console.log("Cash App Pay instance created:", cashAppPay);

        // TOKENIZATION

        cashAppPay.addEventListener("ontokenization", async (event) => {
          try {
            console.log("Cash App tokenization event:", event.detail);

            const { tokenResult, error } = event.detail;

            // CASH APP ERROR

            if (error) {
              console.error("Cash App Pay error:", error);

              setStatus("Payment failed");
              setError(error.message || "Cash App payment failed.");

              return;
            }

            // TOKENIZATION STATUS

            console.log("Cash App tokenization status:", tokenResult?.status);

            if (tokenResult?.status !== "OK") {
              console.error("Cash App tokenization failed:", tokenResult);

              setStatus(
                `Tokenization failed: ${tokenResult?.status || "UNKNOWN"}`,
              );

              return;
            }

            // PAYMENT TOKEN

            const token = tokenResult.token;

            console.log("🔥 CASH APP PAYMENT TOKEN RECEIVED");

            // Don't display the actual token in UI.
            console.log("Token received successfully.");

            setStatus("Cash App approved. Creating payment...");

            // SEND TOKEN TO BACKEND

            const response = await fetch(
              `${API_BASE_URL}/square/create-payment`,
              {
                method: "POST",

                headers: {
                  "Content-Type": "application/json",
                  "x-access-token": ACCESS_TOKEN,
                },

                body: JSON.stringify({
                  sourceId: token,
                  order_id: TEST_ORDER_ID,
                  payment_mode: "CASH_APP",
                }),
              },
            );

            const data = await response.json();

            console.log("💰 SQUARE CASH APP PAYMENT RESPONSE:", data);

            // API ERROR

            if (!response.ok) {
              throw new Error(
                data?.message || "Failed to create Square payment.",
              );
            }

            // PAYMENT SUCCESS RESPONSE

            setPaymentResponse(data);
            setStatus("Payment request sent successfully.");

            // IMPORTANT

            /*
             * The Square webhook is responsible for
             * finalizing the order.
             *
             * So we DO NOT mark the order as SUCCESS
             * here.
             */

            console.log("✅ Square payment created.");

            console.log("⏳ Waiting for Square webhook...");
          } catch (error) {
            console.error("Cash App payment processing error:", error);

            setStatus("Payment failed");
            setError(error.message || "Unable to process Cash App payment.");
          }
        });

        // ATTACH BUTTON

        await cashAppPay.attach("#cash-app-pay");

        console.log("Cash App Pay button attached successfully");

        setStatus("Ready for payment");
      } catch (error) {
        console.error("Cash App Pay initialization failed:", error);

        setStatus("Cash App initialization failed");

        setError(error.message || "Unable to initialize Cash App Pay.");
      }
    };

    initializeCashApp();

    // CLEANUP

    return () => {
      if (cashAppPay) {
        cashAppPay.destroy().catch((error) => {
          console.error("Cash App Pay destroy failed:", error);
        });
      }
    };
  }, []);

  return (
    <div
      style={{
        padding: "40px",
        maxWidth: "600px",
      }}
    >
      <h2>Cash App Pay Test</h2>

      <p>
        <strong>Order ID:</strong> {TEST_ORDER_ID}
      </p>

      <p>
        <strong>Status:</strong> {status}
      </p>

      {/* CASH APP BUTTON */}

      <div
        id="cash-app-pay"
        style={{
          width: "300px",
          marginTop: "20px",
        }}
      />

      {/* ERROR */}

      {error && (
        <div
          style={{
            marginTop: "20px",
            padding: "12px",
            background: "#ffe5e5",
            color: "#b00020",
            borderRadius: "6px",
          }}
        >
          {error}
        </div>
      )}

      {/* PAYMENT RESPONSE */}

      {paymentResponse && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            background: "#e8f5e9",
            borderRadius: "6px",
          }}
        >
          <h3>Payment Created</h3>

          <pre>{JSON.stringify(paymentResponse, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default CashAppTest;
