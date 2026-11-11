import { useState } from "react";
import { Modal, message } from "antd";
import { EyeOff, Share2 } from "lucide-react";
import IconAction from "@/components/IconAction";
import { DOCUMENT_KINDS, shareDocument, unshareDocument, type DocumentKind } from "@/services/api/documentApi";
import { errorMessage } from "@/services/apiResult";
import type { Id } from "@/types";

export interface ShareToggleProps {
  kind: DocumentKind;
  id: Id;
  sharedAt?: string | null;
  /** Hears when it was shared, or null once hidden. */
  onChanged?: (sharedAt: string | null) => void;
}

/**
 * Shares a document with the client app, or hides it again. Sharing tells the
 * client by app notification and email, so it asks first.
 */
const ShareToggle = ({ kind, id, sharedAt, onChanged }: ShareToggleProps) => {
  const [busy, setBusy] = useState(false);
  const name = DOCUMENT_KINDS[kind]?.name || "document";

  const run = async (share: boolean) => {
    setBusy(true);
    try {
      if (share) await shareDocument(kind, id);
      else await unshareDocument(kind, id);
      message.success(share ? `${name} shared with the client` : `${name} hidden from the client app`);
      onChanged?.(share ? new Date().toISOString() : null);
    } catch (error) {
      message.error(errorMessage(error, "Couldn't change the sharing"));
    } finally {
      setBusy(false);
    }
  };

  if (sharedAt) {
    return <IconAction icon={EyeOff} title="Hide from the client app" onClick={() => run(false)} disabled={busy} />;
  }
  return (
    <IconAction
      icon={Share2}
      title="Share with the client"
      disabled={busy}
      onClick={() =>
        Modal.confirm({
          title: `Share this ${name.toLowerCase()} with the client?`,
          content: "It shows in their app, and they get a notification and an email.",
          okText: "Share",
          onOk: () => run(true),
        })
      }
    />
  );
};

export default ShareToggle;
