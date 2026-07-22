import React, { useEffect, useState } from "react";
import {
  Box,
  Collapse,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import Button from "@mui/material/Button";
import { message } from "antd";
import PropTypes from "prop-types";
import CircularProgress from "@mui/material/CircularProgress";
import {
  getUserLoginTimings,
  clearUserLoginTimings,
} from "../../../services/Api/Api";


function Row(props) {
  const { row } = props;
  const [open, setOpen] = React.useState(false);
  if (!row || !row[0] || !row[0]?.login_user) {
    return null; // or handle the case where login_user is undefined
  }

 

  return (
    <React.Fragment>
      <TableRow sx={{ "& > *": { borderBottom: "unset" } }}>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">
          {row[0].login_user?.user_profile?.name}
        </TableCell>
        <TableCell align="right">{row[0].login_user.email}</TableCell>
        <TableCell align="right">
          {row[0].role_id === 6 ? "User" : row[0].role_id === 7 ? "Driver" : ""}
        </TableCell>
        <TableCell align="right">{row[0].user_id}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell
          style={{ paddingBottom: 0, paddingTop: 0, paddingRight: 0 }}
          colSpan={8}
        >
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
               Login History
              </Typography>
              <Table size="small" aria-label="purchases">
                <TableHead>
                  <TableRow>
                    {/* <TableCell>User user_id</TableCell> */}
                    <TableCell >Ip address</TableCell>
                    <TableCell align="right">Login Time</TableCell>
                    <TableCell align="right">Logout Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {row.map((historyRow) => (
                    <TableRow key={historyRow.id}>
                      {/* <TableCell align="right">{row[0].user_id}</TableCell> */}
                      <TableCell >
                        {row[0].ip_address.split(":").pop()}
                      </TableCell>

                      <TableCell align="right" component="th" scope="row">
                      {new Date(historyRow.login_time_utc).toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}

                      </TableCell>
                      <TableCell align="right">
  {historyRow.logout_time_utc
    ? new Date(historyRow.logout_time_utc).toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      })
    : "----"}
</TableCell>

                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

Row.propTypes = {
  row: PropTypes.shape({
    id: PropTypes.number, 
    user_id: PropTypes.number.isRequired,
    role_id: PropTypes.number.isRequired,
    login_user: PropTypes.object.isRequired,
    ip_address: PropTypes.string.isRequired,
    time_zone: PropTypes.number.isRequired,
    login_user_timezone: PropTypes.object.isRequired,
  }).isRequired,
};

const LoginLogs = () => {
  const [userLoginTimingData, setUserLoginTimingData] = useState([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);

  useEffect(() => {
    const loginTimingsFunc = async () => {
      try {
        let data = await getUserLoginTimings();
        setUserLoginTimingData(data.data.data);
        console.log("logs", data.data);
      } catch (error) {
        setError(error.message)
      }
      finally {
        setLoading(false)
      }
    };

    loginTimingsFunc();
  }, []);

  const handleClearButtonClick = async () => {
    setClearLoading(true);
    try {
      await clearUserLoginTimings();
      setUserLoginTimingData([]);
      message.success("Login Record Cleared Successfully");
    } catch (error) {
      message.error("Failed to Clear Login Record");
    } finally {
      setClearLoading(false);
    }
  };

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box
          display="flex"
          justifyContent="space-between"
          flexDirection="column"
        >
          <h3 className="dashboard_title"> User Login Activity:</h3>
          <p className="page-sub-title" style={{ color: "green" }}>
            Login track record of all users
          </p>
        </Box>
        <Box>
          <Button
            label="Clear Logs"
            severity="danger"
            onClick={handleClearButtonClick}
            disabled={clearLoading}
            style={{
              margin: "0px 0px",
              borderRadius: "5px",
              height: "40px",
            }}
          />
        </Box>
      </Box>
      {loading ? (
        <CircularProgress />
      ) : (
        userLoginTimingData &&
        userLoginTimingData.length !== 0 && (
          <Box m="40px 0 0 0" height="64.5vh" overflow="auto">
            <TableContainer component={Paper}>
              <Table aria-label="collapsible table">
                <TableHead>
                  <TableRow>
                    <TableCell />
                    <TableCell>Name</TableCell>
                    <TableCell align="right">Email</TableCell>
                    <TableCell align="right">Role</TableCell>
                    <TableCell align="right">User Id</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.keys(userLoginTimingData).map((userId) => (
                    <Row key={userId} row={userLoginTimingData[userId]} />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )
      )}
    </Box>
  );
};

export default LoginLogs;




