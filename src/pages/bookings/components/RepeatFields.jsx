import { Alert, Checkbox, DatePicker, Form, InputNumber, Radio, Space } from "antd";
import { previewBooking } from "@/services/api/bookingApi";
import { dataOf, errorMessage } from "@/services/apiResult";
import { useApiQuery } from "@/hooks/useApiQuery";
import { DATE_FORMAT, formatDate, toApiDate } from "@/utils/datetime";
import { WEEK_DAYS, repeatBody } from "../bookingForm";

// A rule the preview can work out: a unit, its days (weekly), and an end.
const ruleIsComplete = (values) =>
  Boolean(values?.repeat_unit) &&
  (values.repeat_unit !== "week" || values.repeat_days?.length > 0) &&
  (values.repeat_end === "date" ? Boolean(values.repeat_ends_on) : values.repeat_visits >= 1);

/**
 * How a booking repeats: every 1 to 12 weeks on chosen days, or every 1 to 12
 * months on a date or a weekday of the month, ending on a date or after a
 * number of visits, at most 6 months out. The preview shows the visits the
 * rule makes before anything is saved. `startField` names the date it counts
 * from ("date" for a new booking, "from" when a series is changed).
 */
const RepeatFields = ({ form, startField = "date" }) => {
  const values = Form.useWatch([], form);
  const unit = values?.repeat_unit;
  const start = values?.[startField];
  const complete = ruleIsComplete(values) && Boolean(start);
  const rule = complete ? repeatBody({ ...values, repeats: true }) : null;

  const { data: preview, loading, error } = useApiQuery(
    () => previewBooking({ date: toApiDate(start), repeat: rule }).then(dataOf),
    [toApiDate(start), rule],
    { skip: !complete, silent: true },
  );

  return (
    <div className="repeat-fields">
      <div className="form-grid form-grid--2">
        <Form.Item label="Repeats Every" required>
          <Space.Compact block>
            <Form.Item name="repeat_every" noStyle rules={[{ required: true }]}>
              <InputNumber min={1} max={12} precision={0} style={{ width: 90 }} aria-label="Every" />
            </Form.Item>
            <Form.Item name="repeat_unit" noStyle>
              <Radio.Group
                optionType="button"
                options={[
                  { value: "week", label: "Weeks" },
                  { value: "month", label: "Months" },
                ]}
              />
            </Form.Item>
          </Space.Compact>
        </Form.Item>

        {unit === "week" ? (
          <Form.Item
            label="On"
            name="repeat_days"
            rules={[{ required: true, type: "array", min: 1, message: "Pick at least one day" }]}
          >
            <Checkbox.Group options={WEEK_DAYS} />
          </Form.Item>
        ) : (
          <Form.Item label="On" name="repeat_monthly_by">
            <Radio.Group
              options={[
                { value: "date", label: "The same date each month" },
                { value: "weekday", label: "The same weekday (such as the 2nd Tuesday)" },
              ]}
            />
          </Form.Item>
        )}
      </div>

      <div className="form-grid form-grid--2">
        <Form.Item label="Ends" name="repeat_end">
          <Radio.Group
            options={[
              { value: "visits", label: "After a number of visits" },
              { value: "date", label: "On a date" },
            ]}
          />
        </Form.Item>
        {values?.repeat_end === "date" ? (
          <Form.Item label="Last Date" name="repeat_ends_on" rules={[{ required: true, message: "Pick the last date" }]}>
            <DatePicker format={DATE_FORMAT} style={{ width: "100%" }} />
          </Form.Item>
        ) : (
          <Form.Item label="Visits" name="repeat_visits" rules={[{ required: true, message: "How many visits?" }]}>
            <InputNumber min={1} max={200} precision={0} style={{ width: "100%" }} />
          </Form.Item>
        )}
      </div>

      {complete &&
        (error ? (
          <Alert type="warning" showIcon title={errorMessage(error, "This rule can't be booked")} />
        ) : (
          <Alert
            type="info"
            showIcon
            title={
              loading || !preview
                ? "Working out the dates…"
                : `${preview.total_visits} visit${preview.total_visits === 1 ? "" : "s"}, ${formatDate(preview.first_date)} to ${formatDate(preview.last_date)}`
            }
            description={
              preview && !loading
                ? `The visits in the next 4 weeks are booked now (${preview.dates_booked_now?.length ?? 0}); the rest are added each night. A series can run until ${formatDate(preview.latest_end)}.`
                : undefined
            }
          />
        ))}
    </div>
  );
};

export default RepeatFields;
