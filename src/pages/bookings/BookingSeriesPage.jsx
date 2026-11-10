import { useNavigate, useParams, useSearchParams } from "react-router";
import { Button, Card, Space, Spin, Table, message } from "antd";
import { ArrowLeft, Eye } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import IconAction from "@/components/IconAction";
import StatusTag from "@/components/StatusTag";
import { getBookingSeries, updateBookingSeries } from "@/services/api/bookingApi";
import { dataOf, errorMessage } from "@/services/apiResult";
import { useApiQuery } from "@/hooks/useApiQuery";
import { formatDate, formatTime, fromApiDate, todayInBusinessTz } from "@/utils/datetime";
import BookingForm from "./components/BookingForm";
import SeriesActions from "./components/SeriesActions";
import { bookingValues, onlyChanged, seriesChanges } from "./bookingForm";
import "./bookings.scss";

// A repeating booking: its rule and next visits, extend / stop / delete, and
// its details, changed from a date on (visits that haven't started).
const BookingSeriesPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const from = params.get("from") || todayInBusinessTz();

  const { data: series, loading, reload } = useApiQuery(() => getBookingSeries(id).then(dataOf), [id], {
    errorText: "Couldn't load the repeating booking",
  });

  const submit = async (values) => {
    try {
      const isGuest = Boolean(series.guest);
      // Send only what changed (and always the date it applies from).
      const changes = onlyChanged(
        seriesChanges(values, isGuest),
        seriesChanges({ ...bookingValues(series), from: values.from }, isGuest),
      );
      if (!Object.keys(changes).length) {
        message.info("Nothing to change");
        return;
      }
      await updateBookingSeries(id, { ...changes, from: seriesChanges(values, isGuest).from });
      message.success("Repeating booking changed from that date on");
      reload();
    } catch (error) {
      message.error(errorMessage(error, "Couldn't change the repeating booking"));
    }
  };

  if (loading && !series) {
    return (
      <div className="page-loader">
        <Spin size="large" />
      </div>
    );
  }

  const visitColumns = [
    { title: "Visit", dataIndex: "number" },
    { title: "Date", dataIndex: "date", render: (date) => formatDate(date) },
    { title: "Time", dataIndex: "start_time", render: (time) => formatTime(time) },
    { title: "Status", dataIndex: "status", render: (status) => <StatusTag code={status} /> },
    {
      title: "",
      key: "open",
      width: 60,
      render: (_, visit) => <IconAction icon={Eye} title="Open" onClick={() => navigate(`/viewBooking/${visit.id}`)} />,
    },
  ];

  return (
    <>
      <PageHeader
        title={series?.title || "REPEATING BOOKING"}
        subtitle={
          series && (
            <Space size={8} wrap>
              <StatusTag code={series.status} />
              <span>{series.repeat?.description}</span>
              <span>
                {formatDate(series.starts_on)} to {formatDate(series.ends_on)}
              </span>
            </Space>
          )
        }
        actions={
          <Space wrap>
            {series && <SeriesActions series={series} onChanged={reload} onDeleted={() => navigate("/repeating-bookings")} />}
            <Button icon={<ArrowLeft size={16} />} onClick={() => navigate(-1)}>
              Back
            </Button>
          </Space>
        }
      />
      {series && (
        <>
          <Card title="Next Visits" className="form-card">
            <Table
              rowKey="id"
              size="small"
              pagination={false}
              columns={visitColumns}
              dataSource={series.upcoming_visits || []}
              locale={{ emptyText: "No visits coming up" }}
            />
            <p className="text-secondary booking-series__note">
              Visits are booked 4 weeks ahead, through {formatDate(series.booked_through)}; each night adds the next day.
            </p>
          </Card>
          <BookingForm
            key={`${series.id}-${series.updated_at}`}
            mode="series"
            isGuest={Boolean(series.guest)}
            initialValues={{
              ...bookingValues(series),
              client_name: series.client?.name || series.client?.email,
              from: fromApiDate(from),
            }}
            submitLabel="Change the Series From This Date"
            onSubmit={submit}
          />
        </>
      )}
    </>
  );
};

export default BookingSeriesPage;
