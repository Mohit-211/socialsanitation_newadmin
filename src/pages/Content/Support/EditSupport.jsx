import { Box } from "@mui/material";
import React, { useLayoutEffect } from "react";
import { Form } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import {
  GetContactUsById,
  UpdateContactUs,
} from "../../../services/Api/ContentApi";
import { message } from "antd";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import { Select } from "antd";

const EditSupport = () => {
  const { id } = useParams();
  const [idData, setIdData] = React.useState("");

  //get role By ID
  useLayoutEffect(() => {
    GetContactUsById(id)
      .then((res) => {
        setIdData(res.data.data);
      })
      .catch((err) => {
        console.log(err, "error");
      });
  }, [id]);

  //update role api implementation
  const handleNameChange = (e) => {
    console.log("Selected value:", e.target.value);
    setIdData({ ...idData, [e.target?.name]: e.target?.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("address", idData?.address ? idData?.address : "");
    formData.append("email", idData?.email ? idData?.email : "");
    formData.append(
      "contact_number",
      idData?.contact_number ? idData?.contact_number : ""
    );
    console.log("formData", formData);
    UpdateContactUs(id, formData)
      .then((res) => {
        if (res.status === 200) {
          message.success("Data updated successfully!");
        }
        navigate("/support");
      })
      .catch((err) => {
        if (err.response && err.response.status === 401) {
          message.error("Token expired!");
          localStorage.removeItem("adminToken");
          setTimeout(() => {
            navigate("/Login");
          }, 3000);
        } else {
          message.error("Something went wrong");
        }
      });
  };

  const navigate = useNavigate();
  const navigateToRole = () => {
    navigate("/support");
  };
  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <h3 style={{ marginBottom: "60px" }}>Edit Contact Us</h3>
      </Box>
      <Card>
        <div>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="text"
                defaultValue={idData?.email}
                name="email"
                onChange={(e) => handleNameChange(e)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Adderess</Form.Label>
              <Form.Control
                type="text"
                defaultValue={idData?.address}
                name="address"
                onChange={(e) => handleNameChange(e)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Contact Number</Form.Label>
              <Form.Control
                type="text"
                defaultValue={idData?.contact_number}
                name="contact_number"
                onChange={(e) => handleNameChange(e)}
              />
            </Form.Group>
          </Form>
          <div className="button">
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
                navigateToRole();
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
        </div>
      </Card>
    </Box>
  );
};

export default EditSupport;
