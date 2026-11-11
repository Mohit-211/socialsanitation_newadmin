import { useEffect, useState } from "react";
import { Table, Select, message, Divider, Drawer, Tag, Modal, Spin, Input, type TableColumnsType, type TablePaginationConfig, type TableProps } from "antd";
import dayjs from "@/lib/dayjs";
import { Clock, Eye, FileImage, Search, ShoppingCart, User } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import IconAction from "@/components/IconAction";
import "./RestockRequestsPage.scss";

import { answerRestockRequest, listRestockRequests } from "@/services/api/productApi";
import { formatDate, formatDateTime } from "@/utils/datetime";
import type { RestockRequest, RestockStatus } from "@/types";

/** A request, numbered in the list. */
type RequestRow = RestockRequest & { index: number };


const RestockRequestsPage = () => {
    const [data, setData] = useState<RequestRow[]>([]);
    const [userBackupData, setUserBackupData] = useState<RequestRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [openDrawer, setOpenDrawer] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<RequestRow | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    // State for Modal/Lightbox
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalImageSrc, setModalImageSrc] = useState("");

    const [tableParams, setTableParams] = useState<{ pagination: TablePaginationConfig }>({
        pagination: { current: 1, pageSize: 100 },
    });

    const handleTableChange: TableProps<RequestRow>["onChange"] = (pagination) => {
        setTableParams({
            pagination,
        });
        // In a real-world scenario, you would fetch data based on the new pagination/sorting/filtering here
    };

    const handleStatusChange = async (id: number, status: RestockStatus) => {
        try {
            await answerRestockRequest(id, status);
            message.success("Status updated successfully");
            getData();
        } catch {
            message.error("Error updating status");
        }
    };

    const showImageModal = (url: string) => {
        setModalImageSrc(url);
        setIsModalVisible(true);
    };

    const getStatusTag = (status: string) => {
        let color;
        if (status === "Pending") color = "warning";
        else if (status === "Approved") color = "success";
        else if (status === "Rejected") color = "error";
        else color = "default";

        return (
            <Tag color={color} className="inventory-request__status-tag">
                {status.toUpperCase()}
            </Tag>
        );
    };

    // antd hides a column below its `responsive` breakpoints by itself.
    const columns: TableColumnsType<RequestRow> = [
        {
            title: "S.No.",
            dataIndex: "index",
            width: "5%",
            responsive: ['md'],
        },
        {
            title: "Employee Name",
            dataIndex: ["employee", "name"],
            width: "20%",
            filterIcon: <User size={14} />, // Add filter icon
            onFilter: (value, record) =>
                Boolean(record.employee?.name?.toLowerCase().includes(String(value).toLowerCase())),
            render: (text: string | null) => text || "--",
        },
        {
            title: "Product",
            dataIndex: ["product", "name"],
            width: "25%",
            filterIcon: <ShoppingCart size={14} />, // Add filter icon
            onFilter: (value, record) =>
                Boolean(record.product?.name?.toLowerCase().includes(String(value).toLowerCase())),
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
            render: (date: string) => formatDate(date),
            sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
            responsive: ['lg'],
        },
        {
            title: "Status",
            dataIndex: "status",
            width: "12%",
            render: (status: RestockStatus) => getStatusTag(status),
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
            render: (value: RestockStatus, record) => (
                <Select<RestockStatus>
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
            render: (_value, record) => (
                <IconAction
                    icon={Eye}
                    title="View Request"
                    onClick={() => {
                        setSelectedRequest(record);
                        setOpenDrawer(true);
                    }}
                />
            ),
        },
    ];

    const getData = async () => {
        try {
            setLoading(true);
            const result = await listRestockRequests({ page: 1, limit: 500 });
            const newData = (result.data.data?.items || []).map((item, index) => ({
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

    const onSearch = (text: string) => {
        setSearchTerm(text);
        const lower = text.toLowerCase();
        if (!lower) {
            setData(userBackupData);
            return;
        }

        const filtered = userBackupData.filter(
            (item) =>
                item.employee?.name
                    ?.toLowerCase()
                    .includes(lower) ||
                item.employee?.email?.toLowerCase().includes(lower) ||
                item.product?.name?.toLowerCase().includes(lower) ||
                item.id?.toString().includes(lower) // Search by ID too
        );
        setData(filtered);
    };

    return (
        <div className="inventory-request">
            {/* HEADER */}
            <PageHeader
                title="INVENTORY REQUESTS"
                subtitle="Manage product restock requests and status updates"
                actions={
                    <Input
                        allowClear
                        size="large"
                        prefix={<Search size={16} color="var(--color-text-subtle)" />}
                        placeholder="Search by Employee, Product, or ID"
                        className="inventory-request__search"
                        value={searchTerm}
                        onChange={(e) => onSearch(e.target.value)}
                    />
                }
            />

            {/* Main Table */}
            <Table
                className="inventory-request__table"
                columns={columns}
                rowKey={(record) => record.id}
                dataSource={data}
                loading={loading}
                pagination={tableParams.pagination}
                onChange={handleTableChange}
                locale={{
                    emptyText: loading ? <Spin /> : 'No Inventory Requests Found',
                }}
            />

            {/* Request Details Drawer */}
            <Drawer
                title={<span className="inventory-request__drawer-title">Request Details</span>}
                size={selectedRequest?.images?.length ? 550 : 400} // Dynamic width
                placement="right"
                onClose={() => setOpenDrawer(false)}
                open={openDrawer}
                styles={{ body: { padding: 0 } }}
            >
                {selectedRequest && (
                    <div className="inventory-request__details">

                        {/* Request Summary */}
                        <div className="inventory-request__summary">
                            <p className="inventory-request__summary-label">REQUEST ID</p>
                            <h2 className="inventory-request__summary-id">
                                #{selectedRequest.id}
                            </h2>
                            <div className="inventory-request__summary-date">
                                <Clock size={14} />
                                Requested on: {formatDateTime(selectedRequest.created_at)}
                            </div>
                        </div>

                        {/* Employee Details Section */}
                        <h3 className="inventory-request__section-title inventory-request__section-title--employee">
                            <User size={16} /> Employee Information
                        </h3>

                        <div className="inventory-request__section-body">
                            <p>Name: {selectedRequest?.employee?.name || 'N/A'}</p>
                            <p>Email: {selectedRequest?.employee?.email || 'N/A'}</p>
                        </div>

                        <Divider style={{ margin: '10px 0' }} />

                        {/* Product Details */}
                        <h3 className="inventory-request__section-title inventory-request__section-title--product">
                            <ShoppingCart size={16} /> Product Information
                        </h3>

                        <div className="inventory-request__section-body">
                            <p>Product: {selectedRequest?.product?.name || 'N/A'}</p>
                            <p>Requested Quantity: <Tag color="processing" className="inventory-request__qty-tag">{selectedRequest?.requested_quantity}</Tag></p>

                            <p className="inventory-request__current-status">
                                Current Status: {getStatusTag(selectedRequest.status)}
                            </p>
                        </div>

                        <Divider style={{ margin: '10px 0' }} />

                        {/* Notes Section */}
                        <h3 className="inventory-request__section-title inventory-request__section-title--notes">
                            Notes
                        </h3>

                        <div className="inventory-request__notes">
                            {selectedRequest?.note || (
                                <span className="inventory-request__muted inventory-request__muted--italic">No notes provided by the requester.</span>
                            )}
                        </div>

                        <Divider style={{ margin: '20px 0' }} />

                        {/* Attachments Section */}
                        <h3 className="inventory-request__section-title inventory-request__section-title--attachments">
                            <FileImage size={16} /> Attachments ({selectedRequest?.images?.length || 0})
                        </h3>

                        {selectedRequest?.images?.length ? (
                            <div className="inventory-request__attachments">
                                {selectedRequest.images.map((img) => (
                                    <div
                                        key={img.id}
                                        onClick={() => showImageModal(img.url)} // Click handler to open modal
                                        className="inventory-request__attachment"
                                    >
                                        <img
                                            src={img.url}
                                            alt="attachment"
                                            crossOrigin="anonymous"
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="inventory-request__muted inventory-request__muted--indented">No attachments uploaded for this request.</p>
                        )}
                    </div>
                )}
            </Drawer>

            {/* Full-Screen Image Modal (Lightbox) */}
            <Modal
                open={isModalVisible}
                title="Attachment View"
                onCancel={() => setIsModalVisible(false)}
                footer={null}
                centered
                width="80vw"
                styles={{ body: { padding: 0 } }}
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
        </div>
    );
};

export default RestockRequestsPage;
