import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Button, Space, Spin } from "antd";
import {
  ArrowLeft,
  User,
  GraduationCap,
  Briefcase,
  Users,
  ShieldCheck,
  FileCheck2,
  Award,
  FileSignature,
  ScrollText,
  Landmark,
  ClipboardList,
  FileText,
} from "lucide-react";
import { getHiringApplication } from "@/services/api/hiringFormApi";
import { dataOf } from "@/services/apiResult";
import PageHeader from "@/components/PageHeader";
import { formatDate } from "@/utils/datetime";
import "./HiringFormDetailsPage.scss";

// Config: section metadata (icon + friendly title) — falls back gracefully
// for any section name not explicitly listed.
const SECTION_META = {
  personalInfo: { title: "Personal Information", icon: User },
  employmentEligibility: { title: "Employment Eligibility", icon: FileCheck2 },
  education: { title: "Education", icon: GraduationCap },
  previousEmployment: { title: "Previous Employment", icon: Briefcase },
  references: { title: "References", icon: Users },
  militaryService: { title: "Military Service", icon: Award },
  backgroundCheck: { title: "Background Check", icon: ShieldCheck },
  authorization: { title: "Authorization", icon: FileSignature },
  disclaimer: { title: "Disclaimer", icon: ScrollText },
  floridaAgreement: { title: "Florida Agreement", icon: ClipboardList },
  directDeposit: { title: "Direct Deposit", icon: Landmark },
};

// Address field grouping
// "country" was added to the hiring form after streetAddress/aptSuite/
// city/state/zipCode already existed, so on the raw JSON it lands at the
// very end of personalInfo — after employmentType, signature, etc. — far
// from the rest of the address. This reorders any of these keys that are
// present so they render together, in a sensible reading order, wherever
// the first one of them would have appeared.
const ADDRESS_KEY_ORDER = [
  "streetAddress",
  "aptSuite",
  "city",
  "state",
  "zipCode",
  "country",
];

const groupAddressFields = (entries) => {
  const addressEntries = [];
  const restEntries = [];
  let firstAddressIndex = -1;

  entries.forEach(([key, value]) => {
    if (ADDRESS_KEY_ORDER.includes(key)) {
      addressEntries.push([key, value]);
      if (firstAddressIndex === -1) firstAddressIndex = restEntries.length;
    } else {
      restEntries.push([key, value]);
    }
  });

  // Need at least two address-ish fields present for grouping to matter —
  // a single stray field (e.g. just "country" with no other address data)
  // doesn't need to move anywhere.
  if (addressEntries.length < 2) {
    return entries;
  }

  const orderedAddressEntries = ADDRESS_KEY_ORDER
    .map((key) => addressEntries.find(([k]) => k === key))
    .filter(Boolean);

  return [
    ...restEntries.slice(0, firstAddressIndex),
    ...orderedAddressEntries,
    ...restEntries.slice(firstAddressIndex),
  ];
};

// A field is only ever treated as a date if BOTH:
//  1) its key name suggests a date, AND
//  2) its value actually matches a real date pattern (ISO timestamp or MM-DD-YYYY)
// This prevents things like SSNs, routing numbers, or account numbers
// (which are plain numeric strings) from being misread as dates.
const DATE_KEY_PATTERN = /date/i;
const ISO_DATETIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
const MDY_PATTERN = /^\d{2}-\d{2}-\d{4}$/;

const looksLikeDateValue = (value) =>
  typeof value === "string" &&
  (ISO_DATETIME_PATTERN.test(value) || MDY_PATTERN.test(value));

const formatValue = (key, value) => {
  if (DATE_KEY_PATTERN.test(key) && looksLikeDateValue(value)) return formatDate(value, value);
  return value;
};

const humanizeKey = (key) =>
  key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();

const humanizeSectionName = (name) =>
  SECTION_META[name]?.title ||
  name
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();

