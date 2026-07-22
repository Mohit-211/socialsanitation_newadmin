/** @format */
import dayjs from "@/lib/dayjs";
import React, { useEffect, useState } from "react";
import { Table, Button, Space, Tag, message } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import QuoteDetailsModal from "./QuoteDetailsModal";
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
				let color = "blue";

				if (status === "accepted") color = "green";
				if (status === "rejected") color = "red";

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
				<Button icon={<EyeOutlined />} onClick={() => handleView(record)}>
					View
				</Button>
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
					<h3 className="page-title">QUOTE REQUESTS</h3>
					<p className="page-sub-title">View and manage submitted quotes</p>
				</div>
			</div>

			<Table
				rowKey="id"
				columns={columns}
				dataSource={data}
				loading={loading}
			/>

			<QuoteDetailsModal
				open={modalOpen}
				onCancel={() => setModalOpen(false)}
				quote={selectedQuote}
				onUpdateStatus={handleUpdateStatus}
			/>
		</>
	);
};

export default QuoteRequests;
