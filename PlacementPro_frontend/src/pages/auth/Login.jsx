import { useState } from "react";
import { connexion, sauvegarderToken } from "../../api/auth";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");
    setChargement(true);
    try {
      const res = await connexion(form);
      sauvegarderToken(res.data.access, res.data.refresh, res.data.role, res.data.email);
      if (res.data.role === "admin") navigate("/admin/dashboard");
      else if (res.data.role === "recruteur") navigate("/recruteur/dashboard");
      else navigate("/candidat/dashboard");
    } catch (err) {
      setErreur(err.response?.data?.error || "Erreur de connexion.");
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-left">
        <div className="auth-left-inner">
          <div className="auth-logo">PlacementPro</div>
          <div className="auth-hero">
            <h1>La plateforme qui connecte les talents aux opportunités</h1>
            <p>Accédez aux meilleures offres d'emploi au Cameroun grâce à notre moteur de matching intelligent.</p>
            <ul className="auth-features">
              <li>Matching automatique par compétences</li>
              <li>Entreprises vérifiées par notre équipe</li>
              <li>Notifications email en temps réel</li>
            </ul>
          </div>
          <div className="auth-left-footer">© 2025 PlacementPro — Cameroun</div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-tabs">
            <Link to="/inscription" className="auth-tab">Inscription</Link>
            <span className="auth-tab active">Connexion</span>
          </div>

          <h2 className="auth-title">Bon retour</h2>
          <p className="auth-sub">Connectez-vous à votre espace PlacementPro</p>

          {erreur && <div className="alert alert-danger py-2 small">{erreur}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Adresse email</label>
              <input
                type="email"
                name="email"
                className="form-control"
                placeholder="exemple@email.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <div className="d-flex justify-content-between">
                <label className="form-label">Mot de passe</label>
                <a href="#" className="auth-link small">Mot de passe oublié ?</a>
              </div>
              <input
                type="password"
                name="password"
                className="form-control"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>
            <button type="submit" className="btn auth-btn-main w-100" disabled={chargement}>
              {chargement ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          <p className="auth-footer-note">
            Pas de compte ? <Link to="/inscription" className="auth-link">S'inscrire</Link>
          </p>
        </div>
      </div>
    </div>
  );
}