import { FLOOR_FIELDS, type FloorField, type SheetInput } from "@/services/api/sheetApi";
import type { ClientSheet, ClientType, SheetArea } from "@/types";

// Initial Client Sheet form data: the areas a new sheet starts with, and the
// conversion between a sheet from the API and the form's values.

export const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// The areas a new sheet starts with, by client type. Each can be renamed or
// removed, and more added.
const DEFAULT_AREAS: Record<ClientType, string[]> = {
  residential: ["Entrance / Lobby Areas", "Bathrooms", "Kitchen", "Bedrooms", "Dining Room", "Living Room", "Foyer"],
  commercial: [
    "Entrance / Lobby Areas",
    "Restrooms",
    "Kitchen Areas",
    "Office Areas",
    "Classrooms / Conference Rooms",
    "Group / Common Rooms",
    "All Areas / Hallways",
  ],
};

// What each client type counts in an area.
/** A count an area keeps (desks, stalls, sinks, restrooms). */
export type CountField = "stalls" | "sinks" | "restrooms" | "num_desks_trash_cans";

export const COUNT_COLUMNS: Record<ClientType, { name: CountField; label: string }[]> = {
  commercial: [
    { name: "stalls", label: "Trash cans or stalls" },
    { name: "sinks", label: "Desks or sinks" },
    { name: "restrooms", label: "Rooms or restrooms" },
  ],
  residential: [{ name: "num_desks_trash_cans", label: "Desks / trash cans or restrooms" }],
};

export const NO_ADDRESS = "none";

/** The sheet form's values. */
export interface SheetFormValues extends Partial<Record<FloorField, number>> {
  title?: string;
  address_id?: number | typeof NO_ADDRESS;
  estimated_sqft?: number;
  walkaround_minutes?: number;
  service_days?: string[];
  areas?: Partial<SheetArea>[];
}

export const defaultAreas = (clientType?: ClientType | null): Partial<SheetArea>[] =>
  DEFAULT_AREAS[clientType ?? "commercial"].map((service_area) => ({ service_area }));

// Service days arrive as a list or as text such as "Mon, Wed".
const daysOf = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
    : typeof value === "string" && value
      ? value.split(/[,\s]+/).filter((day) => WEEK_DAYS.includes(day))
      : [];

const numberOrUndefined = (value: unknown): number | undefined =>
  value === null || value === undefined || value === "" || Number.isNaN(Number(value)) ? undefined : Number(value);

/** Form values for an existing sheet. */
export function sheetValues(sheet: ClientSheet | null | undefined): SheetFormValues {
  return {
    title: sheet?.title,
    address_id: sheet?.address?.id ?? NO_ADDRESS,
    estimated_sqft: numberOrUndefined(sheet?.estimated_sqft),
    walkaround_minutes: numberOrUndefined(sheet?.walkaround_minutes),
    service_days: daysOf(sheet?.service_days),
    ...Object.fromEntries(FLOOR_FIELDS.map(({ name }) => [name, numberOrUndefined(sheet?.[name])])),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    areas: (sheet?.areas || []).map(({ id, ...area }) => area),
  };
}

/** The sheet as the API takes it, from the form's values. */
export function sheetBody(values: SheetFormValues): SheetInput {
  const body: SheetInput & { areas: Partial<SheetArea>[] } = {
    estimated_sqft: values.estimated_sqft ?? "",
    service_days: values.service_days?.length ? values.service_days : null,
    areas: (values.areas || [])
      .filter((area) => area?.service_area?.trim())
      .map((area) => ({
        service_area: (area.service_area ?? "").trim(),
        flooring_type: area.flooring_type?.trim() || null,
        special_requests: area.special_requests?.trim() || null,
        num_desks_trash_cans: area.num_desks_trash_cans ?? null,
        stalls: area.stalls ?? null,
        sinks: area.sinks ?? null,
        restrooms: area.restrooms ?? null,
      })),
  };
  if (values.title !== undefined) body.title = values.title?.trim() || "";
  if (values.address_id !== undefined) body.address_id = values.address_id === NO_ADDRESS ? null : values.address_id;
  if (values.walkaround_minutes !== undefined && values.walkaround_minutes !== null) {
    body.walkaround_minutes = values.walkaround_minutes;
  }
  for (const { name } of FLOOR_FIELDS) {
    if (values[name] !== undefined && values[name] !== null) body[name] = values[name];
  }
  if (!body.areas.length) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { areas, ...rest } = body;
    return rest;
  }
  return body;
}
