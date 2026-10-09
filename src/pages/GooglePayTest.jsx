import { useEffect, useState } from "react";
import { getSquarePayments } from "../utils/square";

const API_BASE_URL =
  "https://node.hashtagbillionaire.com/api/v1/payment";

const TEST_ORDER_ID = 6;

// Use your actual access token here for testing.
// Do not commit this token to the project.
const ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImlhdCI6MTc4OTAyMDc2MywiZXhwIjoxNzg5NjI1NTYzLCJ0eXBlIjoiYWNjZXNzIiwicm9sZV9pZCI6Nn0.IqAlj-7T7qgbtlsXj8Ds7Y0W-zqy1sUBDyPjMn7A1vs";

const GooglePayTest = () => {
  const [status, setStatus] = useState("Initializing...");
  const [paymentResponse, setPaymentResponse] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let googlePay;

    const initializeGooglePay = async () => {
      try {
        setStatus("Initializing Square...");
        setError(null);

        // Initialize Square Payments
        const payments = await getSquarePayments();

        console.log("Square Payments initialized:", payments);

        // Create payment request
        const paymentRequest = payments.paymentRequest({
          countryCode: "US",
          currencyCode: "USD",
          total: {
            amount: "1.00",
            label: "Total",
          },
        });

        console.log(
          "Google Pay payment request created:",
          paymentRequest
        );

        // Initialize Google Pay
        googlePay = await payments.googlePay(paymentRequest);

        console.log(
          "Google Pay instance created:",
          googlePay
        );

        // Attach Google Pay button
        await googlePay.attach("#google-pay");

        console.log(
          "Google Pay button attached successfully"
        );

        setStatus("Ready for payment");

        // Get the Google Pay button container
        const googlePayButton =
          document.querySelector("#google-pay");

        if (!googlePayButton) {
          throw new Error(
            "Google Pay button element was not found."
          );
        }

        // Handle Google Pay button click
        googlePayButton.onclick = async () => {
          try {
            setStatus("Opening Google Pay...");
            setError(null);

            console.log("Google Pay button clicked");

            // Tokenize Google Pay payment
            const tokenResult =
              await googlePay.tokenize();

            console.log(
              "Google Pay tokenization result:",
              tokenResult
            );

            // Check tokenization result
            if (tokenResult.status !== "OK") {
              console.error(
                "Google Pay tokenization failed:",
                tokenResult
              );

              setStatus("Google Pay payment failed");

              setError(
                tokenResult.errors?.[0]?.message ||
                  "Google Pay tokenization failed."
              );

              return;
            }

            // Google Pay payment token
            const token = tokenResult.token;

            console.log(
              "🔥 GOOGLE PAY TOKEN RECEIVED:",
              token
            );

            setStatus(
              "Google Pay approved. Creating payment..."
            );

            // Send token to existing Square backend
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
                  payment_mode: "GOOGLE_PAY",
                }),
              }
            );

            const data = await response.json();

            console.log(
              "🔥 GOOGLE PAY CREATE PAYMENT RESPONSE:",
              data
            );

            if (!response.ok) {
              throw new Error(
                data?.message ||
                  "Failed to create Google Pay payment."
              );
            }

            setPaymentResponse(data);

            setStatus(
              "Google Pay payment request sent successfully."
            );
          } catch (error) {
            console.error(
              "🚨 Google Pay payment error:",
              error
            );

            setStatus("Google Pay payment failed");

            setError(
              error.message ||
                "Unable to process Google Pay payment."
            );
          }
        };
      } catch (error) {
        console.error(
          "🚨 Google Pay initialization failed:",
          error
        );

        setStatus("Google Pay initialization failed");

        setError(
          error.message ||
            "Unable to initialize Google Pay."
        );
      }
    };

    initializeGooglePay();

    // Cleanup
    return () => {
      if (googlePay) {
        googlePay
          .destroy()
          .catch((error) => {
            console.error(
              "Google Pay destroy failed:",
              error
            );
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
      <h2>Google Pay Test</h2>

      <p>
        <strong>Order ID:</strong> {TEST_ORDER_ID}
      </p>

      <p>
        <strong>Status:</strong> {status}
      </p>

      {/* Google Pay button */}
      <div
        id="google-pay"
        style={{
          width: "300px",
          marginTop: "20px",
        }}
      />

      {/* Error */}
      {error && (
        <div
          style={{
            marginTop: "20px",
            padding: "12px",
            background: "#ffe5e5",
            color: "#c00",
            borderRadius: "6px",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Backend response */}
      {paymentResponse && (
        <div
          style={{
            marginTop: "20px",
          }}
        >
          <h3>Payment Created</h3>

          <pre
            style={{
              background: "#f5f5f5",
              padding: "15px",
              borderRadius: "6px",
              overflow: "auto",
            }}
          >
            {JSON.stringify(
              paymentResponse,
              null,
              2
            )}
          </pre>
        </div>
      )}
    </div>
  );
};

export default GooglePayTest;