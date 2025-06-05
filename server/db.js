const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // required for Neon
  },
});

async function createGrrBarrelsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS grr_barrels (
      id SERIAL PRIMARY KEY,
      customer_name VARCHAR(255),
      contact_number VARCHAR(50),
      site_area_name VARCHAR(255),
      address TEXT,
      date DATE,
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
