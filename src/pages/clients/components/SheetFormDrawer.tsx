import { useState } from "react";
import { Button, Drawer, Form, Space, Spin, message } from "antd";
import AddressFormModal from "@/components/AddressFormModal";
import { createSheet, getSheet, updateSheet } from "@/services/api/sheetApi";
import { dataOf, errorMessage } from "@/services/apiResult";
import { useApiQuery } from "@/hooks/useApiQuery";
import SheetFields from "./SheetFields";
import { defaultAreas, sheetBody, sheetValues, type SheetFormValues } from "../sheetForm";
import type { Address, ClientSheet, ClientType, Id } from "@/types";

export interface SheetFormDrawerProps {
  open: boolean;
  clientId: Id;
  clientType?: ClientType | null;
  /** The sheet to edit; none adds one. */
  sheetId?: number;
  addresses?: Address[];
  onAddressAdded?: (address: Address) => void;
  onSaved?: (sheet: ClientSheet) => void;
  onClose: () => void;
}

/** Adds an Initial Client Sheet for the client, or edits one (sheetId). */
const SheetFormDrawer = ({ open, clientId, clientType, sheetId, addresses = [], onAddressAdded, onSaved, onClose }: SheetFormDrawerProps) => {
  const [form] = Form.useForm<SheetFormValues>();
  const [saving, setSaving] = useState(false);
  const [addingAddress, setAddingAddress] = useState(false);
  const isEdit = Boolean(sheetId);

  const { data: sheet, loading } = useApiQuery(() => getSheet(sheetId ?? 0).then(dataOf), [sheetId, open], {
    skip: !open || !isEdit,
    errorText: "Couldn't load the sheet",
  });

  const primary = addresses.find((address) => address.is_primary) || addresses[0];
  const initialValues: SheetFormValues = isEdit
    ? sheetValues(sheet)
    : { title: "", address_id: primary?.id ?? "none", areas: defaultAreas(clientType), service_days: [] };

  const submit = async () => {
    let values: SheetFormValues;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    setSaving(true);
    try {
      const body = sheetBody(values);
      const res = sheetId ? await updateSheet(sheetId, body) : await createSheet(clientId, body);
      message.success(isEdit ? "Sheet saved" : "Sheet added");
      onSaved?.(dataOf(res));
    } catch (error) {
      message.error(errorMessage(error, "Couldn't save the sheet"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Drawer
        open={open}
        title={isEdit ? "Edit Client Sheet" : "New Client Sheet"}
        size={1000}
        onClose={onClose}
        destroyOnHidden
        extra={
          <Space>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="primary" onClick={submit} loading={saving}>
              {isEdit ? "Save" : "Add Sheet"}
            </Button>
          </Space>
        }
      >
        {isEdit && (loading || !sheet) ? (
          <Spin />
        ) : (
          <Form
            key={sheet?.id ?? "new"}
            form={form}
            layout="vertical"
            initialValues={initialValues}
            requiredMark="optional"
          >
            <SheetFields
              form={form}
              clientType={clientType}
              addresses={addresses}
              onAddAddress={() => setAddingAddress(true)}
            />
          </Form>
        )}
      </Drawer>
      <AddressFormModal
        open={addingAddress}
        userId={clientId}
        title="Add an Address for This Client"
        onCancel={() => setAddingAddress(false)}
        onSaved={(address) => {
          setAddingAddress(false);
          onAddressAdded?.(address);
          if (address?.id) form.setFieldValue("address_id", address.id);
        }}
      />
    </>
  );
};

export default SheetFormDrawer;
