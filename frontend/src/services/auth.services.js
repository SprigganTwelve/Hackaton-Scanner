import * as authMock from './auth.mock';
import { api } from './API'; // à décommenter quand le backend sera prêt


export async function login(email, password) {
  try{
      const { success, token, message } = await api.post("/api/auth/login", { email, password });

    if (token) 
      localStorage.setItem("token", token);
    return { message, success, token };
  }
  catch(error)
  {
    console.warn('[login] didn\'t work as expected')
    return { success: false, message: 'Une erreur inattendue est survenue coté client' }
  }
}


export async function register({ name, email, password, git_url, git_access_token }) {
  const data = await api.post("/api/auth/register", {
    name,
    email,
    password,
    git_url,
    git_access_token,
  });

  // optionnel: si backend renvoie un token à l’inscription
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