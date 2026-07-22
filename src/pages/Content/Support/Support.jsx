import { Box } from "@mui/material";
import React, { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import { GetContactUs, DeleteContactUs } from "../../../services/Api/ContentApi";
import Button from "@mui/material/Button";
import Alert from "../../Customer/Alert";
import { message } from "antd";

const Support = () => {
  const navigate = useNavigate();
  const [pageSize, setPageSize] = useState(50);
  const [dataGridHeight, setDataGridHeight] = useState("550px");
  const [roleData, setRoleData] = useState([]);
  const [anchorEl, setAnchorEl] = React.useState();
  const [userId, setUserId] = useState();
  const [userIdToNavigate, setUserIdToNavigate] = useState();
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);


  //get all specialist
  const getData = async () => {
    try {
      setLoading(true);
      let result = await GetContactUs(localStorage.getItem("adminToken"));
      setRoleData(result.data.data);
      console.log("admins", result.data.data);
    } catch (e) {
      console.log(e);
      if (e.response && e.response.status === 401) {
        navigate("/error401");

        console.log("You do not have access to this page as a sub-admin.");
      } else {
        console.log("Error loading data. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    getData();
  }, []);

  const navigateToAddAdmin = () => {
    navigate("/addSupport");
  };
  const navigateToEditAdmin = (event, id) => {
    navigate(`/editSupport/${id}`);
  };

  const removeUser = (user_id) => {
    setIsModalVisible(false);
    DeleteContactUs(user_id, localStorage.getItem("adminToken"))
      .then((res) => {
        console.log(res, "res");
        message.success(res?.data?.message);
        getData();
      })

      .catch((error) => {
        console.log(error, "error");
      });
  };

  const columns = [
    { field: "id", headerName: "ID", width: 50 },

    {
      field: "email",
      headerName: "Email",
      width: 350,
      headerClassName: "custom-header",
      cellClassName: "custom-cell",
      flex: 1,
    },
    {
      field: "contact_number",
      headerName: "Contact Number",
      width: 350,
      headerClassName: "custom-header",
      cellClassName: "custom-cell",
      flex: 1,
    },
    {
      field: "address",
      headerName: "Address",
      width: 450,
      headerClassName: "custom-header",
      cellClassName: "custom-cell",
      flex: 1,
    },
  ];

  return (
    <Box m="20px">
      {loading ? (
        <p style={{ fontSize: "16px" }}>Loading...</p>
      ) : (
        <>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <h3>Contact Us</h3>
            <Box>
              <Button
                label=" Add Data"
                icon="pi pi-plus"
                severity="info"
                style={{ margin: "0px 10px", borderRadius: "5px" }}
                onClick={navigateToAddAdmin}
              />
            </Box>
          </Box>
          <div
            style={{
              height: dataGridHeight,
              width: "100%",
              // marginLeft: "10%",
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
        </>
      )}
    </Box>
  );
};

export default Support;
