/** @format */

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import MuiButton from "@mui/material/Button";
import React, { useState } from "react";
import { Button, Card, Form, Input, Space, message, Select } from "antd";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, Plus, Check, X } from "lucide-react";
import { CreateChecklist } from "../../services/Api/checklistApi";

const AddServiceChecklist = () => {
	const [heading, setHeading] = useState("");
	const [tasks, setTasks] = useState([""]);
	const [disable, setDisable] = useState(false);
	const [roleId, setRoleId] = useState(null);

	const navigate = useNavigate();

	const handleTaskChange = (value, index) => {
		const updatedTasks = [...tasks];
		updatedTasks[index] = value;
		setTasks(updatedTasks);
	};

	const addTaskField = () => {
		setTasks([...tasks, ""]);
	};

	const removeTaskField = (index) => {
		const updatedTasks = tasks.filter((_, idx) => idx !== index);
		setTasks(updatedTasks);
	};

	const handleSubmit = async () => {
		setDisable(true);

		if (!heading.trim()) {
			message.error("Please enter heading");
			setDisable(false);
			return;
		}


	if (!roleId) {
		message.error("Please select a role");
		setDisable(false);
		return;
	}

		const filteredTasks = tasks.filter((t) => t.trim() !== "");
		if (filteredTasks.length === 0) {
			message.error("Please enter at least one task");
			setDisable(false);
			return;
		}

		const payload = {
			heading,
            role_id: roleId,
			tasks: filteredTasks,
		};

		try {
			const response = await CreateChecklist(payload);
			if (response.status === 201) {
				message.success("Checklist created successfully");
				setTimeout(() => navigate("/checklist"), 1000);
			}
		} catch (error) {
			if (error.response?.status === 400) {
				message.error("Checklist already exists");
			} else if (error.response?.status === 401) {
				message.error("Token expired");
				localStorage.removeItem("adminToken");
				setTimeout(() => navigate("/Login"), 1000);
			} else {
				message.error("Something went wrong");
			}
		}

		setDisable(false);
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
							SERVICE CHECKLIST MANAGEMENT
						</Typography>
						<Typography
							className="page-sub-title"
							sx={{
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap",
							}}
						>
							Create a new checklist
						</Typography>
					</Box>

					<MuiButton
						variant="contained"
						disableElevation
						startIcon={<ArrowLeft size={18} />}
						onClick={() => navigate("/checklist")}
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
						Return to Checklist
					</MuiButton>
				</Box>
			</Paper>

			<Card>
				<Form layout="vertical" onFinish={handleSubmit}>
					<Form.Item label="Heading" required>
						<Input
							placeholder="Enter heading"
							value={heading}
							onChange={(e) => setHeading(e.target.value)}
						/>
					</Form.Item>

					<Form.Item label="Assign To" required>
						<Select
							placeholder="Select Role"
							value={roleId}
							onChange={(value) => setRoleId(value)}
						>
							<Select.Option value={7}>Inspector/ Supervisor</Select.Option>
							<Select.Option value={8}>Quality Assurance Technician</Select.Option>
						</Select>
					</Form.Item>

					<Form.Item label="Tasks" required>
						{tasks.map((task, index) => (
							<div
								key={index}
								style={{ display: "flex", marginBottom: 8, gap: "10px" }}
							>
								<Input
									placeholder={`Task ${index + 1}`}
									value={task}
									onChange={(e) => handleTaskChange(e.target.value, index)}
									style={{ flex: 1 }}
								/>
								{tasks.length > 1 && (
									<Button
										danger
										type="primary"
										icon={<Trash2 size={15} />}
										onClick={() => removeTaskField(index)}
									/>
								)}
							</div>
						))}

						<Button
							onClick={addTaskField}
							icon={<Plus size={15} />}
							style={{ marginTop: "10px" }}
						>
							Add Task
						</Button>
					</Form.Item>

					<Form.Item>
						<Space>
							<Button
								type="primary"
								htmlType="submit"
								loading={disable}
								icon={<Check size={15} />}
							>
								Save
							</Button>
							<Button
								type="default"
								onClick={() => navigate("/checklist")}
								icon={<X size={15} />}
							>
								Cancel
							</Button>
						</Space>
					</Form.Item>
				</Form>
			</Card>
		</Box>
	);
};

export default AddServiceChecklist;