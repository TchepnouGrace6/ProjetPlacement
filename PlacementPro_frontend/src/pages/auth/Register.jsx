import { useState } from "react";
import { inscriptionCandidat, inscriptionRecruteur } from "../../api/auth";
import { useNavigate, Link } from "react-router-dom";
import { User, Building2 } from "lucide-react";

export default function Register() {
  const [role, setRole] = useState("candidat");
  const [chargement, setChargement] = useState(false);
  const [succes, setSucces] = useState("");
  const [erreur, setErreur] = useState("");
  const navigate = useNavigate();

  const [formCandidat, setFormCandidat] = useState({ email: "", password: "", confirm: "" });
  const [formRecruteur, setFormRecruteur] = useState({
    email: "", password: "",
    nom_entreprise: "", secteur_activite: "", ville: "",
    adresse: "", telephone: "", description: "",
    taille_entreprise: "Petite (1-50)",
    registre_commerce: null,
    certificat_immatriculation: null,
    patente: null,
  });

  const handleCandidat = (e) => setFormCandidat({ ...formCandidat, [e.target.name]: e.target.value });

  const handleRecruteur = (e) => {
    if (e.target.type === "file") {
      setFormRecruteur({ ...formRecruteur, [e.target.name]: e.target.files[0] });
    } else {
      setFormRecruteur({ ...formRecruteur, [e.target.name]: e.target.value });
    }
  };

  const submitCandidat = async (e) => {
    e.preventDefault();
    setErreur("");
    if (formCandidat.password !== formCandidat.confirm) {
      setErreur("Les mots de passe ne correspondent pas.");
      return;
    }
    setChargement(true);
    try {
      await inscriptionCandidat({ email: formCandidat.email, password: formCandidat.password });
      navigate("/connexion?inscrit=1");
    } catch (err) {
      setErreur(err.response?.data?.email?.[0] || "Erreur lors de l'inscription.");
    } finally {
      setChargement(false);
    }
  };

  const submitRecruteur = async (e) => {
    e.preventDefault();
    setErreur("");
    setChargement(true);
    try {
      const data = new FormData();
      Object.entries(formRecruteur).forEach(([k, v]) => { if (v) data.append(k, v); });
      await inscriptionRecruteur(data);
      setSucces("Votre demande a été soumise. Vous recevrez un email après validation.");
    } catch (err) {
      setErreur("Erreur lors de la soumission. Vérifiez tous les champs.");
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
            <span className="auth-tab active">Inscription</span>
            <Link to="/connexion" className="auth-tab">Connexion</Link>
          </div>

          <h2 className="auth-title">Créer un compte</h2>
          <p className="auth-sub">Rejoignez PlacementPro dès aujourd'hui</p>

          <p className="auth-section-label">Je suis</p>
          <div className="auth-role-grid">
            <div className={`auth-role-card ${role === "candidat" ? "active" : ""}`} onClick={() => setRole("candidat")}>
              <div className="auth-role-icon"><User size={32} /></div>
              <div className="auth-role-name">Candidat</div>
              <div className="auth-role-hint">Je cherche un emploi</div>
            </div>
            <div className={`auth-role-card ${role === "recruteur" ? "active" : ""}`} onClick={() => setRole("recruteur")}>
              <div className="auth-role-icon"><Building2 size={32} /></div>
              <div className="auth-role-name">Recruteur</div>
              <div className="auth-role-hint">Je recrute des talents</div>
            </div>
          </div>

          {erreur && <div className="alert alert-danger py-2 small">{erreur}</div>}
          {succes && <div className="alert alert-success py-2 small">{succes}</div>}

          {role === "candidat" && (
            <form onSubmit={submitCandidat}>
              <div className="alert auth-alert-info small">
                Créez votre compte en 1 minute. Vous compléterez votre profil après connexion.
              </div>
              <div className="mb-3">
                <label className="form-label">Adresse email</label>
                <input type="email" name="email" className="form-control" placeholder="exemple@email.com" value={formCandidat.email} onChange={handleCandidat} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Mot de passe</label>
                <input type="password" name="password" className="form-control" placeholder="8 caractères minimum" value={formCandidat.password} onChange={handleCandidat} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Confirmer le mot de passe</label>
                <input type="password" name="confirm" className="form-control" placeholder="••••••••" value={formCandidat.confirm} onChange={handleCandidat} required />
              </div>
              <button type="submit" className="btn auth-btn-main w-100" disabled={chargement}>
                {chargement ? "Création..." : "Créer mon compte"}
              </button>
            </form>
          )}

          {role === "recruteur" && (
            <form onSubmit={submitRecruteur}>
              <div className="alert auth-alert-warning small">
                Votre compte sera activé après vérification de vos documents (24–48h). Un email vous sera envoyé.
              </div>

              <p className="auth-section-label">Compte</p>
              <div className="row g-2 mb-2">
                <div className="col-6">
                  <label className="form-label">Email</label>
                  <input type="email" name="email" className="form-control" placeholder="rh@entreprise.cm" value={formRecruteur.email} onChange={handleRecruteur} required />
                </div>
                <div className="col-6">
                  <label className="form-label">Mot de passe</label>
                  <input type="password" name="password" className="form-control" placeholder="••••••••" value={formRecruteur.password} onChange={handleRecruteur} required />
                </div>
              </div>

              <p className="auth-section-label">Informations entreprise</p>
              <div className="mb-2">
                <label className="form-label">Nom de l'entreprise</label>
                <input name="nom_entreprise" className="form-control" placeholder="Orange Cameroun SA" value={formRecruteur.nom_entreprise} onChange={handleRecruteur} required />
              </div>
              <div className="row g-2 mb-2">
                <div className="col-6">
                  <label className="form-label">Secteur d'activité</label>
                  <input name="secteur_activite" className="form-control" placeholder="Télécommunications" value={formRecruteur.secteur_activite} onChange={handleRecruteur} required />
                </div>
                <div className="col-6">
                  <label className="form-label">Ville</label>
                  <input name="ville" className="form-control" placeholder="Douala" value={formRecruteur.ville} onChange={handleRecruteur} required />
                </div>
              </div>
              <div className="row g-2 mb-2">
                <div className="col-6">
                  <label className="form-label">Téléphone</label>
                  <input name="telephone" className="form-control" placeholder="+237 6XX XXX XXX" value={formRecruteur.telephone} onChange={handleRecruteur} required />
                </div>
                <div className="col-6">
                  <label className="form-label">Taille entreprise</label>
                  <select name="taille_entreprise" className="form-select" value={formRecruteur.taille_entreprise} onChange={handleRecruteur}>
                    <option>Petite (1-50)</option>
                    <option>Moyenne (51-200)</option>
                    <option>Grande (200+)</option>
                  </select>
                </div>
              </div>
              <div className="mb-2">
                <label className="form-label">Adresse</label>
                <input name="adresse" className="form-control" placeholder="Rue de la Joie, Akwa" value={formRecruteur.adresse} onChange={handleRecruteur} required />
              </div>
              <div className="mb-2">
                <label className="form-label">Description</label>
                <textarea name="description" className="form-control" rows="2" placeholder="Décrivez brièvement votre entreprise..." value={formRecruteur.description} onChange={handleRecruteur} required />
              </div>

              <p className="auth-section-label">Documents de certification (PDF obligatoires)</p>
              <div className="mb-2">
                <label className="form-label">Registre de commerce</label>
                <input type="file" name="registre_commerce" className="form-control" accept=".pdf" onChange={handleRecruteur} required />
              </div>
              <div className="mb-2">
                <label className="form-label">Certificat d'immatriculation</label>
                <input type="file" name="certificat_immatriculation" className="form-control" accept=".pdf" onChange={handleRecruteur} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Patente</label>
                <input type="file" name="patente" className="form-control" accept=".pdf" onChange={handleRecruteur} required />
              </div>

              <button type="submit" className="btn auth-btn-main w-100" disabled={chargement}>
                {chargement ? "Envoi en cours..." : "Soumettre ma demande"}
              </button>
            </form>
          )}

          <p className="auth-footer-note">
            Déjà inscrit ? <Link to="/connexion" className="auth-link">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}