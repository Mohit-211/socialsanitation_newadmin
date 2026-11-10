import { useMemo, useState } from "react";
import { Empty, Select, Spin, Table } from "antd";
import { CircleCheck, CircleX } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { useApiQuery } from "@/hooks/useApiQuery";
import { getWeeklyChecklist, listCleaners } from "@/services/api/dailyChecklistApi";
import { dataOf, itemsOf } from "@/services/apiResult";
import { formatDate } from "@/utils/datetime";
import "./dailyChecklists.scss";

// A cleaner's or housekeeper's week: each task of their daily checklists, ticked or not, day by day.
const WeeklyChecklistPage = () => {
  const [userId, setUserId] = useState(null);
  const { data: cleaners, loading: loadingCleaners } = useApiQuery(() => listCleaners().then(itemsOf), [], {
    initial: [],
    errorText: "Couldn't load the cleaners",
  });
  const { data: week, loading } = useApiQuery(() => getWeeklyChecklist(userId).then(dataOf), [userId], {
    skip: !userId,
    errorText: "Couldn't load the week's checklist",
  });

  // A row per heading and task, a column per day.
  const { rows, days } = useMemo(() => {
    const byTask = new Map();
    const dates = Object.keys(week || {})
      .filter((date) => Array.isArray(week[date]))
      .sort();
    for (const date of dates) {
      for (const group of week[date]) {
        for (const task of group.tasks || []) {
          const key = `${group.heading}\u0000${task.task}`;
          if (!byTask.has(key)) byTask.set(key, { key, heading: group.heading, task: task.task });
          byTask.get(key)[date] = Boolean(task.is_completed);
        }
      }
    }
    return { rows: [...byTask.values()], days: dates };
  }, [week]);

  const columns = [
    { title: "Checklist", dataIndex: "heading", fixed: "left", width: 180 },
    { title: "Task", dataIndex: "task", fixed: "left", width: 260 },
    ...days.map((date) => ({
      title: formatDate(date),
      dataIndex: date,
      align: "center",
      width: 110,
      render: (done) =>
        done ? (
          <CircleCheck size={18} color="var(--color-success-strong)" aria-label="Done" />
        ) : (
          <CircleX size={18} color="var(--color-error)" aria-label="Not done" />
        ),
    })),
  ];

  return (
    <div>
      <PageHeader
        className="weekly-checklist__header"
        title="WEEKLY CHECKLIST"
        subtitle="What a cleaner or housekeeper ticked off each day this week"
        actions={
          <Select
            showSearch
            optionFilterProp="label"
            className="weekly-checklist__user"
            placeholder="Pick a cleaner or housekeeper"
            loading={loadingCleaners}
            value={userId}
            onChange={setUserId}
            options={(cleaners || []).map((person) => ({
              value: person.id,
              label: `${person.name || person.email} (${(person.roles || []).map((role) => role.name).join(", ") || "Cleaner"})`,
            }))}
          />
        }
      />
      {!userId ? (
        <Empty description="Pick someone to see their week." />
      ) : (
        <Spin spinning={loading}>
          <Table
            rowKey="key"
            size="small"
            bordered
            columns={columns}
            dataSource={rows}
            pagination={false}
            scroll={{ x: "max-content" }}
            locale={{ emptyText: "No checklist for this week." }}
          />
        </Spin>
      )}
    </div>
  );
};

export default WeeklyChecklistPage;
