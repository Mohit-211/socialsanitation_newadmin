import { Select, type SelectProps } from "antd";
import type { ClientPick } from "@/types";

export interface ClientSelectProps extends Omit<SelectProps<number>, "options" | "onChange"> {
  clients?: ClientPick[];
  /** Hears the whole client, to fill in the rest of the form. */
  onPick?: (client: ClientPick | undefined) => void;
  /** Opened from the client page: the client can't change. */
  locked?: boolean;
  onChange?: (id: number) => void;
}

/**
 * Picks a client by name or email, for a Form.Item. `clients` come from
 * useClientPicks; `onPick` gets the whole client to fill in the form. A form
 * opened from the client page passes `locked`, so the client can't change.
 */
const ClientSelect = ({ clients = [], onPick, locked = false, value, onChange, ...rest }: ClientSelectProps) => (
  <Select
    showSearch
    placeholder="Choose a client"
    value={value}
    disabled={locked || rest.disabled}
    optionFilterProp="search"
    options={clients.map((client) => ({
      value: client.id,
      label: client.name || client.email,
      search: `${client.name || ""} ${client.email || ""}`.toLowerCase(),
    }))}
    filterOption={(input, option) => String(option?.search ?? "").includes(input.toLowerCase())}
    onChange={(id: number) => {
      onChange?.(id);
      onPick?.(clients.find((client) => client.id === id));
    }}
    {...rest}
  />
);

export default ClientSelect;
