import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const offresRecentes = [
  { id: 1, poste: "Développeur Full Stack React/Django", entreprise: "Orange Cameroun", ville: "Douala", type: "CDI", date: "Il y a 2 jours", logo: "OC", couleur: "#FF6600" },
  { id: 2, poste: "Responsable Marketing Digital", entreprise: "MTN Cameroun", ville: "Yaoundé", type: "CDD", date: "Il y a 3 jours", logo: "MT", couleur: "#FFCC00" },
  { id: 3, poste: "Comptable Expérimenté(e)", entreprise: "Afriland First Bank", ville: "Douala", type: "CDI", date: "Il y a 5 jours", logo: "AF", couleur: "#1e1b6e" },
  { id: 4, poste: "Ingénieur Réseaux & Systèmes", entreprise: "Camtel", ville: "Yaoundé", type: "CDI", date: "Il y a 1 jour", logo: "CA", couleur: "#0d6efd" },
  { id: 5, poste: "Designer UX/UI Mobile", entreprise: "Express Union", ville: "Douala", type: "Stage", date: "Il y a 6 jours", logo: "EU", couleur: "#198754" },
  { id: 6, poste: "Data Analyst Junior", entreprise: "CCA Bank", ville: "Bafoussam", type: "CDI", date: "Il y a 4 jours", logo: "CC", couleur: "#dc3545" },
];

const etapes = [
  { num: "01", titre: "Créez votre profil", desc: "Inscrivez-vous en 2 minutes et renseignez vos compétences, formations et expériences professionnelles." },
  { num: "02", titre: "Notre IA analyse", desc: "Notre moteur de matching compare votre profil avec les milliers d'offres disponibles sur la plateforme." },
  { num: "03", titre: "Postulez & décrochez", desc: "Recevez des offres adaptées à votre profil et postulez en un clic. Soyez notifié à chaque étape." },
];

const stats = [
  { valeur: "2 400+", label: "Offres publiées" },
  { valeur: "850+", label: "Entreprises partenaires" },
  { valeur: "12 000+", label: "Candidats inscrits" },
  { valeur: "78%", label: "Taux de placement" },
];

const typeColors = {
  CDI: { bg: "#e6f1fb", text: "#185FA5" },
  CDD: { bg: "#faeeda", text: "#854F0B" },
  Stage: { bg: "#EAF3DE", text: "#3B6D11" },
};

const chatbotResponses = {
  bonjour: "Bonjour ! Je suis l'assistant PlacementPro. Comment puis-je vous aider ? Vous pouvez me poser des questions sur nos offres, l'inscription, ou le fonctionnement de la plateforme.",
  inscription: "Pour vous inscrire, cliquez sur « S'inscrire » en haut à droite. Si vous êtes candidat, c'est rapide — juste un email et un mot de passe. Si vous êtes recruteur, vous devrez fournir les documents de votre entreprise.",
  offres: "Nous avons actuellement plus de 2 400 offres dans de nombreux secteurs : tech, finance, marketing, santé, et plus encore. Rendez-vous sur « Nos Offres » pour explorer !",
  recruteur: "Pour les recruteurs, l'inscription nécessite une vérification (24–48h). Vous devrez fournir votre registre de commerce, certificat d'immatriculation et patente.",
  matching: "Notre système de matching analyse automatiquement vos compétences, votre expérience et vos préférences pour vous proposer les offres les plus adaptées.",
  "mot de passe": "Si vous avez oublié votre mot de passe, cliquez sur « Connexion » puis sur « Mot de passe oublié ». Vous recevrez un email de réinitialisation.",
  gratuit: "Oui, PlacementPro est entièrement gratuit pour les candidats ! Les recruteurs bénéficient également d'un accès de base sans frais.",
  default: "Je n'ai pas bien compris. Vous pouvez me demander des infos sur : l'inscription, les offres d'emploi, le matching, les recruteurs, ou le mot de passe.",
};

function getChatbotReply(message) {
  const msg = message.toLowerCase();
  for (const key of Object.keys(chatbotResponses)) {
    if (key !== "default" && msg.includes(key)) return chatbotResponses[key];
  }
  return chatbotResponses.default;
}

