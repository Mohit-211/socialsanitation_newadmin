import dayjs from "@/lib/dayjs";
import { useEffect, useState } from "react";
import { Table, Button, Tag, message } from "antd";
import { Eye } from "lucide-react";
import QuoteDetailsModal from "./QuoteDetailsModal";
import PageHeader from "../../components/PageHeader";
import {
	getQuoteRequests,
	updateQuoteStatus,
} from "../../services/Api/quoteApi";

const QuoteRequests = () => {
	const [data, setData] = useState([]);
	const [loading, setLoading] = useState(false);
	const [selectedQuote, setSelectedQuote] = useState(null);
	const [modalOpen, setModalOpen] = useState(false);

	const fetchRequests = async () => {
		try {
			setLoading(true);
			const res = await getQuoteRequests();
			setData(res.data.data || res.data);
		} catch {
			message.error("Failed to load quote requests");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchRequests();
	}, []);

	const handleView = (record) => {
		setSelectedQuote(record);
		setModalOpen(true);
	};

	const handleUpdateStatus = async (values) => {
		try {
			await updateQuoteStatus(selectedQuote.id, values);
			message.success("Quote updated successfully");
			setModalOpen(false);
			fetchRequests();
		} catch {
			message.error("Failed to update quote");
		}
	};

	const columns = [
		{
			title: "Sr. No.",
			render: (_, __, index) => index + 1,
			width: 80,
		},
		{
			title: "Customer",
			render: (_, record) => record.user?.user_profile?.name,
		},
		{
			title: "Email",
			render: (_, record) => record.user?.email,
		},
		{
			title: "Status",
			dataIndex: "status",
			render: (status) => {
				let color = "processing";

				if (status === "accepted") color = "success";
				if (status === "rejected") color = "error";

				return <Tag color={color}>{status.toUpperCase()}</Tag>;
			},
		},

		{
			title: "Quoted Price",
			dataIndex: "quoted_price",
			render: (price) => (price ? `$${price}` : "-"),
		},
		{
			title: "Submitted At",
			dataIndex: "created_at",
			render: (date) => (date ? dayjs(date).format("MM/DD/YYYY HH:mm A") : "-"),
		},

		{
			title: "Actions",
			render: (_, record) => (
				<Button icon={<Eye size={16} />} onClick={() => handleView(record)}>
					View
				</Button>
			),
		},
	];

	return (
		<div>
			{/* HEADER */}
			<PageHeader
				title="QUOTE REQUESTS"
				subtitle="View and manage submitted quotes"
			/>

			<Table
				rowKey="id"
				columns={columns}
				dataSource={data}
				loading={loading}
				bordered
				size="middle"
			/>

			<QuoteDetailsModal
				open={modalOpen}
				onCancel={() => setModalOpen(false)}
				quote={selectedQuote}
				onUpdateStatus={handleUpdateStatus}
			/>
		</div>
	);
};

export default QuoteRequests;