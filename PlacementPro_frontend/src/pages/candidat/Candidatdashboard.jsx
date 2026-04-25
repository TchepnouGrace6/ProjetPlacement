import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import axios from "axios";

const API = "http://127.0.0.1:8000/api/auth";

function getToken() { return localStorage.getItem("access_token"); }
function getEmail() { return localStorage.getItem("email") || ""; }

const TYPE_COLORS = {
  cdi:        { bg: "#e8f0fe", color: "#1d4ed8" },
  cdd:        { bg: "#fff3e0", color: "#e65100" },
  stage:      { bg: "#e3f2fd", color: "#0c8599" },
  alternance: { bg: "#f3e5f5", color: "#7048e8" },
  freelance:  { bg: "#fce4ec", color: "#d6336c" },
};

const STATUT_CONFIG = {
  soumise:              { label: "Soumise",                 bg: "#fff3e0", color: "#e65100" },
  analyse_en_cours:     { label: "Analyse en cours...",     bg: "#e3f2fd", color: "#0c8599" },
  etape_2:              { label: "Entretien IA disponible", bg: "#f3e5f5", color: "#7048e8" },
  entretien_ia:         { label: "Entretien IA en cours",   bg: "#e8f0fe", color: "#1d4ed8" },
  rejetee_auto:         { label: "Non retenu(e)",           bg: "#fef2f2", color: "#dc2626" },
  selectionne:          { label: "Sélectionné(e) ✓",        bg: "#e8f5e9", color: "#2e7d32" },
  entretien_rh:         { label: "Entretien RH demandé",    bg: "#fff8e1", color: "#f59e0b" },
  entretien_rh_accepte: { label: "Entretien RH accepté",    bg: "#e8f5e9", color: "#2e7d32" },
  valide:               { label: "Validé(e) 🎉",            bg: "#e8f5e9", color: "#1565C0" },
  rejetee:              { label: "Rejetée",                 bg: "#fef2f2", color: "#dc2626" },
  en_attente:           { label: "En attente",              bg: "#e3f2fd", color: "#0c8599" },
  shortlistee:          { label: "Shortlistée",             bg: "#f3e5f5", color: "#7048e8" },
  acceptee:             { label: "Acceptée",                bg: "#e8f5e9", color: "#2e7d32" },
  acceptee_offre:       { label: "Offre acceptée",          bg: "#e8f5e9", color: "#1565C0" },
};

