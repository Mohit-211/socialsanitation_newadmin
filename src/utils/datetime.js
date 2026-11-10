import dayjs from "@/lib/dayjs";

// Dates and times as the business reads them: 11/10/2026 and 9:30 AM, in
// Eastern time. The API sends and takes dates as YYYY-MM-DD and times as
// 24-hour HH:mm; timestamps (created_at and the like) are full date-times.

export const BUSINESS_TIME_ZONE = "America/New_York";
export const DATE_FORMAT = "MM/DD/YYYY";
export const TIME_FORMAT = "h:mm A";
export const API_DATE_FORMAT = "YYYY-MM-DD";
export const API_TIME_FORMAT = "HH:mm";

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
// Some older records keep a date as US text, such as a contract's date.
const US_DATE = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
// A date-only field stored as a timestamp: midnight UTC, which means that calendar day.
const MIDNIGHT_UTC = /^\d{4}-\d{2}-\d{2}T00:00:00(\.0+)?Z$/;
const TIME_ONLY = /^\d{1,2}:\d{2}(:\d{2})?$/;

/**
 * A date to show: "11/10/2026". A date-only value (YYYY-MM-DD) is shown as
 * it is, never shifted by a time zone; a timestamp is shown in Eastern time.
 */
export function formatDate(value, fallback = "—") {
  if (!value) return fallback;
  if (typeof value === "string" && DATE_ONLY.test(value)) {
    return dayjs(value, API_DATE_FORMAT).format(DATE_FORMAT);
  }
  if (typeof value === "string" && US_DATE.test(value)) {
    return dayjs(value, "M/D/YYYY").format(DATE_FORMAT);
  }
  if (typeof value === "string" && MIDNIGHT_UTC.test(value)) {
    return dayjs(value.slice(0, 10), API_DATE_FORMAT).format(DATE_FORMAT);
  }
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.tz(BUSINESS_TIME_ZONE).format(DATE_FORMAT) : fallback;
}

/** A time to show: "9:30 AM", from "09:30", "21:05:00" or a timestamp. */
export function formatTime(value, fallback = "—") {
  if (!value) return fallback;
  if (typeof value === "string" && TIME_ONLY.test(value)) {
    const parsed = dayjs(value, value.length > 5 ? "HH:mm:ss" : "HH:mm");
    return parsed.isValid() ? parsed.format(TIME_FORMAT) : fallback;
  }
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.tz(BUSINESS_TIME_ZONE).format(TIME_FORMAT) : fallback;
}

/** A moment to show: "11/10/2026 9:30 AM", in Eastern time. */
export function formatDateTime(value, fallback = "—") {
  if (!value) return fallback;
  const parsed = dayjs(value);
  return parsed.isValid()
    ? parsed.tz(BUSINESS_TIME_ZONE).format(`${DATE_FORMAT} ${TIME_FORMAT}`)
    : fallback;
}

/** A date for the API (YYYY-MM-DD) from a dayjs value, Date or string; null when empty. */
export function toApiDate(value) {
  if (!value) return null;
  if (typeof value === "string" && DATE_ONLY.test(value)) return value;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format(API_DATE_FORMAT) : null;
}

/** A time for the API (HH:mm) from a dayjs value; null when empty. */
export function toApiTime(value) {
  if (!value) return null;
  if (typeof value === "string" && TIME_ONLY.test(value)) return value.slice(0, 5);
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format(API_TIME_FORMAT) : null;
}

/**
 * A dayjs value for a date picker from a date the API sent: YYYY-MM-DD, US
 * text (11/05/2026), or a timestamp. None of them shift with the browser's
 * time zone. Null when empty or unreadable.
 */
export function fromApiDate(value) {
  if (!value) return null;
  const text = String(value);
  let parsed;
  if (US_DATE.test(text)) parsed = dayjs(text, "M/D/YYYY");
  else if (DATE_ONLY.test(text.slice(0, 10)) && (text.length === 10 || MIDNIGHT_UTC.test(text))) {
    parsed = dayjs(text.slice(0, 10), API_DATE_FORMAT);
  } else {
    // A real moment: the calendar day it is in Eastern time.
    const moment = dayjs(text);
    parsed = moment.isValid() ? dayjs(moment.tz(BUSINESS_TIME_ZONE).format(API_DATE_FORMAT), API_DATE_FORMAT) : moment;
  }
  return parsed.isValid() ? parsed : null;
}

/** A dayjs value for a time picker from an API time (HH:mm or HH:mm:ss); null when empty. */
export function fromApiTime(value) {
  if (!value) return null;
  const parsed = dayjs(String(value).slice(0, 5), API_TIME_FORMAT);
  return parsed.isValid() ? parsed : null;
}

/** Today's date in Eastern time, as YYYY-MM-DD. */
export const todayInBusinessTz = () => dayjs().tz(BUSINESS_TIME_ZONE).format(API_DATE_FORMAT);
