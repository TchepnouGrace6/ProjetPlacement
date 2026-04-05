import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase, Users, Star, Bell, Plus,
  MapPin, Calendar, ArrowUpRight, Eye, Sparkles, Inbox, Mail
} from 'lucide-react';
import { getMesAnnonces, getMesCandidatures, getMesFavoris } from '../../api/recruiter';
import '../../styles/recruiter-dashboard.css';

/* ── animated counter ── */
function Counter({ to, duration = 850 }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!to) { setV(0); return; }
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setV(Math.round(ease * to));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [to]);
  return <>{v}</>;
}

/* ── badge ── */
const BADGE = {
  publiée:'bd-green', publiee:'bd-green', active:'bd-green',
  soumise:'bd-orange',
  acceptée:'bd-blue', acceptee:'bd-blue',
  refusée:'bd-red',   refusee:'bd-red', rejetée:'bd-red', rejetee:'bd-red',
  fermée:'bd-gray',   fermee:'bd-gray', brouillon:'bd-gray',
  en_attente:'bd-blue',
};
const Badge = ({ statut }) => (
  <span className={`rb-badge ${BADGE[statut?.toLowerCase()] || 'bd-gray'}`}>{statut}</span>
);

/* ── date helper ── */
const fmtDate = (d) =>
  new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

const todayStr = new Date().toLocaleDateString('fr-FR', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
});

