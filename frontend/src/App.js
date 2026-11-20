import React, { useState } from "react";
import { Routes, Route, Navigate, NavLink, useNavigate } from "react-router-dom";
import "./App.css";

import Login from "./Login";
import MyLoans from "./Pages/customer/MyLoans";
import ApplicationPage from "./Pages/customer/ApplicationPage";
import WorkQueue from "./Pages/staff/WorkQueue";
import DemoPanel from "./Pages/demo/DemoPanel";
import { HOME_PAGE, ROLE_LABEL, NAV_LINK } from "./constants/roles";
import { currentUser, clearUser } from "./session";

function App() {
  // Stay logged in after a browser refresh (Login.js saves username and role)
  const [isLoggedIn, setIsLoggedIn] = useState(currentUser().username !== null && currentUser().role !== null);
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
    clearUser();
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
  const { role, name } = currentUser();
  const home = HOME_PAGE[role] || "/";

  // Initials for the avatar, e.g. "Priya Sharma" -> "PS"
  const initials = name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .substring(0, 2)
    .toUpperCase();

  // Only show a page to the role it belongs to; others go to their own page
  const onlyFor = (pageRoles, page) => (pageRoles.includes(role) ? page : <Navigate to={home} />);

  return (
    <div className="app layout" data-theme={theme}>
      <aside className="sidebar">
        <div className="sidebarBrand">
          <span className="logo">$</span> MicroLending
        </div>

        <nav className="sidebarNav">
          {NAV_LINK[role] && (
            <NavLink to={home} className="navItem">
              <span>{NAV_LINK[role].icon}</span> {NAV_LINK[role].label}
            </NavLink>
          )}
          {/* presenter tools, available to every login */}
          <NavLink to="/demo" className="navItem">
            <span>🎬</span> Demo panel
          </NavLink>
        </nav>

        <div className="sidebarBottom">
          <div className="userChip">
            <div className="avatar small">{initials}</div>
            <div>
              <div className="userChipName">{name}</div>
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
            <Route path="customer" element={onlyFor(["USER"], <MyLoans />)} />
            <Route path="customer/applications/:id" element={onlyFor(["USER"], <ApplicationPage />)} />
            <Route path="staff" element={onlyFor(["REVIEWER", "MANAGER"], <WorkQueue />)} />
            <Route path="demo" element={<DemoPanel />} />
            <Route path="*"element={<Navigate to={home} />} />
          </Routes>
        </main>
        <footer className="footer">© 2026 MicroLending · Loan Management</footer>
      </div>
    </div>
  );
}

export default App;
