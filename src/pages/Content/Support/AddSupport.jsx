import { Box } from "@mui/material";
import React from "react";
import { useState } from "react";
import Button from "@mui/material/Button";
import Form from "react-bootstrap/Form";
import { CreateContactUs } from "../../../services/Api/ContentApi";
import { useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import Card from "@mui/material/Card";
import { message } from "antd";

const AddSupport = () => {
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [disable, setDisable] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setDisable(true);

    if (!address) {
      setDisable(false);
      message.error("Please enter address");

      return;
    }
    if (!email) {
      setDisable(false);
      message.error("Please enter email");
      return;
    }
    if (!contactNumber) {
      setDisable(false);
      message.error("Please enter number");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("address", address);
      formData.append("email", email);
      formData.append("contact_number", contactNumber);

      const response = await CreateContactUs(formData);

      if (response.status === 201) {
        message.success("Data added successfully");
      }
      setTimeout(() => {
        navigate("/support");
      }, 1000);
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
    navigate("/support");
  };

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <h3 style={{ marginBottom: "50px" }}>Create Contact Us</h3>
      </Box>
      <Card>
        <div>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Email Address:</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter email"
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
                className="new_form_control"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Address:</Form.Label>
              <Form.Control
                type="text"
                required
                placeholder="Enter address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="new_form_control"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Contact Number:</Form.Label>
              <Form.Control
                type="text"
                required
                placeholder="Enter contact number"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                className="new_form_control"
              />
            </Form.Group>

            <div>
              <Button
                icon="pi pi-check"
                severity="success"
                htmlType="submit"
                type="primary"
                onClick={handleSubmit}
                style={{
                  borderRadius: "5px",
                  margin: "0px 0px",
                  height: "40px",
                }}
              >
                Save
              </Button>

              <Button
                icon="pi pi-times"
                severity="secondary"
                onClick={(e) => {
                  navigateToAdmin();
                }}
                style={{
                  borderRadius: "5px",
                  marginLeft: "10px",
                  height: "40px",
                }}
              >
                Cancel
              </Button>
            </div>
          </Form>
        </div>
      </Card>
    </Box>
  );
};

export default AddSupport;
