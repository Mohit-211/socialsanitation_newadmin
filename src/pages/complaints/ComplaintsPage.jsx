import { useState } from "react";
import { useNavigate } from "react-router";
import { Button, Drawer, Empty, Image, Select, Space, Table, Tooltip, message } from "antd";
import { Eye } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import IconAction from "@/components/IconAction";
import { usePagedList } from "@/hooks/usePagedList";
import { listReports, setReportStatus } from "@/services/api/reportApi";
import { errorMessage } from "@/services/apiResult";
import { formatDate, formatDateTime } from "@/utils/datetime";
import "./ComplaintsPage.scss";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Open" },
  { value: "COMPLETED", label: "Resolved" },
];

const Photos = ({ images }) =>
  images?.length ? (
    <Image.PreviewGroup>
      <div className="report-photos">
        {images.map((image) => (
          <Image key={image.id} src={image.url} width={120} height={120} className="report-photos__image" />
        ))}
      </div>
    </Image.PreviewGroup>
  ) : (
    <p className="text-secondary">No photos.</p>
  );

// Reports about visits: who sent them and why, marked resolved once handled.
const ComplaintsPage = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(null);
  const list = usePagedList((query) => listReports(query), { limit: 20, errorText: "Couldn't load the reports" });

  const changeStatus = async (report, status) => {
    try {
      await setReportStatus(report.id, status);
      list.setItems((rows) => rows.map((row) => (row.id === report.id ? { ...row, status } : row)));
      message.success(status === "COMPLETED" ? "Marked resolved" : "Opened again");
    } catch (error) {
      message.error(errorMessage(error, "Couldn't change the status"));
    }
  };

  const columns = [
    { title: "Sent", dataIndex: "created_at", render: (date) => formatDate(date) },
    { title: "From", key: "from", render: (_, report) => report.reported_by?.name || report.reported_by?.email || "—" },
    {
      title: "Visit",
      key: "visit",
      render: (_, report) =>
        report.booking ? (
          <Button type="link" className="table-link" onClick={() => navigate(`/viewBooking/${report.booking.id}`)}>
            {[report.booking.service?.name, formatDate(report.booking.date)].filter(Boolean).join(" · ")}
          </Button>
        ) : (
          "—"
        ),
    },
    {
      title: "Reason",
      dataIndex: "reason",
      render: (reason) =>
        reason ? (
          <Tooltip title={reason}>
            <span className="reports__reason">{reason}</span>
          </Tooltip>
        ) : (
          "—"
        ),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status, report) => (
        <Select
          value={status}
          options={STATUS_OPTIONS}
          style={{ width: 130 }}
          onChange={(value) => changeStatus(report, value)}
        />
      ),
    },
    {
      title: "",
      key: "open",
      width: 60,
      render: (_, report) => <IconAction icon={Eye} title="Open" onClick={() => setOpen(report)} />,
    },
  ];

  return (
    <>
      <PageHeader title="REPORTS" subtitle="What clients and employees reported about a visit" />
      <Table rowKey="id" size="middle" columns={columns} scroll={{ x: "max-content" }} {...list.tableProps} />
      <Drawer open={Boolean(open)} title="Report" size="large" onClose={() => setOpen(null)}>
        {open && (
          <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
            <div>
              <strong>{open.reported_by?.name || open.reported_by?.email || "Someone"}</strong>
              <div className="text-secondary">{formatDateTime(open.created_at)}</div>
            </div>
            <div>
              <span className="field-label">Reason</span>
              <p>{open.reason || "—"}</p>
            </div>
            {open.booking && (
              <div>
                <span className="field-label">Visit</span>
                <p>{[open.booking.service?.name, formatDate(open.booking.date)].filter(Boolean).join(" · ")}</p>
              </div>
            )}
            <div>
              <span className="field-label">Photos Sent with the Report</span>
              <Photos images={open.images} />
            </div>
            <div>
              <span className="field-label">Photos of the Visit</span>
              {open.booking ? <Photos images={open.booking.images} /> : <Empty description="No visit linked." />}
            </div>
          </Space>
        )}
      </Drawer>
    </>
  );
};

export default ComplaintsPage;
