/** @format */

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import MuiButton from "@mui/material/Button";
import React, { useLayoutEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Form, Card, Input, Select } from "antd";
import { ArrowLeft } from "lucide-react";
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
							View checklist details
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