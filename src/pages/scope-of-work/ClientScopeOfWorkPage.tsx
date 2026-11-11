import { useState } from "react";
import { useNavigate } from "react-router";
import { Button, Descriptions, Modal, Space, Spin, Tag, message } from "antd";
import { ArrowLeft, Download, EyeOff, LoaderCircle, Pencil, Share2, Trash2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ClientScopeBuilder from "./components/ClientScopeBuilder";
import ScopeDetailsModal from "./components/ScopeDetailsModal";
import { deleteScopeOfWork, getScopeOfWork, getScopeOfWorkPdf } from "@/services/api/scopeApi";
import { shareDocument, unshareDocument } from "@/services/api/documentApi";
import { getClient } from "@/services/api/clientApi";
import { dataOf, errorMessage } from "@/services/apiResult";
import { useApiQuery } from "@/hooks/useApiQuery";
import { PERMISSION, useCan } from "@/lib/session";
import { formatDate } from "@/utils/datetime";
import { useRouteParam } from "@/hooks/useRouteParam";

const daysText = (days: string[] | string | null | undefined) => (Array.isArray(days) ? days.join(", ") : days) || "—";

// One client scope of work: its visit details, PDF and sharing, and the
// editor for its sections and tasks.
const ClientScopeOfWorkPage = () => {
  const navigate = useNavigate();
  const id = useRouteParam();
  const canDelete = useCan(PERMISSION.DELETE_RECORDS);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [editing, setEditing] = useState(false);

  const { data: scope, loading, setData: setScope } = useApiQuery(
    () => getScopeOfWork(id).then(dataOf),
    [id],
    { errorText: "Couldn't load the scope of work" },
  );
  const { data: client } = useApiQuery(() => getClient(scope?.client_id ?? 0).then(dataOf), [scope?.client_id], {
    skip: !scope?.client_id,
  });

  const backToClient = () =>
    navigate(scope?.client_id ? `/viewUser/${scope.client_id}?tab=scopes` : "/users");

  const openPdf = async () => {
    setDownloading(true);
    try {
      const { file_url: fileUrl } = dataOf(await getScopeOfWorkPdf(id)) || {};
      if (!fileUrl) throw new Error("No file link in the answer");
      window.open(fileUrl, "_blank", "noopener");
    } catch (error) {
      message.error(errorMessage(error, "Couldn't make the PDF"));
    } finally {
      setDownloading(false);
    }
  };

  // Sharing tells the client by app notification and email, so it asks first.
  const confirmShare = () =>
    scope?.shared_at
      ? toggleShare()
      : Modal.confirm({
          title: "Share this scope of work with the client?",
          content: "It shows in their app, and they get a notification and an email.",
          okText: "Share",
          onOk: toggleShare,
        });

  const toggleShare = async () => {
    if (!scope) return;
    setSharing(true);
    try {
      if (scope.shared_at) {
        await unshareDocument("scope_of_work", id);
        setScope((current) => (current ? { ...current, shared_at: null } : current));
        message.success("Hidden from the client app");
      } else {
        await shareDocument("scope_of_work", id);
        setScope((current) => (current ? { ...current, shared_at: new Date().toISOString() } : current));
        message.success("Shared: the client has been told");
      }
    } catch (error) {
      message.error(errorMessage(error, "Couldn't change the sharing"));
    } finally {
      setSharing(false);
    }
  };

  const confirmDelete = () =>
    Modal.confirm({
      title: `Delete "${scope?.title}"?`,
      content: "Its sections and tasks go too.",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await deleteScopeOfWork(id);
          message.success("Scope of work deleted");
          backToClient();
        } catch (error) {
          message.error(errorMessage(error, "Couldn't delete the scope of work"));
        }
      },
    });

  if (loading && !scope) {
    return (
      <div className="page-loader">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={scope?.title || "SCOPE OF WORK"}
        subtitle={[
          client?.name && `For ${client.name}`,
          scope?.client_sheet ? `made from "${scope.client_sheet.title}"` : "made from the whole master list",
        ]
          .filter(Boolean)
          .join(", ")}
        actions={
          <Space wrap>
            <Button size="large" icon={<Pencil size={16} />} onClick={() => setEditing(true)} disabled={!scope}>
              Edit Details
            </Button>
            <Button
              size="large"
              icon={downloading ? <LoaderCircle size={16} className="icon-spin" /> : <Download size={16} />}
              onClick={openPdf}
              disabled={downloading || !scope}
            >
              PDF
            </Button>
            <Button
              size="large"
              icon={scope?.shared_at ? <EyeOff size={16} /> : <Share2 size={16} />}
              onClick={confirmShare}
              loading={sharing}
              disabled={!scope}
            >
              {scope?.shared_at ? "Unshare" : "Share with Client"}
            </Button>
            {canDelete && scope && (
              <Button size="large" danger icon={<Trash2 size={16} />} onClick={confirmDelete}>
                Delete
              </Button>
            )}
            <Button size="large" icon={<ArrowLeft size={16} />} onClick={backToClient}>
              Back to Client
            </Button>
          </Space>
        }
      />

      {scope && (
        <div className="surface scope-details">
          <Descriptions
            size="small"
            column={{ xs: 1, sm: 2, lg: 3 }}
            items={[
              {
                key: "shared",
                label: "Client App",
                children: scope.shared_at ? (
                  <Tag color="green">Shared {formatDate(scope.shared_at)}</Tag>
                ) : (
                  <Tag>Not shared</Tag>
                ),
              },
              { key: "frequency", label: "Visit Frequency", children: scope.visit_frequency || "—" },
              { key: "days", label: "Service Days", children: daysText(scope.service_days) },
              { key: "time", label: "Service Time", children: scope.service_time || "—" },
              { key: "crew", label: "Crew Size", children: scope.crew_size ?? "—" },
              { key: "hours", label: "Hours per Visit", children: scope.hours_per_visit ?? "—" },
              { key: "notes", label: "Notes", span: "filled", children: scope.notes || "—" },
            ]}
          />
        </div>
      )}

      <ClientScopeBuilder scopeId={id} />

      <ScopeDetailsModal
        open={editing}
        mode="edit"
        scope={scope}
        onCancel={() => setEditing(false)}
        onSaved={(saved) => {
          setEditing(false);
          if (saved) setScope((current) => ({ ...current, ...saved }));
        }}
      />
    </div>
  );
};

export default ClientScopeOfWorkPage;
