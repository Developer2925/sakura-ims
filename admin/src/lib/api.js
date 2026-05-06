const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

function getToken() {
  return localStorage.getItem("admin_token");
}

async function request(method, path, body) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  login: (username, password) =>
    request("POST", "/auth/login", { username, password }),

  getClinics: () => request("GET", "/admin/clinics"),
  getClinicInventory: (id) => request("GET", `/admin/clinics/${id}/inventory`),
  updateInventoryItem: (clinicId, itemId, quantity) =>
    request("PUT", `/admin/clinics/${clinicId}/inventory/${itemId}`, {
      quantity,
    }),

  updateClinic: (id, data) => request("PUT", `/admin/clinics/${id}`, data),
  deleteClinicData: (id) => request("DELETE", `/admin/clinics/${id}/data`),
  sendCredentials: (id, password) =>
    request("POST", `/admin/clinics/${id}/send-credentials`, { password }),

  getRestockRequests: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request("GET", `/admin/restock/requests${qs ? "?" + qs : ""}`);
  },
  approveRequest: (requestId, adminNote) =>
    request("POST", "/admin/restock/approve", { requestId, adminNote }),
  rejectRequest: (requestId, adminNote) =>
    request("POST", "/admin/restock/reject", { requestId, adminNote }),
  deliverRequest: (requestId) =>
    request("POST", "/admin/restock/deliver", { requestId }),

  getAnalytics: (month, clinicId, overall = false) => {
    const params = overall
      ? { overall: "true", ...(clinicId ? { clinicId } : {}) }
      : { month, ...(clinicId ? { clinicId } : {}) };
    return request(
      "GET",
      `/admin/analytics/monthly?${new URLSearchParams(params)}`,
    );
  },
};
