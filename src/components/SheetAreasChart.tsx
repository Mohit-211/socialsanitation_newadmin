import { useState, type ReactNode } from "react";
import { ChartColumn, ChevronDown, ChevronUp } from "lucide-react";
import type { ClientType, SheetArea } from "@/types";
import "@/styles/clientChart.scss";

export interface SheetAreasChartProps {
  areas?: Partial<SheetArea>[];
  clientType?: ClientType | null;
  loading?: boolean;
  emptyText?: ReactNode;
  title?: ReactNode;
}

/**
 * The "Initial Client Chart": a client sheet's areas with their counts,
 * flooring and special requests, shown beside a scope while it is edited.
 * What is counted depends on the client type.
 */
const SheetAreasChart = ({ areas = [], clientType = "commercial", loading = false, emptyText, title }: SheetAreasChartProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const commercial = clientType === "commercial";

  return (
    <div className="usb-chart-card" style={{ marginBottom: "30px" }}>
      <button className="usb-chart-card__toggle" onClick={() => setCollapsed((value) => !value)}>
        <ChartColumn size={16} className="usb-chart-card__toggle-icon" />
        <span className="usb-chart-card__toggle-title">{title || "Initial Client Chart"}</span>
        <span className="usb-chart-card__toggle-meta">
          {collapsed
            ? `${areas.length} row${areas.length !== 1 ? "s" : ""} · click to expand`
            : "click to collapse"}
        </span>
        {collapsed ? (
          <ChevronDown size={16} className="usb-chart-card__chevron" />
        ) : (
          <ChevronUp size={16} className="usb-chart-card__chevron" />
        )}
      </button>

      {!collapsed && (
        <div className="usb-chart-card__body">
          {loading ? (
            <p className="usb-chart-card__loading">Loading the client sheet…</p>
          ) : areas.length > 0 ? (
            <div className="usb-table-wrap">
              <table className="usb-table">
                <thead>
                  <tr>
                    <th>Service Area</th>
                    {commercial ? (
                      <>
                        <th>
                          # of Trash Cans
                          <br />
                          <small>or Stalls</small>
                        </th>
                        <th>
                          # of Desks
                          <br />
                          <small>or Sinks</small>
                        </th>
                        <th>
                          # of Rooms
                          <br />
                          <small>or Restrooms</small>
                        </th>
                      </>
                    ) : (
                      <th>
                        # of Desks / Trash Cans
                        <span className="usb-th-note">(Big Buildings) or # of Restrooms</span>
                      </th>
                    )}
                    <th>
                      Flooring Type
                      <span className="usb-th-note">Carpet, Hard Floor, VCT</span>
                    </th>
                    <th>Special Requests / Hot Spots</th>
                  </tr>
                </thead>
                <tbody>
                  {areas.map((area, index) => (
                    <tr key={area.id ?? index}>
                      <td>{area.service_area}</td>
                      {commercial ? (
                        <>
                          <td>{area.stalls || 0}</td>
                          <td>{area.sinks || 0}</td>
                          <td>{area.restrooms || 0}</td>
                        </>
                      ) : (
                        <td>{area.num_desks_trash_cans || 0}</td>
                      )}
                      <td>{area.flooring_type || "—"}</td>
                      <td>{area.special_requests || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="usb-chart-card__empty">{emptyText || "No areas recorded"}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default SheetAreasChart;
