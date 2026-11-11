import { useState } from "react";
import { Button, Modal, message } from "antd";
import { importInvoices } from "@/services/api/invoiceApi";
import { dataOf, errorMessage } from "@/services/apiResult";
import { downloadBlob } from "@/utils/download";
import type { InvoiceImportResult } from "@/types";

const CSV_SAMPLE = [
  "invoice_number,client_name,address_1,address_2,billing_date,service_start,service_end,due_date,signing_date",
  "INV-2609-101,Mestre Star Cleaning LLC,100 Queen St W,,2026-09-01,2026-08-01,2026-08-31,2026-09-15,2026-09-01",
  "INV-2609-102,Cleaner A,200 Main St,Suite 100,2026-09-15,2026-09-01,2026-09-30,2026-10-15,2026-09-15",
].join("\n");

const MAX_BYTES = 5 * 1024 * 1024;
const unique = (list: (string | null | undefined)[]) => [
  ...new Set(list.filter((value): value is string => Boolean(value))),
];

/** What an import with no answer counts as. */
const NOTHING_IMPORTED: InvoiceImportResult = {
  total_rows: 0,
  imported_count: 0,
  skipped_count: 0,
  unmatched_count: 0,
  error_count: 0,
  invoices: [],
  skipped: [],
  unmatched: [],
  errors: [],
};

