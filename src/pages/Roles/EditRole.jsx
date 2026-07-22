import { Box } from "@mui/material";
import React, { useLayoutEffect } from "react";
import { Form } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import { GetRoleById, UpdateRoles } from "../../services/Api/Api.jsx";
import { toast } from "react-toastify";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";

const EditRole = () => {
  const { id } = useParams();
  const [idData, setIdData] = React.useState({});

  //get role By ID
  useLayoutEffect(() => {
    GetRoleById(id)
      .then((res) => {
        setIdData(res.data.data);
      })
      .catch((err) => {
        console.log(err, "error");
      });
  }, [id]);

  //update role api implementation
  const onChange = (e) => {
    setIdData({ ...idData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("role_id", id);
    formData.append("name", idData?.name ? idData?.name : "");
    formData.append(
      "abbreviation",
      idData?.abbreviation ? idData?.abbreviation : ""
    );

    UpdateRoles(formData)
      .then((res) => {
        if (res.status === 200) {
          toast.success("Role edited successfully!");
        }
        navigate("/role-list");
      })
      .catch((err) => {
        if (err.response && err.response.status === 401) {
          toast.error("Token expired!");
          localStorage.removeItem("adminToken");
          setTimeout(() => {
            navigate("/Login");
          }, 3000);
        } else {
          toast.error("Something went wrong");
        }
      });
  };

  const navigate = useNavigate();
  const navigateToRole = () => {
    navigate("/role-list");
  };
  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <h3 style={{ marginBottom: "60px" }}>Edit Role</h3>
      </Box>
      <Card>
        <div>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Role Name</Form.Label>
              <Form.Control
                type="text"
                defaultValue={idData?.name}
                name="name"
                onChange={(e) => onChange(e)}
                
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Abbreviation</Form.Label>
              <Form.Control
                type="text"
                defaultValue={idData?.abbreviation}
                name="abbreviation"
                onChange={(e) => onChange(e)}
                placeholder="Enter abbreviation"
              />
            </Form.Group>
          </Form>
          <div className="button">
            <Button
              icon="pi pi-check"
              severity="success"
              type="submit"
              onClick={handleSubmit}
              style={{
                borderRadius: "10px",
                marginLeft: "10px",
                marginTop: "10px",
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
        </div>
      </Card>
    </Box>
  );
};

export default EditRole;
