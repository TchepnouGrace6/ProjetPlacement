import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Briefcase, Users, Star, Plus, MapPin, Calendar,
  ArrowUpRight, Eye, Sparkles, Inbox, Mail, LogOut,
  LayoutDashboard, FileText, Heart, ChevronRight, TrendingUp
} from 'lucide-react';
import { getMesAnnonces, getMesCandidatures, getMesFavoris, getRecruteurProfile } from '../../api/recruiter';

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

const BADGE_STATUT = {
  publiee:   { bg: '#e8f5e9', color: '#2e7d32', label: 'Publiée' },
  publiée:   { bg: '#e8f5e9', color: '#2e7d32', label: 'Publiée' },
  brouillon: { bg: '#f1f5f9', color: '#64748b', label: 'Brouillon' },
  fermee:    { bg: '#fef2f2', color: '#dc2626', label: 'Fermée' },
  fermée:    { bg: '#fef2f2', color: '#dc2626', label: 'Fermée' },
  archivee:  { bg: '#fff3e0', color: '#e65100', label: 'Archivée' },
  soumise:   { bg: '#fff3e0', color: '#e65100', label: 'Soumise' },
  acceptee:  { bg: '#e8f5e9', color: '#2e7d32', label: 'Acceptée' },
  rejetee:   { bg: '#fef2f2', color: '#dc2626', label: 'Rejetée' },
  en_attente:{ bg: '#e3f2fd', color: '#0c8599', label: 'En attente' },
};

const Badge = ({ statut }) => {
  const cfg = BADGE_STATUT[statut?.toLowerCase()] || { bg: '#f1f5f9', color: '#64748b', label: statut };
  return (
    <span style={{ background: cfg.bg, color: cfg.color, fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '100px' }}>
      {cfg.label}
    </span>
  );
};

const fmtDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

