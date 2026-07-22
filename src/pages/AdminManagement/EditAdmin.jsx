/** @format */

import { Box } from "@mui/material";
import React, { useLayoutEffect, useState } from "react";
import { Form } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import { GetAdminById, UpdateAdmin } from "../../services/Api/Api.jsx";
import { message } from "antd";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import { Select } from "antd";

const EditAdmin = () => {
	const { id } = useParams();
	const [idData, setIdData] = React.useState("");
  const [disable, setDisable] = useState(false);

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
	console.log("isdata---->", idData);

	//update role api implementation
	const handleNameChange = (e) => {
		console.log("Selected value:", e.target.value);
		setIdData({ ...idData, [e.target?.name]: e.target?.value });
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		const formData = new FormData();
		formData.append("admin_id", id);
		formData.append("name", idData?.name ? idData?.name : "");
		// formData.append("email", idData?.email ? idData?.email : "");
		formData.append("role_id", idData?.role_id ? idData?.role_id : "");
		console.log("formData", formData);
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
			});
	};

	const navigate = useNavigate();
	const navigateToRole = () => {
		navigate("/adminList");
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
					<h3 className="page-title">Edit Admin</h3>
					<p className="page-sub-title">Update Admin</p>
				</div>
				<div>
					<Button
						icon="pi pi-arrow-left"
						severity="secondary"
						onClick={navigateToRole}
						style={{ borderRadius: "5px", height: "47px" }}
					>
						<span style={{ marginLeft: "5px" }}>Return to Admin</span>
					</Button>
				</div>
			</Box>
			<Card>
				<Form>
					<Form.Group className="mb-3">
						<Form.Label>Name</Form.Label>
						<Form.Control
							type="text"
							defaultValue={idData?.name}
							name="name"
							onChange={(e) => handleNameChange(e)}
						/>
					</Form.Group>

					<Form.Group className="mb-3">
						<Form.Label>Email</Form.Label>
						<Form.Control
							type="text"
							disabled
							defaultValue={idData?.email}
							name="email"
							onChange={(e) => handleNameChange(e)}
						/>
					</Form.Group>

					<Form.Group className="mb-3">
						<Form.Label>Select Role :</Form.Label>
						{idData && (
							<Select
								defaultValue={idData?.admin_role?.name || ""}
								style={{
									width: "100%",
									color: "black",
									height: "40px",
								}}
								onChange={(value) =>
									handleNameChange({ target: { name: "role_id", value } })
								}
								options={[
									{
										value: "5",
										label: "BDM",
									},
									{
										value: "3",
										label: "SALES EXECUTIVE",
									},
									{
										value: "1",
										label: "SUPER ADMIN",
									},
									

									// {
									// 	value: "2",
									// 	label: "ADMIN LEVEL 1",
									// },
									// {
									// 	value: "3",
									// 	label: "ADMIN LEVEL 2",
									// },
								]}
							/>
						)}
					</Form.Group>
				</Form>
				<div style={{ marginTop: "40px" }}>
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
							navigateToRole();
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
			</Card>
		</Box>
	);
};

export default EditAdmin;
