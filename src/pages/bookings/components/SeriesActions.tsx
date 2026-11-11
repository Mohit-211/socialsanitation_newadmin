import { useState } from "react";
import { Button, DatePicker, Form, InputNumber, Modal, Radio, Space, message } from "antd";
import { CalendarPlus, CircleStop, Trash2 } from "lucide-react";
import { deleteBookingSeries, stopBookingSeries, updateBookingSeries } from "@/services/api/bookingApi";
import { errorMessage } from "@/services/apiResult";
import { PERMISSION, useCan } from "@/lib/session";
import { DATE_FORMAT, fromApiDate, toApiDate } from "@/utils/datetime";
import type { Dayjs } from "dayjs";
import type { BookingSeries } from "@/types";

interface SeriesActionsProps {
  series: BookingSeries;
  onChanged?: () => void;
  onDeleted?: () => void;
  compact?: boolean;
}

/** The extend and stop forms' values. */
interface SeriesActionValues {
  end: "date" | "visits";
  ends_on?: Dayjs | null;
  visits?: number;
  last_date?: Dayjs | null;
}

/**
 * What the office does with a repeating booking: extend it (a later end date
 * or more visits; at most 6 months out), stop it after a date, or delete it
 * (its visits that haven't started go). `compact` shows icon buttons.
 */
const SeriesActions = ({ series, onChanged, onDeleted, compact = false }: SeriesActionsProps) => {
  const canDelete = useCan(PERMISSION.DELETE_RECORDS);
  const [extending, setExtending] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<SeriesActionValues>();
  const ended = series.status === "ended";

  const extend = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      await updateBookingSeries(
        series.id,
        values.end === "date" ? { ends_on: toApiDate(values.ends_on) } : { visits: values.visits },
      );
      message.success("Repeating booking extended");
      setExtending(false);
      onChanged?.();
    } catch (error) {
      message.error(errorMessage(error, "Couldn't extend it"));
    } finally {
      setSaving(false);
    }
  };

  const stop = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      await stopBookingSeries(series.id, toApiDate(values.last_date));
      message.success("Repeating booking stopped; later visits that hadn't started are removed");
      setStopping(false);
      onChanged?.();
    } catch (error) {
      message.error(errorMessage(error, "Couldn't stop it"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () =>
    Modal.confirm({
      title: "Delete this repeating booking?",
      content: "Its visits from today that haven't started go; earlier ones stay.",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await deleteBookingSeries(series.id);
          message.success("Repeating booking deleted");
          onDeleted?.();
        } catch (error) {
          message.error(errorMessage(error, "Couldn't delete it"));
        }
      },
    });

  const size = compact ? "small" : "middle";
  return (
    <Space size={4} wrap>
      {!ended && (
        <Button size={size} icon={<CalendarPlus size={14} />} onClick={() => setExtending(true)}>
          {compact ? null : "Extend"}
        </Button>
      )}
      {!ended && (
        <Button size={size} icon={<CircleStop size={14} />} onClick={() => setStopping(true)}>
          {compact ? null : "Stop"}
        </Button>
      )}
      {canDelete && (
        <Button size={size} danger icon={<Trash2 size={14} />} onClick={confirmDelete}>
          {compact ? null : "Delete"}
        </Button>
      )}

      <Modal
        open={extending}
        title="Extend the Repeating Booking"
        okText="Extend"
        confirmLoading={saving}
        onOk={extend}
        onCancel={() => setExtending(false)}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          preserve={false}
          initialValues={{ end: "date", ends_on: fromApiDate(series.ends_on), visits: series.repeat?.visits ?? 8 }}
        >
          <Form.Item name="end">
            <Radio.Group
              options={[
                { value: "date", label: "Until a later date" },
                { value: "visits", label: "To a number of visits" },
              ]}
            />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(a, b) => a.end !== b.end}>
            {({ getFieldValue }) =>
              getFieldValue("end") === "date" ? (
                <Form.Item
                  label="New Last Date"
                  name="ends_on"
                  rules={[{ required: true }]}
                  extra={`A series can run until ${fromApiDate(series.latest_end)?.format(DATE_FORMAT) ?? "6 months out"}`}
                >
                  <DatePicker format={DATE_FORMAT} style={{ width: "100%" }} />
                </Form.Item>
              ) : (
                <Form.Item label="Visits in All" name="visits" rules={[{ required: true }]}>
                  <InputNumber min={1} max={200} precision={0} style={{ width: "100%" }} />
                </Form.Item>
              )
            }
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={stopping}
        title="Stop the Repeating Booking"
        okText="Stop"
        okType="danger"
        confirmLoading={saving}
        onOk={stop}
        onCancel={() => setStopping(false)}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item label="Last Visit Date" name="last_date" extra="Left empty, it stops today. Later visits that haven't started go.">
            <DatePicker format={DATE_FORMAT} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};

export default SeriesActions;
