import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";

const renderApp = (route = "/") =>
  render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>
  );

beforeEach(() => localStorage.clear());

test("shows the login screen when nobody is logged in", () => {
  renderApp();
  expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/e\.g\. priya/i)).toBeInTheDocument();
});

test("a logged-in customer sees the sidebar with their name", () => {
  localStorage.setItem("username", "priya");
  localStorage.setItem("role", "USER");
  localStorage.setItem("name", "Priya Sharma");
  renderApp("/demo");
  expect(screen.getByText("Priya Sharma")).toBeInTheDocument();
  expect(screen.getByText(/log out/i)).toBeInTheDocument();
});