// ── Hook animations au scroll ──
function useScrollAnimation() {
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      .fade-up {
        opacity: 0;
        transform: translateY(40px);
        transition: opacity 0.9s cubic-bezier(0.22,1,0.36,1), transform 3s cubic-bezier(0.22,1,0.36,1);
      }
      .fade-up.visible {
        opacity: 1;
        transform: translateY(0);
      }
      .fade-left {
        opacity: 0;
        transform: translateX(-50px);
        transition: opacity 0.9s cubic-bezier(0.22,1,0.36,1), transform 3s cubic-bezier(0.22,1,0.36,1);
      }
      .fade-left.visible {
        opacity: 1;
        transform: translateX(0);
      }
      .fade-right {
        opacity: 0;
        transform: translateX(50px);
        transition: opacity 0.9s cubic-bezier(0.22,1,0.36,1), transform 3s cubic-bezier(0.22,1,0.36,1);
      }
      .fade-right.visible {
        opacity: 1;
        transform: translateX(0);
      }
      .fade-in {
        opacity: 0;
        transition: opacity 0.9s ease;
      }
      .fade-in.visible {
        opacity: 1;
      }
    `;
    document.head.appendChild(style);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const delay = parseInt(entry.target.dataset.delay || "0");
            setTimeout(() => {
              entry.target.classList.add("visible");
            }, delay);
          }
        });
      },
      { threshold: 0.12 }
    );

    const timer = setTimeout(() => {
      const elements = document.querySelectorAll(".fade-up, .fade-left, .fade-right, .fade-in");
      elements.forEach((el) => observer.observe(el));
    }, 100);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
      document.head.removeChild(style);
    };
  }, []);
}

export default function Home() {
  useScrollAnimation();

  const [recherche, setRecherche] = useState("");
  const [messages, setMessages] = useState([
    { from: "bot", text: "Bonjour 👋 Je suis votre assistant PlacementPro. Comment puis-je vous aider ?" },
  ]);
  const [inputChat, setInputChat] = useState("");
  const navigate = useNavigate();

  const handleRecherche = (e) => {
    e.preventDefault();
    navigate(`/offres?q=${recherche}`);
  };

  const envoyerMessage = (texte) => {
    const t = texte || inputChat;
    if (!t.trim()) return;
    const userMsg = { from: "user", text: t };
    const botMsg = { from: "bot", text: getChatbotReply(t) };
    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInputChat("");
  };

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: "#f8f9fa", minHeight: "100vh" }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        background: "white", borderBottom: "1px solid #e9ecef",
        padding: "0 40px", display: "flex", alignItems: "center",
        justifyContent: "space-between", height: "64px",
        position: "sticky", top: 0, zIndex: 100,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "40px" }}>
          <div style={{ fontWeight: 700, fontSize: "18px", color: "#1e1b6e", letterSpacing: "-0.3px" }}>
            Placement<span style={{ color: "#7F77DD" }}>Pro</span>
          </div>
          <div style={{ display: "flex", gap: "4px" }}>
            {[
              { label: "Accueil", to: "/" },
              { label: "Nos Offres", to: "/offres" },
              { label: "À propos", to: "/a-propos" },
              { label: "FAQ", to: "/faq" },
            ].map((item, i) => (
              <Link key={item.label} to={item.to} style={{
                padding: "6px 14px", borderRadius: "8px", fontSize: "14px",
                color: i === 0 ? "#1e1b6e" : "#6c757d",
                fontWeight: i === 0 ? "600" : "400",
                textDecoration: "none",
                background: i === 0 ? "#eeedfe" : "transparent",
              }}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <Link to="/connexion" style={{
            padding: "8px 18px", borderRadius: "8px", fontSize: "14px",
            color: "#1e1b6e", fontWeight: "500", textDecoration: "none",
            border: "1px solid #dee2e6", background: "white"
          }}>Connexion</Link>
          <Link to="/inscription" style={{
            padding: "8px 18px", borderRadius: "8px", fontSize: "14px",
            color: "white", fontWeight: "500", textDecoration: "none",
            background: "#1e1b6e"
          }}>S'inscrire</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        background: "linear-gradient(135deg, #1e1b6e 0%, #2d2a9e 60%, #534AB7 100%)",
        padding: "80px 40px 60px", textAlign: "center"
      }}>
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <div className="fade-in" data-delay="0" style={{
            display: "inline-block", background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.2)", borderRadius: "20px",
            padding: "5px 16px", fontSize: "12px", color: "rgba(255,255,255,0.9)",
            marginBottom: "24px", letterSpacing: "0.5px"
          }}>
            🇨🇲 La première plateforme d'emploi intelligente au Cameroun
          </div>
          <h1 className="fade-up" data-delay="150" style={{
            fontSize: "46px", fontWeight: "700", color: "white",
            lineHeight: "1.15", marginBottom: "18px", letterSpacing: "-1px"
          }}>
            Trouvez l'emploi qui vous<br />
            <span style={{ color: "#AFA9EC" }}>correspond vraiment</span>
          </h1>
          <p className="fade-up" data-delay="300" style={{
            fontSize: "16px", color: "rgba(255,255,255,0.72)", lineHeight: "1.7",
            marginBottom: "36px", maxWidth: "520px", margin: "0 auto 36px"
          }}>
            PlacementPro connecte les talents camerounais aux meilleures entreprises grâce à un système de matching intelligent basé sur vos compétences réelles.
          </p>
          <form className="fade-up" data-delay="450" onSubmit={handleRecherche} style={{
            display: "flex", gap: "8px", maxWidth: "540px", margin: "0 auto 40px",
            background: "white", borderRadius: "12px", padding: "6px 6px 6px 18px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)"
          }}>
            <input
              type="text"
              placeholder="Poste, compétence, entreprise..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              style={{
                flex: 1, border: "none", outline: "none",
                fontSize: "14px", color: "#212529", background: "transparent"
              }}
            />
            <button type="submit" style={{
              background: "#1e1b6e", color: "white", border: "none",
              borderRadius: "8px", padding: "10px 22px", fontSize: "14px",
              fontWeight: "500", cursor: "pointer"
            }}>Rechercher</button>
          </form>
          <div className="fade-up" data-delay="600" style={{ display: "flex", gap: "32px", justifyContent: "center", flexWrap: "wrap" }}>
            {stats.map((s) => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "24px", fontWeight: "700", color: "white" }}>{s.valeur}</div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)", marginTop: "2px" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRÉSENTATION PLACEMENTPRO ── */}
      <section style={{ background: "white", padding: "72px 40px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px", alignItems: "center" }}>

            {/* Texte gauche */}
            <div className="fade-left" data-delay="100">
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                background: "#eeedfe", borderRadius: "20px", padding: "5px 14px",
                fontSize: "12px", color: "#534AB7", fontWeight: "600",
                letterSpacing: "0.5px", marginBottom: "20px"
              }}>✦ QUI SOMMES-NOUS</div>
              <h2 style={{
                fontSize: "32px", fontWeight: "700", color: "#1a1a2e",
                lineHeight: "1.25", marginBottom: "18px", letterSpacing: "-0.5px"
              }}>
                PlacementPro, bien plus qu'une simple plateforme d'emploi
              </h2>
              <p style={{ fontSize: "15px", color: "#6c757d", lineHeight: "1.8", marginBottom: "14px" }}>
                Né d'un constat simple — la difficulté pour les jeunes diplômés camerounais de trouver un emploi correspondant à leurs compétences réelles — PlacementPro a été conçu pour transformer la façon dont les talents et les entreprises se rencontrent.
              </p>
              <p style={{ fontSize: "15px", color: "#6c757d", lineHeight: "1.8", marginBottom: "28px" }}>
                Contrairement aux plateformes classiques où le candidat noie sa candidature dans une masse de postulants, notre moteur de matching intelligent analyse en profondeur les compétences, formations et aspirations de chaque candidat pour ne proposer que des opportunités réellement pertinentes.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {[
                  { icon: "🎯", titre: "Matching intelligent", desc: "Algorithme d'analyse multicritères pour des opportunités ciblées" },
                  { icon: "🔒", titre: "Entreprises vérifiées", desc: "Chaque recruteur est validé manuellement par notre équipe" },
                  { icon: "📧", titre: "Suivi en temps réel", desc: "Notifications email à chaque étape de votre candidature" },
                ].map((item) => (
                  <div key={item.titre} style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                    <div style={{
                      width: "40px", height: "40px", minWidth: "40px", borderRadius: "10px",
                      background: "#eeedfe", display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: "18px"
                    }}>{item.icon}</div>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: "600", color: "#212529", marginBottom: "2px" }}>{item.titre}</div>
                      <div style={{ fontSize: "13px", color: "#6c757d" }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Carte droite */}
            <div className="fade-right" data-delay="200" style={{ position: "relative" }}>
              <div style={{
                background: "linear-gradient(135deg, #1e1b6e, #534AB7)",
                borderRadius: "20px", padding: "32px", color: "white"
              }}>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", marginBottom: "8px" }}>Notre mission</div>
                <div style={{ fontSize: "20px", fontWeight: "700", lineHeight: "1.4", marginBottom: "24px" }}>
                  "Connecter chaque talent à l'opportunité qui lui est destinée."
                </div>
                <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "12px", padding: "16px", marginBottom: "12px" }}>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", marginBottom: "4px" }}>Pour les candidats</div>
                  <div style={{ fontSize: "14px", color: "white" }}>Un espace pour valoriser vos compétences et accéder aux meilleures opportunités du marché camerounais.</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "12px", padding: "16px" }}>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", marginBottom: "4px" }}>Pour les recruteurs</div>
                  <div style={{ fontSize: "14px", color: "white" }}>Un outil puissant pour identifier, attirer et sélectionner les profils les plus adaptés à vos besoins.</div>
                </div>
              </div>
              <div style={{
                position: "absolute", top: "-14px", right: "-14px",
                background: "white", border: "1px solid #dee2e6", borderRadius: "12px",
                padding: "10px 14px", boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                display: "flex", alignItems: "center", gap: "8px"
              }}>
                <div style={{ width: "8px", height: "8px", background: "#198754", borderRadius: "50%" }} />
                <span style={{ fontSize: "12px", fontWeight: "500", color: "#212529" }}>Plateforme active 24/7</span>
              </div>
              <div style={{
                position: "absolute", bottom: "-14px", left: "-14px",
                background: "white", border: "1px solid #dee2e6", borderRadius: "12px",
                padding: "10px 14px", boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                display: "flex", alignItems: "center", gap: "8px"
              }}>
                <span style={{ fontSize: "18px" }}>🏆</span>
                <div>
                  <div style={{ fontSize: "11px", color: "#6c757d" }}>Taux de satisfaction</div>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: "#1e1b6e" }}>96% des utilisateurs</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── OFFRES RÉCENTES ── */}
      <section style={{ background: "#f8f9fa", padding: "72px 40px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div className="fade-up" data-delay="0" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "36px" }}>
            <div>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                background: "#eeedfe", borderRadius: "20px", padding: "5px 14px",
                fontSize: "12px", color: "#534AB7", fontWeight: "600",
                letterSpacing: "0.5px", marginBottom: "10px"
              }}>✦ OFFRES RÉCENTES</div>
              <h2 style={{ fontSize: "28px", fontWeight: "700", color: "#1a1a2e", margin: 0, letterSpacing: "-0.3px" }}>
                Les dernières opportunités
              </h2>
              <p style={{ fontSize: "14px", color: "#6c757d", marginTop: "6px" }}>
                Explorez sans connexion — postulez après votre inscription
              </p>
            </div>
            <Link to="/offres" style={{
              padding: "10px 20px", borderRadius: "8px", fontSize: "14px",
              color: "#1e1b6e", fontWeight: "500", textDecoration: "none",
              border: "1px solid #dee2e6", background: "white"
            }}>Voir toutes les offres →</Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
            {offresRecentes.map((offre, index) => (
              <div
                key={offre.id}
                className="fade-up"
                data-delay={index * 120}
                style={{
                  background: "white", borderRadius: "14px", border: "1px solid #e9ecef",
                  padding: "20px", cursor: "pointer", transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#7F77DD"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(30,27,110,0.08)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e9ecef"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                  <div style={{
                    width: "42px", height: "42px", borderRadius: "10px",
                    background: offre.couleur, display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: "13px", fontWeight: "700", color: "white"
                  }}>{offre.logo}</div>
                  <span style={{
                    fontSize: "11px", fontWeight: "600", padding: "3px 10px",
                    borderRadius: "20px", background: typeColors[offre.type]?.bg, color: typeColors[offre.type]?.text
                  }}>{offre.type}</span>
                </div>
                <div style={{ fontSize: "15px", fontWeight: "600", color: "#212529", marginBottom: "4px", lineHeight: "1.3" }}>
                  {offre.poste}
                </div>
                <div style={{ fontSize: "13px", color: "#6c757d", marginBottom: "12px" }}>{offre.entreprise}</div>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "12px", color: "#6c757d" }}>📍 {offre.ville}</span>
                  <span style={{ fontSize: "12px", color: "#6c757d" }}>🕐 {offre.date}</span>
                </div>
                <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid #f1f3f5" }}>
                  <Link to={`/offres/${offre.id}`} style={{ fontSize: "13px", color: "#1e1b6e", fontWeight: "500", textDecoration: "none" }}>
                    Voir l'offre →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE + CHATBOT ── */}
      <section style={{ background: "white", padding: "72px 40px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px", alignItems: "start" }}>

            {/* Étapes */}
            <div className="fade-left" data-delay="100">
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                background: "#eeedfe", borderRadius: "20px", padding: "5px 14px",
                fontSize: "12px", color: "#534AB7", fontWeight: "600",
                letterSpacing: "0.5px", marginBottom: "20px"
              }}>✦ COMMENT ÇA MARCHE</div>
              <h2 style={{ fontSize: "28px", fontWeight: "700", color: "#1a1a2e", marginBottom: "32px", letterSpacing: "-0.3px" }}>
                Décrochez votre emploi en 3 étapes
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {etapes.map((e, i) => (
                  <div key={e.num} className="fade-up" data-delay={200 + i * 150} style={{ display: "flex", gap: "20px" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{
                        width: "44px", height: "44px", minWidth: "44px", borderRadius: "12px",
                        background: "#1e1b6e", display: "flex", alignItems: "center",
                        justifyContent: "center", fontSize: "13px", fontWeight: "700", color: "white"
                      }}>{e.num}</div>
                      {i < etapes.length - 1 && (
                        <div style={{ width: "2px", flex: 1, background: "#eeedfe", marginTop: "8px", minHeight: "32px" }} />
                      )}
                    </div>
                    <div style={{ paddingTop: "10px" }}>
                      <div style={{ fontSize: "16px", fontWeight: "600", color: "#212529", marginBottom: "6px" }}>{e.titre}</div>
                      <div style={{ fontSize: "14px", color: "#6c757d", lineHeight: "1.6" }}>{e.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chatbot */}
            <div className="fade-right" data-delay="200">
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                background: "#eeedfe", borderRadius: "20px", padding: "5px 14px",
                fontSize: "12px", color: "#534AB7", fontWeight: "600",
                letterSpacing: "0.5px", marginBottom: "20px"
              }}>✦ ASSISTANT VIRTUEL</div>
              <h2 style={{ fontSize: "28px", fontWeight: "700", color: "#1a1a2e", marginBottom: "8px", letterSpacing: "-0.3px" }}>
                Une question ?
              </h2>
              <p style={{ fontSize: "14px", color: "#6c757d", marginBottom: "20px" }}>
                Notre assistant répond à vos questions 24h/24.
              </p>
              <div style={{ background: "#f8f9fa", borderRadius: "16px", border: "1px solid #e9ecef", overflow: "hidden" }}>
                <div style={{
                  background: "#1e1b6e", padding: "14px 18px",
                  display: "flex", alignItems: "center", gap: "10px"
                }}>
                  <div style={{
                    width: "32px", height: "32px", borderRadius: "50%",
                    background: "#7F77DD", display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: "14px"
                  }}>🤖</div>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "white" }}>Assistant PlacementPro</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <div style={{ width: "6px", height: "6px", background: "#4ade80", borderRadius: "50%" }} />
                      <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)" }}>En ligne</span>
                    </div>
                  </div>
                </div>
                <div style={{
                  height: "240px", overflowY: "auto", padding: "16px",
                  display: "flex", flexDirection: "column", gap: "10px"
                }}>
                  {messages.map((msg, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: msg.from === "user" ? "flex-end" : "flex-start" }}>
                      <div style={{
                        maxWidth: "80%", padding: "10px 14px", borderRadius: "12px",
                        fontSize: "13px", lineHeight: "1.5",
                        background: msg.from === "user" ? "#1e1b6e" : "white",
                        color: msg.from === "user" ? "white" : "#212529",
                        border: msg.from === "bot" ? "1px solid #e9ecef" : "none",
                        borderBottomRightRadius: msg.from === "user" ? "4px" : "12px",
                        borderBottomLeftRadius: msg.from === "bot" ? "4px" : "12px",
                      }}>{msg.text}</div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: "0 16px 10px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {["Inscription", "Matching", "Gratuit ?", "Recruteur"].map((s) => (
                    <button key={s} onClick={() => envoyerMessage(s)} style={{
                      padding: "4px 10px", borderRadius: "20px", fontSize: "12px",
                      border: "1px solid #dee2e6", background: "white", cursor: "pointer",
                      color: "#1e1b6e", fontWeight: "500"
                    }}>{s}</button>
                  ))}
                </div>
                <div style={{ padding: "12px 16px", borderTop: "1px solid #e9ecef", display: "flex", gap: "8px", background: "white" }}>
                  <input
                    type="text"
                    placeholder="Posez votre question..."
                    value={inputChat}
                    onChange={(e) => setInputChat(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && envoyerMessage()}
                    style={{
                      flex: 1, border: "1px solid #dee2e6", borderRadius: "8px",
                      padding: "8px 12px", fontSize: "13px", outline: "none",
                      background: "#f8f9fa"
                    }}
                  />
                  <button onClick={() => envoyerMessage()} style={{
                    background: "#1e1b6e", color: "white", border: "none",
                    borderRadius: "8px", padding: "8px 14px", fontSize: "13px",
                    cursor: "pointer", fontWeight: "500"
                  }}>Envoyer</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{
        background: "linear-gradient(135deg, #1e1b6e, #2d2a9e)",
        padding: "64px 40px", textAlign: "center"
      }}>
        <div className="fade-up" data-delay="100" style={{ maxWidth: "560px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "30px", fontWeight: "700", color: "white", marginBottom: "14px", letterSpacing: "-0.3px" }}>
            Prêt à booster votre carrière ?
          </h2>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.68)", marginBottom: "32px", lineHeight: "1.7" }}>
            Rejoignez les 12 000+ candidats et 850+ entreprises qui font confiance à PlacementPro.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <Link to="/inscription" style={{
              padding: "12px 28px", borderRadius: "10px", fontSize: "15px",
              fontWeight: "600", color: "#1e1b6e", background: "white", textDecoration: "none"
            }}>Créer mon compte gratuit</Link>
            <Link to="/offres" style={{
              padding: "12px 28px", borderRadius: "10px", fontSize: "15px",
              fontWeight: "500", color: "white", border: "1px solid rgba(255,255,255,0.3)",
              textDecoration: "none", background: "transparent"
            }}>Explorer les offres</Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#0f0e3d", padding: "40px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{
          maxWidth: "1100px", margin: "0 auto",
          display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px"
        }}>
          <div>
            <div style={{ fontWeight: "700", fontSize: "16px", color: "white", marginBottom: "6px" }}>
              Placement<span style={{ color: "#7F77DD" }}>Pro</span>
            </div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)" }}>
              © 2025 PlacementPro — Tous droits réservés — Cameroun
            </div>
          </div>
          <div style={{ display: "flex", gap: "24px" }}>
            {["Nos Offres", "À propos", "FAQ", "Connexion"].map((lien) => (
              <a key={lien} href="#" style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", textDecoration: "none" }}>
                {lien}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}