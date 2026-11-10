import { useEffect, useState } from "react";
import { Select, Spin, Table, message } from "antd";
import { CircleCheck, CircleX } from "lucide-react";
import {
	GetWeeklyChecklistWithStatus,
	GetJanitor,
} from "../../services/Api/DailyChecklistApi";
import PageHeader from "../../components/PageHeader";
import "./DailyChecklist.scss";

const WeeklyChecklistView = () => {
	const [loading, setLoading] = useState(false);
	const [checklistData, setChecklistData] = useState({});
	const [selectedUser, setSelectedUser] = useState(null);
	const [users, setUsers] = useState([]);

	const fetchUsers = async () => {
		try {
			const res = await GetJanitor();
			setUsers(res.data.data);
		} catch (err) {
			console.error(err);
			message.error("Error fetching janitors/housekeeping users");
		}
	};

	const fetchChecklist = async (userId) => {
		setLoading(true);
		try {
			const res = await GetWeeklyChecklistWithStatus({ user_id: userId });

			setChecklistData(res.data.data.data);
		} catch (err) {
			console.error(err);
			message.error("Something went wrong while fetching checklist");
		}
		setLoading(false);
	};

	useEffect(() => {
		fetchUsers();
	}, []);

	useEffect(() => {
		if (selectedUser) {
			fetchChecklist(selectedUser);
		}
	}, [selectedUser]);

	const getRoleName = (sub_role_id) => {
		switch (sub_role_id) {
			case 10:
				return "Cleaner";
			case 11:
				return "Housekeeping";
			default:
				return "User";
		}
	};

	// Build table rows grouped by heading
	const getTableData = () => {
		const headingsMap = {};

		Object.entries(checklistData).forEach(([date, groups]) => {

			if (!Array.isArray(groups)) return; // ✅ skip non-array values

			groups.forEach((group) => {
				if (!Array.isArray(group.tasks)) return;

				if (!headingsMap[group.heading]) {
					headingsMap[group.heading] = {};
				}
				group.tasks.forEach((task) => {
					if (!headingsMap[group.heading][task.task]) {
						headingsMap[group.heading][task.task] = {};
					}
					headingsMap[group.heading][task.task][date] = task.is_completed;
				});
			});
		});

		// Build rows
		const rows = [];
		Object.entries(headingsMap).forEach(([heading, tasks]) => {
			Object.entries(tasks).forEach(([task, dates]) => {
				rows.push({
					key: `${heading}-${task}`,
					heading,
					task,
					...dates, // date keys like 2025-06-24: true/false
				});
			});
		});

		return rows;
	};

	const getColumns = () => {
		const baseColumns = [
			{
				title: "Checklist Heading",
				dataIndex: "heading",
				key: "heading",
				fixed: "left",
				width: 200,
			},
			{
				title: "Task",
				dataIndex: "task",
				key: "task",
				width: 300,
			},
		];

		// Get sorted list of 7 days
		const dateKeys = Object.keys(checklistData).sort();

		const dayColumns = dateKeys.map((date) => ({
			title: date,
			dataIndex: date,
			key: date,
			align: "center",
			render: (val) =>
				val ? (
					<CircleCheck
						size={18}
						color="var(--color-success-strong)"
						role="img"
						aria-label="Completed"
					/>
				) : (
					<CircleX
						size={18}
						color="var(--color-error)"
						role="img"
						aria-label="Not completed"
					/>
				),
		}));

		return [...baseColumns, ...dayColumns];
	};

	return (
		<div>
			{/* HEADER */}
			<PageHeader
				className="weekly-checklist__header"
				title="WEEKLY CHECKLIST VIEW"
				subtitle="Track weekly task completion by employee"
				actions={
					<Select
						className="weekly-checklist__user"
						placeholder="Select Cleaner or Housekeeping User"
						onChange={(val) => setSelectedUser(val)}
						value={selectedUser}
						loading={users.length === 0}
						options={users.map((user) => ({
							value: user.id,
							label: `${user.user_profile?.name || user.user_name} (${getRoleName(
								user.sub_role_id
							)})`,
						}))}
					/>
				}
			/>

			{loading ? (
				<div className="weekly-checklist__loading">
					<Spin size="large" />
				</div>
			) : (
				Object.keys(checklistData).length > 0 && (
					<Table
						columns={getColumns()}
						dataSource={getTableData()}
						scroll={{ x: "max-content" }}
						pagination={false}
						bordered
						size="middle"
					/>
				)
			)}
		</div>
	);
};

export default WeeklyChecklistView;