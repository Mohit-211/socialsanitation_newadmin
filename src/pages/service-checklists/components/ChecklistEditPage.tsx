import { useNavigate } from "react-router";
import { Button, Spin, message } from "antd";
import { ArrowLeft } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { useApiQuery } from "@/hooks/useApiQuery";
import { dataOf, errorMessage } from "@/services/apiResult";
import { checklistValues, type AnyChecklist, type ChecklistBody, type ChecklistKind } from "../checklistKinds";
import type { ApiCall } from "@/services/apiResult";
import type { Id } from "@/types";
import ChecklistForm from "./ChecklistForm";
import "../checklists.scss";
import { useRouteParam } from "@/hooks/useRouteParam";

/**
 * Adds a checklist of a kind, or edits one (with :id). `api` has the kind's
 * get, create and update calls; `backPath` is its list.
 */
interface ChecklistApi<T extends AnyChecklist> {
  get: (id: Id) => ApiCall<T>;
  create: (body: ChecklistBody) => ApiCall<T>;
  update: (id: Id, body: ChecklistBody) => ApiCall<T>;
}

interface ChecklistEditPageProps<T extends AnyChecklist> {
  kind: ChecklistKind;
  api: ChecklistApi<T>;
  backPath: string;
  title: string;
  subtitle: string;
}

const ChecklistEditPage = <T extends AnyChecklist>({ kind, api, backPath, title, subtitle }: ChecklistEditPageProps<T>) => {
  const id = useRouteParam();
  const navigate = useNavigate();
  const { data: checklist, loading } = useApiQuery(() => api.get(id).then(dataOf), [id], {
    skip: !id,
    errorText: "Couldn't load the checklist",
  });

  const submit = async (body: ChecklistBody) => {
    try {
      if (id) await api.update(id, body);
      else await api.create(body);
      message.success(id ? "Checklist saved" : "Checklist added");
      navigate(backPath);
    } catch (error) {
      message.error(errorMessage(error, "Couldn't save the checklist"));
    }
  };

  return (
    <>
      <PageHeader
        title={id ? `EDIT ${title}` : `ADD ${title}`}
        subtitle={subtitle}
        actions={
          <Button size="large" icon={<ArrowLeft size={16} />} onClick={() => navigate(backPath)}>
            All Checklists
          </Button>
        }
      />
      {id && loading && !checklist ? (
        <div className="page-loader">
          <Spin size="large" />
        </div>
      ) : (
        <div className="checklist-page__form">
          <ChecklistForm
            key={checklist?.id || "new"}
            kind={kind}
            initialValues={id ? checklistValues(kind, checklist) : undefined}
            submitLabel={id ? "Save the Checklist" : "Add the Checklist"}
            onSubmit={submit}
          />
        </div>
      )}
    </>
  );
};

export default ChecklistEditPage;
