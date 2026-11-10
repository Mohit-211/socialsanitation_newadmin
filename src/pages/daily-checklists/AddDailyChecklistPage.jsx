import { useState } from "react";
import { Button, Card, Form, Input, Space, message, Select } from "antd";
import { ArrowLeft, Trash2, Plus, Check, X } from "lucide-react";
import { useNavigate } from "react-router";
import { CreateChecklist } from "@/services/api/dailyChecklistApi";
import PageHeader from "@/components/PageHeader";

const ROLE_OPTIONS = [
	{ value: 10, label: "Cleaner" },
	{ value: 11, label: "Housekeeping" },
];

const AddDailyChecklistPage = () => {
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
				setTimeout(() => navigate("/daily-checklist"), 1000);
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
		<div>
			<PageHeader
				title="HOUSEKEEPING CHECKLIST MANAGEMENT"
				subtitle="Create a new checklist"
				actions={
					<Button
						size="large"
						icon={<ArrowLeft size={16} />}
						onClick={() => navigate("/daily-checklist")}
					>
						Return to Checklist
					</Button>
				}
			/>

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
							onChange={(val) => setRoleId(val)}
							options={ROLE_OPTIONS}
						/>
					</Form.Item>

					<Form.Item label="Tasks" required>
						{tasks.map((task, index) => (
							<div key={index} style={{ display: "flex", marginBottom: 8, gap: "10px" }}>
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
										aria-label="Remove task"
										icon={<Trash2 size={16} />}
										onClick={() => removeTaskField(index)}
									/>
								)}
							</div>
						))}

						<Button
							onClick={addTaskField}
							icon={<Plus size={16} />}
							style={{ marginTop: 10 }}
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
								icon={<Check size={16} />}
							>
								Save
							</Button>
							<Button
								type="default"
								onClick={() => navigate("/daily-checklist")}
								icon={<X size={16} />}
							>
								Cancel
							</Button>
						</Space>
					</Form.Item>
				</Form>
			</Card>
		</div>
	);
};

export default AddDailyChecklistPage;