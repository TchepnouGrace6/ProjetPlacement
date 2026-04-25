import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api/auth";
const DJANGO_BASE = "http://127.0.0.1:8000";

/* ─── Hook visibilité scroll ─── */
function useInView(threshold) {
  if (threshold === undefined) threshold = 0.1;
  var ref = useRef(null);
  var s = useState(false);
  var visible = s[0], setVisible = s[1];
  useEffect(function () {
    var obs = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: threshold });
    if (ref.current) obs.observe(ref.current);
    return function () { obs.disconnect(); };
  }, []);
  return [ref, visible];
}

function fadeUp(visible, delay, extra) {
  if (delay === undefined) delay = 0;
  var s = {
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(32px)",
    transition: "opacity 0.7s ease " + delay + "s, transform 0.7s cubic-bezier(0.16,1,0.3,1) " + delay + "s"
  };
  if (extra) Object.keys(extra).forEach(function (k) { s[k] = extra[k]; });
  return s;
}

function resolveLogoUrl(logo) {
  if (!logo) return null;
  if (logo.startsWith("http://") || logo.startsWith("https://")) return logo;
  if (logo.startsWith("/")) return DJANGO_BASE + logo;
  return DJANGO_BASE + "/" + logo;
}

function LogoEntreprise({ logo, nom, couleur }) {
  var s = useState(false);
  var erreur = s[0], setErreur = s[1];
  var url = resolveLogoUrl(logo);
  var initiales = (nom || "??").split(" ").map(function (w) { return w[0]; }).join("").substring(0, 2).toUpperCase();
  if (url && !erreur) {
    return (
      <img src={url} alt={nom} onError={function () { setErreur(true); }}
        style={{ width: "46px", height: "46px", borderRadius: "10px", objectFit: "cover", border: "1px solid #e8efff", background: "#f8faff", display: "block", flexShrink: 0 }} />
    );
  }
  return (
    <div style={{ width: "46px", height: "46px", borderRadius: "10px", background: couleur || "#e8efff", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "700", fontSize: "14px", flexShrink: 0 }}>
      {initiales}
    </div>
  );
}

function couleurLogo(nom) {
  var couleurs = ["#e8590c", "#1971c2", "#2f9e44", "#e03131", "#7048e8", "#0c8599", "#d6336c", "#f08c00"];
  var hash = 0;
  for (var i = 0; i < (nom || "").length; i++) hash += (nom || "").charCodeAt(i);
  return couleurs[hash % couleurs.length];
}

function tempsEcoule(dateStr) {
  if (!dateStr) return "Récemment";
  var diff = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return "Il y a 1 j";
  if (diff < 7) return "Il y a " + diff + " j";
  if (diff < 14) return "Il y a 1 sem.";
  return "Il y a " + Math.floor(diff / 7) + " sem.";
}

const TYPE_LABELS = { cdi: "CDI", cdd: "CDD", stage: "Stage", alternance: "Alternance", freelance: "Freelance" };
const TYPE_COLORS = {
  cdi:        { bg: "#e8f0fe", color: "#1d4ed8" },
  cdd:        { bg: "#fff3e0", color: "#e65100" },
  stage:      { bg: "#e3f2fd", color: "#0c8599" },
  alternance: { bg: "#f3e5f5", color: "#7048e8" },
  freelance:  { bg: "#fce4ec", color: "#d6336c" },
};

const ALL_TYPES = [
  { key: "cdi",        label: "CDI — Temps plein" },
  { key: "cdd",        label: "CDD — Durée déterminée" },
  { key: "stage",      label: "Stage" },
  { key: "alternance", label: "Alternance / Apprentissage" },
  { key: "freelance",  label: "Freelance / Mission" },
];

