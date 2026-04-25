import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function FAQ() {
  const [activeSection, setActiveSection] = useState("candidats");
  const [openAccordion, setOpenAccordion] = useState(null);

  const categories = [
    { id: "candidats", icon: "👤", titre: "Candidats", desc: "Postuler, candidatures et offres d'emploi" },
    { id: "recruteurs", icon: "🏢", titre: "Recruteurs", desc: "Publier des annonces et trouver les meilleurs talents" },
    { id: "paiements", icon: "💳", titre: "Paiements", desc: "Facturation, abonnements et méthodes de paiement" },
    { id: "compte", icon: "⚙️", titre: "Compte", desc: "Sécurité, paramètres et notifications de votre compte" },
  ];

  const faqData = {
    candidats: [
      {
        question: "Comment fonctionne le matching automatique ?",
        reponse: "Notre algorithme analyse vos compétences, vos expériences et vos préférences pour vous proposer des offres qui correspondent à 80% ou plus à votre profil. Plus vous complétez votre profil, plus le matching est précis.",
      },
      {
        question: "Quels documents sont nécessaires pour postuler ?",
        reponse: "Un CV à jour au format PDF est obligatoire. Certains recruteurs peuvent également demander une lettre de motivation ou un portfolio, selon le type de poste et le niveau de séniorité.",
      },
      {
        question: "Puis-je modifier une candidature déjà envoyée ?",
        reponse: "Une fois envoyée, une candidature ne peut pas être modifiée directement. Cependant, vous pouvez retirer votre candidature et postuler à nouveau avec des documents mis à jour si l'offre est toujours en ligne.",
      },
    ],
    recruteurs: [
      {
        question: "Comment valider mon entreprise ?",
        reponse: "Pour valider votre entreprise, vous devez fournir un numéro RCCM valide et une adresse e-mail professionnelle liée au domaine de votre société. Notre équipe examine chaque dossier sous 24h-72h ouvrées.",
      },
      {
        question: "Quels sont les tarifs pour publier une annonce ?",
        reponse: "Nous proposons plusieurs formules. L'offre Basique à 5 000 FCFA par annonce, Premium à 15 000 FCFA avec mise en avant, et des forfaits illimités pour les entreprises à fort volume de recrutement.",
      },
      {
        question: "Comment gérer les candidatures reçues ?",
        reponse: "Depuis votre tableau de bord recruteur, vous pouvez consulter, filtrer, accepter ou rejeter chaque candidature. Vous pouvez aussi envoyer des messages directement aux candidats présélectionnés.",
      },
    ],
    paiements: [
      {
        question: "Quels modes de paiement sont acceptés ?",
        reponse: "Nous acceptons les paiements via MTN Mobile Money, Orange Money, ainsi que les cartes bancaires Visa et Mastercard. Les virements bancaires sont disponibles pour les formules entreprises.",
      },
      {
        question: "Comment obtenir une facture ?",
        reponse: "Chaque transaction génère automatiquement une facture PDF disponible dans votre espace \"Facturation\". Vous pouvez la télécharger à tout moment depuis votre historique de paiements.",
      },
      {
        question: "Puis-je obtenir un remboursement ?",
        reponse: "Les remboursements sont possibles sous 48h après paiement si aucune action n'a été effectuée avec l'offre achetée. Au-delà, notre équipe examine chaque demande au cas par cas.",
      },
    ],
    compte: [
      {
        question: "Comment modifier mon mot de passe ?",
        reponse: "Accédez à \"Paramètres\" → \"Sécurité\" puis cliquez sur \"Modifier le mot de passe\". Vous recevrez un e-mail de confirmation. Si vous l'avez oublié, utilisez la fonction \"Mot de passe oublié\" depuis la page de connexion.",
      },
      {
        question: "Comment activer les notifications d'alerte emploi ?",
        reponse: "Dans \"Mon Profil\" → \"Alertes emploi\", définissez vos critères (secteur, type de contrat, localisation) et activez les notifications par e-mail ou SMS. Vous serez alerté dès qu'une offre correspond à votre profil.",
      },
      {
        question: "Comment supprimer mon compte ?",
        reponse: "La suppression du compte est irréversible. Si vous souhaitez tout de même procéder, rendez-vous dans \"Paramètres\" → \"Compte\" → \"Supprimer mon compte\". Vos données seront effacées sous 30 jours conformément au RGPD.",
      },
    ],
  };

  const footerCols = [
    { titre: "Plateforme", liens: ["Nos offres", "À propos", "FAQ", "Contact"] },
    { titre: "Candidats",  liens: ["S'inscrire", "Mon profil", "Mes candidatures", "Alertes emploi"] },
    { titre: "Recruteurs", liens: ["Publier une offre", "Nos candidats", "Tarifs", "Support"] },
  ];

  function toggleAccordion(key) {
    setOpenAccordion(prev => (prev === key ? null : key));
  }

  /* ── INJECTION DU CSS D'ANIMATION (une seule fois au montage) ── */
  useEffect(() => {
    if (document.getElementById("faq-anim-style")) return;
    const style = document.createElement("style");
    style.id = "faq-anim-style";
    style.textContent = `
      @keyframes fadeUp {
        from { opacity: 0; transform: translateY(32px); }
        to   { opacity: 1; transform: translateY(0);    }
      }
      @keyframes fadeDown {
        from { opacity: 0; transform: translateY(-20px); }
        to   { opacity: 1; transform: translateY(0);     }
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
      .anim-fade-up   { opacity: 0; animation: fadeUp   0.6s ease forwards; }
      .anim-fade-down { opacity: 0; animation: fadeDown 0.5s ease forwards; }
      .anim-fade-in   { opacity: 0; animation: fadeIn   0.7s ease forwards; }

      /* scroll-reveal */
      .reveal {
        opacity: 0;
        transform: translateY(28px);
        transition: opacity 0.55s ease, transform 0.55s ease;
      }
      .reveal.visible {
        opacity: 1;
        transform: translateY(0);
      }
    `;
    document.head.appendChild(style);
  }, []);

  /* ── SCROLL REVEAL (se redéclenche quand la section change) ── */
  useEffect(() => {
    const timer = setTimeout(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 }
      );

      document.querySelectorAll(".reveal").forEach((el) => {
        el.classList.remove("visible");
        observer.observe(el);
      });

      return () => observer.disconnect();
    }, 60);

    return () => clearTimeout(timer);
  }, [activeSection]);

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", background: "#fff", minHeight: "100vh" }}>

      {/* ── NAVBAR : glisse depuis le haut ── */}
      <nav
        className="anim-fade-down"
        style={{
          animationDelay: "0ms",
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 48px", height: "64px",
          background: "rgba(10,15,40,0.88)", backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "48px" }}>
          <span style={{ color: "white", fontWeight: "700", fontSize: "20px", letterSpacing: "-0.5px" }}>PlacementPro</span>
          <div style={{ display: "flex", gap: "32px" }}>
            {[["Accueil", "/"], ["Nos Offres", "/nos-offres"], ["À propos", "/apropos"], ["FAQ", "/faq"]].map(function(item) {
              return (
                <Link key={item[0]} to={item[1]}
                  style={{
                    color: item[0] === "FAQ" ? "white" : "rgba(255,255,255,0.8)",
                    fontWeight: item[0] === "FAQ" ? "700" : "500",
                    textDecoration: "none", fontSize: "14px", transition: "color 0.2s"
                  }}
                  onMouseEnter={e => e.target.style.color = "white"}
                  onMouseLeave={e => e.target.style.color = item[0] === "FAQ" ? "white" : "rgba(255,255,255,0.8)"}
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

      {/* ── HERO : fondu général ── */}
      <section style={{
        position: "relative", minHeight: "300px",
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden", paddingTop: "64px"
      }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "url('/src/assets/cap2.png')",
          backgroundSize: "cover", backgroundPosition: "center",
         
        }} />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg, rgba(10,15,40,0.80) 100%, rgba(21,101,192,0.70) 0%)"
        }} />
        {/* Titre */}
        <div
          className="anim-fade-up"
          style={{
            animationDelay: "100ms",
            position: "relative", zIndex: 2, textAlign: "center",
            padding: "60px 48px 50px", maxWidth: "700px"
          }}
        >
          <h1 style={{ color: "white", fontSize: "38px", fontWeight: "800", marginBottom: "12px", letterSpacing: "-0.5px" }}>
            Centre d'Aide &amp; FAQ
          </h1>
          <p
            className="anim-fade-up"
            style={{ animationDelay: "220ms", color: "rgba(255,255,255,0.82)", fontSize: "16px", marginBottom: "28px" }}
          >
            Trouvez des réponses à toutes vos questions sur PlacementPro.
          </p>
          <div
            className="anim-fade-up"
            style={{
              animationDelay: "350ms",
              display: "flex", maxWidth: "500px", margin: "0 auto",
              background: "white", borderRadius: "10px", overflow: "hidden",
              boxShadow: "0 4px 24px rgba(0,0,0,0.18)"
            }}
          >
            <input
              type="text"
              placeholder="Rechercher un sujet ou un mot-clé…"
              style={{
                flex: 1, border: "none", outline: "none",
                padding: "14px 18px", fontSize: "14px",
                color: "#0a0f28", fontFamily: "inherit"
              }}
            />
            <button style={{
              background: "#1565C0", color: "white", border: "none",
              padding: "0 24px", fontSize: "14px", fontWeight: "600", cursor: "pointer"
            }}>Chercher</button>
          </div>
        </div>
      </section>

      {/* ── CATEGORY CARDS : montée en cascade ── */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
        gap: "20px", maxWidth: "1100px", margin: "-36px auto 0",
        padding: "0 48px", position: "relative", zIndex: 3
      }}>
        {categories.map((cat, i) => (
          <div
            key={cat.id}
            className="anim-fade-up"
            onClick={() => setActiveSection(cat.id)}
            style={{
              animationDelay: `${480 + i * 100}ms`,
              background: activeSection === cat.id ? "#f0f4ff" : "white",
              border: activeSection === cat.id ? "1px solid #1565C0" : "1px solid #e8efff",
              borderRadius: "14px", padding: "24px 20px",
              boxShadow: "0 4px 20px rgba(21,101,192,0.08)",
              cursor: "pointer", transition: "box-shadow 0.2s, transform 0.2s, border 0.2s, background 0.2s",
            }}
            onMouseEnter={e => { if (activeSection !== cat.id) { e.currentTarget.style.boxShadow = "0 8px 32px rgba(21,101,192,0.14)"; e.currentTarget.style.transform = "translateY(-3px)"; } }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(21,101,192,0.08)"; e.currentTarget.style.transform = "none"; }}
          >
            <div style={{ fontSize: "22px", marginBottom: "10px" }}>{cat.icon}</div>
            <div style={{ fontWeight: "700", color: "#0a0f28", fontSize: "14px", marginBottom: "4px" }}>{cat.titre}</div>
            <div style={{ color: "#64748b", fontSize: "12px", lineHeight: "1.5" }}>{cat.desc}</div>
          </div>
        ))}
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{
        maxWidth: "1100px", margin: "48px auto 0",
        padding: "0 48px 80px",
        display: "grid", gridTemplateColumns: "200px 1fr", gap: "40px"
      }}>

        {/* SIDEBAR */}
        <div
          className="reveal"
          style={{ transitionDelay: "0ms" }}
        >
          <div style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>
            SUJETS POPULAIRES
          </div>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveSection(cat.id)}
              style={{
                display: "block", width: "100%", textAlign: "left",
                padding: "10px 14px", borderRadius: "8px", border: "none",
                fontSize: "14px", fontWeight: activeSection === cat.id ? "700" : "500",
                color: activeSection === cat.id ? "#1565C0" : "#475569",
                background: activeSection === cat.id ? "#e8efff" : "transparent",
                cursor: "pointer", marginBottom: "4px", transition: "all 0.15s",
                fontFamily: "inherit"
              }}
              onMouseEnter={e => { if (activeSection !== cat.id) { e.currentTarget.style.background = "#f0f4ff"; e.currentTarget.style.color = "#1565C0"; } }}
              onMouseLeave={e => { if (activeSection !== cat.id) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#475569"; } }}
            >{cat.titre}</button>
          ))}
        </div>

        {/* FAQ ACCORDÉONS */}
        <div>
          {/* Titre de section */}
          <div
            className="reveal"
            style={{
              transitionDelay: "80ms",
              fontSize: "22px", fontWeight: "800", color: "#0a0f28",
              marginBottom: "20px", paddingBottom: "12px",
              borderBottom: "2px solid #e8efff"
            }}
          >
            {categories.find(c => c.id === activeSection)?.titre}
          </div>

          {(faqData[activeSection] || []).map((item, i) => {
            const key = activeSection + "-" + i;
            const isOpen = openAccordion === key;
            return (
              <div
                key={key}
                className="reveal"
                style={{
                  transitionDelay: `${160 + i * 100}ms`,
                  border: "1px solid #e8efff", borderRadius: "12px",
                  marginBottom: "10px", overflow: "hidden",
                  boxShadow: isOpen ? "0 4px 20px rgba(21,101,192,0.08)" : "none",
                  transition: "box-shadow 0.2s, opacity 0.55s ease, transform 0.55s ease",
                }}
              >
                <button
                  onClick={() => toggleAccordion(key)}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    width: "100%", padding: "16px 20px", border: "none",
                    background: isOpen ? "#f8faff" : "white",
                    cursor: "pointer", textAlign: "left", fontFamily: "inherit"
                  }}
                  onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = "#f8faff"; }}
                  onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = "white"; }}
                >
                  <span style={{ fontSize: "14px", fontWeight: "600", color: "#0a0f28" }}>{item.question}</span>
                  <span style={{
                    color: "#1565C0", fontSize: "18px", marginLeft: "12px", flexShrink: 0,
                    display: "inline-block",
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.25s"
                  }}>⌄</span>
                </button>
                {isOpen && (
                  <div style={{ background: "#f8faff", padding: "0 20px 16px" }}>
                    <p style={{ fontSize: "14px", color: "#475569", lineHeight: "1.8", margin: 0 }}>{item.reponse}</p>
                  </div>
                )}
              </div>
            );
          })}

          {/* CTA BANNER */}
          <div
            className="reveal"
            style={{
              transitionDelay: "460ms",
              background: "linear-gradient(90deg, #1565C0 0%, #1976D2 100%)",
              borderRadius: "16px", padding: "36px 40px", marginTop: "20px",
              display: "flex", justifyContent: "space-between", alignItems: "center"
            }}
          >
            <div>
              <h3 style={{ color: "white", fontSize: "20px", fontWeight: "800", marginBottom: "6px" }}>
                Vous n'avez pas trouvé de réponse ?
              </h3>
              <p style={{ color: "rgba(255,255,255,0.82)", fontSize: "14px", margin: 0 }}>
                Nos conseillers sont disponibles du lundi au samedi de 8h à 18h.
              </p>
            </div>
            <button style={{
              background: "white", color: "#1565C0", border: "none",
              padding: "12px 24px", borderRadius: "10px",
              fontSize: "14px", fontWeight: "700", cursor: "pointer",
              whiteSpace: "nowrap", flexShrink: 0
            }}>Contacter le Support →</button>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#0a0f28", padding: "48px 48px 24px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "48px", marginBottom: "48px" }}>

            <div className="reveal" style={{ transitionDelay: "0ms" }}>
              <div style={{ color: "white", fontWeight: "700", fontSize: "20px", marginBottom: "16px" }}>PlacementPro</div>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", lineHeight: "1.8", margin: 0 }}>
                La plateforme de référence pour l'emploi au Cameroun. Matching intelligent, entreprises vérifiées.
              </p>
            </div>

            {footerCols.map((col, i) => (
              <div key={col.titre} className="reveal" style={{ transitionDelay: `${(i + 1) * 100}ms` }}>
                <div style={{ color: "white", fontWeight: "600", fontSize: "14px", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{col.titre}</div>
                {col.liens.map(lien => (
                  <div key={lien} style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", marginBottom: "10px", cursor: "pointer" }}>{lien}</div>
                ))}
              </div>
            ))}
          </div>

          <div
            className="reveal"
            style={{
              transitionDelay: "400ms",
              borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "24px",
              display: "flex", justifyContent: "space-between", alignItems: "center"
            }}
          >
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>© 2025 PlacementPro — Cameroun. Tous droits réservés.</span>
            <div style={{ display: "flex", gap: "24px" }}>
              {["Politique de confidentialité", "Conditions d'utilisation"].map(lien => (
                <span key={lien} style={{ color: "rgba(255,255,255,0.4)", fontSize: "13px", cursor: "pointer" }}>{lien}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}