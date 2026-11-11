import type { ReactNode } from "react";

/**
 * Standard page heading used at the top of every page: title, optional
 * subtitle and optional action buttons, on a card surface.
 *
 *   <PageHeader
 *     title="Admin Management"
 *     subtitle="View, edit, delete, and create admins"
 *     actions={<Button type="primary" icon={<Plus size={16} />}>Add admin</Button>}
 *   />
 *
 * Pass `card={false}` when the header sits inside another surface.
 */
export interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  /** false when the header sits inside another surface. */
  card?: boolean;
  className?: string;
}

const PageHeader = ({ title, subtitle, actions, card = true, className = "" }: PageHeaderProps) => {
  const classes = [
    "page-header",
    card ? "page-header--card surface surface--padded" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <header className={classes}>
      <div className="page-header__text">
        <h1 className="page-title">{title}</h1>
        {/* A text subtitle is a paragraph; tags or buttons can't sit inside one. */}
        {subtitle && typeof subtitle === "string" ? <p className="page-sub-title">{subtitle}</p> : null}
        {subtitle && typeof subtitle !== "string" ? <div className="page-sub-title">{subtitle}</div> : null}
      </div>
      {actions ? <div className="page-header__actions">{actions}</div> : null}
    </header>
  );
};

export default PageHeader;
