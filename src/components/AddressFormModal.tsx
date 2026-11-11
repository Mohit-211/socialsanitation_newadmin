import { useState, type ReactNode } from "react";
import { Checkbox, Form, Modal, message } from "antd";
import { addAddress, updateAddress } from "@/services/api/addressApi";
import { dataOf, errorMessage } from "@/services/apiResult";
import AddressFields from "./AddressFields";
import { useCountries } from "@/hooks/useCountries";
import { addressBody, type AddressFormValues } from "./addressForm";
import type { Address, Id } from "@/types";

export interface AddressFormModalProps {
  open: boolean;
  /** Whose address a new one is. */
  userId?: Id;
  /** The address to edit; none adds one. */
  address?: Address | null;
  onSaved?: (address: Address) => void;
  onCancel?: () => void;
  title?: ReactNode;
}

type Values = AddressFormValues & { is_primary?: boolean };

/**
 * Adds an address for a user (a client's place of service, an employee's
 * home), or edits one. Only the US and Canada are taken; the street, city,
 * state and ZIP or postal code are required.
 */
const AddressFormModal = ({ open, userId, address, onSaved, onCancel, title }: AddressFormModalProps) => {
  const [form] = Form.useForm<Values>();
  const [saving, setSaving] = useState(false);
  const editing = address?.id ? address : null;
  const isEdit = Boolean(editing);
  const { data: countries } = useCountries();
  const usCountryId = countries?.find((country) => country.code === "US")?.id;

  const initialValues: Partial<Values> = editing
    ? {
        label: editing.label || undefined,
        address: editing.address ?? undefined,
        address_line_2: editing.address_line_2 || undefined,
        country_id: editing.country?.id,
        state_id: editing.state?.id,
        city_id: editing.city?.id,
        city_name: editing.city?.name,
        state_code: editing.state?.code ?? undefined,
        postal_code: editing.postal_code || undefined,
        access_notes: editing.access_notes || undefined,
      }
    : { country_id: usCountryId, is_primary: false };

  const submit = async () => {
    let values: Values;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    setSaving(true);
    try {
      const body = await addressBody(values);
      if (!isEdit) body.is_primary = Boolean(values.is_primary);
      if (!editing && userId === undefined) return;
      const res = editing ? await updateAddress(editing.id, body) : await addAddress(userId as Id, body);
      message.success(isEdit ? "Address saved" : "Address added");
      onSaved?.(dataOf(res));
    } catch (error) {
      message.error(errorMessage(error, "Couldn't save the address"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      title={title || (isEdit ? "Edit Address" : "Add Address")}
      okText={isEdit ? "Save" : "Add Address"}
      onOk={submit}
      confirmLoading={saving}
      onCancel={onCancel}
      destroyOnHidden
      width={620}
    >
      {/* Rendered once the countries are known, so a new address starts in the US. */}
      {(isEdit || usCountryId) && (
        <Form form={form} layout="vertical" initialValues={initialValues} preserve={false} requiredMark="optional">
          <AddressFields
            form={form}
            countries={countries}
            currentCity={address?.city}
            currentStateId={address?.state?.id}
          />
          {!isEdit && (
            <Form.Item name="is_primary" valuePropName="checked">
              <Checkbox>Make this the primary address</Checkbox>
            </Form.Item>
          )}
        </Form>
      )}
    </Modal>
  );
};

export default AddressFormModal;
