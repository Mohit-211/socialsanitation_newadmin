import { useState } from "react";
import { useNavigate } from "react-router";
import { Alert, Button, Card, Checkbox, Descriptions, Empty, Image, Input, Modal, Space, Spin, Tag, message } from "antd";
import { ArrowLeft, Ban, Pencil, Repeat, Trash2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import StatusTag from "@/components/StatusTag";
import {
  declineCancelRequest,
  deleteBooking,
  getBooking,
  getBookingChecklists,
  updateBooking,
} from "@/services/api/bookingApi";
import { dataOf, errorMessage, itemsOf } from "@/services/apiResult";
import { useApiQuery } from "@/hooks/useApiQuery";
import { PERMISSION, useCan } from "@/lib/session";
import { formatDate, formatDateTime, formatTime } from "@/utils/datetime";
import { CREW_JOBS } from "./bookingForm";
import "./bookings.scss";
import { useRouteParam } from "@/hooks/useRouteParam";
import type { VisitPhoto } from "@/types";

const OPEN_STATUSES = new Set(["PENDING", "ACCEPTED", "ONGOING"]);

// One visit: when and where, who works it, photos, checklists, and what the
// office does next (edit, cancel, answer the client's cancel request).
const BookingDetailsPage = () => {
  const id = useRouteParam();
  const navigate = useNavigate();
  const canDelete = useCan(PERMISSION.DELETE_RECORDS);
  const [busy, setBusy] = useState(false);

  const { data: visit, loading, reload } = useApiQuery(() => getBooking(id).then(dataOf), [id], {
    errorText: "Couldn't load the visit",
  });
  const { data: checklists } = useApiQuery(() => getBookingChecklists(id).then(itemsOf), [id], { initial: [] });

  const run = async (action: () => Promise<unknown>, success: string, failure: string) => {
    setBusy(true);
    try {
      await action();
      message.success(success);
      reload();
    } catch (error) {
      message.error(errorMessage(error, failure));
    } finally {
      setBusy(false);
    }
  };

  const cancelVisit = (presetReason?: string | null) => {
    let reason = presetReason || "";
    Modal.confirm({
      title: "Cancel this visit?",
      content: (
        <Input.TextArea
          rows={2}
          defaultValue={reason}
          placeholder="Reason (the client sees it)"
          onChange={(event) => (reason = event.target.value)}
        />
      ),
      okText: "Cancel Visit",
      okType: "danger",
      cancelText: "Keep It",
      onOk: () =>
        run(
          () => updateBooking(id, { status: "CANCELLED", cancellation_reason: reason.trim() || undefined }),
          "Visit cancelled; the client hears in the app",
          "Couldn't cancel the visit",
        ),
    });
  };

  const confirmDelete = () =>
    Modal.confirm({
      title: "Delete this visit?",
      content: visit?.series_id ? "Its date isn't booked again for the series." : "This can't be undone.",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await deleteBooking(id);
          message.success("Visit deleted");
          navigate("/bookings");
        } catch (error) {
          message.error(errorMessage(error, "Couldn't delete the visit"));
        }
      },
    });

  if (loading && !visit) {
    return (
      <div className="page-loader">
        <Spin size="large" />
      </div>
    );
  }
  if (!visit) return <Empty description="This visit couldn't be loaded" />;

  const { client, guest } = visit;
  const request = visit.cancel_request?.open ? visit.cancel_request : null;
  const photos = (kind: VisitPhoto["kind"]) => (visit.photos || []).filter((photo) => photo.kind === kind);

  return (
    <div className="booking-details">
      <PageHeader
        title={`VISIT ${visit.number || visit.id}`}
        subtitle={
          <Space size={8} wrap>
            <StatusTag code={visit.status} />
            {visit.series_id && <Tag icon={<Repeat size={12} />}>Repeating</Tag>}
            <span>{visit.title}</span>
          </Space>
        }
        actions={
          <Space wrap>
            {OPEN_STATUSES.has(visit.status) && (
              <Button icon={<Pencil size={16} />} onClick={() => navigate(`/editBooking/${id}`)}>
                Edit
              </Button>
            )}
            {visit.series_id && (
              <Button icon={<Repeat size={16} />} onClick={() => navigate(`/booking-series/${visit.series_id}`)}>
                Series
              </Button>
            )}
            {OPEN_STATUSES.has(visit.status) && !request && (
              <Button icon={<Ban size={16} />} onClick={() => cancelVisit()} disabled={busy}>
                Cancel Visit
              </Button>
            )}
            {canDelete && (
              <Button danger icon={<Trash2 size={16} />} onClick={confirmDelete}>
                Delete
              </Button>
            )}
            <Button icon={<ArrowLeft size={16} />} onClick={() => navigate(-1)}>
              Back
            </Button>
          </Space>
        }
      />

      {request && (
        <Alert
          type="warning"
          showIcon
          className="form-card"
          title={`The client asked to cancel this visit on ${formatDateTime(request.requested_at)}.`}
          description={request.reason ? `Their reason: ${request.reason}` : "They gave no reason."}
          action={
            <Space orientation="vertical">
              <Button size="small" danger onClick={() => cancelVisit(request.reason)} disabled={busy}>
                Cancel the Visit
              </Button>
              <Button
                size="small"
                disabled={busy}
                onClick={() =>
                  run(() => declineCancelRequest(id), "Visit kept; the client hears it stays booked", "Couldn't keep the visit")
                }
              >
                Keep the Visit
              </Button>
            </Space>
          }
        />
      )}

      <Card className="form-card">
        <Descriptions
          size="small"
          column={{ xs: 1, md: 2 }}
          items={[
            { key: "date", label: "Date", children: formatDate(visit.date) },
            {
              key: "time",
              label: "Time",
              children: `${formatTime(visit.start_time)}${visit.end_time ? ` – ${formatTime(visit.end_time)}` : ""}`,
            },
            {
              key: "who",
              label: client ? "Client" : "Guest",
              children: client ? (
                <Button type="link" className="table-link" onClick={() => navigate(`/viewUser/${client.id}?tab=bookings`)}>
                  {client.name || client.email}
                </Button>
              ) : (
                [guest?.name, guest?.company_name, guest?.phone, guest?.email].filter(Boolean).join(" · ")
              ),
            },
            { key: "address", label: "Address", children: visit.address?.one_line || "—" },
            {
              key: "services",
              label: "Services",
              children: (visit.services || []).map((service) => service.name).join(", ") || "—",
            },
            ...CREW_JOBS.map((job) => ({
              key: job.field,
              label: job.label,
              children:
                (visit.employees || [])
                  .filter((employee) => employee.job_type === job.jobType)
                  .map((employee) => employee.name)
                  .join(", ") || "—",
            })),
            { key: "started", label: "Started", children: formatDateTime(visit.started_at) },
            { key: "finished", label: "Finished", children: formatDateTime(visit.finished_at) },
            { key: "notes", label: "Notes", span: "filled" as const, children: visit.notes || "—" },
            ...(visit.cancellation_reason
              ? [{ key: "reason", label: "Cancellation Reason", span: "filled" as const, children: visit.cancellation_reason }]
              : []),
          ]}
        />
      </Card>

      <Card title="Photos" className="form-card">
        {(["before", "after"] as const).map((kind) => (
          <div key={kind} className="booking-details__photos">
            <h4 className="section-title">{kind === "before" ? "Before" : "After"}</h4>
            {photos(kind).length ? (
              <Image.PreviewGroup>
                <Space wrap>
                  {photos(kind).map((photo, index) => (
                    <Image key={photo.url ?? index} src={photo.url} width={120} height={120} />
                  ))}
                </Space>
              </Image.PreviewGroup>
            ) : (
              <p className="text-secondary">No {kind} photos yet.</p>
            )}
          </div>
        ))}
      </Card>

      <Card title="Checklists" className="form-card">
        {checklists?.length ? (
          checklists.map((group) => (
            <div key={group.heading_id} className="booking-details__checklist">
              <h4 className="section-title">{group.heading_title}</h4>
              {(group.tasks || []).length ? (
                <ul className="booking-details__tasks">
                  {group.tasks.map((task) => (
                    <li key={task.id}>
                      <Checkbox checked={Boolean(task.is_completed)} disabled>
                        {task.task}
                      </Checkbox>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-secondary">No tasks under this heading.</p>
              )}
            </div>
          ))
        ) : (
          <p className="text-secondary">The services on this visit have no checklists. Add them under Service Checklist.</p>
        )}
      </Card>
    </div>
  );
};

export default BookingDetailsPage;
