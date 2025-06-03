import React, { useEffect, useState } from "react";
import { saveAs } from "file-saver";
import Header from "../components/Header";
import axios from "axios";

import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
// import { saveAs } from "file-saver";

function formatUTCToLocal(dateString) {
  if (!dateString) return "";
  // Parse as UTC, then convert to local
  const date = new Date(dateString);
  if (isNaN(date)) return dateString; // fallback if invalid
  // Format as YYYY-MM-DD (or change as needed)
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function Report() {
  const [reportType, setReportType] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customers, setCustomers] = useState([]);
  const [error, setError] = useState("");
  const [reportData, setReportData] = useState(null);
  const [docBlob, setDocBlob] = useState(null);
  const [noTxnDocBlob, setNoTxnDocBlob] = useState(null);
  const [noTxnRecords, setNoTxnRecords] = useState([]);
  const [waitingPeriodDates, setWaitingPeriodDates] = useState({});
  const [noTxnSubmitMsg, setNoTxnSubmitMsg] = useState("");

  const { ipcRenderer } = window.require("electron");
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/customers")
      .then((res) => setCustomers(res.data))
      .catch((err) => setError("Failed to fetch customers"));
  }, []);

  const handleReportTypeChange = (e) => {
    setReportType(e.target.value);
    setError("");
    setDocBlob(null);
    setReportData(null);
    setCustomerName("");
  };

  const handleChange = (e) => {
    setCustomerName(e.target.value);
  };

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    setError("");
    setDocBlob(null);
    setReportData(null);
    if (!customerName) {
      setError("Please select a customer name.");
      return;
    }
    try {
      const res = await axios.get(
        `http://localhost:5000/api/customer/${customerName}/all`
      );
      if (!res.data || res.data.length === 0) {
        setError("No records found for this customer.");
        return;
      }
      setReportData(res.data);
      // Map fields to custom headers (only include the required fields)
      const headerMap = {
        customer_name: "Customer Name",
        contact_number: "Contact Number",
        site_area_name: "Site Area Name",
        address: "Address",
        date: "Date",
        full_barrels_received: "Number of Full Barrels Recieved",
        abc_barrels_supplied: "Number of ABC Barrels Supplied",
        closing_stock: "Number of Barrels remaining with the Customer",
      };
      const headers = Object.values(headerMap);
      // Prepare table rows
      const tableRows = [
        new TableRow({
          children: headers.map(
            (h) =>
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: h, bold: true })],
                  }),
                ],
                width: { size: 1000, type: WidthType.DXA },
              })
          ),
        }),
        ...res.data.map(
          (row) =>
            new TableRow({
              children: Object.keys(headerMap).map(
                (key) =>
                  new TableCell({
                    children: [
                      new Paragraph(
                        key === "date"
                          ? formatUTCToLocal(row[key])
                          : String(row[key] ?? "")
                      ),
                    ],
                    width: { size: 1000, type: WidthType.DXA },
                  })
              ),
            })
        ),
      ];
      // Create the document
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Report for ${customerName}`,
                    bold: true,
                    size: 32,
                  }),
                ],
                spacing: { after: 300 },
              }),
              new Table({
                rows: tableRows,
                width: { size: 100, type: WidthType.PERCENTAGE },
              }),
            ],
          },
        ],
      });
      const blob = await Packer.toBlob(doc);
      setDocBlob(blob);
    } catch (err) {
      setError("Failed to generate report.");
      console.error(err);
    }
  };

  const handleDownload = () => {
    if (docBlob) {
      const filename = `${customerName}_report.docx`;
      docBlob.arrayBuffer().then((buffer) => {
        ipcRenderer.send("save-report", buffer, filename);
      });
    }
  };

  const handleNoTransactionReport = async (e) => {
    e.preventDefault();
    setError("");
    setNoTxnDocBlob(null);
    setNoTxnRecords([]);
    setWaitingPeriodDates({});
    try {
      // Fetch all records from all customers
      const res = await axios.get("http://localhost:5000/api/customers");
      const allCustomers = res.data.map((cust) => cust.customer_name);
      let allRecords = [];
      for (const name of allCustomers) {
        const recRes = await axios.get(
          `http://localhost:5000/api/customer/${name}/all`
        );
        if (recRes.data && recRes.data.length > 0) {
          allRecords = allRecords.concat(recRes.data);
        }
      }
      // Filter records where date is 30 days or more before today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const filtered = allRecords.filter((row) => {
        if (!row.date) return false;
        if (row.waiting_period_end_date) return false; // Exclude if waiting_period_end_date is set
        const recordDate = new Date(row.date);
        recordDate.setHours(0, 0, 0, 0);
        const diffDays = Math.floor(
          (today - recordDate) / (1000 * 60 * 60 * 24)
        );
        return diffDays >= 30;
      });
      // Table 2: records where waiting_period_end_date is today
      const waitingPeriodRecords = allRecords.filter((row) => {
        if (!row.waiting_period_end_date) return false;
        const waitingDate = new Date(row.waiting_period_end_date);
        waitingDate.setHours(0, 0, 0, 0);
        return waitingDate.getTime() <= today.getTime();
      });
      if (filtered.length === 0 && waitingPeriodRecords.length === 0) {
        setError("No records found with a 30-day or more gap.");
        return;
      }
      // Sort by date
      filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
      setNoTxnRecords(filtered);
      // Initialize waitingPeriodDates state
      const initialDates = {};
      filtered.forEach((row) => {
        initialDates[row.id] = row.waiting_period_end_date || "";
      });
      setWaitingPeriodDates(initialDates);
      // Prepare table 1 (30-day gap)
      const headers = ["Customer Name", "Contact Number", "Date"];
      const tableRows1 = [
        new TableRow({
          children: headers.map(
            (h) =>
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: h, bold: true })],
                  }),
                ],
                width: { size: 2000, type: WidthType.DXA },
              })
          ),
        }),
        ...filtered.map(
          (row) =>
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph(row.customer_name || "")],
                  width: { size: 2000, type: WidthType.DXA },
                }),
                new TableCell({
                  children: [new Paragraph(row.contact_number || "")],
                  width: { size: 2000, type: WidthType.DXA },
                }),
                new TableCell({
                  children: [new Paragraph(formatUTCToLocal(row.date))],
                  width: { size: 2000, type: WidthType.DXA },
                }),
              ],
            })
        ),
      ];
      // Prepare table 2 (waiting_period_end_date is today)
      const tableRows2 = [
        new TableRow({
          children: headers.map(
            (h) =>
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: h, bold: true })],
                  }),
                ],
                width: { size: 2000, type: WidthType.DXA },
              })
          ),
        }),
        ...waitingPeriodRecords.map(
          (row) =>
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph(row.customer_name || "")],
                  width: { size: 2000, type: WidthType.DXA },
                }),
                new TableCell({
                  children: [new Paragraph(row.contact_number || "")],
                  width: { size: 2000, type: WidthType.DXA },
                }),
                new TableCell({
                  children: [
                    new Paragraph(
                      formatUTCToLocal(row.waiting_period_end_date)
                    ),
                  ],
                  width: { size: 2000, type: WidthType.DXA },
                }),
              ],
            })
        ),
      ];
      // Create the document with two tables
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `No Transaction Report (30-day or more gap)`,
                    bold: true,
                    size: 32,
                  }),
                ],
                spacing: { after: 300 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Records with 30-day or more gap",
                    bold: true,
                    size: 28,
                  }),
                ],
                spacing: { after: 200 },
              }),
              new Table({
                rows: tableRows1,
                width: { size: 100, type: WidthType.PERCENTAGE },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Records with Waiting Period End Date",
                    bold: true,
                    size: 28,
                  }),
                ],
                spacing: { before: 400, after: 200 },
              }),
              new Table({
                rows: tableRows2,
                width: { size: 100, type: WidthType.PERCENTAGE },
              }),
            ],
          },
        ],
      });
      const blob = await Packer.toBlob(doc);
      setNoTxnDocBlob(blob);
      if (window.electron?.saveReport) {
        const filename = "no_transaction_report.docx";
        blob.arrayBuffer().then((buffer) => {
          window.electron.saveReport(buffer, filename);
        });
      }
    } catch (err) {
      setError("Failed to generate no transaction report.");
      console.error(err);
    }
  };

  const handleWaitingPeriodDateChange = (id, value) => {
    setWaitingPeriodDates((prev) => ({
      ...prev,
      [id]: value === "" ? null : value, // Set NULL when the input is empty
    }));
  };

  const rowStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
  };
  const labelStyle = {
    flex: 0.6,
    minWidth: 350,
    maxWidth: 500,
    textAlign: "left",
    fontWeight: 500,
  };
  const inputStyle = {
    flex: 2,
    textAlign: "left",
    paddingLeft: 8,
    padding: "0.5rem",
    border: "1px solid #ccc",
    borderRadius: 4,
    fontSize: "1rem",
  };

  return (
    <>
      <Header />
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          minHeight: "89vh",
          background: "#f5f5f5",
        }}
      >
        <div
          style={{
            background: "#fff",
            padding: "2rem",
            borderRadius: 8,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            width: 700,
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
            marginTop: "1.5rem",
            marginBottom: "1.5rem",
          }}
        >
          <form
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <h2 style={{ textAlign: "center" }}>Report</h2>
            <div style={rowStyle}>
              <label style={labelStyle}>Choose the Type of Report</label>
              <select
                style={inputStyle}
                value={reportType}
                onChange={handleReportTypeChange}
                required
              >
                <option value="">Select</option>
                <option value="customer">Report based on Customer Name</option>
                <option value="no-transaction">
                  Report based on No Transaction
                </option>
              </select>
            </div>
          </form>

          {reportType === "customer" && (
            <form
              onSubmit={handleGenerateReport}
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              {error && (
                <div
                  style={{
                    color: "#d32f2f",
                    background: "#ffebee",
                    padding: "0.5rem",
                    borderRadius: 4,
                    textAlign: "center",
                  }}
                >
                  {error}
                </div>
              )}

              <div style={rowStyle}>
                <label style={labelStyle}>Customer Name</label>
                <select
                  style={inputStyle}
                  name="customer_name"
                  value={customerName}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select</option>
                  {customers.map((cust, index) => (
                    <option key={index} value={cust.customer_name}>
                      {cust.customer_name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                style={{
                  background: "#1976d2",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  padding: "0.75rem",
                  fontSize: "1rem",
                  cursor: "pointer",
                  width: "25%",
                  alignSelf: "center",
                }}
              >
                Generate Report
              </button>
              {docBlob && (
                <button
                  type="button"
                  onClick={handleDownload}
                  style={{
                    background: "#388e3c",
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    padding: "0.75rem",
                    fontSize: "1rem",
                    cursor: "pointer",
                    width: "40%",
                    alignSelf: "center",
                    marginTop: "1rem",
                  }}
                >
                  Download Report
                </button>
              )}
            </form>
          )}

          {reportType === "no-transaction" && (
            <>
              <form
                onSubmit={handleNoTransactionReport}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                <button
                  type="submit"
                  style={{
                    background: "#1976d2",
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    padding: "0.75rem",
                    fontSize: "1rem",
                    cursor: "pointer",
                    width: "25%",
                    alignSelf: "center",
                  }}
                >
                  Generate
                </button>
                {error && (
                  <div
                    style={{
                      color: "#d32f2f",
                      background: "#ffebee",
                      padding: "0.5rem",
                      borderRadius: 4,
                      textAlign: "center",
                      marginTop: "0.5rem",
                    }}
                  >
                    {error}
                  </div>
                )}
                {noTxnDocBlob && (
                  <button
                    type="button"
                    onClick={() =>
                      saveAs(noTxnDocBlob, "no_transaction_report.docx")
                    }
                    style={{
                      background: "#388e3c",
                      color: "#fff",
                      border: "none",
                      borderRadius: 4,
                      padding: "0.75rem",
                      fontSize: "1rem",
                      cursor: "pointer",
                      width: "40%",
                      alignSelf: "center",
                      marginTop: "1rem",
                    }}
                  >
                    Download Report
                  </button>
                )}
              </form>
              {noTxnRecords.length > 0 && (
                <form
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                    marginTop: "2rem",
                  }}
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setNoTxnSubmitMsg("");
                    try {
                      await Promise.all(
                        noTxnRecords.map((row) => {
                          const newDate = waitingPeriodDates[row.id];
                          return axios.put(
                            `http://localhost:5000/api/barrel/${row.id}/waiting-period-end-date`,
                            { waiting_period_end_date: newDate }
                          );
                        })
                      );
                      setNoTxnSubmitMsg(
                        "Waiting period end dates updated successfully!"
                      );
                    } catch (err) {
                      setNoTxnSubmitMsg(
                        "Failed to update. Please enter all the dates."
                      );
                    }
                  }}
                >
                  <div
                    style={{ display: "flex", gap: "1rem", fontWeight: 600 }}
                  >
                    <div style={{ flex: 2 }}>Customer Name</div>
                    <div style={{ flex: 2 }}>Contact Number</div>
                    <div style={{ flex: 2 }}>Waiting Period End Date</div>
                  </div>
                  {noTxnRecords.map((row) => (
                    <div key={row.id} style={{ display: "flex", gap: "1rem" }}>
                      <input
                        style={{ flex: 2, padding: "0.5rem" }}
                        type="text"
                        value={row.customer_name}
                        disabled
                      />
                      <input
                        style={{ flex: 2, padding: "0.5rem" }}
                        type="text"
                        value={row.contact_number}
                        disabled
                      />
                      <input
                        style={{ flex: 2, padding: "0.5rem" }}
                        type="date"
                        value={waitingPeriodDates[row.id] || ""}
                        onChange={(e) =>
                          handleWaitingPeriodDateChange(row.id, e.target.value)
                        }
                      />
                    </div>
                  ))}
                  <button
                    type="submit"
                    style={{
                      background: "#1976d2",
                      color: "#fff",
                      border: "none",
                      borderRadius: 4,
                      padding: "0.75rem",
                      fontSize: "1rem",
                      cursor: "pointer",
                      width: "25%",
                      alignSelf: "center",
                      marginTop: "1rem",
                    }}
                  >
                    Submit
                  </button>
                  {noTxnSubmitMsg && (
                    <div
                      style={{
                        color: noTxnSubmitMsg.includes("success")
                          ? "#388e3c"
                          : "#d32f2f",
                        background: noTxnSubmitMsg.includes("success")
                          ? "#e8f5e9"
                          : "#ffebee",
                        padding: "0.5rem",
                        borderRadius: 4,
                        textAlign: "center",
                        marginTop: "0.5rem",
                      }}
                    >
                      {noTxnSubmitMsg}
                    </div>
                  )}
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default Report;
