import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Button, message } from "antd";
import { ArrowLeft, Download, LoaderCircle } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ClientScopeBuilder from "./components/ClientScopeBuilder";
import { downloadScopeOfWorkPDF } from "@/services/api/scopeApi";

const ClientScopeOfWorkPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [downloading, setDownloading] = useState(false);

  const handleDownloadScopePDF = async () => {
    const hideLoading = message.loading("Generating Scope of Work PDF...", 0);
    try {
      setDownloading(true);
      const res = await downloadScopeOfWorkPDF(id);

      // Same shape as generateEstimatePDFService's response — a plain JSON
      // payload wrapped by responseWrapper: { data: { data: { fileUrl } } }
      const fileUrl = res?.data?.data?.fileUrl;

      if (!fileUrl) {
        throw new Error("No file URL returned from server");
      }

      // Open the static file directly, exactly like the full Service
      // Estimate PDF does — the browser's own PDF viewer handles it, and
      // the person can save/print from there. No blob handling needed.
      window.open(fileUrl, "_blank");

      message.success("Scope of Work PDF generated");
    } catch (err) {
      console.error(err);
      message.error("Failed to generate Scope of Work PDF");
    } finally {
      hideLoading();
      setDownloading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="CLIENT SCOPE OF WORK"
        subtitle="Used to generate this client's Estimate PDF and Inspection Sheets"
        actions={
          <>
            <Button
              size="large"
              icon={
                downloading ? (
                  <LoaderCircle size={16} className="icon-spin" />
                ) : (
                  <Download size={16} />
                )
              }
              onClick={handleDownloadScopePDF}
              disabled={downloading}
            >
              {downloading ? "Generating..." : "Download Scope of Work"}
            </Button>

            <Button
              size="large"
              icon={<ArrowLeft size={16} />}
              onClick={() => navigate(`/editUser/${id}`)}
            >
              Back to Client
            </Button>
          </>
        }
      />

      <ClientScopeBuilder userId={id} />
    </div>
  );
};

export default ClientScopeOfWorkPage;