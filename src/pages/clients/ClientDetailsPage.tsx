import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Button, Dropdown, Grid, Input, Modal, Result, Space, Spin, Tabs, Tag, message, type MenuProps } from "antd";
import {
  ArrowLeft,
  Calculator,
  CalendarPlus,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  Ellipsis,
  FilePen,
  FileSignature,
  FileStack,
  FileText,
  KeyRound,
  Mail,
  Pencil,
  Plus,
  Receipt,
  ScrollText,
  Trash2,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ScopeDetailsModal from "@/pages/scope-of-work/components/ScopeDetailsModal";
import { CLIENT_TYPES, deleteClient, getClientFlow, resetClientCredentials } from "@/services/api/clientApi";
import { sendReviewEmail } from "@/services/api/reviewApi";
import { dataOf, errorMessage } from "@/services/apiResult";
import { useApiQuery } from "@/hooks/useApiQuery";
import { PERMISSION, useCan, useIsSuperAdmin } from "@/lib/session";
import { CLIENT_TABS, NEW_DOCUMENT_PATHS, isClientTab, type ClientTab, type ClientTabDef, type NewDocumentKind } from "./clientFlow";
import type { ClientFlow } from "@/types";
import ClientProfileTab from "./components/ClientProfileTab";
import ClientEnquiriesTab from "./components/ClientEnquiriesTab";
import ClientSheetsTab from "./components/ClientSheetsTab";
import ClientScopesTab from "./components/ClientScopesTab";
import ClientDocumentsTab from "./components/ClientDocumentsTab";
import ClientBookingsTab from "./components/ClientBookingsTab";
import ClientInvoicesTab from "./components/ClientInvoicesTab";
import SheetFormDrawer from "./components/SheetFormDrawer";
import "./ClientDetailsPage.scss";
import { useRouteParam } from "@/hooks/useRouteParam";

// Tabs for Super Admins only, as in the sidebar: the Admin role runs
// day-to-day operations without estimates and the calculator.
const SUPER_ADMIN_TABS = new Set<ClientTab>(["estimates", "calculations"]);

const countOf = (flow: ClientFlow | null, tab: ClientTabDef) => {
  if (!tab.flowKey || !flow) return 0;
  if (tab.flowKey === "bookings") return (flow.bookings?.upcoming?.length ?? 0) + (flow.bookings?.repeating?.length ?? 0);
  if (tab.flowKey === "enquiries") return (flow.enquiries ?? []).filter((enquiry) => enquiry.status !== "closed").length;
  return flow[tab.flowKey]?.length ?? 0;
};

// The client page: everything about one client, and every document of their
// flow made from here, with the client already chosen.
const ClientDetailsPage = () => {
  const id = useRouteParam();
  const navigate = useNavigate();
  const screens = Grid.useBreakpoint();
  const [searchParams, setSearchParams] = useSearchParams();
  const canDelete = useCan(PERMISSION.DELETE_RECORDS);
  const isSuperAdmin = useIsSuperAdmin();
  const [sheetForm, setSheetForm] = useState<{ sheetId?: number } | null>(null); // { sheetId } to edit, {} to add
  const [scopeForm, setScopeForm] = useState<{ sheetId?: number } | null>(null); // { sheetId } to preselect

  const { data: flow, loading, error, reload } = useApiQuery(() => getClientFlow(id).then(dataOf), [id], {
    errorText: "Couldn't load the client",
  });
  const client = flow?.client;

  const tabs = CLIENT_TABS.filter((tab) => isSuperAdmin || !SUPER_ADMIN_TABS.has(tab.key));
  const requested = searchParams.get("tab");
  const activeTab = isClientTab(requested) && tabs.some((tab) => tab.key === requested) ? requested : "profile";
  const showTab = (key: string) => setSearchParams(key === "profile" ? {} : { tab: key }, { replace: true });

  const startNew = (key: string) => {
    if (key === "sheet") return setSheetForm({});
    if (key === "scope") return setScopeForm({});
    if (key in NEW_DOCUMENT_PATHS) navigate(NEW_DOCUMENT_PATHS[key as NewDocumentKind](id));
  };

  const newItems: MenuProps["items"] = [
    { key: "sheet", icon: <ClipboardList size={15} />, label: "Client sheet" },
    { key: "scope", icon: <FileStack size={15} />, label: "Scope of work" },
    ...(isSuperAdmin ? [{ key: "calculation", icon: <Calculator size={15} />, label: "Cost calculation" }] : []),
    { type: "divider" },
    ...(isSuperAdmin ? [{ key: "estimate", icon: <FileText size={15} />, label: "Estimate" }] : []),
    { key: "quote", icon: <ScrollText size={15} />, label: "Quote" },
    { key: "service_request", icon: <FilePen size={15} />, label: "Service request" },
    { key: "contract", icon: <FileSignature size={15} />, label: "Contract" },
    { type: "divider" },
    { key: "booking", icon: <CalendarPlus size={15} />, label: "Booking" },
    { key: "invoice", icon: <Receipt size={15} />, label: "Invoice" },
  ];

  const resetSignIn = () => {
    let newEmail = "";
    Modal.confirm({
      title: "Send new sign-in details?",
      content: (
        <div className="client-flow__modal-body">
          <p>The client gets an email with a new password for the app.</p>
          <label className="field-label" htmlFor="reset-email">
            Send to a different email (optional)
          </label>
          <Input id="reset-email" type="email" placeholder={client?.email} onChange={(e) => (newEmail = e.target.value)} />
        </div>
      ),
      okText: "Send",
      onOk: async () => {
        try {
          await resetClientCredentials(id, newEmail.trim());
          message.success("New sign-in details sent");
          if (newEmail.trim()) reload();
        } catch (err) {
          message.error(errorMessage(err, "Couldn't reset the sign-in details"));
        }
      },
    });
  };

  const moreItems: MenuProps["items"] = [
    { key: "inspections", icon: <ClipboardCheck size={15} />, label: "Inspections" },
    { key: "review", icon: <Mail size={15} />, label: "Email review links" },
    { key: "reset", icon: <KeyRound size={15} />, label: "Send new sign-in details" },
    ...(canDelete ? [{ type: "divider" as const }, { key: "delete", icon: <Trash2 size={15} />, label: "Delete client", danger: true }] : []),
  ];

  const onMore: MenuProps["onClick"] = async ({ key }) => {
    if (key === "inspections") navigate(`/clientInspections/${id}`);
    if (key === "reset") resetSignIn();
    if (key === "review") {
      try {
        await sendReviewEmail(id);
        message.success("Review links emailed to the client");
      } catch (err) {
        message.error(errorMessage(err, "Couldn't email the review links"));
      }
    }
    if (key === "delete") {
      Modal.confirm({
        title: `Delete ${client?.name || "this client"}?`,
        content: "They can no longer sign in to the app. This can't be undone.",
        okText: "Delete",
        okType: "danger",
        onOk: async () => {
          try {
            await deleteClient(id);
            message.success("Client deleted");
            navigate("/users");
          } catch (err) {
            message.error(errorMessage(err, "Couldn't delete the client"));
          }
        },
      });
    }
  };

  if (loading && !flow) {
    return (
      <div className="page-loader">
        <Spin size="large" />
      </div>
    );
  }
  if (!flow) {
    return (
      <Result
        status="404"
        title="Client not found"
        subTitle={errorMessage(error, "This client couldn't be loaded.")}
        extra={<Button onClick={() => navigate("/users")}>Back to Clients</Button>}
      />
    );
  }

  const tabProps = { clientId: id, flow, onChanged: reload };
  const contentFor = (key: ClientTab) => {
    switch (key) {
      case "profile":
        return <ClientProfileTab {...tabProps} />;
      case "enquiries":
        return <ClientEnquiriesTab {...tabProps} />;
      case "sheets":
        return (
          <ClientSheetsTab
            {...tabProps}
            onNewSheet={() => setSheetForm({})}
            onEditSheet={(sheetId) => setSheetForm({ sheetId })}
            onNewScope={(sheetId) => setScopeForm({ sheetId })}
          />
        );
      case "scopes":
        return <ClientScopesTab {...tabProps} onNewScope={() => setScopeForm({})} />;
      case "bookings":
        return <ClientBookingsTab {...tabProps} />;
      case "invoices":
        return <ClientInvoicesTab {...tabProps} />;
      default:
        return <ClientDocumentsTab tab={key} {...tabProps} />;
    }
  };

  const typeLabel = CLIENT_TYPES.find((type) => type.value === client?.client_type)?.label;

  return (
    <div className="client-flow">
      <PageHeader
        title={
          <span className="client-flow__title">
            {client?.name || client?.email}
            {typeLabel && <Tag className="client-flow__type">{typeLabel}</Tag>}
          </span>
        }
        subtitle={[client?.email, client?.phone].filter(Boolean).join(" · ")}
        actions={
          <Space wrap>
            <Dropdown menu={{ items: newItems, onClick: ({ key }) => startNew(key) }} trigger={["click"]}>
              <Button type="primary" size="large" icon={<Plus size={16} />}>
                New <ChevronDown size={14} />
              </Button>
            </Dropdown>
            <Button size="large" icon={<Pencil size={16} />} onClick={() => navigate(`/editUser/${id}`)}>
              Edit Client
            </Button>
            <Dropdown menu={{ items: moreItems, onClick: onMore }} trigger={["click"]}>
              <Button size="large" aria-label="More actions" icon={<Ellipsis size={16} />} />
            </Dropdown>
            <Button size="large" icon={<ArrowLeft size={16} />} onClick={() => navigate("/users")}>
              All Clients
            </Button>
          </Space>
        }
      />

      <Tabs
        className="client-flow__tabs surface"
        activeKey={activeTab}
        onChange={showTab}
        tabPlacement={screens.lg ? "start" : "top"}
        destroyOnHidden
        items={tabs.map((tab) => {
          const count = countOf(flow, tab);
          return {
            key: tab.key,
            label: (
              <span className="client-flow__tab-label">
                {tab.step && <span className="client-flow__step">{tab.step}</span>}
                <span>{tab.label}</span>
                {tab.flowKey && (
                  <span className={`client-flow__count${count ? "" : " is-zero"}`}>{count}</span>
                )}
              </span>
            ),
            children: contentFor(tab.key),
          };
        })}
      />

      <SheetFormDrawer
        open={Boolean(sheetForm)}
        clientId={id}
        clientType={client?.client_type}
        sheetId={sheetForm?.sheetId}
        addresses={flow.addresses}
        onAddressAdded={reload}
        onClose={() => setSheetForm(null)}
        onSaved={() => {
          setSheetForm(null);
          reload();
          showTab("sheets");
        }}
      />
      <ScopeDetailsModal
        open={Boolean(scopeForm)}
        mode="create"
        clientId={id}
        sheets={
          scopeForm?.sheetId
            ? [
                ...flow.client_sheets.filter((sheet) => sheet.id === scopeForm.sheetId),
                ...flow.client_sheets.filter((sheet) => sheet.id !== scopeForm.sheetId),
              ]
            : flow.client_sheets
        }
        onCancel={() => setScopeForm(null)}
        onSaved={(scope) => {
          setScopeForm(null);
          if (scope?.id) navigate(`/scopes/${scope.id}`);
          else reload();
        }}
      />
    </div>
  );
};

export default ClientDetailsPage;
