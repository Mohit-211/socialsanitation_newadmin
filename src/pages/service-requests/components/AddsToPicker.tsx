import { Alert, Select } from "antd";
import { statusTag } from "@/utils/format";
import { addsToNote, isPaidQuote, pickedParent, type AddsTo, type ParentRow } from "../addsTo";
import type { ClientFlow } from "@/types";

const label = (row: ParentRow) => `${row.title} · ${statusTag(row.status).label}`;

/**
 * What a new service request adds to (see ../addsTo.ts). The picker: `value` is { estimate_id } or { quote_id } or {}, and
 * `onChange` gets the same. `documents` are the client's (useClientDocuments).
 */
export interface AddsToPickerProps {
  documents: ClientFlow | null;
  value: AddsTo;
  onChange: (value: AddsTo) => void;
  disabled?: boolean;
}

const AddsToPicker = ({ documents, value, onChange, disabled }: AddsToPickerProps) => {
  const estimates = documents?.estimates ?? [];
  const quotes = documents?.quotes ?? [];
  const selected = value?.estimate_id ? `estimate:${value.estimate_id}` : value?.quote_id ? `quote:${value.quote_id}` : undefined;
  const parent = pickedParent(documents, value);
  const note = addsToNote(parent);

  const pick = (key: string | undefined) => {
    if (!key) return onChange({});
    const [kind, id] = key.split(":");
    onChange(kind === "estimate" ? { estimate_id: Number(id) } : { quote_id: Number(id) });
  };

  return (
    <div className="service-request-doc__adds-to">
      <strong>ADDS TO:</strong>
      <Select
        allowClear
        disabled={disabled || (!estimates.length && !quotes.length)}
        placeholder={estimates.length || quotes.length ? "Nothing: send it on its own" : "The client has no estimates or quotes"}
        value={selected}
        onChange={pick}
        style={{ width: "100%", marginTop: 5 }}
        options={[
          ...(estimates.length
            ? [{ label: "Estimates", options: estimates.map((row) => ({ value: `estimate:${row.id}`, label: label(row) })) }]
            : []),
          ...(quotes.length
            ? [
                {
                  label: "Quotes",
                  options: quotes.map((row) => ({
                    value: `quote:${row.id}`,
                    label: `${label(row)}${isPaidQuote(row) ? " · paid" : ""}`,
                  })),
                },
              ]
            : []),
        ]}
      />
      {note && <Alert type="info" showIcon className="service-request-doc__adds-to-note" title={note} />}
    </div>
  );
};

export default AddsToPicker;
