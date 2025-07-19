const express = require("express");
const cors = require("cors");
const { pool, createGrrBarrelsTable } = require("./db");

// --- ENSURE THESE DOCX IMPORTS ARE HERE, AT THE VERY TOP ---
const docx = require("docx");
const {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow, // Make sure TableRow is here and spelled correctly
  TableCell,
  TextRun,
  AlignmentType,
  HeadingLevel,
  WidthType,
} = docx;
// --- END DOCX IMPORTS ---

const app = express();
const PORT = process.env.PORT || 5000;
console.log("Port being used:", PORT);

app.use(cors());
app.use(express.json()); // to parse JSON from frontend

// Create table on start
createGrrBarrelsTable()
  .then(() => console.log("grr_barrels table is ready."))
  .catch((err) => console.error("Error creating table:", err));

// Test route
app.get("/", (req, res) => {
  res.send("GRR Barrels API running");
});

// === INSERT new record ===
app.post("/api/new", async (req, res) => {
  try {
    const {
      customer_name,
      contact_number,
      site_area_name,
      town,
      os_full_barrels,
      os_abc_barrels,
      os_damaged_barrels,
      date,
      closing_stock, // ✅ Get from request body
    } = req.body;

    await pool.query(
      `INSERT INTO grr_barrels (
          customer_name, contact_number, site_area_name, town,
          os_full_barrels, os_abc_barrels, os_damaged_barrels,
          date, closing_stock
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        customer_name,
        contact_number,
        site_area_name,
        town,
        os_full_barrels,
        os_abc_barrels,
        os_damaged_barrels,
        date,
        closing_stock, // ✅ Insert into DB
      ]
    );

    res.status(200).json({ message: "New record inserted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Insert failed" });
  }
});

// This will always create a new record, preserving old ones
app.post("/api/record", async (req, res) => {
  try {
    const {
      customer_name,
      contact_number,
      site_area_name,
      town,
      date,
      full_barrels_received,
      abc_barrels_supplied,
      closing_stock,
      vehicle_number,
      driver_name,
      waiting_period_end_date,
    } = req.body;

    await pool.query(
      `INSERT INTO grr_barrels (
        customer_name,
        contact_number,
        site_area_name,
        town,
        date,
        full_barrels_received,
        abc_barrels_supplied,
        closing_stock,
        vehicle_number,
        driver_name,
        waiting_period_end_date
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        customer_name,
        contact_number,
        site_area_name,
        town,
        date,
        full_barrels_received,
        abc_barrels_supplied,
        closing_stock,
        vehicle_number,
        driver_name,
        waiting_period_end_date || null,
      ]
    );

    res.status(201).json({ message: "New version of record inserted." });
  } catch (err) {
    console.error("Error inserting new record:", err);
    res.status(500).json({ error: "Failed to insert new record" });
  }
});

// === MODIFIED: Get all distinct customer records for selection in dropdown ===
app.get("/api/customers-for-selection", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT customer_name, site_area_name
       FROM grr_barrels
       ORDER BY customer_name ASC, site_area_name ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Failed to fetch customer records for selection" });
  }
});

