/** @format */

import { Box } from "@mui/material";
import React, { useLayoutEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Form, Card, Button, Input, Space, message, Select } from "antd";
import {
	GetDailyChecklistById,
	UpdateChecklist,
} from "../../services/Api/checklistApi";

const EditServiceChecklist = () => {
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
				setTasks(data?.service_checklists || []);
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
				setTimeout(() => navigate("/checklist"), 1000);
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
			<Box
				display="flex"
				justifyContent="space-between"
				alignItems="center"
				marginBottom="20px"
			>
				<div>
					<h3 className="page-title">SERVICE CHECKLIST MANAGEMENT</h3>
					<p className="page-sub-title">Update Checklist</p>
				</div>
				<Button
					icon={<i className="pi pi-arrow-left" />}
					onClick={() => navigate("/checklist")}
					style={{ borderRadius: "5px", height: "47px" }}
				>
					Return to Checklist
				</Button>
			</Box>

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
										icon={<i className="pi pi-trash" />}
										onClick={() => removeTaskField(index)}
									/>
								)}
							</div>
						))}
						<Button
							onClick={addTaskField}
							icon={<i className="pi pi-plus" />}
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
								icon={<i className="pi pi-check" />}
							>
								Save
							</Button>
							<Button
								type="default"
								onClick={() => navigate("/checklist")}
								icon={<i className="pi pi-times" />}
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

export default EditServiceChecklist;
