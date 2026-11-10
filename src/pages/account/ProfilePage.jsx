import { useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "antd";
import { User, Mail, Phone, ShieldCheck, ArrowLeft } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { getProfile } from "@/services/api/authApi";
import { dataOf } from "@/services/apiResult";
import { updateSessionUser, useSession } from "@/lib/session";
import "@/pages/admins/admins.scss";

const ProfilePage = () => {
  const navigate = useNavigate();
  const idData = useSession()?.user ?? {};
  const roleNames = idData.roles?.map((role) => role.name).join(", ");

  // The session already knows who this is; refresh it in case it changed.
  useEffect(() => {
    getProfile()
      .then((res) => updateSessionUser(dataOf(res)))
      .catch(() => {});
  }, []);

  const navigateToAdmin = () => {
    navigate("/");
  };

  const fields = [
    { label: "Name", value: idData?.name, icon: User },
    { label: "Email", value: idData?.email, icon: Mail },
    { label: "Phone", value: idData?.mobile, icon: Phone },
    { label: "Role", value: roleNames, icon: ShieldCheck },
  ];

  return (
    <div>
      <PageHeader
        title="ADMIN PROFILE"
        subtitle="View your admin account details"
        actions={
          <Button
            size="large"
            icon={<ArrowLeft size={16} />}
            onClick={navigateToAdmin}
          >
            Return to Dashboard
          </Button>
        }
      />

      <div className="surface admin-form__panel">
        {/* Intro banner */}
        <div className="admin-banner">
          <span className="admin-banner__icon admin-banner__icon--avatar">
            {idData?.name?.charAt(0)?.toUpperCase() || "?"}
          </span>
          <div className="admin-banner__body">
            <p className="admin-banner__title admin-banner__title--lg">
              {idData?.name || "—"}
            </p>
            <p className="admin-banner__text">
              {roleNames || "Admin"}
            </p>
          </div>
        </div>

        {/* Fields */}
        <div className="admin-profile__fields">
          {fields.map(({ label, value, icon: Icon }) => (
            <div key={label}>
              <div className="admin-profile__label">{label}</div>
              <div className="admin-profile__value">
                <Icon size={16} className="text-subtle" />
                <span>{value || "--"}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
