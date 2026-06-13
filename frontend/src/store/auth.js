import { create } from "zustand";
const token = localStorage.getItem("splitwise_token") ?? sessionStorage.getItem("splitwise_token");
export const useAuth = create((set) => ({
    token,
    user: null,
    remember: Boolean(localStorage.getItem("splitwise_token")),
    setSession: (nextToken, user, remember = true) => {
        const storage = remember ? localStorage : sessionStorage;
        localStorage.removeItem("splitwise_token");
        sessionStorage.removeItem("splitwise_token");
        storage.setItem("splitwise_token", nextToken);
        set({ token: nextToken, user, remember });
    },
    logout: () => {
        localStorage.removeItem("splitwise_token");
        sessionStorage.removeItem("splitwise_token");
        set({ token: null, user: null });
    },
}));
