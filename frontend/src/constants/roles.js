// Keycloak realm role -> start page, label and sidebar link.
export const HOME_PAGE = {
  USER: "/customer",
  REVIEWER: "/staff",
  MANAGER: "/staff",
};

export const ROLE_LABEL = {
  USER: "Customer",
  REVIEWER: "Credit officer · Fraud team",
  MANAGER: "Senior approver · Collections",
};

export const NAV_LINK = {
  USER: { icon: "💳", label: "My loans" },
  REVIEWER: { icon: "📋", label: "Work queue" },
  MANAGER: { icon: "📋", label: "Work queue" },
};
