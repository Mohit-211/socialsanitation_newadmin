import { useNavigate, useSearchParams } from "react-router";
import { Alert, Button, Spin, message } from "antd";
import { ArrowLeft, Repeat } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { getBooking, updateBooking } from "@/services/api/bookingApi";
import { dataOf, errorMessage } from "@/services/apiResult";
import { useApiQuery } from "@/hooks/useApiQuery";
import { clientPagePath } from "@/pages/clients/clientFlow";
import { formatDate } from "@/utils/datetime";
import BookingForm from "./components/BookingForm";
import { bookingValues, onlyChanged, visitChanges, type BookingFormValues } from "./bookingForm";
import "./bookings.scss";
import { useRouteParam } from "@/hooks/useRouteParam";

// One visit's details: changes reach this visit only. A visit of a repeating
// booking links to changing the whole series from its date.
const EditBookingPage = () => {
  const id = useRouteParam();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const fromClient = Number(params.get("clientId")) || null;

  const { data: visit, loading } = useApiQuery(() => getBooking(id).then(dataOf), [id], {
    errorText: "Couldn't load the visit",
  });
  const back = fromClient ? clientPagePath(fromClient, "bookings") : `/viewBooking/${id}`;

  const submit = async (values: BookingFormValues) => {
    if (!visit) return;
    const isGuest = Boolean(visit.guest);
    // Send only what changed: the visit as loaded, in the same shape.
    const changes = onlyChanged(visitChanges(values, isGuest), visitChanges(bookingValues(visit), isGuest));
    if (!Object.keys(changes).length) {
      navigate(back);
      return;
    }
    try {
      await updateBooking(id, changes);
      message.success("Visit saved; the client hears of any change of date or time");
      navigate(back);
    } catch (error) {
      message.error(errorMessage(error, "Couldn't save the visit"));
    }
  };

  if (loading && !visit) {
    return (
      <div className="page-loader">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={`EDIT VISIT ${visit?.number || ""}`.trim()}
        subtitle={visit ? `${visit.client?.name || visit.guest?.name || ""} · ${formatDate(visit.date)}` : undefined}
        actions={
          <Button size="large" icon={<ArrowLeft size={16} />} onClick={() => navigate(back)}>
            Back
          </Button>
        }
      />
      {visit?.series_id && (
        <Alert
          type="info"
          showIcon
          className="form-card"
          title="This visit is part of a repeating booking. Changes here are for this visit only."
          action={
            <Button
              size="small"
              icon={<Repeat size={14} />}
              onClick={() => navigate(`/booking-series/${visit.series_id}?from=${visit.date}`)}
            >
              Change the Series From This Date
            </Button>
          }
        />
      )}
      {visit && (
        <BookingForm
          key={visit.id}
          mode="visit"
          isGuest={Boolean(visit.guest)}
          initialValues={{ ...bookingValues(visit), client_name: visit.client?.name || visit.client?.email }}
          submitLabel="Save This Visit"
          onSubmit={submit}
        />
      )}
    </>
  );
};

export default EditBookingPage;
