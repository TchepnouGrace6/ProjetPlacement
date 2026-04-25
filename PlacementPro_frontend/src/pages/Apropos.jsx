import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

/* ─── Hook visibilité scroll ─── */
function useInView(threshold) {
  if (threshold === undefined) threshold = 0.15;
  var ref = useRef(null);
  var state = useState(false);
  var visible = state[0];
  var setVisible = state[1];
  useEffect(function () {
    var obs = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: threshold });
    if (ref.current) obs.observe(ref.current);
    return function () { obs.disconnect(); };
  }, []);
  return [ref, visible];
}

/* ─── Helpers animation ─── */
function fadeUp(visible, delay, extra) {
  if (delay === undefined) delay = 0;
  var s = {
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(36px)",
    transition: "opacity 0.75s ease " + delay + "s, transform 0.75s cubic-bezier(0.16,1,0.3,1) " + delay + "s"
  };
  if (extra) { Object.keys(extra).forEach(function (k) { s[k] = extra[k]; }); }
  return s;
}
function fadeLeft(visible, delay, extra) {
  if (delay === undefined) delay = 0;
  var s = {
    opacity: visible ? 1 : 0,
    transform: visible ? "translateX(0)" : "translateX(-48px)",
    transition: "opacity 0.8s ease " + delay + "s, transform 0.8s cubic-bezier(0.16,1,0.3,1) " + delay + "s"
  };
  if (extra) { Object.keys(extra).forEach(function (k) { s[k] = extra[k]; }); }
  return s;
}
function fadeRight(visible, delay, extra) {
  if (delay === undefined) delay = 0;
  var s = {
    opacity: visible ? 1 : 0,
    transform: visible ? "translateX(0)" : "translateX(48px)",
    transition: "opacity 0.8s ease " + delay + "s, transform 0.8s cubic-bezier(0.16,1,0.3,1) " + delay + "s"
  };
  if (extra) { Object.keys(extra).forEach(function (k) { s[k] = extra[k]; }); }
  return s;
}

