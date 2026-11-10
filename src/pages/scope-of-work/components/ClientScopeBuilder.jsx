import { useState } from "react";
import { Button, Select, Switch, message, Spin, Empty, Modal, Tooltip } from "antd";
import {
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
  CopyPlus,
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
import "@/styles/scopeBuilder.scss";
import {
  addScopeItem,
  addScopeSection,
  deleteScopeItem,
  deleteScopeSection,
  getMasterScope,
  getScopeOfWork,
  reorderScopeItems,
  reorderScopeSections,
  updateScopeItem,
  updateScopeSection,
} from "@/services/api/scopeApi";
import { getSheet } from "@/services/api/sheetApi";
import SheetAreasChart from "@/components/SheetAreasChart";
import { dataOf, errorMessage, itemsOf } from "@/services/apiResult";
import { useApiQuery } from "@/hooks/useApiQuery";
import { PERMISSION, useCan } from "@/lib/session";

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

// Sections and tasks of one client scope of work, in their order.
const sortSections = (sections = []) =>
  [...sections]
    .map((section) => ({
      ...section,
      items: [...(section.items || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

// Edits one client scope of work (by id): its sections and tasks, their order,
// and copies of master sections. Every change answers with the whole scope;
// only the part that changed is taken from it, so unsaved edits elsewhere stay.
const ClientScopeBuilder = ({ scopeId }) => {
  const canDelete = useCan(PERMISSION.DELETE_RECORDS);
  const [savingSection, setSavingSection] = useState(null);
  const [savingItem, setSavingItem] = useState(null);
  const [masterSectionId, setMasterSectionId] = useState();
  const [addingMaster, setAddingMaster] = useState(false);

  const [collapsedSections, setCollapsedSections] = useState({});

  // Requires the pointer to move 5px before a drag starts — this is what
  // lets you click into the title/description inputs normally without
  // accidentally triggering a drag.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  /* LOAD THE SCOPE, ITS SHEET AND THE MASTER LIST */

  const {
    data: scope,
    loading,
    setData: setScope,
  } = useApiQuery(
    () => getScopeOfWork(scopeId).then((res) => {
      const loaded = dataOf(res);
      return { ...loaded, sections: sortSections(loaded?.sections) };
    }),
    [scopeId],
    { skip: !scopeId, errorText: "Couldn't load the scope of work" },
  );
  const sections = scope?.sections ?? [];
  const setSections = (update) =>
    setScope((current) => ({
      ...current,
      sections: typeof update === "function" ? update(current?.sections ?? []) : update,
    }));
  const clientType = scope?.client_type || "commercial";

  const { data: sheet, loading: loadingChecklist } = useApiQuery(
    () => getSheet(scope.client_sheet_id).then(dataOf),
    [scope?.client_sheet_id],
    { skip: !scope?.client_sheet_id, errorText: "Couldn't load the client sheet" },
  );
  const clientChecklist = scope?.client_sheet_id ? sheet?.areas ?? [] : [];

  const { data: masterSections } = useApiQuery(
    () => getMasterScope(clientType).then(itemsOf),
    [clientType],
    { skip: !scope, initial: [] },
  );

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
      await reorderScopeSections(
        scopeId,
        reordered.map((s) => ({ id: s.id, order: s.order })),
      );
    } catch (err) {
      message.error(errorMessage(err, "Couldn't save the new section order"));
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
      await reorderScopeItems(
        scopeId,
        section.id,
        savableItems.map((i) => ({ id: i.id, order: i.order })),
      );
    } catch (err) {
      message.error(errorMessage(err, "Couldn't save the new task order"));
      setSections(previousSections);
    }
  };

  /* CREATE SECTION */

  // The section the answer has that the screen doesn't yet.
  const newSectionFrom = (res) => {
    const known = new Set(sections.map((section) => section.id));
    const added = (dataOf(res)?.sections || []).find((section) => !known.has(section.id));
    return added ? sortSections([added])[0] : null;
  };

  const createSection = async () => {
    try {
      const res = await addScopeSection(scopeId, { title: "New Section", is_red: false });
      const section = newSectionFrom(res);
      if (section) setSections((prev) => [...prev, { ...section, items: section.items || [] }]);
      message.success("Section created");
    } catch (err) {
      message.error(errorMessage(err, "Couldn't create the section"));
    }
  };

  // Copies a master section with its tasks into this scope.
  const addMasterSection = async () => {
    if (!masterSectionId) return;
    setAddingMaster(true);
    try {
      const res = await addScopeSection(scopeId, { master_section_id: masterSectionId });
      const section = newSectionFrom(res);
      if (section) setSections((prev) => [...prev, section]);
      setMasterSectionId(undefined);
      message.success("Section added from the master list");
    } catch (err) {
      message.error(errorMessage(err, "Couldn't add the section"));
    } finally {
      setAddingMaster(false);
    }
  };

  /* SAVE SECTION */

  const saveSection = async (section, index) => {
    try {
      setSavingSection(index);
      await updateScopeSection(scopeId, section.id, {
        title: section.title,
        is_red: section.is_red,
      });
      message.success("Section saved");
    } catch (err) {
      message.error(errorMessage(err, "Couldn't save the section"));
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
          try {
            await deleteScopeSection(scopeId, section.id);
            setSections((prev) => prev.filter((_, i) => i !== sectionIndex));
            message.success("Section deleted");
          } catch (err) {
            message.error(errorMessage(err, "Couldn't delete the section"));
          }
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
        const res = await addScopeItem(scopeId, section.id, {
          description: item.description,
          is_daily: item.is_daily,
          is_weekly: item.is_weekly,
          is_monthly: item.is_monthly,
        });
        // The new task is the one in this section the screen doesn't know yet.
        const known = new Set(section.items.filter((it) => it.id).map((it) => it.id));
        const answered = (dataOf(res)?.sections || []).find((sec) => sec.id === section.id);
        const saved = (answered?.items || []).find((it) => !known.has(it.id)) || {};
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
        await updateScopeItem(scopeId, item.id, {
          description: item.description,
          is_daily: item.is_daily,
          is_weekly: item.is_weekly,
          is_monthly: item.is_monthly,
        });
        message.success("Task saved");
      }
    } catch (err) {
      message.error(errorMessage(err, "Couldn't save the task"));
    } finally {
      setSavingItem(null);
    }
  };

  /* DELETE ITEM */

  const deleteItem = async (sectionIndex, itemIndex) => {
    try {
      const item = sections[sectionIndex].items[itemIndex];
      if (item.id) {
        await deleteScopeItem(scopeId, item.id);
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
      message.error(errorMessage(err, "Couldn't delete the task"));
    }
  };

  /* EMPTY / LOADING */

  if (!scopeId) {
    return (
      <div className="usb-empty">
        <Empty description="Choose a scope of work first" />
      </div>
    );
  }

  if (loading && !scope) {
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

        <div className="usb-header__actions">
          <Select
            className="usb-master-select"
            placeholder="Add a section from the master list"
            value={masterSectionId}
            onChange={setMasterSectionId}
            showSearch
            optionFilterProp="label"
            options={(masterSections || []).map((section) => ({
              value: section.id,
              label: `${section.title} (${section.items?.length || 0} tasks)`,
            }))}
            popupMatchSelectWidth={false}
          />
          <Button
            icon={<CopyPlus size={16} />}
            onClick={addMasterSection}
            disabled={!masterSectionId}
            loading={addingMaster}
          >
            Add
          </Button>
          <button className="usb-btn-add-section" onClick={createSection}>
            <Plus size={16} />
            <span>Add Section</span>
          </button>
        </div>
      </div>

      <SheetAreasChart
        areas={clientChecklist}
        clientType={clientType}
        loading={loadingChecklist}
        emptyText={
          scope?.client_sheet_id
            ? "This sheet has no areas"
            : "This scope was made from the whole master list, not a sheet"
        }
      />

      {sections.length === 0 && (
        <div className="usb-empty usb-empty--inner">
          <div className="usb-empty__icon">
            <FolderOpen size={40} />
          </div>
          <p className="usb-empty__text">This scope of work has no sections yet.</p>
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

                          {canDelete && (
                            <Tooltip title="Delete section">
                              <button
                                className="usb-btn usb-btn--danger"
                                onClick={() => deleteSection(sectionIndex)}
                              >
                                <Trash2 size={14} />
                                <span>Delete</span>
                              </button>
                            </Tooltip>
                          )}

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

                                        {(canDelete || !isSaved) && (
                                          <Tooltip title={isSaved ? "Delete task" : "Discard task"}>
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
                                              <span>{isSaved ? "Delete" : "Discard"}</span>
                                            </button>
                                          </Tooltip>
                                        )}
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