/* ════════════════════════════════════════════════════════════════ */
export default function RecruiterDashboard() {
  const [stats, setStats] = useState({
    totalAnnonces: 0, totalCandidatures: 0,
    totalFavoris: 0,  candidaturesNonLues: 0,
  });
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState(null);
  const [annonces,     setAnnonces]     = useState([]);
  const [candidatures, setCandidatures] = useState([]);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const [aR, cR, fR] = await Promise.all([
        getMesAnnonces(), getMesCandidatures(), getMesFavoris(),
      ]);
      const a = aR.data || [];
      const c = cR.data || [];
      const f = fR.data || [];
      setAnnonces(a.slice(0, 4));
      setCandidatures(c.slice(0, 4));
      setStats({
        totalAnnonces:       a.length,
        totalCandidatures:   c.length,
        totalFavoris:        f.length,
        candidaturesNonLues: c.filter(x => x.statut === 'soumise').length,
      });
      setError(null);
    } catch {
      setError('Impossible de charger les données.');
    } finally {
      setLoading(false);
    }
  };

  /* taux de réponse fictif (à remplacer par une vraie metric) */
  const tauxReponse = stats.totalCandidatures
    ? Math.round((stats.totalCandidatures - stats.candidaturesNonLues) / stats.totalCandidatures * 100)
    : 0;

  return (
    <div className="rb">
      <div className="rb-inner">

        {/* ── TOPBAR ── */}
        <nav className="rb-topbar">
          <div className="rb-logo">Placement<em>Pro</em></div>
          <div className="rb-topbar-right">
            <Link to="/recruiter/favoris"       className="rb-nav-btn">
              <Star size={13} /> Favoris
            </Link>
            <Link to="/recruiter/candidatures"  className="rb-nav-btn">
              <Eye size={13} /> Candidatures
            </Link>
            <Link to="/recruiter/annonces/create" className="rb-cta-btn">
              <Plus size={13} /> Nouvelle annonce
            </Link>
            <div className="rb-avatar">R</div>
          </div>
        </nav>

        {error && <div className="rb-err">⚠ {error}</div>}

        {loading ? (
          <div className="rb-loader">
            <div className="rb-spin" />
            <span>Chargement de votre espace…</span>
          </div>
        ) : (
          <div className="rb-bento">

            {/* ── HERO CARD ── */}
            <div className="rb-card rb-hero rb-hero-card">
              <div>
                <div className="rb-hero-tag">Tableau de bord</div>
                <h1 className="rb-hero-title">
                  Vue d'ensemble<br /><em>recruteur.</em>
                </h1>
                <p className="rb-hero-sub">{todayStr}</p>
              </div>
              <div className="rb-hero-bottom">
                <div className="rb-mini-stat">
                  <div className="rb-mini-stat-label">Taux réponse</div>
                  <div className="rb-mini-stat-val">{tauxReponse}%</div>
                </div>
                <div className="rb-mini-stat">
                  <div className="rb-mini-stat-label">À examiner</div>
                  <div className="rb-mini-stat-val">
                    <Counter to={stats.candidaturesNonLues} />
                  </div>
                </div>
              </div>
            </div>

            {/* ── STAT : ANNONCES ── */}
            <Link to="/recruiter/annonces" className="rb-card rb-stat" style={{display:'block',textDecoration:'none',color:'inherit'}}>
              <div className="rb-stat-label">Annonces</div>
              <div className="rb-stat-val"><Counter to={stats.totalAnnonces} /></div>
              <div className="rb-stat-sub">publiées</div>
              <div className="rb-prog">
                <div className="rb-prog-fill pf-terra"
                  style={{ width: `${Math.min(stats.totalAnnonces * 10, 100)}%` }} />
              </div>
            </Link>

            {/* ── STAT : CANDIDATURES ── */}
            <Link to="/recruiter/candidatures" className="rb-card rb-stat" style={{display:'block',textDecoration:'none',color:'inherit'}}>
              <div className="rb-stat-label">Candidatures</div>
              <div className="rb-stat-val terra"><Counter to={stats.totalCandidatures} /></div>
              <div className="rb-stat-sub">reçues</div>
              <div className="rb-prog">
                <div className="rb-prog-fill pf-navy"
                  style={{ width: `${Math.min(stats.totalCandidatures * 4, 100)}%` }} />
              </div>
            </Link>

            {/* ── STAT : FAVORIS ── */}
            <Link to="/recruiter/favoris" className="rb-card rb-stat" style={{display:'block',textDecoration:'none',color:'inherit'}}>
              <div className="rb-stat-label">Favoris</div>
              <div className="rb-stat-val gold"><Counter to={stats.totalFavoris} /></div>
              <div className="rb-stat-sub">vivier talents</div>
              <div className="rb-prog">
                <div className="rb-prog-fill pf-gold"
                  style={{ width: `${Math.min(stats.totalFavoris * 8, 100)}%` }} />
              </div>
            </Link>

            {/* ── URGENCE STAT ── */}
            <Link to="/recruiter/candidatures?statut=soumise" className="rb-card rb-stat"
              style={{display:'block',textDecoration:'none',color:'inherit',
                background: stats.candidaturesNonLues > 0 ? 'var(--terra-light)' : undefined,
                borderColor: stats.candidaturesNonLues > 0 ? 'rgba(196,83,58,.2)' : undefined,
              }}>
              <div className="rb-stat-label">À examiner</div>
              <div className="rb-stat-val terra"><Counter to={stats.candidaturesNonLues} /></div>
              <div className="rb-stat-sub">en attente</div>
              <div className="rb-prog">
                <div className="rb-prog-fill pf-terra"
                  style={{ width: `${Math.min(stats.candidaturesNonLues * 14, 100)}%` }} />
              </div>
            </Link>

            {/* ── CANDIDATURES PANEL ── */}
            <div className="rb-card rb-wide">
              <div className="rb-panel-hd">
                <span className="rb-panel-title">
                  <span className="rb-panel-dot" />
                  Candidatures récentes
                </span>
                <Link to="/recruiter/candidatures" className="rb-panel-link">Voir tout →</Link>
              </div>

              {candidatures.length > 0 ? candidatures.map(c => (
                <Link to={`/recruiter/candidatures/${c.id}`} key={c.id} className="rb-row">
                  <div className="rb-row-ico letter">
                    {(c.candidat_nom || 'C').charAt(0).toUpperCase()}
                  </div>
                  <div className="rb-row-body">
                    <div className="rb-row-name">{c.candidat_nom}</div>
                    <div className="rb-row-meta">
                      <span><Briefcase size={10} />{c.annonce_titre}</span>
                      <span><Calendar size={10} />{fmtDate(c.date_soumission)}</span>
                    </div>
                  </div>
                  <div className="rb-row-right">
                    <Badge statut={c.statut} />
                    <ArrowUpRight size={13} color="var(--text-3)" />
                  </div>
                </Link>
              )) : (
                <div className="rb-empty">
                  <div className="rb-empty-ico">
                    <Mail size={48} strokeWidth={1.5} />
                  </div>
                  <p>Aucune candidature reçue</p>
                </div>
              )}
            </div>

            {/* ── CTA CARD ── */}
            <div className="rb-card rb-narrow rb-cta-card">
              <div>
                <h3>Créer une <em>nouvelle</em> annonce</h3>
                <p>Publiez votre offre et trouvez le bon profil en quelques minutes.</p>
              </div>
              <Link to="/recruiter/annonces/create" className="rb-cta-pill">
                <Plus size={12} /> Commencer
              </Link>
            </div>

            {/* ── ANNONCES PANEL ── */}
            <div className="rb-card rb-mid">
              <div className="rb-panel-hd">
                <span className="rb-panel-title">
                  <span className="rb-panel-dot" style={{background:'var(--navy)'}} />
                  Annonces récentes
                </span>
                <Link to="/recruiter/annonces" className="rb-panel-link">Gérer →</Link>
              </div>

              {annonces.length > 0 ? annonces.map(a => {
                const pct = Math.min((a.nombre_candidatures || 0) * 12, 100);
                return (
                  <Link to={`/recruiter/annonces/${a.id}`} key={a.id} className="rb-row">
                    <div className="rb-row-ico"><Briefcase size={16} /></div>
                    <div className="rb-row-body">
                      <div className="rb-row-name">{a.titre}</div>
                      <div className="rb-row-meta">
                        <span><MapPin size={10} />{a.secteur_activite}</span>
                        <span><Users size={10} />{a.nombre_candidatures ?? 0} candidats</span>
                      </div>
                    </div>
                    <div className="rb-row-right">
                      <div className="rb-inline-prog">
                        <div className="rb-inline-track">
                          <div className="rb-inline-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="rb-inline-label">{pct}%</div>
                      </div>
                      <Badge statut={a.statut} />
                    </div>
                  </Link>
                );
              }) : (
                <div className="rb-empty">
                  <div className="rb-empty-ico"><Inbox size={36} /></div>
                  <p>Aucune annonce publiée</p>
                  <Link to="/recruiter/annonces/create" className="rb-cta-btn" style={{marginTop:10,fontSize:12}}>
                    <Plus size={12} /> Créer
                  </Link>
                </div>
              )}
            </div>

            {/* ── ACTIVITÉ RAPIDE ── */}
            <div className="rb-card rb-mid">
              <div className="rb-panel-hd">
                <span className="rb-panel-title">
                  <Sparkles size={13} color="var(--gold)" />
                  Activité rapide
                </span>
              </div>
              <div className="rb-strip">
                {[
                  { val: stats.candidaturesNonLues, label: 'à examiner' },
                  { val: `${tauxReponse}%`,          label: 'taux de réponse' },
                  { val: stats.totalFavoris,          label: 'favoris actifs' },
                  { val: stats.totalAnnonces,         label: 'offres actives' },
                  { val: stats.totalCandidatures,     label: 'candidatures total' },
                ].map((item, i) => (
                  <div key={i} className="rb-strip-card">
                    <div className="rb-strip-val">{item.val}</div>
                    <div className="rb-strip-label">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}