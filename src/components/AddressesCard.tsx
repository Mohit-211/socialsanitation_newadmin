import { useState, type ReactNode } from "react";
import { Button, Card, Empty, Modal, Space, Tag, Tooltip, message } from "antd";
import { MapPin, Pencil, Plus, Star, Trash2, Users } from "lucide-react";
import IconAction from "@/components/IconAction";
import AddressFormModal from "@/components/AddressFormModal";
import NearestEmployeesModal from "@/components/NearestEmployeesModal";
import { deleteAddress, listEmployeesNearAddress, makeAddressPrimary } from "@/services/api/addressApi";
import { errorMessage } from "@/services/apiResult";
import { PERMISSION, useCan } from "@/lib/session";
import type { Address, Id } from "@/types";
import "./AddressesCard.scss";

export interface AddressesCardProps {
  userId: Id;
  addresses?: Address[];
  onChanged?: () => void;
  title?: ReactNode;
  /** Adds "Nearest employees" to each, for a client's places. */
  showNearest?: boolean;
}

/**
 * A person's addresses (a client's places of service, an employee's home),
 * with add, edit, make primary and delete. `showNearest` adds "Nearest
 * employees" to each, for a client's places. `onChanged` hears every change.
 */
const AddressesCard = ({ userId, addresses = [], onChanged, title = "Addresses", showNearest = false }: AddressesCardProps) => {
  const canDelete = useCan(PERMISSION.DELETE_RECORDS);
  const [addressForm, setAddressForm] = useState<{ address?: Address } | null>(null); // { address } to edit, {} to add
  const [nearestFor, setNearestFor] = useState<Address | null>(null);

  const setPrimary = async (address: Address) => {
    try {
      await makeAddressPrimary(address.id);
      message.success("Primary address changed");
      onChanged?.();
    } catch (error) {
      message.error(errorMessage(error, "Couldn't change the primary address"));
    }
  };

  const confirmDelete = (address: Address) =>
    Modal.confirm({
      title: "Delete this address?",
      content: address.one_line,
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await deleteAddress(address.id);
          message.success("Address deleted");
          onChanged?.();
        } catch (error) {
          message.error(errorMessage(error, "Couldn't delete the address"));
        }
      },
    });

  return (
    <Card
      title={title}
      size="small"
      className="addresses-card"
      extra={
        <Button icon={<Plus size={14} />} onClick={() => setAddressForm({})}>
          Add Address
        </Button>
      }
    >
      {addresses.length === 0 ? (
        <Empty description="No addresses yet." />
      ) : (
        <ul className="addresses-card__list">
          {addresses.map((address) => (
            <li key={address.id} className="addresses-card__item">
              <MapPin size={18} className="addresses-card__icon text-subtle" />
              <div className="addresses-card__body">
                <Space size={6} wrap className="addresses-card__title">
                  <span>{address.label || "Address"}</span>
                  {address.is_primary && <Tag color="blue">Primary</Tag>}
                  {!address.postal_code && (
                    <Tooltip title="Add the ZIP or postal code when you next edit it">
                      <Tag color="gold">No ZIP</Tag>
                    </Tooltip>
                  )}
                </Space>
                <div>{address.one_line}</div>
                {address.access_notes && <div className="text-subtle">Access: {address.access_notes}</div>}
              </div>
              <Space size={4} className="addresses-card__actions">
                <IconAction icon={Pencil} title="Edit" onClick={() => setAddressForm({ address })} />
                {!address.is_primary && <IconAction icon={Star} title="Make primary" onClick={() => setPrimary(address)} />}
                {showNearest && (
                  <IconAction icon={Users} title="Nearest employees" onClick={() => setNearestFor(address)} />
                )}
                {canDelete && <IconAction icon={Trash2} title="Delete" danger onClick={() => confirmDelete(address)} />}
              </Space>
            </li>
          ))}
        </ul>
      )}

      <AddressFormModal
        open={Boolean(addressForm)}
        userId={userId}
        address={addressForm?.address}
        onCancel={() => setAddressForm(null)}
        onSaved={() => {
          setAddressForm(null);
          onChanged?.();
        }}
      />
      {showNearest && (
        <NearestEmployeesModal
          open={Boolean(nearestFor)}
          subtitle={nearestFor?.one_line}
          load={() => listEmployeesNearAddress(nearestFor?.id ?? 0)}
          onClose={() => setNearestFor(null)}
        />
      )}
    </Card>
  );
};

export default AddressesCard;
