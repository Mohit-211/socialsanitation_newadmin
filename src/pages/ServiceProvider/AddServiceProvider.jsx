/** @format */

import { Box } from "@mui/material";
import React from "react";
import { useState } from "react";
import Form from "react-bootstrap/Form";
import { AddUser } from "../../services/Api/Api";
import { useNavigate } from "react-router-dom";
import Card from "@mui/material/Card";
import Button from "@mui/material/Button";
import { message } from "antd";

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

		// Handle sub_role_id if needed
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
				sub_role_id: subRoleId, // will be null if not applicable
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
			<Box
				display="flex"
				justifyContent="space-between"
				alignItems="center"
				marginBottom="20px"
			>
				<div>
					<h3 className="page-title">EMPLOYEE MANAGEMENT</h3>
					<p className="page-sub-title">Create New Employee</p>
				</div>
				<div>
					<Button
						icon="pi pi-arrow-left"
						severity="secondary"
						onClick={navigateToUser}
						style={{ borderRadius: "5px", height: "47px" }}
					>
						<span style={{ marginLeft: "5px" }}>Return to Employee</span>
					</Button>
				</div>
			</Box>
			<Card>
				<div>
					<Form>
						<Form.Group className="mb-3">
							<Form.Label>Full Name</Form.Label>
							<Form.Control
								type="text"
								required
								placeholder="Enter name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								className="new_form_control"
							/>
						</Form.Group>

						<Form.Group className="mb-3">
							<Form.Label>Email address</Form.Label>
							<Form.Control
								type="email"
								placeholder="Enter email"
								value={email}
								required
								onChange={(e) => setEmail(e.target.value)}
								className="new_form_control"
							/>
						</Form.Group>

						<Form.Group className="mb-3">
							<Form.Label>User Type:</Form.Label>
							<Form.Select
								aria-label="Default select example"
								className="new_form_control"
								value={roleId}
								onChange={(e) => setRoleId(e.target.value)}
							>
								<option value="">Select User Type:</option>
								<option value="7">Inspector/Supervisor</option>
								<option value="8">Quality Assurance Technician</option>
								<option value="9-10">Cleaner</option>{" "}
								{/* role 9, sub_role 10 */}
								<option value="9-11">HouseKeeping</option>{" "}
								{/* role 9, sub_role 11 */}
							</Form.Select>
						</Form.Group>

						<Form.Group className="mb-3">
							<Form.Label>Employee Type:</Form.Label>
							<Form.Select
								className="new_form_control"
								value={employeeType}
								onChange={(e) => setEmployeeType(e.target.value)}
							>
								<option value="">Select Employee Type</option>
								<option value="W2_BI_WEEKLY">W2 Bi-Weekly</option>
								<option value="1099">1099 Contractor</option>
							</Form.Select>
						</Form.Group>

						<div style={{ marginTop: "60px" }}>
							<Button
								icon="pi pi-check"
								severity="info"
								type="submit"
								onClick={handleSubmit}
								disabled={disable}
								style={{
									height: "45px",
									padding: "20px",
									borderRadius: "5px",
								}}
							>
								{disable ? "Saving...." : "Save"}
							</Button>

							<Button
								icon="pi pi-times"
								severity="secondary"
								onClick={(e) => {
									navigateToUser();
								}}
								style={{
									marginLeft: "10px",
									marginTop: "10px",
									height: "45px",
									padding: "20px",
									borderRadius: "5px",
								}}
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

export default AddServiceProvider;
