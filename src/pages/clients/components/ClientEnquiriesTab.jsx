import { useState } from "react";
import { Descriptions, Drawer, Empty, Select, Spin, Table, message } from "antd";
import { Eye } from "lucide-react";
import IconAction from "@/components/IconAction";
import { ENQUIRY_STATUSES, getEnquiry, setEnquiryStatus } from "@/services/api/enquiryApi";
import { dataOf, errorMessage } from "@/services/apiResult";
import { useApiQuery } from "@/hooks/useApiQuery";
import { formatDate, formatDateTime } from "@/utils/datetime";
import { formatMoney } from "../clientFlow";

// Enquiries the client sent from the app. The office calls them back and
// marks each one contacted, then closed; the client sees the status.
const ClientEnquiriesTab = ({ flow, onChanged }) => {
  const [openId, setOpenId] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const rows = flow?.enquiries ?? [];

  const { data: enquiry, loading } = useApiQuery(() => getEnquiry(openId).then(dataOf), [openId], {
    skip: !openId,
    errorText: "Couldn't load the enquiry",
  });

  const changeStatus = async (id, status) => {
    setSavingId(id);
    try {
      await setEnquiryStatus(id, status);
      message.success("Status changed; the client sees it in the app");
      onChanged?.();
    } catch (error) {
      message.error(errorMessage(error, "Couldn't change the status"));
    } finally {
      setSavingId(null);
    }
  };

  const columns = [
    { title: "Received", dataIndex: "created_at", render: (date) => formatDateTime(date) },
    { title: "Needed On", dataIndex: "needed_on", render: (date) => formatDate(date) },
    {
      title: "Status",
      dataIndex: "status",
      render: (status, row) => (
        <Select
          size="small"
          value={status}
          options={ENQUIRY_STATUSES}
          onChange={(value) => changeStatus(row.id, value)}
          loading={savingId === row.id}
          style={{ minWidth: 130 }}
          aria-label="Enquiry status"
        />
      ),
    },
    {
      title: "",
      key: "open",
      width: 60,
      render: (_, row) => <IconAction icon={Eye} title="Open" onClick={() => setOpenId(row.id)} />,
    },
  ];

  return (
    <div className="client-flow__tab">
      <div className="client-flow__tab-head">
        <p className="text-secondary">What the client asked for in the app. Call them back, then mark it contacted.</p>
      </div>
      <Table
        rowKey="id"
        dataSource={rows}
        columns={columns}
        size="middle"
        pagination={false}
        scroll={{ x: "max-content" }}
        locale={{ emptyText: <Empty description="No enquiries from this client." /> }}
      />
      <Drawer open={Boolean(openId)} title="Enquiry" size={520} onClose={() => setOpenId(null)} destroyOnHidden>
        {loading || !enquiry ? (
          <Spin />
        ) : (
          <Descriptions
            column={1}
            size="small"
            items={[
              { key: "received", label: "Received", children: formatDateTime(enquiry.created_at) },
              {
                key: "services",
                label: "Services",
                children: (enquiry.services || []).map((service) => service.name).join(", ") || "—",
              },
              { key: "needed", label: "Needed On", children: formatDate(enquiry.needed_on) },
              { key: "address", label: "Address", children: enquiry.address?.one_line || "—" },
              { key: "notes", label: "Notes", children: enquiry.notes || "—" },
              { key: "phone", label: "Phone", children: enquiry.client?.phone || "—" },
              ...(enquiry.quoted_price !== null && enquiry.quoted_price !== undefined
                ? [{ key: "price", label: "Quoted Price (old form)", children: formatMoney(enquiry.quoted_price) }]
                : []),
              ...(Array.isArray(enquiry.answers) && enquiry.answers.length
                ? [
                    {
                      key: "answers",
                      label: "Answers (old form)",
                      children: (
                        <ul className="client-flow__answers">
                          {enquiry.answers.map((answer, index) => (
                            <li key={index}>
                              {answer.question || "Question"}: {String(answer.answer ?? "—")}
                            </li>
                          ))}
                        </ul>
                      ),
                    },
                  ]
                : []),
            ]}
          />
        )}
      </Drawer>
    </div>
  );
};

export default ClientEnquiriesTab;
