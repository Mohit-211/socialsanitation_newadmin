import { Button, Tooltip, type ButtonProps } from "antd";
import type { LucideIcon } from "lucide-react";

export interface IconActionProps extends Omit<ButtonProps, "icon" | "title" | "danger"> {
  /** A lucide-react icon component (not an element). */
  icon: LucideIcon;
  /** The tooltip, and the button's name for screen readers. */
  title: string;
  danger?: boolean;
  iconSize?: number;
}

/**
 * Icon-only action button with a tooltip, used for row actions in tables
 * and card headers (view, edit, delete, download...).
 *
 *   <IconAction icon={Pencil} title="Edit admin" onClick={() => edit(id)} />
 *   <IconAction icon={Trash2} title="Delete admin" danger onClick={...} />
 *
 * `icon` is a lucide-react component (not an element).
 */
const IconAction = ({
  icon: Icon,
  title,
  danger = false,
  size = "middle",
  iconSize = 16,
  className = "",
  ...buttonProps
}: IconActionProps) => (
  <Tooltip title={title}>
    <Button
      {...buttonProps}
      size={size}
      aria-label={title}
      className={[
        "icon-action",
        danger ? "icon-action--danger" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      icon={<Icon size={iconSize} />}
    />
  </Tooltip>
);

export default IconAction;
