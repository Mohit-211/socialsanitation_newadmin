import { useMemo, useState } from "react";
import { Form, Input, Select, type FormInstance } from "antd";
import { listCities, listStates } from "@/services/api/referenceApi";
import { itemsOf } from "@/services/apiResult";
import { useApiQuery } from "@/hooks/useApiQuery";
import { debounce } from "@/utils/debounce";
import type { Country, Place } from "@/types";

export interface AddressFieldsProps {
  form: FormInstance;
  countries?: Country[];
  /** The address may be left empty; once a street is typed, the rest is needed. */
  optional?: boolean;
  /** An edited address's city, kept in the list before any search. */
  currentCity?: Place | null;
  currentStateId?: number | null;
}

type OptionPicked<T> = T | T[] | undefined;
const single = <T,>(option: OptionPicked<T>): T | undefined => (Array.isArray(option) ? option[0] : option);

const POSTAL_CODE: Record<string, { pattern: RegExp; hint: string }> = {
  US: { pattern: /^\d{5}(-\d{4})?$/, hint: "A ZIP code like 33602 or 33602-1234" },
  CA: { pattern: /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/, hint: "A postal code like M5V 2T6" },
};

/**
 * The fields of an address in the US or Canada, for a Form: label, street,
 * suite, country, state, city (searched as you type), ZIP or postal code and
 * access notes. With `optional`, the address may be left empty, but once a
 * street is typed the city, state and code are needed too. `currentCity` keeps
 * an edited address's city in the list before any search.
 */
const AddressFields = ({ form, countries = [], optional = false, currentCity, currentStateId }: AddressFieldsProps) => {
  const [citySearch, setCitySearch] = useState("");
  const countryId = Form.useWatch<number | undefined>("country_id", form);
  const stateId = Form.useWatch<number | undefined>("state_id", form);
  const street = Form.useWatch<string | undefined>("address", form);
  const needed = !optional || Boolean(street?.trim());

  const { data: states, loading: loadingStates } = useApiQuery(
    () => listStates({ countryId }).then(itemsOf),
    [countryId],
    { initial: [], skip: !countryId },
  );
  const { data: cities, loading: loadingCities } = useApiQuery(
    () => listCities({ stateId, search: citySearch }).then(itemsOf),
    [stateId, citySearch],
    { initial: [], skip: !stateId },
  );
  const searchCities = useMemo(() => debounce((text: string) => setCitySearch(text), 300), []);

  const countryCode = countries.find((country) => country.id === countryId)?.code;
  const postalRule = countryCode ? POSTAL_CODE[countryCode] : undefined;

  const cityOptions = useMemo(() => {
    const options = (cities || []).map((city) => ({ value: city.id, label: city.name }));
    if (currentCity && stateId === currentStateId && !options.some((option) => option.value === currentCity.id)) {
      options.unshift({ value: currentCity.id, label: currentCity.name });
    }
    return options;
  }, [cities, currentCity, currentStateId, stateId]);

  return (
    <>
      <Form.Item label="Label" name="label" rules={[{ max: 60 }]} extra="Such as Main office or Warehouse">
        <Input />
      </Form.Item>
      <Form.Item
        label="Street Address"
        name="address"
        rules={[{ required: !optional, whitespace: true, message: "Enter the street address" }, { max: 255 }]}
      >
        <Input placeholder="1 Main St" />
      </Form.Item>
      <Form.Item label="Suite or Unit" name="address_line_2" rules={[{ max: 150 }]}>
        <Input placeholder="Suite 4" />
      </Form.Item>

      <div className="form-grid form-grid--2">
        <Form.Item label="Country" name="country_id" rules={[{ required: needed, message: "Choose the country" }]}>
          <Select
            options={countries.map((country) => ({ value: country.id, label: country.name }))}
            onChange={() => form.setFieldsValue({ state_id: undefined, city_id: undefined })}
          />
        </Form.Item>
        <Form.Item
          label={countryCode === "CA" ? "Province" : "State"}
          name="state_id"
          rules={[{ required: needed, message: "Choose the state" }]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            loading={loadingStates}
            options={(states || []).map((state) => ({ value: state.id, label: `${state.name} (${state.code})`, code: state.code }))}
            onChange={(_, option) =>
              form.setFieldsValue({ city_id: undefined, city_name: undefined, state_code: single(option)?.code })
            }
          />
        </Form.Item>
        <Form.Item label="City" name="city_id" rules={[{ required: needed, message: "Choose the city" }]}>
          <Select
            showSearch
            filterOption={false}
            onSearch={searchCities}
            loading={loadingCities}
            disabled={!stateId}
            placeholder={stateId ? "Type to search" : "Choose the state first"}
            options={cityOptions}
            notFoundContent={loadingCities ? "Searching…" : "No city found"}
            onChange={(_, option) => form.setFieldValue("city_name", single(option)?.label)}
          />
        </Form.Item>
        <Form.Item
          label={countryCode === "CA" ? "Postal Code" : "ZIP Code"}
          name="postal_code"
          rules={[
            { required: needed, whitespace: true, message: "Enter the ZIP or postal code" },
            {
              validator: (_: unknown, value: string | undefined) =>
                !value || !postalRule || postalRule.pattern.test(value.trim())
                  ? Promise.resolve()
                  : Promise.reject(new Error(postalRule.hint)),
            },
          ]}
        >
          <Input />
        </Form.Item>
      </div>

      {/* The pickers' labels, for looking up the address on the map. */}
      <Form.Item name="city_name" hidden>
        <Input />
      </Form.Item>
      <Form.Item name="state_code" hidden>
        <Input />
      </Form.Item>

      <Form.Item label="Access Notes" name="access_notes" rules={[{ max: 1000 }]} extra="Gate codes, parking, who to ask for">
        <Input.TextArea rows={2} />
      </Form.Item>
    </>
  );
};

export default AddressFields;
