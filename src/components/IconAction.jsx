import { Button, Tooltip } from "antd";

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
}) => (
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
