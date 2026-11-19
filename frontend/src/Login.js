import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Page for each role
const HOME_PAGE = {
  USER: "/Pages/User",
  REVIEWER: "/Pages/Reviewer",
  MANAGER: "/Pages/Manager",
};

function Login(props) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // The backend checks the username/password with Keycloak and returns the user's role
  const login = (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    axios
      .post("http://localhost:8898/login", { username: name, password: password })
      .then((response) => {
        // Remember who is logged in and their role
        localStorage.setItem("username", response.data.username);
        localStorage.setItem("role", response.data.role);
        localStorage.setItem("name", response.data.name || response.data.username);
        props.status(false);
        navigate(HOME_PAGE[response.data.role] || "/");
      })
      .catch((err) => {
        if (err.response && err.response.data && err.response.data.message) {
          setError(err.response.data.message);
        } else {
          setError("Cannot reach the server");
        }
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="loginPage">
      {/* Left side: brand panel */}
      <div className="loginHero">
        <div className="sidebarBrand big">
          <span className="logo">₹</span> MicroLending
        </div>
        <h1>Small loans, simple process.</h1>
        <p>Apply, review and approve loans in one place.</p>
        <ul>
          <li>📝 Applicants apply for a loan in minutes</li>
          <li>🔍 Reviewers check every application</li>
          <li>✅ Approvers approve or reject</li>
        </ul>
      </div>

      {/* Right side: sign-in form */}
      <div className="loginFormSide">
        <form onSubmit={login} className="loginForm">
          <h2>Welcome back 👋</h2>
          <p className="muted">Sign in to continue</p>

          <div className="field">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              placeholder="e.g. priya"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="pass">Password</label>
            <input
              type="password"
              id="pass"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="errorBox">{error}</div>}

          <button type="submit" className="btnPrimary full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
