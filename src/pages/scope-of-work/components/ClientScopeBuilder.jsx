import { useEffect, useState } from "react";
import { Switch, message, Spin, Empty, Modal, Tooltip } from "antd";
import {
  ChartColumn,
  ChevronDown,
  ChevronUp,
  CircleCheck,
  ClipboardList,
  FolderOpen,
  GripVertical,
  Pencil,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import "@/styles/clientChart.scss";
import "@/styles/scopeBuilder.scss";
import {
  GetUserScope,
  CreateUserSection,
  UpdateUserScopeSection,
  DeleteUserScopeSection,
  CreateUserScopeItem,
  UpdateUserScopeItem,
  DeleteUserScopeItem,
  ReorderUserScopeSections,
  ReorderUserScopeItems,
} from "@/services/api/scopeApi";
import { GetClientChecklistByUserId } from "@/services/api/bookingApi";

const FreqBadge = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`usb-freq-badge ${active ? "usb-freq-badge--active" : ""}`}
    title={label === "D" ? "Daily" : label === "W" ? "Weekly" : "Monthly"}
  >
    {label}
  </button>
);

/* SORTABLE SECTION WRAPPER */
/* dnd-kit requires useSortable() to be called from its own component,
   not inline inside a .map() — otherwise the hook count changes
   whenever a section is added/removed and breaks React's rules of hooks. */
const SortableSection = ({ id, disabled, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : "auto",
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children({ dragHandleProps: { ...attributes, ...listeners } })}
    </div>
  );
};

/* SORTABLE TASK ROW WRAPPER */
const SortableTaskRow = ({ id, disabled, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : "auto",
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children({ dragHandleProps: { ...attributes, ...listeners } })}
    </div>
  );
};

const ClientScopeBuilder = ({
  userId,
  onChange,
  initialSections = null,
}) => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingSection, setSavingSection] = useState(null);
  const [savingItem, setSavingItem] = useState(null);
  const [clientChecklist, setClientChecklist] = useState([]);
  const [loadingChecklist, setLoadingChecklist] = useState(false);
  const [clientType, setClientType] = useState("");

  const [chartCollapsed, setChartCollapsed] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({});

  // Requires the pointer to move 5px before a drag starts — this is what
  // lets you click into the title/description inputs normally without
  // accidentally triggering a drag.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  /* FETCH CHECKLIST */

  const fetchChecklist = async () => {
    if (!userId) {
      setClientChecklist([]);
      setClientType("residential");
      return;
    }
    try {
      setLoadingChecklist(true);
      const checklistRes = await GetClientChecklistByUserId(userId);
      const checklistData = checklistRes?.data?.data?.data?.[0] || {};
      setClientType(checklistData?.client_type || "residential");
      const list = checklistData?.user_client_checklist_details || [];
      setClientChecklist(list);
    } catch (error) {
      console.error(error);
      setClientChecklist([]);
      setClientType("residential");
      message.error("Failed to fetch client checklist");
    } finally {
      setLoadingChecklist(false);
    }
  };

  /* FETCH USER SCOPE */

  const fetchUserScope = async () => {
    if (!userId) {
      setSections([]);
      return;
    }
    try {
      setLoading(true);
      const res = await GetUserScope(userId);
      const data = res?.data?.data?.data || [];
      const formatted = data
        .map((section) => ({
          id: section.id,
          title: section.title,
          is_red: section.is_red,
          order: section.order ?? 0,
          items: (section.items || [])
            .map((item) => ({
              id: item.id,
              description: item.description,
              is_daily: item.is_daily,
              is_weekly: item.is_weekly,
              is_monthly: item.is_monthly,
              order: item.order ?? 0,
            }))
            .sort((a, b) => a.order - b.order),
        }))
        .sort((a, b) => a.order - b.order);
      setSections(formatted);
      if (onChange) onChange(formatted);
    } catch (err) {
      console.error(err);
      message.error("Failed to load user scope");
    } finally {
      setLoading(false);
    }
  };