const csvCell = (value: string | number | null | undefined) => {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const copy = (text: string) =>
  navigator.clipboard
    .writeText(text)
    .then(() => message.success("Client names copied"))
    .catch(() => message.error("Couldn't copy"));

/**
 * Imports old invoices from a CSV (no PDF made, never emailed). When rows
 * weren't imported it says why, row by row, and which clients to create.
 * `onImported(result)` gets the API's answer.
 */
export interface InvoiceImportModalProps {
  open: boolean;
  onClose: () => void;
  onImported: (result: InvoiceImportResult) => void;
  onGoToClients: () => void;
}

const InvoiceImportModal = ({ open, onClose, onImported, onGoToClients }: InvoiceImportModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<InvoiceImportResult | null>(null);

  const close = () => {
    setFile(null);
    setResult(null);
    onClose();
  };

  const runImport = async () => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      message.error("Only .csv files can be imported");
      return;
    }
    if (file.size > MAX_BYTES) {
      message.error("The file is over 5 MB");
      return;
    }
    setImporting(true);
    try {
      const answer = dataOf(await importInvoices(file)) || NOTHING_IMPORTED;
      onImported(answer);
      const issues = (answer.unmatched?.length || 0) + (answer.errors?.length || 0) + (answer.skipped?.length || 0);
      if (issues) {
        setFile(null);
        setResult(answer);
      } else {
        message.success(`${answer.imported_count ?? 0} invoice(s) imported`);
        close();
      }
    } catch (error) {
      message.error(errorMessage(error, "Couldn't import the CSV"));
    } finally {
      setImporting(false);
    }
  };

  if (result) {
    const unmatched = result.unmatched || [];
    const errors = result.errors || [];
    const skipped = result.skipped || [];
    const notFound = unmatched.filter((row) => row.reason === "Client not found");
    const inactive = unmatched.filter((row) => row.reason === "Client account is inactive");
    const ambiguous = unmatched.filter((row) => row.reason === "Name belongs to more than one active client account");
    const missingNames = unique(notFound.map((row) => row.client_name));

    const downloadReport = () => {
      const lines = ["row,invoice_number,client_name,reason"];
      [...unmatched, ...errors, ...skipped].forEach((row) =>
        lines.push([row.row, row.invoice_number, row.client_name, row.reason || row.message].map(csvCell).join(",")),
      );
      downloadBlob(new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" }), "csv-import-not-imported.csv");
    };

    return (
      <Modal
        title="CSV import finished"
        open={open}
        closable={false}
        mask={{ closable: false }}
        keyboard={false}
        width={680}
        footer={[
          <Button key="download" onClick={downloadReport} disabled={!unmatched.length && !errors.length}>
            Download List
          </Button>,
          <Button key="copy" onClick={() => copy(missingNames.join("\n"))} disabled={!missingNames.length}>
            Copy Client Names
          </Button>,
          <Button key="clients" onClick={onGoToClients}>
            Go to Clients
          </Button>,
          <Button key="close" type="primary" onClick={close}>
            Close
          </Button>,
        ]}
      >
        <div className="csv-result-summary">
          <div className="csv-stat csv-stat-ok">
            <strong>{result.imported_count ?? 0}</strong>
            Imported
          </div>
          <div className="csv-stat csv-stat-skip">
            <strong>{skipped.length}</strong>
            Already exist
          </div>
          <div className="csv-stat csv-stat-fail">
            <strong>{unmatched.length + errors.length}</strong>
            Not imported
          </div>
        </div>

        {notFound.length > 0 && (
          <div className="csv-result-section">
            <h4>These clients don't exist yet</h4>
            <p className="csv-result-section__text">
              Create each client under Clients with the exact name below, then import the same CSV again. Invoices
              already imported are skipped, so only the missing rows get added.
            </p>
            <div className="csv-client-list">
              {missingNames.map((name) => (
                <code key={name} className="csv-client-chip">
                  {name}
                </code>
              ))}
            </div>
          </div>
        )}

        {inactive.length > 0 && (
          <div className="csv-result-section">
            <h4>These client accounts are inactive</h4>
            <p className="csv-result-section__text">
              The name exists, but the account is turned off, so these rows weren't imported. Turn the account back on,
              then import the same CSV again.
            </p>
            <ul>
              {inactive.map((row) => (
                <li key={`i-${row.row}`}>
                  Row {row.row} ({row.invoice_number}): {row.client_name}
                </li>
              ))}
            </ul>
          </div>
        )}

        {ambiguous.length > 0 && (
          <div className="csv-result-section">
            <h4>More than one active account has this name</h4>
            <p className="csv-result-section__text">
              These rows weren't imported because the name matches more than one active client. Rename or turn off the
              duplicate account, then import again.
            </p>
            <ul>
              {ambiguous.map((row) => (
                <li key={`m-${row.row}`}>
                  Row {row.row} ({row.invoice_number}): {row.client_name}
                </li>
              ))}
            </ul>
          </div>
        )}

        {errors.length > 0 && (
          <div className="csv-result-section">
            <h4>Rows with errors</h4>
            <ul>
              {errors.map((row) => (
                <li key={`e-${row.row}`}>
                  Row {row.row} ({row.invoice_number || "—"}): {row.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {skipped.length > 0 && (
          <div className="csv-result-section">
            <h4>Already imported (skipped)</h4>
            <p className="csv-result-section__muted">{skipped.map((row) => row.invoice_number).join(", ")}</p>
          </div>
        )}
      </Modal>
    );
  }

  return (
    <Modal
      title="Import Old Invoices"
      open={open}
      onCancel={() => !importing && close()}
      footer={[
        <Button key="cancel" onClick={close} disabled={importing}>
          Cancel
        </Button>,
        <Button
          key="sample"
          onClick={() =>
            downloadBlob(new Blob([CSV_SAMPLE], { type: "text/csv;charset=utf-8;" }), "historical-invoices-sample.csv")
          }
          disabled={importing}
        >
          Download Sample CSV
        </Button>,
        <Button key="import" type="primary" onClick={runImport} loading={importing} disabled={!file}>
          Import CSV
        </Button>,
      ]}
    >
      <div className="csv-file-field">
        <label className="csv-file-field__label" htmlFor="csv-import-file">
          CSV File (up to 5 MB)
        </label>
        <input
          id="csv-import-file"
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </div>

      <div className="csv-format-box">
        <p className="csv-box-title">CSV Format</p>
        <p className="csv-box-text">Your CSV must have these columns:</p>
        <pre className="csv-format-sample">{CSV_SAMPLE}</pre>
      </div>

      <div className="csv-instructions-box">
        <p className="csv-box-title">Before you import</p>
        <ul>
          <li>Keep the column names exactly as shown above.</li>
          <li>Dates use the YYYY-MM-DD format.</li>
          <li>
            <strong>client_name</strong> must match the client's name exactly. Clients that don't exist are listed after
            the import so you can create them.
          </li>
          <li>Imported invoices get no new PDF and are never emailed. You can upload each one's PDF afterwards.</li>
          <li>Invoice numbers that already exist are skipped, so the same file can be imported again.</li>
        </ul>
      </div>

      {file && <p className="csv-selected-file">Selected file: {file.name}</p>}
    </Modal>
  );
};

export default InvoiceImportModal;
