import { Alert, Button, Card, Space } from "antd";
import { useNavigate } from "react-router";
import { FileStack } from "lucide-react";
import { listClientScopes } from "@/services/api/scopeApi";
import { itemsOf } from "@/services/apiResult";
import { useApiQuery } from "@/hooks/useApiQuery";
import { clientPagePath } from "@/pages/clients/clientFlow";
import { formatDate } from "@/utils/datetime";

/**
 * Which scope of work a new estimate prints: the client's newest. With none,
 * the estimate has no tasks, so it points the admin to make one first.
 */
const EstimateScopeNote = ({ clientId }) => {
  const navigate = useNavigate();
  const { data: scopes, loading } = useApiQuery(() => listClientScopes(clientId).then(itemsOf), [clientId], {
    initial: [],
    skip: !clientId,
  });
  const newest = scopes?.[0];

  return (
    <Card title="Scope of Work on This Estimate" size="small" className="form-card" loading={loading && Boolean(clientId)}>
      {!clientId ? (
        <p className="text-secondary">Choose the client to see which scope of work the estimate prints.</p>
      ) : newest ? (
        <Space orientation="vertical" size={6}>
          <span>
            The estimate prints <strong>{newest.title}</strong>
            {newest.client_sheet ? `, made from "${newest.client_sheet.title}"` : ""}, last changed{" "}
            {formatDate(newest.updated_at)}.
          </span>
          <Space wrap>
            <Button icon={<FileStack size={14} />} onClick={() => navigate(`/scopes/${newest.id}`)}>
              Check Its Tasks
            </Button>
            {scopes.length > 1 && (
              <span className="text-secondary">The client has {scopes.length} scopes; the newest one is used.</span>
            )}
          </Space>
        </Space>
      ) : (
        <Alert
          type="warning"
          showIcon
          title="This client has no scope of work yet, so the estimate would print no tasks."
          action={
            <Button size="small" onClick={() => navigate(clientPagePath(clientId, "scopes"))}>
              Make One
            </Button>
          }
        />
      )}
    </Card>
  );
};

export default EstimateScopeNote;
