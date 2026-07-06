import axios from "axios";

import { AUTH_TOKEN_KEY, redirectToLogin } from "../utils/authRedirect.js";

const TOKEN_KEY = AUTH_TOKEN_KEY;

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes("/auth/login");
    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem(TOKEN_KEY);
      if (!window.location.pathname.startsWith("/login")) {
        redirectToLogin(`${window.location.pathname}${window.location.search}`);
      }
    }
    return Promise.reject(error);
  }
);

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function loginUser(email, password) {
  const response = await api.post("/auth/login", { email, password });
  return response.data;
}

export async function logoutUser() {
  const response = await api.post("/auth/logout");
  return response.data;
}

export async function fetchCurrentUser() {
  const response = await api.get("/auth/me");
  return response.data.user;
}

export async function registerUser(payload) {
  const response = await api.post("/auth/register", payload);
  return response.data.user;
}

export async function fetchUsers() {
  const response = await api.get("/users");
  return response.data.users;
}

export default api;
