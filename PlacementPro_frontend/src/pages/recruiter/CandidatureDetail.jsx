import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Pencil, X, Check } from 'lucide-react';
import { getCandidatureDetail, mettreAJourCandidature, ajouterFavori } from '../../api/recruiter';
import { showToast } from '../../components/Toast';
import '../../styles/pp-base.css';
import '../../styles/candidature-detail.css';

const STATUTS = ['soumise','en_attente','shortlistee','acceptee','rejetee','acceptee_offre'];
const STATUT_LABEL = {
  soumise:'Soumise', en_attente:'En attente', shortlistee:'Shortlistée',
  acceptee:'Acceptée', rejetee:'Rejetée', acceptee_offre:'Offre acceptée',
};
const BADGE_MAP = {
  soumise:'pp-badge-orange', acceptee:'pp-badge-green', rejetee:'pp-badge-red',
  en_attente:'pp-badge-blue', shortlistee:'pp-badge-gold', acceptee_offre:'pp-badge-green',
};
const CHIP_COLORS = {
  soumise: 'var(--warning-bg)',      rejetee: 'var(--danger-bg)',
  acceptee: 'var(--success-bg)',     en_attente: 'var(--info-bg)',
  shortlistee: 'rgba(196,162,83,.12)', acceptee_offre: 'var(--success-bg)',
};
const CHIP_TEXT = {
  soumise: 'var(--warning-text)',   rejetee: 'var(--danger-text)',
  acceptee: 'var(--success-text)', en_attente: 'var(--info-text)',
  shortlistee: '#7a5a0a',          acceptee_offre: 'var(--success-text)',
};

