import { TimePicker } from "antd";
import { TIME_FORMAT } from "@/utils/datetime";

/**
 * When the crew was on site for one invoice line: both times or neither. An
 * end before the start ran past midnight. The PDF prints them; they don't
 * change the billed hours or the amount.
 */
const LineTimesCell = ({ start, end, onChange, disabled = false }) => (
  <div className="invoice-editor__times">
    <TimePicker
      use12Hours
      format={TIME_FORMAT}
      minuteStep={5}
      needConfirm={false}
      placeholder="Start"
      value={start}
      disabled={disabled}
      onChange={(value) => onChange({ start_time: value })}
    />
    <TimePicker
      use12Hours
      format={TIME_FORMAT}
      minuteStep={5}
      needConfirm={false}
      placeholder="End"
      value={end}
      disabled={disabled}
      onChange={(value) => onChange({ end_time: value })}
    />
  </div>
);

export default LineTimesCell;
