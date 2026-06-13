import { useAuth } from "../store/auth";
import type { Dashboard, Expense, Group, User } from "../types/api";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useAuth.getState().token;
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(detail.detail ?? "Request failed");
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  login: (email: string, password: string) => request<{ access_token: string; user: User }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  register: (name: string, email: string, password: string) => request<{ access_token: string; user: User }>("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) }),
  me: () => request<User>("/auth/me"),
  dashboard: () => request<Dashboard>("/reports/dashboard"),
  groups: (search = "") => request<Group[]>(`/groups${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  group: (id: string | number) => request<Group>(`/groups/${id}`),
  createGroup: (payload: Partial<Group>) => request<Group>("/groups", { method: "POST", body: JSON.stringify(payload) }),
  expenses: (groupId: string | number) => request<Expense[]>(`/expenses/groups/${groupId}`),
  uploadCsv: (groupId: string | number, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<{ session_id: string; anomalies: unknown[]; rows: number }>(`/import/groups/${groupId}/sessions`, { method: "POST", body: form });
  },
  approveImport: (sessionId: string, actions: unknown[]) => request(`/import/sessions/${sessionId}/approve`, { method: "POST", body: JSON.stringify({ actions }) }),
  balances: (groupId: string | number) => request(`/reports/groups/${groupId}/balances`),
};

