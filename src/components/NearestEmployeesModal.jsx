import { useMemo, useRef, useState } from "react";
import { Button, Modal, Table, Tooltip } from "antd";
import { GoogleMap, InfoWindow, Marker, useJsApiLoader } from "@react-google-maps/api";
import { MapPin, Navigation, RefreshCw } from "lucide-react";
import { GOOGLE_MAPS_API_KEY } from "@/config/env";
import { cssVar } from "@/theme/antdTheme";
import { useApiQuery } from "@/hooks/useApiQuery";
import { dataOf } from "@/services/apiResult";
import "./NearestEmployeesModal.scss";

// Employees this far from the place would make the default view zoom out
// just to fit them; they stay off it, and picking one in the list still
// zooms to it.
const CLUSTER_MILES = 2;

// Google Maps needs real colors, so the tokens are read at run time.
const markerColors = () => ({
  place: cssVar("--color-primary-strong"),
  employee: cssVar("--color-success-strong"),
  selected: cssVar("--color-warning"),
  stroke: cssVar("--color-bg"),
  label: cssVar("--color-text-inverse"),
  selectedLabel: cssVar("--color-text"),
});

const hasPoint = (place) => Number.isFinite(Number(place?.address_lat)) && Number.isFinite(Number(place?.address_long));
const pointOf = (place) => ({ lat: Number(place.address_lat), lng: Number(place.address_long) });

/**
 * The employees who live closest to a place, on a map and in a list. `load`
 * returns the API call (GET /clients/:id/nearest-employees or
 * /addresses/:id/nearest-employees).
 */
const NearestEmployeesModal = ({ open, subtitle, load, onClose }) => {
  const mapRef = useRef(null);
  const [selectedId, setSelectedId] = useState(null);
  const colors = useMemo(() => markerColors(), []);
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: GOOGLE_MAPS_API_KEY, libraries: ["maps"] });

  const { data, loading } = useApiQuery(() => load().then(dataOf), [open], {
    skip: !open,
    errorText: "Couldn't find the nearest employees",
  });
  const place = data?.selected_address || data?.client || null;
  const employees = useMemo(() => (data?.employees || []).filter(hasPoint), [data]);
  const selected = employees.find((employee) => employee.id === selectedId);

  const fit = (points, padding) => {
    if (!mapRef.current || !window.google || !points.length) return;
    const bounds = new window.google.maps.LatLngBounds();
    points.forEach((point) => bounds.extend(point));
    mapRef.current.fitBounds(bounds, padding);
    window.google.maps.event.addListenerOnce(mapRef.current, "idle", () => {
      if (mapRef.current.getZoom() > 18) mapRef.current.setZoom(18);
    });
  };

  // The place and whoever is close by, or at least the closest person.
  const fitDefault = () => {
    if (!hasPoint(place)) return;
    const close = employees.filter((employee) => employee.distance <= CLUSTER_MILES);
    const shown = close.length ? close : employees.slice(0, 1);
    fit([pointOf(place), ...shown.map(pointOf)], 60);
  };

  const focus = (employee) => {
    setSelectedId(employee.id);
    if (hasPoint(place)) fit([pointOf(place), pointOf(employee)], 80);
  };

  const columns = [
    {
      title: "#",
      width: 50,
      align: "center",
      render: (_, __, index) => <span className="nearest-employees__index">{index + 1}</span>,
    },
    { title: "Name", dataIndex: "name", render: (name) => <span className="nearest-employees__name">{name}</span> },
    { title: "Type", dataIndex: "employee_type", width: 80, render: (type) => type || "—" },
    {
      title: "Distance",
      dataIndex: "distance",
      width: 100,
      align: "right",
      sorter: (a, b) => a.distance - b.distance,
      defaultSortOrder: "ascend",
      render: (distance) => <span className="nearest-employees__name">{distance} mi</span>,
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={900}
      destroyOnHidden
      title={
        <div className="nearest-employees__title">
          <span className="nearest-employees__title-icon">
            <MapPin size={17} />
          </span>
          <div>
            <div className="nearest-employees__title-text">Nearest Employees</div>
            {subtitle && <div className="nearest-employees__title-sub">{subtitle}</div>}
          </div>
        </div>
      }
    >
      <div className="nearest-employees__bar">
        <div className="nearest-employees__controls">
          <p className="nearest-employees__hint">
            <Navigation size={14} />
            {place?.address || "The place and the closest employees"}
          </p>
          <Tooltip title="Zoom back out to everyone close by">
            <Button
              type="link"
              size="small"
              className="nearest-employees__reset"
              icon={<RefreshCw size={14} />}
              onClick={() => {
                setSelectedId(null);
                fitDefault();
              }}
            >
              Reset View
            </Button>
          </Tooltip>
        </div>
        <p className="nearest-employees__hint">
          {loading ? "Looking…" : `${employees.length} employee${employees.length === 1 ? "" : "s"} found`}
        </p>
      </div>

      <div className="nearest-employees__panels">
        <div className="nearest-employees__panel">
          {!isLoaded || !data ? (
            <div className="nearest-employees__loading">Loading map…</div>
          ) : !hasPoint(place) ? (
            <div className="nearest-employees__loading">This address has no map position yet.</div>
          ) : (
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "100%" }}
              center={pointOf(place)}
              zoom={15}
              onLoad={(map) => {
                mapRef.current = map;
                fitDefault();
              }}
            >
              <Marker
                position={pointOf(place)}
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 12,
                  fillColor: colors.place,
                  fillOpacity: 1,
                  strokeColor: colors.stroke,
                  strokeWeight: 2,
                }}
                label={{ text: "C", color: colors.label, fontSize: "12px", fontWeight: "bold" }}
                title={place.address || "Client"}
                onClick={() => setSelectedId(null)}
                zIndex={999}
              />
              {employees.map((employee, index) => {
                const isSelected = employee.id === selectedId;
                return (
                  <Marker
                    key={employee.id}
                    position={pointOf(employee)}
                    icon={{
                      path: window.google.maps.SymbolPath.CIRCLE,
                      scale: isSelected ? 14 : 11,
                      fillColor: isSelected ? colors.selected : colors.employee,
                      fillOpacity: 1,
                      strokeColor: colors.stroke,
                      strokeWeight: 2,
                    }}
                    label={{
                      text: `${index + 1}`,
                      color: isSelected ? colors.selectedLabel : colors.label,
                      fontSize: "12px",
                      fontWeight: "bold",
                    }}
                    title={`${employee.name}: ${employee.distance} mi away`}
                    zIndex={isSelected ? 1000 : index}
                    onClick={() => focus(employee)}
                  />
                );
              })}
              {selected && (
                <InfoWindow position={pointOf(selected)} onCloseClick={() => setSelectedId(null)}>
                  <div>
                    <p>
                      <strong>{selected.name}</strong>
                    </p>
                    <p>{selected.address}</p>
                    <p>
                      <strong>{selected.distance} mi</strong> away
                    </p>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          )}
        </div>

        <div className="nearest-employees__panel nearest-employees__panel--list">
          <Table
            columns={columns}
            rowKey="id"
            dataSource={employees}
            loading={loading}
            pagination={false}
            size="small"
            locale={{ emptyText: "No employees with a home address found." }}
            onRow={(record) => ({
              onClick: () => focus(record),
              className: record.id === selectedId ? "is-selected" : undefined,
            })}
          />
        </div>
      </div>
    </Modal>
  );
};

export default NearestEmployeesModal;