/* ── Carte offre (liste) ── */
function OffreCard({ annonce, index, visible, navigate }) {
  var delay = index * 0.07 + 0.04;
  var tc = TYPE_COLORS[annonce.type_contrat] || { bg: "#f1f5f9", color: "#475569" };
  var couleur = couleurLogo(annonce.nom_entreprise);
  var salMin = annonce.salaire_min ? Number(annonce.salaire_min).toLocaleString("fr-FR") : null;
  var salMax = annonce.salaire_max ? Number(annonce.salaire_max).toLocaleString("fr-FR") : null;
  var salLabel = salMin && salMax ? salMin + " – " + salMax + " FCFA" : salMin ? salMin + " FCFA" : null;
  var tags = [
    annonce.type_contrat ? { label: (TYPE_LABELS[annonce.type_contrat] || annonce.type_contrat).toUpperCase(), color: tc.color, bg: tc.bg } : null,
    annonce.localisation ? { label: annonce.localisation.toUpperCase(), color: "#475569", bg: "#f1f5f9" } : null,
    annonce.teletravail ? { label: "TÉLÉTRAVAIL", color: "#0c8599", bg: "#e0f7fa" } : null,
    annonce.urgent ? { label: "URGENT", color: "#d6336c", bg: "#fce4ec" } : null,
  ].filter(Boolean);

  return (
    <div
      style={{
        background: "white", border: "1px solid #e8efff", borderRadius: "14px",
        padding: "20px 24px", display: "flex", alignItems: "center", gap: "18px",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: "opacity 0.6s ease " + delay + "s, transform 0.6s cubic-bezier(0.16,1,0.3,1) " + delay + "s, box-shadow 0.2s, border-color 0.2s",
        cursor: "pointer",
      }}
      onMouseEnter={function (e) { e.currentTarget.style.boxShadow = "0 4px 24px rgba(21,101,192,0.10)"; e.currentTarget.style.borderColor = "#90CAF9"; }}
      onMouseLeave={function (e) { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "#e8efff"; }}
    >
      <LogoEntreprise logo={annonce.logo} nom={annonce.nom_entreprise} couleur={couleur} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "3px" }}>{annonce.nom_entreprise || "Entreprise"}</div>
        <div style={{ fontSize: "16px", fontWeight: "700", color: "#0a0f28", marginBottom: "10px", lineHeight: "1.3" }}>{annonce.titre}</div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {tags.map(function (tag, j) {
            return (
              <span key={j} style={{ background: tag.bg, color: tag.color, fontSize: "10px", fontWeight: "700", padding: "3px 9px", borderRadius: "100px", letterSpacing: "0.3px" }}>
                {tag.label}
              </span>
            );
          })}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px", flexShrink: 0 }}>
        <div style={{ fontSize: "11px", color: "#94a3b8", whiteSpace: "nowrap" }}>{tempsEcoule(annonce.date_publication || annonce.date_creation)}</div>
        {salLabel && <div style={{ fontSize: "13px", fontWeight: "700", color: "#0a0f28", whiteSpace: "nowrap" }}>{salLabel}</div>}
        <button
          onClick={function () { navigate("/nos-offres/" + annonce.id); }}
          style={{ background: "#1d4ed8", color: "white", border: "none", padding: "8px 18px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", cursor: "pointer", transition: "background 0.2s", whiteSpace: "nowrap" }}
          onMouseEnter={function (e) { e.currentTarget.style.background = "#1e40af"; }}
          onMouseLeave={function (e) { e.currentTarget.style.background = "#1d4ed8"; }}
        >Détails</button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   PAGE NOS OFFRES
