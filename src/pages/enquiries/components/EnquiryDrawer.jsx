import { Descriptions, Drawer, Spin } from "antd";
import { getEnquiry } from "@/services/api/enquiryApi";
import { dataOf } from "@/services/apiResult";
import { useApiQuery } from "@/hooks/useApiQuery";
import { formatDate, formatDateTime } from "@/utils/datetime";
import { formatMoney } from "@/utils/format";
import "./EnquiryDrawer.scss";

/** One enquiry in full: what the client asked for, when, where, and how to reach them. */
const EnquiryDrawer = ({ enquiryId, onClose }) => {
  const { data: enquiry, loading } = useApiQuery(() => getEnquiry(enquiryId).then(dataOf), [enquiryId], {
    skip: !enquiryId,
    errorText: "Couldn't load the enquiry",
  });

  return (
    <Drawer open={Boolean(enquiryId)} title="Enquiry" size={520} onClose={onClose} destroyOnHidden>
      {loading || !enquiry ? (
        <Spin />
      ) : (
        <Descriptions
          column={1}
          size="small"
          items={[
            { key: "received", label: "Received", children: formatDateTime(enquiry.created_at) },
            { key: "client", label: "Client", children: enquiry.client?.name || enquiry.client?.email || "—" },
            { key: "phone", label: "Phone", children: enquiry.client?.phone || "—" },
            { key: "email", label: "Email", children: enquiry.client?.email || "—" },
            {
              key: "services",
              label: "Services",
              children: (enquiry.services || []).map((service) => service.name).join(", ") || "—",
            },
            { key: "needed", label: "Needed On", children: formatDate(enquiry.needed_on) },
            { key: "address", label: "Address", children: enquiry.address?.one_line || "—" },
            { key: "notes", label: "Notes", children: enquiry.notes || "—" },
            ...(enquiry.quoted_price !== null && enquiry.quoted_price !== undefined
              ? [{ key: "price", label: "Quoted Price (old form)", children: formatMoney(enquiry.quoted_price) }]
              : []),
            ...(Array.isArray(enquiry.answers) && enquiry.answers.length
              ? [
                  {
                    key: "answers",
                    label: "Answers (old form)",
                    children: (
                      <ul className="enquiry-answers">
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
  );
};

export default EnquiryDrawer;
