import { useState } from "react";
import { Checkbox, Form, Modal, message } from "antd";
import { addAddress, updateAddress } from "@/services/api/addressApi";
import { dataOf, errorMessage } from "@/services/apiResult";
import AddressFields from "./AddressFields";
import { useCountries } from "@/hooks/useCountries";
import { addressBody } from "./addressForm";

/**
 * Adds an address for a user (a client's place of service, an employee's
 * home), or edits one. Only the US and Canada are taken; the street, city,
 * state and ZIP or postal code are required.
 */
const AddressFormModal = ({ open, userId, address, onSaved, onCancel, title }) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(address?.id);
  const { data: countries } = useCountries();
  const usCountryId = countries?.find((country) => country.code === "US")?.id;

  const initialValues = isEdit
    ? {
        label: address.label || undefined,
        address: address.address,
        address_line_2: address.address_line_2 || undefined,
        country_id: address.country?.id,
        state_id: address.state?.id,
        city_id: address.city?.id,
        city_name: address.city?.name,
        state_code: address.state?.code,
        postal_code: address.postal_code || undefined,
        access_notes: address.access_notes || undefined,
      }
    : { country_id: usCountryId, is_primary: false };

  const submit = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    setSaving(true);
    try {
      const body = await addressBody(values);
      if (!isEdit) body.is_primary = Boolean(values.is_primary);
      const res = isEdit ? await updateAddress(address.id, body) : await addAddress(userId, body);
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
