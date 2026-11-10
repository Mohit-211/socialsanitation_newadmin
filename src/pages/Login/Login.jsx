import { AdminLogin } from "../../services/Api/Api";
import "./Login.scss";
import { useNavigate } from "react-router";
import { Button, Form, Input, message } from "antd";
import logo from "../../assets/logo-mark.png";

const Login = () => {
  const navigate = useNavigate();

  const onFinish = (values) => {
    let formData = {
      email: values.email,
      password: values.password,
    };
    AdminLogin(formData)
      .then((res) => {
        message.success("Logged In Successfully");
        setTimeout(() => {
          const token = res?.data?.data?.token;
          const adminId = res?.data?.data?.id;
          const roleId = res?.data?.data?.role_id;
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminId");
          localStorage.removeItem("roleId");
          localStorage.setItem("adminToken", token);
          localStorage.setItem("adminId", adminId);
          localStorage.setItem("roleId", roleId);
          navigate("/");
        }, 1000);
      })
      .catch((error) => {
        if (error.response?.data?.message === "Error: User not found.") {
          message.error("Email Doesn't Exist");
        } else if (
          error.response?.data?.message ===
          "Error: Invalid email or password. Please try again."
        ) {
          message.error("Invalid Password");
        } else if (
          error.response?.data?.message ===
          "Please Enter Required Fields : [ email_id || password ]"
        ) {
          message.error("Please enter Required Fields");
        } else {
          message.error("Something went wrong. Please try again.");
        }
      });
  };

  const onFinishFailed = () => {};

  return (
    <main className="login-page">
      <div className="login-page__card">
        <div className="login-page__logo">
          <img src={logo} alt="Logo" />
        </div>
        <div className="login-page__intro">
          <h1 className="login-page__title">Hi, Welcome Back</h1>
          <p className="login-page__subtitle">
            Enter Your Credentials To continue
          </p>
        </div>

        <Form
          name="basic"
          layout="vertical"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
        >
          <Form.Item
            label="Email Address"
            name="email"
            rules={[
              { required: true, message: "Please enter your EmailId" },
            ]}
          >
            <Input size="large" />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            rules={[
              { required: true, message: "Please enter your Password" },
            ]}
          >
            <Input.Password size="large" />
          </Form.Item>
          <div className="login-page__submit">
            <Button type="primary" htmlType="submit" size="large" block>
              SIGN IN
            </Button>
          </div>
        </Form>
      </div>
    </main>
  );
};

export default Login;