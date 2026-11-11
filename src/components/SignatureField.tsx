import { useRef, useState } from "react";
import SignaturePad from "signature_pad";
import { Button, Modal } from "antd";
import { PenLine } from "lucide-react";
import { cssVar } from "@/theme/antdTheme";
import "./SignatureField.scss";

/** A form's state that holds the admin's signature as a data URL. */
export interface SignatureFieldProps<T extends { signature?: string | null }> {
  formData: T;
  setFormData: (next: T) => void;
}

const SignatureField = <T extends { signature?: string | null }>({ formData, setFormData }: SignatureFieldProps<T>) => {
  const [open, setOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePad | null>(null);

  // The canvas only exists while the modal is open, so the pad is created
  // after it opens. The canvas is scaled for crisp lines on high-DPI screens.
  const handleAfterOpenChange = (visible: boolean) => {
    if (!visible) {
      padRef.current?.off();
      padRef.current = null;
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext("2d")?.scale(ratio, ratio);
    padRef.current = new SignaturePad(canvas, {
      penColor: cssVar("--color-text"),
    });
  };

  const clearSignature = () => padRef.current?.clear();

  const saveSignature = () => {
    const pad = padRef.current;
    if (pad && !pad.isEmpty()) {
      setFormData({ ...formData, signature: pad.toDataURL() });
      setOpen(false);
    }
  };

  return (
    <>
      {formData.signature ? (
        <img
          src={formData.signature}
          alt="Signature"
          className="signature-field__preview"
        />
      ) : (
        <Button
          type="primary"
          icon={<PenLine size={16} />}
          onClick={() => setOpen(true)}
          className="signature-field__open"
        >
          Click to Sign
        </Button>
      )}

      <Modal
        title="Draw Your Signature"
        open={open}
        onCancel={() => setOpen(false)}
        afterOpenChange={handleAfterOpenChange}
        destroyOnHidden
        footer={[
          <Button key="clear" onClick={clearSignature}>
            Clear
          </Button>,
          <Button key="cancel" onClick={() => setOpen(false)}>
            Cancel
          </Button>,
          <Button key="save" type="primary" onClick={saveSignature}>
            Save
          </Button>,
        ]}
      >
        <canvas ref={canvasRef} className="signature-field__canvas" />
      </Modal>

      <div className="signature-block signature-field__label">
        Social Sanitation Legal Representative Signature{" "}
        <span className="required-mark">*</span>
      </div>
    </>
  );
};

export default SignatureField;
