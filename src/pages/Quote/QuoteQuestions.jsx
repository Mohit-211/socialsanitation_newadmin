import { useEffect, useState } from "react";
import { Table, Button, Space, Popconfirm, message } from "antd";
import { Pencil, Plus, Trash2 } from "lucide-react";
import QuestionModal from "./QuestionModal";
import PageHeader from "../../components/PageHeader";
import IconAction from "../../components/IconAction";
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
		} catch {
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
		{
			title: "Actions",
			render: (_, record) => (
				<Space>
					<IconAction
						icon={Pencil}
						title="Edit Question"
						onClick={() => handleEdit(record)}
					/>
					<Popconfirm
						title="Delete this question?"
						onConfirm={() => handleDelete(record.id)}
					>
						<IconAction icon={Trash2} title="Delete Question" danger />
					</Popconfirm>
				</Space>
			),
		},
	];

	return (
		<div>
			{/* HEADER */}
			<PageHeader
				title="QUOTE MANAGEMENT"
				subtitle="Manage quote form questions"
				actions={
					<Button
						type="primary"
						size="large"
						icon={<Plus size={16} />}
						onClick={handleAdd}
					>
						Add Question
					</Button>
				}
			/>

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
		</div>
	);
};

export default QuoteQuestions;