// === UPDATED: Get the latest record for a customer and site ===
app.get("/api/record", async (req, res) => {
  const { customer_name, site_area_name } = req.query;

  if (!customer_name || !site_area_name) {
    return res
      .status(400)
      .json({ error: "Missing customer_name or site_area_name" });
  }

  try {
    const result = await pool.query(
      `SELECT
         id,
         customer_name,
         contact_number,
         site_area_name,
         town,
         TO_CHAR(date, 'YYYY-MM-DD') AS date,  -- ✅ format date in SQL
         full_barrels_received,
         abc_barrels_supplied,
         closing_stock,
         vehicle_number,
         driver_name,
         waiting_period_end_date
       FROM grr_barrels
       WHERE customer_name = $1 AND site_area_name = $2
       ORDER BY id DESC
       LIMIT 1`,
      [customer_name, site_area_name]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Record not found for provided customer and site" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Failed to fetch record by customer and site:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all unique customer names
app.get("/api/customers", async (req, res) => {
  try {
    const result = await pool.query("SELECT customer_name FROM grr_barrels");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

// Get all records for a customer (for report)

// app.js (or your backend file)

app.get("/api/barrels/all", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM grr_barrels");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch all barrel records" });
  }
});

app.get("/api/customer/:name/all", async (req, res) => {
  try {
    const { name } = req.params;
    const result = await pool.query(
      "SELECT * FROM grr_barrels WHERE customer_name = $1 ORDER BY date ASC",
      [name]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch customer records" });
  }
});

// Update waiting_period_end_date for a record by id
app.put("/api/barrel/:id/waiting-period-end-date", async (req, res) => {
  try {
    const { id } = req.params;
    const { waiting_period_end_date } = req.body;
    await pool.query(
      "UPDATE grr_barrels SET waiting_period_end_date = $1 WHERE id = $2",
      [waiting_period_end_date, id]
    );
    res.status(200).json({ message: "Waiting period end date updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update waiting period end date" });
  }
});

// === DELETE customer record ===

// Add this new route in your backend index.js file

app.delete("/api/delete-by-name-and-town", async (req, res) => {
  try {
    const { customer_name, site_area_name } = req.body; // Get from request body

    if (!customer_name) {
      return res
        .status(400)
        .json({ error: "Customer name is required for deletion." });
    }

    // Prepare the WHERE clause based on whether site_area_name is provided
    let queryText = "DELETE FROM grr_barrels WHERE customer_name = $1";
    let queryParams = [customer_name];

    if (site_area_name) {
      queryText += " AND site_area_name = $2";
      queryParams.push(site_area_name);
    } else {
      // If site_area_name is not provided, match records where site_area_name is NULL
      queryText += " AND site_area_name IS NULL";
    }

    const result = await pool.query(queryText, queryParams);

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ error: "No matching records found to delete." });
    }

    let message = `Record(s) for '${customer_name}'`;
    if (site_area_name) {
      message += ` in '${site_area_name}'`;
    }
    message += ` deleted successfully. (Total: ${result.rowCount} records)`;

    res.status(200).json({
      message: message,
      deletedCount: result.rowCount,
      deletedCustomerName: customer_name,
      deletedSiteAreaName: site_area_name,
    });
  } catch (err) {
    console.error("Error deleting record by customer name and town:", err);
    res.status(500).json({ error: "Failed to delete record." });
  }
});

// Get all unique town names
app.get("/api/towns", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT DISTINCT town FROM grr_barrels WHERE town IS NOT NULL AND town != ''"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch towns" });
  }
});

// Get aggregated barrel data for a town
app.get("/api/town-report/:town", async (req, res) => {
  try {
    const { town } = req.params;

    // Get all customers in this town
    const customersResult = await pool.query(
      "SELECT DISTINCT customer_name FROM grr_barrels WHERE town = $1",
      [town]
    );

    // Get the latest record for each customer in this town
    const customers = customersResult.rows.map((row) => row.customer_name);
    let allRecords = [];

    for (const name of customers) {
      const recRes = await pool.query(
        "SELECT * FROM grr_barrels WHERE customer_name = $1 AND town = $2 ORDER BY date DESC LIMIT 1",
        [name, town]
      );

      if (recRes.rows && recRes.rows.length > 0) {
        allRecords = allRecords.concat(recRes.rows);
      }
    }

    res.json(allRecords);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch town report data" });
  }
});

// Add this new route to your Express app

// Route to get all data (complete data report)
app.get("/api/reports/all-data", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        customer_name,
        contact_number,
        site_area_name,
        town,
        date,
        full_barrels_received,
        abc_barrels_supplied,
        closing_stock,
        vehicle_number,
        driver_name,
        os_full_barrels,
        os_abc_barrels,
        os_damaged_barrels,
        waiting_period_end_date
      FROM grr_barrels
      ORDER BY date DESC, customer_name ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching complete data report:", err);
    res.status(500).json({ error: "Failed to fetch complete data report." });
  }
});

