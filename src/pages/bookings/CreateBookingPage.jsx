import { useNavigate } from "react-router";
import { Button, Spin, message } from "antd";
import { ArrowLeft } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { createBooking } from "@/services/api/bookingApi";
import { dataOf, errorMessage } from "@/services/apiResult";
import { useClientPicks } from "@/hooks/useClientPicks";
import { useCountries } from "@/hooks/useCountries";
import { addressBody } from "@/components/addressForm";
import { useClientFromQuery } from "@/pages/clients/useClientFromQuery";
import BookingForm from "./components/BookingForm";
import { newBookingBody, newBookingValues } from "./bookingForm";
import "./bookings.scss";

// A new booking: one visit, or a repeating series. For a client (opened from
// their page, they are already chosen and saving goes back there) or for
// someone who isn't one. Only the office books; the client hears in the app.
const CreateBookingPage = ({ forGuest = false }) => {
  const navigate = useNavigate();
  const { clientId, fromClientPage, returnPath, backLabel } = useClientFromQuery("bookings", "/bookings");
  const { data: clients, loading } = useClientPicks();
  const { data: countries, loading: loadingCountries } = useCountries();
  const preselected = clients.find((client) => client.id === clientId);

  const submit = async (values) => {
    try {
      // A guest's address gets map coordinates, like any address.
      const coordinates =
        values.for === "guest"
          ? (({ address_lat, address_long }) => ({ address_lat, address_long }))(await addressBody(values))
          : {};
      const result = dataOf(await createBooking(newBookingBody(values, coordinates)));
      if (result?.series) {
        message.success(`Repeating booking made: ${result.series.repeat?.description || "its visits are booked"}`);
        navigate(fromClientPage ? returnPath : `/booking-series/${result.series.id}`);
      } else {
        message.success("Visit booked; the client hears in the app");
        navigate(fromClientPage ? returnPath : `/viewBooking/${result?.visit?.id ?? result?.id}`);
      }
    } catch (error) {
      message.error(errorMessage(error, "Couldn't make the booking"));
    }
  };

  const usCountryId = countries?.find((country) => country.code === "US")?.id;

  return (
    <>
      <PageHeader
        title="NEW BOOKING"
        subtitle={preselected ? `For ${preselected.name || preselected.email}` : "One visit or a repeating booking"}
        actions={
          <Button size="large" icon={<ArrowLeft size={16} />} onClick={() => navigate(returnPath)}>
            {backLabel || "Return to Bookings"}
          </Button>
        }
      />
      {loading || loadingCountries ? (
        <div className="page-loader">
          <Spin size="large" />
        </div>
      ) : (
        <BookingForm
          key={preselected?.id ?? (forGuest ? "guest" : "client")}
          mode="create"
          clients={clients}
          lockClient={fromClientPage && Boolean(preselected)}
          initialValues={newBookingValues({ clientId: preselected?.id, forGuest, countryId: usCountryId })}
          submitLabel="Book"
          onSubmit={submit}
        />
      )}
    </>
  );
};

export default CreateBookingPage;
