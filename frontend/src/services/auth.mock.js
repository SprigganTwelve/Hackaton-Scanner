const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let fakeUsers = [
  { email: "test@test.com", password: "1234", name: "Test User" },
];

export async function login(email, password) {
  await sleep(400);

  const user = fakeUsers.find(u => u.email === email && u.password === password);

  if(user){
    return { success: true, token: "fake-jwt-token", user };
  } else {
    return { success: false, message: "Email ou mot de passe invalide" };
  }
}

export async function register({ name, email, password }) {
  await sleep(500);

  const exists = fakeUsers.some(u => u.email === email);
  if(exists){
    return { success: false, message: "Email déjà utilisé" };
  }

  const newUser = { name, email, password };
  fakeUsers.push(newUser);

  return { success: true, message: "Compte créé avec succès !", user: newUser };
}