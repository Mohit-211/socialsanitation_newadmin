/** @format */

import React, { useEffect, useState } from "react";
import {  Table } from "antd";
import { useNavigate } from "react-router";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import dayjs from "@/lib/dayjs";
import { GetContactUs } from "../../services/Api/ContentApi";

const ContactUs = () => {
	const navigate = useNavigate();
	const [data, setData] = useState([]);
	const [userBackupData, setUserBackupData] = useState([]);
	const [loading, setLoading] = useState(false);
	const [tableParams, setTableParams] = useState({
		pagination: {
			current: 1,
			pageSize: 100,
		},
		sortField: null,
		sortOrder: null,
	});

	const columns = [
		{
			title: "S.No.",
			dataIndex: "index",
			sorter: (a, b) => a.index - b.index,
			width: "5%",
		},
		{
			title: "Name",
			dataIndex:  "name",
			width: "10%",
		},
        {
			title: "Email",
			dataIndex:  "email",
			width: "20%",
		},
		{
			title: "Message",
			dataIndex: "message",
			width: "40%",
		},
     
		{
			title: "Date",
			dataIndex: "created_at",
			width: "30%",
			render: (date) => dayjs(date).format("MM-DD-YYYY HH:mm A"),
		},
		
	];

	// Get all support queries
	const getData = async (params = {}) => {
		try {
			setLoading(true);
			let result = await GetContactUs(localStorage.getItem("adminToken"), params);
			const newData = result.data.data.map((item, index) => ({
				...item,
				index: index + 1,
			}));
			setData(newData);
			setUserBackupData(newData);
		} catch (e) {
			console.log(e);
			if (e.response && e.response.status === 403) {
				navigate("/error401");
				console.log("Access denied. You do not have the required permissions.");
			} else {
				console.log("Error loading data. Please try again later.");
			}
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		getData({
			page: tableParams.pagination.current,
			pageSize: tableParams.pagination.pageSize,
			sortField: tableParams.sortField,
			sortOrder: tableParams.sortOrder,
		});
	}, [tableParams]);

	const handleTableChange = (pagination, filters, sorter) => {
		setTableParams({
			pagination,
			filters,
			sortField: sorter.field,
			sortOrder: sorter.order,
		});
	};

	const onSearch = (searchField) => {
		const LIST = [...userBackupData];
		const searchList = LIST.filter(
			(item) =>
				item?.name.toLowerCase().includes(searchField.toLowerCase())
		);
		setData(searchList);
	};


	return (
		<Box>
			<Box
				display="flex"
				justifyContent="space-between"
				alignItems="center"
				marginBottom="20px"
			>
				<div>
					<h3 className="page-title">CONTACT US MANAGEMENT</h3>
					<p className="page-sub-title">Manage User Queries</p>
				</div>
				<Box display="flex" justifyContent="space-between" alignItems="center">
					<Box>
						<span className="p-input-icon-left">
							<i className="pi pi-search" />
							<InputText
								type="search"
								onChange={(e) => {
									onSearch(e.target.value);
								}}
								placeholder="Search..."
							/>
						</span>
					</Box>
				</Box>
			</Box>
			<Table
				columns={columns}
				rowKey={(record) => record.id}
				dataSource={data}
				pagination={tableParams.pagination}
				loading={loading}
				onChange={handleTableChange}
			/>
		</Box>
	);
};

export default ContactUs;
