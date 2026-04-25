import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const API = "http://127.0.0.1:8000/api/auth";
const getToken = () => localStorage.getItem("access_token");

// États de l'entretien
const ETATS = {
  CHARGEMENT:   "chargement",
  INTRO:        "intro",
  QUESTION:     "question",
  ECOUTE:       "ecoute",
  TRAITEMENT:   "traitement",
  RESULTATS:    "resultats",
  ERREUR:       "erreur",
};

export default function EntretienIA({ candidatureId: propId }) {
  const { candidatureId: paramId } = useParams();
  const candidatureId = propId || paramId;
  const navigate = useNavigate();

  const [etat, setEtat]                 = useState(ETATS.CHARGEMENT);
  const [questions, setQuestions]       = useState([]);
  const [indexQuestion, setIndexQuestion] = useState(0);
  const [reponses, setReponses]         = useState([]);
  const [reponseActuelle, setReponseActuelle] = useState("");
  const [transcription, setTranscription] = useState("");
  const [resultats, setResultats]       = useState(null);
  const [erreur, setErreur]             = useState("");
  const [tempsRestant, setTempsRestant] = useState(0);
  const [ecoute, setEcoute]             = useState(false);
  const [videoPret, setVideoPret]       = useState(false);
  const [comportementScore, setComportementScore] = useState(80);
  const [paroleDetectee, setParoleDetectee] = useState(false);

  // Refs
  const videoRef     = useRef(null);
  const streamRef    = useRef(null);
  const timerRef     = useRef(null);
  const recognitionRef = useRef(null);
  const synthesisRef = useRef(window.speechSynthesis);
  const mouvementsRef = useRef(0);
  const absencesRef   = useRef(0);

  // ── Initialiser la webcam ──
  useEffect(() => {
    initMedia();
    return () => {
      stopMedia();
      if (timerRef.current) clearInterval(timerRef.current);
      stopSpeechRecognition();
    };
  }, []);

  const initMedia = async () => {
  try {
    // Essayer avec caméra + micro
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: true, 
      audio: true 
    });
    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    }
    setVideoPret(true);
    analyserComportement(stream);
  } catch (err) {
    // Si caméra échoue, essayer uniquement micro
    try {
      const streamAudio = await navigator.mediaDevices.getUserMedia({ 
        video: false, 
        audio: true 
      });
      streamRef.current = streamAudio;
      setVideoPret(true); // On continue sans vidéo
    } catch (err2) {
      // Si tout échoue, continuer quand même sans média
      setVideoPret(true);
    }
  }
};

  const stopMedia = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
  };

  // ── Analyse comportement webcam (mouvement, présence) ──
  const analyserComportement = (stream) => {
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return;

    // Simulation d'analyse comportementale basique
    // En production : utiliser TensorFlow.js + face-api.js
    const intervalle = setInterval(() => {
      // Vérifier si le candidat est présent (piste vidéo active)
      if (videoTrack.readyState === 'ended') {
        absencesRef.current += 1;
      }
      // Score comportement = 100 - pénalités
      const score = Math.max(0, 100 - (absencesRef.current * 10) - (mouvementsRef.current * 2));
      setComportementScore(Math.round(score));
    }, 5000);

    return () => clearInterval(intervalle);
  };

  // ── Charger les questions ──
  const chargerQuestions = async () => {
    try {
      const res = await axios.get(
        `${API}/candidatures/${candidatureId}/questions-ia/`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setQuestions(res.data.questions || []);
      setEtat(ETATS.INTRO);
    } catch (err) {
      setErreur("Erreur lors du chargement des questions.");
      setEtat(ETATS.ERREUR);
    }
  };

  useEffect(() => {
    if (videoPret) chargerQuestions();
  }, [videoPret]);

  // ── Synthèse vocale (robot parle) ──
  const parler = useCallback((texte, onFin) => {
    const synth = synthesisRef.current;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(texte);
    utterance.lang = "fr-FR";
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    // Choisir une voix française si disponible
    const voix = synth.getVoices().find(v => v.lang.startsWith("fr"));
    if (voix) utterance.voice = voix;
    utterance.onend = onFin || null;
    synth.speak(utterance);
  }, []);

  // ── Démarrer une question ──
  const demarrerQuestion = useCallback((index) => {
    if (index >= questions.length) {
      soumettreReponses();
      return;
    }
    const q = questions[index];
    setIndexQuestion(index);
    setReponseActuelle("");
    setParoleDetectee(false);
    setEtat(ETATS.QUESTION);
    setTempsRestant(q.duree_secondes || 90);

    // Le robot pose la question à voix haute
    parler(`Question ${index + 1}. ${q.question}`, () => {
      // Après que le robot a parlé, démarrer l'écoute
      demarrerEcoute(index, q.duree_secondes || 90);
    });
  }, [questions, parler]);

  // ── Reconnaissance vocale ──
  const demarrerEcoute = useCallback((index, duree) => {
    setEtat(ETATS.ECOUTE);
    setEcoute(true);

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErreur("La reconnaissance vocale n'est pas supportée par votre navigateur. Utilisez Chrome.");
      setEtat(ETATS.ERREUR);
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = "fr-FR";
    recognition.continuous = true;
    recognition.interimResults = true;

    let texteComplet = "";

    recognition.onresult = (event) => {
      setParoleDetectee(true);
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          texteComplet += t + " ";
        } else {
          interim = t;
        }
      }
      setReponseActuelle(texteComplet + interim);
    };

    recognition.onerror = () => {
      // Continuer sans erreur affichée
    };

    recognition.start();

    // Timer countdown
    let secondes = duree;
    timerRef.current = setInterval(() => {
      secondes -= 1;
      setTempsRestant(secondes);
      if (secondes <= 0) {
        clearInterval(timerRef.current);
        recognition.stop();
        setEcoute(false);
        // Sauvegarder la réponse
        setReponses(prev => {
          const nouvelles = [...prev, {
            id: index + 1,
            question: questions[index].question,
            reponse: texteComplet.trim() || "(Pas de réponse)",
            duree: duree
          }];
          if (index + 1 >= questions.length) {
            setTimeout(() => soumettreReponsesAvec(nouvelles), 500);
          } else {
            setTimeout(() => demarrerQuestion(index + 1), 1500);
          }
          return nouvelles;
        });
      }
    }, 1000);
  }, [questions, demarrerQuestion]);

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const passerQuestion = () => {
    stopSpeechRecognition();
    setEcoute(false);
    const repActuelle = reponseActuelle.trim() || "(Pas de réponse)";
    const nouvRep = [...reponses, {
      id: indexQuestion + 1,
      question: questions[indexQuestion].question,
      reponse: repActuelle,
      duree: questions[indexQuestion].duree_secondes
    }];
    setReponses(nouvRep);
    if (indexQuestion + 1 >= questions.length) {
      soumettreReponsesAvec(nouvRep);
    } else {
      demarrerQuestion(indexQuestion + 1);
    }
  };

  // ── Soumettre les réponses ──
  const soumettreReponsesAvec = async (reponsesFinales) => {
    setEtat(ETATS.TRAITEMENT);
    stopMedia();
    synthesisRef.current.cancel();

    const transcriptionComplete = reponsesFinales
      .map((r, i) => `Q${i+1}: ${r.question}\nR: ${r.reponse}`)
      .join("\n\n");

    try {
      const res = await axios.post(
        `${API}/candidatures/${candidatureId}/reponses-ia/`,
        {
          reponses: reponsesFinales,
          comportement_score: comportementScore,
          transcription: transcriptionComplete
        },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setResultats(res.data);
      setEtat(ETATS.RESULTATS);
    } catch (err) {
      setErreur("Erreur lors de la soumission des réponses.");
      setEtat(ETATS.ERREUR);
    }
  };

  const soumettreReponses = () => soumettreReponsesAvec(reponses);

  // ── RENDU ──
  const question = questions[indexQuestion];
  const progression = questions.length > 0 ? ((indexQuestion) / questions.length) * 100 : 0;

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0f28",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "24px"
    }}>

      {/* ── CHARGEMENT ── */}
      {etat === ETATS.CHARGEMENT && (
        <div style={{ textAlign: "center", color: "white" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🤖</div>
          <h2 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "8px" }}>Préparation de l'entretien...</h2>
          <p style={{ color: "rgba(255,255,255,0.6)" }}>Initialisation de la caméra et du microphone</p>
          <div style={{ width: "200px", height: "4px", background: "rgba(255,255,255,0.2)", borderRadius: "2px", margin: "20px auto", overflow: "hidden" }}>
            <div style={{ height: "100%", background: "#1565C0", borderRadius: "2px", animation: "progress 2s linear infinite", width: "60%" }} />
          </div>
          <style>{`@keyframes progress { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }`}</style>
        </div>
      )}

      {/* ── INTRO ── */}
      {etat === ETATS.INTRO && (
        <div style={{ maxWidth: "600px", width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: "64px", marginBottom: "16px" }}>🎙️</div>
          <h1 style={{ color: "white", fontSize: "28px", fontWeight: 800, marginBottom: "12px" }}>
            Entretien d'évaluation IA
          </h1>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "15px", lineHeight: 1.6, marginBottom: "32px" }}>
            Vous allez passer un entretien avec notre assistant IA.<br />
            <strong style={{ color: "white" }}>{questions.length} questions</strong> vous seront posées à voix haute.<br />
            Répondez clairement via votre microphone.
          </p>

          {/* Aperçu caméra */}
          <div style={{ position: "relative", marginBottom: "24px", borderRadius: "16px", overflow: "hidden", border: "2px solid rgba(255,255,255,0.15)" }}>
            <video ref={videoRef} muted style={{ width: "100%", maxHeight: "280px", objectFit: "cover", display: "block", background: "#000" }} />
            <div style={{ position: "absolute", top: "12px", right: "12px", background: videoPret ? "#22c55e" : "#ef4444", color: "white", fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "20px" }}>
              {videoPret ? "● Caméra active" : "● Caméra inactive"}
            </div>
          </div>

          {/* Conseils */}
          <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "12px", padding: "16px", marginBottom: "24px", textAlign: "left" }}>
            {["Trouvez un endroit calme et bien éclairé", "Regardez la caméra quand vous parlez", "Attendez que le robot finisse de parler avant de répondre", "Répondez avec des phrases complètes"].map((c, i) => (
              <div key={i} style={{ color: "rgba(255,255,255,0.7)", fontSize: "13px", padding: "4px 0", display: "flex", gap: "8px" }}>
                <span style={{ color: "#64B5F6" }}>✓</span> {c}
              </div>
            ))}
          </div>

          <button onClick={() => demarrerQuestion(0)}
            style={{ background: "#1565C0", color: "white", border: "none", padding: "16px 48px", borderRadius: "12px", fontSize: "16px", fontWeight: 700, cursor: "pointer" }}>
            Commencer l'entretien →
          </button>
        </div>
      )}

      {/* ── QUESTION / ÉCOUTE ── */}
      {(etat === ETATS.QUESTION || etat === ETATS.ECOUTE) && question && (
        <div style={{ maxWidth: "800px", width: "100%" }}>
          {/* Barre de progression */}
          <div style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "rgba(255,255,255,0.6)", fontSize: "13px", marginBottom: "8px" }}>
              <span>Question {indexQuestion + 1} / {questions.length}</span>
              <span>{etat === ETATS.ECOUTE ? `⏱ ${tempsRestant}s` : "Le robot parle..."}</span>
            </div>
            <div style={{ height: "4px", background: "rgba(255,255,255,0.15)", borderRadius: "2px" }}>
              <div style={{ height: "100%", background: "#1565C0", borderRadius: "2px", width: `${((indexQuestion + 1) / questions.length) * 100}%`, transition: "width 0.3s" }} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            {/* Colonne gauche : vidéo */}
            <div>
              <div style={{ borderRadius: "16px", overflow: "hidden", border: "2px solid rgba(255,255,255,0.1)", position: "relative" }}>
                <video ref={videoRef} muted style={{ width: "100%", objectFit: "cover", display: "block", background: "#000", minHeight: "240px" }} />
                {/* Indicateur d'écoute */}
                {etat === ETATS.ECOUTE && (
                  <div style={{ position: "absolute", bottom: "12px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "4px", alignItems: "center" }}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} style={{
                        width: "4px", background: paroleDetectee ? "#22c55e" : "rgba(255,255,255,0.4)",
                        borderRadius: "2px",
                        animation: paroleDetectee ? `wave${i} ${0.5 + i * 0.1}s ease-in-out infinite alternate` : "none",
                        height: paroleDetectee ? `${8 + Math.random() * 16}px` : "8px",
                        transition: "height 0.1s"
                      }} />
                    ))}
                    <style>{`
                      @keyframes wave1 { to { height: 24px } }
                      @keyframes wave2 { to { height: 18px } }
                      @keyframes wave3 { to { height: 28px } }
                      @keyframes wave4 { to { height: 16px } }
                      @keyframes wave5 { to { height: 22px } }
                    `}</style>
                  </div>
                )}
              </div>

              {/* Score comportement */}
              <div style={{ marginTop: "12px", background: "rgba(255,255,255,0.05)", borderRadius: "10px", padding: "12px" }}>
                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "11px", marginBottom: "6px" }}>Score comportement</div>
                <div style={{ height: "4px", background: "rgba(255,255,255,0.15)", borderRadius: "2px" }}>
                  <div style={{ height: "100%", background: comportementScore > 70 ? "#22c55e" : "#ef4444", borderRadius: "2px", width: `${comportementScore}%`, transition: "width 0.5s" }} />
                </div>
                <div style={{ color: "white", fontSize: "13px", fontWeight: 700, marginTop: "4px" }}>{comportementScore}%</div>
              </div>
            </div>

            {/* Colonne droite : question + réponse */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Bulle robot */}
              <div style={{ background: "rgba(21, 101, 192, 0.2)", border: "1px solid rgba(21, 101, 192, 0.4)", borderRadius: "16px", padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#1565C0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>🤖</div>
                  <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px", fontWeight: 600 }}>Assistant IA</span>
                  {etat === ETATS.QUESTION && (
                    <span style={{ marginLeft: "auto", background: "#1565C0", color: "white", fontSize: "10px", padding: "2px 8px", borderRadius: "20px" }}>● Parle...</span>
                  )}
                </div>
                <p style={{ color: "white", fontSize: "15px", fontWeight: 600, lineHeight: 1.5, margin: 0 }}>
                  {question.question}
                </p>
              </div>

              {/* Transcription réponse */}
              <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", padding: "20px", flex: 1, minHeight: "120px" }}>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                  {etat === ETATS.ECOUTE ? (
                    <><span style={{ color: "#22c55e" }}>●</span> Votre réponse (en cours d'écoute)</>
                  ) : (
                    <><span style={{ color: "rgba(255,255,255,0.3)" }}>○</span> En attente...</>
                  )}
                </div>
                <p style={{ color: reponseActuelle ? "white" : "rgba(255,255,255,0.3)", fontSize: "14px", lineHeight: 1.6, margin: 0, fontStyle: reponseActuelle ? "normal" : "italic" }}>
                  {reponseActuelle || "Votre réponse apparaîtra ici..."}
                </p>
              </div>

              {/* Timer */}
              {etat === ETATS.ECOUTE && (
                <div style={{ display: "flex", gap: "10px" }}>
                  <div style={{ flex: 1, background: "rgba(255,255,255,0.08)", borderRadius: "10px", padding: "12px", textAlign: "center" }}>
                    <div style={{ color: tempsRestant <= 15 ? "#ef4444" : "white", fontSize: "28px", fontWeight: 800 }}>{tempsRestant}s</div>
                    <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px" }}>Temps restant</div>
                  </div>
                  <button onClick={passerQuestion}
                    style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "10px", padding: "12px 16px", fontSize: "13px", cursor: "pointer", fontFamily: "inherit" }}>
                    Question suivante →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TRAITEMENT ── */}
      {etat === ETATS.TRAITEMENT && (
        <div style={{ textAlign: "center", color: "white" }}>
          <div style={{ fontSize: "64px", marginBottom: "20px" }}>⚙️</div>
          <h2 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "8px" }}>Analyse de vos réponses en cours...</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "24px" }}>L'IA évalue votre entretien. Merci de patienter.</p>
          <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#1565C0", animation: `bounce 0.8s ${i * 0.2}s ease-in-out infinite alternate` }} />
            ))}
          </div>
          <style>{`@keyframes bounce { to { transform: translateY(-10px); opacity: 0.5 } }`}</style>
        </div>
      )}

      {/* ── RÉSULTATS ── */}
      {etat === ETATS.RESULTATS && resultats && (
        <div style={{ maxWidth: "600px", width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: "64px", marginBottom: "16px" }}>
            {resultats.selectionne ? "🎉" : "📊"}
          </div>
          <h1 style={{ color: "white", fontSize: "28px", fontWeight: 800, marginBottom: "8px" }}>
            {resultats.selectionne ? "Félicitations ! Vous êtes sélectionné(e)" : "Entretien terminé"}
          </h1>

          {/* Score final */}
          <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "16px", padding: "24px", marginBottom: "24px" }}>
            <div style={{ fontSize: "60px", fontWeight: 900, color: resultats.selectionne ? "#22c55e" : resultats.score_final >= 70 ? "#f59e0b" : "#ef4444" }}>
              {Math.round(resultats.score_final || 0)}%
            </div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", marginBottom: "20px" }}>Score final</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
              {[
                { label: "Profil", val: resultats.rapport?.score_global },
                { label: "Entretien IA", val: resultats.score_etape2 },
                { label: "Comportement", val: comportementScore },
              ].map(s => (
                <div key={s.label} style={{ background: "rgba(255,255,255,0.05)", borderRadius: "10px", padding: "12px" }}>
                  <div style={{ color: "white", fontSize: "20px", fontWeight: 800 }}>{Math.round(s.val || 0)}%</div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {resultats.selectionne ? (
            <div style={{ background: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.3)", borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
              <p style={{ color: "#22c55e", fontSize: "14px", margin: 0 }}>
                ✓ Votre candidature a été transmise au recruteur. Vous recevrez un email de confirmation et serez contacté(e) prochainement.
              </p>
            </div>
          ) : (
            <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
              <p style={{ color: "#ef4444", fontSize: "14px", margin: 0 }}>
                Votre score final ({Math.round(resultats.score_final || 0)}%) n'atteint pas le seuil requis de 90%. Un email vous a été envoyé avec les détails.
              </p>
            </div>
          )}

          <button onClick={() => navigate("/candidat/dashboard")}
            style={{ background: "#1565C0", color: "white", border: "none", padding: "14px 32px", borderRadius: "10px", fontSize: "15px", fontWeight: 700, cursor: "pointer" }}>
            Retour à mon espace
          </button>
        </div>
      )}

      {/* ── ERREUR ── */}
      {etat === ETATS.ERREUR && (
        <div style={{ textAlign: "center", color: "white", maxWidth: "500px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
          <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "8px" }}>Une erreur est survenue</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "24px" }}>{erreur}</p>
          <button onClick={() => navigate("/candidat/dashboard")}
            style={{ background: "#1565C0", color: "white", border: "none", padding: "12px 24px", borderRadius: "10px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
            Retour au dashboard
          </button>
        </div>
      )}
    </div>
  );
}