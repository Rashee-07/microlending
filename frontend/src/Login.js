import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, errorMessage } from "./api/client";
import { saveUser } from "./session";
import { HOME_PAGE } from "./constants/roles";

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

    api
      .login(name, password)
      .then((user) => {
        // Remember who is logged in and their role
        saveUser(user);
        props.status(false);
        navigate(HOME_PAGE[user.role] || "/");
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  };

  return (
    <div className="loginPage">
      {/* Left side: brand panel */}
      <div className="loginHero">
        <div className="sidebarBrand big">
          <span className="logo">$</span> MicroLending
        </div>
        <h1>Small loans, simple process.</h1>
        <p>Apply online and get a credit decision - in one place.</p>
        <ul>
          <li>📝 Apply online and verify your identity in minutes</li>
          <li>📊 Automated credit and affordability check</li>
          <li>✅ Approved in principle within minutes</li>
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
