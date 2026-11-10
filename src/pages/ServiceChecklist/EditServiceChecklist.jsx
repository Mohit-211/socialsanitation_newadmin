import { useLayoutEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Form, Card, Button, Input, Space, message, Select } from "antd";
import { ArrowLeft, Trash2, Plus, Check, X } from "lucide-react";
import {
	GetDailyChecklistById,
	UpdateChecklist,
} from "../../services/Api/checklistApi";
import PageHeader from "../../components/PageHeader";

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
				setHeading(data?.title);
				setTasks(data?.service_checklists || []);
				setRoleId(data?.role_id || null);
			})
			.catch((err) => {
				console.error(err, "error");
			});
	}, [id]);

	const handleTaskChange = (value, index) => {
		const updatedTasks = [...tasks];
		updatedTasks[index] = { ...updatedTasks[index], task: value };
		setTasks(updatedTasks);
	};

	const addTaskField = () => {
		setTasks([...tasks, { task: "" }]);
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
		<div>
			{/* Header Section */}
			<PageHeader
				title="SERVICE CHECKLIST MANAGEMENT"
				subtitle="Update this checklist"
				actions={
					<Button
						size="large"
						icon={<ArrowLeft size={16} />}
						onClick={() => navigate("/checklist")}
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
		</div>
	);
};

export default EditServiceChecklist;