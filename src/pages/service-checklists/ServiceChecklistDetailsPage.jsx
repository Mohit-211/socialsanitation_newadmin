import { useLayoutEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Button, Form, Card, Input, Select } from "antd";
import { ArrowLeft, CircleCheck } from "lucide-react";
import { GetDailyChecklistById } from "@/services/api/serviceChecklistApi";
import PageHeader from "@/components/PageHeader";

const ServiceChecklistDetailsPage = () => {
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
				console.error(err, "error");
			});
	}, [id]);

	return (
		<div>
			{/* Header Section */}
			<PageHeader
				title="SERVICE CHECKLIST MANAGEMENT"
				subtitle="View checklist details"
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
									<CircleCheck
										size={16}
										color="var(--color-primary-strong)"
										style={{ flexShrink: 0 }}
									/>
									<span>{task.task}</span>
								</div>
							))
						) : (
							<p>No tasks available</p>
						)}
					</Form.Item>
				</Form>
			</Card>
		</div>
	);
};

export default ServiceChecklistDetailsPage;
