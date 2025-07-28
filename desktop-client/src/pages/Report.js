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
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSiteAreaName, setSelectedSiteAreaName] = useState("");
  // Add new state variables for town-wise report
  const [towns, setTowns] = useState([]);
  const [selectedTown, setSelectedTown] = useState("");
  const [townReportData, setTownReportData] = useState(null);
  const [townReportBlob, setTownReportBlob] = useState(null);
  const [isTownLoading, setIsTownLoading] = useState(false);
  // New state for complete data report
  const [completeData, setCompleteData] = useState([]);
  const [completeDataBlob, setCompleteDataBlob] = useState(null); // For complete data report docx
  // for duplicate customer name with same phone number
  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState("");
  const [customersByPhone, setCustomersByPhone] = useState([]);

  const { ipcRenderer } = window.require("electron");
  // Runs once on component mount
  useEffect(() => {
    // Fetch customers for the customer name report dropdown
    axios
      .get("http://localhost:5000/api/customers-for-selection")
      .then((res) => setCustomers(res.data))
      .catch((err) => {
        console.error("Failed to fetch customers for selection:", err);
        setError("Failed to load customer list.");
      });

    // Fetch towns for the town-wise report
    axios
      .get("http://localhost:5000/api/towns")
      .then((res) => setTowns(res.data))
      .catch((err) => console.error("Failed to fetch towns:", err));
  }, []); // 👈 only runs on mount

  // Runs whenever reportType changes
  useEffect(() => {
    if (reportType === "duplicate-phone") {
      axios
        .get("http://localhost:5000/api/distinct-phone-numbers")
        .then((res) => setPhoneNumbers(res.data))
        .catch((err) =>
          console.error("Failed to fetch duplicate phone numbers:", err)
        );
    }
  }, [reportType]);

  // Define the header map for both table display and docx generation
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

  const handleReportTypeChange = (e) => {
    setReportType(e.target.value);
    setError("");
    setDocBlob(null);
    setReportData(null);
    setCustomerName("");
    setSelectedTown("");
    setTownReportData(null);
    setTownReportBlob(null);
    setSelectedPhoneNumber("");
    setCustomersByPhone([]);
    setCompleteData([]); // Clear complete data
    setCompleteDataBlob(null); // Clear complete data blob
    // If "Complete Data Report" is selected, fetch the data immediately
    if (e.target.value === "all-data") {
      fetchCompleteDataReport();
    }
  };

  // const handleChange = async (e) => {
  //   const selectedCustomerName = e.target.value;
  //   setCustomerName(selectedCustomerName);
  //   setError("");
  //   setDocBlob(null); // Clear previous doc blob when selection changes
  //   setReportData(null); // Clear previous report data when selection changes

  //   if (!selectedCustomerName) {
  //     // If "Select" is chosen, clear data and return
  //     return;
  //   }

  //   setIsLoading(true); // Set loading state
  //   try {
  //     // Fetch data for the selected customer
  //     const res = await axios.get(
  //       `http://localhost:5000/api/customer/${selectedCustomerName}/all`
  //     );

  //     if (!res.data || res.data.length === 0) {
  //       setError("No records found for this customer.");
  //       setReportData([]); // Set to empty array to ensure table doesn't render if no data
  //     } else {
  //       setReportData(res.data); // Set the fetched data to state for table display
  //     }
  //   } catch (err) {
  //     setError("Failed to fetch customer report data.");
  //     console.error("Error fetching report data:", err);
  //     setReportData([]); // Clear data on error
  //   } finally {
  //     setIsLoading(false); // Clear loading state
  //   }
  // };

  const handleChange = async (e) => {
    const [selectedCustomerName, selectedSiteArea] = e.target.value.split("||");
    setCustomerName(selectedCustomerName);
    setSelectedSiteAreaName(selectedSiteArea);
    setError("");
    setDocBlob(null);
    setReportData(null);

    if (!selectedCustomerName || !selectedSiteArea) return;

    setIsLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:5000/api/customer/${encodeURIComponent(
          selectedCustomerName
        )}/site/${encodeURIComponent(selectedSiteArea)}`
      );

      if (!res.data || res.data.length === 0) {
        setError("No records found for this customer and site area.");
        setReportData([]);
      } else {
        setReportData(res.data);
      }
    } catch (err) {
      setError("Failed to fetch report data.");
      console.error("Error fetching report data:", err);
      setReportData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTownChange = async (e) => {
    const town = e.target.value;
    setSelectedTown(town);
    setError("");
    setTownReportBlob(null); // Clear previous doc blob
    setTownReportData(null); // Clear previous report data

    if (!town) {
      return; // If "Select" is chosen, clear data and return
    }

    setIsTownLoading(true); // Set loading state
    try {
      const res = await axios.get(
        `http://localhost:5000/api/town-report/${town}`
      );

      if (!res.data || res.data.length === 0) {
        setError("No records found for this town.");
        setTownReportData([]); // Set to empty array to ensure tables don't render if no data
      } else {
        setTownReportData(res.data); // Set the fetched data to state for table display
      }
    } catch (err) {
      setError("Failed to fetch town report data.");
      console.error("Error fetching town report data:", err);
      setTownReportData([]); // Clear data on error
    } finally {
      setIsTownLoading(false); // Clear loading state
    }
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
      // Prepare table rows using the already available reportData
      const headers = Object.values(headerMap);
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
        ...reportData.map(
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
      console.error("Error generating docx:", err);
    }
  };

  const handleGenerateTownReport = async (e) => {
    e.preventDefault();
    setError("");
    setTownReportBlob(null);

    if (!selectedTown || !townReportData || townReportData.length === 0) {
      setError("Please select a town and ensure data is loaded.");
      return;
    }

    try {
      // Calculate totals using the already available townReportData
      const totals = {
        os_full_barrels: 0,
        os_abc_barrels: 0,
        os_damaged_barrels: 0,
        closing_stock: 0,
      };

      townReportData.forEach((record) => {
        totals.os_full_barrels += parseInt(record.os_full_barrels || 0);
        totals.os_abc_barrels += parseInt(record.os_abc_barrels || 0);
        totals.os_damaged_barrels += parseInt(record.os_damaged_barrels || 0);
        totals.closing_stock += parseInt(record.closing_stock || 0);
      });

      // Create summary table for docx
      const summaryHeaders = ["Barrel Type", "Total Count"];
      const summaryRows = [
        new TableRow({
          children: summaryHeaders.map(
            (h) =>
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: h, bold: true })],
                  }),
                ],
                width: { size: 4000, type: WidthType.DXA },
              })
          ),
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph("Full Barrels")],
              width: { size: 4000, type: WidthType.DXA },
            }),
            new TableCell({
              children: [new Paragraph(String(totals.os_full_barrels))],
              width: { size: 4000, type: WidthType.DXA },
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph("ABC Barrels")],
              width: { size: 4000, type: WidthType.DXA },
            }),
            new TableCell({
              children: [new Paragraph(String(totals.os_abc_barrels))],
              width: { size: 4000, type: WidthType.DXA },
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph("Damaged Barrels")],
              width: { size: 4000, type: WidthType.DXA },
            }),
            new TableCell({
              children: [new Paragraph(String(totals.os_damaged_barrels))],
              width: { size: 4000, type: WidthType.DXA },
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph("Closing Stock")],
              width: { size: 4000, type: WidthType.DXA },
            }),
            new TableCell({
              children: [new Paragraph(String(totals.closing_stock))],
              width: { size: 4000, type: WidthType.DXA },
            }),
          ],
        }),
      ];

      // Create detailed table for docx
      const detailHeaders = [
        "Customer Name",
        "Site Area",
        "Full Barrels",
        "ABC Barrels",
        "Damaged Barrels",
        "Closing Stock",
      ];

      const detailRows = [
        new TableRow({
          children: detailHeaders.map(
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
        ...townReportData.map(
          (row) =>
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph(row.customer_name || "")],
                  width: { size: 2000, type: WidthType.DXA },
                }),
                new TableCell({
                  children: [new Paragraph(row.site_area_name || "")],
                  width: { size: 2000, type: WidthType.DXA },
                }),
                new TableCell({
                  children: [new Paragraph(String(row.os_full_barrels || 0))],
                  width: { size: 2000, type: WidthType.DXA },
                }),
                new TableCell({
                  children: [new Paragraph(String(row.os_abc_barrels || 0))],
                  width: { size: 2000, type: WidthType.DXA },
                }),
                new TableCell({
                  children: [
                    new Paragraph(String(row.os_damaged_barrels || 0)),
                  ],
                  width: { size: 2000, type: WidthType.DXA },
                }),
                new TableCell({
                  children: [new Paragraph(String(row.closing_stock || 0))],
                  width: { size: 2000, type: WidthType.DXA },
                }),
              ],
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
                    text: `Town-wise Report for ${selectedTown}`,
                    bold: true,
                    size: 32,
                  }),
                ],
                spacing: { after: 300 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Summary",
                    bold: true,
                    size: 28,
                  }),
                ],
                spacing: { after: 200 },
              }),
              new Table({
                rows: summaryRows,
                width: { size: 100, type: WidthType.PERCENTAGE },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Customer Details",
                    bold: true,
                    size: 28,
                  }),
                ],
                spacing: { before: 400, after: 200 },
              }),
              new Table({
                rows: detailRows,
                width: { size: 100, type: WidthType.PERCENTAGE },
              }),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      setTownReportBlob(blob);
    } catch (err) {
      setError("Failed to generate town-wise report.");
      console.error(err);
    }
  };

  const handleTownReportDownload = () => {
    if (townReportBlob) {
      const filename = `${selectedTown}_town_report.docx`;
      townReportBlob.arrayBuffer().then((buffer) => {
        ipcRenderer.send("save-report", buffer, filename);
      });
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
    e.preventDefault(); // Prevent default form submission behavior
    setError(""); // Clear any previous errors
    setNoTxnDocBlob(null); // Clear any previously generated document blob
    setNoTxnRecords([]); // Clear previous no transaction records
    setWaitingPeriodDates({}); // Clear previous waiting period dates

    try {
      // Fetch all barrel records
      const res = await axios.get("http://localhost:5000/api/barrels/all");
      let allRecords = res.data;

      // Get today's date and set hours to 0 for accurate date comparison
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // --- NEW STRATEGY FOR "NO TRANSACTION REPORT" INPUT LIST ---

      // Step 1: Identify all customer names that already have *any* record with a waiting_period_end_date set.
      const customersWithSetWaitingPeriod = new Set();
      allRecords.forEach((record) => {
        if (record.waiting_period_end_date) {
          customersWithSetWaitingPeriod.add(record.customer_name);
        }
      });

      // Step 2: Filter all records for the 60-day gap criteria AND ensure the customer has NOT had a waiting_period_end_date set on *any* of their records.
      const candidatesForNoTxnReport = allRecords.filter((row) => {
        // Exclude customers who already have a waiting_period_end_date set on any of their records
        if (customersWithSetWaitingPeriod.has(row.customer_name)) {
          return false;
        }

        // Skip if 'date' is not present
        if (!row.date) return false;

        const recordDate = new Date(row.date);
        recordDate.setHours(0, 0, 0, 0);

        const diffDays = Math.floor(
          (today - recordDate) / (1000 * 60 * 60 * 24)
        );

        // Return true if the difference is 60 days or more
        return diffDays >= 60;
      });

      // Step 3: From these candidates, deduplicate by customer_name, keeping the record with the largest ID.
      const uniqueNoTxnRecordsMap = new Map();
      candidatesForNoTxnReport.forEach((record) => {
        const existingRecord = uniqueNoTxnRecordsMap.get(record.customer_name);
        if (
          !existingRecord ||
          parseInt(record.id) > parseInt(existingRecord.id)
        ) {
          uniqueNoTxnRecordsMap.set(record.customer_name, record);
        }
      });
      const filteredAndDeduplicatedNoTxn = Array.from(
        uniqueNoTxnRecordsMap.values()
      );

      // --- Filtering and Deduplicating for "Waiting Period End Date" report (for the DOCX table) ---
      // This section remains as previously corrected, as it's for records where
      // waiting_period_end_date *is* set and is today or earlier.
      const filteredForWaitingPeriod = allRecords.filter((row) => {
        if (!row.waiting_period_end_date) return false; // Skip if 'waiting_period_end_date' is not present

        const waitingDate = new Date(row.waiting_period_end_date);
        waitingDate.setHours(0, 0, 0, 0);

        return waitingDate.getTime() <= today.getTime(); // Return true if the waiting date is today or earlier
      });

      // Deduplicate the filtered waiting period records by customer_name, keeping the largest ID
      const uniqueWaitingPeriodRecordsMap = new Map();
      filteredForWaitingPeriod.forEach((record) => {
        const existingRecord = uniqueWaitingPeriodRecordsMap.get(
          record.customer_name
        );
        if (
          !existingRecord ||
          parseInt(record.id) > parseInt(existingRecord.id)
        ) {
          uniqueWaitingPeriodRecordsMap.set(record.customer_name, record);
        }
      });
      const waitingPeriodRecords = Array.from(
        uniqueWaitingPeriodRecordsMap.values()
      );

      // If no records are found for either report, set an error and return
      if (
        filteredAndDeduplicatedNoTxn.length === 0 &&
        waitingPeriodRecords.length === 0
      ) {
        setError(
          "No records found with a 60-day or more gap or expiring waiting period."
        );
        return;
      }

      // Sort the filtered and deduplicated "No Transaction" records by date in ascending order
      filteredAndDeduplicatedNoTxn.sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );
      setNoTxnRecords(filteredAndDeduplicatedNoTxn); // Update state with filtered records for the form

      // Initialize waitingPeriodDates state for the "No Transaction" records that can be updated
      const initialDates = {};
      filteredAndDeduplicatedNoTxn.forEach((row) => {
        initialDates[row.id] = row.waiting_period_end_date || "";
      });
      setWaitingPeriodDates(initialDates); // Update state with initial waiting period dates

      // --- MODIFICATION START: Add 'Site Area Name' to headers and table rows ---

      // Prepare headers for the Word document tables
      const headers = [
        "Customer Name",
        "Contact Number",
        "Site Area Name",
        "Date",
      ]; // <--- ADDED 'Site Area Name'

      // Prepare table 1 rows (records with 60-day or more gap) for the Word document
      const tableRows1 = [
        // Header row
        new TableRow({
          children: headers.map(
            (h) =>
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: h, bold: true })],
                  }),
                ],
                width: { size: 2000, type: WidthType.DXA }, // Set column width
              })
          ),
        }),
        // Data rows
        ...filteredAndDeduplicatedNoTxn.map(
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
                // <--- NEW: Add Site Area Name cell
                new TableCell({
                  children: [new Paragraph(row.site_area_name || "")],
                  width: { size: 2000, type: WidthType.DXA },
                }),
                new TableCell({
                  children: [new Paragraph(formatUTCToLocal(row.date))], // Format date for display
                  width: { size: 2000, type: WidthType.DXA },
                }),
              ],
            })
        ),
      ];

      // Prepare table 2 rows (records where waiting_period_end_date is today or earlier) for the Word document
      const tableRows2 = [
        // Header row
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
        // Data rows
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
                // <--- NEW: Add Site Area Name cell
                new TableCell({
                  children: [new Paragraph(row.site_area_name || "")],
                  width: { size: 2000, type: WidthType.DXA },
                }),
                new TableCell({
                  children: [
                    new Paragraph(
                      formatUTCToLocal(row.waiting_period_end_date)
                    ), // Format date for display
                  ],
                  width: { size: 2000, type: WidthType.DXA },
                }),
              ],
            })
        ),
      ];

      // --- MODIFICATION END ---

      // Create the Word document with two sections/tables
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              // Title for the first report
              new Paragraph({
                children: [
                  new TextRun({
                    text: `No Transaction Report (60-day or more gap)`,
                    bold: true,
                    size: 32, // Font size
                  }),
                ],
                spacing: { after: 300 }, // Spacing after the paragraph
              }),
              // Subtitle for the first table
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Records with 60-day or more gap",
                    bold: true,
                    size: 28,
                  }),
                ],
                spacing: { after: 200 },
              }),
              // First table
              new Table({
                rows: tableRows1,
                width: { size: 100, type: WidthType.PERCENTAGE }, // Table width
              }),
              // Title for the second report (with spacing before it)
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Records with Waiting Period End Date",
                    bold: true,
                    size: 28,
                  }),
                ],
                spacing: { before: 400, after: 200 }, // Spacing before and after
              }),
              new Table({
                rows: tableRows2,
                width: { size: 100, type: WidthType.PERCENTAGE },
              }),
            ],
          },
        ],
      });

      // Generate the document as a Blob
      const blob = await Packer.toBlob(doc);
      setNoTxnDocBlob(blob); // Update state with the generated blob

      // If running in an Electron environment, save the report using the provided API
      if (window.electron?.saveReport) {
        const filename = "no_transaction_report.docx";
        blob.arrayBuffer().then((buffer) => {
          window.electron.saveReport(buffer, filename);
        });
      }
    } catch (err) {
      // Catch and handle any errors during the process
      setError("Failed to generate no transaction report.");
      console.error(err); // Log the error to the console
    }
  };

  const handleWaitingPeriodDateChange = (id, value) => {
    setWaitingPeriodDates((prev) => ({
      ...prev,
      [id]: value === "" ? null : value, // Set NULL when the input is empty
    }));
  };

  // const handlePhoneNumberChange = async (e) => {
  //   const phone = e.target.value;
  //   setSelectedPhoneNumber(phone);
  //   setCustomersByPhone([]);

  //   if (!phone) return;

  //   try {
  //     const res = await axios.get(
  //       `http://localhost:5000/api/customers-by-phone?contact_number=${encodeURIComponent(
  //         phone
  //       )}`
  //     );
  //     setCustomersByPhone(res.data);
  //   } catch (err) {
  //     console.error("Error fetching customers by phone number:", err);
  //   }
  // };

  const generateDuplicatePhoneDoc = () => {
    const tableRows = [];

    // Header row
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ text: "Phone Number", bold: true })],
          }),
          new TableCell({
            width: { size: 70, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ text: "Customer Names", bold: true })],
          }),
        ],
      })
    );

    // Data rows
    phoneNumbers.forEach((entry) => {
      const phone = entry.contact_number;
      const names = entry.customer_names.join(", ");

      tableRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph(phone)],
            }),
            new TableCell({
              children: [new Paragraph(names)],
            }),
          ],
        })
      );
    });

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              text: "Duplicate Phone Number Report",
              heading: "Heading1",
            }),
            new Paragraph(" "),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: tableRows,
            }),
          ],
        },
      ],
    });

    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, "Duplicate_Phone_Number_Report.docx");
    });
  };

  // NEW FUNCTION: Fetch Complete Data Report
  // Function to fetch JSON complete data (for preview/initial check)
  const fetchCompleteDataReport = async () => {
    setError("");
    setCompleteData([]); // Clear previous data
    try {
      console.log("Fetching complete data (JSON)...");
      const response = await axios.get(
        "http://localhost:5000/api/reports/complete-data" // Your JSON endpoint
      );
      console.log(
        "Complete data fetched (JSON):",
        response.data.length,
        "records"
      );
      setCompleteData(response.data);
    } catch (err) {
      console.error("Error fetching complete data report (JSON):", err);
      setError("Failed to fetch complete data report (JSON).");
      setCompleteData([]); // Ensure data is cleared on error
    }
  };

  // NEW HANDLER FOR DOCX DOWNLOAD
  const handleGenerateCompleteDataDocx = async () => {
    setError(""); // Clear any previous errors
    try {
      console.log("Attempting to fetch DOCX complete data...");
      const response = await axios.get(
        "http://localhost:5000/api/reports/all-data/docx", // THIS IS YOUR DOCX ENDPOINT
        {
          responseType: "blob", // Important: tell axios to expect a binary response
        }
      );
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      saveAs(blob, "Complete_Barrel_Report.docx");
      console.log("Complete data DOCX report downloaded.");
    } catch (err) {
      console.error("Error downloading complete data DOCX report:", err);
      setError("Failed to download complete data DOCX report.");
    }
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

  const tableHeaderStyle = {
    padding: "8px",
    border: "1px solid #ddd",
    textAlign: "left",
    backgroundColor: "#f2f2f2", // Light background for headers
  };

  const tableCellStyle = {
    padding: "8px",
    border: "1px solid #ddd",
    textAlign: "left",
  };

  return (
    <>
      <Header />
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          minHeight: "91vh",
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
                <option value="customer">Customer Name Report</option>
                <option value="town-wise">Town-wise Report</option>
                <option value="no-transaction">No Transaction Report</option>
                <option value="duplicate-phone">
                  Duplicate Phone Number Report
                </option>
                <option value="complete-data">Complete Data Report</option>
              </select>
            </div>
          </form>
          {reportType === "customer" && (
            <form
              onSubmit={handleGenerateReport} // This button now triggers doc generation
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
                  onChange={handleChange} // This fetches data for the table
                  required
                >
                  <option value="">Select</option>
                  {customers.map((cust, index) => (
                    <option
                      key={index}
                      value={`${cust.customer_name}||${cust.site_area_name}`}
                    >
                      {cust.customer_name}
                      {cust.site_area_name ? ` (${cust.site_area_name})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {isLoading && (
                <div style={{ textAlign: "center", padding: "1rem" }}>
                  Loading report data...
                </div>
              )}

              {/* Table to display report data */}
              {reportData && reportData.length > 0 && (
                <div style={{ marginTop: "1.5rem", overflowX: "auto" }}>
                  <h3>Report Preview for {customerName}</h3>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      marginTop: "0.5rem",
                    }}
                  >
                    <thead>
                      <tr style={{ background: "#f0f0f0" }}>
                        {/* Dynamically render headers from headerMap */}
                        {Object.values(headerMap).map((header, index) => (
                          <th key={index} style={tableHeaderStyle}>
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.map((item, rowIndex) => (
                        <tr
                          key={rowIndex}
                          style={{ borderBottom: "1px solid #eee" }}
                        >
                          {/* Dynamically render cells based on headerMap keys */}
                          {Object.keys(headerMap).map((key, colIndex) => (
                            <td key={colIndex} style={tableCellStyle}>
                              {key === "date"
                                ? formatUTCToLocal(item[key])
                                : String(item[key] ?? "")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* If no data found after selection */}
              {customerName &&
                !isLoading &&
                reportData &&
                reportData.length === 0 && (
                  <div
                    style={{
                      color: "#757575",
                      padding: "1rem",
                      textAlign: "center",
                      fontStyle: "italic",
                    }}
                  >
                    No report data found for this customer.
                  </div>
                )}

              {/* The Generate Report button now specifically triggers the docx generation */}
              {customerName && reportData && reportData.length > 0 && (
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
                  Generate DOCX Report
                </button>
              )}

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
                  Download DOCX Report
                </button>
              )}
            </form>
          )}
          {/* NEW: Complete Data Report section */}
          {reportType === "complete-data" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                marginTop: "1rem",
              }}
            >
              {error && ( // Display error from DOCX download attempt
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
              <button
                type="button"
                onClick={handleGenerateCompleteDataDocx} // This calls the new handler
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
                Download Complete DOCX Report
              </button>
            </div>
          )}
          {reportType === "town-wise" && (
            <form
              onSubmit={handleGenerateTownReport} // This button now triggers doc generation
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
                <label style={labelStyle}>Town</label>
                <select
                  style={inputStyle}
                  name="town"
                  value={selectedTown}
                  onChange={handleTownChange} // This fetches data for the tables
                  required
                >
                  <option value="">Select</option>
                  {towns.map((townObj, index) => (
                    <option key={index} value={townObj.town}>
                      {townObj.town}
                    </option>
                  ))}
                </select>
              </div>

              {isTownLoading && (
                <div style={{ textAlign: "center", padding: "1rem" }}>
                  Loading town report data...
                </div>
              )}

              {/* Summary Table for Town Report */}
              {selectedTown && townReportData && townReportData.length > 0 && (
                <div style={{ marginTop: "1.5rem", overflowX: "auto" }}>
                  <h3>Summary for {selectedTown}</h3>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      marginTop: "0.5rem",
                    }}
                  >
                    <thead>
                      <tr style={{ background: "#f0f0f0" }}>
                        <th style={tableHeaderStyle}>Barrel Type</th>
                        <th style={tableHeaderStyle}>Total Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Calculate totals for display in the table */}
                      {(() => {
                        const totals = {
                          os_full_barrels: 0,
                          os_abc_barrels: 0,
                          os_damaged_barrels: 0,
                          closing_stock: 0,
                        };
                        townReportData.forEach((record) => {
                          totals.os_full_barrels += parseInt(
                            record.os_full_barrels || 0
                          );
                          totals.os_abc_barrels += parseInt(
                            record.os_abc_barrels || 0
                          );
                          totals.os_damaged_barrels += parseInt(
                            record.os_damaged_barrels || 0
                          );
                          totals.closing_stock += parseInt(
                            record.closing_stock || 0
                          );
                        });

                        return (
                          <>
                            <tr style={{ borderBottom: "1px solid #eee" }}>
                              <td style={tableCellStyle}>Full Barrels</td>
                              <td style={tableCellStyle}>
                                {totals.os_full_barrels}
                              </td>
                            </tr>
                            <tr style={{ borderBottom: "1px solid #eee" }}>
                              <td style={tableCellStyle}>ABC Barrels</td>
                              <td style={tableCellStyle}>
                                {totals.os_abc_barrels}
                              </td>
                            </tr>
                            <tr style={{ borderBottom: "1px solid #eee" }}>
                              <td style={tableCellStyle}>Damaged Barrels</td>
                              <td style={tableCellStyle}>
                                {totals.os_damaged_barrels}
                              </td>
                            </tr>
                            <tr style={{ borderBottom: "1px solid #eee" }}>
                              <td style={tableCellStyle}>Closing Stock</td>
                              <td style={tableCellStyle}>
                                {totals.closing_stock}
                              </td>
                            </tr>
                          </>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Customer Details Table for Town Report (as per image) */}
              {selectedTown && townReportData && townReportData.length > 0 && (
                <div style={{ marginTop: "1.5rem", overflowX: "auto" }}>
                  <h3>Customer Details in {selectedTown}</h3>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      marginTop: "0.5rem",
                    }}
                  >
                    <thead>
                      <tr style={{ background: "#f0f0f0" }}>
                        <th style={tableHeaderStyle}>Customer Name</th>
                        <th style={tableHeaderStyle}>Site Area</th>
                        <th style={tableHeaderStyle}>Full Barrels</th>
                        <th style={tableHeaderStyle}>ABC Barrels</th>
                        <th style={tableHeaderStyle}>Damaged Barrels</th>
                        <th style={tableHeaderStyle}>Closing Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {townReportData.map((item, rowIndex) => (
                        <tr
                          key={rowIndex}
                          style={{ borderBottom: "1px solid #eee" }}
                        >
                          <td style={tableCellStyle}>
                            {item.customer_name || ""}
                          </td>
                          <td style={tableCellStyle}>
                            {item.site_area_name || ""}
                          </td>
                          <td style={tableCellStyle}>
                            {item.os_full_barrels || 0}
                          </td>
                          <td style={tableCellStyle}>
                            {item.os_abc_barrels || 0}
                          </td>
                          <td style={tableCellStyle}>
                            {item.os_damaged_barrels || 0}
                          </td>
                          <td style={tableCellStyle}>
                            {item.closing_stock || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* If no data found after selection */}
              {selectedTown &&
                !isTownLoading &&
                townReportData &&
                townReportData.length === 0 && (
                  <div
                    style={{
                      color: "#757575",
                      padding: "1rem",
                      textAlign: "center",
                      fontStyle: "italic",
                    }}
                  >
                    No report data found for this town.
                  </div>
                )}

              {/* The Generate Report button now specifically triggers the docx generation */}
              {selectedTown && townReportData && townReportData.length > 0 && (
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
                  Generate DOCX Report
                </button>
              )}

              {townReportBlob && (
                <button
                  type="button"
                  onClick={handleTownReportDownload}
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
                  Download DOCX Report
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
                    Download DOCX Report
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
          {reportType === "duplicate-phone" && (
            <>
              <h3>Phone Numbers Shared by Multiple Unique Customers</h3>
              {phoneNumbers.length > 0 ? (
                <ul>
                  {phoneNumbers.map((entry, index) => (
                    <li key={index}>
                      📞 <strong>{entry.contact_number}</strong>
                      <ul style={{ marginLeft: "1rem" }}>
                        {entry.customer_names.map((name, idx) => (
                          <li key={idx}>👤 {name}</li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No duplicate phone numbers found.</p>
              )}
              {phoneNumbers.length > 0 && (
                <button
                  onClick={generateDuplicatePhoneDoc}
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
                  Download DOCX Report
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default Report;
