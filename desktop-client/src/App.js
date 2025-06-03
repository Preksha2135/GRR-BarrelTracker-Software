import { HashRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import New from "./pages/New";
import Home from "./pages/Home";
import Update from "./pages/Update";
import Report from "./pages/Report";
import Delete from "./pages/Delete";
import "./App.css";

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/new" element={<New />} />
        <Route path="/home" element={<Home />} />
        <Route path="/update" element={<Update />} />
        <Route path="/delete" element={<Delete />} />
        <Route path="/report" element={<Report />} />
        {/* Add more routes here as needed */}
      </Routes>
    </HashRouter>
  );
}

export default App;
