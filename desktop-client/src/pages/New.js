import React, { useState } from "react";
import Header from "../components/Header";
import axios from "axios";

function New() {
  const [form, setForm] = useState({
    customer_name: "",
    contact_number: "",
    site_area_name: "",
    town: "",
    os_full_barrels: "",
    os_abc_barrels: "",
    os_damaged_barrels: "",
    date: "",
    closing_stock: "",
  });
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState(null); // State for success message

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "date") {
      // Normalize today's date
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Normalize selected date
      const selectedDate = new Date(value);
      selectedDate.setHours(0, 0, 0, 0);

      if (selectedDate > today) {
        alert("Date cannot be in the future."); // or use a state to show this error
        return;
      }
    }

    setForm((prev) => {
      const updatedForm = { ...prev, [name]: value };

      if (
        name === "os_full_barrels" ||
        name === "os_abc_barrels" ||
        name === "os_damaged_barrels"
      ) {
        const full = Number(updatedForm.os_full_barrels || 0);
        const abc = Number(updatedForm.os_abc_barrels || 0);
        const damaged = Number(updatedForm.os_damaged_barrels || 0);

        updatedForm.closing_stock = (full + abc - damaged).toString();
      }

      return updatedForm;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submitting Data:", form);

    const {
      customer_name,
      contact_number,
      site_area_name,
      town,
      os_full_barrels,
      os_abc_barrels,
      os_damaged_barrels,
      date,
    } = form;

    if (
      !customer_name ||
      !contact_number ||
      !site_area_name ||
      !town ||
      !os_full_barrels ||
      !os_abc_barrels ||
      !os_damaged_barrels ||
      !date
    ) {
      setError("Please fill in all fields.");
      setSuccessMessage(null); // Clear success message if there's an error
      return;
    }

    try {
      await axios.post("http://localhost:5000/api/new", form);
      // Set success message as a simple string
      setSuccessMessage("Record inserted successfully");
      setError(""); // Clear any previous errors
      setForm({
        customer_name: "",
        contact_number: "",
        site_area_name: "",
        town: "",
        os_full_barrels: "",
        os_abc_barrels: "",
        os_damaged_barrels: "",
        date: "",
        closing_stock: "",
      });
    } catch (error) {
      console.error(error);
      setError("Failed to insert data");
      setSuccessMessage(null); // Clear success message if there's an error
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

  const successMessageStyle = {
    color: "#2e7d32", // Green color for success
    background: "#e8f5e9", // Light green background
    padding: "0.5rem",
    borderRadius: 4,
    textAlign: "center",
    fontWeight: "bold", // Make the text bold
  };

  return (
    <>
      <Header />
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
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
            width: 750,
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            marginTop: "1.5rem",
            marginBottom: "1.5rem",
          }}
        >
          <h2 style={{ textAlign: "center" }}>Opening Stock</h2>
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
          {successMessage && ( // Conditionally render success message
            <div style={successMessageStyle}>{successMessage}</div>
          )}
          <div style={rowStyle}>
            <label style={labelStyle}>Customer Name</label>
            <input
              style={inputStyle}
              type="text"
              name="customer_name"
              value={form.customer_name}
              onChange={handleChange}
            />
          </div>
          <div style={rowStyle}>
            <label style={labelStyle}>Contact Number</label>
            <input
              style={inputStyle}
              type="tel"
              name="contact_number"
              value={form.contact_number}
              onChange={handleChange}
            />
          </div>
          <div style={rowStyle}>
            <label style={labelStyle}>Site Area Name</label>
            <input
              style={inputStyle}
              type="text"
              name="site_area_name"
              value={form.site_area_name}
              onChange={handleChange}
            />
          </div>
          <div style={rowStyle}>
            <label style={labelStyle}>Town</label>
            <input
              style={inputStyle}
              type="text"
              name="town"
              value={form.town}
              onChange={handleChange}
            />
          </div>
          <div style={rowStyle}>
            <label style={labelStyle}>Number of Full Barrels</label>
            <input
              style={inputStyle}
              type="number"
              name="os_full_barrels"
              value={form.os_full_barrels}
              onChange={handleChange}
              min="0"
            />
          </div>
          <div style={rowStyle}>
            <label style={labelStyle}>Number of ABC Barrels</label>
            <input
              style={inputStyle}
              type="number"
              name="os_abc_barrels"
              value={form.os_abc_barrels}
              onChange={handleChange}
              min="0"
            />
          </div>
          <div style={rowStyle}>
            <label style={labelStyle}>Number of Damaged Barrels</label>
            <input
              style={inputStyle}
              type="number"
              name="os_damaged_barrels"
              value={form.os_damaged_barrels}
              onChange={handleChange}
              min="0"
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
              max={new Date().toISOString().split("T")[0]} // ✅ Prevents future date
            />
          </div>
          <div style={rowStyle}>
            <label style={labelStyle}>Closing Stock</label>
            <input
              style={inputStyle}
              type="number"
              name="closing_stock"
              value={form.closing_stock}
              disabled
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

export default New;
