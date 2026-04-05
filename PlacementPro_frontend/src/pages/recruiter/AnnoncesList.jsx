import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, MapPin, Briefcase, Plus, Pencil, Trash2, Eye } from 'lucide-react';
import { getMesAnnonces, supprimerAnnonce } from '../../api/recruiter';
import { showToast } from '../../components/Toast';
import '../../styles/pp-base.css';
import '../../styles/annonces.css';

const BADGE_MAP = {
  publiee: 'pp-badge-green', publiée: 'pp-badge-green', active: 'pp-badge-green',
  brouillon: 'pp-badge-gray',
  fermee: 'pp-badge-red', fermée: 'pp-badge-red',
  archivee: 'pp-badge-orange', archivée: 'pp-badge-orange',
};

const CONTRAT_LABEL = {
  cdi: 'CDI', cdd: 'CDD', stage: 'Stage',
  alternance: 'Alternance', freelance: 'Freelance',
};

export default function AnnoncesList() {
  const navigate = useNavigate();
  const [annonces, setAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatut, setFilterStatut] = useState('');

  useEffect(() => { charger(); }, [filterStatut]);

  const charger = async () => {
    try {
      setLoading(true);
      const res = await getMesAnnonces();
      let data = res.data || [];
      if (filterStatut) data = data.filter(a => a.statut === filterStatut);
      setAnnonces(data);
    } catch {
      showToast('Impossible de charger les annonces', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette annonce ?')) return;
    try {
      await supprimerAnnonce(id);
      setAnnonces(a => a.filter(x => x.id !== id));
      showToast('Annonce supprimée', 'success');
    } catch {
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  return (
    <div className="pp-page">
      <div className="pp-inner">

        {/* HEADER */}
        <div className="pp-header pp-anim-1">
          <div className="pp-header-left">
            <div className="pp-eyebrow">Recrutement</div>
            <h1>Mes <em>annonces</em></h1>
            <p className="pp-header-sub">Gérez et suivez toutes vos offres d'emploi</p>
          </div>
          <button className="pp-btn pp-btn-terra" onClick={() => navigate('/recruiter/annonces/create')}>
            <Plus size={15} /> Nouvelle annonce
          </button>
        </div>

        {/* FILTERS */}
        <div className="pp-filters pp-anim-2">
          <select className="pp-select" value={filterStatut} onChange={e => setFilterStatut(e.target.value)}>
            <option value="">Tous les statuts</option>
            <option value="brouillon">Brouillon</option>
            <option value="publiee">Publiée</option>
            <option value="fermee">Fermée</option>
            <option value="archivee">Archivée</option>
          </select>
          <span className="pp-filter-count">{annonces.length} annonce(s)</span>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="pp-loader"><div className="pp-spin" /><span>Chargement…</span></div>
        ) : annonces.length > 0 ? (
          <div className="pp-annonces-grid pp-anim-3">
            {annonces.map((a, i) => {
              const pct = Math.min((a.nombre_candidatures || 0) * 12, 100);
              return (
                <div key={a.id} className="pp-annonce-card" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="pp-annonce-card-top">
                    <h3>{a.titre}</h3>
                    <span className={`pp-badge ${BADGE_MAP[a.statut] || 'pp-badge-gray'}`}>{a.statut}</span>
                  </div>

                  <div className="pp-annonce-card-body">
                    {a.secteur_activite && (
                      <div className="pp-annonce-meta">
                        <Briefcase size={12} color="var(--terra)" />
                        {a.secteur_activite}
                      </div>
                    )}
                    {a.localisation && (
                      <div className="pp-annonce-meta">
                        <MapPin size={12} color="var(--text-3)" />
                        {a.localisation}
                      </div>
                    )}
                    <div className="pp-annonce-meta">
                      <span style={{background:'var(--cream-mid)',padding:'2px 8px',borderRadius:'99px',fontSize:'11px',fontWeight:600}}>
                        {CONTRAT_LABEL[a.type_contrat] || a.type_contrat}
                      </span>
                    </div>
                    {a.salaire_min && a.salaire_max && (
                      <div className="pp-annonce-salary">
                        💰 {a.salaire_min.toLocaleString()} – {a.salaire_max.toLocaleString()} €
                      </div>
                    )}
                    <div className="pp-cand-count" style={{marginTop:8}}>
                      <Users size={13} />
                      <span>{a.nombre_candidatures ?? 0} candidat(s)</span>
                      <span className="pp-cand-pill">{pct}%</span>
                    </div>
                    <div className="pp-prog">
                      <div className="pp-prog-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <div className="pp-annonce-card-actions">
                    <button className="pp-btn pp-btn-ghost pp-btn-sm"
                      onClick={() => navigate(`/recruiter/annonces/${a.id}`)}>
                      <Eye size={13} /> Voir
                    </button>
                    <button className="pp-btn pp-btn-primary pp-btn-sm"
                      onClick={() => navigate(`/recruiter/annonces/${a.id}/edit`)}>
                      <Pencil size={13} /> Modifier
                    </button>
                    <button className="pp-btn pp-btn-danger pp-btn-sm"
                      onClick={() => handleDelete(a.id)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="pp-empty pp-anim-3">
            <div className="pp-empty-icon">📭</div>
            <h3>Aucune annonce</h3>
            <p>Créez votre première offre pour commencer à recevoir des candidatures.</p>
            <button className="pp-btn pp-btn-terra" onClick={() => navigate('/recruiter/annonces/create')}>
              <Plus size={14} /> Créer une annonce
            </button>
          </div>
        )}
      </div>
    </div>
  );
}