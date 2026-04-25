import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { MapPin, Briefcase, Clock, Users, ChevronLeft, Building2, Calendar, CheckCircle, AlertCircle } from "lucide-react";

const API = "http://127.0.0.1:8000/api/auth";
const DJANGO_BASE = "http://127.0.0.1:8000";

function getToken() { return localStorage.getItem("access_token"); }
function getRole()  { return localStorage.getItem("role"); }

export default function OffreDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [annonce, setAnnonce] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [postulation, setPostulation] = useState({ loading: false, succes: false, erreur: "" });

  useEffect(() => {
    axios.get(`${API}/annonces/${id}/`)
      .then(r => setAnnonce(r.data))
      .catch(() => navigate("/nos-offres"))
      .finally(() => setChargement(false));
  }, [id]);

  const handlePostuler = async () => {
    const token = getToken();
    const role = getRole();

    // Pas connecté → rediriger vers connexion avec l'annonce en mémoire
    if (!token || !role) {
      navigate("/connexion", {
        state: {
          annonce_id: id,
          redirect: `/nos-offres/${id}`,
          message: "Connectez-vous ou créez un compte pour postuler à cette offre."
        }
      });
      return;
    }

    // Connecté mais pas candidat
    if (role !== "candidat") {
      setPostulation({ loading: false, succes: false, erreur: "Seuls les candidats peuvent postuler à une offre." });
      return;
    }

    // Vérifier si le profil est complet
    try {
      const res = await axios.get(`${API}/candidat/profil/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.data.profil_complete) {
        // Profil incomplet → compléter avant de postuler
        navigate("/candidat/postuler/" + id);
        return;
      }
    } catch {
      navigate("/candidat/postuler/" + id);
      return;
    }

    // Postuler directement
    setPostulation({ loading: true, succes: false, erreur: "" });
    try {
      await axios.post(
        `${API}/annonces/${id}/candidater/`,
        { lettre_motivation: "" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPostulation({ loading: false, succes: true, erreur: "" });
    } catch (err) {
      const msg = err.response?.data?.error || "Erreur lors de la candidature.";
      setPostulation({ loading: false, succes: false, erreur: msg });
    }
  };

  const labelContrat = (t) => {
    const m = { cdi: "CDI", cdd: "CDD", stage: "Stage", alternance: "Alternance", freelance: "Freelance" };
    return m[t] || t;
  };

  const couleur = (nom) => {
    const c = ["#e8590c","#1971c2","#2f9e44","#e03131","#7048e8","#0c8599","#d6336c","#f08c00"];
    let h = 0;
    for (let i = 0; i < (nom || "").length; i++) h += nom.charCodeAt(i);
    return c[h % c.length];
  };

  const initiales = (nom) => nom ? nom.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase() : "??";

  if (chargement) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f2f5" }}>
      <p style={{ color: "#6b7280" }}>Chargement de l'offre…</p>
    </div>
  );

  if (!annonce) return null;

  const logoUrl = annonce.logo || null;
  const bg = couleur(annonce.nom_entreprise);
  const token = getToken();
  const role = getRole();

  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f5", fontFamily: "'Segoe UI', sans-serif" }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 48px", height: "64px",
        background: "rgba(10,15,40,0.92)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "48px" }}>
          <span style={{ color: "white", fontWeight: "700", fontSize: "20px", letterSpacing: "-0.5px" }}>PlacementPro</span>
          <div style={{ display: "flex", gap: "32px" }}>
            {[["Accueil", "/Accueil"], ["Nos Offres", "/nos-offres"], ["À propos", "/apropos"], ["FAQ", "/faq"]].map(([label, path]) => (
              <a key={label} href={path}
                style={{ color: "rgba(255,255,255,0.8)", fontSize: "14px", fontWeight: "500", textDecoration: "none" }}
                onMouseEnter={e => e.target.style.color = "white"}
                onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.8)"}
              >{label}</a>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          {token && role === "candidat" ? (
            <a href="/candidat/dashboard"
              style={{ color: "white", textDecoration: "none", padding: "8px 20px", background: "#1565C0", borderRadius: "8px", fontSize: "14px", fontWeight: "500" }}>
              Mon espace
            </a>
          ) : (
            <>
              <a href="/connexion" style={{ color: "white", textDecoration: "none", padding: "8px 20px", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "8px", fontSize: "14px", fontWeight: "500" }}>Connexion</a>
              <a href="/inscription" style={{ color: "white", textDecoration: "none", padding: "8px 20px", background: "#1565C0", borderRadius: "8px", fontSize: "14px", fontWeight: "500" }}>Inscription</a>
            </>
          )}
        </div>
      </nav>

      {/* Header bleu */}
      <div style={{ background: "#1d4ed8", paddingTop: "64px" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px 24px" }}>
          <button onClick={() => navigate("/nos-offres")}
            style={{ display: "flex", alignItems: "center", gap: "6px", background: "transparent", border: "none", color: "rgba(255,255,255,0.8)", cursor: "pointer", fontSize: "14px", marginBottom: "20px" }}>
            <ChevronLeft size={16} /> Retour aux offres
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            {logoUrl ? (
              <img src={logoUrl} alt={annonce.nom_entreprise} style={{ width: "72px", height: "72px", borderRadius: "14px", objectFit: "cover", border: "3px solid rgba(255,255,255,0.3)" }} />
            ) : (
              <div style={{ width: "72px", height: "72px", borderRadius: "14px", background: bg, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "22px", border: "3px solid rgba(255,255,255,0.3)" }}>
                {initiales(annonce.nom_entreprise)}
              </div>
            )}
            <div>
              <div style={{ color: "rgba(255,255,255,0.75)", fontSize: "14px", marginBottom: "4px" }}>{annonce.nom_entreprise}</div>
              <h1 style={{ color: "#fff", fontSize: "26px", fontWeight: 700, margin: 0, lineHeight: 1.2 }}>{annonce.titre}</h1>
              <div style={{ display: "flex", gap: "16px", marginTop: "10px", flexWrap: "wrap" }}>
                {[
                  { icon: <MapPin size={14} />, text: annonce.localisation },
                  { icon: <Briefcase size={14} />, text: labelContrat(annonce.type_contrat) },
                  { icon: <Building2 size={14} />, text: annonce.secteur_activite },
                  { icon: <Users size={14} />, text: `${annonce.nombre_postes || 1} poste(s)` },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "5px", color: "rgba(255,255,255,0.8)", fontSize: "13px" }}>
                    {item.icon} {item.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Corps */}
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "32px 24px", display: "grid", gridTemplateColumns: "1fr 320px", gap: "24px", alignItems: "start" }}>

        {/* Colonne gauche */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ background: "#fff", borderRadius: "12px", padding: "28px", border: "1px solid #e5e7eb" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#111827", margin: "0 0 16px" }}>Description du poste</h2>
            <p style={{ color: "#4b5563", fontSize: "15px", lineHeight: "1.8", whiteSpace: "pre-line", margin: 0 }}>{annonce.description}</p>
          </div>

          {annonce.competences_requises && (
            <div style={{ background: "#fff", borderRadius: "12px", padding: "28px", border: "1px solid #e5e7eb" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#111827", margin: "0 0 16px" }}>Compétences requises</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {annonce.competences_requises.split(",").map((c, i) => (
                  <span key={i} style={{ background: "#eff6ff", color: "#1d4ed8", padding: "6px 14px", borderRadius: "100px", fontSize: "13px", fontWeight: 500, border: "1px solid #bfdbfe" }}>
                    {c.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {annonce.qualifications && (
            <div style={{ background: "#fff", borderRadius: "12px", padding: "28px", border: "1px solid #e5e7eb" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#111827", margin: "0 0 16px" }}>Qualifications requises</h2>
              <p style={{ color: "#4b5563", fontSize: "15px", lineHeight: "1.8", whiteSpace: "pre-line", margin: 0 }}>{annonce.qualifications}</p>
            </div>
          )}
        </div>

        {/* Colonne droite */}
        <div style={{ position: "sticky", top: "84px" }}>
          <div style={{ background: "#fff", borderRadius: "12px", padding: "24px", border: "1px solid #e5e7eb" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#111827", margin: "0 0 20px" }}>Résumé de l'offre</h3>

            {[
              { label: "Type de contrat", value: labelContrat(annonce.type_contrat) },
              { label: "Localisation", value: annonce.localisation },
              { label: "Secteur", value: annonce.secteur_activite },
              { label: "Postes disponibles", value: annonce.nombre_postes || 1 },
              annonce.salaire_min ? { label: "Salaire min", value: `${Number(annonce.salaire_min).toLocaleString()} FCFA` } : null,
              annonce.salaire_max ? { label: "Salaire max", value: `${Number(annonce.salaire_max).toLocaleString()} FCFA` } : null,
            ].filter(Boolean).map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f3f4f6" }}>
                <span style={{ fontSize: "13px", color: "#6b7280" }}>{item.label}</span>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>{item.value}</span>
              </div>
            ))}

            {annonce.date_debut && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", margin: "14px 0 20px", color: "#6b7280", fontSize: "13px" }}>
                <Calendar size={14} /> Début : {new Date(annonce.date_debut).toLocaleDateString("fr-FR")}
              </div>
            )}

            {postulation.succes && (
              <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "8px", padding: "12px", marginBottom: "14px", display: "flex", gap: "8px" }}>
                <CheckCircle size={16} color="#16a34a" />
                <span style={{ fontSize: "13px", color: "#16a34a", fontWeight: 500 }}>Candidature envoyée ! Vous pouvez suivre son statut dans votre espace.</span>
              </div>
            )}

            {postulation.erreur && (
              <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "8px", padding: "12px", marginBottom: "14px", display: "flex", gap: "8px" }}>
                <AlertCircle size={16} color="#dc2626" />
                <span style={{ fontSize: "13px", color: "#dc2626" }}>{postulation.erreur}</span>
              </div>
            )}

            {!postulation.succes && (
              <button onClick={handlePostuler} disabled={postulation.loading}
                style={{
                  width: "100%", background: postulation.loading ? "#93c5fd" : "#1d4ed8",
                  color: "#fff", border: "none", padding: "14px",
                  borderRadius: "9px", fontSize: "15px", fontWeight: 700,
                  cursor: postulation.loading ? "not-allowed" : "pointer",
                  transition: "background 0.2s"
                }}
                onMouseEnter={e => { if (!postulation.loading) e.currentTarget.style.background = "#1e40af"; }}
                onMouseLeave={e => { if (!postulation.loading) e.currentTarget.style.background = "#1d4ed8"; }}
              >
                {postulation.loading ? "Envoi en cours…" : "Postuler à cette offre"}
              </button>
            )}

            {postulation.succes && (
              <button onClick={() => navigate("/candidat/dashboard")}
                style={{ width: "100%", background: "#0a0f28", color: "#fff", border: "none", padding: "12px", borderRadius: "9px", fontSize: "14px", fontWeight: 600, cursor: "pointer", marginTop: "8px" }}>
                Voir mes candidatures →
              </button>
            )}

            <p style={{ textAlign: "center", fontSize: "12px", color: "#9ca3af", margin: "12px 0 0" }}>
              {token ? "Votre profil sera transmis à l'entreprise" : "Connexion requise pour postuler"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}