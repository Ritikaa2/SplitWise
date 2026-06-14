import { useAuth } from "../store/auth";
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

async function request(path, options = {}) {
    const token = useAuth.getState().token;
    const headers = new Headers(options.headers);
    if (!(options.body instanceof FormData))
        headers.set("Content-Type", "application/json");
    if (token)
        headers.set("Authorization", `Bearer ${token}`);
    let res;
    try {
        res = await fetch(`${API_URL}${path}`, { ...options, headers });
    } catch (err) {
        throw new Error(`Cannot reach server at ${API_URL}`);
    }
    if (!res.ok) {
        const data = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(data.error || "Something went wrong");
    }
    if (res.status === 204) return undefined;
    return res.json();
}

export const api = {
    // Auth
    login: (email, password) => request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
    register: (name, email, password) => request("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) }),
    me: async () => {
        const data = await request("/auth/me");
        return data.user;
    },
    logout: () => request("/auth/logout", { method: "POST" }),
    forgotPassword: (email) => request("/auth/password/forgot", { method: "POST", body: JSON.stringify({ email }) }),
    resetPassword: (otp, password, email) => request("/auth/password/reset", { method: "POST", body: JSON.stringify({ otp, password, email }) }),
    
    // Groups
    groups: (search = "") => request(`/groups${search ? `?search=${search}` : ""}`),
    group: (id) => request(`/groups/${id}`),
    createGroup: (payload) => request("/groups", { method: "POST", body: JSON.stringify(payload) }),
    updateGroup: (id, payload) => request(`/groups/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
    deleteGroup: (id) => request(`/groups/${id}`, { method: "DELETE" }),
    addMember: (groupId, payload) => request(`/groups/${groupId}/members`, { method: "POST", body: JSON.stringify(payload) }),
    removeMember: (groupId, userId) => request(`/groups/${groupId}/members/${userId}`, { method: "DELETE" }),
    
    // Expenses
    expenses: (groupId) => request(`/expenses/groups/${groupId}`),
    createExpense: (groupId, payload) => request(`/expenses/groups/${groupId}`, { method: "POST", body: JSON.stringify(payload) }),
    updateExpense: (id, payload) => request(`/expenses/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
    deleteExpense: (id) => request(`/expenses/${id}`, { method: "DELETE" }),
    balances: (groupId) => request(`/expenses/groups/${groupId}/balances`),
    
    // Settlements
    settlements: (groupId) => request(`/settlements/groups/${groupId}`),
    createSettlement: (groupId, payload) => request(`/settlements/groups/${groupId}`, { method: "POST", body: JSON.stringify(payload) }),
    
    // Import
    uploadCsv: (groupId, file) => {
        const form = new FormData();
        form.append("file", file);
        return request(`/import/groups/${groupId}/sessions`, { method: "POST", body: form });
    },
    approveImport: (sessionId, actions) => request(`/import/sessions/${sessionId}/approve`, { method: "POST", body: JSON.stringify({ actions }) }),
    
    // Reports
    dashboard: () => request("/reports/dashboard"),
};
