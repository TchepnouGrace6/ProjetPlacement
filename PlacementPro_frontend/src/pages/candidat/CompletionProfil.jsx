import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { getToken } from "../../api/auth";
import { User, FileText, Upload, CheckCircle } from "lucide-react";

const API = "http://127.0.0.1:8000/api/auth";

const ETAPES = ["Informations personnelles", "Informations professionnelles", "Documents"];

export default function CompletionProfil() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirect = location.state?.redirect || "/candidat/dashboard";
  const annonce_id = location.state?.annonce_id;

  const [etape, setEtape] = useState(0);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");

  const [form, setForm] = useState({
    nom: "", prenom: "", date_naissance: "", sexe: "M",
    nationalite: "Camerounaise", telephone: "", ville: "",
    statut_matrimonial: "celibataire", handicap: false,
    langue_parlee: "", secteur_activite: "", dernier_poste: "",
    derniere_entreprise: "", competences: "",
    cv: null, diplome: null, lettre_motivation: null, piece_identite: null,
  });

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
    if (etape === 0) {
      if (!form.nom || !form.prenom || !form.date_naissance || !form.telephone || !form.ville) {
        setErreur("Veuillez remplir tous les champs obligatoires."); return false;
      }
    }
    if (etape === 1) {
      if (!form.secteur_activite || !form.competences) {
        setErreur("Secteur d'activité et compétences sont obligatoires."); return false;
      }
    }
    if (etape === 2) {
      if (!form.cv || !form.diplome || !form.piece_identite) {
        setErreur("CV, diplôme et pièce d'identité sont obligatoires."); return false;
      }
    }
    setErreur(""); return true;
  };

  const suivant = () => { if (validerEtape()) setEtape(e => e + 1); };

  const soumettre = async () => {
    if (!validerEtape()) return;
    setChargement(true);
    setErreur("");
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== null && v !== undefined && v !== "") data.append(k, v);
      });
      await axios.post(`${API}/candidat/profil/`, data, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (annonce_id) {
        await axios.post(`${API}/annonces/${annonce_id}/candidater/`, { lettre_motivation: "" }, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
      }
      navigate(redirect, { state: { succes: annonce_id ? "Candidature envoyée !" : "Profil complété !" } });
    } catch (err) {
      const d = err.response?.data;
      setErreur(d ? Object.values(d).flat().join(" | ") : "Erreur lors de la soumission.");
    } finally {
      setChargement(false);
    }
  };

  const inp = (label, name, type = "text", required = true, placeholder = "") => (
    <div style={{ marginBottom: "16px" }}>
      <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
        {label} {required && <span style={{ color: "#dc2626" }}>*</span>}
      </label>
      <input
        type={type} name={name} value={form[name]} onChange={handle}
        placeholder={placeholder}
        style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #d1d5db", borderRadius: "8px", fontSize: "14px", color: "#111827", outline: "none", boxSizing: "border-box" }}
      />
    </div>
  );

  const sel = (label, name, options, required = true) => (
    <div style={{ marginBottom: "16px" }}>
      <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
        {label} {required && <span style={{ color: "#dc2626" }}>*</span>}
      </label>
      <select name={name} value={form[name]} onChange={handle}
        style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #d1d5db", borderRadius: "8px", fontSize: "14px", color: "#111827", outline: "none" }}>
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
        border: `2px dashed ${form[name] ? "#1d4ed8" : "#d1d5db"}`,
        borderRadius: "8px", cursor: "pointer",
        background: form[name] ? "#eff6ff" : "#fafafa",
      }}>
        <Upload size={16} color={form[name] ? "#1d4ed8" : "#9ca3af"} />
        <span style={{ fontSize: "13px", color: form[name] ? "#1d4ed8" : "#6b7280" }}>
          {form[name] ? form[name].name : `Choisir un fichier ${accept.includes("pdf") ? "(PDF)" : "(Image)"}`}
        </span>
        <input type="file" name={name} accept={accept} onChange={handle} style={{ display: "none" }} />
      </label>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f5", fontFamily: "'Segoe UI', sans-serif" }}>

      {/* Header */}
      <div style={{ background: "#1d4ed8", padding: "28px 24px", textAlign: "center" }}>
        <h1 style={{ color: "#fff", fontSize: "22px", fontWeight: 700, margin: "0 0 6px" }}>
          Complétez votre profil
        </h1>
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "14px", margin: 0 }}>
          {annonce_id ? "Votre profil sera soumis avec votre candidature" : "Renseignez vos informations pour accéder aux offres"}
        </p>
      </div>

      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "32px 24px" }}>

        {/* Stepper */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: "32px" }}>
          {ETAPES.map((label, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", flex: i < ETAPES.length - 1 ? 1 : "initial" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                <div style={{
                  width: "36px", height: "36px", borderRadius: "50%",
                  background: i < etape ? "#16a34a" : i === etape ? "#1d4ed8" : "#e5e7eb",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: i <= etape ? "#fff" : "#9ca3af", fontWeight: 700, fontSize: "14px",
                }}>
                  {i < etape ? <CheckCircle size={18} /> : i + 1}
                </div>
                <span style={{ fontSize: "11px", color: i === etape ? "#1d4ed8" : "#6b7280", fontWeight: i === etape ? 600 : 400, whiteSpace: "nowrap" }}>
                  {label}
                </span>
              </div>
              {i < ETAPES.length - 1 && (
                <div style={{ flex: 1, height: "2px", background: i < etape ? "#16a34a" : "#e5e7eb", margin: "0 8px", marginBottom: "22px" }} />
              )}
            </div>
          ))}
        </div>

        {/* Carte formulaire */}
        <div style={{ background: "#fff", borderRadius: "14px", padding: "32px", border: "1px solid #e5e7eb" }}>

          {erreur && (
            <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "8px", padding: "12px 16px", marginBottom: "20px", fontSize: "13px", color: "#dc2626" }}>
              {erreur}
            </div>
          )}

          {/* ÉTAPE 1 */}
          {etape === 0 && (
            <>
              <h2 style={{ fontSize: "17px", fontWeight: 700, color: "#111827", margin: "0 0 24px", display: "flex", alignItems: "center", gap: "8px" }}>
                <User size={20} color="#1d4ed8" /> Informations personnelles
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                <div>{inp("Nom", "nom", "text", true, "Votre nom")}</div>
                <div>{inp("Prénom", "prenom", "text", true, "Votre prénom")}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                <div>{inp("Date de naissance", "date_naissance", "date", true)}</div>
                <div>{sel("Sexe", "sexe", [["M","Masculin"],["F","Féminin"]])}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                <div>{inp("Téléphone", "telephone", "tel", true, "+237 6XX XXX XXX")}</div>
                <div>{inp("Ville", "ville", "text", true, "Douala")}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                <div>{inp("Nationalité", "nationalite", "text", false, "Camerounaise")}</div>
                <div>{sel("Statut matrimonial", "statut_matrimonial", [["celibataire","Célibataire"],["marie","Marié(e)"],["divorce","Divorcé(e)"]])}</div>
              </div>
              {inp("Langues parlées", "langue_parlee", "text", false, "Français, Anglais...")}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <input type="checkbox" name="handicap" checked={form.handicap} onChange={handle} id="handi" style={{ width: "16px", height: "16px" }} />
                <label htmlFor="handi" style={{ fontSize: "13px", color: "#374151" }}>Situation de handicap</label>
              </div>
            </>
          )}

          {/* ÉTAPE 2 */}
          {etape === 1 && (
            <>
              <h2 style={{ fontSize: "17px", fontWeight: 700, color: "#111827", margin: "0 0 24px", display: "flex", alignItems: "center", gap: "8px" }}>
                <FileText size={20} color="#1d4ed8" /> Informations professionnelles
              </h2>
              {inp("Secteur d'activité", "secteur_activite", "text", true, "ex: Informatique, Finance...")}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                <div>{inp("Dernier poste occupé", "dernier_poste", "text", false, "ex: Développeur web")}</div>
                <div>{inp("Dernière entreprise", "derniere_entreprise", "text", false, "ex: Orange Cameroun")}</div>
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                  Compétences <span style={{ color: "#dc2626" }}>*</span>
                  <span style={{ fontWeight: 400, color: "#9ca3af", marginLeft: "6px" }}>(séparées par des virgules)</span>
                </label>
                <textarea
                  name="competences" value={form.competences} onChange={handle}
                  placeholder="React, Python, Django, MySQL, Gestion de projet..."
                  rows={3}
                  style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #d1d5db", borderRadius: "8px", fontSize: "14px", color: "#111827", outline: "none", resize: "vertical", boxSizing: "border-box" }}
                />
              </div>
            </>
          )}

          {/* ÉTAPE 3 */}
          {etape === 2 && (
            <>
              <h2 style={{ fontSize: "17px", fontWeight: 700, color: "#111827", margin: "0 0 8px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Upload size={20} color="#1d4ed8" /> Documents
              </h2>
              <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "24px" }}>
                Uploadez vos documents en PDF. Ils seront transmis aux recruteurs avec vos candidatures.
              </p>
              {fileInp("Curriculum Vitae (CV)", "cv", ".pdf", true)}
              {fileInp("Diplôme le plus élevé", "diplome", ".pdf", true)}
              {fileInp("Pièce d'identité", "piece_identite", ".pdf,image/*", true)}
              {fileInp("Lettre de motivation (optionnelle)", "lettre_motivation", ".pdf", false)}
            </>
          )}

          {/* Navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "28px", paddingTop: "20px", borderTop: "1px solid #f3f4f6" }}>
            {etape > 0 ? (
              <button onClick={() => setEtape(e => e - 1)}
                style={{ padding: "11px 24px", border: "1.5px solid #d1d5db", borderRadius: "8px", background: "#fff", color: "#374151", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
                ← Précédent
              </button>
            ) : <div />}

            {etape < ETAPES.length - 1 ? (
              <button onClick={suivant}
                style={{ padding: "11px 28px", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
                Suivant →
              </button>
            ) : (
              <button onClick={soumettre} disabled={chargement}
                style={{ padding: "11px 28px", background: chargement ? "#93c5fd" : "#1d4ed8", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 700, cursor: chargement ? "not-allowed" : "pointer" }}>
                {chargement ? "Envoi en cours..." : annonce_id ? "Soumettre et postuler" : "Terminer mon profil"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}