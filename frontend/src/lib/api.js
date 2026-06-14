import { useAuth } from "../store/auth";
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";
async function request(path, options = {}) {
    const token = useAuth.getState().token;
    const headers = new Headers(options.headers);
    if (!(options.body instanceof FormData))
        headers.set("Content-Type", "application/json");
    if (token)
        headers.set("Authorization", `Bearer ${token}`);
    const res = await fetch(`${API_URL}${path}`, { ...options, headers });
    if (!res.ok) {
        const detail = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(detail.detail ?? "Request failed");
    }
    if (res.status === 204)
        return undefined;
    return res.json();
}
export const api = {
    login: (email, password) => request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
    register: (name, email, password) => request("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) }),
    forgotPassword: (email) => request("/auth/password/forgot", { method: "POST", body: JSON.stringify({ email }) }),
    resetPassword: (token, password) => request("/auth/password/reset", { method: "POST", body: JSON.stringify({ token, password }) }),
    googleLogin: (credential) => request("/auth/google", { method: "POST", body: JSON.stringify({ credential }) }),
    me: () => request("/auth/me"),
    dashboard: () => request("/reports/dashboard"),
    groups: (search = "") => request(`/groups${search ? `?search=${encodeURIComponent(search)}` : ""}`),
    group: (id) => request(`/groups/${id}`),
    createGroup: (payload) => request("/groups", { method: "POST", body: JSON.stringify(payload) }),
    addMember: (groupId, payload) => request(`/groups/${groupId}/members`, { method: "POST", body: JSON.stringify(payload) }),
    removeMember: (groupId, userId) => request(`/groups/${groupId}/members/${userId}`, { method: "DELETE" }),
    expenses: (groupId) => request(`/expenses/groups/${groupId}`),
    createExpense: (groupId, payload) => request(`/expenses/groups/${groupId}`, { method: "POST", body: JSON.stringify(payload) }),
    settlements: (groupId) => request(`/settlements/groups/${groupId}`),
    createSettlement: (groupId, payload) => request(`/settlements/groups/${groupId}`, { method: "POST", body: JSON.stringify(payload) }),
    saveBudget: (groupId, payload) => request(`/groups/${groupId}/budgets`, { method: "POST", body: JSON.stringify(payload) }),
    audit: () => request("/reports/audit"),
    uploadCsv: (groupId, file) => {
        const form = new FormData();
        form.append("file", file);
        return request(`/import/groups/${groupId}/sessions`, { method: "POST", body: form });
    },
    approveImport: (sessionId, actions) => request(`/import/sessions/${sessionId}/approve`, { method: "POST", body: JSON.stringify({ actions }) }),
    balances: (groupId) => request(`/reports/groups/${groupId}/balances`),
};
