import { useState } from "react";
import { useNavigate } from "react-router";
import { CreateAdmin } from "@/services/api/adminApi";
import { Button, Divider, Input, message } from "antd";
import {
  ArrowLeft,
  UserPlus,
  X,
  User as UserIcon,
  Mail,
  Phone,
  Briefcase,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import "./BdmsPage.scss";

const AddBdmPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Validation
    if (!name || !email || !mobile) {
      message.error("All fields are required");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("role_id", 5);
      formData.append("mobile", mobile);

      const response = await CreateAdmin(formData);

      if (response.status === 201) {
        message.success("BDM created successfully");
        setTimeout(() => navigate("/bdm-list"), 1000);
      }
    } catch (error) {
      if (error.response?.status === 400) {
        message.error("This email is already registered");
      } else if (error.response?.status === 401) {
        message.error("Session expired. Please login again.");
        localStorage.removeItem("adminToken");
        navigate("/Login");
      } else {
        message.error("An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const navigateToAdmin = () => {
    navigate("/bdm-list");
  };

  return (
    <div>
      <PageHeader
        title="BDM MANAGEMENT"
        subtitle="Onboard a new Business Development Manager"
        actions={
          <Button
            size="large"
            icon={<ArrowLeft size={16} />}
            onClick={navigateToAdmin}
          >
            Return to BDM List
          </Button>
        }
      />

      <div className="surface bdm-form">
        {/* Section intro with icon badge — mirrors the "Client" summary
            treatment used in the reset-password modal elsewhere */}
        <div className="bdm-banner bdm-banner--lg">
          <span className="bdm-banner__icon">
            <Briefcase size={20} />
          </span>
          <div className="bdm-banner__body">
            <p className="bdm-banner__title">
              Business Development Manager Details
            </p>
            <p className="bdm-banner__text">
              This will create a new BDM account with access to assigned
              clients.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bdm-form__fields">
            <div>
              <label className="field-label" htmlFor="add-bdm-name">
                Full Name
              </label>
              <Input
                id="add-bdm-name"
                size="large"
                placeholder="e.g. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                prefix={<UserIcon size={16} className="text-subtle" />}
              />
            </div>

            <div className="bdm-form__grid">
              <div>
                <label className="field-label" htmlFor="add-bdm-email">
                  Email Address
                </label>
                <Input
                  id="add-bdm-email"
                  size="large"
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  prefix={<Mail size={16} className="text-subtle" />}
                />
              </div>

              <div>
                <label className="field-label" htmlFor="add-bdm-mobile">
                  Mobile Number
                </label>
                <Input
                  id="add-bdm-mobile"
                  size="large"
                  placeholder="+1 (555) 000-0000"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  prefix={<Phone size={16} className="text-subtle" />}
                />
              </div>
            </div>
          </div>

          <Divider style={{ margin: "28px 0 var(--space-5)" }} />

          {/* Action Buttons */}
          <div className="bdm-form__actions">
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              disabled={loading}
              icon={!loading ? <UserPlus size={16} /> : null}
            >
              {loading ? "Creating..." : "Create Account"}
            </Button>

            <Button
              size="large"
              icon={<X size={16} />}
              onClick={navigateToAdmin}
            >
              Discard
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBdmPage;
