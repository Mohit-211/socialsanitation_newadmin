/** @format */

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import MuiButton from "@mui/material/Button";
import React, { useLayoutEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Form, Card, Button, Input, Space, message, Select } from "antd";
import { ArrowLeft, Trash2, Plus, Check, X } from "lucide-react";
import {
	GetDailyChecklistById,
	UpdateChecklist,
} from "../../services/Api/DailyChecklistApi";

const EditDailyChecklist = () => {
	const { id } = useParams();
	const [heading, setHeading] = useState("");
	const [tasks, setTasks] = useState([]);
	const [disable, setDisable] = useState(false);
	const [roleId, setRoleId] = useState(null);
	const navigate = useNavigate();

	useLayoutEffect(() => {
		GetDailyChecklistById(id)
			.then((res) => {
				const data = res.data.data;
				console.log(res.data.data);
				setHeading(data?.title);
				setTasks(data?.daily_task || []);
				setRoleId(data?.role_id || null);
			})
			.catch((err) => {
				console.log(err, "error");
			});
	}, [id]);

	const handleTaskChange = (value, index) => {
		const updatedTasks = [...tasks];
		updatedTasks[index] = { ...updatedTasks[index], task: value };
		setTasks(updatedTasks);
	};

	const addTaskField = () => {
		setTasks([...tasks, { task: "" }]); // new task has no ID
	};

	const removeTaskField = (index) => {
		const updatedTasks = tasks.filter((_, idx) => idx !== index);
		setTasks(updatedTasks);
	};

	const handleSubmit = async () => {
		if (!heading.trim()) {
			message.error("Please enter heading");
			return;
		}

		if (!roleId) {
			message.error("Please select a role");
			return;
		}

		const filteredTasks = tasks.filter((t) => t.task.trim() !== "");

		if (filteredTasks.length === 0) {
			message.error("Please enter at least one task");
			return;
		}

		const payload = {
			heading,
			role_id: roleId,
			tasks: filteredTasks,
		};

		setDisable(true);

		try {
			const res = await UpdateChecklist(id, payload); // assumes PUT method with id
			if (res.status === 200) {
				message.success("Checklist updated successfully!");
				setTimeout(() => navigate("/daily-checklist"), 1000);
			}
		} catch (err) {
			if (err.response?.status === 401) {
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
							HOUSEKEEPING CHECKLIST MANAGEMENT
						</Typography>
						<Typography
							className="page-sub-title"
							sx={{
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap",
							}}
						>
							Update this checklist
						</Typography>
					</Box>

					<MuiButton
						variant="contained"
						disableElevation
						startIcon={<ArrowLeft size={18} />}
						onClick={() => navigate("/daily-checklist")}
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
							style={{ width: "100%" }}
						/>
					</Form.Item>

					<Form.Item label="Assign To" required>
						<Select
							placeholder="Select Role"
							value={roleId}
							onChange={(val) => setRoleId(val)}
						>
							<Select.Option value={10}>Cleaner</Select.Option>
							<Select.Option value={11}>Housekeeping</Select.Option>
						</Select>
					</Form.Item>

					<Form.Item label="Tasks" required>
						{tasks.map((task, index) => (
							<div
								key={index}
								style={{
									display: "flex",
									alignItems: "start",
									marginBottom: 8,
									gap: "10px",
								}}
							>
								<Input
									placeholder={`Task ${index + 1}`}
									value={task.task}
									onChange={(e) => handleTaskChange(e.target.value, index)}
									style={{ width: "80%" }} // 🔥 this enforces half-page width
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
								onClick={() => navigate("/daily-checklist")}
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

export default EditDailyChecklist;