import React from "react";
import Header from "../components/Header";

function Home() {
  return (
    <>
      <Header />
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "91vh",
          background: "#f5f5f5",
        }}
      >
        <h1 style={{ fontSize: "2.5rem", color: "#1976d2" }}>
          WELCOME, ADMIN.
        </h1>
      </div>
    </>
  );
}

export default Home;
