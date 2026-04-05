import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Pencil, Trash2, Mail, X, Check, Users } from 'lucide-react';
import { getMesFavoris, modifierFavori, supprimerFavori } from '../../api/recruiter';
import { showToast } from '../../components/Toast';
import '../../styles/pp-base.css';
import '../../styles/favoris.css';

export default function FavorisList() {
  const navigate = useNavigate();
  const [favoris, setFavoris] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editRaison, setEditRaison] = useState('');

  useEffect(() => { charger(); }, []);

  const charger = async () => {
    try {
      setLoading(true);
      const res = await getMesFavoris();
      setFavoris(res.data || []);
    } catch { showToast('Impossible de charger les favoris', 'error'); }
    finally { setLoading(false); }
  };

  const handleEditSave = async (id) => {
    try {
      await modifierFavori(id, editRaison);
      await charger();
      setEditingId(null);
      showToast('Favori mis à jour', 'success');
    } catch { showToast('Erreur lors de la mise à jour', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Retirer ce candidat des favoris ?')) return;
    try {
      await supprimerFavori(id);
      setFavoris(f => f.filter(x => x.id !== id));
      showToast('Candidat retiré des favoris', 'success');
    } catch { showToast('Erreur lors de la suppression', 'error'); }
  };

  return (
    <div className="pp-page">
      <div className="pp-inner">

        <div className="pp-header pp-anim-1">
          <div>
            <div className="pp-eyebrow">Vivier de talents</div>
            <h1>Mes <em>favoris</em></h1>
            <p className="pp-header-sub">Vos candidats en shortlist, prêts à être recontactés</p>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{
              background:'var(--white)', border:'.5px solid var(--cream-border)',
              borderRadius:'var(--r-xl)', padding:'12px 20px', textAlign:'center',
              boxShadow:'var(--shadow)',
            }}>
              <div style={{fontFamily:'var(--font-serif)',fontSize:32,fontWeight:700,color:'var(--terra)',lineHeight:1}}>
                {favoris.length}
              </div>
              <div style={{fontSize:11,color:'var(--text-3)',marginTop:4}}>candidat(s)</div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="pp-loader"><div className="pp-spin" /><span>Chargement…</span></div>
        ) : favoris.length > 0 ? (
          <div className="pp-favoris-grid pp-anim-2">
            {favoris.map((f, i) => (
              <div key={f.id} className="pp-favori-card" style={{ animationDelay: `${i * 0.06}s` }}>

                {/* TOP */}
                <div className="pp-favori-card-top">
                  <div className="pp-fav-avatar">
                    {(f.candidat_nom || 'C').charAt(0).toUpperCase()}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div className="pp-fav-name">{f.candidat_nom}</div>
                    <div className="pp-fav-date">
                      Ajouté le {new Date(f.date_ajout).toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'})}
                    </div>
                  </div>
                  <div className="pp-fav-star-badge">
                    <Star size={10} /> Favori
                  </div>
                </div>

                {/* BODY */}
                <div className="pp-favori-card-body">
                  <a href={`mailto:${f.candidat_email}`} className="pp-fav-email">
                    <Mail size={12} /> {f.candidat_email}
                  </a>

                  {editingId === f.id ? (
                    <textarea
                      className="pp-fav-edit-area"
                      value={editRaison}
                      onChange={e => setEditRaison(e.target.value)}
                      placeholder="Raison du favori…"
                    />
                  ) : f.raison ? (
                    <div className="pp-fav-raison">{f.raison}</div>
                  ) : (
                    <div style={{fontSize:12,color:'var(--text-3)',fontStyle:'italic'}}>
                      Aucune raison renseignée
                    </div>
                  )}
                </div>

                {/* ACTIONS */}
                <div className="pp-favori-card-actions">
                  {editingId === f.id ? (
                    <>
                      <button className="pp-btn pp-btn-terra pp-btn-sm" onClick={() => handleEditSave(f.id)}>
                        <Check size={12} /> Enregistrer
                      </button>
                      <button className="pp-btn pp-btn-ghost pp-btn-sm" onClick={() => setEditingId(null)}>
                        <X size={12} /> Annuler
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="pp-btn pp-btn-ghost pp-btn-sm"
                        onClick={() => { setEditingId(f.id); setEditRaison(f.raison || ''); }}>
                        <Pencil size={12} /> Éditer
                      </button>
                      <button className="pp-btn pp-btn-ghost pp-btn-sm"
                        onClick={() => navigate('/recruiter/candidatures')}>
                        <Users size={12} /> Candidatures
                      </button>
                      <button className="pp-btn pp-btn-danger pp-btn-sm" style={{marginLeft:'auto'}}
                        onClick={() => handleDelete(f.id)}>
                        <Trash2 size={12} />
                      </button>
                    </>
                  )}
                </div>

              </div>
            ))}
          </div>
        ) : (
          <div className="pp-empty pp-anim-2">
            <div className="pp-empty-icon">⭐</div>
            <h3>Aucun favori</h3>
            <p>Ajoutez des candidats en shortlist depuis leurs dossiers pour les retrouver ici.</p>
            <button className="pp-btn pp-btn-primary" onClick={() => navigate('/recruiter/candidatures')}>
              <Users size={14} /> Voir les candidatures
            </button>
          </div>
        )}
      </div>
    </div>
  );
}