export default function CandidatDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const [profil, setProfil] = useState(null);
  const [candidatures, setCandidatures] = useState([]);
  const [annoncesRecentes, setAnnoncesRecentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("candidatures");
  const [succes, setSucces] = useState(location.state?.succes || "");
  const [showProfilModal, setShowProfilModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const photoRef = useRef(null);

  useEffect(() => {
    const token = getToken();
    if (!token) { navigate("/connexion"); return; }
    charger();
    if (succes) setTimeout(() => setSucces(""), 4000);
  }, []);

  async function charger() {
    setLoading(true);
    try {
      const [profilRes, candRes, annoncesRes] = await Promise.allSettled([
        axios.get(`${API}/candidat/profil/`, { headers: { Authorization: `Bearer ${getToken()}` } }),
        axios.get(`${API}/candidat/mes-candidatures/`, { headers: { Authorization: `Bearer ${getToken()}` } }),
        axios.get(`${API}/annonces/`),
      ]);

      if (profilRes.status === "fulfilled") {
        setProfil(profilRes.value.data);
        setEditForm(profilRes.value.data);
      }
      if (candRes.status === "fulfilled") {
        setCandidatures(candRes.value.data || []);
      }
      if (annoncesRes.status === "fulfilled") {
        const data = annoncesRes.value.data.results || annoncesRes.value.data;
        setAnnoncesRecentes(data.slice(0, 6));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function handleDeconnexion() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    navigate("/Accueil");
  }

  async function annulerCandidature(id) {
    if (!window.confirm("Annuler cette candidature ?")) return;
    try {
      await axios.delete(`${API}/candidat/mes-candidatures/${id}/`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setCandidatures(prev => prev.filter(c => c.id !== id));
      setSucces("Candidature annulée avec succès.");
      setTimeout(() => setSucces(""), 3000);
    } catch (err) {
      alert(err.response?.data?.error || "Erreur lors de l'annulation.");
    }
  }

  async function accepterEntretienRH(candidatureId) {
    try {
      await axios.post(
        `${API}/candidatures/${candidatureId}/accepter-entretien/`,
        {},
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setSucces("Entretien RH accepté ! Le recruteur a été notifié.");
      charger();
      setTimeout(() => setSucces(""), 4000);
    } catch (err) {
      alert("Erreur lors de l'acceptation de l'entretien.");
    }
  }

  function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function sauvegarderProfil() {
    const data = new FormData();
    const champs = ["nom","prenom","telephone","ville","secteur_activite","dernier_poste","derniere_entreprise","competences","langue_parlee"];
    champs.forEach(k => { if (editForm[k]) data.append(k, editForm[k]); });
    if (photoFile) data.append("photo_profil", photoFile);

    try {
      await axios.put(`${API}/candidat/profil/`, data, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      setShowProfilModal(false);
      setSucces("Profil mis à jour !");
      charger();
      setTimeout(() => setSucces(""), 3000);
    } catch (err) {
      alert("Erreur lors de la mise à jour du profil.");
    }
  }

  const email = getEmail();
  const initiales = profil
    ? `${(profil.prenom || "")[0] || ""}${(profil.nom || "")[0] || ""}`.toUpperCase()
    : email.substring(0, 2).toUpperCase();
  const nomComplet = profil
    ? `${profil.prenom || ""} ${profil.nom || ""}`.trim()
    : email;

  const TABS = [
    { id: "candidatures", label: "Mes candidatures", count: candidatures.length },
    { id: "offres",       label: "Offres récentes",  count: annoncesRecentes.length },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#eef1f8", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* ── SIDEBAR ── */}
      <div style={{
        position: "fixed", top: 0, left: 0, bottom: 0, width: "240px",
        background: "#0a0f28", display: "flex", flexDirection: "column",
        zIndex: 100, overflowY: "auto"
      }}>
        <div style={{ padding: "24px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <span style={{ color: "white", fontWeight: "800", fontSize: "18px", letterSpacing: "-0.5px" }}>
            Placement<span style={{ color: "#64B5F6" }}>Pro</span>
          </span>
        </div>

        <div style={{ padding: "20px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ position: "relative", cursor: "pointer" }} onClick={() => photoRef.current?.click()}>
            {(profil?.photo_profil || photoPreview) ? (
              <img src={photoPreview || profil.photo_profil} alt="photo"
                style={{ width: "44px", height: "44px", borderRadius: "50%", objectFit: "cover", border: "2px solid #1565C0" }} />
            ) : (
              <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "#1565C0", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "15px" }}>
                {initiales}
              </div>
            )}
            <div style={{ position: "absolute", bottom: -2, right: -2, width: "16px", height: "16px", background: "#1565C0", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", color: "white", border: "2px solid #0a0f28" }}>✎</div>
          </div>
          <input ref={photoRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: "none" }} />
          <div>
            <div style={{ color: "white", fontSize: "13px", fontWeight: 600, lineHeight: 1.3 }}>{nomComplet || "Mon compte"}</div>
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "11px" }}>{email}</div>
          </div>
        </div>

        <nav style={{ padding: "12px 0", flex: 1 }}>
          <div style={{ padding: "6px 20px 4px", fontSize: "10px", color: "rgba(255,255,255,0.3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>Mon espace</div>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                width: "100%", padding: "10px 20px", border: "none", cursor: "pointer",
                background: activeTab === tab.id ? "rgba(255,255,255,0.1)" : "transparent",
                color: activeTab === tab.id ? "white" : "rgba(255,255,255,0.6)",
                borderLeft: activeTab === tab.id ? "3px solid #1565C0" : "3px solid transparent",
                fontSize: "13px", fontWeight: activeTab === tab.id ? 700 : 400,
                textAlign: "left", fontFamily: "inherit", transition: "all 0.15s"
              }}>
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span style={{ background: activeTab === tab.id ? "#1565C0" : "rgba(255,255,255,0.15)", color: "white", fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "20px" }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}

          <div style={{ padding: "6px 20px 4px", marginTop: "8px", fontSize: "10px", color: "rgba(255,255,255,0.3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>Plateforme</div>
          <Link to="/nos-offres" style={{ display: "block", padding: "10px 20px", color: "rgba(255,255,255,0.6)", fontSize: "13px", textDecoration: "none", borderLeft: "3px solid transparent" }}>
            Toutes les offres
          </Link>
          <Link to="/faq" style={{ display: "block", padding: "10px 20px", color: "rgba(255,255,255,0.6)", fontSize: "13px", textDecoration: "none", borderLeft: "3px solid transparent" }}>
            Aide & FAQ
          </Link>
        </nav>

        <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", gap: "8px" }}>
          <button onClick={() => setShowProfilModal(true)}
            style={{ width: "100%", padding: "9px 14px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", color: "white", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", textAlign: "center" }}>
            ✎ Modifier mon profil
          </button>
          <button onClick={handleDeconnexion}
            style={{ width: "100%", padding: "9px 14px", background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", color: "rgba(255,255,255,0.5)", fontSize: "13px", cursor: "pointer", fontFamily: "inherit", textAlign: "center" }}>
            Déconnexion
          </button>
        </div>
      </div>

      {/* ── CONTENU PRINCIPAL ── */}
      <div style={{ marginLeft: "240px", padding: "32px" }}>

        {succes && (
          <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "10px", padding: "12px 20px", marginBottom: "20px", fontSize: "14px", color: "#16a34a", fontWeight: 500 }}>
            ✓ {succes}
          </div>
        )}

        <div style={{ marginBottom: "28px" }}>
          <h1 style={{ fontSize: "26px", fontWeight: "800", color: "#0a0f28", margin: "0 0 6px", letterSpacing: "-0.5px" }}>
            Bonjour{profil?.prenom ? `, ${profil.prenom}` : ""} 👋
          </h1>
          <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>
            {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "28px" }}>
          {[
            { label: "Candidatures envoyées", value: candidatures.length, color: "#1565C0", bg: "#e8efff" },
            { label: "En cours de traitement", value: candidatures.filter(c => ["soumise","analyse_en_cours","en_attente","shortlistee"].includes(c.statut)).length, color: "#0c8599", bg: "#e0f7fa" },
            { label: "Acceptées", value: candidatures.filter(c => ["acceptee","acceptee_offre","valide","selectionne"].includes(c.statut)).length, color: "#2e7d32", bg: "#e8f5e9" },
            { label: "Offres disponibles", value: annoncesRecentes.length, color: "#7048e8", bg: "#f3e5f5" },
          ].map((s, i) => (
            <div key={i} style={{ background: "white", borderRadius: "14px", padding: "20px", border: "1px solid #e8efff" }}>
              <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "8px" }}>{s.label}</div>
              <div style={{ fontSize: "32px", fontWeight: "800", color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", background: "#e2e8f0", borderRadius: "10px", padding: "4px", marginBottom: "20px", width: "fit-content" }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "8px 20px", border: "none", borderRadius: "8px", cursor: "pointer",
                background: activeTab === tab.id ? "white" : "transparent",
                color: activeTab === tab.id ? "#0a0f28" : "#64748b",
                fontWeight: activeTab === tab.id ? 700 : 400,
                fontSize: "14px", fontFamily: "inherit",
                boxShadow: activeTab === tab.id ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.15s"
              }}>
              {tab.label}
              {tab.count > 0 && (
                <span style={{ marginLeft: "6px", background: activeTab === tab.id ? "#1565C0" : "#cbd5e1", color: activeTab === tab.id ? "white" : "#475569", fontSize: "11px", fontWeight: 700, padding: "1px 7px", borderRadius: "20px" }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#94a3b8" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>⏳</div>
            <p>Chargement…</p>
          </div>
        ) : (
          <>
            {/* ── MES CANDIDATURES ── */}
            {activeTab === "candidatures" && (
              <div>
                {candidatures.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px", background: "white", borderRadius: "16px", border: "1px solid #e8efff" }}>
                    <div style={{ fontSize: "48px", marginBottom: "16px" }}>📋</div>
                    <h3 style={{ color: "#0a0f28", fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>Aucune candidature pour le moment</h3>
                    <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "24px" }}>Parcourez les offres et postulez à celles qui vous intéressent.</p>
                    <Link to="/nos-offres" style={{ background: "#1565C0", color: "white", textDecoration: "none", padding: "12px 24px", borderRadius: "10px", fontSize: "14px", fontWeight: 700 }}>
                      Voir les offres →
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {candidatures.map(c => {
                      const sc = STATUT_CONFIG[c.statut] || { label: c.statut, bg: "#f1f5f9", color: "#475569" };
                      const tc = TYPE_COLORS[c.type_contrat] || { bg: "#f1f5f9", color: "#475569" };
                      return (
                        <div key={c.id} style={{ background: "white", borderRadius: "14px", padding: "20px 24px", border: c.statut === "etape_2" ? "2px solid #7048e8" : "1px solid #e8efff", display: "flex", alignItems: "center", gap: "16px" }}>

                          {/* Logo */}
                          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#e8efff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#1565C0", fontSize: "14px", flexShrink: 0, overflow: "hidden" }}>
                            {c.logo ? (
                              <img src={c.logo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              (c.nom_entreprise || "?").substring(0, 2).toUpperCase()
                            )}
                          </div>

                          {/* Infos */}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, color: "#0a0f28", fontSize: "15px", marginBottom: "4px" }}>{c.annonce_titre}</div>
                            <div style={{ color: "#64748b", fontSize: "13px", marginBottom: "8px" }}>{c.nom_entreprise} — {c.localisation}</div>
                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                              <span style={{ background: tc.bg, color: tc.color, fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "100px" }}>
                                {(c.type_contrat || "").toUpperCase()}
                              </span>
                              <span style={{ background: sc.bg, color: sc.color, fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "100px" }}>
                                {sc.label}
                              </span>
                            </div>

                            {/* Message spécial etape_2 */}
                            {c.statut === "etape_2" && (
                              <div style={{ marginTop: "8px", padding: "8px 12px", background: "#f3e5f5", borderRadius: "8px", fontSize: "12px", color: "#7048e8", fontWeight: 500 }}>
                                🎙️ Votre profil a été validé ! Passez maintenant l'entretien avec notre assistant IA.
                              </div>
                            )}

                            {/* Message rejetee_auto */}
                            {c.statut === "rejetee_auto" && (
                              <div style={{ marginTop: "8px", padding: "8px 12px", background: "#fef2f2", borderRadius: "8px", fontSize: "12px", color: "#dc2626" }}>
                                ✗ Candidature non retenue. Consultez votre email pour les détails.
                              </div>
                            )}

                            {/* Message selectionne */}
                            {c.statut === "selectionne" && (
                              <div style={{ marginTop: "8px", padding: "8px 12px", background: "#e8f5e9", borderRadius: "8px", fontSize: "12px", color: "#2e7d32", fontWeight: 500 }}>
                                🎉 Félicitations ! Vous avez été sélectionné(e). Le recruteur va vous contacter.
                              </div>
                            )}

                            {/* Message entretien_rh */}
                            {c.statut === "entretien_rh" && (
                              <div style={{ marginTop: "8px", padding: "8px 12px", background: "#fff8e1", borderRadius: "8px", fontSize: "12px", color: "#f59e0b", fontWeight: 500 }}>
                                📅 Le recruteur vous invite à un entretien. Acceptez pour confirmer votre participation.
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px", flexShrink: 0 }}>
                            <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                              {new Date(c.date_soumission).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                            </div>
                            <button onClick={() => navigate("/nos-offres/" + c.annonce_id)}
                              style={{ background: "#f0f4ff", color: "#1565C0", border: "none", padding: "6px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                              Voir l'offre
                            </button>

                            {/* Bouton entretien IA */}
                            {c.statut === "etape_2" && (
                              <button onClick={() => navigate(`/candidat/entretien/${c.id}`)}
                                style={{ background: "#7048e8", color: "white", border: "none", padding: "6px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                                🎙️ Passer l'entretien IA
                              </button>
                            )}

                            {/* Bouton accepter entretien RH */}
                            {c.statut === "entretien_rh" && (
                              <button onClick={() => accepterEntretienRH(c.id)}
                                style={{ background: "#f59e0b", color: "white", border: "none", padding: "6px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                                ✅ Accepter l'entretien RH
                              </button>
                            )}

                            {/* Bouton annuler */}
                            {["soumise", "en_attente"].includes(c.statut) && (
                              <button onClick={() => annulerCandidature(c.id)}
                                style={{ background: "#fef2f2", color: "#dc2626", border: "none", padding: "6px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                                Annuler
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── OFFRES RÉCENTES ── */}
            {activeTab === "offres" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0a0f28", margin: 0 }}>Offres récentes sur la plateforme</h2>
                  <Link to="/nos-offres" style={{ color: "#1565C0", fontSize: "14px", fontWeight: 600, textDecoration: "none" }}>Voir toutes les offres →</Link>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
                  {annoncesRecentes.map(a => {
                    const tc = TYPE_COLORS[a.type_contrat] || { bg: "#f1f5f9", color: "#475569" };
                    const dejaPostule = candidatures.some(c => c.annonce_id === a.id);
                    return (
                      <div key={a.id} style={{ background: "white", borderRadius: "14px", padding: "20px", border: "1px solid #e8efff" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                          <div>
                            <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "4px" }}>{a.nom_entreprise}</div>
                            <div style={{ fontWeight: 700, color: "#0a0f28", fontSize: "15px", lineHeight: 1.3 }}>{a.titre}</div>
                          </div>
                          {dejaPostule && (
                            <span style={{ background: "#e8f5e9", color: "#2e7d32", fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "6px", flexShrink: 0, marginLeft: "8px" }}>✓ Postulé</span>
                          )}
                        </div>
                        <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "12px" }}>{a.secteur_activite} — {a.localisation}</div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ background: tc.bg, color: tc.color, fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "100px" }}>
                            {(a.type_contrat || "").toUpperCase()}
                          </span>
                          {!dejaPostule ? (
                            <button onClick={() => navigate("/candidat/postuler/" + a.id)}
                              style={{ background: "#1565C0", color: "white", border: "none", padding: "7px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                              Postuler
                            </button>
                          ) : (
                            <button onClick={() => navigate("/nos-offres/" + a.id)}
                              style={{ background: "#f0f4ff", color: "#1565C0", border: "none", padding: "7px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                              Voir l'offre
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── MODAL MODIFIER PROFIL ── */}
      {showProfilModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
          onClick={() => setShowProfilModal(false)}>
          <div style={{ background: "white", borderRadius: "20px", width: "100%", maxWidth: "540px", maxHeight: "85vh", overflowY: "auto", padding: "32px" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#0a0f28", margin: 0 }}>Modifier mon profil</h2>
              <button onClick={() => setShowProfilModal(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#94a3b8" }}>✕</button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px", padding: "16px", background: "#f8faff", borderRadius: "12px" }}>
              <div>
                {(photoPreview || profil?.photo_profil) ? (
                  <img src={photoPreview || profil.photo_profil} alt="photo"
                    style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", border: "2px solid #1565C0" }} />
                ) : (
                  <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#1565C0", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "20px" }}>
                    {initiales}
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontWeight: 600, color: "#0a0f28", fontSize: "14px", marginBottom: "6px" }}>Photo de profil</div>
                <label style={{ background: "#1565C0", color: "white", padding: "7px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                  Changer la photo
                  <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: "none" }} />
                </label>
              </div>
            </div>

            {[
              { label: "Prénom",            key: "prenom" },
              { label: "Nom",               key: "nom" },
              { label: "Téléphone",         key: "telephone" },
              { label: "Ville",             key: "ville" },
              { label: "Secteur d'activité",key: "secteur_activite" },
              { label: "Dernier poste",     key: "dernier_poste" },
              { label: "Dernière entreprise",key: "derniere_entreprise" },
              { label: "Langues parlées",   key: "langue_parlee" },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "5px" }}>{field.label}</label>
                <input type="text" value={editForm[field.key] || ""}
                  onChange={e => setEditForm({ ...editForm, [field.key]: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e5e7eb", borderRadius: "8px", fontSize: "14px", color: "#0a0f28", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
              </div>
            ))}

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "5px" }}>Compétences</label>
              <textarea value={editForm.competences || ""} rows={3}
                onChange={e => setEditForm({ ...editForm, competences: e.target.value })}
                style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e5e7eb", borderRadius: "8px", fontSize: "14px", color: "#0a0f28", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }} />
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => setShowProfilModal(false)}
                style={{ flex: 1, padding: "12px", border: "1.5px solid #e5e7eb", borderRadius: "10px", background: "white", color: "#374151", fontSize: "14px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                Annuler
              </button>
              <button onClick={sauvegarderProfil}
                style={{ flex: 1, padding: "12px", background: "#1565C0", color: "white", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}