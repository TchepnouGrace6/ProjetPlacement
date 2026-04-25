import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { User, FileText, Upload, CheckCircle, Briefcase } from "lucide-react";

const API = "http://127.0.0.1:8000/api/auth";
const ETAPES = ["Informations personnelles", "Profil professionnel", "Documents & Candidature"];

function getToken() { return localStorage.getItem("access_token"); }

export default function PostulerForm() {
  const navigate = useNavigate();
  const { annonceId } = useParams();

  const [etape, setEtape] = useState(0);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");
  const [annonce, setAnnonce] = useState(null);
  const [profilExistant, setProfilExistant] = useState(false);

  const [form, setForm] = useState({
    nom: "", prenom: "", date_naissance: "", sexe: "M",
    nationalite: "Camerounaise", telephone: "", ville: "",
    statut_matrimonial: "celibataire", handicap: false,
    langue_parlee: "", secteur_activite: "", dernier_poste: "",
    derniere_entreprise: "", competences: "", lettre_motivation_texte: "",
    cv: null, diplome: null, lettre_motivation: null, piece_identite: null,
  });

  useEffect(() => {
    // Charger les infos de l'annonce
    axios.get(`${API}/annonces/${annonceId}/`).then(r => setAnnonce(r.data)).catch(() => {});

    // Vérifier si le profil existe déjà
    axios.get(`${API}/candidat/profil/`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    }).then(res => {
      if (res.data.profil_complete) {
        setProfilExistant(true);
        // Pré-remplir le formulaire
        const d = res.data;
        setForm(prev => ({
          ...prev,
          nom: d.nom || "", prenom: d.prenom || "",
          date_naissance: d.date_naissance || "", sexe: d.sexe || "M",
          nationalite: d.nationalite || "Camerounaise",
          telephone: d.telephone || "", ville: d.ville || "",
          statut_matrimonial: d.statut_matrimonial || "celibataire",
          langue_parlee: d.langue_parlee || "",
          secteur_activite: d.secteur_activite || "",
          dernier_poste: d.dernier_poste || "",
          derniere_entreprise: d.derniere_entreprise || "",
          competences: d.competences || "",
        }));
        // Profil complet → aller directement à l'étape lettre de motivation
        setEtape(2);
      }
    }).catch(() => {});
  }, [annonceId]);

  const handle = (e) => {
    if (e.target.type === "file") {
      setForm({ ...form, [e.target.name]: e.target.files[0] });
    } else if (e.target.type === "checkbox") {
      setForm({ ...form, [e.target.name]: e.target.checked });
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  };

  const validerEtape = () => {
    if (etape === 0 && !profilExistant) {
      if (!form.nom || !form.prenom || !form.date_naissance || !form.telephone || !form.ville) {
        setErreur("Veuillez remplir tous les champs obligatoires."); return false;
      }
    }
    if (etape === 1 && !profilExistant) {
      if (!form.secteur_activite || !form.competences) {
        setErreur("Secteur et compétences obligatoires."); return false;
      }
    }
    if (etape === 2 && !profilExistant) {
      if (!form.cv || !form.diplome || !form.piece_identite) {
        setErreur("CV, diplôme et pièce d'identité sont obligatoires."); return false;
      }
    }
    setErreur(""); return true;
  };

  const suivant = () => { if (validerEtape()) setEtape(e => e + 1); };

  const soumettre = async () => {
    setErreur(""); setChargement(true);
    try {
      // 1. Compléter/mettre à jour le profil si nécessaire
      if (!profilExistant) {
        const data = new FormData();
        const champs = ["nom","prenom","date_naissance","sexe","nationalite","telephone","ville",
          "statut_matrimonial","handicap","langue_parlee","secteur_activite","dernier_poste",
          "derniere_entreprise","competences","cv","diplome","piece_identite"];
        champs.forEach(k => {
          if (form[k] !== null && form[k] !== undefined && form[k] !== "") {
            data.append(k, form[k]);
          }
        });
        if (form.lettre_motivation) data.append("lettre_motivation", form.lettre_motivation);
        await axios.post(`${API}/candidat/profil/`, data, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
      }

      // 2. Soumettre la candidature
      await axios.post(
        `${API}/annonces/${annonceId}/candidater/`,
        { lettre_motivation: form.lettre_motivation_texte || "" },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );

      // 3. Rediriger vers le dashboard
      navigate("/candidat/dashboard", { state: { succes: "Candidature envoyée avec succès !" } });
    } catch (err) {
      const d = err.response?.data;
      if (d?.error) setErreur(d.error);
      else setErreur(Object.values(d || {}).flat().join(" | ") || "Erreur lors de la soumission.");
    } finally {
      setChargement(false);
    }
  };

  const inp = (label, name, type = "text", required = true, placeholder = "") => (
    <div style={{ marginBottom: "16px" }}>
      <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
        {label} {required && <span style={{ color: "#dc2626" }}>*</span>}
      </label>
      <input type={type} name={name} value={form[name]} onChange={handle} placeholder={placeholder}
        style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #d1d5db", borderRadius: "8px", fontSize: "14px", color: "#111827", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
        onFocus={e => e.target.style.borderColor = "#1565C0"}
        onBlur={e => e.target.style.borderColor = "#d1d5db"}
      />
    </div>
  );

  const sel = (label, name, options) => (
    <div style={{ marginBottom: "16px" }}>
      <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>{label}</label>
      <select name={name} value={form[name]} onChange={handle}
        style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #d1d5db", borderRadius: "8px", fontSize: "14px", color: "#111827", outline: "none", fontFamily: "inherit" }}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );

  const fileInp = (label, name, accept, required = true) => (
    <div style={{ marginBottom: "16px" }}>
      <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
        {label} {required && <span style={{ color: "#dc2626" }}>*</span>}
      </label>
      <label style={{
        display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px",
        border: `2px dashed ${form[name] ? "#1565C0" : "#d1d5db"}`,
        borderRadius: "8px", cursor: "pointer",
        background: form[name] ? "#eff6ff" : "#fafafa",
      }}>
        <Upload size={16} color={form[name] ? "#1565C0" : "#9ca3af"} />
        <span style={{ fontSize: "13px", color: form[name] ? "#1565C0" : "#6b7280" }}>
          {form[name] ? form[name].name : `Choisir un fichier`}
        </span>
        <input type="file" name={name} accept={accept} onChange={handle} style={{ display: "none" }} />
      </label>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f5", fontFamily: "'Segoe UI', sans-serif" }}>

      {/* Header */}
      <div style={{ background: "#1565C0", padding: "28px 24px", textAlign: "center" }}>
        <h1 style={{ color: "#fff", fontSize: "22px", fontWeight: 700, margin: "0 0 6px" }}>
          {profilExistant ? "Postuler à cette offre" : "Compléter votre profil & Postuler"}
        </h1>
        {annonce && (
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "14px", margin: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
            <Briefcase size={14} /> {annonce.titre} — {annonce.nom_entreprise}
          </p>
        )}
      </div>

      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "32px 24px" }}>

        {/* Stepper */}
        {!profilExistant && (
          <div style={{ display: "flex", alignItems: "center", marginBottom: "32px" }}>
            {ETAPES.map((label, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", flex: i < ETAPES.length - 1 ? 1 : "initial" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                  <div style={{
                    width: "36px", height: "36px", borderRadius: "50%",
                    background: i < etape ? "#16a34a" : i === etape ? "#1565C0" : "#e5e7eb",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: i <= etape ? "#fff" : "#9ca3af", fontWeight: 700, fontSize: "14px",
                  }}>
                    {i < etape ? <CheckCircle size={18} /> : i + 1}
                  </div>
                  <span style={{ fontSize: "11px", color: i === etape ? "#1565C0" : "#6b7280", fontWeight: i === etape ? 600 : 400, whiteSpace: "nowrap" }}>
                    {label}
                  </span>
                </div>
                {i < ETAPES.length - 1 && (
                  <div style={{ flex: 1, height: "2px", background: i < etape ? "#16a34a" : "#e5e7eb", margin: "0 8px", marginBottom: "22px" }} />
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{ background: "#fff", borderRadius: "14px", padding: "32px", border: "1px solid #e5e7eb" }}>
          {erreur && (
            <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "8px", padding: "12px 16px", marginBottom: "20px", fontSize: "13px", color: "#dc2626" }}>
              {erreur}
            </div>
          )}

          {/* ÉTAPE 1 — Infos personnelles */}
          {etape === 0 && !profilExistant && (
            <>
              <h2 style={{ fontSize: "17px", fontWeight: 700, color: "#111827", margin: "0 0 24px", display: "flex", alignItems: "center", gap: "8px" }}>
                <User size={20} color="#1565C0" /> Informations personnelles
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                <div>{inp("Nom", "nom", "text", true, "Votre nom")}</div>
                <div>{inp("Prénom", "prenom", "text", true, "Votre prénom")}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                <div>{inp("Date de naissance", "date_naissance", "date")}</div>
                <div>{sel("Sexe", "sexe", [["M","Masculin"],["F","Féminin"]])}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                <div>{inp("Téléphone", "telephone", "tel", true, "+237 6XX XXX XXX")}</div>
                <div>{inp("Ville", "ville", "text", true, "Douala")}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                <div>{inp("Nationalité", "nationalite", "text", false)}</div>
                <div>{sel("Statut matrimonial", "statut_matrimonial", [["celibataire","Célibataire"],["marie","Marié(e)"],["divorce","Divorcé(e)"]])}</div>
              </div>
              {inp("Langues parlées", "langue_parlee", "text", false, "Français, Anglais…")}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <input type="checkbox" name="handicap" checked={form.handicap} onChange={handle} id="handi" style={{ width: "16px", height: "16px" }} />
                <label htmlFor="handi" style={{ fontSize: "13px", color: "#374151" }}>Situation de handicap</label>
              </div>
            </>
          )}

          {/* ÉTAPE 2 — Profil professionnel */}
          {etape === 1 && !profilExistant && (
            <>
              <h2 style={{ fontSize: "17px", fontWeight: 700, color: "#111827", margin: "0 0 24px", display: "flex", alignItems: "center", gap: "8px" }}>
                <FileText size={20} color="#1565C0" /> Profil professionnel
              </h2>
              {inp("Secteur d'activité", "secteur_activite", "text", true, "Informatique, Finance…")}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                <div>{inp("Dernier poste", "dernier_poste", "text", false, "Développeur web")}</div>
                <div>{inp("Dernière entreprise", "derniere_entreprise", "text", false, "Orange Cameroun")}</div>
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                  Compétences <span style={{ color: "#dc2626" }}>*</span>
                  <span style={{ fontWeight: 400, color: "#9ca3af", marginLeft: "6px" }}>(séparées par des virgules)</span>
                </label>
                <textarea name="competences" value={form.competences} onChange={handle} rows={3}
                  placeholder="React, Python, Django, MySQL…"
                  style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #d1d5db", borderRadius: "8px", fontSize: "14px", color: "#111827", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }} />
              </div>
            </>
          )}

          {/* ÉTAPE 3 — Documents & Candidature */}
          {(etape === 2 || profilExistant) && (
            <>
              <h2 style={{ fontSize: "17px", fontWeight: 700, color: "#111827", margin: "0 0 8px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Upload size={20} color="#1565C0" /> {profilExistant ? "Postuler" : "Documents & Candidature"}
              </h2>

              {profilExistant && (
                <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "8px", padding: "12px 16px", marginBottom: "20px", fontSize: "13px", color: "#16a34a" }}>
                  ✓ Votre profil est déjà complet. Rédigez simplement votre lettre de motivation.
                </div>
              )}

              {!profilExistant && (
                <>
                  <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "20px" }}>
                    Uploadez vos documents (PDF). Ils seront transmis aux recruteurs.
                  </p>
                  {fileInp("Curriculum Vitae (CV)", "cv", ".pdf", true)}
                  {fileInp("Diplôme le plus élevé", "diplome", ".pdf", true)}
                  {fileInp("Pièce d'identité", "piece_identite", ".pdf,image/*", true)}
                  {fileInp("Lettre de motivation (fichier, optionnelle)", "lettre_motivation", ".pdf", false)}
                </>
              )}

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                  Lettre de motivation (texte, optionnelle)
                </label>
                <textarea name="lettre_motivation_texte" value={form.lettre_motivation_texte} onChange={handle} rows={5}
                  placeholder="Présentez-vous brièvement et expliquez pourquoi ce poste vous intéresse…"
                  style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #d1d5db", borderRadius: "8px", fontSize: "14px", color: "#111827", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }} />
              </div>
            </>
          )}

          {/* Navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "28px", paddingTop: "20px", borderTop: "1px solid #f3f4f6" }}>
            {etape > 0 && !profilExistant ? (
              <button onClick={() => setEtape(e => e - 1)}
                style={{ padding: "11px 24px", border: "1.5px solid #d1d5db", borderRadius: "8px", background: "#fff", color: "#374151", fontSize: "14px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                ← Précédent
              </button>
            ) : <div />}

            {(etape < ETAPES.length - 1 && !profilExistant) ? (
              <button onClick={suivant}
                style={{ padding: "11px 28px", background: "#1565C0", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                Suivant →
              </button>
            ) : (
              <button onClick={soumettre} disabled={chargement}
                style={{ padding: "11px 28px", background: chargement ? "#93c5fd" : "#1565C0", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 700, cursor: chargement ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                {chargement ? "Envoi en cours…" : "Envoyer ma candidature 🚀"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}