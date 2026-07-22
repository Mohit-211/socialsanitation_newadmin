import React from "react";
import "./Error401.css";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import AccessImage from "../../assets/access-denied-5627546-4694106.webp";

const Error401 = () => {
  const navigate = useNavigate();
  const navigateToDashboard = () => {
    navigate("/");
  };

  return (
    <div className="main_container">
      <img src={AccessImage} alt="Access Denied" className="error_image" />
      <div className="main_box">
        <div className="error_heading">
          You are not allowed to access this page
        </div>
        <p className="text-muted my-4">
          You have been denied access to this page. Please check your
          permissions.
        </p>
      </div>
      <div className="back_button">
        <Button
          label="Back To Dashboard"
          severity="info"
          style={{ borderRadius: "5px", height: "45px" }}
          onClick={navigateToDashboard}
        />
      </div>
    </div>
  );
};

export default Error401;
