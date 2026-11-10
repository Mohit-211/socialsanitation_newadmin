import { Button } from "antd";
import { useNavigate } from "react-router";
import AccessImage from "../../assets/64b5033f93d771001d187639.jpeg";
import "../ErrorPages/Error401.css";

const AuthrizationFailure = () => {

    const navigate = useNavigate();

    const navigateToDashboard = () => {
      navigate("/Login");
    };
  return (

    <main className="status-page">
      <img src={AccessImage} alt="Access Denied" className="status-page__image" />
      <p className="status-page__text">
        Authorization failed. Please try to authorize your email with the calendar service again.
      </p>
      <Button type="primary" size="large" onClick={navigateToDashboard}>
        Back To Login
      </Button>
    </main>

  )
}

export default AuthrizationFailure
