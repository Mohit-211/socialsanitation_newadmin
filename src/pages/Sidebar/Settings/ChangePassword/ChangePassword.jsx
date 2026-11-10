import { useState } from "react";
import { useNavigate } from "react-router";
import { ChangeAdminPassword } from "@/services/Api/Api";
import { Button, Input, message } from "antd";
import { Eye, EyeOff, Check, X, KeyRound, CircleCheck, Circle } from "lucide-react";
import PageHeader from "../../../../components/PageHeader";
import "./ChangePassword.scss";

// Eye-off while the password is shown, eye while it is hidden
const renderVisibilityIcon = (visible) =>
  visible ? <EyeOff size={16} /> : <Eye size={16} />;

const ChangePassword = () => {
  const navigate = useNavigate();
  const navigateToDashboard = () => {
    navigate("/");
  };

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  // live password requirement checks — purely visual guidance,
  // doesn't block submission (backend remains source of truth for rules).
  const requirements = [
    { label: "At least 8 characters", met: newPassword.length >= 8 },
    { label: "One uppercase letter", met: /[A-Z]/.test(newPassword) },
    { label: "One number", met: /\d/.test(newPassword) },
    {
      label: "One special character",
      met: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    },
  ];

  const passwordsMatch =
    confirmPassword.length > 0 && newPassword === confirmPassword;
  const passwordsMismatch =
    confirmPassword.length > 0 && newPassword !== confirmPassword;

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (
      oldPassword?.length === 0 ||
      newPassword?.length === 0 ||
      confirmPassword?.length === 0
    ) {
      message.error("Please enter valid input");
      return;
    }

    if (newPassword !== confirmPassword) {
      message.error("New Password and Confirm Password do not match");
      return;
    }

    const formData = new FormData();
    formData.append("old_password", oldPassword);
    formData.append("new_password", newPassword);
    formData.append("confirm_password", confirmPassword);

    setSaving(true);
    try {
      const res = await ChangeAdminPassword(formData);
      if (res?.status === 200) {
        message.success("Password changed!");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        message.error(res?.data?.message);
      }
    } catch (error) {
      message.error(error?.response?.data?.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Header Section */}
      <PageHeader title="CHANGE PASSWORD" subtitle="Update your account password" />

      <div className="surface change-password__panel">
        {/* Intro banner */}
        <div className="change-password__banner">
          <span className="change-password__banner-icon">
            <KeyRound size={18} />
          </span>
          <div>
            <p className="change-password__banner-title">Update Your Password</p>
            <p className="change-password__banner-text">
              Choose a strong password you haven't used before.
            </p>
          </div>
        </div>

        <form onSubmit={handleChangePassword}>
          <div className="change-password__fields">
            <div>
              <label className="field-label" htmlFor="current-password">
                Current Password
              </label>
              <Input.Password
                id="current-password"
                size="large"
                required
                placeholder="Enter current password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                visibilityToggle={{
                  visible: showCurrentPassword,
                  onVisibleChange: setShowCurrentPassword,
                }}
                iconRender={renderVisibilityIcon}
              />
            </div>

            <div>
              <label className="field-label" htmlFor="new-password">
                New Password
              </label>
              <Input.Password
                id="new-password"
                size="large"
                required
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                visibilityToggle={{
                  visible: showNewPassword,
                  onVisibleChange: setShowNewPassword,
                }}
                iconRender={renderVisibilityIcon}
              />

              {/* live requirement checklist */}
              {newPassword.length > 0 && (
                <div className="change-password__requirements">
                  {requirements.map((req) => (
                    <div
                      key={req.label}
                      className={`change-password__hint${
                        req.met ? " change-password__hint--met" : ""
                      }`}
                    >
                      {req.met ? <CircleCheck size={14} /> : <Circle size={14} />}
                      <span>{req.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="field-label" htmlFor="confirm-password">
                Confirm Password
              </label>
              <Input.Password
                id="confirm-password"
                size="large"
                required
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                status={passwordsMismatch ? "error" : undefined}
                visibilityToggle={{
                  visible: showConfirmPassword,
                  onVisibleChange: setShowConfirmPassword,
                }}
                iconRender={renderVisibilityIcon}
              />

              {/* live match indicator */}
              {confirmPassword.length > 0 && (
                <div
                  className={`change-password__hint change-password__match ${
                    passwordsMatch
                      ? "change-password__hint--met"
                      : "change-password__hint--error"
                  }`}
                >
                  {passwordsMatch ? (
                    <>
                      <CircleCheck size={14} />
                      <span>Passwords match</span>
                    </>
                  ) : (
                    <>
                      <Circle size={14} />
                      <span>Passwords do not match</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="change-password__actions">
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                disabled={saving}
                icon={!saving ? <Check size={16} /> : null}
              >
                {saving ? "Saving..." : "Save"}
              </Button>

              <Button
                size="large"
                icon={<X size={16} />}
                onClick={navigateToDashboard}
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;