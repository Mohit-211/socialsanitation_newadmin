/** @format */

import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import html2pdf from "html2pdf.js";
import "./HiringForm.css";
import dayjs from "@/lib/dayjs";

const ViewForm = () => {
  const { id } = useParams();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const formRef = useRef();

  const downloadPDF = () => {
    const element = formRef.current;
    const opt = {
      margin: 0.5,
      filename: `Hiring-Form-${id}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    };
    html2pdf().set(opt).from(element).save();
  };

  useEffect(() => {
    const fetchFormData = async () => {
      try {
        const res = await axios.get(
          `https://node.socialsanitation.com/api/v1/form/getFormById/${id}`
        );
        const submissions = res.data?.data?.details_form_submission || [];

        const parsed = submissions.map((item) => ({
          sectionName: item.section_name,
          data: JSON.parse(item.data),
        }));

        setSections(parsed);
      } catch (error) {
        console.error("Failed to fetch form data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFormData();
  }, [id]);

  const formatValue = (value) => {
    // 🗓️ Format any valid date to MM-DD-YYYY
    if (
      typeof value === "string" &&
      (dayjs(value).isValid() ||
        dayjs(value, "YYYY-MM-DDTHH:mm:ss.SSSZ", true).isValid())
    ) {
      return dayjs(value).format("MM-DD-YYYY");
    }

    return value;
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Form Details</h2>
      {/* <button onClick={downloadPDF}>Download as PDF</button> */}

      {sections.map((section, idx) => (
        <div
          // ref={formRef}
          key={idx}
          style={{
            marginBottom: "30px",
            padding: "15px",
            border: "1px solid #ddd",
            borderRadius: "8px",
          }}
        >
          <h3
            style={{
              textTransform: "capitalize",
              borderBottom: "1px solid #ccc",
              paddingBottom: "5px",
            }}
          >
            {section.sectionName.replace(/([A-Z])/g, " $1")}
          </h3>

          <ul style={{ listStyle: "none", paddingLeft: 0 }}>
            {Array.isArray(section.data) ? (
              // For sections like "references"
              section.data.map((item, i) => (
                <div
                  key={i}
                  style={{
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    padding: "10px",
                    marginBottom: "10px",
                  }}
                >
                  {Object.entries(item).map(([key, value]) => (
                    <p key={key} style={{ marginBottom: "6px" }}>
                      <strong>{key.replace(/([A-Z])/g, " $1")}: </strong>
                      {typeof value === "string" &&
                      value.startsWith("data:image") ? (
                        <img
                          src={value}
                          alt={key}
                          style={{
                            maxHeight: "100px",
                            border: "1px solid #ccc",
                            display: "block",
                          }}
                        />
                      ) : Array.isArray(value) ? (
                        value.join(", ")
                      ) : typeof value === "object" && value !== null ? (
                        JSON.stringify(value)
                      ) : (
                        formatValue(value)?.toString()
                      )}
                    </p>
                  ))}
                </div>
              ))
            ) : // For sections like "personalInfo", "previousEmployment"
            typeof section.data === "string" ? (
              <li>
                <strong>Language: </strong> {section.data}
              </li>
            ) : (
              Object.entries(section.data).map(([key, value], qIdx) => {
                // Skip empty or default employmentEligibility block
                if (
                  section.sectionName === "personalInfo" &&
                  key === "employmentEligibility" &&
                  (value === null ||
                    (typeof value === "object" &&
                      Object.keys(value).length === 0) ||
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
                  return null;
                }

                return (
                  <li key={qIdx} style={{ marginBottom: "12px" }}>
                    <strong>{key.replace(/([A-Z])/g, " $1")}: </strong>
                    {typeof value === "string" &&
                    value.startsWith("data:image") ? (
                      <img
                        src={value}
                        alt={key}
                        style={{
                          maxHeight: "100px",
                          border: "1px solid #ccc",
                          display: "block",
                          marginTop: "10px",
                        }}
                      />
                    ) : Array.isArray(value) ? (
                      value.every((item) => typeof item === "object") ? (
                        <div style={{ marginTop: "10px" }}>
                          {value.map((obj, i) => (
                            <div
                              key={i}
                              style={{
                                border: "1px solid #ccc",
                                borderRadius: "6px",
                                padding: "10px",
                                marginBottom: "10px",
                              }}
                            >
                              {Object.entries(obj).map(([k, v]) => (
                                <p key={k} style={{ marginBottom: "4px" }}>
                                  <strong>
                                    {k.replace(/([A-Z])/g, " $1")}:{" "}
                                  </strong>
                                  {typeof v === "string" &&
                                  v.startsWith("data:image") ? (
                                    <img
                                      src={v}
                                      alt={k}
                                      style={{
                                        maxHeight: "100px",
                                        border: "1px solid #ccc",
                                      }}
                                    />
                                  ) : Array.isArray(v) ? (
                                    v.join(", ")
                                  ) : typeof v === "object" && v !== null ? (
                                    JSON.stringify(v)
                                  ) : (
                                    formatValue(v)?.toString()
                                  )}
                                </p>
                              ))}
                            </div>
                          ))}
                        </div>
                      ) : (
                        value.map(formatValue).join(", ")
                      )
                    ) : typeof value === "object" && value !== null ? (
                      JSON.stringify(value)
                    ) : (
                      formatValue(value)?.toString()
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default ViewForm;
