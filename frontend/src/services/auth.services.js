import * as authMock from './auth.mock';
// import { api } from './API'; // à décommenter quand le backend sera prêt

export const login = async ({ email, password }) => {
  return authMock.login(email, password);

  // Quand le backend sera dispo :
  // return api.post('/api/users/login', { email, password });
};

export const register = async (user) => {
  return authMock.register(user);

  // Quand le backend sera dispo :
  // return api.post('/api/users/register', user);
};