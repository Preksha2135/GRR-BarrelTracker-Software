import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import axios from "axios";

const Delete = () => {
  const [customers, setCustomers] = useState([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState(null);
  // New state to hold the selected customer name and site area name for deletion
  const [selectedCustomerName, setSelectedCustomerName] = useState("");
  const [selectedSiteAreaName, setSelectedSiteAreaName] = useState("");
  const [displayCustomerInfo, setDisplayCustomerInfo] = useState(null); // Still useful for showing details

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        // Use the route that fetches only name and site_area_name as per your backend
        const res = await axios.get(
          `http://localhost:5000/api/customers-for-selection`
        );
        setCustomers(res.data);
      } catch (err) {
        console.error("Error fetching customers:", err);
        setError("Failed to fetch customer list.");
        setSuccessMessage(null);
      }
    };

    fetchCustomers();
  }, []);

  // Handle change in dropdown: update selectedCustomerName and selectedSiteAreaName
  const handleSelectChange = (e) => {
    const selectedValue = e.target.value; // This will be the combined string "CustomerName (SiteAreaName)"
    // Clear previous selection if "Select" is chosen
    if (!selectedValue) {
      setSelectedCustomerName("");
      setSelectedSiteAreaName("");
      setDisplayCustomerInfo(null);
      return;
    }

    // Split the selectedValue to get name and site_area_name
    // This assumes your option text format is consistent: "CustomerName (SiteAreaName)"
    let customerName = selectedValue;
    let siteAreaName = "";

    const match = selectedValue.match(/(.*)\s\((.*)\)/);
    if (match && match.length === 3) {
      customerName = match[1].trim();
      siteAreaName = match[2].trim();
    } else {
      // Handle cases where there's no site_area_name (e.g., "CustomerName")
      customerName = selectedValue.trim();
      siteAreaName = null; // Or empty string, depending on your preference for records without site_area_name
    }

    setSelectedCustomerName(customerName);
    setSelectedSiteAreaName(siteAreaName);

    // For displayCustomerInfo, we need to find the matching customer in the fetched list
    const customer = customers.find(
      (cust) =>
        cust.customer_name === customerName &&
        (cust.site_area_name === siteAreaName ||
          (!cust.site_area_name && !siteAreaName))
    );
    setDisplayCustomerInfo(customer);
  };

  const handleDelete = async (event) => {
    event.preventDefault(); // Prevents default form submission behavior

    // Clear any previous messages
    setError("");
    setSuccessMessage(null);

    if (!selectedCustomerName) {
      setError("Please select a customer to delete.");
      return;
    }

    try {
      // Send both customer_name and site_area_name in the request body for deletion
      const res = await axios.delete(
        `http://localhost:5000/api/delete-by-name-and-town`, // NEW ENDPOINT
        {
          data: {
            // Use 'data' property for DELETE requests to send a body
            customer_name: selectedCustomerName,
            site_area_name: selectedSiteAreaName,
          },
        }
      );
      // Backend should return a message indicating which record was deleted
      setSuccessMessage(res.data.message);

      // Update the customers list by filtering out the deleted ones
      setCustomers(
        customers.filter(
          (cust) =>
            !(
              cust.customer_name === selectedCustomerName &&
              (cust.site_area_name === selectedSiteAreaName ||
                (!cust.site_area_name && !selectedSiteAreaName))
            )
        )
      );
      setSelectedCustomerName(""); // Reset selection
      setSelectedSiteAreaName("");
      setDisplayCustomerInfo(null); // Clear displayed info
    } catch (err) {
      console.error("Error deleting record:", err);
      const errorMessage =
        err.response && err.response.data && err.response.data.error
          ? err.response.data.error
          : "Failed to delete record.";
      setError(errorMessage);
      setSuccessMessage(null);
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

  return (
    <>
      <Header />
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "91vh",
          background: "#f5f5f5",
        }}
      >
        <form
          onSubmit={handleDelete}
          style={{
            background: "#fff",
            padding: "2rem",
            borderRadius: 8,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            width: 750,
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            marginTop: "-2rem",
            marginBottom: "1.5rem",
          }}
        >
          <h2 style={{ textAlign: "center" }}>Delete record</h2>
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
            <label style={labelStyle}>
              Select Record by Customer Name and Town
            </label>
            <select
              style={inputStyle}
              name="record_to_delete"
              value={
                selectedCustomerName
                  ? `${selectedCustomerName}${
                      selectedSiteAreaName ? ` (${selectedSiteAreaName})` : ""
                    }`
                  : ""
              }
              onChange={handleSelectChange}
              required
            >
              <option value="">Select</option>
              {customers.map((cust, index) => (
                <option
                  key={`${cust.customer_name}-${
                    cust.site_area_name || ""
                  }-${index}`} // Use a composite key, or better, fetch ID
                  value={`${cust.customer_name}${
                    cust.site_area_name ? ` (${cust.site_area_name})` : ""
                  }`}
                >
                  {cust.customer_name}{" "}
                  {cust.site_area_name ? `(${cust.site_area_name})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Display selected customer info if needed */}
          {displayCustomerInfo && (
            <div
              style={{
                marginTop: "1rem",
                padding: "1rem",
                border: "1px dashed #ccc",
                borderRadius: "4px",
                backgroundColor: "#f9f9f9",
              }}
            >
              <p>
                <strong>Selected for Deletion:</strong>
              </p>
              <p>Customer: {displayCustomerInfo.customer_name}</p>
              <p>
                Town/Site Area: {displayCustomerInfo.site_area_name || "N/A"}
              </p>
              {/* Add other details you might want to display */}
            </div>
          )}

          <button
            disabled={!selectedCustomerName}
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
};

export default Delete;
