import React, { useEffect, useState } from 'react';
import Button from "@mui/material/Button";
import { useNavigate, useParams } from "react-router-dom";
import { GetValidateToken } from '../../services/Api/Api';
import AccessImage from "../../assets/7641727.png";

const AuthorizationSuccess = () => {
  const [data,setData] = useState()
  const navigate = useNavigate();
  const {token} = useParams();
  console.log(token,data,"token")


  const navigateToDashboard = () => {
    navigate("/");
  };

  const getData = async () => {
		try {

			let result = await GetValidateToken(localStorage.getItem("adminToken"));
      if(token === result.data.data){
        localStorage.setItem("authorize", true);
        navigate("/");
      }
      else{
        localStorage.removeItem("adminToken");
        localStorage.removeItem("authorize");
      }
			// setData(result.data.data);

		} catch (e) {
			console.log(e);
		}
	};
	useEffect(() => {
		getData();
	}, []);

  return (
    <div className="main_container">
    <img src={AccessImage} alt="Access Denied" className="error_image" style={{height:"20%"}} />
    <div className="main_box">
      {/* <div className="error_heading">
      Authorization failed. Please try to authorize your email with the calendar service again.
      </div> */}
      <p className="text-muted my-4">
      Congratulations 😉 Your account has been activated. Please wait until we redirect....
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

export default AuthorizationSuccess