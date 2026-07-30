/** @format */

import React, { useLayoutEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { GetAdminById, UpdateAdmin } from "../../services/Api/Api.jsx";
import { message } from "antd";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { ArrowLeft, Check, X } from "lucide-react";

const EditAdmin = () => {
	const { id } = useParams();
	const [idData, setIdData] = useState("");
	const [disable, setDisable] = useState(false);
	const navigate = useNavigate();

	//get role By ID
	useLayoutEffect(() => {
		GetAdminById(id)
			.then((res) => {
				setIdData(res.data.data);
			})
			.catch((err) => {
				console.log(err, "error");
			});
	}, [id]);

	//update role api implementation
	const handleNameChange = (e) => {
		setIdData({ ...idData, [e.target?.name]: e.target?.value });
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		setDisable(true);

		const formData = new FormData();
		formData.append("admin_id", id);
		formData.append("name", idData?.name ? idData?.name : "");
		formData.append("role_id", idData?.role_id ? idData?.role_id : "");

		UpdateAdmin(formData)
			.then((res) => {
				if (res.status === 200) {
					message.success("Admin updated successfully!");
				}
				navigate("/adminList");
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
			})
			.finally(() => {
				setDisable(false);
			});
	};

	const navigateToRole = () => {
		navigate("/adminList");
	};

	const fieldSx = {
		"& .MuiOutlinedInput-root": {
			height: "45px",
			borderRadius: "6px",
		},
	};

	const labelSx = {
		fontSize: "13px",
		fontWeight: 600,
		color: "#374151",
		mb: 1,
	};

	const disabledLabelSx = {
		...labelSx,
		color: "#9ca3af",
	};

	return (
		<Box>
			{/* Header Section */}
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
						flexWrap: { xs: "wrap", md: "nowrap" },
					}}
				>
					<Box sx={{ minWidth: 0 }}>
						<Typography className="page-title" noWrap>
							ADMIN MANAGEMENT
						</Typography>
						<Typography
							className="page-sub-title"
							sx={{
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap",
							}}
						>
							Update this admin
						</Typography>
					</Box>

					<Button
						variant="contained"
						disableElevation
						startIcon={<ArrowLeft size={18} />}
						onClick={navigateToRole}
						sx={{
							height: 46,
							px: 3,
							borderRadius: "8px",
							minWidth: 180,
							textTransform: "none",
							fontWeight: 600,
							backgroundColor: "#2c3345",
							flexShrink: 0,
							"&:hover": {
								backgroundColor: "#1f2433",
							},
						}}
					>
						Return to Admin
					</Button>
				</Box>
			</Paper>

			<Paper
				variant="outlined"
				sx={{
					p: 3,
					borderRadius: "10px",
					borderColor: "#eef0f2",
				}}
			>
				<form onSubmit={handleSubmit}>
					<Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
						<Box>
							<Typography sx={labelSx}>Name</Typography>
							<TextField
								fullWidth
								size="small"
								name="name"
								value={idData?.name || ""}
								onChange={handleNameChange}
								sx={fieldSx}
							/>
						</Box>

						<Box>
							<Typography sx={disabledLabelSx}>Email</Typography>
							<TextField
								fullWidth
								size="small"
								disabled
								name="email"
								value={idData?.email || ""}
								sx={{
									...fieldSx,
									"& .MuiOutlinedInput-root": {
										...fieldSx["& .MuiOutlinedInput-root"],
										backgroundColor: "#f5f5f5",
									},
								}}
							/>
						</Box>

						<Box>
							<Typography sx={labelSx}>Select Role</Typography>
							{idData && (
								<Select
									fullWidth
									size="small"
									defaultValue={idData?.role_id || ""}
									onChange={(e) =>
										handleNameChange({
											target: { name: "role_id", value: e.target.value },
										})
									}
									sx={{
										height: "45px",
										borderRadius: "6px",
									}}
								>
									<MenuItem value="5">BDM</MenuItem>
									<MenuItem value="3">SALES EXECUTIVE</MenuItem>
									<MenuItem value="1">SUPER ADMIN</MenuItem>
								</Select>
							)}
						</Box>

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
								onClick={navigateToRole}
								sx={{
									height: 42,
									px: 3,
									borderRadius: "6px",
									textTransform: "none",
									fontWeight: 600,
									backgroundColor: "#6b7280",
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

export default EditAdmin;