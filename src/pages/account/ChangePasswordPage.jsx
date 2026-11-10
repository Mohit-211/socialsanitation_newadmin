import { useState } from "react";
import { useNavigate } from "react-router";
import { Button, Input, message } from "antd";
import { changePassword } from "@/services/api/authApi";
import { errorMessage } from "@/services/apiResult";
import { clearSession } from "@/lib/session";
import { Eye, EyeOff, Check, X, KeyRound, CircleCheck, Circle } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import "./ChangePasswordPage.scss";

// Eye-off while the password is shown, eye while it is hidden
const renderVisibilityIcon = (visible) =>
  visible ? <EyeOff size={16} /> : <Eye size={16} />;

const ChangePasswordPage = () => {
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

  // The server's rule: 8 to 100 characters, at least 2 digits, no spaces.
  const requirements = [
    {
      label: "8 to 100 characters",
      met: newPassword.length >= 8 && newPassword.length <= 100,
    },
    { label: "At least 2 numbers", met: (newPassword.match(/\d/g) || []).length >= 2 },
    { label: "No spaces", met: newPassword.length > 0 && !/\s/.test(newPassword) },
  ];
  const meetsRule = requirements.every((requirement) => requirement.met);

  const passwordsMatch =
    confirmPassword.length > 0 && newPassword === confirmPassword;
  const passwordsMismatch =
    confirmPassword.length > 0 && newPassword !== confirmPassword;

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!oldPassword || !newPassword || !confirmPassword) {
      message.error("Fill in all three passwords");
      return;
    }
    if (!meetsRule) {
      message.error("The new password needs 8 to 100 characters, at least 2 numbers and no spaces");
      return;
    }
    if (newPassword !== confirmPassword) {
      message.error("The new passwords don't match");
      return;
    }

    setSaving(true);
    try {
      await changePassword({
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      // A new password ends every session, this one included.
      clearSession();
      message.success("Password changed. Sign in again with your new password.");
      navigate("/Login", { replace: true });
    } catch (error) {
      message.error(errorMessage(error, "Couldn't change the password"));
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

export default ChangePasswordPage;