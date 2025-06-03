import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import axios from "axios";

function Update() {
  const [form, setForm] = useState({
    customer_name: "",
    contact_number: "",
    site_area_name: "",
    address: "",
    date: "",
    full_barrels_received: "",
    abc_barrels_supplied: "",
    closing_stock: "",
    vehicle_number: "",
    driver_name: "",
  });

  const [customers, setCustomers] = useState([]);
  const [error, setError] = useState("");
  const [initialClosingStock, setInitialClosingStock] = useState("");

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/customers")
      .then((res) => setCustomers(res.data))
      .catch((err) => console.error(err));
  }, []);

  const handleCustomerSelect = async (e) => {
    const selectedName = e.target.value;
    setForm((prev) => ({ ...prev, customer_name: selectedName }));

    if (selectedName) {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/customer/${selectedName}`
        );
        if (res.data) {
          setForm((prev) => ({
            ...prev,
            customer_name: selectedName,
            contact_number: res.data.contact_number,
            site_area_name: res.data.site_area_name,
            address: res.data.address,
            date: "", // Keep date editable
            full_barrels_received: "",
            abc_barrels_supplied: "",
            closing_stock: res.data.closing_stock,
            vehicle_number: "",
            driver_name: "",
          }));
          setInitialClosingStock(res.data.closing_stock || 0);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "full_barrels_received" || name === "abc_barrels_supplied") {
      setForm((prev) => {
        const fullBarrels =
          name === "full_barrels_received"
            ? Number(value)
            : Number(prev.full_barrels_received || 0);
        const abcBarrels =
          name === "abc_barrels_supplied"
            ? Number(value)
            : Number(prev.abc_barrels_supplied || 0);
        const initialStock = Number(initialClosingStock || 0);
        const newClosingStock = initialStock - fullBarrels + abcBarrels;
        return {
          ...prev,
          [name]: value,
          closing_stock: newClosingStock,
        };
      });
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const {
      customer_name,
      contact_number,
      site_area_name,
      address,
      date,
      full_barrels_received,
      abc_barrels_supplied,
      closing_stock,
      vehicle_number,
      driver_name,
    } = form;

    if (
      !customer_name ||
      !contact_number ||
      !site_area_name ||
      !address ||
      !date ||
      !full_barrels_received ||
      !abc_barrels_supplied ||
      !closing_stock ||
      !vehicle_number ||
      !driver_name
    ) {
      setError("Please fill in all fields.");
      return;
    }

    setError("");
    try {
      await axios.put(`http://localhost:5000/api/customer/${customer_name}`, {
        contact_number,
        site_area_name,
        address,
        date,
        full_barrels_received,
        abc_barrels_supplied,
        closing_stock,
        vehicle_number,
        driver_name,
      });
      alert("Record updated successfully!");
    } catch (err) {
      setError("Failed to update record.");
      console.error(err);
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

  return (
    <>
      <Header />
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "80vh",
          background: "#f5f5f5",
        }}
      >
        <form
          onSubmit={handleSubmit}
          style={{
            background: "#fff",
            padding: "2rem",
            borderRadius: 8,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            width: 630,
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            marginTop: "1.5rem",
            marginBottom: "1.5rem",
          }}
        >
          <h2 style={{ textAlign: "center" }}>Barrels Transaction</h2>
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
              value={form.customer_name}
              onChange={handleCustomerSelect}
            >
              <option value="">Select</option>
              {customers.map((cust, index) => (
                <option key={index} value={cust.customer_name}>
                  {cust.customer_name}
                </option>
              ))}
            </select>
          </div>

          <div style={rowStyle}>
            <label style={labelStyle}>Contact Number</label>
            <input
              style={inputStyle}
              type="tel"
              name="contact_number"
              value={form.contact_number}
              disabled
            />
          </div>
          <div style={rowStyle}>
            <label style={labelStyle}>Site Area Name</label>
            <input
              style={inputStyle}
              type="text"
              name="site_area_name"
              value={form.site_area_name}
              disabled
            />
          </div>
          <div style={rowStyle}>
            <label style={labelStyle}>Address</label>
            <input
              style={inputStyle}
              type="text"
              name="address"
              value={form.address}
              disabled
            />
          </div>
          <div style={rowStyle}>
            <label style={labelStyle}>Date</label>
            <input
              style={inputStyle}
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
            />
          </div>
          <div style={rowStyle}>
            <label style={labelStyle}>Number of Full Barrels Received</label>
            <input
              style={inputStyle}
              type="number"
              name="full_barrels_received"
              value={form.full_barrels_received}
              onChange={handleChange}
              min="0"
            />
          </div>
          <div style={rowStyle}>
            <label style={labelStyle}>Number of ABC Barrels Supplied</label>
            <input
              style={inputStyle}
              type="number"
              name="abc_barrels_supplied"
              value={form.abc_barrels_supplied}
              onChange={handleChange}
              min="0"
            />
          </div>
          <div style={rowStyle}>
            <label style={labelStyle}>
              Number of Barrels Yet to be Received
            </label>
            <input
              style={inputStyle}
              type="number"
              name="closing_stock"
              value={form.closing_stock}
              onChange={handleChange}
              disabled
            />
          </div>
          <div style={rowStyle}>
            <label style={labelStyle}>Vehicle Number</label>
            <input
              style={inputStyle}
              type="text"
              name="vehicle_number"
              value={form.vehicle_number}
              onChange={handleChange}
            />
          </div>
          <div style={rowStyle}>
            <label style={labelStyle}>Driver Name</label>
            <input
              style={inputStyle}
              type="text"
              name="driver_name"
              value={form.driver_name}
              onChange={handleChange}
            />
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
              width: "20%",
              alignSelf: "center",
            }}
          >
            Submit
          </button>
        </form>
      </div>
    </>
  );
}

export default Update;
