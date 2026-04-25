import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { inscriptionRecruteur } from "../../api/auth";
import { User, Building2 } from "lucide-react";

const API = "http://127.0.0.1:8000/api/auth";

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();

  const annonceId = location.state?.annonce_id || null;
  const redirectTo = location.state?.redirect || null;

  const [mode, setMode] = useState("candidat"); // "candidat" | "recruteur"
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "" });
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");
  const [chargement, setChargement] = useState(false);

  // ── Formulaire recruteur (version originale) ──
  const [formRecruteur, setFormRecruteur] = useState({
    email: "", password: "",
    nom_entreprise: "", secteur_activite: "", localisation: "", ville: "",
    adresse: "", telephone: "", description: "",
    taille_entreprise: "Petite (1-50)",
    registre_commerce: null,
    certificat_immatriculation: null,
    patente: null,
    logo: null,
  });

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleRecruteur = (e) => {
    if (e.target.type === "file") {
      setFormRecruteur({ ...formRecruteur, [e.target.name]: e.target.files[0] });
    } else {
      setFormRecruteur({ ...formRecruteur, [e.target.name]: e.target.value });
    }
  };

  // ── Soumission candidat ──
  const handleSubmitCandidat = async (e) => {
    e.preventDefault();
    setErreur("");
    setSucces("");

    if (form.password !== form.confirmPassword) {
      setErreur("Les mots de passe ne correspondent pas.");
      return;
    }
    if (form.password.length < 8) {
      setErreur("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    setChargement(true);
    try {
      await axios.post(`${API}/inscription/candidat/`, {
        email: form.email,
        password: form.password,
      });
      // Connexion automatique après inscription
      const res = await axios.post(`${API}/connexion/`, {
        email: form.email,
        password: form.password,
      });
      const { access, refresh, role, email } = res.data;
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
      localStorage.setItem("role", role);
      localStorage.setItem("email", email);

      if (annonceId) {
        navigate("/candidat/postuler/" + annonceId);
      } else {
        navigate("/candidat/dashboard");
      }
    } catch (err) {
      const d = err.response?.data;
      if (d?.error) setErreur(d.error);
      else if (d?.email) setErreur("Email : " + d.email.join(" "));
      else if (d?.password) setErreur("Mot de passe : " + d.password.join(" "));
      else setErreur("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setChargement(false);
    }
  };

  // ── Soumission recruteur (version originale) ──
  const submitRecruteur = async (e) => {
    e.preventDefault();
    setErreur("");
    setSucces("");
    setChargement(true);
    try {
      const data = new FormData();
      Object.entries(formRecruteur).forEach(([k, v]) => { if (v) data.append(k, v); });
      await inscriptionRecruteur(data);
      setSucces("Votre demande a été soumise. Vous recevrez un email après validation.");
    } catch (err) {
      const d = err.response?.data;
      setErreur(d ? Object.values(d).flat().join(" | ") : "Erreur lors de la soumission. Vérifiez tous les champs.");
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
      <div style={{ width: "100%", maxWidth: mode === "recruteur" ? "700px" : "440px" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <Link to="/" style={{ textDecoration: "none" }}>
            <span style={{ color: "white", fontSize: "28px", fontWeight: "800", letterSpacing: "-1px" }}>
              Placement<span style={{ color: "#64B5F6" }}>Pro</span>
            </span>
          </Link>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "14px", marginTop: "8px" }}>
            {annonceId ? "Créez votre compte pour postuler" : "Rejoignez la plateforme #1 au Cameroun"}
          </p>
        </div>

        <div style={{
          background: "white", borderRadius: "20px", padding: "36px 32px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.25)"
        }}>
          <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#0a0f28", margin: "0 0 20px", letterSpacing: "-0.5px" }}>
            Créer un compte
          </h2>

          {/* Toggle Candidat / Recruteur */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
            {[
              { key: "candidat", label: "👤 Candidat", hint: "Je cherche un emploi" },
              { key: "recruteur", label: "🏢 Recruteur", hint: "Je recrute des talents" },
            ].map(m => (
              <div key={m.key} onClick={() => { setMode(m.key); setErreur(""); setSucces(""); }}
                style={{
                  flex: 1, padding: "14px", borderRadius: "12px", cursor: "pointer",
                  border: mode === m.key ? "2px solid #1565C0" : "2px solid #e5e7eb",
                  background: mode === m.key ? "#f0f4ff" : "white",
                  textAlign: "center", transition: "all 0.2s"
                }}>
                <div style={{ fontSize: "22px", marginBottom: "4px" }}>{m.key === "candidat" ? "👤" : "🏢"}</div>
                <div style={{ fontWeight: "700", fontSize: "14px", color: mode === m.key ? "#1565C0" : "#374151" }}>{m.key === "candidat" ? "Candidat" : "Recruteur"}</div>
                <div style={{ fontSize: "12px", color: "#94a3b8" }}>{m.hint}</div>
              </div>
            ))}
          </div>

          {/* Messages */}
          {erreur && (
            <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "10px", padding: "12px 16px", marginBottom: "20px", fontSize: "13px", color: "#dc2626" }}>
              {erreur}
            </div>
          )}
          {succes && (
            <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "10px", padding: "12px 16px", marginBottom: "20px", fontSize: "13px", color: "#16a34a" }}>
              ✓ {succes}
            </div>
          )}

          {/* ══════════ FORMULAIRE CANDIDAT ══════════ */}
          {mode === "candidat" && (
            <form onSubmit={handleSubmitCandidat}>
              {[
                { label: "Adresse email", name: "email", type: "email", placeholder: "votre@email.com" },
                { label: "Mot de passe", name: "password", type: "password", placeholder: "Minimum 8 caractères" },
                { label: "Confirmer le mot de passe", name: "confirmPassword", type: "password", placeholder: "••••••••" },
              ].map(field => (
                <div key={field.name} style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>
                    {field.label}
                  </label>
                  <input
                    type={field.type} name={field.name}
                    value={form[field.name]} onChange={handle} required
                    placeholder={field.placeholder}
                    style={{
                      width: "100%", padding: "12px 16px", border: "1.5px solid #e5e7eb",
                      borderRadius: "10px", fontSize: "14px", color: "#0a0f28",
                      outline: "none", boxSizing: "border-box", fontFamily: "inherit"
                    }}
                    onFocus={e => e.target.style.borderColor = "#1565C0"}
                    onBlur={e => e.target.style.borderColor = "#e5e7eb"}
                  />
                </div>
              ))}

              <div style={{ background: "#f0f4ff", borderRadius: "10px", padding: "12px 16px", marginBottom: "20px", fontSize: "13px", color: "#1565C0" }}>
                Après création, vous compléterez votre profil pour postuler aux offres.
              </div>

              <button type="submit" disabled={chargement}
                style={{
                  width: "100%", background: chargement ? "#93c5fd" : "#1565C0",
                  color: "white", border: "none", padding: "14px",
                  borderRadius: "10px", fontSize: "15px", fontWeight: "700",
                  cursor: chargement ? "not-allowed" : "pointer",
                  transition: "background 0.2s", fontFamily: "inherit"
                }}
              >
                {chargement ? "Création en cours…" : "Créer mon compte candidat"}
              </button>
            </form>
          )}

          {/* ══════════ FORMULAIRE RECRUTEUR (VERSION ORIGINALE) ══════════ */}
          {mode === "recruteur" && !succes && (
            <form onSubmit={submitRecruteur}>
              <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "10px", padding: "12px 16px", marginBottom: "20px", fontSize: "13px", color: "#92400e" }}>
                Votre compte sera activé après vérification de vos documents (24–48h). Un email vous sera envoyé.
              </div>

              {/* Compte */}
              <p style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 12px" }}>Compte</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                {[
                  { label: "Email", name: "email", type: "email", placeholder: "rh@entreprise.cm" },
                  { label: "Mot de passe", name: "password", type: "password", placeholder: "••••••••" },
                ].map(f => (
                  <div key={f.name}>
                    <label style={labelStyle}>{f.label} <span style={{ color: "#dc2626" }}>*</span></label>
                    <input type={f.type} name={f.name} value={formRecruteur[f.name]} onChange={handleRecruteur}
                      placeholder={f.placeholder} required style={inputStyle}
                      onFocus={e => e.target.style.borderColor = "#1565C0"}
                      onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                  </div>
                ))}
              </div>

              {/* Infos entreprise */}
              <p style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 12px" }}>Informations entreprise</p>

              <div style={{ marginBottom: "12px" }}>
                <label style={labelStyle}>Nom de l'entreprise <span style={{ color: "#dc2626" }}>*</span></label>
                <input name="nom_entreprise" value={formRecruteur.nom_entreprise} onChange={handleRecruteur}
                  placeholder="Orange Cameroun SA" required style={inputStyle}
                  onFocus={e => e.target.style.borderColor = "#1565C0"}
                  onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                {[
                  { label: "Secteur d'activité", name: "secteur_activite", placeholder: "Télécommunications" },
                  { label: "Localisation", name: "localisation", placeholder: "Douala, Cameroun" },
                  { label: "Ville", name: "ville", placeholder: "Douala" },
                  { label: "Téléphone", name: "telephone", placeholder: "+237 6XX XXX XXX" },
                ].map(f => (
                  <div key={f.name}>
                    <label style={labelStyle}>{f.label} <span style={{ color: "#dc2626" }}>*</span></label>
                    <input name={f.name} value={formRecruteur[f.name]} onChange={handleRecruteur}
                      placeholder={f.placeholder} required style={inputStyle}
                      onFocus={e => e.target.style.borderColor = "#1565C0"}
                      onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <label style={labelStyle}>Taille entreprise <span style={{ color: "#dc2626" }}>*</span></label>
                  <select name="taille_entreprise" value={formRecruteur.taille_entreprise} onChange={handleRecruteur}
                    style={{ ...inputStyle, cursor: "pointer" }}>
                    <option>Petite (1-50)</option>
                    <option>Moyenne (51-200)</option>
                    <option>Grande (200+)</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Adresse <span style={{ color: "#dc2626" }}>*</span></label>
                  <input name="adresse" value={formRecruteur.adresse} onChange={handleRecruteur}
                    placeholder="Rue de la Joie, Akwa" required style={inputStyle}
                    onFocus={e => e.target.style.borderColor = "#1565C0"}
                    onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
                </div>
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label style={labelStyle}>Description <span style={{ color: "#dc2626" }}>*</span></label>
                <textarea name="description" value={formRecruteur.description} onChange={handleRecruteur}
                  placeholder="Décrivez brièvement votre entreprise..." rows={3} required
                  style={{ ...inputStyle, resize: "vertical", height: "auto" }}
                  onFocus={e => e.target.style.borderColor = "#1565C0"}
                  onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>Logo de l'entreprise <span style={{ color: "#dc2626" }}>*</span></label>
                <input type="file" name="logo" accept="image/*" onChange={handleRecruteur} required style={fileStyle} />
                {formRecruteur.logo && <span style={{ fontSize: "12px", color: "#16a34a", marginTop: "4px", display: "block" }}>✓ {formRecruteur.logo.name}</span>}
              </div>

              {/* Documents */}
              <p style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 12px" }}>Documents de certification (PDF obligatoires)</p>

              {[
                { label: "Registre de commerce", name: "registre_commerce" },
                { label: "Certificat d'immatriculation", name: "certificat_immatriculation" },
                { label: "Patente", name: "patente" },
              ].map(f => (
                <div key={f.name} style={{ marginBottom: "12px" }}>
                  <label style={labelStyle}>{f.label} <span style={{ color: "#dc2626" }}>*</span></label>
                  <input type="file" name={f.name} accept=".pdf" onChange={handleRecruteur} required style={fileStyle} />
                  {formRecruteur[f.name] && <span style={{ fontSize: "12px", color: "#16a34a", marginTop: "4px", display: "block" }}>✓ {formRecruteur[f.name].name}</span>}
                </div>
              ))}

              <button type="submit" disabled={chargement}
                style={{
                  width: "100%", background: chargement ? "#93c5fd" : "#1565C0",
                  color: "white", border: "none", padding: "14px",
                  borderRadius: "10px", fontSize: "15px", fontWeight: "700",
                  cursor: chargement ? "not-allowed" : "pointer",
                  transition: "background 0.2s", fontFamily: "inherit", marginTop: "8px"
                }}
              >
                {chargement ? "Envoi en cours..." : "Soumettre ma demande"}
              </button>
            </form>
          )}

          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <span style={{ fontSize: "14px", color: "#64748b" }}>Déjà un compte ? </span>
            <Link
              to="/connexion"
              state={{ annonce_id: annonceId, redirect: redirectTo }}
              style={{ fontSize: "14px", color: "#1565C0", fontWeight: "600", textDecoration: "none" }}
            >
              Se connecter
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

// ── Styles réutilisables ──
const labelStyle = {
  display: "block", fontSize: "13px", fontWeight: "600",
  color: "#374151", marginBottom: "5px"
};

const inputStyle = {
  width: "100%", padding: "10px 14px", border: "1.5px solid #e5e7eb",
  borderRadius: "8px", fontSize: "13px", color: "#0a0f28",
  outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  background: "white"
};

const fileStyle = {
  width: "100%", padding: "8px 12px", border: "1.5px solid #e5e7eb",
  borderRadius: "8px", fontSize: "13px", color: "#374151",
  boxSizing: "border-box", fontFamily: "inherit", cursor: "pointer",
  background: "#f8faff"
};