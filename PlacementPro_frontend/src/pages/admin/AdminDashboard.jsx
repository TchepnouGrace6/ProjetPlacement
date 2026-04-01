import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getToken, getRole, deconnexion } from "../../api/auth";

export default function AdminDashboard() {
  const [recruteurs, setRecruteurs] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const navigate = useNavigate();
  const email = localStorage.getItem("email") || "Admin";
  const initiales = email.substring(0, 2).toUpperCase();

  useEffect(() => {
    if (getRole() !== "admin") { navigate("/connexion"); return; }
    chargerRecruteurs();
  }, []);

  const chargerRecruteurs = async () => {
    try {
      const res = await axios.get(
        "http://127.0.0.1:8000/api/auth/admin/recruteurs/en-attente/",
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setRecruteurs(res.data);
    } catch {
      setMessage("Erreur lors du chargement.");
      setMessageType("error");
    } finally {
      setChargement(false);
    }
  };

  const handleAction = async (id, action, motif = "") => {
    try {
      await axios.post(
        `http://127.0.0.1:8000/api/auth/admin/recruteurs/${id}/valider/`,
        { action, motif },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setMessageType("success");
      setMessage(action === "valider" ? "Recruteur validé — email envoyé." : "Demande rejetée — email envoyé.");
      chargerRecruteurs();
    } catch {
      setMessageType("error");
      setMessage("Erreur lors de l'action.");
    }
  };

  const handleRejet = (id) => {
    const motif = prompt("Motif du rejet :");
    if (motif) handleAction(id, "rejeter", motif);
  };

  const menuItems = [
    { id: "dashboard", label: "Tableau de bord", icon: "⊞" },
    { id: "recruteurs", label: "Recruteurs", icon: "🏢" },
    { id: "candidats", label: "Candidats", icon: "👤" },
    { id: "offres", label: "Offres d'emploi", icon: "📋" },
    { id: "statistiques", label: "Statistiques", icon: "📊" },
  ];

  const stats = [
    { label: "Recruteurs en attente", value: recruteurs.length, color: "#f59e0b", bg: "#fef3c7", icon: "⏳" },
    { label: "Candidats inscrits", value: "—", color: "#1e1b6e", bg: "#eeedfe", icon: "👤" },
    { label: "Offres publiées", value: "—", color: "#0F6E56", bg: "#E1F5EE", icon: "📋" },
    { label: "Recruteurs validés", value: "—", color: "#185FA5", bg: "#E6F1FB", icon: "✅" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f1f3f8", fontFamily: "system-ui, sans-serif" }}>

      {/* Sidebar */}
      <div style={{
        width: "240px", background: "#1e1b6e", display: "flex",
        flexDirection: "column", flexShrink: 0
      }}>
        {/* Logo */}
        <div style={{ padding: "24px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "36px", height: "36px", background: "#7F77DD",
              borderRadius: "8px", display: "flex", alignItems: "center",
              justifyContent: "center", color: "white", fontWeight: 700, fontSize: "14px"
            }}>PP</div>
            <span style={{ color: "white", fontWeight: 600, fontSize: "15px" }}>PlacementPro</span>
          </div>
        </div>

        {/* Profil admin */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "38px", height: "38px", background: "#534AB7",
              borderRadius: "50%", display: "flex", alignItems: "center",
              justifyContent: "center", color: "white", fontWeight: 600, fontSize: "13px"
            }}>{initiales}</div>
            <div>
              <div style={{ color: "white", fontSize: "13px", fontWeight: 500 }}>Administrateur</div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px" }}>{email}</div>
            </div>
          </div>
        </div>

        {/* Menu */}
        <div style={{ padding: "12px 0", flex: 1 }}>
          <div style={{ padding: "8px 20px 4px", fontSize: "10px", color: "rgba(255,255,255,0.35)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.8px" }}>
            Gestion
          </div>
          {menuItems.map(item => (
            <div
              key={item.id}
              onClick={() => setActiveMenu(item.id)}
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "10px 20px", cursor: "pointer", fontSize: "13px",
                color: activeMenu === item.id ? "white" : "rgba(255,255,255,0.6)",
                background: activeMenu === item.id ? "rgba(255,255,255,0.1)" : "transparent",
                borderLeft: activeMenu === item.id ? "3px solid #7F77DD" : "3px solid transparent",
                transition: "all 0.15s"
              }}
            >
              <span style={{ fontSize: "15px" }}>{item.icon}</span>
              {item.label}
              {item.id === "recruteurs" && recruteurs.length > 0 && (
                <span style={{
                  marginLeft: "auto", background: "#f59e0b", color: "white",
                  fontSize: "10px", fontWeight: 700, padding: "2px 7px",
                  borderRadius: "20px"
                }}>{recruteurs.length}</span>
              )}
            </div>
          ))}
        </div>

        {/* Déconnexion */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div
            onClick={() => { deconnexion(); navigate("/connexion"); }}
            style={{
              display: "flex", alignItems: "center", gap: "10px",
              cursor: "pointer", color: "rgba(255,255,255,0.5)", fontSize: "13px",
              padding: "8px 0"
            }}
          >
            <span style={{ fontSize: "15px" }}>🚪</span>
            Déconnexion
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <div style={{
          background: "white", borderBottom: "1px solid #e9ecef",
          padding: "0 32px", height: "60px", display: "flex",
          alignItems: "center", justifyContent: "space-between"
        }}>
          <div>
            <h1 style={{ fontSize: "18px", fontWeight: 600, color: "#212529", margin: 0 }}>
              Tableau de bord
            </h1>
            <p style={{ fontSize: "12px", color: "#adb5bd", margin: 0 }}>
              {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "8px", height: "8px", background: "#1D9E75",
              borderRadius: "50%"
            }}></div>
            <span style={{ fontSize: "13px", color: "#6c757d" }}>Système en ligne</span>
          </div>
        </div>

        {/* Corps */}
        <div style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>

          {/* Message */}
          {message && (
            <div style={{
              background: messageType === "success" ? "#E1F5EE" : "#FCEBEB",
              border: `1px solid ${messageType === "success" ? "#5DCAA5" : "#F09595"}`,
              borderRadius: "8px", padding: "12px 16px", fontSize: "13px",
              color: messageType === "success" ? "#085041" : "#791F1F",
              marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
              {message}
              <span style={{ cursor: "pointer", opacity: 0.6 }} onClick={() => setMessage("")}>✕</span>
            </div>
          )}

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "28px" }}>
            {stats.map((s, i) => (
              <div key={i} style={{
                background: "white", border: "1px solid #e9ecef",
                borderRadius: "12px", padding: "20px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p style={{ fontSize: "12px", color: "#6c757d", margin: "0 0 8px", fontWeight: 500 }}>{s.label}</p>
                    <p style={{ fontSize: "28px", fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
                  </div>
                  <div style={{
                    width: "40px", height: "40px", background: s.bg,
                    borderRadius: "10px", display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: "18px"
                  }}>{s.icon}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Tableau recruteurs */}
          <div style={{ background: "white", border: "1px solid #e9ecef", borderRadius: "12px", overflow: "hidden" }}>
            <div style={{
              padding: "20px 24px", borderBottom: "1px solid #f1f3f5",
              display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
              <div>
                <h2 style={{ fontSize: "15px", fontWeight: 600, color: "#212529", margin: "0 0 2px" }}>
                  Recruteurs en attente de validation
                </h2>
                <p style={{ fontSize: "12px", color: "#adb5bd", margin: 0 }}>
                  {recruteurs.length} demande(s) à traiter
                </p>
              </div>
              <button
                onClick={chargerRecruteurs}
                style={{
                  background: "#f8f9fa", border: "1px solid #e9ecef",
                  borderRadius: "7px", padding: "7px 14px", fontSize: "12px",
                  color: "#495057", cursor: "pointer", fontWeight: 500
                }}
              >
                Actualiser
              </button>
            </div>

            {chargement ? (
              <div style={{ padding: "48px", textAlign: "center", color: "#adb5bd", fontSize: "14px" }}>
                Chargement en cours...
              </div>
            ) : recruteurs.length === 0 ? (
              <div style={{ padding: "48px", textAlign: "center" }}>
                <div style={{ fontSize: "32px", marginBottom: "12px" }}>✅</div>
                <p style={{ fontSize: "14px", fontWeight: 500, color: "#212529", margin: "0 0 4px" }}>
                  Aucune demande en attente
                </p>
                <p style={{ fontSize: "13px", color: "#adb5bd", margin: 0 }}>
                  Toutes les demandes ont été traitées.
                </p>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8f9fa" }}>
                    {["Entreprise", "Email", "Ville", "Secteur", "Date d'inscription", "Actions"].map(h => (
                      <th key={h} style={{
                        padding: "11px 20px", textAlign: "left", fontSize: "11px",
                        fontWeight: 600, color: "#6c757d", textTransform: "uppercase",
                        letterSpacing: "0.5px", borderBottom: "1px solid #e9ecef"
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recruteurs.map((r, idx) => (
                    <tr key={r.id} style={{ borderTop: idx === 0 ? "none" : "1px solid #f1f3f5" }}>
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{
                            width: "34px", height: "34px", background: "#EEEDFE",
                            borderRadius: "8px", display: "flex", alignItems: "center",
                            justifyContent: "center", fontSize: "12px", fontWeight: 700, color: "#3C3489"
                          }}>
                            {r.nom_entreprise.substring(0, 2).toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 500, fontSize: "13px", color: "#212529" }}>
                            {r.nom_entreprise}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "16px 20px", fontSize: "13px", color: "#495057" }}>{r.email}</td>
                      <td style={{ padding: "16px 20px", fontSize: "13px", color: "#495057" }}>{r.ville}</td>
                      <td style={{ padding: "16px 20px", fontSize: "13px", color: "#495057" }}>{r.secteur_activite}</td>
                      <td style={{ padding: "16px 20px", fontSize: "13px", color: "#adb5bd" }}>
                        {new Date(r.date_inscription).toLocaleDateString("fr-FR")}
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={() => handleAction(r.id, "valider")}
                            style={{
                              background: "#1D9E75", color: "white", border: "none",
                              padding: "6px 14px", borderRadius: "6px", fontSize: "12px",
                              fontWeight: 500, cursor: "pointer"
                            }}
                          >Valider</button>
                          <button
                            onClick={() => handleRejet(r.id)}
                            style={{
                              background: "white", color: "#E24B4A",
                              border: "1px solid #E24B4A", padding: "6px 14px",
                              borderRadius: "6px", fontSize: "12px",
                              fontWeight: 500, cursor: "pointer"
                            }}
                          >Rejeter</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}