export default function Apropos() {
  /* hero */
  var heroState = useState(false);
  var heroVisible = heroState[0];
  var setHeroVisible = heroState[1];

  /* sections */
  var eliteInView = useInView(0.15);
  var eliteRef = eliteInView[0];
  var eliteVisible = eliteInView[1];

  var pilarsInView = useInView(0.15);
  var pilarsRef = pilarsInView[0];
  var pilarsVisible = pilarsInView[1];

  var contactInView = useInView(0.15);
  var contactRef = contactInView[0];
  var contactVisible = contactInView[1];

  /* form state */
  var formState = useState({ nom: "", email: "", message: "" });
  var form = formState[0];
  var setForm = formState[1];

  useEffect(function () {
    setTimeout(function () { setHeroVisible(true); }, 100);
  }, []);

  var footerCols = [
    { titre: "Plateforme", liens: ["Nos offres", "À propos", "FAQ", "Contact"] },
    { titre: "Candidats", liens: ["S'inscrire", "Mon profil", "Mes candidatures", "Alertes emploi"] },
    { titre: "Recruteurs", liens: ["Publier une offre", "Nos candidats", "Tarifs", "Support"] },
  ];

  var pillars = [
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" stroke="#1565C0" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
      titre: "Innovation",
      desc: "Nous repoussons les limites des technologies logicielles pour créer des applications remarquables et élégantes chaque fois."
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" stroke="#1565C0" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
      titre: "L'Humain",
      desc: "Die Natur chaque cliente se trouver une carrière. Nous plaçons l'empathie et le respect au centre de notre plateforme."
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="#1565C0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      titre: "Performance",
      desc: "L'efficacité est notre signature. Nous mesurons le temps de mise en relation à 80% de taux de satisfaction de qualité."
    }
  ];

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: "#fff", minHeight: "100vh" }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 48px", height: "64px",
        background: "rgba(10,15,40,0.88)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "48px" }}>
          <span style={{ color: "white", fontWeight: "700", fontSize: "20px", letterSpacing: "-0.5px" }}>PlacementPro</span>
          <div style={{ display: "flex", gap: "32px" }}>
            {[["Accueil", "/"], ["Nos Offres", "/nos-offres"], ["À propos", "/apropos"], ["FAQ", "/faq"]].map(function (item) {
              return (
                <Link key={item[0]} to={item[1]}
                  style={{
                    color: item[0] === "À propos" ? "white" : "rgba(255,255,255,0.8)",
                    fontWeight: item[0] === "À propos" ? "700" : "500",
                    textDecoration: "none", fontSize: "14px", transition: "color 0.2s"
                  }}
                  onMouseEnter={function (e) { e.target.style.color = "white"; }}
                  onMouseLeave={function (e) { e.target.style.color = item[0] === "À propos" ? "white" : "rgba(255,255,255,0.8)"; }}
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

      {/* ── HERO : Notre Mission ── */}
      <section style={{
        minHeight: "480px", position: "relative", overflow: "hidden",
        display: "flex", alignItems: "center", paddingTop: "64px"
      }}>
        {/* Image de fond cathédrale/bâtiment */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "url('/src/assets/cap1.png')",
          backgroundSize: "cover", backgroundPosition: "center top",
        }} />
        {/* Overlay sombre à gauche */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(90deg,  rgba(10,15,40,0.80) 20%, rgba(5,8,20,0.65) 50%, rgba(5,8,20,0.25) 100%)"
        }} />

        <div style={{ position: "relative", zIndex: 2, maxWidth: "1200px", margin: "0 auto", padding: "80px 48px", width: "100%" }}>
          <div style={{
            maxWidth: "560px",
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? "translateY(0)" : "translateY(40px)",
            transition: "opacity 0.9s ease, transform 0.9s cubic-bezier(0.16,1,0.3,1)"
          }}>
            <h1 style={{
              fontSize: "clamp(36px, 5vw, 58px)", fontWeight: "800",
              color: "white", lineHeight: "1.1", margin: "0 0 20px",
              letterSpacing: "-1px"
            }}>
              Notre Mission
            </h1>
            <p style={{
              color: "rgba(255,255,255,0.75)", fontSize: "16px",
              lineHeight: "1.75", margin: "0 0 32px", maxWidth: "480px"
            }}>
              Nous nous efforçons de révolutionner le marché du travail au Cameroun grâce à l'intelligence artificielle. Notre plateforme vous aide à trouver des professionnels expérimentés, travaillant sur des projets innovants et ambitieux.
            </p>
            <button style={{
              background: "#1565C0", color: "white", border: "none",
              padding: "13px 28px", borderRadius: "10px",
              fontSize: "15px", fontWeight: "600", cursor: "pointer",
              transition: "background 0.2s"
            }}
              onMouseEnter={function (e) { e.currentTarget.style.background = "#0d47a1"; }}
              onMouseLeave={function (e) { e.currentTarget.style.background = "#1565C0"; }}
            >
              Nous découvrir
            </button>
          </div>
        </div>
      </section>

      {/* ── SECTION : L'Élite du Recrutement Digital ── */}
      <section ref={eliteRef} style={{ padding: "80px 48px", background: "#fff" }}>
        <div style={{
          maxWidth: "1100px", margin: "0 auto",
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px", alignItems: "center"
        }}>

          {/* Image gauche — bureau / ville */}
          <div style={fadeLeft(eliteVisible, 0.05)}>
            <div style={{
              borderRadius: "16px", overflow: "hidden",
              position: "relative", aspectRatio: "4/3",
              background: "#0a0f28"
            }}>
              <img
                src="https://images.unsplash.com/photo-1486325212027-8081e485255e?w=700&q=80"
                alt="Bureau Douala"
                style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.75, display: "block" }}
              />
              {/* Overlay texte sur l'image */}
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to top, rgba(5,8,20,0.85) 0%, transparent 55%)",
                display: "flex", flexDirection: "column", justifyContent: "flex-end",
                padding: "24px"
              }}>
                <div style={{ color: "white", fontWeight: "800", fontSize: "22px", letterSpacing: "2px", textTransform: "uppercase", lineHeight: "1.2" }}>BUREAU</div>
                <div style={{ color: "white", fontWeight: "800", fontSize: "22px", letterSpacing: "2px", textTransform: "uppercase" }}>DOUALA</div>
                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "11px", letterSpacing: "1px", marginTop: "4px", textTransform: "uppercase" }}>AGENCE DE TRAVAIL</div>
              </div>
            </div>

            {/* Badge 2024 */}
            <div style={{
              marginTop: "-20px", marginLeft: "auto",
              width: "fit-content",
              background: "#1565C0", color: "white",
              borderRadius: "14px", padding: "18px 24px",
              boxShadow: "0 8px 28px rgba(21,101,192,0.35)",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "26px", fontWeight: "800", letterSpacing: "-0.5px" }}>2024</div>
              <div style={{ fontSize: "12px", opacity: 0.85, marginTop: "2px" }}>FONDÉ &amp; ÉTABLI</div>
            </div>
          </div>

          {/* Texte droite */}
          <div style={fadeRight(eliteVisible, 0.15)}>
            {/* Badge label */}
            <div style={{
              display: "inline-block", background: "#e8f0fe", color: "#1565C0",
              fontSize: "12px", fontWeight: "600", padding: "5px 14px",
              borderRadius: "100px", marginBottom: "20px", letterSpacing: "0.5px"
            }}>
              À PROPOS
            </div>
            <h2 style={{
              fontSize: "34px", fontWeight: "800", color: "#0a0f28",
              margin: "0 0 20px", letterSpacing: "-0.5px", lineHeight: "1.2"
            }}>
              L'Élite du Recrutement Digital
            </h2>
            <p style={{ color: "#64748b", fontSize: "15px", lineHeight: "1.8", marginBottom: "16px" }}>
              Basé au cœur de Douala, PlacementPro est une startup visionnaire qui repense les codes du marché de l'emploi en Afrique Centrale. Nous croyons que chaque talent mérite une mise en valeur à la hauteur de ses ambitions.
            </p>
            <p style={{ color: "#64748b", fontSize: "15px", lineHeight: "1.8", marginBottom: "16px" }}>
              Notre moteur de matching — piloté par l'humain, mais sublimé par l'algorithme. Notre IA comprend les subtilités de chaque profil pour connecter le bon candidat à la bonne opportunité.
            </p>
            <p style={{ color: "#64748b", fontSize: "15px", lineHeight: "1.8" }}>
              Nous nous engageons à offrir une transparence totale et une ambition chirurgicale dans chaque mise en relation.
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION : Nos Piliers Fondamentaux ── */}
      <section ref={pilarsRef} style={{ padding: "80px 48px", background: "#f8faff" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

          <div style={fadeUp(pilarsVisible, 0, { textAlign: "center", marginBottom: "16px" })}>
            <h2 style={{ fontSize: "34px", fontWeight: "800", color: "#0a0f28", margin: "0 0 12px", letterSpacing: "-0.5px" }}>
              Nos Piliers Fondamentaux
            </h2>
            <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0 }}>
              L'excellence n'est pas ce qu'ils il faut. une barrière à partir de quelques lignes de code.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "28px", marginTop: "48px" }}>
            {pillars.map(function (p, i) {
              return (
                <div key={i}
                  style={fadeUp(pilarsVisible, i * 0.13 + 0.1, {
                    background: "white", borderRadius: "16px", padding: "32px 28px",
                    border: "1px solid #e8efff",
                    boxShadow: "0 2px 12px rgba(21,101,192,0.05)"
                  })}
                  onMouseEnter={function (e) { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(21,101,192,0.10)"; }}
                  onMouseLeave={function (e) { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 12px rgba(21,101,192,0.05)"; }}
                >
                  {/* Icône dans un cercle */}
                  <div style={{
                    width: "52px", height: "52px", background: "#e8f0fe",
                    borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: "20px"
                  }}>
                    {p.icon}
                  </div>
                  <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#0a0f28", margin: "0 0 12px" }}>{p.titre}</h3>
                  <p style={{ color: "#64748b", fontSize: "14px", lineHeight: "1.75", margin: 0 }}>{p.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SECTION : Contactez l'Équipe ── */}
      <section ref={contactRef} style={{ padding: "80px 48px", background: "#fff" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "48px", alignItems: "start"
          }}>

            {/* Bloc bleu gauche */}
            <div style={fadeLeft(contactVisible, 0.05, {
              background: "linear-gradient(135deg, #1565C0 0%, #1976D2 100%)",
              borderRadius: "20px", padding: "40px 32px",
              color: "white"
            })}>
              <h2 style={{ fontSize: "26px", fontWeight: "800", margin: "0 0 12px", lineHeight: "1.25" }}>
                Contactez<br />l'Équipe
              </h2>
              <p style={{ fontSize: "14px", opacity: 0.85, lineHeight: "1.7", margin: "0 0 32px" }}>
                Nous nous engageons à fournir un service de qualité. Contactez-nous pour toute question.
              </p>

              {/* Adresse */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "16px" }}>
                <div style={{ marginTop: "2px", flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" stroke="white" strokeWidth="2" />
                    <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" stroke="white" strokeWidth="2" />
                  </svg>
                </div>
                <span style={{ fontSize: "14px", opacity: 0.9, lineHeight: "1.5" }}>Douala, Cameroun<br />Bonanjo Centre</span>
              </div>

              {/* Email */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span style={{ fontSize: "14px", opacity: 0.9 }}>contact@placementpro.cm</span>
              </div>
            </div>

            {/* Formulaire droite */}
            <div style={fadeRight(contactVisible, 0.15)}>
              {/* Nom complet */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  VOTRE COMPLET
                </label>
                <input
                  type="text"
                  placeholder="Jean Dupont"
                  value={form.nom}
                  onChange={function (e) { setForm(function (f) { return Object.assign({}, f, { nom: e.target.value }); }); }}
                  style={{
                    width: "100%", border: "1px solid #e2e8f0", borderRadius: "10px",
                    padding: "12px 16px", fontSize: "14px", outline: "none",
                    fontFamily: "inherit", color: "#0a0f28", background: "#f8faff",
                    boxSizing: "border-box", transition: "border-color 0.2s"
                  }}
                  onFocus={function (e) { e.target.style.borderColor = "#90CAF9"; }}
                  onBlur={function (e) { e.target.style.borderColor = "#e2e8f0"; }}
                />
              </div>

              {/* Email */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  EMAIL
                </label>
                <input
                  type="email"
                  placeholder="jean@exemple.com"
                  value={form.email}
                  onChange={function (e) { setForm(function (f) { return Object.assign({}, f, { email: e.target.value }); }); }}
                  style={{
                    width: "100%", border: "1px solid #e2e8f0", borderRadius: "10px",
                    padding: "12px 16px", fontSize: "14px", outline: "none",
                    fontFamily: "inherit", color: "#0a0f28", background: "#f8faff",
                    boxSizing: "border-box", transition: "border-color 0.2s"
                  }}
                  onFocus={function (e) { e.target.style.borderColor = "#90CAF9"; }}
                  onBlur={function (e) { e.target.style.borderColor = "#e2e8f0"; }}
                />
              </div>

              {/* Message */}
              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#475569", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  VOTRE MESSAGE
                </label>
                <textarea
                  placeholder="Comment pouvons-nous vous aider ?"
                  rows={4}
                  value={form.message}
                  onChange={function (e) { setForm(function (f) { return Object.assign({}, f, { message: e.target.value }); }); }}
                  style={{
                    width: "100%", border: "1px solid #e2e8f0", borderRadius: "10px",
                    padding: "12px 16px", fontSize: "14px", outline: "none",
                    fontFamily: "inherit", color: "#0a0f28", background: "#f8faff",
                    boxSizing: "border-box", resize: "vertical", transition: "border-color 0.2s"
                  }}
                  onFocus={function (e) { e.target.style.borderColor = "#90CAF9"; }}
                  onBlur={function (e) { e.target.style.borderColor = "#e2e8f0"; }}
                />
              </div>

              <button
                style={{
                  background: "#1565C0", color: "white", border: "none",
                  padding: "13px 32px", borderRadius: "10px",
                  fontSize: "14px", fontWeight: "600", cursor: "pointer",
                  transition: "background 0.2s"
                }}
                onMouseEnter={function (e) { e.currentTarget.style.background = "#0d47a1"; }}
                onMouseLeave={function (e) { e.currentTarget.style.background = "#1565C0"; }}
              >
                Envoyer le Message
              </button>
            </div>
          </div>
        </div>
      </section>

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