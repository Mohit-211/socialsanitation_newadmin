import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { Button, Input, Select, Steps, message } from "antd";
import { ArrowLeft, Check, X, Mail, IdCard } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { ADMIN_ROLES, createAdmin } from "@/services/api/adminApi";
import { errorMessage } from "@/services/apiResult";
import "./admins.scss";

const AddAdminPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [role, setRole] = useState("");
  const [disable, setDisable] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      message.error("Enter a name");
      return;
    }
    if (!email.trim()) {
      message.error("Enter an email address");
      return;
    }
    if (!role) {
      message.error("Choose a role");
      return;
    }
    setDisable(true);
    try {
      await createAdmin({ name: name.trim(), email: email.trim(), role, mobile: mobile.trim() });
      message.success({
        content: `Admin added. Their sign-in details have been emailed to ${email.trim()}.`,
        duration: 4,
      });
      navigate("/adminList");
    } catch (error) {
      // Covers a duplicate email ("Email already in use") and a refusal.
      message.error(errorMessage(error, "Couldn't add the admin"));
    } finally {
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
                <label className="field-label" htmlFor="add-admin-mobile">
                  Mobile (optional)
                </label>
                <Input
                  id="add-admin-mobile"
                  size="large"
                  type="tel"
                  placeholder="Enter mobile number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
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
                  value={role || undefined}
                  onChange={(value) => setRole(value)}
                  options={ADMIN_ROLES}
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
                title: "Admin",
                status: "finish",
                icon: roleIcon,
                content:
                  "Runs day-to-day operations across the admin panel, excluding Estimates, the Calculator and BDM management, and can't delete records or manage admins.",
              },
              {
                title: "Business Development Manager",
                status: "finish",
                icon: roleIcon,
                content:
                  "BDMs are employees now: add them from Employees with the BDM role. They use the employee app, not this panel.",
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default AddAdminPage;
