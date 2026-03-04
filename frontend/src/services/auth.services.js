import * as authMock from './auth.mock';
import { api } from './API'; // à décommenter quand le backend sera prêt

export async function login(email, password) {
  const data = await api.post("/api/auth/login", { email, password });
  // backend renvoie { token, message }
  if (data?.token) localStorage.setItem("token", data.token);
  return data;
}

export async function register(email, password) {
  const data = await api.post("/api/auth/register", { email, password });
  // backend renvoie { token, message }
  if (data?.token) localStorage.setItem("token", data.token);
  return data;
}

export async function logout() {
  try {
    await api.post("/api/auth/logout", null);
  } finally {
    localStorage.removeItem("token");
  }
}