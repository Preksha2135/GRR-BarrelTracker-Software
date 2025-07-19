import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import axios from "axios";

function Update() {
  const [form, setForm] = useState({
    id: null, // Add id to the form state to store the selected record's ID
    customer_name: "",
    contact_number: "",
    site_area_name: "",
    town: "",
    date: "",
    full_barrels_received: "",
    abc_barrels_supplied: "",
    closing_stock: "",
    vehicle_number: "",
    driver_name: "",
  });

  const [customerRecords, setCustomerRecords] = useState([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState(null);
  const [initialClosingStock, setInitialClosingStock] = useState(0); // Initialize with 0
  const [isEditingContactInfo, setIsEditingContactInfo] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  // New state to hold the ID of the currently selected record from the dropdown
  const [selectedRecordKey, setSelectedRecordKey] = useState("");

  useEffect(() => {
    // CHANGE 1: Call the new backend endpoint to get all records for selection
    axios
      .get("http://localhost:5000/api/customers-for-selection")
      .then((res) => {
        // Sort by customer_name then by date (descending) for better dropdown order
        const sortedRecords = res.data.sort((a, b) => {
          const nameComparison = a.customer_name.localeCompare(b.customer_name);
          if (nameComparison !== 0) {
            return nameComparison;
          }
          // Assuming date is in 'YYYY-MM-DD' or comparable format
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
        setCustomerRecords(sortedRecords);
      })
      .catch((err) => {
        console.error("Error fetching customers:", err);
        setError("Failed to load customer list.");
      });
  }, []);

  const handleRecordSelect = async (e) => {
    const selectedValue = e.target.value;
    setSelectedRecordKey(selectedValue); // ✅ KEEP SELECTED

    if (!selectedValue) {
      // Clear everything only if blank option is selected
      setForm({
        customer_name: "",
        contact_number: "",
        site_area_name: "",
        town: "",
        date: "",
        full_barrels_received: "",
        abc_barrels_supplied: "",
        closing_stock: "",
        vehicle_number: "",
        driver_name: "",
      });
      setInitialClosingStock(0);
      return;
    }

    const [customer_name, site_area_name] = selectedValue.split("|");

    try {
      const res = await axios.get("http://localhost:5000/api/record", {
        params: { customer_name, site_area_name },
      });

      if (res.data) {
        setForm((prev) => ({
          ...prev,
          customer_name: res.data.customer_name,
          contact_number: res.data.contact_number,
          site_area_name: res.data.site_area_name,
          town: res.data.town,
          date: res.data.date ?? "", // Ensure date is set correctly
          full_barrels_received: res.data.full_barrels_received ?? "",
          abc_barrels_supplied: res.data.abc_barrels_supplied ?? "",
          closing_stock: res.data.closing_stock ?? "",
          vehicle_number: res.data.vehicle_number ?? "",
          driver_name: res.data.driver_name ?? "",
        }));
        setInitialClosingStock(Number(res.data.closing_stock) || 0);
      } else {
        setError("Customer data not found.");
        setForm({
          customer_name: "",
          contact_number: "",
          site_area_name: "",
          town: "",
          date: "",
          full_barrels_received: "",
          abc_barrels_supplied: "",
          closing_stock: "",
          vehicle_number: "",
          driver_name: "",
        });
        setInitialClosingStock(0);
      }
    } catch (err) {
      console.error("Error fetching customer data:", err);
      setError("Failed to fetch customer data.");
      setForm({
        customer_name: "",
        contact_number: "",
        site_area_name: "",
        town: "",
        date: "",
        full_barrels_received: "",
        abc_barrels_supplied: "",
        closing_stock: "",
        vehicle_number: "",
        driver_name: "",
      });
      setInitialClosingStock(0);
    }
  };

  // const handleChange = (e) => {
  //   const { name, value } = e.target;
  //   setSuccessMessage(null);
  //   setError("");

  //   if (name === "full_barrels_received" || name === "abc_barrels_supplied") {
  //     setForm((prev) => {
  //       // Ensure values are treated as numbers, default to 0 if empty
  //       const fullBarrels =
  //         name === "full_barrels_received"
  //           ? Number(value) || 0
  //           : Number(prev.full_barrels_received) || 0;
  //       const abcBarrels =
  //         name === "abc_barrels_supplied"
  //           ? Number(value) || 0
  //           : Number(prev.abc_barrels_supplied) || 0;
  //       const initialStock = Number(initialClosingStock) || 0;

  //       const newClosingStock = initialStock - fullBarrels + abcBarrels;

  //       return {
  //         ...prev,
  //         [name]: value,
  //         closing_stock: newClosingStock,
  //       };
  //     });
  //   } else {
  //     setForm((prev) => ({ ...prev, [name]: value }));
  //   }
  // };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSuccessMessage(null);
    setError("");

    // Get today's date for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to midnight for accurate date-only comparison

    if (name === "date") {
      const selectedDate = new Date(value);
      selectedDate.setHours(0, 0, 0, 0); // Normalize selected date to midnight

      if (selectedDate > today) {
        setError("Date cannot be in the future.");
        // Optionally, you might want to prevent setting the future date in the form state
        // For now, we'll just set an error, but the input value will still reflect the user's pick until they change it.
        // If you want to reset the date input to the previous valid date or today's date,
        // you'd need more complex state management here.
        return; // Stop further processing if date is in the future
      }
      // If the date is valid (today or past), proceed to update the form state
      setForm((prev) => ({ ...prev, [name]: value }));
    } else if (
      name === "full_barrels_received" ||
      name === "abc_barrels_supplied"
    ) {
      setForm((prev) => {
        // Ensure values are treated as numbers, default to 0 if empty
        const fullBarrels =
          name === "full_barrels_received"
            ? Number(value) || 0
            : Number(prev.full_barrels_received) || 0;
        const abcBarrels =
          name === "abc_barrels_supplied"
            ? Number(value) || 0
            : Number(prev.abc_barrels_supplied) || 0;
        const initialStock = Number(initialClosingStock) || 0;

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
  const handleEditClick = () => {
    setIsEditingContactInfo(true);
    setSuccessMessage(null);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Use form.id for the update, not customer_name
    if (!selectedRecordKey) {
      setError("Please select a record to update.");
      return;
    }
    const {
      id, // Now we explicitly get the ID from form state
      customer_name, // Include customer_name in payload if you want to allow its update
      contact_number,
      site_area_name,
      town,
      date,
      full_barrels_received,
      abc_barrels_supplied,
      closing_stock,
      vehicle_number,
      driver_name,
    } = form;

    setError("");
    setSuccessMessage(null);

    // Basic validation
    if (
      !customer_name ||
      !contact_number ||
      !site_area_name ||
      !town ||
      !date ||
      full_barrels_received === "" || // Check for empty string as 0 is a valid number
      abc_barrels_supplied === "" || // Check for empty string as 0 is a valid number
      closing_stock === "" || // Check for empty string as 0 is a valid number
      !vehicle_number ||
      !driver_name
    ) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      // CHANGE 4: Use the new POST endpoint that updates by ID
      await axios.post(`http://localhost:5000/api/record`, {
        customer_name, // Send customer_name if your PUT /api/record/:id allows updating it
        contact_number,
        site_area_name,
        town,
        date,
        full_barrels_received: Number(full_barrels_received), // Ensure numbers are sent as numbers
        abc_barrels_supplied: Number(abc_barrels_supplied), // Ensure numbers are sent as numbers
        closing_stock: Number(closing_stock), // Ensure numbers are sent as numbers
        vehicle_number,
        driver_name,
      });
      setSuccessMessage("Record updated successfully!");
      setIsEditingContactInfo(false);
      setForm({
        id: null, // Reset ID after successful update
        customer_name: "",
        contact_number: "",
        site_area_name: "",
        town: "",
        full_barrels_received: "",
        abc_barrels_supplied: "",
        date: "",
        closing_stock: "",
        vehicle_number: "",
        driver_name: "",
      });
      setSelectedRecordKey("");
      setError("");
      setSuccessMessage(null);
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

  const successMessageStyle = {
    color: "#2e7d32",
    background: "#e8f5e9",
    padding: "0.5rem",
    borderRadius: 4,
    textAlign: "center",
    fontWeight: "bold",
  };

  const buttonContainerStyle = {
    display: "flex",
    justifyContent: "center",
    gap: "1rem",
    marginTop: "1rem",
  };

  const buttonStyle = {
    background: "#1976d2",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    padding: "0.75rem 1.5rem",
    fontSize: "1rem",
    cursor: "pointer",
    minWidth: "120px",
  };

  const editButtonStyle = {
    ...buttonStyle,
    background: "#388e3c",
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
            // width: 630,
            width: 750,
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
          {successMessage && (
            <div style={successMessageStyle}>{successMessage}</div>
          )}

          <div style={rowStyle}>
            <label style={labelStyle}>Select Record to Update</label>
            <select
              style={inputStyle}
              name="selectedRecordKey"
              value={selectedRecordKey} // or rename to selectedRecordKey if you want better clarity
              onChange={handleRecordSelect}
            >
              <option value="">Select a record</option>
              {customerRecords.map((record) => (
                <option
                  key={`${record.customer_name}|${record.site_area_name}`}
                  value={`${record.customer_name}|${record.site_area_name}`}
                >
                  {`${record.customer_name} (${record.site_area_name})`}
                </option>
              ))}
            </select>
          </div>

          <div style={rowStyle}>
            <label style={labelStyle}>Customer Name</label>
            <input
              style={inputStyle}
              type="text"
              name="customer_name"
              value={form.customer_name}
              disabled={false} // Customer name is now displayed from selected record and not directly editable via selection
              // If you want to allow changing the name, remove disabled and add onChange for this field
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
              disabled={!isEditingContactInfo}
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
              disabled={!isEditingContactInfo}
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
              disabled={!isEditingContactInfo}
              onChange={handleChange}
            />
          </div>
          {/* <div style={rowStyle}>
            <label style={labelStyle}>Date</label>
            <input
              style={inputStyle}
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
            />
          </div> */}
          <div style={rowStyle}>
            <label style={labelStyle}>Date</label>
            <input
              style={inputStyle}
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              max={new Date().toISOString().split("T")[0]} // Add this line
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

          <div style={buttonContainerStyle}>
            <button
              type="button"
              onClick={handleEditClick}
              disabled={!form.customer_name || isEditingContactInfo}
              style={editButtonStyle}
            >
              Edit Fields
            </button>

            <button
              type="submit"
              style={buttonStyle}
              disabled={!form.customer_name}
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default Update;
