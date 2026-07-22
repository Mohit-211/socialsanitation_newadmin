/** @format */

import React, { useEffect, useState } from "react";
import { Table, Select, message, Divider, Drawer, Tag, Modal, Spin } from "antd";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import dayjs from "@/lib/dayjs";
import Button from "@mui/material/Button";
import { SearchOutlined, EyeOutlined, UserOutlined, ClockCircleOutlined, ShoppingCartOutlined, FileImageOutlined } from "@ant-design/icons"; // Import relevant icons

import {
    GetAllRequestsByAdmin,
    UpdateRequestStatus,
} from "../../services/Api/Product";

const IMAGE_BASE_URL = "https://node.socialsanitation.com:3000"; // Define the base URL once

const InventoryRequest = () => {
    const [data, setData] = useState([]);
    const [userBackupData, setUserBackupData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [openDrawer, setOpenDrawer] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);

    // State for Modal/Lightbox
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalImageSrc, setModalImageSrc] = useState("");

    const [tableParams, setTableParams] = useState({
        pagination: { current: 1, pageSize: 100 },
    });

    const handleTableChange = (pagination) => {
        setTableParams({
            pagination,
        });
        // In a real-world scenario, you would fetch data based on the new pagination/sorting/filtering here
    };

    const handleStatusChange = async (id, status) => {
        try {
            await UpdateRequestStatus(id, { status });
            message.success("Status updated successfully");
            getData();
        } catch (error) {
            message.error("Error updating status");
        }
    };

    const showImageModal = (fileUri, fileName) => {
        setModalImageSrc(`${IMAGE_BASE_URL}${fileUri}/${fileName}`);
        setIsModalVisible(true);
    };

    const getStatusTag = (status) => {
        let color = "";
        if (status === "Pending") color = "orange";
        else if (status === "Approved") color = "green";
        else if (status === "Rejected") color = "red";
        else color = "default";

        return (
            <Tag color={color} style={{ fontWeight: 600, minWidth: '70px', textAlign: 'center' }}>
                {status.toUpperCase()}
            </Tag>
        );
    };

    const columns = [
        {
            title: "S.No.",
            dataIndex: "index",
            width: "5%",
            responsive: ['md'],
        },
        {
            title: "Employee Name",
            dataIndex: ["requested_user", "user_profile", "name"],
            width: "20%",
            filterIcon: <UserOutlined />, // Add filter icon
            onFilter: (value, record) =>
                record.requested_user?.user_profile?.name?.toLowerCase().includes(value.toLowerCase()),
            render: (text) => text || "--",
        },
        {
            title: "Product",
            dataIndex: ["requested_product", "name"],
            width: "25%",
            filterIcon: <ShoppingCartOutlined />, // Add filter icon
            onFilter: (value, record) =>
                record.requested_product?.name?.toLowerCase().includes(value.toLowerCase()),
        },
        {
            title: "Requested Qty",
            dataIndex: "requested_quantity",
            width: "10%",
            sorter: (a, b) => a.requested_quantity - b.requested_quantity,
        },
        {
            title: "Requested At",
            dataIndex: "created_at",
            width: "15%",
            render: (date) => dayjs(date).format("MMM D, YYYY"),
            sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
            responsive: ['lg'],
        },
        {
            title: "Status",
            dataIndex: "status",
            width: "12%",
            render: (status) => getStatusTag(status),
            filters: [
                { text: 'Pending', value: 'Pending' },
                { text: 'Approved', value: 'Approved' },
                { text: 'Rejected', value: 'Rejected' },
            ],
            onFilter: (value, record) => record.status === value,
        },
        {
            title: "Update Status",
            dataIndex: "status",
            width: "15%",
            render: (value, record) => (
                <Select
                    value={value}
                    style={{ width: 120 }}
                    onChange={(val) => handleStatusChange(record.id, val)}
                >
                    <Select.Option value="Pending">Pending</Select.Option>
                    <Select.Option value="Approved">Approved</Select.Option>
                    <Select.Option value="Rejected">Rejected</Select.Option>
                </Select>
            ),
        },
        {
            title: "Action",
            dataIndex: "action",
            width: "10%",
            render: (_, record) => (
                <Button
                    icon={<EyeOutlined />}
                    // label="View"
                    className="p-button-outlined p-button-sm p-button-info"
                    						style={{ margin: 0, borderRadius: "25px" }}
                    onClick={() => {
                        setSelectedRequest(record);
                        setOpenDrawer(true);
                    }}
                />
            ),
        },
    ].filter(col => !col.responsive || col.responsive.includes('md')); // Basic responsive filter for simplicity

    const getData = async () => {
        try {
            setLoading(true);
            const result = await GetAllRequestsByAdmin();
            const newData = result.data.data.map((item, index) => ({
                ...item,
                index: index + 1,
            }));
            setData(newData);
            setUserBackupData(newData);
        } catch (e) {
            console.error("Error fetching data:", e);
            message.error("Failed to fetch inventory requests.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getData();
    }, []);

    const onSearch = (text) => {
        const lower = text.toLowerCase();
        if (!lower) {
            setData(userBackupData);
            return;
        }

        const filtered = userBackupData.filter(
            (item) =>
                item.requested_user?.user_profile?.name
                    ?.toLowerCase()
                    .includes(lower) ||
                item.requested_user?.email?.toLowerCase().includes(lower) ||
                item.requested_product?.name?.toLowerCase().includes(lower) ||
                item.id?.toString().includes(lower) // Search by ID too
        );
        setData(filtered);
    };

    return (
        <Box className="inventory-request-container" >

            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                marginBottom="24px"
                flexWrap="wrap"
                gap="16px"
            >
                <div>
                    <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 700 }}>INVENTORY REQUESTS</h1>
                    <p style={{ margin: "4px 0 0", color: "#606060" }}>Manage product restock requests and status updates.</p>
                </div>

                <span className="p-input-icon-left">
                    <SearchOutlined style={{ position: 'absolute', top: '50%', left: '10px', transform: 'translateY(-50%)', color: '#999' }} />
                    <InputText
                        type="search"
                        onChange={(e) => onSearch(e.target.value)}
                        placeholder="Search by Employee, Product, or ID"
                        style={{ paddingLeft: '35px', borderRadius: '6px', minWidth: '250px' }}
                    />
                </span>
            </Box>

            {/* --- Main Table --- */}
            <Table
                columns={columns}
                rowKey={(record) => record.id}
                dataSource={data}
                loading={loading}
                pagination={tableParams.pagination}
                onChange={handleTableChange}
                style={{
                    border: "1px solid #e8e8e8",
                    borderRadius: "8px",
                    overflow: "hidden",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)"
                }}
                locale={{
                    emptyText: loading ? <Spin /> : 'No Inventory Requests Found',
                }}
            />

            {/* --- Request Details Drawer --- */}
            <Drawer
                title={<span style={{ fontWeight: 700 }}>Request Details</span>}
                width={selectedRequest?.product_request_attachments?.length ? 550 : 400} // Dynamic width
                placement="right"
                onClose={() => setOpenDrawer(false)}
                open={openDrawer}
                bodyStyle={{ padding: "0" }}
            >
                {selectedRequest && (
                    <div style={{ padding: "24px" }}>

                        {/* Request Summary */}
                        <div style={{ padding: "16px", background: "#f5f5f5", borderRadius: "8px", marginBottom: "20px" }}>
                            <p style={{ margin: 0, fontSize: "12px", color: "#606060" }}>REQUEST ID</p>
                            <h2 style={{ margin: "4px 0 10px", fontSize: "20px", fontWeight: 700 }}>
                                #{selectedRequest.id}
                            </h2>
                            <div>
                                <ClockCircleOutlined style={{ marginRight: "8px" }} />
                                Requested on:{dayjs(selectedRequest.created_at).format("MMMM D, YYYY [at] h:mm A")}
                            </div>
                        </div>


                        {/* Employee Details Section */}
                        <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px", borderLeft: '4px solid #1890ff', paddingLeft: '8px' }}>
                            <UserOutlined style={{ marginRight: '8px' }} /> Employee Information
                        </h3>

                        <div style={{ marginBottom: "20px", paddingLeft: '12px' }}>
                            <p style={{ margin: '6px 0' }}>Name: {selectedRequest?.requested_user?.user_profile?.name || 'N/A'}</p>
                            <p style={{ margin: '6px 0' }}>Email: {selectedRequest?.requested_user?.email || 'N/A'}</p>
                        </div>

                        <Divider style={{ margin: '10px 0' }} />

                        {/* Product Details */}
                        <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px", borderLeft: '4px solid #52c41a', paddingLeft: '8px' }}>
                            <ShoppingCartOutlined style={{ marginRight: '8px' }} /> Product Information
                        </h3>

                        <div style={{ marginBottom: "20px", paddingLeft: '12px' }}>
                            <p style={{ margin: '6px 0' }}>Product: {selectedRequest?.requested_product?.name || 'N/A'}</p>
                            <p style={{ margin: '6px 0' }}>Requested Quantity: <Tag color="blue" style={{ fontSize: '14px', padding: '4px 8px' }}>{selectedRequest?.requested_quantity}</Tag></p>

                            <p style={{ margin: "10px 0 0" }}>
                                Current Status: {getStatusTag(selectedRequest.status)}
                            </p>
                        </div>

                        <Divider style={{ margin: '10px 0' }} />

                        {/* Notes Section */}
                        <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px", borderLeft: '4px solid #faad14', paddingLeft: '8px' }}>
                            Notes
                        </h3>

                        <div
                            style={{
                                background: "#fffbe6",
                                padding: "12px",
                                borderRadius: "8px",
                                border: "1px solid #ffe58f",
                                minHeight: "60px",
                                lineHeight: "1.6",
                                color: '#333'
                            }}
                        >
                            {selectedRequest?.note || (
                                <span style={{ color: "#888", fontStyle: 'italic' }}>No notes provided by the requester.</span>
                            )}
                        </div>

                        <Divider style={{ margin: '20px 0' }} />

                        {/* Attachments Section */}
                        <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px", borderLeft: '4px solid #eb2f96', paddingLeft: '8px' }}>
                            <FileImageOutlined style={{ marginRight: '8px' }} /> Attachments ({selectedRequest?.product_request_attachments?.length || 0})
                        </h3>

                        {selectedRequest?.product_request_attachments?.length ? (
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: "15px",
                                }}
                            >
                                {selectedRequest.product_request_attachments.map((img) => (
                                    <div
                                        key={img.id}
                                        onClick={() => showImageModal(img.file_uri, img.file_name)} // Click handler to open modal
                                        style={{
                                            overflow: "hidden",
                                            borderRadius: "8px",
                                            border: "2px solid #ddd",
                                            cursor: "pointer",
                                            transition: "transform 0.3s, box-shadow 0.3s",
                                        }}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.transform = "scale(1.03)";
                                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.transform = "scale(1)";
                                            e.currentTarget.style.boxShadow = "none";
                                        }}
                                    >
                                        <img
                                            src={`${IMAGE_BASE_URL}${img.file_uri}/${img.file_name}`}
                                            alt="attachment"
                                            crossOrigin="anonymous"
                                            style={{
                                                width: "100%",
                                                height: "150px", // Increased size for better preview
                                                objectFit: "cover",
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: "#888", paddingLeft: '12px' }}>No attachments uploaded for this request.</p>
                        )}
                    </div>
                )}
            </Drawer>

            {/* --- Full-Screen Image Modal (Lightbox) --- */}
            <Modal
                visible={isModalVisible}
                title="Attachment View"
                onCancel={() => setIsModalVisible(false)}
                footer={null}
                centered
                width="80vw"
                bodyStyle={{ padding: 0 }}
            >
                {modalImageSrc && (
                    <img
                        alt="Full-Screen Attachment"
                        style={{ width: '100%', display: 'block' }}
                        src={modalImageSrc}
                        crossOrigin="anonymous"
                    />
                )}
            </Modal>
        </Box>
    );
};

export default InventoryRequest;