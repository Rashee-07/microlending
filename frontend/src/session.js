// Who is logged in (saved by Login.js after a successful login).
export function currentUser() {
  return {
    username: localStorage.getItem("username"),
    role: localStorage.getItem("role"),
    name: localStorage.getItem("name") || localStorage.getItem("username"),
  };
}

export function saveUser(user) {
  localStorage.setItem("username", user.username);
  localStorage.setItem("role", user.role);
  localStorage.setItem("name", user.name || user.username);
}

export function clearUser() {
  localStorage.removeItem("username");
  localStorage.removeItem("role");
  localStorage.removeItem("name");
}
