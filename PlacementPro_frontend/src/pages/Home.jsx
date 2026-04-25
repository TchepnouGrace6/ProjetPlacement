import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { getRole } from "../api/auth";

const API_URL = "http://127.0.0.1:8000/api/auth";

/* ─── Hook visibilité scroll ─── */
function useInView(threshold) {
  if (threshold === undefined) threshold = 0.15;
  var ref = useRef(null);
  var state = useState(false);
  var visible = state[0];
  var setVisible = state[1];
  useEffect(function() {
    var obs = new IntersectionObserver(function(entries) {
      if (entries[0].isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: threshold });
    if (ref.current) obs.observe(ref.current);
    return function() { obs.disconnect(); };
  }, []);
  return [ref, visible];
}

/* ─── Animation compteur ─── */
function useCounter(target, active, duration) {
  if (duration === undefined) duration = 2000;
  var state = useState(0);
  var val = state[0];
  var setVal = state[1];
  useEffect(function() {
    if (!active) return;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(ease * target));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [active, target]);
  return val;
}

/* ─── Helpers animation — retournent un objet style plat ─── */
function fadeUp(visible, delay, extra) {
  if (delay === undefined) delay = 0;
  var s = {
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(36px)",
    transition: "opacity 0.75s ease " + delay + "s, transform 0.75s cubic-bezier(0.16,1,0.3,1) " + delay + "s"
  };
  if (extra) { Object.keys(extra).forEach(function(k) { s[k] = extra[k]; }); }
  return s;
}
function fadeLeft(visible, delay, extra) {
  if (delay === undefined) delay = 0;
  var s = {
    opacity: visible ? 1 : 0,
    transform: visible ? "translateX(0)" : "translateX(-48px)",
    transition: "opacity 0.8s ease " + delay + "s, transform 0.8s cubic-bezier(0.16,1,0.3,1) " + delay + "s"
  };
  if (extra) { Object.keys(extra).forEach(function(k) { s[k] = extra[k]; }); }
  return s;
}
function fadeRight(visible, delay, extra) {
  if (delay === undefined) delay = 0;
  var s = {
    opacity: visible ? 1 : 0,
    transform: visible ? "translateX(0)" : "translateX(48px)",
    transition: "opacity 0.8s ease " + delay + "s, transform 0.8s cubic-bezier(0.16,1,0.3,1) " + delay + "s"
  };
  if (extra) { Object.keys(extra).forEach(function(k) { s[k] = extra[k]; }); }
  return s;
}

/* ──────────────────────────────────────────
   Mini Chatbot
────────────────────────────────────────── */
function Chatbot() {
  var openState = useState(false);
  var open = openState[0];
  var setOpen = openState[1];

  var msgState = useState([
    { role: "assistant", content: "Bonjour ! Je suis l'assistant PlacementPro. Comment puis-je vous aider ? 😊" }
  ]);
  var messages = msgState[0];
  var setMessages = msgState[1];

  var inputState = useState("");
  var input = inputState[0];
  var setInput = inputState[1];

  var loadingState = useState(false);
  var loading = loadingState[0];
  var setLoading = loadingState[1];

  var bottomRef = useRef(null);

  useEffect(function() {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  function send() {
    var text = input.trim();
    if (!text || loading) return;
    var userMsg = { role: "user", content: text };
    var history = messages.concat([userMsg]);
    setMessages(history);
    setInput("");
    setLoading(true);

    fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: "Tu es l'assistant virtuel de PlacementPro, la plateforme d'emploi #1 au Cameroun. Tu aides les candidats à trouver un emploi, comprendre comment postuler, créer leur profil, etc. Sois concis, bienveillant et réponds toujours en français. PlacementPro propose des offres d'emploi (CDI, CDD, stage, alternance, freelance) pour des entreprises camerounaises vérifiées.",
        messages: history.map(function(m) { return { role: m.role, content: m.content }; })
      })
    }).then(function(res) {
      return res.json();
    }).then(function(data) {
      var reply = "Désolé, je n'ai pas pu répondre.";
      if (data.content && data.content[0] && data.content[0].text) reply = data.content[0].text;
      setMessages(function(prev) { return prev.concat([{ role: "assistant", content: reply }]); });
      setLoading(false);
    }).catch(function() {
      setMessages(function(prev) { return prev.concat([{ role: "assistant", content: "Une erreur est survenue. Veuillez réessayer." }]); });
      setLoading(false);
    });
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  return (
    <div>
      {/* Bouton flottant */}
      <button
        onClick={function() { setOpen(function(o) { return !o; }); }}
        title={open ? "Fermer" : "Aide & Chat"}
        style={{
          position: "fixed", bottom: "32px", right: "32px", zIndex: 9999,
          width: "56px", height: "56px", borderRadius: "50%",
          background: "#1565C0", border: "none", cursor: "pointer",
          boxShadow: "0 4px 20px rgba(21,101,192,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "transform 0.25s, background 0.2s",
          transform: open ? "rotate(45deg)" : "rotate(0deg)"
        }}
        onMouseEnter={function(e) { e.currentTarget.style.background = "#0d47a1"; }}
        onMouseLeave={function(e) { e.currentTarget.style.background = "#1565C0"; }}
      >
        {open
          ? <span style={{ color: "white", fontSize: "22px", lineHeight: "1", fontWeight: "300" }}>✕</span>
          : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="white"/>
            </svg>
          )
        }
      </button>

      {/* Fenêtre chat */}
      {open && (
        <div style={{
          position: "fixed", bottom: "100px", right: "32px", zIndex: 9998,
          width: "360px",
          background: "white", borderRadius: "20px",
          boxShadow: "0 8px 48px rgba(0,0,0,0.18)",
          display: "flex", flexDirection: "column",
          border: "1px solid #e8efff",
          animation: "chatIn 0.25s cubic-bezier(0.16,1,0.3,1)"
        }}>
          {/* Header */}
          <div style={{ background: "#1565C0", borderRadius: "20px 20px 0 0", padding: "16px 20px", display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "18px" }}>🤖</span>
            </div>
            <div>
              <div style={{ color: "white", fontWeight: "700", fontSize: "14px" }}>Assistant PlacementPro</div>
              <div style={{ color: "rgba(255,255,255,0.75)", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "6px", height: "6px", background: "#4CAF50", borderRadius: "50%", display: "inline-block" }} />
                En ligne
              </div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px", maxHeight: "360px" }}>
            {messages.map(function(m, i) {
              return (
                <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                  {m.role === "assistant" && (
                    <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#e8efff", display: "flex", alignItems: "center", justifyContent: "center", marginRight: "8px", flexShrink: 0, fontSize: "14px", alignSelf: "flex-end" }}>🤖</div>
                  )}
                  <div style={{
                    maxWidth: "72%",
                    background: m.role === "user" ? "#1565C0" : "#f0f4ff",
                    color: m.role === "user" ? "white" : "#0a0f28",
                    padding: "10px 14px",
                    borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    fontSize: "13.5px", lineHeight: "1.6", whiteSpace: "pre-wrap"
                  }}>{m.content}</div>
                </div>
              );
            })}
            {loading && (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#e8efff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>🤖</div>
                <div style={{ background: "#f0f4ff", padding: "10px 14px", borderRadius: "16px 16px 16px 4px", display: "flex", gap: "4px" }}>
                  {[0, 1, 2].map(function(j) {
                    return (
                      <span key={j} style={{
                        width: "6px", height: "6px", background: "#94a3b8",
                        borderRadius: "50%", display: "inline-block",
                        animation: "bounce 1s ease-in-out " + (j * 0.2) + "s infinite"
                      }} />
                    );
                  })}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "12px 16px", borderTop: "1px solid #e8efff", display: "flex", gap: "8px", alignItems: "flex-end" }}>
            <textarea
              value={input}
              onChange={function(e) { setInput(e.target.value); }}
              onKeyDown={handleKey}
              placeholder="Posez votre question…"
              rows={1}
              style={{
                flex: 1, border: "1px solid #e8efff", borderRadius: "12px",
                padding: "10px 14px", fontSize: "13.5px", resize: "none",
                outline: "none", fontFamily: "inherit", lineHeight: "1.5",
                background: "#f8faff", color: "#0a0f28",
                maxHeight: "80px", overflowY: "auto"
              }}
              onFocus={function(e) { e.target.style.borderColor = "#90CAF9"; }}
              onBlur={function(e) { e.target.style.borderColor = "#e8efff"; }}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              style={{
                width: "38px", height: "38px", borderRadius: "12px",
                background: (input.trim() && !loading) ? "#1565C0" : "#e8efff",
                border: "none",
                cursor: (input.trim() && !loading) ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.2s", flexShrink: 0
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill={(input.trim() && !loading) ? "white" : "#94a3b8"} />
              </svg>
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes chatIn {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40%           { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}

/* ──────────────────────────────────────────
   Page principale
────────────────────────────────────────── */
export default function Home() {
  var annoncesState = useState([]);
  var annonces = annoncesState[0];
  var setAnnonces = annoncesState[1];

  var statsState = useState({ offres: 0, recruteurs: 0, candidats: 0 });
  var stats = statsState[0];
  var setStats = statsState[1];

  var heroState = useState(false);
  var heroVisible = heroState[0];
  var setHeroVisible = heroState[1];

  var navigate = useNavigate();

  var aboutInView  = useInView(0.15);
  var aboutRef     = aboutInView[0];
  var aboutVisible = aboutInView[1];

  var missionInView  = useInView(0.2);
  var missionRef     = missionInView[0];
  var missionVisible = missionInView[1];

  var offresInView  = useInView(0.1);
  var offresRef     = offresInView[0];
  var offresVisible = offresInView[1];

  var statsInView  = useInView(0.3);
  var statsRef     = statsInView[0];
  var statsVisible = statsInView[1];

  var avisInView  = useInView(0.1);
  var avisRef     = avisInView[0];
  var avisVisible = avisInView[1];

  var cOffres     = useCounter(stats.offres,     statsVisible);
  var cRecruteurs = useCounter(stats.recruteurs, statsVisible);
  var cCandidats  = useCounter(stats.candidats,  statsVisible);

  useEffect(function() {
    setTimeout(function() { setHeroVisible(true); }, 100);
    chargerAnnonces();
    chargerStats();
  }, []);

  function chargerAnnonces() {
    axios.get(API_URL + "/annonces/").then(function(res) {
      setAnnonces((res.data.results || res.data).slice(0, 6));
    }).catch(function(e) { console.error(e); });
  }

  function chargerStats() {
    Promise.allSettled([
      //axios.get(API_URL + "/annonces/"),
      //axios.get(API_URL + "/stats/recruteurs/"),
      //axios.get(API_URL + "/stats/candidats/"),
    ]).then(function(results) {
      var a = results[0];
      var r = results[1];
      var c = results[2];
      setStats({
        offres:     a.status === "fulfilled" ? (a.value.data.count || (a.value.data.results || a.value.data).length) : 0,
        recruteurs: r.status === "fulfilled" ? (r.value.data.count || r.value.data.length || 0) : 0,
        candidats:  c.status === "fulfilled" ? (c.value.data.count || c.value.data.length || 0) : 0,
      });
    }).catch(function() {});
  }

  function handlePostuler(annonceId) {
    var role = getRole();
    if (!role) navigate("/inscription");
    else if (role === "candidat") navigate("/nos-offres/" + annonceId);
    else navigate("/connexion");
  }

  var avis = [
    { nom: "Sophie M.", poste: "Développeuse Frontend", etoiles: 5, texte: "PlacementPro m'a permis de trouver mon emploi en moins de 2 semaines. La plateforme est intuitive et les offres sont de qualité.", avatar: "SM" },
    { nom: "Jean-Paul K.", poste: "Responsable RH, MTN", etoiles: 5, texte: "Excellent outil pour recruter des talents qualifiés. Le processus de validation est rassurant et la qualité des candidats est au rendez-vous.", avatar: "JK" },
    { nom: "Marie T.", poste: "Ingénieure Réseau", etoiles: 4, texte: "Interface claire, offres variées et un système de matching vraiment efficace. Je recommande PlacementPro à tous les chercheurs d'emploi.", avatar: "MT" },
  ];

  var features = [
    { icon: "🎯", titre: "Matching intelligent", desc: "Notre algorithme analyse les compétences et les besoins pour vous proposer les meilleures correspondances automatiquement." },
    { icon: "🛡️", titre: "Entreprises vérifiées", desc: "Chaque recruteur est validé par notre équipe après vérification de ses documents légaux. Zéro arnaque." },
    { icon: "⚡", titre: "Processus rapide", desc: "De l'inscription à la candidature en quelques minutes. Notifications en temps réel à chaque étape de votre dossier." },
  ];

  var checkItems = [
    "Profil analysé et mis en valeur automatiquement",
    "Alertes personnalisées selon votre secteur",
    "Suivi en temps réel de vos candidatures",
  ];

  var statsData = [
    { valeur: cOffres.toLocaleString("fr-FR") + "+",     label: "Offres d'emploi" },
    { valeur: cRecruteurs.toLocaleString("fr-FR") + "+", label: "Recruteurs" },
    { valeur: cCandidats.toLocaleString("fr-FR") + "+",  label: "Candidats" },
    { valeur: "98%",                                      label: "Taux de satisfaction" },
  ];

  var footerCols = [
    { titre: "Plateforme", liens: ["Nos offres", "À propos", "FAQ", "Contact"] },
    { titre: "Candidats",  liens: ["S'inscrire", "Mon profil", "Mes candidatures", "Alertes emploi"] },
    { titre: "Recruteurs", liens: ["Publier une offre", "Nos candidats", "Tarifs", "Support"] },
  ];

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: "#fff", minHeight: "100vh" }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 48px", height: "64px",
        background: "rgba(10,15,40,0.85)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "48px" }}>
          <span style={{ color: "white", fontWeight: "700", fontSize: "20px", letterSpacing: "-0.5px" }}>PlacementPro</span>
          <div style={{ display: "flex", gap: "32px" }}>
            {[["Accueil", "/"], ["Nos Offres", "/nos-offres"], ["À propos", "/apropos"], ["FAQ", "/faq"]].map(function(item) {
              return (
                <Link key={item[0]} to={item[1]}
                  style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none", fontSize: "14px", fontWeight: "500", transition: "color 0.2s" }}
                  onMouseEnter={function(e) { e.target.style.color = "white"; }}
                  onMouseLeave={function(e) { e.target.style.color = "rgba(255,255,255,0.8)"; }}
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

      {/* ── HERO ── */}
      <section style={{
        minHeight: "100vh", position: "relative", overflow: "hidden",
        display: "flex", alignItems: "center",
        background: "linear-gradient(135deg, #4a0000 0%, #7b0000 40%, #b71c1c 70%, #c62828 100%)"
      }}>
        <div style={{ position: "absolute", inset: 0, background: "url('/src/assets/background.png') center/cover no-repeat", opacity: 0.8 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(10,15,40,0.95) 0%, rgba(10,15,40,0.7) 25%, rgba(10,15,40,0.3) 100%)" }} />
        <div style={{ position: "relative", zIndex: 2, maxWidth: "1200px", margin: "0 auto", padding: "0 48px", width: "100%" }}>
          <div style={{
            maxWidth: "600px",
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? "translateY(0)" : "translateY(48px)",
            transition: "opacity 1s ease, transform 1s cubic-bezier(0.16,1,0.3,1)"
          }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(21,101,192,0.2)", border: "1px solid rgba(21,101,192,0.4)", borderRadius: "100px", padding: "6px 16px", marginBottom: "24px" }}>
              <div style={{ width: "6px", height: "6px", background: "#4CAF50", borderRadius: "50%" }} />
              <span style={{ color: "#90CAF9", fontSize: "13px", fontWeight: "500" }}>Plateforme d'emploi #1 au Cameroun</span>
            </div>
            <h1 style={{ fontSize: "clamp(36px, 5vw, 64px)", fontWeight: "800", color: "white", lineHeight: "1.1", margin: "0 0 24px", letterSpacing: "-1px" }}>
              L'avenir du<br />
              <span style={{ color: "#64B5F6" }}>recrutement</span><br />
              est <span style={{ fontStyle: "italic", color: "#90CAF9" }}>automatisé.</span>
            </h1>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "18px", lineHeight: "1.7", margin: "0 0 36px" }}>
              Connectez les meilleurs talents aux meilleures entreprises grâce à notre moteur de matching intelligent.
            </p>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <Link to="/nos-offres" style={{ background: "#1565C0", color: "white", textDecoration: "none", padding: "14px 32px", borderRadius: "10px", fontSize: "15px", fontWeight: "600", display: "inline-block" }}>Voir les offres</Link>
              <Link to="/inscription" style={{ background: "rgba(255,255,255,0.1)", color: "white", textDecoration: "none", padding: "14px 32px", borderRadius: "10px", fontSize: "15px", fontWeight: "500", border: "1px solid rgba(255,255,255,0.3)", display: "inline-block" }}>Créer un compte</Link>
            </div>
          </div>
        </div>
        <div style={{ position: "absolute", bottom: "32px", left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", opacity: 0.6 }}>
          <span style={{ color: "white", fontSize: "12px" }}>Découvrir</span>
          <div style={{ width: "24px", height: "40px", border: "2px solid rgba(255,255,255,0.4)", borderRadius: "12px", display: "flex", justifyContent: "center", padding: "6px 0" }}>
            <div style={{ width: "4px", height: "8px", background: "white", borderRadius: "2px", animation: "scrollAnim 1.5s ease-in-out infinite" }} />
          </div>
        </div>
      </section>

      {/* ── À PROPOS ── */}
      <section ref={aboutRef} style={{ padding: "80px 48px", background: "#fff", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={fadeUp(aboutVisible, 0, { textAlign: "center", marginBottom: "56px" })}>
          <p style={{ color: "#1565C0", fontSize: "14px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>PlacementPro</p>
          <h2 style={{ fontSize: "40px", fontWeight: "800", color: "#0a0f28", margin: "0 0 20px", letterSpacing: "-0.5px" }}>Plus qu'une plateforme</h2>
          <p style={{ color: "#64748b", fontSize: "17px", maxWidth: "600px", margin: "0 auto", lineHeight: "1.7" }}>
            PlacementPro transforme la recherche d'emploi au Cameroun en connectant intelligemment candidats qualifiés et entreprises de confiance.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "32px" }}>
          {features.map(function(item, i) {
            return (
              <div key={i}
                style={fadeUp(aboutVisible, i * 0.12 + 0.1, { background: "#f8faff", borderRadius: "16px", padding: "32px", border: "1px solid #e8efff" })}
                onMouseEnter={function(e) { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(21,101,192,0.1)"; }}
                onMouseLeave={function(e) { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "none"; }}
              >
                <div style={{ fontSize: "36px", marginBottom: "16px" }}>{item.icon}</div>
                <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#0a0f28", margin: "0 0 12px" }}>{item.titre}</h3>
                <p style={{ color: "#64748b", lineHeight: "1.7", margin: 0, fontSize: "15px" }}>{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── MISSION ── */}
      <section ref={missionRef} style={{ padding: "80px 48px", background: "#f0f4ff" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px", alignItems: "center" }}>
          <div style={fadeLeft(missionVisible, 0.1)}>
            <div style={{ borderRadius: "20px", overflow: "hidden", aspectRatio: "4/3", background: "linear-gradient(135deg, #1a237e, #1565C0)" }}>
              <img src="/src/assets/cap1.png" alt="Rencontre candidat recruteur" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }} />
            </div>
            <div style={{ marginTop: "-20px", marginLeft: "auto", width: "fit-content", background: "#1565C0", color: "white", borderRadius: "16px", padding: "20px 24px", boxShadow: "0 8px 32px rgba(21,101,192,0.3)" }}>
              <div style={{ fontSize: "28px", fontWeight: "800" }}>500+</div>
              <div style={{ fontSize: "13px", opacity: 0.9 }}>Candidats placés</div>
            </div>
          </div>
          <div style={fadeRight(missionVisible, 0.25)}>
            <p style={{ color: "#1565C0", fontSize: "14px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>Notre mission</p>
            <h2 style={{ fontSize: "36px", fontWeight: "800", color: "#0a0f28", margin: "0 0 20px", letterSpacing: "-0.5px", lineHeight: "1.2" }}>La rencontre qui va<br />tout changer</h2>
            <p style={{ color: "#64748b", fontSize: "16px", lineHeight: "1.8", marginBottom: "24px" }}>
              Nous croyons que chaque talent mérite une opportunité. PlacementPro crée le pont entre les jeunes professionnels camerounais et les entreprises qui recherchent exactement leurs compétences.
            </p>
            {checkItems.map(function(item, i) {
              return (
                <div key={i} style={fadeUp(missionVisible, 0.35 + i * 0.1, { display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" })}>
                  <div style={{ width: "20px", height: "20px", background: "#1565C0", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ color: "white", fontSize: "11px", fontWeight: "700" }}>✓</span>
                  </div>
                  <span style={{ color: "#475569", fontSize: "15px" }}>{item}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── OFFRES ── */}
      <section ref={offresRef} style={{ padding: "80px 48px", background: "#fff" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={fadeUp(offresVisible, 0, { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "40px" })}>
            <div>
              <p style={{ color: "#1565C0", fontSize: "14px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Opportunités</p>
              <h2 style={{ fontSize: "36px", fontWeight: "800", color: "#0a0f28", margin: 0, letterSpacing: "-0.5px" }}>Offres à la une</h2>
            </div>
            <Link to="/nos-offres" style={{ color: "#1565C0", textDecoration: "none", fontSize: "15px", fontWeight: "600" }}>Voir tout →</Link>
          </div>
          {annonces.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px", color: "#94a3b8" }}>
              <div style={{ fontSize: "40px", marginBottom: "16px" }}>📋</div>
              <p style={{ fontSize: "16px" }}>Aucune offre disponible pour le moment.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
              {annonces.map(function(annonce, i) {
                return (
                  <OffreCard key={annonce.id} annonce={annonce} index={i} onPostuler={handlePostuler} parentVisible={offresVisible} />
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── STATS ── */}
      <section ref={statsRef} style={{ padding: "64px 48px", background: "#0a0f28" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "32px", textAlign: "center" }}>
            {statsData.map(function(s, i) {
              return (
                <div key={i} style={fadeUp(statsVisible, i * 0.1)}>
                  <div style={{ fontSize: "44px", fontWeight: "800", color: "#64B5F6", letterSpacing: "-1px" }}>{s.valeur}</div>
                  <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", marginTop: "8px", fontWeight: "500" }}>{s.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── AVIS ── */}
      <section ref={avisRef} style={{ padding: "80px 48px", background: "#f8faff" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={fadeUp(avisVisible, 0, { textAlign: "center", marginBottom: "48px" })}>
            <p style={{ color: "#1565C0", fontSize: "14px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>Témoignages</p>
            <h2 style={{ fontSize: "36px", fontWeight: "800", color: "#0a0f28", margin: "0 0 8px", letterSpacing: "-0.5px" }}>Ils nous font confiance</h2>
            <div style={{ display: "flex", justifyContent: "center", gap: "4px", marginTop: "12px" }}>
              {[1,2,3,4,5].map(function(i) { return <span key={i} style={{ color: "#FFC107", fontSize: "20px" }}>★</span>; })}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
            {avis.map(function(a, i) {
              return (
                <div key={i}
                  style={fadeUp(avisVisible, i * 0.15, { background: "white", borderRadius: "16px", padding: "28px", border: "1px solid #e8efff" })}
                  onMouseEnter={function(e) { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(21,101,192,0.1)"; }}
                  onMouseLeave={function(e) { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <div style={{ display: "flex", gap: "4px", marginBottom: "16px" }}>
                    {Array.from({ length: a.etoiles }).map(function(_, j) { return <span key={j} style={{ color: "#FFC107", fontSize: "16px" }}>★</span>; })}
                    {Array.from({ length: 5 - a.etoiles }).map(function(_, j) { return <span key={j} style={{ color: "#e2e8f0", fontSize: "16px" }}>★</span>; })}
                  </div>
                  <p style={{ color: "#475569", lineHeight: "1.7", fontSize: "15px", margin: "0 0 20px", fontStyle: "italic" }}>"{a.texte}"</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "44px", height: "44px", background: "#e8efff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#1565C0", fontWeight: "700", fontSize: "14px" }}>{a.avatar}</div>
                    <div>
                      <div style={{ fontWeight: "700", color: "#0a0f28", fontSize: "15px" }}>{a.nom}</div>
                      <div style={{ color: "#94a3b8", fontSize: "13px" }}>{a.poste}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#0a0f28", padding: "48px 48px 24px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "48px", marginBottom: "48px" }}>
            <div>
              <div style={{ color: "white", fontWeight: "700", fontSize: "20px", marginBottom: "16px" }}>PlacementPro</div>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", lineHeight: "1.8" }}>La plateforme de référence pour l'emploi au Cameroun. Matching intelligent, entreprises vérifiées.</p>
            </div>
            {footerCols.map(function(col, i) {
              return (
                <div key={i}>
                  <div style={{ color: "white", fontWeight: "600", fontSize: "14px", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{col.titre}</div>
                  {col.liens.map(function(lien) {
                    return <div key={lien} style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", marginBottom: "10px", cursor: "pointer" }}>{lien}</div>;
                  })}
                </div>
              );
            })}
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>© 2025 PlacementPro — Cameroun. Tous droits réservés.</span>
            <div style={{ display: "flex", gap: "24px" }}>
              {["Politique de confidentialité", "Conditions d'utilisation"].map(function(lien) {
                return <span key={lien} style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", cursor: "pointer" }}>{lien}</span>;
              })}
            </div>
          </div>
        </div>
      </footer>

      <Chatbot />

      <style>{`
        @keyframes scrollAnim {
          0%   { transform: translateY(0);    opacity: 1; }
          100% { transform: translateY(12px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/* ──────────────────────────────────────────
   Résolution URL logo — Django retourne une URL absolue via
   request.build_absolute_uri() dans AnnonceListSerializer.get_logo()
   On gère quand même les 3 cas possibles pour la robustesse.
────────────────────────────────────────── */
var DJANGO_BASE = "http://127.0.0.1:8000";

function resolveLogoUrl(logo) {
  if (!logo) return null;
  // Cas 1 : URL absolue déjà complète — retournée par build_absolute_uri()
  if (logo.startsWith("http://") || logo.startsWith("https://")) return logo;
  // Cas 2 : chemin relatif avec slash  ex: /media/documents/recruteurs/logos/img.png
  if (logo.startsWith("/")) return DJANGO_BASE + logo;
  // Cas 3 : chemin relatif sans slash  ex: media/documents/recruteurs/logos/img.png
  return DJANGO_BASE + "/" + logo;
}

/* ── Sous-composant logo avec fallback sur les initiales ── */
function LogoEntreprise(props) {
  var logo = props.logo;
  var nom = props.nom;
  var initiales = props.initiales;

  var errState = useState(false);
  var erreur = errState[0];
  var setErreur = errState[1];

  var url = resolveLogoUrl(logo);

  var styleBase = {
    width: "48px", height: "48px", borderRadius: "12px", flexShrink: 0
  };

  if (url && !erreur) {
    return (
      <img
        src={url}
        alt={nom || "Logo entreprise"}
        onError={function() { setErreur(true); }}
        style={{
          width: styleBase.width,
          height: styleBase.height,
          borderRadius: styleBase.borderRadius,
          flexShrink: styleBase.flexShrink,
          objectFit: "cover",
          border: "1px solid #e8efff",
          background: "#f8faff",
          display: "block"
        }}
      />
    );
  }

  return (
    <div style={{
      width: styleBase.width,
      height: styleBase.height,
      borderRadius: styleBase.borderRadius,
      flexShrink: styleBase.flexShrink,
      background: "#e8efff",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#1565C0", fontWeight: "700", fontSize: "15px"
    }}>
      {initiales}
    </div>
  );
}

/* ──────────────────────────────────────────
   Carte offre
────────────────────────────────────────── */
function OffreCard(props) {
  var annonce = props.annonce;
  var index = props.index;
  var onPostuler = props.onPostuler;
  var parentVisible = props.parentVisible;

  var daysDiff = Math.floor(
    (new Date() - new Date(annonce.date_creation || annonce.date_publication)) / (1000 * 60 * 60 * 24)
  );

  var contractColors = {
    cdi:        { bg: "#e8f5e9", color: "#2e7d32" },
    cdd:        { bg: "#fff3e0", color: "#e65100" },
    stage:      { bg: "#e3f2fd", color: "#1565C0" },
    alternance: { bg: "#f3e5f5", color: "#6a1b9a" },
    freelance:  { bg: "#fce4ec", color: "#880e4f" },
  };
  var ctColor = contractColors[annonce.type_contrat] || { bg: "#f1f5f9", color: "#475569" };
  var initiales = (annonce.nom_entreprise || "PP").substring(0, 2).toUpperCase();
  var delay = index * 0.1 + 0.15;

  return (
    <div
      style={{
        background: "white", borderRadius: "16px", padding: "24px",
        border: "1px solid #e8efff", position: "relative", cursor: "pointer",
        opacity: parentVisible ? 1 : 0,
        transform: parentVisible ? "translateY(0)" : "translateY(32px)",
        transition: "opacity 0.65s ease " + delay + "s, transform 0.65s cubic-bezier(0.16,1,0.3,1) " + delay + "s, box-shadow 0.2s, border-color 0.2s"
      }}
      onMouseEnter={function(e) { e.currentTarget.style.boxShadow = "0 8px 32px rgba(21,101,192,0.12)"; e.currentTarget.style.borderColor = "#90CAF9"; }}
      onMouseLeave={function(e) { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = "#e8efff"; }}
    >
      {daysDiff <= 3 && (
        <div style={{ position: "absolute", top: "16px", right: "16px", background: "#e8f5e9", color: "#2e7d32", fontSize: "11px", fontWeight: "600", padding: "3px 10px", borderRadius: "100px" }}>Nouveau</div>
      )}

      {/* En-tête carte : logo + nom entreprise */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
        <LogoEntreprise
          logo={annonce.logo}
          nom={annonce.nom_entreprise}
          initiales={initiales}
        />
        <div>
          <div style={{ fontWeight: "700", color: "#0a0f28", fontSize: "14px" }}>{annonce.nom_entreprise || "Entreprise"}</div>
          <div style={{ color: "#94a3b8", fontSize: "12px" }}>{annonce.localisation || annonce.ville}</div>
        </div>
      </div>

      <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0a0f28", margin: "0 0 8px", lineHeight: "1.3" }}>{annonce.titre}</h3>
      <div style={{ color: "#64748b", fontSize: "13px", marginBottom: "16px" }}>{annonce.secteur_activite}</div>

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
        <span style={{ background: ctColor.bg, color: ctColor.color, fontSize: "12px", fontWeight: "600", padding: "4px 12px", borderRadius: "100px" }}>
          {(annonce.type_contrat || "").toUpperCase()}
        </span>
        {annonce.salaire_min && (
          <span style={{ background: "#f0f4ff", color: "#1565C0", fontSize: "12px", fontWeight: "600", padding: "4px 12px", borderRadius: "100px" }}>
            {Number(annonce.salaire_min).toLocaleString("fr-FR")} FCFA
          </span>
        )}
      </div>

      <button
        onClick={function() { onPostuler(annonce.id); }}
        style={{ width: "100%", background: "#1565C0", color: "white", border: "none", borderRadius: "10px", padding: "10px", fontSize: "14px", fontWeight: "600", cursor: "pointer", transition: "background 0.2s" }}
        onMouseEnter={function(e) { e.target.style.background = "#0d47a1"; }}
        onMouseLeave={function(e) { e.target.style.background = "#1565C0"; }}
      >Voir les détails</button>
    </div>
  );
}