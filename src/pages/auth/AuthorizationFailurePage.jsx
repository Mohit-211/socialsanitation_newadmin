import { Button } from "antd";
import { useNavigate } from "react-router";
import AccessImage from "@/assets/images/authorization-failed.jpeg";
import "@/pages/errors/statusPage.scss";

const AuthorizationFailurePage = () => {

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

export default AuthorizationFailurePage
