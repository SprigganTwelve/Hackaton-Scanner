import { useState } from "react";
import { register } from "../services/auth.services";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

import "../App.css";
import "../pages/Register/Register.css";

export default function RegisterForm() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [github, setGithub] = useState("");
  const [message, setMessage] = useState("");

  const handleRegister = async (e) => {
	e.preventDefault();
	setMessage("");

	if (password !== confirmPassword) {
		setMessage("Les mots de passe ne correspondent pas !");
		return;
	}

	try {
		const result = await register({
      name,
      email,
      password,
      git_url: github,
      git_access_token: "",
		});

		console.log("REGISTER RESULT =", result);

		if (result?.user) {
		// petit message optionnel
		// setMessage(result.message || "Compte créé !");
		navigate("/login", { replace: true });
		return;
		}

		setMessage(result?.message || "Inscription impossible");
	} catch (err) {
		console.error(err);
		setMessage("Inscription impossible (erreur réseau/serveur)");
	}
	};
  return (
    <div className="register">
      <div className="register__card">
        <h1 className="register__title">SecureScan</h1>
        <p className="register__subtitle">
          Créer votre espace dès maintenant!!
        </p>

        <form className="form" onSubmit={handleRegister}>
          <label className="form__label">
            Nom
            <input
              type="text"
              placeholder="MarcRash120"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              required
            />
          </label>

          <label className="form__label">
            Email
            <input
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              required
            />
          </label>

          <label className="form__label">
            Mot de passe
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              required
            />
          </label>
          
          <label className="form__label">
            Confirmation mot de passe
            <input
              type="password"
              placeholder="Confirmation mot de passe"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input"
              required
            />
          </label>

          <label className="form__label">
            Github
            <input
              type="text"
              placeholder="https://github.com/SprigganTwelve"
              value={github}
              onChange={(e) => setGithub(e.target.value)}
              className="input"
            />
          </label>

          <button type="submit" className="cta">
            S'inscrire
          </button>
        </form>

        {message && <p className="register__footer">{message}</p>}

        <p className="register__footer">
          Vous avez déjà un espace ? <Link to="/login">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}