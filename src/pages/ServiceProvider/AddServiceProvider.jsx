/** @format */

import React, { useState } from "react";
import {
    Box,
    Card,
    Button,
    Paper,
    Typography,
    TextField,
    MenuItem,
    Select,
    FormControl,
    FormLabel
} from "@mui/material";
import { AddUser } from "../../services/Api/Api";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import { ArrowLeft, Check, X } from "lucide-react";

const AddServiceProvider = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [roleId, setRoleId] = useState("");
    const [disable, setDisable] = useState(false);
    const [employeeType, setEmployeeType] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setDisable(true);

        if (!name) {
            message.error("Please enter name ");
            setDisable(false);
            return;
        }
        if (!email) {
            message.error("Please enter email");
            setDisable(false);
            return;
        }
        if (!roleId) {
            message.error("Please select a user type");
            setDisable(false);
            return;
        }

        if (!employeeType) {
            message.error("Please select employee type");
            setDisable(false);
            return;
        }

        let finalRoleId = roleId;
        let subRoleId = null;

        if (roleId.includes("-")) {
            const [role, subRole] = roleId.split("-");
            finalRoleId = parseInt(role);
            subRoleId = parseInt(subRole);
        } else {
            finalRoleId = parseInt(roleId);
        }

        try {
            const response = await AddUser({
                email,
                name,
                role_id: finalRoleId,
                sub_role_id: subRoleId,
                employee_type: finalRoleId === 7 ? employeeType : null
            });

            if (response.status === 200) {
                message.success("Employee added successfully");
                setTimeout(() => {
                    navigate("/employees");
                }, 1000);
            }
            setDisable(false);
        } catch (error) {
            if (error.response && error.response.status === 500) {
                message.error("Email already exists");
            } else if (error.response?.status === 401) {
                message.error("Token expired");
                localStorage.removeItem("adminToken");
                setTimeout(() => {
                    navigate("/Login");
                }, 3000);
            } else {
                message.error("Something went wrong");
            }
            setDisable(false);
        }
    };

    const navigateToUser = () => {
        navigate("/employees");
    };

    return (
        <Box>
            {/* Kept header intact */}
            <Paper
                variant="outlined"
                sx={{
                    p: 2.5,
                    mb: 3,
                    borderRadius: "10px",
                    borderColor: "#eef0f2",
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 2,
                    }}
                >
                    <Box>
                        <Typography className="page-title">
                            EMPLOYEE MANAGEMENT
                        </Typography>
                        <Typography className="page-sub-title">
                            Create New Employee
                        </Typography>
                    </Box>

                    <Button
                        variant="contained"
                        disableElevation
                        startIcon={<ArrowLeft size={18} />}
                        onClick={navigateToUser}
                        sx={{
                            ml: "auto",
                            height: 46,
                            px: 3,
                            borderRadius: "8px",
                            minWidth: 180,
                            textTransform: "none",
                            fontWeight: 600,
                            backgroundColor: "#2c3345",
                            "&:hover": {
                                backgroundColor: "#1f2433",
                            },
                        }}
                    >
                        Return to Employees
                    </Button>
                </Box>
            </Paper>

            {/* Pure MUI Form Container */}
            <Paper
                variant="outlined"
                sx={{
                    borderRadius: "10px",
                    borderColor: "#eef0f2",
                    p: 3,
                }}
            >
                <form onSubmit={handleSubmit}>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>

                        {/* Full Name */}
                        <FormControl fullWidth>
                            <FormLabel sx={{ fontWeight: 600, color: "#374151", mb: 1, fontSize: "0.95rem" }}>
                                Full Name
                            </FormLabel>
                            <TextField
                                fullWidth
                                placeholder="Enter name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                size="small"
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        height: "45px",
                                        borderRadius: "6px",
                                        borderColor: "#e2e8f0"
                                    }
                                }}
                            />
                        </FormControl>

                        {/* Email Address */}
                        <FormControl fullWidth>
                            <FormLabel sx={{ fontWeight: 600, color: "#374151", mb: 1, fontSize: "0.95rem" }}>
                                Email address
                            </FormLabel>
                            <TextField
                                fullWidth
                                type="email"
                                placeholder="Enter email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                size="small"
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        height: "45px",
                                        borderRadius: "6px",
                                        borderColor: "#e2e8f0"
                                    }
                                }}
                            />
                        </FormControl>

                        {/* User Type */}
                        <FormControl fullWidth>
                            <FormLabel sx={{ fontWeight: 600, color: "#374151", mb: 1, fontSize: "0.95rem" }}>
                                User Type:
                            </FormLabel>
                            <Select
                                displayEmpty
                                value={roleId}
                                onChange={(e) => setRoleId(e.target.value)}
                                size="small"
                                sx={{
                                    height: "45px",
                                    borderRadius: "6px",
                                    borderColor: "#e2e8f0"
                                }}
                            >
                                <MenuItem value="" disabled>
                                    <Typography color="text.secondary">Select User Type:</Typography>
                                </MenuItem>
                                <MenuItem value="7">Inspector/Supervisor</MenuItem>
                                <MenuItem value="8">Quality Assurance Technician</MenuItem>
                                <MenuItem value="9-10">Cleaner</MenuItem>
                                <MenuItem value="9-11">HouseKeeping</MenuItem>
                            </Select>
                        </FormControl>

                        {/* Employee Type */}
                        <FormControl fullWidth>
                            <FormLabel sx={{ fontWeight: 600, color: "#374151", mb: 1, fontSize: "0.95rem" }}>
                                Employee Type:
                            </FormLabel>
                            <Select
                                displayEmpty
                                value={employeeType}
                                onChange={(e) => setEmployeeType(e.target.value)}
                                size="small"
                                sx={{
                                    height: "45px",
                                    borderRadius: "6px",
                                    borderColor: "#e2e8f0"
                                }}
                            >
                                <MenuItem value="" disabled>
                                    <Typography color="text.secondary">Select Employee Type</Typography>
                                </MenuItem>
                                <MenuItem value="W2_BI_WEEKLY">W2 Bi-Weekly</MenuItem>
                                <MenuItem value="1099">1099 Contractor</MenuItem>
                            </Select>
                        </FormControl>

                        {/* Action Buttons */}
                        <Box sx={{ display: "flex", gap: 1.5, mt: 1 }}>
                            <Button
                                variant="contained"
                                disableElevation
                                type="submit"
                                disabled={disable}
                                startIcon={!disable ? <Check size={18} /> : null}
                                sx={{
                                    height: 42,
                                    px: 3,
                                    borderRadius: "6px",
                                    textTransform: "none",
                                    fontWeight: 600,
                                    backgroundColor: "#3b82f6",
                                    "&:hover": {
                                        backgroundColor: "#2563eb",
                                    },
                                }}
                            >
                                {disable ? "Saving..." : "Save"}
                            </Button>

                            <Button
                                variant="contained"
                                disableElevation
                                startIcon={<X size={18} />}
                                onClick={navigateToUser}
                                sx={{
                                    height: 42,
                                    px: 3,
                                    borderRadius: "6px",
                                    textTransform: "none",
                                    fontWeight: 600,
                                    backgroundColor: "#6b7280",
                                    color: "#ffffff",
                                    "&:hover": {
                                        backgroundColor: "#4b5563",
                                    },
                                }}
                            >
                                Cancel
                            </Button>
                        </Box>
                    </Box>
                </form>
            </Paper>
        </Box>
    );
};

export default AddServiceProvider;