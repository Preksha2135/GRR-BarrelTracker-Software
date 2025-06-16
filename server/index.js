const express = require("express");
const cors = require("cors");
const { pool, createGrrBarrelsTable } = require("./db");

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

// === UPDATE latest record for a customer ===
app.put("/api/customer/:name", async (req, res) => {
  try {
    const { name } = req.params;
    const {
      contact_number,
      site_area_name,
      town,
      date,
      full_barrels_received,
      abc_barrels_supplied,
      closing_stock,
      vehicle_number,
      driver_name,
    } = req.body;

    // Get latest record by date for the customer
    const latest = await pool.query(
      "SELECT id FROM grr_barrels WHERE customer_name = $1 ORDER BY date DESC LIMIT 1",
      [name]
    );
    if (latest.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "No record found for this customer" });
    }
    const id = latest.rows[0].id;

    await pool.query(
      `UPDATE grr_barrels SET
        contact_number = $1,
        site_area_name = $2,
        town = $3,
        date = $4,
        full_barrels_received = $5,
        abc_barrels_supplied = $6,
        closing_stock = $7,
        vehicle_number = $8,
        driver_name = $9,
        waiting_period_end_date = NULL
        WHERE id = $10`,
      [
        contact_number,
        site_area_name,
        town,
        date,
        full_barrels_received,
        abc_barrels_supplied,
        closing_stock,
        vehicle_number,
        driver_name,
        id,
      ]
    );

    res.status(200).json({ message: "Record updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Update failed" });
  }
});

// Get all unique customer names
app.get("/api/customers", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT DISTINCT customer_name FROM grr_barrels"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

// Get customer details by name
app.get("/api/customer/:name", async (req, res) => {
  try {
    const { name } = req.params;
    const result = await pool.query(
      "SELECT * FROM grr_barrels WHERE customer_name = $1 ORDER BY date DESC LIMIT 1",
      [name]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch customer details" });
  }
});

// Get all records for a customer (for report)
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
app.delete("/api/delete/:name", async (req, res) => {
  try {
    const { name } = req.params;
    // Check if the customer exists
    const customerExists = await pool.query(
      "SELECT * FROM grr_barrels WHERE customer_name = $1",
      [name]
    );

    if (customerExists.rows.length === 0) {
      return res.status(404).json({ error: "Customer record not found" });
    }

    // Delete the customer's records
    await pool.query("DELETE FROM grr_barrels WHERE customer_name = $1", [
      name,
    ]);

    res
      .status(200)
      .json({ message: `Customer '${name}' deleted successfully.` });
  } catch (err) {
    console.error("Error deleting customer:", err);
    res.status(500).json({ error: "Failed to delete customer record" });
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
    const customers = customersResult.rows.map(row => row.customer_name);
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

// Get all records for full report
app.get("/api/full-report", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM grr_barrels ORDER BY customer_name, date DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch full report data" });
  }
});

// Start server
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

module.exports = app; // export app, no app.listen here


