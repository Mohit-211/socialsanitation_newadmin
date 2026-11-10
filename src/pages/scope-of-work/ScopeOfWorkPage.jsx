import { useEffect, useRef, useState } from "react";
import { Modal, Switch, message } from "antd";
import {
  ChevronDown,
  ChevronUp,
  ClipboardList,
  FolderOpen,
  GripVertical,
  Pencil,
  Plus,
  Save,
  Trash2,
} from "lucide-react";

import {
  createMasterItem,
  createMasterSection,
  deleteMasterItem,
  deleteMasterSection,
  getMasterScope,
  updateMasterItem,
  updateMasterSection,
} from "@/services/api/scopeApi";
import { dataOf, errorMessage, itemsOf } from "@/services/apiResult";
import { PERMISSION, useCan } from "@/lib/session";

import "./ScopeOfWorkPage.scss";

const CLIENT_TYPES = [
  { label: "Commercial", value: "commercial" },
  { label: "Residential", value: "residential" },
];

const FreqBadge = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`freq-badge ${active ? "freq-badge--active" : ""}`}
  >
    {label}
  </button>
);

const ScopeOfWorkPage = () => {
  const canDelete = useCan(PERMISSION.DELETE_RECORDS);
  const [clientType, setClientType] = useState("commercial");
  const [sections, setSections] = useState([]);
  // Loading starts with the first fetch; switching type sets it again.
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState(null);
  const [savingItem, setSavingItem] = useState(null);

  // Track which sections have unsaved changes (by key = id || tempId)
  const [dirtySections, setDirtySections] = useState(new Set());
  // Track which items have unsaved changes (by key = `${sectionKey}-${itemKey}`)
  const [dirtyItems, setDirtyItems] = useState(new Set());
  // Track collapsed sections
  const [collapsedSections, setCollapsedSections] = useState(new Set());

  // Refs map for scrolling to new section title inputs
  const sectionRefs = useRef({});
  // Guards against out-of-order responses when switching client type quickly
  const requestIdRef = useRef(0);

  /* FETCH */

  const formatSections = (sectionsArray) =>
    sectionsArray.map((section) => ({
      id: section.id,
      title: section.title,
      is_red: section.is_red,
      items: (section.items || []).map((item) => ({
        id: item.id,
        description: item.description,
        is_daily: item.is_daily,
        is_weekly: item.is_weekly,
        is_monthly: item.is_monthly,
      })),
    }));

  // Loads the master list for the client type; an answer for a type the
  // admin has since switched away from is ignored.
  useEffect(() => {
    const requestId = ++requestIdRef.current;
    const isCurrent = () => requestId === requestIdRef.current;
    getMasterScope(clientType)
      .then((res) => {
        if (isCurrent()) setSections(formatSections(itemsOf(res)));
      })
      .catch((err) => {
        if (isCurrent()) message.error(errorMessage(err, "Couldn't load the master list"));
      })
      .finally(() => {
        if (isCurrent()) setLoading(false);
      });
  }, [clientType]);

  /* CLIENT TYPE SWITCH */

  const hasUnsavedChanges = dirtySections.size > 0 || dirtyItems.size > 0;

  const switchClientType = (type) => {
    setDirtySections(new Set());
    setDirtyItems(new Set());
    setCollapsedSections(new Set());
    setSections([]);
    setLoading(true);
    setClientType(type);
  };

  const handleClientTypeChange = (type) => {
    if (type === clientType) return;

    if (hasUnsavedChanges) {
      Modal.confirm({
        title: "Discard unsaved changes?",
        content: `You have unsaved changes in ${clientType} scope. Switching to ${type} will discard them.`,
        okText: "Discard",
        okButtonProps: { danger: true },
        cancelText: "Stay",
        onOk: () => switchClientType(type),
      });
      return;
    }

    switchClientType(type);
  };

  /* HELPERS */

  const getSectionKey = (section) =>
    String(section.id || section.tempId);

  const getItemKey = (section, item) =>
    `${getSectionKey(section)}-${String(item.id || item.tempId)}`;

  /* ADD */

  const addSection = () => {
    const tempId = Date.now();
    const newSection = {
      tempId,
      title: "",
      is_red: false,
      items: [],
    };

    setSections((prev) => [...prev, newSection]);

    // Mark as dirty immediately
    setDirtySections((prev) => new Set([...prev, String(tempId)]));

    // Scroll to the new section after render
    setTimeout(() => {
      const ref = sectionRefs.current[String(tempId)];
      if (ref) {
        ref.scrollIntoView({ behavior: "smooth", block: "center" });
        ref.focus();
      }
    }, 80);
  };

  const addItem = (sectionIndex) => {
    const section = sections[sectionIndex];
    const tempId = Date.now();
    const newItem = {
      tempId,
      description: "",
      is_daily: false,
      is_weekly: false,
      is_monthly: false,
    };

    setSections((prev) =>
      prev.map((sec, idx) =>
        idx === sectionIndex
          ? { ...sec, items: [...sec.items, newItem] }
          : sec
      )
    );

    // Mark item as dirty
    const itemKey = `${getSectionKey(section)}-${String(tempId)}`;
    setDirtyItems((prev) => new Set([...prev, itemKey]));

    // Ensure section is expanded
    const sectionKey = getSectionKey(section);
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      next.delete(sectionKey);
      return next;
    });
  };

  /* DELETE */

  const deleteSectionHandler = async (index) => {
    try {
      const section = sections[index];
      if (section.id) {
        await deleteMasterSection(section.id);
      }
      const key = getSectionKey(section);
      setSections((prev) => prev.filter((_, i) => i !== index));
      setDirtySections((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      message.success("Section deleted");
    } catch (err) {
      message.error(errorMessage(err, "Couldn't delete the section"));
    }
  };

  const deleteItemHandler = async (sectionIndex, itemIndex) => {
    try {
      const section = sections[sectionIndex];
      const item = section.items[itemIndex];
      if (item.id) {
        await deleteMasterItem(item.id);
      }
      const iKey = getItemKey(section, item);
      setSections((prev) =>
        prev.map((sec, idx) =>
          idx === sectionIndex
            ? { ...sec, items: sec.items.filter((_, i) => i !== itemIndex) }
            : sec
        )
      );
      setDirtyItems((prev) => {
        const next = new Set(prev);
        next.delete(iKey);
        return next;
      });
      message.success("Task deleted");
    } catch (err) {
      message.error(errorMessage(err, "Couldn't delete the task"));
    }
  };

  /* CHANGE */

  const handleSectionChange = (index, field, value) => {
    setSections((prev) =>
      prev.map((section, idx) => {
        if (idx !== index) return section;
        const updated = { ...section, [field]: value };
        // Mark dirty
        setDirtySections((d) => new Set([...d, getSectionKey(updated)]));
        return updated;
      })
    );
  };

  const handleItemChange = (sectionIndex, itemIndex, field, value) => {
    setSections((prev) =>
      prev.map((section, idx) => {
        if (idx !== sectionIndex) return section;
        const updatedItems = section.items.map((item, i) => {
          if (i !== itemIndex) return item;
          const updatedItem = { ...item, [field]: value };
          const iKey = getItemKey(section, updatedItem);
          setDirtyItems((d) => new Set([...d, iKey]));
          return updatedItem;
        });
        return { ...section, items: updatedItems };
      })
    );
  };

  /* SAVE SECTION */

  const saveSection = async (section, index) => {
    try {
      setSavingSection(index);

      if (!section.title?.trim()) {
        return message.warning("Section title required");
      }

      const key = getSectionKey(section);

      if (!section.id) {
        const res = await createMasterSection({
          title: section.title,
          is_red: section.is_red,
          client_type: clientType,
        });

        const saved = dataOf(res) || {};

        setSections((prev) =>
          prev.map((sec, idx) =>
            idx === index ? { ...sec, ...saved } : sec
          )
        );

        // After save, clear dirty and remove from editing mode
        const newKey = String(saved?.id || key);
        setDirtySections((prev) => {
          const next = new Set(prev);
          next.delete(key);
          next.delete(newKey);
          return next;
        });

        message.success("Section created");
      } else {
        await updateMasterSection(section.id, {
          title: section.title,
          is_red: section.is_red,
        });

        setDirtySections((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });

        message.success("Section updated");
      }
    } catch (err) {
      message.error(errorMessage(err, "Couldn't save the section"));
    } finally {
      setSavingSection(null);
    }
  };

  /* SAVE ITEM */

  const saveItem = async (item, sectionIndex, itemIndex) => {
    try {
      const key = `${sectionIndex}-${itemIndex}`;
      setSavingItem(key);

      const section = sections[sectionIndex];

      if (!section.id) {
        return message.warning("Save section first");
      }

      if (!item.description?.trim()) {
        return message.warning("Task description required");
      }

      const iKey = getItemKey(section, item);

      if (!item.id) {
        const res = await createMasterItem({
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
                i === itemIndex ? { ...it, ...saved } : it
              ),
            };
          })
        );

        const newKey = `${getSectionKey(section)}-${String(saved?.id || item.tempId)}`;
        setDirtyItems((prev) => {
          const next = new Set(prev);
          next.delete(iKey);
          next.delete(newKey);
          return next;
        });

        message.success("Task created");
      } else {
        await updateMasterItem(item.id, {
          description: item.description,
          is_daily: item.is_daily,
          is_weekly: item.is_weekly,
          is_monthly: item.is_monthly,
        });

        setDirtyItems((prev) => {
          const next = new Set(prev);
          next.delete(iKey);
          return next;
        });

        message.success("Task updated");
      }
    } catch (err) {
      message.error(errorMessage(err, "Couldn't save the task"));
    } finally {
      setSavingItem(null);
    }
  };

  /* COLLAPSE */

  const toggleCollapse = (section) => {
    const key = getSectionKey(section);
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  /* EDIT MODE */

  const enterEditSection = (section) => {
    const key = getSectionKey(section);
    setDirtySections((prev) => new Set([...prev, key]));
    // Expand if collapsed
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };

  const enterEditItem = (section, item) => {
    const key = getItemKey(section, item);
    setDirtyItems((prev) => new Set([...prev, key]));
  };

  /* DERIVED STATE HELPERS */

  const isSectionDirty = (section) =>
    dirtySections.has(getSectionKey(section));

  const isSectionSaved = (section) =>
    !!section.id && !isSectionDirty(section);

  const isItemDirty = (section, item) =>
    dirtyItems.has(getItemKey(section, item));

  const isItemSaved = (section, item) =>
    !!item.id && !isItemDirty(section, item);

  const isSectionCollapsed = (section) =>
    collapsedSections.has(getSectionKey(section));

  const clientLabel =
    CLIENT_TYPES.find((t) => t.value === clientType)?.label || "";

  /* UI */

  return (
    <div className="scope-builder">
      {/* HEADER */}
      <div className="scope-header">
        <div className="scope-header__left">
          <span className="scope-header__icon">
            <ClipboardList size={28} />
          </span>
          <div>
            <h2 className="scope-header__title">Scope of Work</h2>
            <p className="scope-header__sub">
              {clientLabel} · {sections.length} sections ·{" "}
              {sections.reduce((acc, s) => acc + (s.items?.length || 0), 0)} tasks
            </p>
          </div>
        </div>

        <button className="btn-add-section" onClick={addSection}>
          <Plus size={16} /> Add Section
        </button>
      </div>

      {/* CLIENT TYPE TOGGLE */}
      <div className="client-type-toggle" role="tablist">
        {CLIENT_TYPES.map((type) => (
          <button
            key={type.value}
            role="tab"
            aria-selected={clientType === type.value}
            className={`client-type-toggle__btn ${
              clientType === type.value ? "client-type-toggle__btn--active" : ""
            }`}
            onClick={() => handleClientTypeChange(type.value)}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* LOADING */}
      {loading && <div className="scope-loading">Loading scope…</div>}

      {/* EMPTY */}
      {!loading && sections.length === 0 && (
        <div className="scope-empty">
          <div className="scope-empty__icon">
            <FolderOpen size={40} />
          </div>
          <p className="scope-empty__text">
            No {clientLabel.toLowerCase()} sections yet. Start by adding one.
          </p>
          <button className="btn-add-section" onClick={addSection}>
            <Plus size={16} /> Add First Section
          </button>
        </div>
      )}

      {/* LIST */}
      {!loading && (
        <div className="sections-list">
          {sections.map((section, sectionIndex) => {
            const sectionKey = getSectionKey(section);
            const collapsed = isSectionCollapsed(section);
            const sectionSaved = isSectionSaved(section);
            const sectionDirty = isSectionDirty(section);

            return (
              <div
                key={sectionKey}
                className={`section-card ${section.is_red ? "section-card--red" : ""} ${
                  collapsed ? "section-card--collapsed" : ""
                }`}
              >
                {/* SECTION HEADER */}
                <div className="section-card__header">
                  <div className="section-card__drag">
                    <GripVertical size={14} />
                  </div>

                  <input
                    className="section-card__title-input"
                    value={section.title}
                    placeholder="Section title..."
                    ref={(el) => {
                      sectionRefs.current[sectionKey] = el;
                    }}
                    readOnly={sectionSaved}
                    onChange={(e) =>
                      handleSectionChange(sectionIndex, "title", e.target.value)
                    }
                  />

                  <div className="section-card__controls">
                    <label className="red-toggle">
                      <span className="red-toggle__label">Red</span>
                      <Switch
                        size="small"
                        checked={section.is_red}
                        disabled={sectionSaved}
                        onChange={(value) =>
                          handleSectionChange(sectionIndex, "is_red", value)
                        }
                      />
                    </label>

                    {/* SAVE / EDIT BUTTON */}
                    {sectionSaved ? (
                      <button
                        className="btn-icon btn-edit"
                        title="Edit section"
                        onClick={() => enterEditSection(section)}
                      >
                        <Pencil size={14} />
                      </button>
                    ) : (
                      <button
                        className={`btn-icon btn-save ${
                          savingSection === sectionIndex ? "btn-save--saving" : ""
                        } ${sectionDirty ? "btn-save--dirty" : ""}`}
                        title={section.id ? "Update section" : "Save section"}
                        onClick={() => saveSection(section, sectionIndex)}
                      >
                        {savingSection === sectionIndex ? (
                          <span className="btn-spinner" />
                        ) : (
                          <Save size={14} />
                        )}
                      </button>
                    )}

                    {(canDelete || !section.id) && (
                      <button
                        className="btn-icon btn-delete"
                        title={section.id ? "Delete section" : "Discard section"}
                        onClick={() => deleteSectionHandler(sectionIndex)}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}

                    {/* COLLAPSE TOGGLE */}
                    <button
                      className={`btn-icon btn-collapse ${collapsed ? "btn-collapse--collapsed" : ""}`}
                      title={collapsed ? "Expand section" : "Collapse section"}
                      onClick={() => toggleCollapse(section)}
                    >
                      {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                    </button>
                  </div>
                </div>

                {/* ITEMS — hidden when collapsed */}
                {!collapsed && (
                  <div className="section-card__body">
                    {(section.items || []).length === 0 && (
                      <p className="section-card__empty">No tasks yet.</p>
                    )}

                    {(section.items || []).map((item, itemIndex) => {
                      const itemSaved = isItemSaved(section, item);
                      const itemDirty = isItemDirty(section, item);

                      return (
                        <div
                          key={String(item.id || item.tempId)}
                          className={`task-row ${itemSaved ? "task-row--saved" : ""}`}
                        >
                          <div className="task-row__drag">
                            <GripVertical size={14} />
                          </div>

                          <input
                            className="task-row__input"
                            value={item.description}
                            placeholder="Task description..."
                            readOnly={itemSaved}
                            onChange={(e) =>
                              handleItemChange(
                                sectionIndex,
                                itemIndex,
                                "description",
                                e.target.value
                              )
                            }
                          />

                          <div className="task-row__freq">
                            <FreqBadge
                              label="D"
                              active={item.is_daily}
                              onClick={() => {
                                if (itemSaved) enterEditItem(section, item);
                                handleItemChange(
                                  sectionIndex,
                                  itemIndex,
                                  "is_daily",
                                  !item.is_daily
                                );
                              }}
                            />
                            <FreqBadge
                              label="W"
                              active={item.is_weekly}
                              onClick={() => {
                                if (itemSaved) enterEditItem(section, item);
                                handleItemChange(
                                  sectionIndex,
                                  itemIndex,
                                  "is_weekly",
                                  !item.is_weekly
                                );
                              }}
                            />
                            <FreqBadge
                              label="M"
                              active={item.is_monthly}
                              onClick={() => {
                                if (itemSaved) enterEditItem(section, item);
                                handleItemChange(
                                  sectionIndex,
                                  itemIndex,
                                  "is_monthly",
                                  !item.is_monthly
                                );
                              }}
                            />
                          </div>

                          {/* SAVE / EDIT BUTTON */}
                          {itemSaved ? (
                            <button
                              className="btn-icon btn-edit"
                              title="Edit task"
                              onClick={() => enterEditItem(section, item)}
                            >
                              <Pencil size={14} />
                            </button>
                          ) : (
                            <button
                              className={`btn-icon btn-save ${
                                savingItem === `${sectionIndex}-${itemIndex}`
                                  ? "btn-save--saving"
                                  : ""
                              } ${itemDirty ? "btn-save--dirty" : ""}`}
                              title={item.id ? "Update task" : "Save task"}
                              onClick={() => saveItem(item, sectionIndex, itemIndex)}
                            >
                              {savingItem === `${sectionIndex}-${itemIndex}` ? (
                                <span className="btn-spinner" />
                              ) : (
                                <Save size={14} />
                              )}
                            </button>
                          )}

                          {(canDelete || !item.id) && (
                            <button
                              className="btn-icon btn-delete"
                              title={item.id ? "Delete task" : "Discard task"}
                              onClick={() => deleteItemHandler(sectionIndex, itemIndex)}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      );
                    })}

                    <button
                      className="btn-add-task"
                      onClick={() => addItem(sectionIndex)}
                    >
                      <Plus size={14} /> Add Task
                    </button>
                  </div>
                )}

                {/* Collapsed summary pill */}
                {collapsed && (
                  <div className="section-card__collapsed-bar">
                    <span className="section-card__collapsed-count">
                      {section.items?.length || 0} task{section.items?.length !== 1 ? "s" : ""}
                    </span>
                    <button
                      className="section-card__collapsed-expand"
                      onClick={() => toggleCollapse(section)}
                    >
                      Click to expand
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ScopeOfWorkPage;