import { Box } from "@mui/material";
import { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";

import { GetAllRoles } from "../../services/Api/Api";

const RoleList = () => {
  const [pageSize, setPageSize] = useState(50);
  const [dataGridHeight] = useState("550px");
  const [roleData, setRoleData] = useState([]);

  //get all specialist
  const getData = async () => {
    try {
      let result = await GetAllRoles(localStorage.getItem("adminToken"));
      setRoleData(result.data.data);
    } catch (e) {
      console.error(e);
    }
  };
  useEffect(() => {
    getData();
  }, []);

  //delete role

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

  ];

  return (
    <Box sx={{ m: "20px" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: { xs: "wrap", md: "nowrap" }, rowGap: 1.5, alignItems: "center" }}>
        <h3>Role List</h3>
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
        />
      </div>
    </Box>
  );
};

export default RoleList;
