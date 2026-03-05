import { useState } from "react";
import { login } from "../services/auth.services";
import "../App.css"; 
import "../pages/Login/login.css";
import { useNavigate } from "react-router-dom";

export default function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await login(email, password);

      const ok = result?.success === true || !!result?.token;
      
      if (ok) 
        navigate("/new-project");
      else alert(result?.message || "Email ou mot de passe invalide");

    }
    catch (err) {
      console.error("Login failed:", err);
      alert("Email ou mot de passe invalide");
    }
  };

  return (
    <div className="login">
      <div className="login__card">
        <h1 className="login__title">SecureScan</h1>
        <p className="login__subtitle">
          Connexion à votre espace
        </p>

        <form className="form" onSubmit={handleSubmit}>
          <label className="form__label">
            Email
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="input"
              required
            />
          </label>

          <label className="form__label">
            Mot de passe
            <input
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              className="input"
              required
            />
          </label>

          <button type="submit" className="cta">
            Se connecter
          </button>
        </form>

        <p className="login__footer">
          Pas de compte ? <a href="/register">S'inscrire</a>
        </p>
      </div>
    </div>
  );
}