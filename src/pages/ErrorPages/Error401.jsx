import "./Error401.css";
import { Button } from "antd";
import { useNavigate } from "react-router";
import AccessImage from "../../assets/access-denied-5627546-4694106.webp";

const Error401 = () => {
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

export default Error401;
