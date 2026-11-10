import { Button, Divider, Form, Input, InputNumber, Select, Tooltip } from "antd";
import { Plus, Trash2 } from "lucide-react";
import { FLOOR_FIELDS } from "@/services/api/sheetApi";
import { COUNT_COLUMNS, NO_ADDRESS, WEEK_DAYS } from "../sheetForm";
import "./SheetFields.scss";

// A floor mix is either empty or adds up to 100%.
const floorRule = ({ getFieldValue }) => ({
  validator() {
    const values = FLOOR_FIELDS.map(({ name }) => Number(getFieldValue(name) || 0));
    const total = values.reduce((sum, value) => sum + value, 0);
    return total === 0 || total === 100
      ? Promise.resolve()
      : Promise.reject(new Error(`The floor mix adds up to ${total}%; it must total 100%`));
  },
});

/**
 * The fields of an Initial Client Sheet, for a Form. `addresses` are the
 * client's (from the client page); `onAddAddress` opens the address form.
 * Leave out `addresses` where the client doesn't exist yet (New Client).
 */
const SheetFields = ({ form, clientType = "commercial", addresses, onAddAddress, titleRequired = true }) => {
  const floorValues = Form.useWatch([], form) || {};
  const floorTotal = FLOOR_FIELDS.reduce((sum, { name }) => sum + Number(floorValues[name] || 0), 0);
  const countColumns = COUNT_COLUMNS[clientType] || COUNT_COLUMNS.commercial;

  return (
    <>
      <Form.Item
        label="Sheet Title"
        name="title"
        rules={[{ required: titleRequired, whitespace: true, message: "Give the sheet a title" }, { max: 150 }]}
        extra={titleRequired ? undefined : 'Left empty, it is called "Initial Client Sheet"'}
      >
        <Input placeholder="Initial Client Sheet" />
      </Form.Item>

      {addresses && (
        <Form.Item label="Service Address" name="address_id">
          <Select
            options={[
              { value: NO_ADDRESS, label: "No address yet" },
              ...addresses.map((address) => ({
                value: address.id,
                label: `${address.label ? `${address.label}: ` : ""}${address.one_line}${address.is_primary ? " (primary)" : ""}`,
              })),
            ]}
            popupRender={(menu) => (
              <>
                {menu}
                {onAddAddress && (
                  <>
                    <Divider style={{ margin: "4px 0" }} />
                    <Button type="text" block icon={<Plus size={14} />} onClick={onAddAddress}>
                      Add an address
                    </Button>
                  </>
                )}
              </>
            )}
          />
        </Form.Item>
      )}

      <div className="form-grid form-grid--3">
        <Form.Item label="Estimated Square Feet" name="estimated_sqft">
          <InputNumber min={0} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item label="Walkaround (minutes)" name="walkaround_minutes">
          <InputNumber min={0} precision={0} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item label="Service Days" name="service_days">
          <Select mode="multiple" options={WEEK_DAYS.map((day) => ({ value: day, label: day }))} />
        </Form.Item>
      </div>

      <div className="sheet-fields__floor">
        <span className="field-label">
          Floor Composition{" "}
          <span className={`sheet-fields__floor-total${floorTotal === 100 || floorTotal === 0 ? "" : " is-off"}`}>
            {floorTotal}% of 100%
          </span>
        </span>
        <div className="form-grid form-grid--4">
          {FLOOR_FIELDS.map(({ name, label }) => (
            <Form.Item
              key={name}
              label={label}
              name={name}
              dependencies={FLOOR_FIELDS.map((field) => field.name).filter((other) => other !== name)}
              rules={name === "tile_percentage" ? [floorRule] : []}
            >
              <InputNumber min={0} max={100} suffix="%" style={{ width: "100%" }} />
            </Form.Item>
          ))}
        </div>
      </div>

      <span className="field-label">Areas</span>
      <Form.List name="areas">
        {(fields, { add, remove }) => (
          <div className="sheet-fields__areas">
            <div className="sheet-fields__row sheet-fields__row--head" style={{ "--counts": countColumns.length }}>
              <span>Service Area</span>
              {countColumns.map((column) => (
                <span key={column.name}># {column.label}</span>
              ))}
              <span>Flooring Type</span>
              <span>Special Requests / Hot Spots</span>
              <span />
            </div>
            {fields.map((field) => (
              <div key={field.key} className="sheet-fields__row" style={{ "--counts": countColumns.length }}>
                <Form.Item
                  name={[field.name, "service_area"]}
                  rules={[{ required: true, whitespace: true, message: "Name the area" }, { max: 100 }]}
                >
                  <Input aria-label="Service area" />
                </Form.Item>
                {countColumns.map((column) => (
                  <Form.Item key={column.name} name={[field.name, column.name]}>
                    <InputNumber aria-label={column.label} min={0} precision={0} style={{ width: "100%" }} />
                  </Form.Item>
                ))}
                <Form.Item name={[field.name, "flooring_type"]} rules={[{ max: 100 }]}>
                  <Input aria-label="Flooring type" placeholder="Carpet, hard floor, VCT" />
                </Form.Item>
                <Form.Item name={[field.name, "special_requests"]}>
                  <Input aria-label="Special requests" />
                </Form.Item>
                <Tooltip title="Remove this area">
                  <Button
                    type="text"
                    danger
                    icon={<Trash2 size={15} />}
                    onClick={() => remove(field.name)}
                    aria-label="Remove area"
                  />
                </Tooltip>
              </div>
            ))}
            <Button icon={<Plus size={14} />} onClick={() => add({ service_area: "" })}>
              Add an Area
            </Button>
          </div>
        )}
      </Form.List>
    </>
  );
};

export default SheetFields;
