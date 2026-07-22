import React from 'react';
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import AccessImage from "../../assets/64b5033f93d771001d187639.jpeg";

const AuthrizationFailure = () => {

    const navigate = useNavigate();

    const navigateToDashboard = () => {
      navigate("/Login");
    };
  return (

    <div className="main_container">
    <img src={AccessImage} alt="Access Denied" className="error_image" />
    <div className="main_box">
      {/* <div className="error_heading">
      Authorization failed. Please try to authorize your email with the calendar service again.
      </div> */}
      <p className="text-muted my-4">
      Authorization failed. Please try to authorize your email with the calendar service again.
      </p>
    </div>
    <div className="back_button">
      <Button
        label="Back To Login"
        severity="info"
        style={{ borderRadius: "5px", height: "45px" }}
        onClick={navigateToDashboard}
      />
    </div>
  </div>
  
  )
}

export default AuthrizationFailure