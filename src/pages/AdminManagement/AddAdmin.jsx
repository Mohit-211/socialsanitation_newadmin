import { useState } from "react";
import { CreateAdmin } from "../../services/Api/Api";
import { useNavigate } from "react-router";
import { Button, Input, Select, Steps, message } from "antd";
import { ArrowLeft, Check, X, Mail, IdCard } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import "./AdminManagement.scss";

const ROLE_OPTIONS = [
  { value: "5", label: "BDM" },
  { value: "3", label: "OPERATIONS ADMINISTRATOR" },
  { value: "1", label: "SUPER ADMIN" },
];

const AddAdmin = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [disable, setDisable] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setDisable(true);

    if (!name) {
      setDisable(false);
      message.error("Please enter name");

      return;
    }
    if (!email) {
      setDisable(false);
      message.error("Please enter email");
      return;
    }
    if (!roleId) {
      setDisable(false);
      message.error("Please choose any Role");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("role_id", parseInt(roleId, 10));

      const response = await CreateAdmin(formData);

      if (response.status === 201) {
        // confirm the credentials email was sent, and that the
        // admin can change their password anytime afterward.
        message.success({
          content: `Admin added successfully. Login credentials have been emailed to ${email}.`,
          duration: 4,
        });
      }
      setTimeout(() => {
        navigate("/adminList");
      }, 1500);
      setDisable(false);
    } catch (error) {
      if (error.response && error.response.status === 400) {
        message.error("Email already exists");
      } else if (error.response.status === 401) {
        message.error("Token expired");
        localStorage.removeItem("adminToken");
        setTimeout(() => {
          navigate("/Login");
        }, 1000);
      } else {
        message.error("Something went wrong");
      }
      setDisable(false);
    }
  };

  const navigateToAdmin = () => {
    navigate("/adminList");
  };

  const roleIcon = <IdCard size={20} color="var(--color-primary-strong)" />;

  return (
    <div>
      <PageHeader
        title="ADMIN MANAGEMENT"
        subtitle="Create a new admin"
        actions={
          <Button
            size="large"
            icon={<ArrowLeft size={16} />}
            onClick={navigateToAdmin}
          >
            Return to Admin
          </Button>
        }
      />

      <div className="admin-form__layout">
        <div className="surface admin-form__panel admin-form__main">
          {/* info banner explaining the credentials-by-email flow */}
          <div className="admin-banner admin-banner--top">
            <span className="admin-banner__icon">
              <Mail size={18} />
            </span>
            <div className="admin-banner__body">
              <p className="admin-banner__title">
                Credentials Sent Automatically
              </p>
              <p className="admin-banner__text">
                Once you save, a system-generated password will be emailed to
                the admin's address. They can log in with it right away and
                change it anytime from the Change Password page.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="admin-form__fields">
              <div>
                <label className="field-label" htmlFor="add-admin-name">
                  Name
                </label>
                <Input
                  id="add-admin-name"
                  size="large"
                  placeholder="Enter name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="field-label" htmlFor="add-admin-email">
                  Email
                </label>
                <Input
                  id="add-admin-email"
                  size="large"
                  type="email"
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="field-label" htmlFor="add-admin-role">
                  Select Role
                </label>
                <Select
                  id="add-admin-role"
                  size="large"
                  placeholder="Select Role"
                  value={roleId || undefined}
                  onChange={(value) => setRoleId(value)}
                  options={ROLE_OPTIONS}
                  style={{ width: "100%" }}
                />
              </div>

              <div className="admin-form__actions">
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  disabled={disable}
                  icon={!disable ? <Check size={16} /> : null}
                >
                  {disable ? "Saving..." : "Save"}
                </Button>

                <Button
                  size="large"
                  icon={<X size={16} />}
                  onClick={navigateToAdmin}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        </div>

        <div className="surface admin-form__panel admin-form__aside">
          <Steps
            orientation="vertical"
            size="small"
            items={[
              {
                title: "Super Admin",
                status: "finish",
                icon: roleIcon,
                content:
                  "This role grants extensive access and permissions across all features and pages of the admin panel",
              },
              {
                title: "Business Development Manager",
                status: "finish",
                icon: roleIcon,
                content:
                  "This role grants extensive access and permissions across the assigned user,employees and their asociated bookings.",
              },
              {
                title: "Operations Administrator",
                status: "finish",
                icon: roleIcon,
                content:
                  "This role has access to day-to-day operations across the admin panel, excluding Estimates, the Calculator, and BDM management.",
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default AddAdmin;