app.get("/api/reports/all-data/docx", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        customer_name,
        contact_number,
        site_area_name,
        town,
        date,
        full_barrels_received,
        abc_barrels_supplied,
        closing_stock,
        vehicle_number,
        driver_name,
        os_full_barrels,
        os_abc_barrels,
        os_damaged_barrels,
        waiting_period_end_date
      FROM grr_barrels
      ORDER BY date DESC, customer_name ASC
    `);

    const records = result.rows;

    // Define table headers
    const headers = [
      "ID",
      "Customer Name",
      "Contact Number",
      "Site Area",
      "Town",
      "Date",
      "Full Barrels Rec.",
      "ABC Barrels Sup.",
      "Closing Stock",
      "Vehicle No.",
      "Driver Name",
      "OS Full Barrels",
      "OS ABC Barrels",
      "OS Damaged Barrels",
      "Waiting Period End Date",
    ];

    // Create table rows for the DOCX document
    const tableRows = [
      new TableRow({
        // Header row
        children: headers.map(
          (header) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: header, bold: true })],
                }),
              ],
              borders: {
                top: {
                  style: docx.BorderStyle.SINGLE,
                  size: 1,
                  color: "000000",
                },
                bottom: {
                  style: docx.BorderStyle.SINGLE,
                  size: 1,
                  color: "000000",
                },
                left: {
                  style: docx.BorderStyle.SINGLE,
                  size: 1,
                  color: "000000",
                },
                right: {
                  style: docx.BorderStyle.SINGLE,
                  size: 1,
                  color: "000000",
                },
              },
            })
        ),
      }),
      // Data rows
      ...records.map(
        (row) =>
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun(String(row.id || ""))],
                  }),
                ], // Use TextRun
                borders: {
                  top: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                  bottom: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                  left: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                  right: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun(row.customer_name || "")],
                  }),
                ],
                borders: {
                  top: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                  bottom: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                  left: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                  right: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun(row.contact_number || "")],
                  }),
                ],
                borders: {
                  top: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                  bottom: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                  left: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                  right: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun(row.site_area_name || "")],
                  }),
                ],
                borders: {
                  top: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                  bottom: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                  left: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                  right: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                },
              }),
              new TableCell({
                children: [
                  new Paragraph({ children: [new TextRun(row.town || "")] }),
                ],
                borders: {
                  top: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                  bottom: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                  left: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                  right: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun(
                        row.date ? new Date(row.date).toLocaleDateString() : ""
                      ),
                    ],
                  }),
                ],
                borders: {
                  top: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                  bottom: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                  left: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                  right: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun(String(row.full_barrels_received || 0)),
                    ],
                  }),
                ],
                borders: {
                  top: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                  bottom: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                  left: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                  right: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun(String(row.abc_barrels_supplied || 0)),
                    ],
                  }),
                ],
                borders: {
                  top: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                  bottom: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                  left: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                  right: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun(String(row.closing_stock || 0))],
                  }),
                ],
                borders: {
                  top: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                  bottom: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                  left: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                  right: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun(row.vehicle_number || "")],
                  }),
                ],
                borders: {
                  top: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                  bottom: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                  left: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                  right: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun(row.driver_name || "")],
                  }),
                ],
                borders: {
                  top: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                  bottom: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                  left: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                  right: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun(String(row.os_full_barrels || 0))],
                  }),
                ],
                borders: {
                  top: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                  bottom: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                  left: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                  right: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun(String(row.os_abc_barrels || 0))],
                  }),
                ],
                borders: {
                  top: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                  bottom: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                  left: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                  right: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun(String(row.os_damaged_barrels || 0)),
                    ],
                  }),
                ],
                borders: {
                  top: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                  bottom: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                  left: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                  right: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                },
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun(
                        row.waiting_period_end_date
                          ? new Date(
                              row.waiting_period_end_date
                            ).toLocaleDateString()
                          : ""
                      ),
                    ],
                  }),
                ],
                borders: {
                  top: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                  bottom: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                  left: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                  right: {
                    style: docx.BorderStyle.SINGLE,
                    size: 1,
                    color: "000000",
                  },
                },
              }),
            ],
          })
      ),
    ];

    // Create a new Document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [new TextRun("Complete Barrel Transaction Report")],
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({ text: "" }), // Spacer paragraph for better spacing

            new Table({
              rows: tableRows,
              width: {
                size: 100,
                type: docx.WidthType.PERCENTAGE, // Corrected to use docx.WidthType
              },
            }),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    // Set headers for download
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=complete_barrel_report.docx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    res.send(buffer);
  } catch (err) {
    console.error("Error generating complete data DOCX report:", err);
    res
      .status(500)
      .json({ error: "Failed to generate complete data DOCX report." });
  }
});
module.exports = app; // export app, no app.listen here
