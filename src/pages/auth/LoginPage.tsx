import { useState } from "react";
import { useNavigate } from "react-router";
import { Button, Form, Input, message } from "antd";
import { signIn } from "@/services/api/authApi";
import { errorMessage } from "@/services/apiResult";
import { saveSession } from "@/lib/session";
import logo from "@/assets/images/logo-mark.png";
import "./LoginPage.scss";

const LoginPage = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  // The backend's message covers every refusal: a wrong email or password,
  // an account that signs in to one of the apps, and too many attempts.
  const onFinish = async ({ email, password }: { email: string; password: string }) => {
    setSubmitting(true);
    try {
      const res = await signIn({ email: email.trim(), password });
      saveSession(res.data.data);
      message.success("Signed in");
      navigate("/", { replace: true });
    } catch (error) {
      message.error(errorMessage(error, "Couldn't sign in. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

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
          onFinish={onFinish}
        >
          <Form.Item
            label="Email Address"
            name="email"
            rules={[
              { required: true, message: "Enter your email address" },
              { type: "email", message: "Enter a valid email address" },
            ]}
          >
            <Input size="large" autoComplete="username" />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            rules={[
              { required: true, message: "Enter your password" },
            ]}
          >
            <Input.Password size="large" autoComplete="current-password" />
          </Form.Item>
          <div className="login-page__submit">
            <Button type="primary" htmlType="submit" size="large" block loading={submitting}>
              SIGN IN
            </Button>
          </div>
        </Form>
      </div>
    </main>
  );
};

export default LoginPage;