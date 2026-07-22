/** @format */

import React, { useEffect, useRef, useState } from "react";
import { Switch, message, Spin, Empty, Modal, Tooltip } from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  HolderOutlined,
  CheckCircleFilled,
  EditOutlined,
  DownOutlined,
  UpOutlined,
} from "@ant-design/icons";
import "./UserScopeBuilder.scss";
import {
  GetUserScope,
  CreateUserSection,
  UpdateUserScopeSection,
  DeleteUserScopeSection,
  CreateUserScopeItem,
  UpdateUserScopeItem,
  DeleteUserScopeItem,
} from "../../../services/Api/ScopeApi";
import { GetClientChecklistByUserId } from "../../../services/Api/BookingApi";

const FreqBadge = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`usb-freq-badge ${active ? "usb-freq-badge--active" : ""}`}
    title={label === "D" ? "Daily" : label === "W" ? "Weekly" : "Monthly"}
  >
    {label}
  </button>
);

const UserScopeBuilder = ({ userId, onChange }) => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingSection, setSavingSection] = useState(null);
  const [savingItem, setSavingItem] = useState(null);
  const [clientChecklist, setClientChecklist] = useState([]);
  const [loadingChecklist, setLoadingChecklist] = useState(false);
  const [clientType, setClientType] = useState("");

  /* Collapse state */
  const [chartCollapsed, setChartCollapsed] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({});

  /* Refs */
  const sectionsEndRef = useRef(null);
  const sectionRefs = useRef({});

  /* ───────────────── FETCH CHECKLIST ───────────────── */

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

  /* ───────────────── FETCH USER SCOPE ───────────────── */

  const fetchUserScope = async () => {
    if (!userId) {
      setSections([]);
      return;
    }
    try {
      setLoading(true);
      const res = await GetUserScope(userId);
      const data = res?.data?.data?.data || [];
      const formatted = data.map((section) => ({
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
      setSections(formatted);
      if (onChange) onChange(formatted);
    } catch (err) {
      console.log(err);
      message.error("Failed to load user scope");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserScope();
    fetchChecklist();
  }, [userId]);

  useEffect(() => {
    if (onChange) onChange(sections);
  }, [sections]);

  /* ───────────────── COLLAPSE HELPERS ───────────────── */

  const toggleSection = (sectionIndex) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionIndex]: !prev[sectionIndex],
    }));
  };

  /* ───────────────── SECTION CHANGE ───────────────── */

  const handleSectionChange = (index, field, value) => {
    setSections((prev) =>
      prev.map((section, idx) =>
        idx === index ? { ...section, [field]: value } : section,
      ),
    );
  };

  /* ───────────────── ITEM CHANGE ───────────────── */

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

  /* ───────────────── CREATE SECTION ───────────────── */

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

      /* Scroll to new section after state update */
      setTimeout(() => {
        sectionsEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      console.log(err);
      message.error("Failed to create section");
    }
  };

  /* ───────────────── SAVE SECTION ───────────────── */

  const saveSection = async (section, index) => {
    try {
      setSavingSection(index);
      await UpdateUserScopeSection(section.id, {
        title: section.title,
        is_red: section.is_red,
      });
      message.success("Section saved");
    } catch (err) {
      console.log(err);
      message.error("Failed to save section");
    } finally {
      setSavingSection(null);
    }
  };

  /* ───────────────── DELETE SECTION ───────────────── */

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
      console.log(err);
      message.error("Delete failed");
    }
  };

  /* ───────────────── ADD ITEM ───────────────── */

  const addItem = (sectionIndex) => {
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

  /* ───────────────── SAVE ITEM ───────────────── */

  const saveItem = async (item, sectionIndex, itemIndex) => {
    try {
      setSavingItem(`${sectionIndex}-${itemIndex}`);
      const section = sections[sectionIndex];

      if (!item.description?.trim()) {
        return message.warning("Task description is required");
      }

      if (!item.id) {
        /* CREATE */
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
        /* UPDATE */
        await UpdateUserScopeItem(item.id, {
          description: item.description,
          is_daily: item.is_daily,
          is_weekly: item.is_weekly,
          is_monthly: item.is_monthly,
        });
        message.success("Task saved");
      }
    } catch (err) {
      console.log(err);
      message.error("Save failed");
    } finally {
      setSavingItem(null);
    }
  };

  /* ───────────────── DELETE ITEM ───────────────── */

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
      console.log(err);
      message.error("Delete failed");
    }
  };

  /* ───────────────── EMPTY ───────────────── */

  if (!userId) {
    return (
      <div className="usb-empty">
        <Empty description="Select a client first" />
      </div>
    );
  }

  /* ───────────────── LOADING ───────────────── */

  if (loading) {
    return (
      <div className="usb-loading">
        <Spin size="large" />
      </div>
    );
  }

  /* ───────────────── UI ───────────────── */

  return (
    <div className="usb-root">
      {/* ── HEADER ── */}
      <div className="usb-header">
        <div className="usb-header__left">
          <span className="usb-header__icon">📋</span>
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
          <PlusOutlined />
          <span>Add Section</span>
        </button>
      </div>

      {/* ── INITIAL CLIENT CHART ── */}
      <div className="usb-chart-card" style={{marginBottom:"30px"}}>
        <button
          className="usb-chart-card__toggle"
          onClick={() => setChartCollapsed((v) => !v)}
        >
          <span className="usb-chart-card__toggle-title">
            📊 Initial Client Chart
          </span>
          <span className="usb-chart-card__toggle-meta">
            {chartCollapsed
              ? `${clientChecklist.length} row${clientChecklist.length !== 1 ? "s" : ""} · click to expand`
              : "click to collapse"}
          </span>
          {chartCollapsed ? <DownOutlined /> : <UpOutlined />}
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

      {/* ── NO SECTIONS ── */}
      {sections.length === 0 && (
        <div className="usb-empty usb-empty--inner">
          <div className="usb-empty__icon">🗂️</div>
          <p className="usb-empty__text">No scope generated for this client.</p>
          <button className="usb-btn-add-section" onClick={createSection}>
            <PlusOutlined /> Add First Section
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
              ref={(el) => (sectionRefs.current[sectionIndex] = el)}
            >
              {/* SECTION HEADER */}
              <div className="usb-section-card__header">
                <div className="usb-section-card__drag" title="Drag to reorder">
                  <HolderOutlined />
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
                      <CheckCircleFilled />
                      <span>Save</span>
                    </button>
                  </Tooltip>

                  {/* Delete section */}
                  <Tooltip title="Delete section">
                    <button
                      className="usb-btn usb-btn--danger"
                      onClick={() => deleteSection(sectionIndex)}
                    >
                      <DeleteOutlined />
                      <span>Delete</span>
                    </button>
                  </Tooltip>

                  {/* Collapse toggle */}
                  <button
                    className="usb-btn usb-btn--collapse"
                    onClick={() => toggleSection(sectionIndex)}
                    title={isCollapsed ? "Expand section" : "Collapse section"}
                  >
                    {isCollapsed ? <DownOutlined /> : <UpOutlined />}
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
                          <HolderOutlined />
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
                                <EditOutlined />
                                <span>Update</span>
                              </>
                            ) : (
                              <>
                                <SaveOutlined />
                                <span>Save</span>
                              </>
                            )}
                          </button>
                        </Tooltip>

                        {/* Delete task */}
                        <Tooltip title="Delete task">
                          <button
                            className="usb-btn usb-btn--danger"
                            onClick={() => deleteItem(sectionIndex, itemIndex)}
                          >
                            <DeleteOutlined />
                            <span>Delete</span>
                          </button>
                        </Tooltip>
                      </div>
                    );
                  })}

                  <button
                    className="usb-btn-add-task"
                    onClick={() => addItem(sectionIndex)}
                  >
                    <PlusOutlined /> Add Task
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

export default UserScopeBuilder;
