import axios from "axios";

// All calls to the MicroLending backend in one place.
export const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8898";

const http = axios.create({ baseURL: API_URL });
const body = (request) => request.then((response) => response.data);

/** Readable error text from a failed call. */
export const errorMessage = (err) =>
  (err && err.response && err.response.data && err.response.data.message) || "Cannot reach the server";

export const api = {
  login: (username, password) => body(http.post("/login", { username, password })),

  // applications
  register: (username, email, mobile) => body(http.post("/api/applications", { username, email, mobile })),
  applications: (username) => body(http.get("/api/applications", { params: { username } })),
  application: (id) => body(http.get(`/api/applications/${id}`)),

  // human tasks
  tasks: (username, role) => body(http.get("/api/tasks", { params: { username, role } })),
  completeTask: (jobKey, username, data) => body(http.post(`/api/tasks/${jobKey}/complete`, { username, data })),

  // customer messages
  notifications: (username) => body(http.get("/api/notifications", { params: { username } })),

  // demo panel
  quickStart: (useCase, username, data) => body(http.post("/api/demo/quick-start", { useCase, username, data })),
  resetDemo: () => body(http.post("/api/demo/reset")),
};
