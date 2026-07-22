import { Box } from "@mui/material";
import React from "react";
import { useState } from "react";
import Button from "@mui/material/Button";
import Form from "react-bootstrap/Form";
import { CreateRole } from "../../services/Api/Api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Card from "@mui/material/Card";

const AddRole = () => {
  const [name, setName] = useState("");
  const [abbreviation, setAbbreviation] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!name) {
      toast.error("Please enter name");
      return;
    }
    if (!abbreviation) {
      toast.error("Please enter abbreviation");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("abbreviation", abbreviation);

      const response = await CreateRole(formData);

      if (response.status === 200) {
        toast.success("Role added successfully");
      }
      navigate("/role-list");
    } catch (error) {
      if (error.response.status === 401) {
        toast.error("Token expired");
        localStorage.removeItem("adminToken");
        setTimeout(() => {
          navigate("/Login");
        }, 1000);
      } else {
        toast.error("Something went wrong");
      }
    }
  };

  const navigateToRole = () => {
    navigate("/role-list");
  };

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <h3 style={{ marginBottom: "50px" }}>Create New Role</h3>
      </Box>
      <Card>
        <div>
          <Form >
            <Form.Group className="mb-3">
              <Form.Label> Name</Form.Label>
              <Form.Control
                type="text"
                required
                placeholder="Enter role"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="new_form_control"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Abbreviation</Form.Label>
              <Form.Control
                type="abbreviation"
                placeholder="Enter abbreviation"
                value={abbreviation}
                required
                onChange={(e) => setAbbreviation(e.target.value)}
                className="new_form_control"
              />
            </Form.Group>

            <div>
              <Button
                icon="pi pi-check"
                severity="success"
                type="submit"
                onClick={handleSubmit}
                style={{
                  borderRadius: "10px",
                  marginLeft: "10px",
                  marginTop: "10px",
                  // width:"10px"
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
                style={{ borderRadius: "10px", marginLeft: "10px" }}
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

export default AddRole;