══════════════════════════════════════════ */
export default function NosOffres() {
  var navigate = useNavigate();

  var aS = useState([]);    var annonces = aS[0];          var setAnnonces = aS[1];
  var fS = useState([]);    var filtrees = fS[0];           var setFiltrees = fS[1];
  var lS = useState(true);  var loading = lS[0];            var setLoading = lS[1];
  var rS = useState("");    var recherche = rS[0];          var setRecherche = rS[1];
  var vS = useState("");    var villeQ = vS[0];             var setVilleQ = vS[1];
  var pS = useState(1);     var page = pS[0];               var setPage = pS[1];
  var tfS = useState([]);   var typesFiltres = tfS[0];      var setTypesFiltres = tfS[1];
  var secS = useState("");  var secteurFiltre = secS[0];    var setSecteurFiltre = secS[1];
  var locS = useState("");  var locFiltre = locS[0];        var setLocFiltre = locS[1];
  var triS = useState("recent"); var tri = triS[0];         var setTri = triS[1];

  /* hero */
  var hS = useState(false); var heroAnim = hS[0]; var setHeroAnim = hS[1];

  var listInView = useInView(0.04);
  var listRef = listInView[0];
  var listVisible = listInView[1];

  var sideInView = useInView(0.04);
  var sideRef = sideInView[0];
  var sideVisible = sideInView[1];

  var PAR_PAGE = 8;

  useEffect(function () {
    setTimeout(function () { setHeroAnim(true); }, 80);
    axios.get(API_URL + "/annonces/").then(function (res) {
      var data = res.data.results || res.data;
      setAnnonces(data);
      setFiltrees(data);
    }).catch(function () {}).finally(function () { setLoading(false); });
  }, []);

  useEffect(function () { appliquerFiltres(); }, [recherche, villeQ, typesFiltres, secteurFiltre, locFiltre, tri, annonces]);

  function appliquerFiltres() {
    var result = annonces.slice();
    if (recherche.trim()) {
      var q = recherche.toLowerCase();
      result = result.filter(function (a) {
        return (a.titre || "").toLowerCase().includes(q) ||
               (a.nom_entreprise || "").toLowerCase().includes(q) ||
               (a.secteur_activite || "").toLowerCase().includes(q);
      });
    }
    if (villeQ.trim()) {
      var v = villeQ.toLowerCase();
      result = result.filter(function (a) { return (a.localisation || "").toLowerCase().includes(v); });
    }
    if (locFiltre) {
      result = result.filter(function (a) { return (a.localisation || "") === locFiltre; });
    }
    if (typesFiltres.length > 0) {
      result = result.filter(function (a) { return typesFiltres.includes(a.type_contrat); });
    }
    if (secteurFiltre) {
      result = result.filter(function (a) { return (a.secteur_activite || "") === secteurFiltre; });
    }
    if (tri === "recent") result.sort(function (a, b) { return new Date(b.date_creation || b.date_publication || 0) - new Date(a.date_creation || a.date_publication || 0); });
    else result.sort(function (a, b) { return new Date(a.date_creation || a.date_publication || 0) - new Date(b.date_creation || b.date_publication || 0); });
    setFiltrees(result);
    setPage(1);
  }

  function toggleType(t) {
    setTypesFiltres(function (prev) {
      return prev.includes(t) ? prev.filter(function (x) { return x !== t; }) : prev.concat([t]);
    });
  }

  function resetFiltres() {
    setTypesFiltres([]); setSecteurFiltre(""); setLocFiltre("");
    setRecherche(""); setVilleQ(""); setTri("recent");
  }

  var secteurs = Array.from(new Set(annonces.map(function (a) { return a.secteur_activite; }).filter(Boolean)));
  var localites = Array.from(new Set(annonces.map(function (a) { return a.localisation; }).filter(Boolean)));
  var totalPages = Math.ceil(filtrees.length / PAR_PAGE);
  var affichees = filtrees.slice((page - 1) * PAR_PAGE, page * PAR_PAGE);

  var footerCols = [
    { titre: "Plateforme", liens: ["Nos offres", "À propos", "FAQ", "Contact"] },
    { titre: "Candidats",  liens: ["S'inscrire", "Mon profil", "Mes candidatures", "Alertes emploi"] },
    { titre: "Recruteurs", liens: ["Publier une offre", "Nos candidats", "Tarifs", "Support"] },
  ];

  /* style select réutilisable */
  var selectStyle = {
    width: "100%", border: "1px solid #e2e8f0", borderRadius: "8px",
    padding: "9px 12px", fontSize: "13px", color: "#374151",
    background: "white", cursor: "pointer", outline: "none",
    fontFamily: "inherit", appearance: "none",
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
    backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center"
  };

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: "#eef1f8", minHeight: "100vh" }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 48px", height: "64px",
        background: "rgba(10,15,40,0.92)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "48px" }}>
          <span style={{ color: "white", fontWeight: "700", fontSize: "20px", letterSpacing: "-0.5px" }}>PlacementPro</span>
          <div style={{ display: "flex", gap: "32px" }}>
            {[["Accueil", "/"], ["Nos Offres", "/nos-offres"], ["À propos", "/apropos"], ["FAQ", "/faq"]].map(function (item) {
              return (
                <Link key={item[0]} to={item[1]}
                  style={{ color: item[0] === "Nos Offres" ? "white" : "rgba(255,255,255,0.75)", fontWeight: item[0] === "Nos Offres" ? "700" : "500", textDecoration: "none", fontSize: "14px", transition: "color 0.2s" }}
                  onMouseEnter={function (e) { e.target.style.color = "white"; }}
                  onMouseLeave={function (e) { e.target.style.color = item[0] === "Nos Offres" ? "white" : "rgba(255,255,255,0.75)"; }}
                >{item[0]}</Link>
              );
            })}
          </div>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <Link to="/connexion" style={{ color: "white", textDecoration: "none", padding: "8px 20px", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "8px", fontSize: "14px", fontWeight: "500" }}>Connexion</Link>
          <Link to="/inscription" style={{ color: "white", textDecoration: "none", padding: "8px 20px", background: "#1565C0", borderRadius: "8px", fontSize: "14px", fontWeight: "500" }}>Inscription</Link>
        </div>
      </nav>

      {/* ══════════════════════════════════════
          HERO — background-image + texte + barre
      ══════════════════════════════════════ */}
      <section style={{ position: "relative", minHeight: "520px", display: "flex", flexDirection: "column", justifyContent: "flex-end", paddingBottom: "0", overflow: "hidden" }}>

        {/* Image de fond */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "url('https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1600&q=85')",
          backgroundSize: "cover", backgroundPosition: "center 30%",
          
        }} />

        {/* Overlay dégradé — assez sombre pour lire le texte */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(160deg, rgba(5,10,30,0.78) 0%, rgba(10,20,60,0.72) 50%, rgba(15,30,80,0.60) 100%)"
        }} />

        {/* Contenu hero */}
        <div style={{ position: "relative", zIndex: 2, maxWidth: "1200px", margin: "0 auto", padding: "0 48px", width: "100%", paddingTop: "120px" }}>

          {/* Badge */}
          <div style={{
            opacity: heroAnim ? 1 : 0,
            transform: heroAnim ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.7s ease 0.05s, transform 0.7s ease 0.05s",
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: "rgba(21,101,192,0.25)", border: "1px solid rgba(21,101,192,0.5)",
            borderRadius: "100px", padding: "6px 16px", marginBottom: "20px"
          }}>
            <div style={{ width: "7px", height: "7px", background: "#4CAF50", borderRadius: "50%" }} />
            <span style={{ color: "#90CAF9", fontSize: "13px", fontWeight: "500" }}>Plateforme d'emploi #1 au Cameroun</span>
          </div>

          {/* Titre */}
          <h1 style={{
            opacity: heroAnim ? 1 : 0,
            transform: heroAnim ? "translateY(0)" : "translateY(28px)",
            transition: "opacity 0.75s ease 0.15s, transform 0.75s cubic-bezier(0.16,1,0.3,1) 0.15s",
            fontSize: "clamp(38px, 5.5vw, 62px)", fontWeight: "900",
            color: "white", lineHeight: "1.05", margin: "0 0 16px",
            letterSpacing: "-2px", maxWidth: "620px"
          }}>
            Trouvez votre<br />prochaine{" "}
            <span style={{ color: "#64B5F6", fontStyle: "italic" }}>opportunité</span>
          </h1>

          {/* Sous-titre */}
          <p style={{
            opacity: heroAnim ? 1 : 0,
            transform: heroAnim ? "translateY(0)" : "translateY(24px)",
            transition: "opacity 0.75s ease 0.28s, transform 0.75s ease 0.28s",
            color: "rgba(255,255,255,0.75)", fontSize: "16px",
            lineHeight: "1.7", margin: "0 0 40px", maxWidth: "500px"
          }}>
            L'excellence du recrutement pour les profils Tech &amp; Design.<br />
            Une sélection éditoriale des meilleures entreprises camerounaises.
          </p>

          {/* Stats rapides */}
          <div style={{
            opacity: heroAnim ? 1 : 0,
            transform: heroAnim ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.75s ease 0.38s, transform 0.75s ease 0.38s",
            display: "flex", gap: "32px", marginBottom: "48px"
          }}>
            {[["500+", "Offres actives"], ["200+", "Entreprises"], ["98%", "Satisfaction"]].map(function (s, i) {
              return (
                <div key={i}>
                  <div style={{ color: "white", fontWeight: "800", fontSize: "22px", letterSpacing: "-0.5px" }}>{s[0]}</div>
                  <div style={{ color: "rgba(255,255,255,0.55)", fontSize: "12px" }}>{s[1]}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── BARRE DE RECHERCHE en bas du hero ── */}
        <div style={{
          position: "relative", zIndex: 3,
          maxWidth: "1200px", margin: "0 auto", padding: "0 48px",
          width: "100%",
          /* chevauchement sur la section suivante */
        }}>
          <div style={{
            opacity: heroAnim ? 1 : 0,
            transition: "opacity 0.8s ease 0.5s",
            background: "white", borderRadius: "16px",
            boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
            border: "1px solid #e2e8f0",
            display: "flex", alignItems: "stretch",
            overflow: "hidden"
          }}>
            {/* Champ poste */}
            <div style={{ display: "flex", alignItems: "center", flex: 1.4, padding: "0 20px", borderRight: "1px solid #e2e8f0" }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginRight: "12px" }}>
                <circle cx="11" cy="11" r="8" stroke="#94a3b8" strokeWidth="2" />
                <path d="M21 21l-4.35-4.35" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input type="text" placeholder="Poste, mots-clés, entreprise…" value={recherche}
                onChange={function (e) { setRecherche(e.target.value); }}
                onKeyDown={function (e) { if (e.key === "Enter") appliquerFiltres(); }}
                style={{ border: "none", outline: "none", fontSize: "15px", color: "#0a0f28", background: "transparent", width: "100%", padding: "18px 0", fontFamily: "inherit" }}
              />
            </div>
            {/* Champ ville */}
            <div style={{ display: "flex", alignItems: "center", flex: 1, padding: "0 20px", borderRight: "1px solid #e2e8f0" }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginRight: "12px" }}>
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="#94a3b8" strokeWidth="2" />
                <circle cx="12" cy="9" r="2.5" stroke="#94a3b8" strokeWidth="2" />
              </svg>
              <input type="text" placeholder="Ville ou télétravail" value={villeQ}
                onChange={function (e) { setVilleQ(e.target.value); }}
                onKeyDown={function (e) { if (e.key === "Enter") appliquerFiltres(); }}
                style={{ border: "none", outline: "none", fontSize: "15px", color: "#0a0f28", background: "transparent", width: "100%", padding: "18px 0", fontFamily: "inherit" }}
              />
            </div>
            {/* Bouton */}
            <button onClick={appliquerFiltres}
              style={{ background: "#1d4ed8", color: "white", border: "none", padding: "0 32px", fontSize: "15px", fontWeight: "700", cursor: "pointer", transition: "background 0.2s", whiteSpace: "nowrap", letterSpacing: "0.2px" }}
              onMouseEnter={function (e) { e.currentTarget.style.background = "#1e40af"; }}
              onMouseLeave={function (e) { e.currentTarget.style.background = "#1d4ed8"; }}
            >
              Explorer les offres
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          CORPS : sidebar + liste
      ══════════════════════════════════════ */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "80px 48px 80px", display: "grid", gridTemplateColumns: "240px 1fr", gap: "32px" }}>

        {/* ── SIDEBAR ── */}
        <aside ref={sideRef}>
          <div style={{
            ...fadeUp(sideVisible, 0, {}),
            background: "white", borderRadius: "16px", padding: "24px",
            border: "1px solid #e8efff", position: "sticky", top: "84px",
            boxShadow: "0 2px 16px rgba(21,101,192,0.05)"
          }}>

            <div style={{ fontSize: "11px", fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "6px" }}>FILTRES RAPIDES</div>
            <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "20px" }}>Affinez votre recherche</div>

            {/* ─── Type de contrat (cases à cocher) ─── */}
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#0a0f28", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "10px" }}>
              Type de contrat
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
              {ALL_TYPES.map(function (opt) {
                var active = typesFiltres.includes(opt.key);
                var tc2 = TYPE_COLORS[opt.key] || { color: "#475569", bg: "#f1f5f9" };
                return (
                  <label key={opt.key} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", padding: "7px 10px", borderRadius: "8px", background: active ? tc2.bg : "transparent", transition: "background 0.15s" }}
                    onMouseEnter={function (e) { if (!active) e.currentTarget.style.background = "#f8faff"; }}
                    onMouseLeave={function (e) { if (!active) e.currentTarget.style.background = "transparent"; }}
                  >
                    <input type="checkbox" checked={active} onChange={function () { toggleType(opt.key); }}
                      style={{ accentColor: tc2.color, width: "15px", height: "15px", flexShrink: 0 }} />
                    <span style={{ fontSize: "13px", color: active ? tc2.color : "#475569", fontWeight: active ? "700" : "400" }}>
                      {opt.label}
                    </span>
                  </label>
                );
              })}
            </div>

            {/* ─── Secteur d'activité (déroulant) ─── */}
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#0a0f28", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "10px" }}>
              Secteur d'activité
            </div>
            <div style={{ position: "relative", marginBottom: "20px" }}>
              <select value={secteurFiltre} onChange={function (e) { setSecteurFiltre(e.target.value); }}
                style={selectStyle}>
                <option value="">— Tous les secteurs —</option>
                {secteurs.map(function (s) { return <option key={s} value={s}>{s}</option>; })}
              </select>
            </div>

            {/* ─── Localisation (déroulant) ─── */}
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#0a0f28", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "10px" }}>
              Localisation
            </div>
            <div style={{ position: "relative", marginBottom: "24px" }}>
              <select value={locFiltre} onChange={function (e) { setLocFiltre(e.target.value); }}
                style={selectStyle}>
                <option value="">— Toutes les villes —</option>
                {localites.map(function (l) { return <option key={l} value={l}>{l}</option>; })}
              </select>
            </div>

            {/* Bouton reset */}
            <button onClick={resetFiltres}
              style={{ width: "100%", background: "#0a0f28", color: "white", border: "none", padding: "11px", borderRadius: "10px", fontSize: "13px", fontWeight: "700", cursor: "pointer", transition: "background 0.2s", fontFamily: "inherit", letterSpacing: "0.3px" }}
              onMouseEnter={function (e) { e.currentTarget.style.background = "#1d4ed8"; }}
              onMouseLeave={function (e) { e.currentTarget.style.background = "#0a0f28"; }}
            >
              Réinitialiser les filtres
            </button>
          </div>
        </aside>

        {/* ── LISTE DES OFFRES ── */}
        <div ref={listRef}>

          {/* Barre résultats + tri */}
          <div style={fadeUp(listVisible, 0, { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" })}>
            <span style={{ fontSize: "14px", color: "#475569" }}>
              <strong style={{ color: "#0a0f28" }}>{filtrees.length}</strong> offre{filtrees.length > 1 ? "s" : ""} correspondent à vos critères
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "13px", color: "#94a3b8" }}>Trier par :</span>
              <button onClick={function () { setTri(function (t) { return t === "recent" ? "ancien" : "recent"; }); }}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: "700", color: "#1d4ed8", display: "flex", alignItems: "center", gap: "4px", fontFamily: "inherit" }}>
                {tri === "recent" ? "Plus récentes" : "Plus anciennes"} <span style={{ fontSize: "11px" }}>⌄</span>
              </button>
            </div>
          </div>

          {/* Chips filtres actifs */}
          {(typesFiltres.length > 0 || secteurFiltre || locFiltre) && (
            <div style={fadeUp(listVisible, 0.05, { display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" })}>
              {typesFiltres.map(function (t) {
                var tc2 = TYPE_COLORS[t] || { color: "#475569", bg: "#f1f5f9" };
                return (
                  <span key={t} style={{ background: tc2.bg, color: tc2.color, fontSize: "12px", fontWeight: "700", padding: "4px 12px", borderRadius: "100px", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}
                    onClick={function () { toggleType(t); }}>
                    {TYPE_LABELS[t]} ✕
                  </span>
                );
              })}
              {secteurFiltre && (
                <span style={{ background: "#f0f4ff", color: "#1d4ed8", fontSize: "12px", fontWeight: "700", padding: "4px 12px", borderRadius: "100px", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}
                  onClick={function () { setSecteurFiltre(""); }}>
                  {secteurFiltre} ✕
                </span>
              )}
              {locFiltre && (
                <span style={{ background: "#f0f4ff", color: "#1d4ed8", fontSize: "12px", fontWeight: "700", padding: "4px 12px", borderRadius: "100px", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}
                  onClick={function () { setLocFiltre(""); }}>
                  {locFiltre} ✕
                </span>
              )}
            </div>
          )}

          {/* Offres */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "80px", color: "#94a3b8" }}>
              <div style={{ fontSize: "36px", marginBottom: "12px" }}>⏳</div>
              <p style={{ fontSize: "15px" }}>Chargement des offres…</p>
            </div>
          ) : affichees.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px", color: "#94a3b8" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔍</div>
              <p style={{ fontSize: "16px" }}>Aucune offre ne correspond à votre recherche.</p>
              <button onClick={resetFiltres} style={{ marginTop: "16px", background: "#1d4ed8", color: "white", border: "none", padding: "10px 24px", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
              {affichees.map(function (annonce, i) {
                return <OffreCard key={annonce.id} annonce={annonce} index={i} visible={listVisible} navigate={navigate} />;
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={fadeUp(listVisible, 0.3, { display: "flex", justifyContent: "center", alignItems: "center", gap: "6px" })}>
              <button onClick={function () { setPage(function (p) { return Math.max(1, p - 1); }); }} disabled={page === 1}
                style={{ width: "38px", height: "38px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "white", cursor: page === 1 ? "not-allowed" : "pointer", color: page === 1 ? "#d1d5db" : "#374151", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
              {Array.from({ length: totalPages }, function (_, i) { return i + 1; }).map(function (p) {
                return (
                  <button key={p} onClick={function () { setPage(p); }}
                    style={{ width: "38px", height: "38px", borderRadius: "8px", border: "1px solid " + (p === page ? "#1d4ed8" : "#e2e8f0"), background: p === page ? "#1d4ed8" : "white", color: p === page ? "white" : "#374151", fontSize: "14px", fontWeight: p === page ? "700" : "400", cursor: "pointer", transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {p}
                  </button>
                );
              })}
              <button onClick={function () { setPage(function (p) { return Math.min(totalPages, p + 1); }); }} disabled={page === totalPages}
                style={{ width: "38px", height: "38px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "white", cursor: page === totalPages ? "not-allowed" : "pointer", color: page === totalPages ? "#d1d5db" : "#374151", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
            </div>
          )}
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#0a0f28", padding: "48px 48px 24px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "48px", marginBottom: "48px" }}>
            <div>
              <div style={{ color: "white", fontWeight: "700", fontSize: "20px", marginBottom: "16px" }}>PlacementPro</div>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", lineHeight: "1.8", margin: 0 }}>
                La plateforme de référence pour l'emploi au Cameroun. Matching intelligent, entreprises vérifiées.
              </p>
            </div>
            {footerCols.map(function (col) {
              return (
                <div key={col.titre}>
                  <div style={{ color: "white", fontWeight: "600", fontSize: "14px", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{col.titre}</div>
                  {col.liens.map(function (lien) {
                    return <div key={lien} style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", marginBottom: "10px", cursor: "pointer" }}>{lien}</div>;
                  })}
                </div>
              );
            })}
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>© 2025 PlacementPro — Cameroun. Tous droits réservés.</span>
            <div style={{ display: "flex", gap: "24px" }}>
              {["Politique de confidentialité", "Conditions d'utilisation"].map(function (lien) {
                return <span key={lien} style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", cursor: "pointer" }}>{lien}</span>;
              })}
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}