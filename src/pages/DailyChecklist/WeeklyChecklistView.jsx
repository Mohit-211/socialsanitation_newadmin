/** @format */

import React, { useEffect, useState } from "react";
import { Card, Select, Spin, Table, Tag, Row, Col, message } from "antd";
import {
	GetWeeklyChecklistWithStatus,
	GetJanitor,
} from "../../services/Api/DailyChecklistApi";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";

const { Option } = Select;

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

      console.log("Checklist data breakdown:", checklistData);

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
					<CheckCircleOutlined style={{ color: "green", fontSize: 18 }} />
				) : (
					<CloseCircleOutlined style={{ color: "red", fontSize: 18 }} />
				),
		}));

		return [...baseColumns, ...dayColumns];
	};

	return (
		<Card title="Weekly Checklist View" style={{ minHeight: "80vh" }}>
			<Row style={{ marginBottom: 20 }}>
				<Col>
					<Select
						placeholder="Select Cleaner or Housekeeping User"
						style={{ width: 350 }}
						onChange={(val) => setSelectedUser(val)}
						value={selectedUser}
						loading={users.length === 0}
					>
						{users.map((user) => (
							<Option key={user.id} value={user.id}>
								{user.user_profile?.name || user.user_name} (
								{getRoleName(user.sub_role_id)})
							</Option>
						))}
					</Select>
				</Col>
			</Row>

			{loading ? (
				<Spin />
			) : (
				Object.keys(checklistData).length > 0 && (
					<Table
						columns={getColumns()}
						dataSource={getTableData()}
						scroll={{ x: "max-content" }}
						pagination={false}
						bordered
					/>
				)
			)}
		</Card>
	);
};

export default WeeklyChecklistView;
