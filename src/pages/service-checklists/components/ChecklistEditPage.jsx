import { useNavigate, useParams } from "react-router";
import { Button, Spin, message } from "antd";
import { ArrowLeft } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { useApiQuery } from "@/hooks/useApiQuery";
import { dataOf, errorMessage } from "@/services/apiResult";
import { checklistValues } from "../checklistKinds";
import ChecklistForm from "./ChecklistForm";
import "../checklists.scss";

/**
 * Adds a checklist of a kind, or edits one (with :id). `api` has the kind's
 * get, create and update calls; `backPath` is its list.
 */
const ChecklistEditPage = ({ kind, api, backPath, title, subtitle }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: checklist, loading } = useApiQuery(() => api.get(id).then(dataOf), [id], {
    skip: !id,
    errorText: "Couldn't load the checklist",
  });

  const submit = async (body) => {
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
