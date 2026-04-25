import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const API = "http://127.0.0.1:8000/api/auth";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  // Récupérer la redirection passée en state (depuis OffreDetail)
  const redirectTo = location.state?.redirect || null;
  const annonceId = location.state?.annonce_id || null;
  const messageInfo = location.state?.message || null;

  const [form, setForm] = useState({ email: "", password: "" });
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur("");
    setChargement(true);
    try {
      const res = await axios.post(`${API}/connexion/`, form);
      const { access, refresh, role, email } = res.data;

      // Stocker le token et les infos
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
      localStorage.setItem("role", role);
      localStorage.setItem("email", email);

      // Redirection selon le rôle et la provenance
      if (role === "candidat") {
        if (annonceId) {
          // Venir de "Postuler" : aller compléter le profil pour cette offre
          navigate("/candidat/postuler/" + annonceId);
        } else if (redirectTo) {
          navigate(redirectTo);
        } else {
          navigate("/candidat/dashboard");
        }
      } else if (role === "recruteur") {
        navigate("/recruiter/dashboard");
      } else if (role === "admin") {
        navigate("/admin/dashboard");
      }
    } catch (err) {
      const d = err.response?.data;
      setErreur(d?.error || "Identifiants incorrects.");
    } finally {
      setChargement(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #0a0f28 0%, #1565C0 100%)",
      fontFamily: "'Segoe UI', system-ui, sans-serif", padding: "24px"
    }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <Link to="/" style={{ textDecoration: "none" }}>
            <span style={{ color: "white", fontSize: "28px", fontWeight: "800", letterSpacing: "-1px" }}>
              Placement<span style={{ color: "#64B5F6" }}>Pro</span>
            </span>
          </Link>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "14px", marginTop: "8px" }}>
            {annonceId ? "Connectez-vous pour postuler à cette offre" : "Bienvenue, connectez-vous à votre espace"}
          </p>
        </div>

        <div style={{
          background: "white", borderRadius: "20px", padding: "36px 32px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.25)"
        }}>
          <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#0a0f28", margin: "0 0 24px", letterSpacing: "-0.5px" }}>
            Connexion
          </h2>

          {/* Message info (ex: "connectez-vous pour postuler") */}
          {messageInfo && (
            <div style={{ background: "#e8efff", border: "1px solid #90CAF9", borderRadius: "10px", padding: "12px 16px", marginBottom: "20px", fontSize: "13px", color: "#1565C0" }}>
              {messageInfo}
            </div>
          )}

          {erreur && (
            <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "10px", padding: "12px 16px", marginBottom: "20px", fontSize: "13px", color: "#dc2626" }}>
              {erreur}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>
                Adresse email
              </label>
              <input
                type="email" name="email" value={form.email} onChange={handle} required
                placeholder="votre@email.com"
                style={{
                  width: "100%", padding: "12px 16px", border: "1.5px solid #e5e7eb",
                  borderRadius: "10px", fontSize: "14px", color: "#0a0f28",
                  outline: "none", boxSizing: "border-box", fontFamily: "inherit"
                }}
                onFocus={e => e.target.style.borderColor = "#1565C0"}
                onBlur={e => e.target.style.borderColor = "#e5e7eb"}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>
                Mot de passe
              </label>
              <input
                type="password" name="password" value={form.password} onChange={handle} required
                placeholder="••••••••"
                style={{
                  width: "100%", padding: "12px 16px", border: "1.5px solid #e5e7eb",
                  borderRadius: "10px", fontSize: "14px", color: "#0a0f28",
                  outline: "none", boxSizing: "border-box", fontFamily: "inherit"
                }}
                onFocus={e => e.target.style.borderColor = "#1565C0"}
                onBlur={e => e.target.style.borderColor = "#e5e7eb"}
              />
            </div>

            <button
              type="submit" disabled={chargement}
              style={{
                width: "100%", background: chargement ? "#93c5fd" : "#1565C0",
                color: "white", border: "none", padding: "14px",
                borderRadius: "10px", fontSize: "15px", fontWeight: "700",
                cursor: chargement ? "not-allowed" : "pointer",
                transition: "background 0.2s", fontFamily: "inherit"
              }}
            >
              {chargement ? "Connexion en cours…" : "Se connecter"}
            </button>
          </form>

          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <span style={{ fontSize: "14px", color: "#64748b" }}>Pas encore de compte ? </span>
            <Link
              to="/inscription"
              state={{ annonce_id: annonceId, redirect: redirectTo }}
              style={{ fontSize: "14px", color: "#1565C0", fontWeight: "600", textDecoration: "none" }}
            >
              Créer un compte
            </Link>
          </div>

          <div style={{ marginTop: "16px", textAlign: "center" }}>
            <Link to="/" style={{ fontSize: "13px", color: "#94a3b8", textDecoration: "none" }}>
              ← Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}