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
import Stack from "@mui/material/Stack";
import { message } from "antd";
import PropTypes from "prop-types";
import CircularProgress from "@mui/material/CircularProgress";
import { Trash2 } from "lucide-react";
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
      <TableRow
        sx={{
          "& > *": { borderBottom: "unset" },
          "&:hover": { backgroundColor: "#f9fafb" },
        }}
      >
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
            sx={{
              border: "1px solid #eef0f2",
              borderRadius: "8px",
              width: 30,
              height: 30,
            }}
          >
            {open ? (
              <KeyboardArrowUpIcon fontSize="small" />
            ) : (
              <KeyboardArrowDownIcon fontSize="small" />
            )}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">
          <Typography sx={{ fontWeight: 600, fontSize: "14px", color: "#111827" }}>
            {row[0].login_user?.user_profile?.name}
          </Typography>
        </TableCell>
        <TableCell align="right">
          <Typography sx={{ fontSize: "13.5px", color: "#6b7280" }}>
            {row[0].login_user.email}
          </Typography>
        </TableCell>
        <TableCell align="right">
          <Typography sx={{ fontSize: "13.5px", color: "#6b7280" }}>
            {row[0].role_id === 6 ? "User" : row[0].role_id === 7 ? "Driver" : ""}
          </Typography>
        </TableCell>
        <TableCell align="right">
          <Typography sx={{ fontSize: "13.5px", color: "#6b7280" }}>
            {row[0].user_id}
          </Typography>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell
          style={{ paddingBottom: 0, paddingTop: 0, paddingRight: 0 }}
          colSpan={8}
        >
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box
              sx={{
                m: 1.5,
                p: 2,
                backgroundColor: "#f9fafb",
                borderRadius: "10px",
                border: "1px solid #eef0f2",
              }}
            >
              <Typography
                sx={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#6b7280",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  mb: 1.5,
                }}
              >
                Login History
              </Typography>
              <Table size="small" aria-label="purchases">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, fontSize: "12.5px", color: "#374151" }}>
                      IP Address
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: "12.5px", color: "#374151" }}>
                      Login Time
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: "12.5px", color: "#374151" }}>
                      Logout Time
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {row.map((historyRow) => (
                    <TableRow key={historyRow.id}>
                      <TableCell sx={{ fontSize: "13px", color: "#374151" }}>
                        {row[0].ip_address.split(":").pop()}
                      </TableCell>

                      <TableCell align="right" component="th" scope="row" sx={{ fontSize: "13px", color: "#374151" }}>
                        {new Date(historyRow.login_time_utc).toLocaleString("en-US", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                          hour12: false,
                        })}
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: "13px", color: "#374151" }}>
                        {historyRow.logout_time_utc
                          ? new Date(historyRow.logout_time_utc).toLocaleString("en-US", {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
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
  const [loading, setLoading] = useState(true);
  const [clearLoading, setClearLoading] = useState(false);

  useEffect(() => {
    const loginTimingsFunc = async () => {
      try {
        let data = await getUserLoginTimings();
        setUserLoginTimingData(data.data.data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
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
    <Box>
      {/* HEADER */}
      <Paper
        variant="outlined"
        sx={{
          p: 2.5,
          mb: 2.5,
          borderRadius: "10px",
          borderColor: "#eef0f2",
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: { xs: "wrap", md: "nowrap" },
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography className="page-title" noWrap>
              USER LOGIN ACTIVITY
            </Typography>
            <Typography
              className="page-sub-title"
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              Login track record of all users
            </Typography>
          </Box>

          <Button
            variant="contained"
            disableElevation
            startIcon={<Trash2 size={16} />}
            onClick={handleClearButtonClick}
            disabled={clearLoading}
            sx={{
              height: 42,
              px: 2.5,
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 600,
              whiteSpace: "nowrap",
              flexShrink: 0,
              backgroundColor: "#ef4444",
              "&:hover": { backgroundColor: "#dc2626" },
            }}
          >
            {clearLoading ? "Clearing..." : "Clear Logs"}
          </Button>
        </Stack>
      </Paper>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress size={32} />
        </Box>
      ) : userLoginTimingData && userLoginTimingData.length !== 0 ? (
        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{
            borderRadius: "10px",
            borderColor: "#eef0f2",
            maxHeight: "64.5vh",
          }}
        >
          <Table aria-label="collapsible table" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: "12.5px", color: "#374151" }} />
                <TableCell sx={{ fontWeight: 700, fontSize: "12.5px", color: "#374151" }}>
                  Name
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: "12.5px", color: "#374151" }}>
                  Email
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: "12.5px", color: "#374151" }}>
                  Role
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: "12.5px", color: "#374151" }}>
                  User ID
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.keys(userLoginTimingData).map((userId) => (
                <Row key={userId} row={userLoginTimingData[userId]} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper
          variant="outlined"
          sx={{
            p: 4,
            borderRadius: "10px",
            borderColor: "#eef0f2",
            textAlign: "center",
          }}
        >
          <Typography sx={{ color: "#9ca3af" }}>
            No login activity recorded yet.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default LoginLogs;