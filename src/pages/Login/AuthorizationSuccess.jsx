import { useEffect } from 'react';
import { Button } from "antd";
import { useNavigate, useParams } from "react-router";
import { GetValidateToken } from '../../services/Api/Api';
import AccessImage from "../../assets/7641727.png";
import "../ErrorPages/Error401.css";

const AuthorizationSuccess = () => {
  const navigate = useNavigate();
  const {token} = useParams();

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

		} catch (e) {
			console.error(e);
		}
	};
	useEffect(() => {
		getData();
	}, []);

  return (
    <main className="status-page">
      <img
        src={AccessImage}
        alt="Access Denied"
        className="status-page__image"
        style={{ height: "20vh" }}
      />
      <p className="status-page__text">
        Congratulations 😉 Your account has been activated. Please wait until we redirect....
      </p>
      <Button type="primary" size="large" onClick={navigateToDashboard}>
        Back To Login
      </Button>
    </main>
  )
}

export default AuthorizationSuccess
