import { useState } from "react";
import { Input, Modal, message } from "antd";
import { resetEmployeeCredentials } from "@/services/api/employeeApi";
import { errorMessage } from "@/services/apiResult";
import type { Employee } from "@/types";

/**
 * A new password for an employee, emailed to them, to a new address when it
 * is changed here. Says so when the email couldn't go out (502).
 */
interface ResetCredentialsModalProps {
  employee: Pick<Employee, "id" | "email" | "name"> | null;
  onClose: () => void;
  onDone?: () => void;
}

const ResetCredentialsModal = ({ employee, onClose, onDone }: ResetCredentialsModalProps) => {
  const [email, setEmail] = useState(employee?.email || "");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!employee) return;
    setSending(true);
    try {
      const changed = email.trim().toLowerCase() !== (employee.email || "").toLowerCase();
      const res = await resetEmployeeCredentials(employee.id, changed ? email.trim().toLowerCase() : null);
      message.success(res.data?.message || "New sign-in details sent");
      onDone?.();
      onClose();
    } catch (error) {
      message.error(errorMessage(error, "Couldn't send new sign-in details"));
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      open={Boolean(employee)}
      title={`New Sign-In Details for ${employee?.name || employee?.email || "the Employee"}`}
      okText="Make and Send a New Password"
      confirmLoading={sending}
      onOk={send}
      onCancel={onClose}
      destroyOnHidden
    >
      <p className="text-secondary">A new password goes to this email. Change it to move their sign-in to a new address.</p>
      <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Their email" />
    </Modal>
  );
};

export default ResetCredentialsModal;
