/** @format */

import React from "react";
import { Result, Button } from "antd";
import { useNavigate, useLocation } from "react-router-dom";

const DocuSignSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const event = params.get("event");

  let status = "info";
  let title = "Signing Status";
  let subTitle = "Please review the document status.";

  if (event === "signing_complete") {
    status = "success";
    title = "Document Signed Successfully!";
    subTitle =
      "Thank you for signing the Service Estimate. The document has been securely recorded.";
  }

  if (event === "cancel") {
    status = "warning";
    title = "Signing Cancelled";
    subTitle = "You cancelled the signing process.";
  }

  if (event === "decline") {
    status = "error";
    title = "Document Declined";
    subTitle = "The document was declined and was not signed.";
  }

  if (event === "session_timeout") {
    status = "warning";
    title = "Session Timed Out";
    subTitle = "Your signing session expired. Please try again.";
  }

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f5f5f5",
      }}
    >
      <Result
        status={status}
        title={title}
        subTitle={subTitle}
        extra={[
          <Button
            type="primary"
            key="dashboard"
            onClick={() => navigate("/pdf-generation")}
          >
            View All Documents
          </Button>,
          <Button key="home" onClick={() => navigate("/")}>
            Go to Dashboard
          </Button>,
        ]}
      />
    </div>
  );
};

export default DocuSignSuccess;