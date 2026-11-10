import { useMemo, useState } from "react";
import { Alert, Button, Empty, Input, Spin, Tag } from "antd";
import { FileText, MapPin, Search } from "lucide-react";
import { useApiQuery } from "@/hooks/useApiQuery";
import { findHiringForms } from "@/services/api/hiringFormApi";
import { itemsOf } from "@/services/apiResult";
import { debounce } from "@/utils/debounce";
import { formatDate } from "@/utils/datetime";
import { placeOfHiringForm } from "../employeeFields";

/**
 * Finds the applicant's hiring form by email or name and picks it. Picking
 * looks up the place of its address (country, state, city and coordinates),
 * which becomes the employee's home. `onPick({ form, place })` hears the
 * choice.
 */
const HiringFormPicker = ({ initialQuery = "", pickedId, onPick }) => {
  const [text, setText] = useState(initialQuery);
  const [search, setSearch] = useState(initialQuery.trim());
  const [resolving, setResolving] = useState(null);
  const [problem, setProblem] = useState(null);
  const applySearch = useMemo(() => debounce((value) => setSearch(value.trim()), 400), []);

  const { data: forms, loading } = useApiQuery(
    () => findHiringForms(search.includes("@") ? { email: search } : { name: search }).then(itemsOf),
    [search],
    { initial: [], skip: search.length < 2, errorText: "Couldn't search the hiring forms" },
  );
  const shown = search.length < 2 ? [] : (forms || []).slice(0, 20);

  const pick = async (form) => {
    setResolving(form.submission_id);
    setProblem(null);
    try {
      onPick({ form, place: await placeOfHiringForm(form) });
    } catch (error) {
      setProblem({ id: form.submission_id, text: error.message });
    } finally {
      setResolving(null);
    }
  };

  return (
    <div className="hiring-picker">
      <Input
        allowClear
        prefix={<Search size={16} className="text-subtle" />}
        placeholder="The applicant's email or name"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          applySearch(e.target.value);
        }}
      />
      <Spin spinning={loading && search.length >= 2}>
        {search.length >= 2 && !loading && shown.length === 0 ? (
          <Empty className="hiring-picker__empty" description="No hiring form matches that." />
        ) : (
          <ul className="hiring-picker__list">
            {shown.map((form) => (
              <li
                key={form.submission_id}
                className={`hiring-picker__item${pickedId === form.submission_id ? " hiring-picker__item--picked" : ""}`}
              >
                <div className="hiring-picker__body">
                  <strong>{form.name || "No name"}</strong>
                  <span className="text-secondary">{[form.email, form.phone].filter(Boolean).join(" · ")}</span>
                  <span className="text-subtle">
                    <MapPin size={12} /> {form.full_address || "No address"}
                  </span>
                  <span className="text-subtle">Sent {formatDate(form.submitted_at)}</span>
                  {problem?.id === form.submission_id && (
                    <Alert type="error" showIcon className="hiring-picker__problem" title={problem.text} />
                  )}
                </div>
                <div className="hiring-picker__actions">
                  {form.pdf_url && (
                    <Button
                      size="small"
                      icon={<FileText size={14} />}
                      onClick={() => window.open(form.pdf_url, "_blank", "noopener")}
                    >
                      PDF
                    </Button>
                  )}
                  {pickedId === form.submission_id ? (
                    <Tag color="green">Picked</Tag>
                  ) : (
                    <Button
                      size="small"
                      type="primary"
                      loading={resolving === form.submission_id}
                      onClick={() => pick(form)}
                    >
                      Use This Form
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Spin>
    </div>
  );
};

export default HiringFormPicker;
