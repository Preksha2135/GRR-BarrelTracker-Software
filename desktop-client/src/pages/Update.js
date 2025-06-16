import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import axios from "axios";

function Update() {
  const [form, setForm] = useState({
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

  const [customers, setCustomers] = useState([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState(null);
  const [initialClosingStock, setInitialClosingStock] = useState(0); // Initialize with 0
  const [isEditingContactInfo, setIsEditingContactInfo] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/customers")
      .then((res) => {
        const sortedCustomers = res.data.sort((a, b) =>
          a.customer_name.localeCompare(b.customer_name)
        );
        setCustomers(sortedCustomers);
      })
      .catch((err) => {
        console.error("Error fetching customers:", err);
        setError("Failed to load customer list.");
      });
  }, []);

  const handleCustomerSelect = async (e) => {
    const selectedName = e.target.value;
    setCustomerSearch(selectedName); // Keep input box in sync
    setForm((prev) => ({ ...prev, customer_name: selectedName }));
    setSuccessMessage(null);
    setError("");
    setIsEditingContactInfo(false);

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
            town: res.data.town,
            date: "", // Keep date editable
            full_barrels_received: "", // Reset for new entry
            abc_barrels_supplied: "", // Reset for new entry
            closing_stock: res.data.closing_stock,
            vehicle_number: "", // Reset for new entry
            driver_name: "", // Reset for new entry
          }));
          // Ensure initialClosingStock is a number, default to 0 if null/undefined
          setInitialClosingStock(Number(res.data.closing_stock) || 0);
        } else {
          setError("Customer data not found.");
          // Clear the form if customer data is not found
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
        // Clear the form on error
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
    } else {
      // If "Select" option is chosen, clear the form and reset edit mode
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
      setInitialClosingStock(0); // Reset to 0
      setIsEditingContactInfo(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSuccessMessage(null);
    setError("");

    if (name === "full_barrels_received" || name === "abc_barrels_supplied") {
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

        // The formula for closing stock seems to be: initial stock - barrels received + barrels supplied
        // If "full_barrels_received" means barrels *returned* to the customer (reducing their stock)
        // and "abc_barrels_supplied" means barrels *given* to the customer (increasing their stock).
        // Let's assume the current logic in your code for calculation is correct based on your business need.
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
      await axios.put(`http://localhost:5000/api/customer/${customer_name}`, {
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
      // Optionally, you might want to re-fetch customer data to update the form with the very latest values
      // This is good practice if other parts of your application might also modify this data.
      // handleCustomerSelect({ target: { value: customer_name } }); // Re-fetch the data for the selected customer
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
          {successMessage && (
            <div style={successMessageStyle}>{successMessage}</div>
          )}

          {/* <div style={rowStyle}>
            <label style={labelStyle}>Customer Name</label>
            <div style={{ position: "relative", width: "50%" }}>
              <input

                type="text"
                name="customer_name"
                style={inputStyle}
                value={form.customer_name}
                placeholder="Type/Select Customer Name"
                onChange={(e) => {
                  const value = e.target.value;
                  setForm((prev) => ({ ...prev, customer_name: value }));
                  setShowSuggestions(true);
                }}
                onBlur={() => {
                  // Delay hiding to allow click selection
                  setTimeout(() => setShowSuggestions(false), 100);
                }}
                onFocus={() => {
                  setShowSuggestions(true);
                }}
                autoComplete="off"
              />
              
              {showSuggestions && (
                <ul
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    background: "#fff",
                    border: "1px solid #ccc",
                    maxHeight: "200px",
                    overflowY: "auto",
                    margin: 0,
                    padding: 0,
                    listStyle: "none",
                    zIndex: 10,
                  }}
                >
                  {customers
                    .filter((cust) => {
                      // If no input, show all customers
                      if (!form.customer_name) return true;
                      
                      // If input starts with a letter, only show names starting with that letter
                      const inputValue = form.customer_name.toLowerCase();
                      const customerName = cust.customer_name.toLowerCase();
                      
                      // Check if the first character is entered
                      if (inputValue.length === 1) {
                        // Only show names starting with that letter
                        return customerName.startsWith(inputValue);
                      } else {
                        // For more than one character, show all names containing the input
                        return customerName.includes(inputValue);
                      }
                    })
                    .sort((a, b) =>
                      a.customer_name.localeCompare(b.customer_name)
                    )
                    .map((cust, idx) => (
                      <li
                        key={idx}
                        onClick={() =>
                          handleCustomerSelect({
                            target: { value: cust.customer_name },
                          })
                        }
                        style={{
                          padding: "0.5rem",
                          cursor: "pointer",
                          borderBottom: "1px solid #eee",
                        }}
                      >
                        {cust.customer_name}
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </div> */}
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