const isImageValue = (value) =>
  typeof value === "string" && value.startsWith("data:image");

const isSignatureKey = (key) => /signature/i.test(key);

// Presentational bits

const EmptyValue = ({ children = "—" }) => (
  <div className="hiring-view__empty">{children}</div>
);

const FieldValue = ({ fieldKey, value }) => {
  if (value === null || value === undefined || value === "") {
    return <EmptyValue />;
  }

  if (isImageValue(value)) {
    return (
      <div className="hiring-view__image">
        <img src={value} alt={fieldKey} />
      </div>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <EmptyValue />;
    }
    if (value.every((item) => typeof item !== "object" || item === null)) {
      return (
        <div className="hiring-view__chips">
          {value.map((item, i) => (
            <span key={i} className="hiring-view__chip">
              {String(formatValue(fieldKey, item))}
            </span>
          ))}
        </div>
      );
    }
    // array of objects -> nested cards
    return (
      <div className="hiring-view__list">
        {value.map((obj, i) => (
          <div key={i} className="hiring-view__card">
            <div className="hiring-view__grid hiring-view__grid--nested">
              {Object.entries(obj).map(([k, v]) => (
                <div key={k}>
                  <div className="hiring-view__sublabel">{humanizeKey(k)}</div>
                  <FieldValue fieldKey={k} value={v} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (typeof value === "object") {
    if (Object.keys(value).length === 0) {
      return <EmptyValue />;
    }
    return (
      <div className="hiring-view__grid hiring-view__grid--object">
        {Object.entries(value).map(([k, v]) => (
          <div key={k}>
            <div className="hiring-view__sublabel">{humanizeKey(k)}</div>
            <FieldValue fieldKey={k} value={v} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="hiring-view__value">
      {String(formatValue(fieldKey, value))}
    </div>
  );
};

const Field = ({ fieldKey, value, spanFull }) => (
  <div className={spanFull ? "hiring-view__field--full" : undefined}>
    <div className="hiring-view__label">{humanizeKey(fieldKey)}</div>
    <FieldValue fieldKey={fieldKey} value={value} />
  </div>
);

const SectionShell = ({ Icon, title, children }) => (
  <section className="surface hiring-view__section">
    <SectionHeader Icon={Icon} title={title} />
    <div className="hiring-view__section-body">{children}</div>
  </section>
);

const SectionCard = ({ sectionName, data }) => {
  const meta = SECTION_META[sectionName];
  const Icon = meta?.icon || ClipboardList;
  const title = humanizeSectionName(sectionName);

  // References-style: top-level array of objects
  if (Array.isArray(data)) {
    return (
      <SectionShell Icon={Icon} title={title}>
        {data.length === 0 ? (
          <EmptyValue>No entries</EmptyValue>
        ) : (
          <div className="hiring-view__list hiring-view__list--entries">
            {data.map((item, i) => (
              <div key={i} className="hiring-view__card hiring-view__card--entry">
                <div className="hiring-view__grid hiring-view__grid--entries">
                  {Object.entries(item).map(([k, v]) => (
                    <Field
                      key={k}
                      fieldKey={k}
                      value={v}
                      spanFull={isImageValue(v)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionShell>
    );
  }

  // Empty object section
  if (typeof data === "object" && data !== null && Object.keys(data).length === 0) {
    return (
      <SectionShell Icon={Icon} title={title}>
        <EmptyValue>No data submitted</EmptyValue>
      </SectionShell>
    );
  }

  // Plain string section (unusual, but handle gracefully)
  if (typeof data === "string") {
    return (
      <SectionShell Icon={Icon} title={title}>
        <Field fieldKey="language" value={data} />
      </SectionShell>
    );
  }

  // Standard key/value object section
  const filteredEntries = Object.entries(data).filter(([key, value]) => {
    // Skip the empty / default employmentEligibility placeholder nested inside personalInfo
    if (
      sectionName === "personalInfo" &&
      key === "employmentEligibility" &&
      (value === null ||
        (typeof value === "object" && Object.keys(value).length === 0) ||
        JSON.stringify(value) ===
          JSON.stringify({
            legallyEligible: "yes",
            workedBefore: "yes",
            convictedFelony: "yes",
            employmentDates: [
              "2025-05-13T18:30:00.000Z",
              "2025-06-18T18:30:00.000Z",
            ],
            felonyExplanation: "Test description",
          }))
    ) {
      return false;
    }
    return true;
  });

  // Groups streetAddress/aptSuite/city/state/zipCode/country together —
  // see groupAddressFields above for why this is needed.
  const entries = groupAddressFields(filteredEntries);

  return (
    <SectionShell Icon={Icon} title={title}>
      {entries.length === 0 ? (
        <EmptyValue>No data submitted</EmptyValue>
      ) : (
        <div className="hiring-view__grid">
          {entries.map(([key, value]) => (
            <Field
              key={key}
              fieldKey={key}
              value={value}
              spanFull={
                isImageValue(value) ||
                isSignatureKey(key) ||
                (typeof value === "object" && value !== null && !Array.isArray(value)) ||
                (Array.isArray(value) && value.some((v) => typeof v === "object"))
              }
            />
          ))}
        </div>
      )}
    </SectionShell>
  );
};

const SectionHeader = ({ Icon, title }) => (
  <div className="hiring-view__section-header">
    <span className="hiring-view__section-icon">
      <Icon size={18} />
    </span>
    <h2 className="hiring-view__section-title">{title}</h2>
  </div>
);

// Main component

const HiringFormDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sections, setSections] = useState([]);
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigateToHiringForms = () => navigate("/hiring-form");

  useEffect(() => {
    const fetchFormData = async () => {
      try {
        setLoading(true);
        setError(null);
        const application = dataOf(await getHiringApplication(id));
        // form_data: every section by name (older answers may still be JSON text)
        const parsed = Object.entries(application?.form_data || {}).map(([sectionName, data]) => ({
          sectionName,
          data: typeof data === "string" ? JSON.parse(data) : data || {},
        }));
        setSections(parsed);
        setApplication(application);
      } catch (err) {
        console.error("Failed to fetch form data:", err);
        setError("Failed to load this hiring form. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchFormData();
  }, [id]);

  return (
    <div className="hiring-view">
      <PageHeader
        title={(application?.applicant_name || "HIRING APPLICATION").toUpperCase()}
        subtitle={application?.applicant_email || "One hiring application, section by section"}
        actions={
          <Space wrap>
            {application?.pdf_url && (
              <Button size="large" icon={<FileText size={16} />} onClick={() => window.open(application.pdf_url, "_blank", "noopener")}>
                PDF
              </Button>
            )}
            <Button size="large" icon={<ArrowLeft size={16} />} onClick={navigateToHiringForms}>
              All Applications
            </Button>
          </Space>
        }
      />

      {loading && (
        <div className="hiring-view__loading">
          <Spin size="large" />
        </div>
      )}

      {!loading && error && (
        <div className="surface hiring-view__message hiring-view__message--error">
          {error}
        </div>
      )}

      {!loading && !error && sections.length === 0 && (
        <div className="surface hiring-view__message">
          <EmptyValue>No submission data found for this form.</EmptyValue>
        </div>
      )}

      {!loading &&
        !error &&
        sections.map((section, idx) => (
          <SectionCard
            key={idx}
            sectionName={section.sectionName}
            data={section.data}
          />
        ))}

      {!loading && (application?.attachments || []).length > 0 && (
        <div className="surface hiring-view__message">
          <strong>Files Sent with the Application</strong>
          <ul className="hiring-view__files">
            {application.attachments.map((file) => (
              <li key={file.id}>
                <a href={file.url} target="_blank" rel="noopener noreferrer">
                  {file.file_name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default HiringFormDetailsPage;
