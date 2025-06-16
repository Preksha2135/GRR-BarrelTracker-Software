const { Pool } = require("pg");

// Load .env only in development
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

// Use DATABASE_URL from env or fallback to NeonDB connection string
const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_RkA9s4rdnwKb@ep-autumn-sun-a1jcnfua-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false, // Required for NeonDB
  },
});
async function createGrrBarrelsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS grr_barrels (
      id SERIAL PRIMARY KEY,
      customer_name TEXT,
      contact_number TEXT,
      site_area_name TEXT,
      town TEXT,
      date TEXT,
      full_barrels_received INTEGER,
      abc_barrels_supplied INTEGER,
      closing_stock INTEGER,
      vehicle_number VARCHAR(100),
      driver_name VARCHAR(255),
      os_full_barrels INTEGER,
      os_abc_barrels INTEGER,
      os_damaged_barrels INTEGER,
      waiting_period_end_date DATE
    );
  `);
}

module.exports = {
  pool,
  createGrrBarrelsTable,
};

