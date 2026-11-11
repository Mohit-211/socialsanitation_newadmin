import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Badge, Button, Calendar, Modal, Spin } from "antd";
import { ArrowLeft } from "lucide-react";
import dayjs from "@/lib/dayjs";
import PageHeader from "@/components/PageHeader";
import StatusTag from "@/components/StatusTag";
import { getBookingCalendar } from "@/services/api/bookingApi";
import { itemsOf } from "@/services/apiResult";
import { useApiQuery } from "@/hooks/useApiQuery";
import { formatDate, formatTime } from "@/utils/datetime";
import "./bookings.scss";
import type { Dayjs } from "dayjs";
import type { VisitRow } from "@/types";

const whoOf = (visit: VisitRow) => visit.client?.name || visit.guest?.name || visit.title || "Visit";

// The month at a glance: each day's visits; a day opens its list.
const BookingCalendarPage = () => {
  const navigate = useNavigate();
  const [month, setMonth] = useState(dayjs());
  const [openDay, setOpenDay] = useState<Dayjs | null>(null);

  const { data: days, loading } = useApiQuery(
    () => getBookingCalendar({ month: month.month() + 1, year: month.year() }).then(itemsOf),
    [month.year(), month.month()],
    { initial: [], errorText: "Couldn't load the calendar" },
  );
  const byDate = useMemo(() => new Map((days || []).map((day) => [day.date, day.bookings || []])), [days]);
  const visitsOn = (date: Dayjs) => byDate.get(date.format("YYYY-MM-DD")) || [];

  return (
    <div>
      <PageHeader
        title="BOOKING CALENDAR"
        subtitle="Every visit of the month"
        actions={
          <Button size="large" icon={<ArrowLeft size={16} />} onClick={() => navigate("/bookings")}>
            All Bookings
          </Button>
        }
      />
      <Spin spinning={loading}>
        <div className="surface booking-calendar">
          <Calendar
            value={month}
            onPanelChange={(value) => setMonth(value)}
            onSelect={(value, info) => {
              if (info?.source === "date" && visitsOn(value).length) setOpenDay(value);
              else setMonth(value);
            }}
            cellRender={(current, info) => {
              if (info.type !== "date") return info.originNode;
              const visits = visitsOn(current);
              if (!visits.length) return null;
              return (
                <ul className="booking-calendar__day">
                  {visits.slice(0, 3).map((visit) => (
                    <li key={visit.id}>
                      <Badge status={visit.status === "SUCCESS" ? "success" : visit.status === "CANCELLED" ? "default" : "processing"} />
                      <span>
                        {formatTime(visit.start_time)} {whoOf(visit)}
                      </span>
                    </li>
                  ))}
                  {visits.length > 3 && <li className="text-subtle">+{visits.length - 3} more</li>}
                </ul>
              );
            }}
          />
        </div>
      </Spin>
      <Modal
        open={Boolean(openDay)}
        title={openDay ? `Visits on ${formatDate(openDay.format("YYYY-MM-DD"))}` : ""}
        footer={null}
        onCancel={() => setOpenDay(null)}
      >
        <ul className="booking-calendar__list">
          {(openDay ? visitsOn(openDay) : []).map((visit) => (
            <li key={visit.id}>
              <button type="button" className="booking-calendar__item" onClick={() => navigate(`/viewBooking/${visit.id}`)}>
                <span>
                  <strong>
                    {formatTime(visit.start_time)} · {whoOf(visit)}
                  </strong>
                  <span className="text-subtle">{(visit.services || []).map((service) => service.name).join(", ")}</span>
                </span>
                <StatusTag code={visit.status} />
              </button>
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  );
};

export default BookingCalendarPage;
