import { useRef, useState } from "react";
import { Switch, message, Empty, Modal, Spin, Tooltip } from "antd";
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
} from "lucide-react";
import "@/styles/scopeBuilder.scss";
import {
  addEstimateItem,
  addEstimateSection,
  deleteEstimateItem,
  deleteEstimateSection,
  getEstimateScope,
  updateEstimateItem,
  updateEstimateSection,
} from "@/services/api/estimateApi";
import { getSheet, listSheets } from "@/services/api/sheetApi";
import { getClient } from "@/services/api/clientApi";
import { dataOf, errorMessage, itemsOf } from "@/services/apiResult";
import { useApiQuery } from "@/hooks/useApiQuery";
import { PERMISSION, useCan } from "@/lib/session";
import SheetAreasChart from "@/components/SheetAreasChart";
import type { Id, ScopeItem, ScopeSection } from "@/types";

/** A task on the screen: a saved one has its id; a new one a tempId until it is saved. */
type EditItem = Partial<ScopeItem> & {
  description: string;
  is_daily: boolean;
  is_weekly: boolean;
  is_monthly: boolean;
  tempId?: number;
};
type EditSection = Omit<ScopeSection, "items"> & { items: EditItem[] };

const sortSections = (sections: ScopeSection[] = []): EditSection[] =>
  [...sections]
    .map((section) => ({
      ...section,
      items: [...(section.items || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

const FreqBadge = ({ label, active, onClick }: { label: "D" | "W" | "M"; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`usb-freq-badge ${active ? "usb-freq-badge--active" : ""}`}
    title={label === "D" ? "Daily" : label === "W" ? "Weekly" : "Monthly"}
  >
    {label}
  </button>
);

// The estimate's own copy of the scope: the sections and tasks its PDF
// prints. Edits here change only this estimate, not the client's scope.
const EstimateScopeBuilder = ({ estimateId, userId }: { estimateId: Id; userId: Id }) => {
  const canDelete = useCan(PERMISSION.DELETE_RECORDS);
  const [savingSection, setSavingSection] = useState<number | null>(null);
  const [savingItem, setSavingItem] = useState<string | null>(null);

  /* Collapse state */
  const [collapsedSections, setCollapsedSections] = useState<Record<number, boolean>>({});

  /* Refs */
  const sectionsEndRef = useRef<HTMLDivElement>(null);

  const {
    data: sections,
    loading,
    setData: setSections,
  } = useApiQuery(() => getEstimateScope(estimateId).then((res) => sortSections(itemsOf(res))), [estimateId], {
    initial: [],
    skip: !estimateId,
    errorText: "Couldn't load the estimate's scope",
  });

  // The client's newest sheet, shown beside the tasks as the Initial Client Chart.
  const { data: newestSheet, loading: loadingChecklist } = useApiQuery(
    async () => {
      const sheets = itemsOf(await listSheets(userId));
      return sheets[0] ? dataOf(await getSheet(sheets[0].id)) : null;
    },
    [userId],
    { skip: !userId },
  );
  const { data: client } = useApiQuery(() => getClient(userId).then(dataOf), [userId], { skip: !userId });
  const clientChecklist = newestSheet?.areas ?? [];
  const clientType = client?.client_type || "commercial";

  /* COLLAPSE HELPERS */

  const toggleSection = (sectionIndex: number) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionIndex]: !prev[sectionIndex],
    }));
  };

  /* SECTION CHANGE */

  const handleSectionChange = <K extends keyof EditSection>(index: number, field: K, value: EditSection[K]) => {
    setSections((prev) =>
      prev.map((section, idx) =>
        idx === index ? { ...section, [field]: value } : section,
      ),
    );
  };

  /* ITEM CHANGE */

  const handleItemChange = <K extends keyof EditItem>(sectionIndex: number, itemIndex: number, field: K, value: EditItem[K]) => {
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

  /* CREATE SECTION */

  const createSection = async () => {
    try {
      const res = await addEstimateSection(estimateId, {
        title: "New Section",
        is_red: false,
      });
      const section = dataOf(res);
      setSections((prev) => [...prev, { ...section, items: section?.items || [] }]);
      message.success("Section created");

      /* Scroll to new section after state update */
      setTimeout(() => {
        sectionsEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      message.error(errorMessage(err, "Couldn't create the section"));
    }
  };

  /* SAVE SECTION */

  const saveSection = async (section: EditSection, index: number) => {
    try {
      setSavingSection(index);
      await updateEstimateSection(estimateId, section.id, {
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

  const deleteSection = async (sectionIndex: number) => {
    try {
      const section = sections[sectionIndex];
      Modal.confirm({
        title: "Delete Section",
        content: "Are you sure you want to delete this section?",
        okText: "Delete",
        okButtonProps: { danger: true },
        onOk: async () => {
          try {
            await deleteEstimateSection(estimateId, section.id);
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

  const addItem = (sectionIndex: number) => {
    /* Expand the section if collapsed */
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
                },
              ],
            }
          : section,
      ),
    );
  };

  /* SAVE ITEM */

  const saveItem = async (item: EditItem, sectionIndex: number, itemIndex: number) => {
    try {
      setSavingItem(`${sectionIndex}-${itemIndex}`);
      const section = sections[sectionIndex];

      if (!item.description?.trim()) {
        return message.warning("Task description is required");
      }

      if (!item.id) {
        /* CREATE */
        const res = await addEstimateItem(estimateId, {
          section_id: section.id,
          description: item.description,
          is_daily: item.is_daily,
          is_weekly: item.is_weekly,
          is_monthly: item.is_monthly,
        });
        const saved = dataOf(res) || {};
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
        /* UPDATE */
        await updateEstimateItem(estimateId, item.id, {
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

  const deleteItem = async (sectionIndex: number, itemIndex: number) => {
    try {
      const item = sections[sectionIndex].items[itemIndex];
      if (item.id) {
        await deleteEstimateItem(estimateId, item.id);
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

  /* EMPTY */

  if (!estimateId) {
    return (
      <div className="usb-empty">
        <Empty description="Save the estimate first" />
      </div>
    );
  }

  if (loading && !sections.length) {
    return (
      <div className="usb-loading">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="usb-root">
      {/* ── HEADER ── */}
      <div className="usb-header">
        <div className="usb-header__left">
          <span className="usb-header__icon">
            <ClipboardList size={28} />
          </span>
          <div>
            <h2 className="usb-header__title">This Estimate's Scope of Work</h2>
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

      {/* ── INITIAL CLIENT CHART ── */}
      <SheetAreasChart
        areas={clientChecklist}
        clientType={clientType}
        loading={loadingChecklist}
        title="Initial Client Chart (newest sheet)"
        emptyText="This client has no sheet with areas"
      />

      {/* ── NO SECTIONS ── */}
      {sections.length === 0 && (
        <div className="usb-empty usb-empty--inner">
          <div className="usb-empty__icon">
            <FolderOpen size={40} />
          </div>
          <p className="usb-empty__text">This estimate's scope has no sections.</p>
          <button className="usb-btn-add-section" onClick={createSection}>
            <Plus size={16} /> Add First Section
          </button>
        </div>
      )}

      {/* ── SECTIONS ── */}
      <div className="usb-sections-list">
        {sections.map((section, sectionIndex) => {
          const isCollapsed = !!collapsedSections[sectionIndex];
          const isSavingSection = savingSection === sectionIndex;

          return (
            <div
              key={section.id}
              className={`usb-section-card ${
                section.is_red ? "usb-section-card--red" : ""
              }`}
            >
              {/* SECTION HEADER */}
              <div className="usb-section-card__header">
                <div className="usb-section-card__drag" title="Drag to reorder">
                  <GripVertical size={14} />
                </div>

                <input
                  className="usb-section-card__title-input"
                  value={section.title}
                  placeholder="Section name…"
                  onChange={(e) =>
                    handleSectionChange(sectionIndex, "title", e.target.value)
                  }
                />

                <div className="usb-section-card__controls">
                  {/* Red toggle */}
                  <label
                    className="usb-red-toggle"
                    title="Mark section as high priority"
                  >
                    <span className="usb-red-toggle__dot" />
                    <span className="usb-red-toggle__label">Priority</span>
                    <Switch
                      size="small"
                      checked={section.is_red}
                      onChange={(val) =>
                        handleSectionChange(sectionIndex, "is_red", val)
                      }
                    />
                  </label>

                  {/* Save section */}
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

                  {/* Delete section */}
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

                  {/* Collapse toggle */}
                  <button
                    className="usb-btn usb-btn--collapse"
                    onClick={() => toggleSection(sectionIndex)}
                    title={isCollapsed ? "Expand section" : "Collapse section"}
                  >
                    {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                  </button>
                </div>
              </div>

              {/* SECTION BODY */}
              {!isCollapsed && (
                <div className="usb-section-card__body">
                  {(section.items || []).length === 0 && (
                    <p className="usb-section-card__empty">
                      No tasks yet — click "Add Task" below.
                    </p>
                  )}

                  {(section.items || []).map((item, itemIndex) => {
                    const isSaved = !!item.id;
                    const isSavingThis =
                      savingItem === `${sectionIndex}-${itemIndex}`;

                    return (
                      <div
                        key={item.id || item.tempId}
                        className={`usb-task-row ${
                          isSaved ? "usb-task-row--saved" : "usb-task-row--new"
                        }`}
                      >
                        {/* Status pill */}
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
                          title="Drag to reorder"
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

                        {/* Frequency badges */}
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

                        {/* Save / Update button */}
                        <Tooltip
                          title={isSaved ? "Update task" : "Save new task"}
                        >
                          <button
                            className={`usb-btn ${
                              isSaved ? "usb-btn--edit" : "usb-btn--save"
                            } ${isSavingThis ? "usb-btn--loading" : ""}`}
                            onClick={() =>
                              saveItem(item, sectionIndex, itemIndex)
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

                        {/* Delete task (an unsaved one is only discarded) */}
                        {(canDelete || !item.id) && (
                          <Tooltip title={item.id ? "Delete task" : "Discard task"}>
                            <button
                              className="usb-btn usb-btn--danger"
                              onClick={() => deleteItem(sectionIndex, itemIndex)}
                            >
                              <Trash2 size={14} />
                              <span>{item.id ? "Delete" : "Discard"}</span>
                            </button>
                          </Tooltip>
                        )}
                      </div>
                    );
                  })}

                  <button
                    className="usb-btn-add-task"
                    onClick={() => addItem(sectionIndex)}
                  >
                    <Plus size={14} /> Add Task
                  </button>
                </div>
              )}

              {/* Collapsed summary */}
              {isCollapsed && (
                <div className="usb-section-card__collapsed-summary">
                  {section.items?.length || 0} task
                  {(section.items?.length || 0) !== 1 ? "s" : ""} — click ↑ to
                  expand
                </div>
              )}
            </div>
          );
        })}

        {/* Scroll anchor for new sections */}
        <div ref={sectionsEndRef} />
      </div>
    </div>
  );
};

export default EstimateScopeBuilder;
