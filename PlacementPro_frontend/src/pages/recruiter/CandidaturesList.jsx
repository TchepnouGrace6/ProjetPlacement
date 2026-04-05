import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Star } from 'lucide-react';
import { getMesCandidatures } from '../../api/recruiter';
import { showToast } from '../../components/Toast';
import '../../styles/pp-base.css';
import '../../styles/candidatures.css';

const BADGE_MAP = {
  soumise:'pp-badge-orange', acceptee:'pp-badge-green', rejetee:'pp-badge-red',
  en_attente:'pp-badge-blue', shortlistee:'pp-badge-gold', acceptee_offre:'pp-badge-green',
};
const LABEL_MAP = {
  soumise:'Soumise', acceptee:'Acceptée', rejetee:'Rejetée',
  en_attente:'En attente', shortlistee:'Shortlistée', acceptee_offre:'Offre acceptée',
};

export default function CandidaturesList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [candidatures, setCandidatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatut, setFilterStatut] = useState(searchParams.get('statut') || '');

  useEffect(() => { charger(); }, [filterStatut]);

  const charger = async () => {
    try {
      setLoading(true);
      const res = await getMesCandidatures();
      let data = res.data || [];
      if (filterStatut) data = data.filter(c => c.statut === filterStatut);
      setCandidatures(data);
    } catch {
      showToast('Impossible de charger les candidatures', 'error');
    } finally { setLoading(false); }
  };

  const scoreClass = (n) => n ? `pp-score pp-score-${n}` : 'pp-score pp-score-none';

  return (
    <div className="pp-page">
      <div className="pp-inner">

        <div className="pp-header pp-anim-1">
          <div>
            <div className="pp-eyebrow">Suivi RH</div>
            <h1>Candidatures <em>reçues</em></h1>
            <p className="pp-header-sub">Évaluez et gérez tous les profils postulants</p>
          </div>
        </div>

        <div className="pp-filters pp-anim-2">
          <select className="pp-select" value={filterStatut} onChange={e => setFilterStatut(e.target.value)}>
            <option value="">Tous les statuts</option>
            <option value="soumise">Soumise</option>
            <option value="en_attente">En attente</option>
            <option value="shortlistee">Shortlistée</option>
            <option value="acceptee">Acceptée</option>
            <option value="rejetee">Rejetée</option>
            <option value="acceptee_offre">Offre acceptée</option>
          </select>
          <span className="pp-filter-count">{candidatures.length} résultat(s)</span>
        </div>

        {loading ? (
          <div className="pp-loader"><div className="pp-spin" /><span>Chargement…</span></div>
        ) : candidatures.length > 0 ? (
          <div className="pp-cand-table-wrap pp-anim-3">
            <table className="pp-cand-table">
              <thead>
                <tr>
                  <th>Candidat</th>
                  <th>Annonce</th>
                  <th>Date</th>
                  <th>Score</th>
                  <th>Statut</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {candidatures.map((c, i) => (
                  <tr key={c.id} style={{ animationDelay: `${i * 0.04}s` }}
                    onClick={() => navigate(`/recruiter/candidatures/${c.id}`)}>
                    <td>
                      <div className="pp-cand-name-cell">
                        <div className="pp-cand-avatar">
                          {(c.candidat_nom || 'C').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="pp-cand-name">{c.candidat_nom}</div>
                          <div className="pp-cand-email">{c.candidat_email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:'var(--text-2)',fontSize:12}}>
                      {c.annonce_titre}
                    </td>
                    <td style={{color:'var(--text-2)',fontSize:12,whiteSpace:'nowrap'}}>
                      {new Date(c.date_soumission).toLocaleDateString('fr-FR', {day:'numeric',month:'short'})}
                    </td>
                    <td>
                      {c.note_score
                        ? <span className={scoreClass(c.note_score)}>{'★'.repeat(c.note_score)} {c.note_score}/5</span>
                        : <span className="pp-score pp-score-none">—</span>
                      }
                    </td>
                    <td>
                      <span className={`pp-badge ${BADGE_MAP[c.statut] || 'pp-badge-gray'}`}>
                        {LABEL_MAP[c.statut] || c.statut}
                      </span>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <a className="pp-cand-link"
                        onClick={() => navigate(`/recruiter/candidatures/${c.id}`)}>
                        Détail <ArrowRight size={11} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="pp-empty pp-anim-3">
            <div className="pp-empty-icon">🕊️</div>
            <h3>Aucune candidature</h3>
            <p>{filterStatut ? 'Aucune candidature avec ce statut.' : 'Aucune candidature reçue pour le moment.'}</p>
          </div>
        )}
      </div>
    </div>
  );
}