useEffect(() => {
  if (initialSections !== null) {
    setSections(initialSections || []);
    fetchChecklist();
    return;
  }

  fetchUserScope();
  fetchChecklist();
}, [userId, initialSections]);

  useEffect(() => {
    if (onChange) onChange(sections);
  }, [sections]);

  /* COLLAPSE HELPERS */

  const toggleSection = (sectionIndex) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionIndex]: !prev[sectionIndex],
    }));
  };

  /* SECTION CHANGE */

  const handleSectionChange = (index, field, value) => {
    setSections((prev) =>
      prev.map((section, idx) =>
        idx === index ? { ...section, [field]: value } : section,
      ),
    );
  };

  /* ITEM CHANGE */

  const handleItemChange = (sectionIndex, itemIndex, field, value) => {
    setSections((prev) =>
      prev.map((section, idx) => {
        if (idx !== sectionIndex) return section;
        return {
          ...section,
          items: section.items.map((item, i) =>
            i === itemIndex ? { ...item, [field]: value } : item,
          ),
        };
      }),
    );
  };

  /* SECTION DRAG END */

  const sectionSortableId = (section) => `section-${section.id}`;

  const handleSectionDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex(
      (s) => sectionSortableId(s) === active.id,
    );
    const newIndex = sections.findIndex(
      (s) => sectionSortableId(s) === over.id,
    );
    if (oldIndex === -1 || newIndex === -1) return;

    const previousSections = sections;
    const reordered = arrayMove(sections, oldIndex, newIndex).map(
      (section, idx) => ({ ...section, order: idx }),
    );

    setSections(reordered);

    try {
      await ReorderUserScopeSections(
        reordered.map((s) => ({ id: s.id, order: s.order })),
      );
    } catch (err) {
      console.error(err);
      message.error("Failed to save new section order");
      setSections(previousSections);
    }
  };

  /* ITEM DRAG END */

  const itemSortableId = (item) => `item-${item.id || item.tempId}`;

  const handleItemDragEnd = (sectionIndex) => async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const section = sections[sectionIndex];
    const oldIndex = section.items.findIndex(
      (i) => itemSortableId(i) === active.id,
    );
    const newIndex = section.items.findIndex(
      (i) => itemSortableId(i) === over.id,
    );
    if (oldIndex === -1 || newIndex === -1) return;

    const previousSections = sections;
    const reorderedItems = arrayMove(section.items, oldIndex, newIndex).map(
      (item, idx) => ({ ...item, order: idx }),
    );

    setSections((prev) =>
      prev.map((sec, idx) =>
        idx === sectionIndex ? { ...sec, items: reorderedItems } : sec,
      ),
    );

    const savableItems = reorderedItems.filter((i) => i.id);
    if (savableItems.length === 0) return;

    try {
      await ReorderUserScopeItems(
        savableItems.map((i) => ({ id: i.id, order: i.order })),
      );
    } catch (err) {
      console.error(err);
      message.error("Failed to save new task order");
      setSections(previousSections);
    }
  };

  /* CREATE SECTION */

  const createSection = async () => {
    try {
      const res = await CreateUserSection({
        user_id: userId,
        title: "New Section",
        is_red: false,
      });
      const section = res?.data?.data?.data;
      setSections((prev) => [...prev, { ...section, items: [] }]);
      message.success("Section created");
    } catch (err) {
      console.error(err);
      message.error("Failed to create section");
    }
  };

  /* SAVE SECTION */

  const saveSection = async (section, index) => {
    try {
      setSavingSection(index);
      await UpdateUserScopeSection(section.id, {
        title: section.title,
        is_red: section.is_red,
      });
      message.success("Section saved");
    } catch (err) {
      console.error(err);
      message.error("Failed to save section");
    } finally {
      setSavingSection(null);
    }
  };

  /* DELETE SECTION */

  const deleteSection = async (sectionIndex) => {
    try {
      const section = sections[sectionIndex];
      Modal.confirm({
        title: "Delete Section",
        content: "Are you sure you want to delete this section?",
        okText: "Delete",
        okButtonProps: { danger: true },
        onOk: async () => {
          await DeleteUserScopeSection(section.id);
          setSections((prev) => prev.filter((_, i) => i !== sectionIndex));
          message.success("Section deleted");
        },
      });
    } catch (err) {
      console.error(err);
      message.error("Delete failed");
    }
  };

  /* ADD ITEM */

  const addItem = (sectionIndex) => {
    setCollapsedSections((prev) => ({ ...prev, [sectionIndex]: false }));

    setSections((prev) =>
      prev.map((section, idx) =>
        idx === sectionIndex
          ? {
              ...section,
              items: [
                ...section.items,
                {
                  tempId: Date.now(),
                  description: "",
                  is_daily: false,
                  is_weekly: false,
                  is_monthly: false,
                  order: section.items.length,
                },
              ],
            }
          : section,
      ),
    );
  };

  /* SAVE ITEM */

  const saveItem = async (item, sectionIndex, itemIndex) => {
    try {
      setSavingItem(`${sectionIndex}-${itemIndex}`);
      const section = sections[sectionIndex];

      if (!item.description?.trim()) {
        return message.warning("Task description is required");
      }

      if (!item.id) {
        const res = await CreateUserScopeItem(section.id, {
          user_scope_section_id: section.id,
          description: item.description,
          is_daily: item.is_daily,
          is_weekly: item.is_weekly,
          is_monthly: item.is_monthly,
        });
        const saved = res?.data?.data?.data || res?.data?.data || res?.data;
        setSections((prev) =>
          prev.map((sec, idx) => {
            if (idx !== sectionIndex) return sec;
            return {
              ...sec,
              items: sec.items.map((it, i) =>
                i === itemIndex ? { ...it, ...saved } : it,
              ),
            };
          }),
        );
        message.success("Task created");
      } else {
        await UpdateUserScopeItem(item.id, {
          description: item.description,
          is_daily: item.is_daily,
          is_weekly: item.is_weekly,
          is_monthly: item.is_monthly,
        });
        message.success("Task saved");
      }
    } catch (err) {
      console.error(err);
      message.error("Save failed");
    } finally {
      setSavingItem(null);
    }
  };

  /* DELETE ITEM */

  const deleteItem = async (sectionIndex, itemIndex) => {
    try {
      const item = sections[sectionIndex].items[itemIndex];
      if (item.id) {
        await DeleteUserScopeItem(item.id);
      }
      setSections((prev) =>
        prev.map((section, idx) =>
          idx === sectionIndex
            ? {
                ...section,
                items: section.items.filter((_, i) => i !== itemIndex),
              }
            : section,
        ),
      );
      message.success("Task deleted");
    } catch (err) {
      console.error(err);
      message.error("Delete failed");
    }
  };

  /* EMPTY / LOADING */

  if (!userId) {
    return (
      <div className="usb-empty">
        <Empty description="Select a client first" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="usb-loading">
        <Spin size="large" />
      </div>
    );
  }

  /* UI */

  return (
    <div className="usb-root">
      <div className="usb-header">
        <div className="usb-header__left">
          <span className="usb-header__icon">
            <ClipboardList size={28} />
          </span>
          <div>
            <h2 className="usb-header__title">Client Scope of Work</h2>
            <p className="usb-header__sub">
              {sections.length} section{sections.length !== 1 ? "s" : ""} ·{" "}
              {sections.reduce((acc, s) => acc + (s.items?.length || 0), 0)}{" "}
              task
              {sections.reduce((a, s) => a + (s.items?.length || 0), 0) !== 1
                ? "s"
                : ""}
            </p>
          </div>
        </div>

        <button className="usb-btn-add-section" onClick={createSection}>
          <Plus size={16} />
          <span>Add Section</span>
        </button>
      </div>

      <div className="usb-chart-card" style={{ marginBottom: "30px" }}>
        <button
          className="usb-chart-card__toggle"
          onClick={() => setChartCollapsed((v) => !v)}
        >
          <ChartColumn size={16} className="usb-chart-card__toggle-icon" />
          <span className="usb-chart-card__toggle-title">
            Initial Client Chart
          </span>
          <span className="usb-chart-card__toggle-meta">
            {chartCollapsed
              ? `${clientChecklist.length} row${clientChecklist.length !== 1 ? "s" : ""} · click to expand`
              : "click to collapse"}
          </span>
          {chartCollapsed ? (
            <ChevronDown size={16} className="usb-chart-card__chevron" />
          ) : (
            <ChevronUp size={16} className="usb-chart-card__chevron" />
          )}
        </button>

        {!chartCollapsed && (
          <div className="usb-chart-card__body">
            {loadingChecklist ? (
              <p className="usb-chart-card__loading">Loading checklist…</p>
            ) : clientChecklist.length > 0 ? (
              <div className="usb-table-wrap">
                <table className="usb-table">
                  <thead>
                    <tr>
                      <th>Service Area</th>
                      {clientType === "commercial" ? (
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
                          <span className="usb-th-note">
                            (Big Buildings) or # of Restrooms
                          </span>
                        </th>
                      )}
                      <th>
                        Flooring Type
                        <span className="usb-th-note">
                          Carpet, Hard Floor, VCT
                        </span>
                      </th>
                      <th>Special Requests / Hot Spots</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientChecklist.map((item) => (
                      <tr key={item.id}>
                        <td>{item.service_area}</td>
                        {clientType === "commercial" ? (
                          <>
                            <td>{item.stalls || 0}</td>
                            <td>{item.sinks || 0}</td>
                            <td>{item.restrooms || 0}</td>
                          </>
                        ) : (
                          <td>{item.num_desks_trash_cans || 0}</td>
                        )}
                        <td>{item.flooring_type || "—"}</td>
                        <td>{item.special_requests || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="usb-chart-card__empty">No checklist available</p>
            )}
          </div>
        )}
      </div>

      {sections.length === 0 && (
        <div className="usb-empty usb-empty--inner">
          <div className="usb-empty__icon">
            <FolderOpen size={40} />
          </div>
          <p className="usb-empty__text">No scope generated for this client.</p>
          <button className="usb-btn-add-section" onClick={createSection}>
            <Plus size={16} /> Add First Section
          </button>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleSectionDragEnd}
      >
        <SortableContext
          items={sections.map(sectionSortableId)}
          strategy={verticalListSortingStrategy}
        >
          <div className="usb-sections-list">
            {sections.map((section, sectionIndex) => {
              const isCollapsed = !!collapsedSections[sectionIndex];
              const isSavingSection = savingSection === sectionIndex;

              return (
                <SortableSection
                  key={section.id}
                  id={sectionSortableId(section)}
                >
                  {({ dragHandleProps }) => (
                    <div
                      className={`usb-section-card ${
                        section.is_red ? "usb-section-card--red" : ""
                      }`}
                    >
                      <div className="usb-section-card__header">
                        <div
                          className="usb-section-card__drag"
                          title="Drag to reorder section"
                          {...dragHandleProps}
                        >
                          <GripVertical size={14} />
                        </div>

                        <input
                          className="usb-section-card__title-input"
                          value={section.title}
                          placeholder="Section name…"
                          onChange={(e) =>
                            handleSectionChange(
                              sectionIndex,
                              "title",
                              e.target.value,
                            )
                          }
                        />

                        <div className="usb-section-card__controls">
                          <label
                            className="usb-red-toggle"
                            title="Mark section as high priority"
                          >
                            <span className="usb-red-toggle__dot" />
                            <span className="usb-red-toggle__label">
                              Priority
                            </span>
                            <Switch
                              size="small"
                              checked={section.is_red}
                              onChange={(val) =>
                                handleSectionChange(sectionIndex, "is_red", val)
                              }
                            />
                          </label>

                          <Tooltip title="Save section">
                            <button
                              className={`usb-btn usb-btn--save ${
                                isSavingSection ? "usb-btn--loading" : ""
                              }`}
                              onClick={() => saveSection(section, sectionIndex)}
                              disabled={isSavingSection}
                            >
                              <CircleCheck size={14} />
                              <span>Save</span>
                            </button>
                          </Tooltip>

                          <Tooltip title="Delete section">
                            <button
                              className="usb-btn usb-btn--danger"
                              onClick={() => deleteSection(sectionIndex)}
                            >
                              <Trash2 size={14} />
                              <span>Delete</span>
                            </button>
                          </Tooltip>

                          <button
                            className="usb-btn usb-btn--collapse"
                            onClick={() => toggleSection(sectionIndex)}
                            title={
                              isCollapsed
                                ? "Expand section"
                                : "Collapse section"
                            }
                          >
                            {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                          </button>
                        </div>
                      </div>

                      {!isCollapsed && (
                        <div className="usb-section-card__body">
                          {(section.items || []).length === 0 && (
                            <p className="usb-section-card__empty">
                              No tasks yet — click "Add Task" below.
                            </p>
                          )}

                          <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleItemDragEnd(sectionIndex)}
                          >
                            <SortableContext
                              items={(section.items || []).map(itemSortableId)}
                              strategy={verticalListSortingStrategy}
                            >
                              {(section.items || []).map((item, itemIndex) => {
                                const isSaved = !!item.id;
                                const isSavingThis =
                                  savingItem === `${sectionIndex}-${itemIndex}`;

                                return (
                                  <SortableTaskRow
                                    key={item.id || item.tempId}
                                    id={itemSortableId(item)}
                                    disabled={!isSaved}
                                  >
                                    {({ dragHandleProps }) => (
                                      <div
                                        className={`usb-task-row ${
                                          isSaved
                                            ? "usb-task-row--saved"
                                            : "usb-task-row--new"
                                        }`}
                                      >
                                        <span
                                          className={`usb-task-status ${
                                            isSaved
                                              ? "usb-task-status--saved"
                                              : "usb-task-status--new"
                                          }`}
                                        >
                                          {isSaved ? "Saved" : "New"}
                                        </span>

                                        <div
                                          className="usb-task-row__drag"
                                          title={
                                            isSaved
                                              ? "Drag to reorder task"
                                              : "Save this task before reordering"
                                          }
                                          style={{
                                            opacity: isSaved ? 1 : 0.4,
                                            cursor: isSaved
                                              ? "grab"
                                              : "not-allowed",
                                          }}
                                          {...(isSaved ? dragHandleProps : {})}
                                        >
                                          <GripVertical size={14} />
                                        </div>

                                        <input
                                          className="usb-task-row__input"
                                          value={item.description}
                                          placeholder="Describe the task…"
                                          onChange={(e) =>
                                            handleItemChange(
                                              sectionIndex,
                                              itemIndex,
                                              "description",
                                              e.target.value,
                                            )
                                          }
                                        />

                                        <div className="usb-task-row__freq">
                                          <FreqBadge
                                            label="D"
                                            active={item.is_daily}
                                            onClick={() =>
                                              handleItemChange(
                                                sectionIndex,
                                                itemIndex,
                                                "is_daily",
                                                !item.is_daily,
                                              )
                                            }
                                          />
                                          <FreqBadge
                                            label="W"
                                            active={item.is_weekly}
                                            onClick={() =>
                                              handleItemChange(
                                                sectionIndex,
                                                itemIndex,
                                                "is_weekly",
                                                !item.is_weekly,
                                              )
                                            }
                                          />
                                          <FreqBadge
                                            label="M"
                                            active={item.is_monthly}
                                            onClick={() =>
                                              handleItemChange(
                                                sectionIndex,
                                                itemIndex,
                                                "is_monthly",
                                                !item.is_monthly,
                                              )
                                            }
                                          />
                                        </div>

                                        <Tooltip
                                          title={
                                            isSaved
                                              ? "Update task"
                                              : "Save new task"
                                          }
                                        >
                                          <button
                                            className={`usb-btn ${
                                              isSaved
                                                ? "usb-btn--edit"
                                                : "usb-btn--save"
                                            } ${
                                              isSavingThis
                                                ? "usb-btn--loading"
                                                : ""
                                            }`}
                                            onClick={() =>
                                              saveItem(
                                                item,
                                                sectionIndex,
                                                itemIndex,
                                              )
                                            }
                                            disabled={isSavingThis}
                                          >
                                            {isSaved ? (
                                              <>
                                                <Pencil size={14} />
                                                <span>Update</span>
                                              </>
                                            ) : (
                                              <>
                                                <Save size={14} />
                                                <span>Save</span>
                                              </>
                                            )}
                                          </button>
                                        </Tooltip>

                                        <Tooltip title="Delete task">
                                          <button
                                            className="usb-btn usb-btn--danger"
                                            onClick={() =>
                                              deleteItem(
                                                sectionIndex,
                                                itemIndex,
                                              )
                                            }
                                          >
                                            <Trash2 size={14} />
                                            <span>Delete</span>
                                          </button>
                                        </Tooltip>
                                      </div>
                                    )}
                                  </SortableTaskRow>
                                );
                              })}
                            </SortableContext>
                          </DndContext>

                          <button
                            className="usb-btn-add-task"
                            onClick={() => addItem(sectionIndex)}
                          >
                            <Plus size={14} /> Add Task
                          </button>
                        </div>
                      )}

                      {isCollapsed && (
                        <div className="usb-section-card__collapsed-summary">
                          {section.items?.length || 0} task
                          {(section.items?.length || 0) !== 1 ? "s" : ""} —
                          click ↑ to expand
                        </div>
                      )}
                    </div>
                  )}
                </SortableSection>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default ClientScopeBuilder;
