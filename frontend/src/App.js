import React, { useState } from "react";
import { Routes, Route, Navigate, NavLink, useNavigate } from "react-router-dom";
import "./App.css";

import Login from "./Login";
import User from "./Pages/User";
import Reviewer from "./Pages/Reviewer";
import Manager from "./Pages/Manager";
import Submission from "./Pages/Submission";

// Page for each role
const HOME_PAGE = {
  USER: "/Pages/User",
  REVIEWER: "/Pages/Reviewer",
  MANAGER: "/Pages/Manager",
};

// How each role is shown on screen
const ROLE_LABEL = {
  USER: "Applicant",
  REVIEWER: "Reviewer",
  MANAGER: "Approver",
};

// Sidebar link for each role
const NAV_LINK = {
  USER: { icon: "📝", label: "My Loans" },
  REVIEWER: { icon: "🔍", label: "Review Queue" },
  MANAGER: { icon: "✅", label: "Approvals" },
};

function App() {
  // Stay logged in after a browser refresh (Login.js saves username and role)
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("username") !== null && localStorage.getItem("role") !== null
  );
  const navigate = useNavigate();

  // Light / dark theme (the choice is remembered in the browser)
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const themeButton = (
    <button className="themeToggle" onClick={toggleTheme}>
      {theme === "light" ? "🌙 Dark mode" : "☀️ Light mode"}
    </button>
  );

  // Login.js calls this with false after a successful login
  const statusChange = (showLogin) => {
    setIsLoggedIn(!showLogin);
  };

  const logOut = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    setIsLoggedIn(false);
    navigate("/");
  };

  // ---------- Not logged in: login screen ----------
  if (!isLoggedIn) {
    return (
      <div className="app" data-theme={theme}>
        <div className="floatingTheme">{themeButton}</div>
        <Login status={statusChange} />
      </div>
    );
  }

  // ---------- Logged in: sidebar + page ----------
  const username = localStorage.getItem("username");
  const role = localStorage.getItem("role");
  const fullName = localStorage.getItem("name") || username;
  const home = HOME_PAGE[role] || "/";

  // Initials for the avatar, e.g. "Priya Sharma" -> "PS"
  const initials = fullName
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .substring(0, 2)
    .toUpperCase();

  // Only show a page to the role it belongs to; others go to their own page
  const onlyFor = (pageRole, page) => (role === pageRole ? page : <Navigate to={home} />);

  return (
    <div className="app layout" data-theme={theme}>
      <aside className="sidebar">
        <div className="sidebarBrand">
          <span className="logo">₹</span> MicroLending
        </div>

        <nav className="sidebarNav">
          {NAV_LINK[role] && (
            <NavLink to={home} className="navItem">
              <span>{NAV_LINK[role].icon}</span> {NAV_LINK[role].label}
            </NavLink>
          )}
        </nav>

        <div className="sidebarBottom">
          <div className="userChip">
            <div className="avatar small">{initials}</div>
            <div>
              <div className="userChipName">{fullName}</div>
              <div className="userChipRole">{ROLE_LABEL[role] || role}</div>
            </div>
          </div>
          {themeButton}
          <button className="logOut" onClick={logOut}>
            ⎋ Log out
          </button>
        </div>
      </aside>

      <div className="main">
        <main className="mainInner">
          <Routes>
            <Route path="/" element={<Navigate to={home} />} />
            <Route path="Pages/User" element={onlyFor("USER", <User />)} />
            <Route path="Pages/Submission" element={onlyFor("USER", <Submission />)} />
            <Route path="Pages/Reviewer" element={onlyFor("REVIEWER", <Reviewer />)} />
            <Route path="Pages/Manager" element={onlyFor("MANAGER", <Manager />)} />
            <Route path="*" element={<Navigate to={home} />} />
          </Routes>
        </main>
        <footer className="footer">© 2026 MicroLending · Loan Management</footer>
      </div>
    </div>
  );
}

export default App;
