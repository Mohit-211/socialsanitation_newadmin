/** @format */

import { Box } from "@mui/material";
import React, { useLayoutEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Button, Input, Form, Typography } from "antd";
import { GetDailyChecklistById } from "../../services/Api/DailyChecklistApi";

const { Title, Text } = Typography;

const ViewDailyChecklist = () => {
	const { id } = useParams();
	const [heading, setHeading] = useState("");
	const [tasks, setTasks] = useState([]);
	const [roleId, setRoleId] = useState(null);
	const navigate = useNavigate();

	const roleMap = {
		10: "Cleaner",
		11: "Housekeeping",
	};

	useLayoutEffect(() => {
		GetDailyChecklistById(id)
			.then((res) => {
				const data = res.data.data;
				setHeading(data?.title);
				setTasks(data?.daily_task || []);
				setRoleId(data?.role_id || null);
			})
			.catch((err) => {
				console.log(err, "error");
			});
	}, [id]);

	return (
		<Box>
			<Box display="flex" justifyContent="space-between" alignItems="center" marginBottom="20px">
				<div>
					<h3 className="page-title">HOUSEKEEPING CHECKLIST MANAGEMENT</h3>
					<p className="page-sub-title">View Checklist</p>
				</div>
				<Button
					icon={<i className="pi pi-arrow-left" />}
					onClick={() => navigate("/daily-checklist")}
					style={{ borderRadius: "5px", height: "47px" }}
				>
					Return to Checklist
				</Button>
			</Box>

			<Card>
				<Form layout="vertical">
					<Form.Item label="Heading">
						<Input value={heading} readOnly />
					</Form.Item>

					<Form.Item label="Assigned Role">
						<Input value={roleMap[roleId] || "-"} readOnly />
					</Form.Item>

					<Form.Item label="Tasks">
						{tasks.length > 0 ? (
							<ul style={{ paddingLeft: "20px" }}>
								{tasks.map((task, index) => (
									<li key={index} style={{ marginBottom: "8px" }}>
										<Text>
											<span role="img" aria-label="task-icon">✅</span>{" "}
											{task.task}
										</Text>
									</li>
								))}
							</ul>
						) : (
							<Text type="secondary">No tasks added</Text>
						)}
					</Form.Item>
				</Form>
			</Card>
		</Box>
	);
};

export default ViewDailyChecklist;
