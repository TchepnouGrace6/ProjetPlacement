import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Send, FileText, Settings, Megaphone } from 'lucide-react';
import { getAnnonceRecruteur, creerAnnonce, modifierAnnonce } from '../../api/recruiter';
import { showToast } from '../../components/Toast';
import '../../styles/pp-base.css';
import '../../styles/form-annonce.css';

const CONTRATS = ['cdi','cdd','stage','alternance','freelance'];
const CONTRAT_LABEL = { cdi:'CDI', cdd:'CDD', stage:'Stage', alternance:'Alternance', freelance:'Freelance' };

const Field = ({ label, req, children }) => (
  <div className="pp-field">
    <label className="pp-label">{label}{req && <span className="req">*</span>}</label>
    {children}
  </div>
);

export default function AnnonceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    titre: '', description: '', competences_requises: '', qualifications: '',
    secteur_activite: '', localisation: '', type_contrat: 'cdi',
    salaire_min: '', salaire_max: '', date_debut: '', nombre_postes: 1, statut: 'brouillon',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (isEdit) charger(); }, [id]);

  const charger = async () => {
    try {
      setLoading(true);
      const res = await getAnnonceRecruteur(id);
      setFormData(res.data);
    } catch { showToast("Impossible de charger l'annonce", 'error'); }
    finally { setLoading(false); }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['nombre_postes','salaire_min','salaire_max'].includes(name)
        ? (value === '' ? '' : parseInt(value)) : value,
    }));
  };

  const handleSubmit = async (e, statutOverride) => {
    e.preventDefault();
    if (!formData.titre || !formData.description || !formData.date_debut) {
      showToast('Remplissez les champs obligatoires', 'warning');
      return;
    }
    const payload = statutOverride ? { ...formData, statut: statutOverride } : formData;
    try {
      setLoading(true);
      if (isEdit) {
        await modifierAnnonce(id, payload);
        showToast('Annonce modifiée avec succès', 'success');
      } else {
        await creerAnnonce(payload);
        showToast('Annonce créée avec succès', 'success');
        setTimeout(() => navigate('/recruiter/annonces'), 1200);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur lors de la sauvegarde', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="pp-page">
      <div className="pp-inner">
        <a className="pp-back" onClick={() => navigate('/recruiter/annonces')} style={{cursor:'pointer'}}>
          <ArrowLeft size={14} /> Retour aux annonces
        </a>

        <div className="pp-header pp-anim-1">
          <div>
            <div className="pp-eyebrow">{isEdit ? 'Modification' : 'Nouvelle offre'}</div>
            <h1>{isEdit ? <><em>Modifier</em> l'annonce</> : <>Créer une <em>annonce</em></>}</h1>
            <p className="pp-header-sub">
              {isEdit ? 'Mettez à jour les informations de votre offre.' : 'Publiez votre offre en quelques étapes simples.'}
            </p>
          </div>
        </div>

        {loading && !formData.titre ? (
          <div className="pp-loader"><div className="pp-spin" /><span>Chargement…</span></div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="pp-form-layout pp-anim-2">

              {/* MAIN COLUMN */}
              <div>

                {/* Section 1 */}
                <div className="pp-form-section">
                  <div className="pp-form-section-head">
                    <div className="pp-form-section-num">1</div>
                    <div>
                      <div className="pp-form-section-title">Informations de base</div>
                    </div>
                    <FileText size={16} color="var(--text-3)" style={{marginLeft:'auto'}} />
                  </div>
                  <div className="pp-form-body">
                    <Field label="Titre du poste" req>
                      <input className="pp-input" name="titre" value={formData.titre}
                        onChange={handleChange} placeholder="Ex: Développeur Frontend React" required />
                    </Field>
                    <div className="pp-form-row">
                      <Field label="Secteur d'activité">
                        <input className="pp-input" name="secteur_activite" value={formData.secteur_activite}
                          onChange={handleChange} placeholder="Ex: Technologie, Finance" />
                      </Field>
                      <Field label="Localisation" req>
                        <input className="pp-input" name="localisation" value={formData.localisation}
                          onChange={handleChange} placeholder="Ex: Paris, France" required />
                      </Field>
                    </div>
                    <Field label="Description" req>
                      <textarea className="pp-textarea" name="description" value={formData.description}
                        onChange={handleChange} rows={6}
                        placeholder="Décrivez le poste, les responsabilités, l'équipe…" required />
                    </Field>
                  </div>
                </div>

                {/* Section 2 */}
                <div className="pp-form-section">
                  <div className="pp-form-section-head">
                    <div className="pp-form-section-num">2</div>
                    <div className="pp-form-section-title">Détails du poste</div>
                    <Settings size={16} color="var(--text-3)" style={{marginLeft:'auto'}} />
                  </div>
                  <div className="pp-form-body">
                    <div className="pp-form-row">
                      <Field label="Type de contrat">
                        <select className="pp-select-field" name="type_contrat" value={formData.type_contrat} onChange={handleChange}>
                          {CONTRATS.map(c => <option key={c} value={c}>{CONTRAT_LABEL[c]}</option>)}
                        </select>
                      </Field>
                      <Field label="Nb de postes">
                        <input className="pp-input" type="number" name="nombre_postes"
                          value={formData.nombre_postes} onChange={handleChange} min="1" />
                      </Field>
                      <Field label="Date de début" req>
                        <input className="pp-input" type="date" name="date_debut"
                          value={formData.date_debut} onChange={handleChange} required />
                      </Field>
                    </div>
                    <div className="pp-form-row">
                      <Field label="Salaire min (€)">
                        <input className="pp-input" type="number" name="salaire_min"
                          value={formData.salaire_min} onChange={handleChange} placeholder="Ex: 30000" />
                      </Field>
                      <Field label="Salaire max (€)">
                        <input className="pp-input" type="number" name="salaire_max"
                          value={formData.salaire_max} onChange={handleChange} placeholder="Ex: 45000" />
                      </Field>
                    </div>
                    <Field label="Compétences requises">
                      <textarea className="pp-textarea" name="competences_requises"
                        value={formData.competences_requises} onChange={handleChange} rows={3}
                        placeholder="Ex: React, JavaScript, CSS (séparées par des virgules)" />
                    </Field>
                    <Field label="Qualifications">
                      <textarea className="pp-textarea" name="qualifications"
                        value={formData.qualifications} onChange={handleChange} rows={3}
                        placeholder="Ex: Bac+5 en Informatique, 3 ans d'expérience" />
                    </Field>
                  </div>
                </div>

              </div>

              {/* SIDEBAR */}
              <div>
                <div className="pp-sidebar-card pp-anim-3">
                  <h3>Publication</h3>
                  <div className="pp-field">
                    <label className="pp-label">Statut de l'annonce</label>
                    <select className="pp-select-field" name="statut" value={formData.statut} onChange={handleChange}>
                      <option value="brouillon">Brouillon</option>
                      <option value="publiee">Publiée</option>
                      <option value="fermee">Fermée</option>
                      <option value="archivee">Archivée</option>
                    </select>
                  </div>

                  <div className="pp-sidebar-sep" />

                  <div className="pp-sidebar-actions">
                    <button type="submit" className="pp-btn pp-btn-terra" disabled={loading}
                      style={{justifyContent:'center'}}>
                      <Save size={14} />
                      {loading ? 'Enregistrement…' : isEdit ? 'Sauvegarder' : 'Créer le brouillon'}
                    </button>
                    {!isEdit && (
                      <button type="button" className="pp-btn pp-btn-primary"
                        style={{justifyContent:'center'}}
                        onClick={e => handleSubmit(e, 'publiee')} disabled={loading}>
                        <Send size={14} /> Publier maintenant
                      </button>
                    )}
                    <button type="button" className="pp-btn pp-btn-ghost"
                      style={{justifyContent:'center'}}
                      onClick={() => navigate('/recruiter/annonces')}>
                      Annuler
                    </button>
                  </div>

                  <div className="pp-sidebar-sep" />
                  <div className="pp-sidebar-tip">
                    <strong>Conseil :</strong> Un titre précis et une description détaillée augmentent de 3× les candidatures qualifiées.
                  </div>
                </div>
              </div>

            </div>
          </form>
        )}
      </div>
    </div>
  );
}