/* ════════════════════════════════════════════════════════════════ */
export default function RecruiterDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats]         = useState({ totalAnnonces: 0, totalCandidatures: 0, totalFavoris: 0, nonLues: 0 });
  const [annonces, setAnnonces]   = useState([]);
  const [candidatures, setCandidatures] = useState([]);
  const [profil, setProfil]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const email = localStorage.getItem('email') || '';

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const [aR, cR, fR, pR] = await Promise.allSettled([
        getMesAnnonces(), getMesCandidatures(), getMesFavoris(), getRecruteurProfile(),
      ]);
      const a = aR.status === 'fulfilled' ? (aR.value.data || []) : [];
      const c = cR.status === 'fulfilled' ? (cR.value.data || []) : [];
      const f = fR.status === 'fulfilled' ? (fR.value.data || []) : [];
      if (pR.status === 'fulfilled') setProfil(pR.value.data);
      setAnnonces(a);
      setCandidatures(c);
      setStats({
        totalAnnonces: a.length,
        totalCandidatures: c.length,
        totalFavoris: f.length,
        nonLues: c.filter(x => x.statut === 'soumise').length,
      });
      setError(null);
    } catch {
      setError('Impossible de charger les données.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeconnexion = () => {
    localStorage.clear();
    navigate('/connexion');
  };

  const nomEntreprise = profil?.nom_entreprise || email;
  const initiales = nomEntreprise.substring(0, 2).toUpperCase();
  const tauxReponse = stats.totalCandidatures
    ? Math.round((stats.totalCandidatures - stats.nonLues) / stats.totalCandidatures * 100)
    : 0;

  const NAV = [
    { id: 'overview',      label: 'Vue d\'ensemble',  icon: LayoutDashboard },
    { id: 'annonces',      label: 'Mes annonces',      icon: FileText,  count: stats.totalAnnonces },
    { id: 'candidatures',  label: 'Candidatures',      icon: Users,     count: stats.totalCandidatures },
    { id: 'favoris',       label: 'Favoris',            icon: Heart,     count: stats.totalFavoris },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#eef1f8', fontFamily: "'Segoe UI', system-ui, sans-serif", display: 'flex' }}>

      {/* ══════════ SIDEBAR ══════════ */}
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: '240px',
        background: '#0a0f28', display: 'flex', flexDirection: 'column',
        zIndex: 100, overflowY: 'auto'
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <span style={{ color: 'white', fontWeight: '800', fontSize: '18px', letterSpacing: '-0.5px' }}>
            Placement<span style={{ color: '#64B5F6' }}>Pro</span>
          </span>
        </div>

        {/* Profil entreprise */}
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#1565C0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '15px', flexShrink: 0 }}>
            {profil?.logo
              ? <img src={profil.logo} alt="" style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }} />
              : initiales}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ color: 'white', fontSize: '13px', fontWeight: 600, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nomEntreprise}</div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ padding: '12px 0', flex: 1 }}>
          <div style={{ padding: '6px 20px 4px', fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
            Mon espace
          </div>
          {NAV.map(item => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', padding: '10px 20px', border: 'none', cursor: 'pointer',
                  background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: active ? 'white' : 'rgba(255,255,255,0.6)',
                  borderLeft: active ? '3px solid #1565C0' : '3px solid transparent',
                  fontSize: '13px', fontWeight: active ? 700 : 400,
                  textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.15s'
                }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={14} /> {item.label}
                </span>
                {item.count > 0 && (
                  <span style={{ background: active ? '#1565C0' : 'rgba(255,255,255,0.15)', color: 'white', fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '20px' }}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}

          <div style={{ padding: '6px 20px 4px', marginTop: '8px', fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
            Actions
          </div>
          <button onClick={() => navigate('/recruiter/annonces/create')}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 20px', border: 'none', cursor: 'pointer', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontFamily: 'inherit', borderLeft: '3px solid transparent', transition: 'all 0.15s' }}>
            <Plus size={14} /> Nouvelle annonce
          </button>
          <button onClick={() => navigate('/recruiter/profile')}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 20px', border: 'none', cursor: 'pointer', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontFamily: 'inherit', borderLeft: '3px solid transparent', transition: 'all 0.15s' }}>
            <Briefcase size={14} /> Profil entreprise
          </button>
        </nav>

        {/* Déconnexion */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button onClick={handleDeconnexion}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '9px 14px', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: 'rgba(255,255,255,0.5)', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
            <LogOut size={13} /> Déconnexion
          </button>
        </div>
      </div>

      {/* ══════════ CONTENU PRINCIPAL ══════════ */}
      <div style={{ marginLeft: '240px', padding: '32px', flex: 1 }}>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px', padding: '12px 20px', marginBottom: '20px', fontSize: '14px', color: '#dc2626' }}>
            ⚠ {error}
          </div>
        )}

        {/* ── HEADER ── */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0a0f28', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
            {activeTab === 'overview' && `Bonjour, ${nomEntreprise} 👋`}
            {activeTab === 'annonces' && 'Mes annonces'}
            {activeTab === 'candidatures' && 'Candidatures reçues'}
            {activeTab === 'favoris' && 'Mes favoris'}
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px', color: '#94a3b8' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
            <p>Chargement de votre espace…</p>
          </div>
        ) : (
          <>
            {/* ══════════ VUE D'ENSEMBLE ══════════ */}
            {activeTab === 'overview' && (
              <>
                {/* Stat cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
                  {[
                    { label: 'Annonces publiées',   value: stats.totalAnnonces,     color: '#1565C0', bg: '#e8efff', icon: FileText },
                    { label: 'Candidatures reçues', value: stats.totalCandidatures, color: '#0c8599', bg: '#e0f7fa', icon: Users },
                    { label: 'À examiner',           value: stats.nonLues,           color: '#e65100', bg: '#fff3e0', icon: Mail },
                    { label: 'Taux de réponse',      value: `${tauxReponse}%`,       color: '#2e7d32', bg: '#e8f5e9', icon: TrendingUp },
                  ].map((s, i) => {
                    const Icon = s.icon;
                    return (
                      <div key={i} style={{ background: 'white', borderRadius: '14px', padding: '20px', border: '1px solid #e8efff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px' }}>{s.label}</div>
                          <div style={{ background: s.bg, borderRadius: '8px', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon size={14} color={s.color} />
                          </div>
                        </div>
                        <div style={{ fontSize: '32px', fontWeight: '800', color: s.color }}>
                          {typeof s.value === 'number' ? <Counter to={s.value} /> : s.value}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Deux colonnes */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                  {/* Candidatures récentes */}
                  <div style={{ background: 'white', borderRadius: '14px', padding: '24px', border: '1px solid #e8efff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0a0f28', margin: 0 }}>Candidatures récentes</h2>
                      <button onClick={() => setActiveTab('candidatures')} style={{ background: 'none', border: 'none', color: '#1565C0', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Voir tout <ChevronRight size={13} />
                      </button>
                    </div>
                    {candidatures.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>
                        <Mail size={36} strokeWidth={1.5} style={{ marginBottom: '8px', opacity: 0.4 }} />
                        <p style={{ fontSize: '13px', margin: 0 }}>Aucune candidature reçue</p>
                      </div>
                    ) : (
                      candidatures.slice(0, 4).map(c => (
                        <div key={c.id} onClick={() => navigate(`/recruiter/candidatures/${c.id}`)}
                          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e8efff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1565C0', fontWeight: 700, fontSize: '13px', flexShrink: 0 }}>
                            {(c.candidat_nom || 'C').charAt(0).toUpperCase()}
                          </div>
                          <div style={{ flex: 1, overflow: 'hidden' }}>
                            <div style={{ fontWeight: 600, color: '#0a0f28', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.candidat_nom}</div>
                            <div style={{ color: '#94a3b8', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.annonce_titre}</div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                            <Badge statut={c.statut} />
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>{fmtDate(c.date_soumission)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Annonces récentes */}
                  <div style={{ background: 'white', borderRadius: '14px', padding: '24px', border: '1px solid #e8efff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0a0f28', margin: 0 }}>Mes annonces</h2>
                      <button onClick={() => setActiveTab('annonces')} style={{ background: 'none', border: 'none', color: '#1565C0', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Voir tout <ChevronRight size={13} />
                      </button>
                    </div>
                    {annonces.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>
                        <Inbox size={36} strokeWidth={1.5} style={{ marginBottom: '8px', opacity: 0.4 }} />
                        <p style={{ fontSize: '13px', margin: 0 }}>Aucune annonce publiée</p>
                        <button onClick={() => navigate('/recruiter/annonces/create')}
                          style={{ marginTop: '12px', background: '#1565C0', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                          + Créer une annonce
                        </button>
                      </div>
                    ) : (
                      annonces.slice(0, 4).map(a => (
                        <div key={a.id} onClick={() => navigate(`/recruiter/annonces/${a.id}`)}
                          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#e8efff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Briefcase size={16} color="#1565C0" />
                          </div>
                          <div style={{ flex: 1, overflow: 'hidden' }}>
                            <div style={{ fontWeight: 600, color: '#0a0f28', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.titre}</div>
                            <div style={{ color: '#94a3b8', fontSize: '11px' }}>{a.nombre_candidatures ?? 0} candidat(s) · {a.localisation}</div>
                          </div>
                          <Badge statut={a.statut} />
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* CTA créer annonce */}
                <div style={{ marginTop: '20px', background: 'linear-gradient(135deg, #0a0f28 0%, #1565C0 100%)', borderRadius: '14px', padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Recrutement</div>
                    <h3 style={{ color: 'white', fontSize: '18px', fontWeight: 800, margin: '0 0 6px' }}>Publiez une nouvelle offre</h3>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: 0 }}>Trouvez le bon profil en quelques minutes.</p>
                  </div>
                  <button onClick={() => navigate('/recruiter/annonces/create')}
                    style={{ background: 'white', color: '#0a0f28', border: 'none', padding: '12px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <Plus size={15} /> Nouvelle annonce
                  </button>
                </div>
              </>
            )}

            {/* ══════════ ONGLET ANNONCES ══════════ */}
            {activeTab === 'annonces' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                  <button onClick={() => navigate('/recruiter/annonces/create')}
                    style={{ background: '#1565C0', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={14} /> Nouvelle annonce
                  </button>
                </div>
                {annonces.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '16px', border: '1px solid #e8efff' }}>
                    <Inbox size={48} strokeWidth={1.5} style={{ marginBottom: '16px', opacity: 0.3, color: '#1565C0' }} />
                    <h3 style={{ color: '#0a0f28', fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Aucune annonce publiée</h3>
                    <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>Créez votre première offre pour commencer à recevoir des candidatures.</p>
                    <button onClick={() => navigate('/recruiter/annonces/create')}
                      style={{ background: '#1565C0', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                      + Créer une annonce
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {annonces.map(a => (
                      <div key={a.id} style={{ background: 'white', borderRadius: '14px', padding: '20px 24px', border: '1px solid #e8efff', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#e8efff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Briefcase size={20} color="#1565C0" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, color: '#0a0f28', fontSize: '15px', marginBottom: '4px' }}>{a.titre}</div>
                          <div style={{ color: '#64748b', fontSize: '13px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <span>📍 {a.localisation}</span>
                            <span>👥 {a.nombre_candidatures ?? 0} candidat(s)</span>
                            {a.secteur_activite && <span>🏢 {a.secteur_activite}</span>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                          <Badge statut={a.statut} />
                          <button onClick={() => navigate(`/recruiter/annonces/${a.id}`)}
                            style={{ background: '#f0f4ff', color: '#1565C0', border: 'none', padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                            Voir
                          </button>
                          <button onClick={() => navigate(`/recruiter/annonces/${a.id}/edit`)}
                            style={{ background: '#e8efff', color: '#0a0f28', border: 'none', padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                            Modifier
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ══════════ ONGLET CANDIDATURES ══════════ */}
            {activeTab === 'candidatures' && (
              <div>
                {candidatures.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '16px', border: '1px solid #e8efff' }}>
                    <Mail size={48} strokeWidth={1.5} style={{ marginBottom: '16px', opacity: 0.3, color: '#1565C0' }} />
                    <h3 style={{ color: '#0a0f28', fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Aucune candidature reçue</h3>
                    <p style={{ color: '#64748b', fontSize: '14px' }}>Les candidatures apparaîtront ici une fois que vous aurez publié une annonce.</p>
                  </div>
                ) : (
                  <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e8efff', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f8faff' }}>
                          {['Candidat', 'Annonce', 'Date', 'Score', 'Statut', ''].map(h => (
                            <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '1px solid #e8efff' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {candidatures.map((c, i) => (
                          <tr key={c.id}
                            onClick={() => navigate(`/recruiter/candidatures/${c.id}`)}
                            style={{ cursor: 'pointer', borderBottom: i < candidatures.length - 1 ? '1px solid #f1f5f9' : 'none', transition: 'background 0.1s' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f8faff'}
                            onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e8efff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1565C0', fontWeight: 700, fontSize: '12px', flexShrink: 0 }}>
                                  {(c.candidat_nom || 'C').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 600, color: '#0a0f28', fontSize: '13px' }}>{c.candidat_nom}</div>
                                  <div style={{ color: '#94a3b8', fontSize: '11px' }}>{c.candidat_email}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '13px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.annonce_titre}</td>
                            <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '12px', whiteSpace: 'nowrap' }}>{fmtDate(c.date_soumission)}</td>
                            <td style={{ padding: '14px 16px' }}>
                              {c.note_score
                                ? <span style={{ color: '#e65100', fontSize: '13px', fontWeight: 700 }}>{'★'.repeat(c.note_score)}</span>
                                : <span style={{ color: '#cbd5e1', fontSize: '13px' }}>—</span>}
                            </td>
                            <td style={{ padding: '14px 16px' }}><Badge statut={c.statut} /></td>
                            <td style={{ padding: '14px 16px' }}>
                              <ArrowUpRight size={16} color="#94a3b8" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ══════════ ONGLET FAVORIS ══════════ */}
            {activeTab === 'favoris' && (
              <div>
                {stats.totalFavoris === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '16px', border: '1px solid #e8efff' }}>
                    <Star size={48} strokeWidth={1.5} style={{ marginBottom: '16px', opacity: 0.3, color: '#1565C0' }} />
                    <h3 style={{ color: '#0a0f28', fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Aucun favori</h3>
                    <p style={{ color: '#64748b', fontSize: '14px' }}>Ajoutez des candidats prometteurs à votre vivier depuis les candidatures.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    {/* Les favoris s'afficheront ici via la page dédiée */}
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', background: 'white', borderRadius: '14px', border: '1px solid #e8efff' }}>
                      <button onClick={() => navigate('/recruiter/favoris')}
                        style={{ background: '#1565C0', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                        Voir tous mes favoris →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}