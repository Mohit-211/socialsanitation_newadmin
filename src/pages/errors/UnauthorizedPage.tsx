import "./statusPage.scss";
import { Button } from "antd";
import { useNavigate } from "react-router";
import AccessImage from "@/assets/images/access-denied.webp";

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const navigateToDashboard = () => {
    navigate("/");
  };

  return (
    <main className="status-page">
      <img src={AccessImage} alt="Access Denied" className="status-page__image" />
      <div>
        <h1 className="status-page__title">
          You are not allowed to access this page
        </h1>
        <p className="status-page__text">
          You have been denied access to this page. Please check your
          permissions.
        </p>
      </div>
      <Button type="primary" size="large" onClick={navigateToDashboard}>
        Back To Dashboard
      </Button>
    </main>
  );
};

export default UnauthorizedPage;
