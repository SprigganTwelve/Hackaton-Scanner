import { useState } from "react";
import { register } from "../services/auth.services";
import { useNavigate } from "react-router-dom";

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

    if (password !== confirmPassword) {
      setMessage("Les mots de passe ne correspondent pas !");
      return;
    }

    const res = await register({ name, email, password, github });

    if (res.success) {
      setMessage("Compte créé avec succès !");
      setTimeout(() => {
      navigate("/new-scan");
      }, 1000);
    } else {
      setMessage(res.message);
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
          Vous avez déjà un espace ? <a href="/login">Se connecter</a>
        </p>
      </div>
    </div>
  );
}