import { Box } from "@mui/material";
import React, { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";

import { useNavigate } from "react-router-dom";
import { GetAllRoles, DeleteRole } from "../../services/Api/Api";
import { toast } from "react-toastify";
import Button from "@mui/material/Button";

const RoleList = () => {
  const navigate = useNavigate();
  const [pageSize, setPageSize] = useState(50);
  const [dataGridHeight, setDataGridHeight] = useState("550px");
  const [roleData, setRoleData] = useState([]);
  const [anchorEl, setAnchorEl] = React.useState();
  const [userId, setUserId] = useState();
  const [userIdToNavigate, setUserIdToNavigate] = useState();

  const handleClick = (event, value) => {
    setUserIdToNavigate(value);
    setAnchorEl(event.currentTarget);
  };

  //get all specialist
  const getData = async () => {
    try {
      let result = await GetAllRoles(localStorage.getItem("adminToken"));
      setRoleData(result.data.data);
      console.log("roles",result.data.data)
    } catch (e) {
      console.log(e);
    }
  };
  useEffect(() => {
    getData();
  }, []);

  //delete role
  const removeRole = async (e, role_id) => {
    const confirmed = window.confirm(
      "Do you really want to delete this mentor?"
    );
    if (!confirmed) return;

    try {
      const result = await DeleteRole(
        role_id,
        localStorage.getItem("adminToken")
      );

      toast.success("Role deleted successfully!", {
        position: "top-right",
        autoClose: 500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      window.location.reload(true);
      setTimeout(() => {
        navigate("/role-list");
      }, 3000);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        toast.error("Token expired", {
          position: "top-right",
          autoClose: 500,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
      }
      localStorage.removeItem("adminToken");
      setTimeout(() => {
        navigate("/Login");
      }, 3000);
    }
  };

  const navigateToAddRole = () => {
    navigate("/addRole");
  };
  const navigateToEditRole = (event, id) => {
    navigate(`/editRole/${id}`);
  };

  const columns = [
    { field: "id", headerName: "ID", width: 150 },
    {
      field: "name",
      headerName: "Role Name",
      width: 350,
      headerClassName: "custom-header",
      cellClassName: "custom-cell",
      flex: 1,
    },
    {
      field: "abbreviation",
      headerName: "Abbreviation",
      width: 350,
      headerClassName: "custom-header",
      cellClassName: "custom-cell",
      flex: 1,
    },

    // {
    //   field: "action",
    //   headerName: "Actions",
    //   headerClassName: "custom-header",
    //   cellClassName: "custom-cell",
    //   width: "350",
    //   flex: 1,
    //   renderCell: (cellValues) => {
    //     return (
    //       <div>
    //         <Button
    //           icon="pi pi-pencil"
    //           rounded
    //           outlined
    //           className="mr-2"
    //           style={{ margin: "0px 10px" }}
    //           onClick={(event) => navigateToEditRole(event, cellValues.id)}
    //         />
    //         <Button
    //           icon="pi pi-trash"
    //           rounded
    //           outlined
    //           severity="danger"
    //           onClick={(e) => removeRole(e, cellValues.id)}
    //         />
    //       </div>
    //     );
    //   },
    // },
  ];

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <h3>Role List</h3>
        {/* <Box>
          <Button
            label=" Add New Role"
            icon="pi pi-plus"
            severity="success"
            onClick={navigateToAddRole}
            style={{ margin: "0px 10px" }}
          />
        </Box> */}
      </Box>
      <div
        style={{
          height: dataGridHeight,
          width: "100%",
          marginTop: "20px",
        }}
      >
        <DataGrid
          rows={roleData}
          columns={columns}
          pageSize={pageSize}
          rowHeight={80}
          onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
          rowsPerPageOptions={[50, 75, 100]}
          experimentalFeatures={{ newEditingApi: true }}
          onSelectionModelChange={(id) => {
            const selectedIDs = new Set([id]);
            const selectedRowData = roleData.filter((row) =>
              selectedIDs.has(row.id.toString())
            );
            setUserId(selectedIDs);
          }}
        />
      </div>
    </Box>
  );
};

export default RoleList;
