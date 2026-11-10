import { useLayoutEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { GetAdminById, UpdateAdmin } from "@/services/api/adminApi";
import { Button, Divider, Input, message } from "antd";
import {
  ArrowLeft,
  Save,
  X,
  User as UserIcon,
  Phone,
  Mail,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import "./BdmsPage.scss";

const EditBdmPage = () => {
  const { id } = useParams();
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch BDM Data
  useLayoutEffect(() => {
    GetAdminById(id)
      .then((res) => {
        setData(res.data.data);
      })
      .catch((err) => {
        console.error(err);
        message.error("Failed to load BDM details");
      });
  }, [id]);

  const handleChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("admin_id", id);
      formData.append("name", data.name || "");
      formData.append("mobile", data.mobile || "");
      formData.append("role_id", "5");

      const res = await UpdateAdmin(formData);

      if (res.status === 200) {
        message.success("BDM details updated successfully");
        navigate("/bdm-list");
      }
    } catch {
      message.error("Something went wrong while saving");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="BDM MANAGEMENT"
        subtitle="Modify account information and contact details"
        actions={
          <Button
            size="large"
            icon={<ArrowLeft size={16} />}
            onClick={() => navigate("/bdm-list")}
          >
            Return to BDM List
          </Button>
        }
      />

      <div className="surface bdm-form">
        {/* Intro banner */}
        <div className="bdm-banner">
          <span className="bdm-banner__icon">
            <UserCog size={18} />
          </span>
          <div className="bdm-banner__body">
            <p className="bdm-banner__title">
              Editing: {data?.name || "BDM Profile"}
            </p>
            <p className="bdm-banner__text">
              Name and mobile number can be updated below. Email and role are
              locked.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bdm-form__columns">
            {/* Editable fields */}
            <div>
              <h3 className="bdm-form__section-label">General Information</h3>

              <div className="bdm-form__field">
                <label className="field-label" htmlFor="edit-bdm-name">
                  Full Name
                </label>
                <Input
                  id="edit-bdm-name"
                  size="large"
                  name="name"
                  value={data?.name || ""}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  prefix={<UserIcon size={16} className="text-subtle" />}
                />
              </div>

              <div className="bdm-form__field">
                <label className="field-label" htmlFor="edit-bdm-mobile">
                  Mobile Number
                </label>
                <Input
                  id="edit-bdm-mobile"
                  size="large"
                  name="mobile"
                  value={data?.mobile || ""}
                  onChange={handleChange}
                  placeholder="Enter mobile number"
                  prefix={<Phone size={16} className="text-subtle" />}
                />
              </div>
            </div>

            {/* Locked fields */}
            <div>
              <h3 className="bdm-form__section-label">Account Details</h3>

              <div className="bdm-form__field">
                <label
                  className="field-label text-subtle"
                  htmlFor="edit-bdm-email"
                >
                  Email Address
                </label>
                <Input
                  id="edit-bdm-email"
                  size="large"
                  value={data?.email || ""}
                  disabled
                  prefix={<Mail size={16} className="text-subtle" />}
                />
              </div>

              <div className="bdm-form__field">
                <label
                  className="field-label text-subtle"
                  htmlFor="edit-bdm-role"
                >
                  Role
                </label>
                <Input
                  id="edit-bdm-role"
                  size="large"
                  value="Business Development Manager"
                  disabled
                  prefix={<ShieldCheck size={16} className="text-subtle" />}
                />
              </div>
            </div>
          </div>

          <Divider style={{ margin: "var(--space-5) 0 var(--space-4)" }} />

          {/* Action Buttons */}
          <div className="bdm-form__actions bdm-form__actions--end">
            <Button
              size="large"
              icon={<X size={16} />}
              onClick={() => navigate("/bdm-list")}
            >
              Cancel
            </Button>

            <Button
              type="primary"
              htmlType="submit"
              size="large"
              className="bdm-form__save"
              disabled={loading}
              icon={!loading ? <Save size={16} /> : null}
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBdmPage;