export default function CandidatureDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidature, setCandidature] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ statut:'', notes_recruteur:'', note_score:'' });
  const [hoverStar, setHoverStar] = useState(0);

  useEffect(() => { charger(); }, [id]);

  const charger = async () => {
    try {
      setLoading(true);
      const res = await getCandidatureDetail(id);
      setCandidature(res.data);
      setFormData({ statut: res.data.statut, notes_recruteur: res.data.notes_recruteur || '', note_score: res.data.note_score || '' });
    } catch { showToast('Impossible de charger la candidature', 'error'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    try {
      await mettreAJourCandidature(id, {
        statut: formData.statut,
        notes_recruteur: formData.notes_recruteur,
        note_score: formData.note_score ? parseInt(formData.note_score) : null,
      });
      setEditing(false);
      charger();
      showToast('Candidature mise à jour', 'success');
    } catch { showToast('Erreur lors de la mise à jour', 'error'); }
  };

  const handleFavori = async () => {
    try {
      const raison = prompt("Raison de l'ajout en favori :");
      if (raison !== null) {
        await ajouterFavori(candidature.candidat_info.id, raison);
        showToast('Candidat ajouté aux favoris', 'success');
      }
    } catch { showToast("Erreur lors de l'ajout", 'error'); }
  };

  if (loading) return <div className="pp-page"><div className="pp-inner"><div className="pp-loader"><div className="pp-spin" /><span>Chargement…</span></div></div></div>;
  if (!candidature) return null;

  const c = candidature.candidat_info;
  const initials = `${(c.prenom||'')[0]||''}${(c.nom||'')[0]||''}`.toUpperCase() || '?';

  return (
    <div className="pp-page">
      <div className="pp-inner">

        <a className="pp-back" onClick={() => navigate('/recruiter/candidatures')} style={{cursor:'pointer'}}>
          <ArrowLeft size={14} /> Retour aux candidatures
        </a>

        <div className="pp-header pp-anim-1">
          <div>
            <div className="pp-eyebrow">Dossier candidat</div>
            <h1>{c.nom} <em>{c.prenom}</em></h1>
            <p className="pp-header-sub">Candidature pour : {candidature.annonce_titre}</p>
          </div>
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            <span className={`pp-badge ${BADGE_MAP[candidature.statut]||'pp-badge-gray'}`} style={{fontSize:12,padding:'6px 14px'}}>
              {STATUT_LABEL[candidature.statut]||candidature.statut}
            </span>
          </div>
        </div>

        <div className="pp-detail-grid pp-anim-2">

          {/* LEFT — PROFIL */}
          <div>
            <div className="pp-profile-card">
              <div className="pp-profile-hero">
                <div className="pp-profile-big-av">{initials}</div>
                <div>
                  <div className="pp-profile-name">{c.prenom} <em>{c.nom}</em></div>
                  <div className="pp-profile-annonce">{candidature.annonce_titre}</div>
                </div>
              </div>
              <div className="pp-profile-body">
                {[
                  { label:'Email',      val: <a href={`mailto:${c.email}`}>{c.email}</a> },
                  { label:'Téléphone',  val: c.telephone },
                  { label:'Ville',      val: c.ville },
                  { label:'Secteur',    val: c.secteur },
                  { label:'Compétences',val: c.competences },
                ].map(row => row.val ? (
                  <div className="pp-info-row" key={row.label}>
                    <span className="pp-info-label">{row.label}</span>
                    <span className="pp-info-val">{row.val}</span>
                  </div>
                ) : null)}

                {(c.cv || c.diplome) && (
                  <div style={{marginTop:16}}>
                    <div className="pp-block-label">Documents</div>
                    <div className="pp-doc-links">
                      {c.cv     && <a href={c.cv}     target="_blank" rel="noopener noreferrer" className="pp-doc-link">📄 CV</a>}
                      {c.diplome && <a href={c.diplome} target="_blank" rel="noopener noreferrer" className="pp-doc-link">🎓 Diplôme</a>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT — CANDIDATURE */}
          <div>
            <div className="pp-cand-panel pp-anim-3">
              <div className="pp-cand-panel-head">
                <span className="pp-cand-panel-title">Évaluation</span>
                <div style={{display:'flex',gap:8}}>
                  {!editing && (
                    <button className="pp-btn pp-btn-ghost pp-btn-sm" onClick={() => setEditing(true)}>
                      <Pencil size={12} /> Modifier
                    </button>
                  )}
                  <button className="pp-btn pp-btn-ghost pp-btn-sm" onClick={handleFavori}>
                    <Star size={12} /> Favoris
                  </button>
                </div>
              </div>

              <div className="pp-cand-panel-body">
                {editing ? (
                  <div className="pp-edit-form">
                    <div className="pp-field">
                      <label className="pp-label">Statut</label>
                      <select className="pp-select-field" value={formData.statut}
                        onChange={e => setFormData(f => ({...f, statut: e.target.value}))}>
                        {STATUTS.map(s => <option key={s} value={s}>{STATUT_LABEL[s]}</option>)}
                      </select>
                    </div>

                    <div className="pp-field">
                      <label className="pp-label">Note (1–5)</label>
                      <div className="pp-stars">
                        {[1,2,3,4,5].map(n => (
                          <span key={n}
                            className={`pp-star ${(hoverStar||parseInt(formData.note_score)) >= n ? 'active' : ''}`}
                            onMouseEnter={() => setHoverStar(n)}
                            onMouseLeave={() => setHoverStar(0)}
                            onClick={() => setFormData(f => ({...f, note_score: String(n)}))}>★</span>
                        ))}
                      </div>
                    </div>

                    <div className="pp-field">
                      <label className="pp-label">Notes personnelles</label>
                      <textarea className="pp-textarea" rows={4}
                        value={formData.notes_recruteur}
                        onChange={e => setFormData(f => ({...f, notes_recruteur: e.target.value}))}
                        placeholder="Annotations confidentielles…" />
                    </div>

                    <div className="pp-detail-actions">
                      <button className="pp-btn pp-btn-terra" onClick={handleSubmit}>
                        <Check size={13} /> Enregistrer
                      </button>
                      <button className="pp-btn pp-btn-ghost" onClick={() => setEditing(false)}>
                        <X size={13} /> Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Statut chips */}
                    <div className="pp-block-label" style={{marginBottom:10}}>Parcours du dossier</div>
                    <div className="pp-status-bar" style={{marginBottom:20}}>
                      {STATUTS.map(s => (
                        <span key={s} className="pp-status-chip"
                          style={{
                            background: candidature.statut === s ? CHIP_COLORS[s] : 'var(--cream)',
                            color: candidature.statut === s ? CHIP_TEXT[s] : 'var(--text-3)',
                            borderColor: candidature.statut === s ? 'transparent' : 'var(--cream-border)',
                            fontWeight: candidature.statut === s ? 700 : 400,
                          }}>
                          {STATUT_LABEL[s]}
                        </span>
                      ))}
                    </div>

                    <div style={{display:'flex',gap:20,marginBottom:20,flexWrap:'wrap'}}>
                      <div>
                        <div className="pp-block-label">Date de soumission</div>
                        <div style={{fontSize:14,fontWeight:500,color:'var(--navy)',marginTop:4}}>
                          {new Date(candidature.date_soumission).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}
                        </div>
                      </div>
                      <div>
                        <div className="pp-block-label">Score</div>
                        <div className="pp-stars" style={{marginTop:4,pointerEvents:'none'}}>
                          {[1,2,3,4,5].map(n => (
                            <span key={n} className={`pp-star ${candidature.note_score >= n ? 'active' : ''}`}
                              style={{fontSize:16}}>★</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {candidature.lettre_motivation && (
                      <>
                        <div className="pp-block-label">Lettre de motivation</div>
                        <div className="pp-text-block">{candidature.lettre_motivation}</div>
                      </>
                    )}

                    {candidature.notes_recruteur && (
                      <>
                        <div className="pp-block-label">Notes du recruteur</div>
                        <div className="pp-text-block" style={{borderLeft:'3px solid var(--terra)',paddingLeft:14}}>
                          {candidature.notes_recruteur}
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}