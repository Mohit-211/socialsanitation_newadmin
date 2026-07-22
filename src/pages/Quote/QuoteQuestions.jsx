/** @format */
import React, { useEffect, useState } from "react";
import { Table, Button, Space, Tag, Popconfirm, message } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
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
		<>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: 16,
				}}
			>
				<div>
					<h3 className="page-title">QUOTE MANAGEMENT</h3>
					<p className="page-sub-title">Manage quote form questions</p>
				</div>

				<Space>
					<Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
						Add Question
					</Button>
				</Space>
			</div>

			<Table
				rowKey="id"
				columns={columns}
				dataSource={questions}
				loading={loading}
			/>

			<QuestionModal
				open={modalOpen}
				onCancel={() => setModalOpen(false)}
				onSubmit={handleSubmit}
				editingQuestion={editingQuestion}
			/>
		</>
	);
};

export default QuoteQuestions;
