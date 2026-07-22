/** @format */

import { Box } from "@mui/material";
import React, { useLayoutEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Form, Card, Button, Input, Space, Select } from "antd";
import { GetDailyChecklistById } from "../../services/Api/checklistApi";
import { CheckCircleOutlined } from "@ant-design/icons";

const ViewServiceChecklist = () => {
	const { id } = useParams();
	const [heading, setHeading] = useState("");
	const [tasks, setTasks] = useState([]);
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
				console.log(err, "error");
			});
	}, [id]);

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
					<p className="page-sub-title">View Checklist</p>
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
				<Form layout="vertical">
					<Form.Item label="Heading">
						<Input value={heading} disabled />
					</Form.Item>

					<Form.Item label="Assigned To">
						<Select value={roleId} disabled>
							<Select.Option value={7}>Inspector/ Supervisor</Select.Option>
							<Select.Option value={8}>Quality Assurance Technician</Select.Option>
						</Select>
					</Form.Item>

					<Form.Item label="Tasks">
						{tasks.length > 0 ? (
							tasks.map((task, index) => (
								<div
									key={index}
									style={{
										display: "flex",
										alignItems: "center",
										marginBottom: 8,
										gap: "10px",
									}}
								>
									<CheckCircleOutlined style={{ color: "#1890ff", fontSize: "16px" }} />
									<span>{task.task}</span>
								</div>
							))
						) : (
							<p>No tasks available</p>
						)}
					</Form.Item>
				</Form>
			</Card>
		</Box>
	);
};

export default ViewServiceChecklist;
