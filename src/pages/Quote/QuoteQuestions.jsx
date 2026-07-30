/** @format */
import React, { useEffect, useState } from "react";
import { Table, Button, Space, Tag, Popconfirm, message } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import MuiButton from "@mui/material/Button";
import { Plus } from "lucide-react";
import QuestionModal from "./QuestionModal";
import {
	createQuestion,
	deleteQuestion,
	getAllQuestions,
	updateQuestion,
} from "../../services/Api/quoteApi";

const QuoteQuestions = () => {
	const [questions, setQuestions] = useState([]);
	const [loading, setLoading] = useState(false);
	const [modalOpen, setModalOpen] = useState(false);
	const [editingQuestion, setEditingQuestion] = useState(null);

	const fetchQuestions = async () => {
		try {
			setLoading(true);
			const res = await getAllQuestions();
			setQuestions(res.data.data || res.data);
		} catch (error) {
			message.error("Failed to load questions");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchQuestions();
	}, []);

	const handleAdd = () => {
		setEditingQuestion(null);
		setModalOpen(true);
	};

	const handleEdit = (record) => {
		setEditingQuestion(record);
		setModalOpen(true);
	};

	const handleDelete = async (id) => {
		try {
			await deleteQuestion(id);
			message.success("Question deleted");
			fetchQuestions();
		} catch {
			message.error("Failed to delete question");
		}
	};

	const handleSubmit = async (values) => {
		try {
			const payload = {
				...values,
				type: "TEXT", // 👈 force default
			};

			if (editingQuestion) {
				await updateQuestion(editingQuestion.id, payload);
				message.success("Question updated");
			} else {
				await createQuestion({ questions: [payload] });
				message.success("Question created");
			}

			setModalOpen(false);
			fetchQuestions();
		} catch {
			message.error("Failed to save question");
		}
	};

	const columns = [
		{
			title: "Sr. No.",
			key: "sr_no",
			width: 80,
			render: (_, __, index) => index + 1,
		},
		{
			title: "Question",
			dataIndex: "question",
		},
		// {
		// 	title: "Type",
		// 	dataIndex: "type",
		// 	render: (type) => <Tag color="blue">{type}</Tag>,
		// },
		{
			title: "Actions",
			render: (_, record) => (
				<Space>
					<Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
					<Popconfirm
						title="Delete this question?"
						onConfirm={() => handleDelete(record.id)}
					>
						<Button danger icon={<DeleteOutlined />} />
					</Popconfirm>
				</Space>
			),
		},
	];

	return (
		<Box>
			{/* HEADER */}
			<Paper
				variant="outlined"
				sx={{
					p: 2.5,
					mb: 2.5,
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
							QUOTE MANAGEMENT
						</Typography>
						<Typography
							className="page-sub-title"
							sx={{
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap",
							}}
						>
							Manage quote form questions
						</Typography>
					</Box>

					<MuiButton
						variant="contained"
						disableElevation
						startIcon={<Plus size={18} />}
						onClick={handleAdd}
						sx={{
							height: 44,
							px: 2.5,
							borderRadius: "8px",
							textTransform: "none",
							fontWeight: 600,
							whiteSpace: "nowrap",
							flexShrink: 0,
						}}
					>
						Add Question
					</MuiButton>
				</Box>
			</Paper>

			<Table
				rowKey="id"
				columns={columns}
				dataSource={questions}
				loading={loading}
				bordered
				size="middle"
			/>

			<QuestionModal
				open={modalOpen}
				onCancel={() => setModalOpen(false)}
				onSubmit={handleSubmit}
				editingQuestion={editingQuestion}
			/>
		</Box>
	);
};

export default QuoteQuestions;