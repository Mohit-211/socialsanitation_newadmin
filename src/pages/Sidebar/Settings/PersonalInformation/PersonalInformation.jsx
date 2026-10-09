import { Box } from "@mui/material";
import React from "react";
import { Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { GetAdminProfile } from "@/services/Api/Api.jsx";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import { useEffect } from "react";

const ViewAdmin = () => {
  const [idData, setIdData] = React.useState({});

  //get admin profile
  const getData = async () => {
    try {
      let result = await GetAdminProfile(localStorage.getItem("adminToken"));
      setIdData(result.data.data);
    } catch (e) {
      console.error(e);
    }
  };
  useEffect(() => {
    getData();
  }, []);

  const navigate = useNavigate();
  const navigateToAdmin = () => {
    navigate("/adminList");
  };
  return (
    <Box sx={{ m: "20px" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: { xs: "wrap", md: "nowrap" }, rowGap: 1.5, alignItems: "center" }}>
        <h3 style={{ marginBottom: "60px" }}>Admin Profile</h3>
      </Box>
      <Card>
        <div>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                defaultValue={idData?.name}
                name="name"
                disabled
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="text"
                defaultValue={idData?.email}
                name="abbreviation"
                disabled
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Control
                type="text"
                defaultValue={idData?.admin_role?.name || ""}
                name="abbreviation"
                disabled
              />
            </Form.Group>
          </Form>
          <div className="button">
            <Button
              severity="secondary"
              onClick={() => {
                navigateToAdmin();
              }}
              style={{ borderRadius: "10px", marginLeft: "10px" }}
            >
              Return to Dashboard
            </Button>
          </div>
        </div>
      </Card>
    </Box>
  );
};

export default ViewAdmin;
