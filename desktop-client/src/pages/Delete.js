import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import axios from "axios";

const Delete = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/customers`);
        setCustomers(res.data);
      } catch (err) {
        console.error("Error fetching customers:", err);
        setError("Failed to fetch customer list.");
      }
    };

    fetchCustomers();
  }, []);

  const handleDelete = async (event) => {
    event.preventDefault(); // Prevents default form submission behavior
    if (!selectedCustomer) return;
    try {
      await axios.delete(
        `http://localhost:5000/api/delete/${selectedCustomer}`
      );
      alert(`Customer '${selectedCustomer}' deleted successfully.`);
      setCustomers(
        customers.filter((cust) => cust.customer_name !== selectedCustomer)
      );
      setSelectedCustomer("");
    } catch (err) {
      console.error("Error deleting customer:", err);
      alert("Error deleting customer.");
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
            width: 630,
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

          <div style={rowStyle}>
            <label style={labelStyle}>Select Record by Customer Name</label>
            <select
              style={inputStyle}
              name="customer_name"
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
            >
              <option value="">Select</option>
              {customers.map((cust) => (
                <option key={cust.customer_name} value={cust.customer_name}>
                  {cust.customer_name}
                </option>
              ))}
            </select>
          </div>

          <button
            disabled={!selectedCustomer}
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
