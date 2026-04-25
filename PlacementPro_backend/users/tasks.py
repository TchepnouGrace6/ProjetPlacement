import json
import pdfplumber
#from google import genai
from groq import Groq
from celery import shared_task
from django.conf import settings
import smtplib, ssl

def _send_email(sujet, message, destinataire):
    context = ssl.create_default_context()
    context.check_hostname = False
    context.verify_mode = ssl.CERT_NONE
    with smtplib.SMTP_SSL('smtp.gmail.com', 465, context=context) as server:
        server.login(settings.EMAIL_HOST_USER, settings.EMAIL_HOST_PASSWORD)
        msg = (
            f"Subject: {sujet}\n"
            f"From: {settings.EMAIL_HOST_USER}\n"
            f"To: {destinataire}\n"
            f"Content-Type: text/plain; charset=utf-8\n\n"
            f"{message}"
        )
        server.sendmail(settings.EMAIL_HOST_USER, destinataire, msg.encode('utf-8'))


def _extraire_texte_pdf(fichier_field):
    try:
        with pdfplumber.open(fichier_field.path) as pdf:
            return "\n".join(p.extract_text() or "" for p in pdf.pages)
    except Exception:
        return ""


@shared_task(bind=True, max_retries=3)
def filtrer_candidature(self, candidature_id):
    from .models import Candidature

    try:
        candidature = Candidature.objects.select_related(
            'candidat', 'candidat__user', 'annonce', 'annonce__recruteur'
        ).get(id=candidature_id)
    except Candidature.DoesNotExist:
        return

    candidature.statut = 'analyse_en_cours'
    candidature.save(update_fields=['statut'])

    candidat = candidature.candidat
    annonce  = candidature.annonce

    texte_cv             = _extraire_texte_pdf(candidat.cv) if candidat.cv else ""
    texte_lettre         = candidature.lettre_motivation or ""
    competences_candidat = candidat.competences or ""
    secteur_candidat     = candidat.secteur_activite or ""
    dernier_poste        = candidat.dernier_poste or ""
    derniere_entreprise  = candidat.derniere_entreprise or ""

    titre_poste          = annonce.titre
    description_poste    = annonce.description
    competences_requises = annonce.competences_requises or ""
    qualifications       = annonce.qualifications or ""
    secteur_annonce      = annonce.secteur_activite or ""
    localisation         = annonce.localisation or ""

    prompt = f"""Tu es un système expert en recrutement. Analyse cette candidature et donne un score de compatibilité.

=== OFFRE D'EMPLOI ===
Poste : {titre_poste}
Secteur : {secteur_annonce}
Localisation : {localisation}
Description : {description_poste}
Compétences requises : {competences_requises}
Qualifications requises : {qualifications}

=== PROFIL DU CANDIDAT ===
Dernier poste : {dernier_poste}
Dernière entreprise : {derniere_entreprise}
Secteur d'activité : {secteur_candidat}
Compétences déclarées : {competences_candidat}

=== CV (extrait) ===
{texte_cv[:3000]}

=== LETTRE DE MOTIVATION ===
{texte_lettre[:1500]}

=== INSTRUCTIONS ===
1. Compare les compétences requises avec celles du candidat.
2. Compare les secteurs d'activité.
3. Évalue la pertinence du parcours pour ce poste.
4. Évalue la qualité de la lettre de motivation.
5. Donne un score global de 0 à 100.

Réponds UNIQUEMENT avec ce JSON (aucun texte avant ou après) :
{{
  "score": <nombre entier 0-100>,
  "points_forts": ["point1", "point2", "point3"],
  "points_faibles": ["point1", "point2"],
  "compatibilite_competences": <0-100>,
  "compatibilite_secteur": <0-100>,
  "qualite_lettre": <0-100>,
  "motif_rejet": "<explication courte si score < 30, sinon vide>",
  "resume": "<résumé en 2 phrases du profil par rapport au poste>"
}}"""

    try:
        # ── Nouvelle syntaxe google.genai ──
        #client = genai.Client(api_key=settings.GEMINI_API_KEY)
        #response = client.models.generate_content(
        #   #model='gemini-2.0-flash-lite',
        #    #contents=prompt
        # )
        #raw = response.text.strip()
        client = Groq(api_key=settings.GROQ_API_KEY)
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1
        )
        raw = response.choices[0].message.content.strip()
        # Nettoyer si Gemini ajoute des backticks
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        resultat = json.loads(raw.strip())
        score = float(resultat.get("score", 0))

    except Exception as e:
        candidature.statut = 'soumise'
        candidature.save(update_fields=['statut'])
        raise self.retry(exc=e, countdown=60)

    candidature.score_etape1 = score
    candidature.rapport_etape1 = json.dumps(resultat, ensure_ascii=False)

    email_candidat = candidat.user.email
    nom_candidat   = f"{candidat.prenom} {candidat.nom}"
    titre_offre    = annonce.titre
    nom_entreprise = annonce.recruteur.nom_entreprise

    if score < 30:
        motif = resultat.get("motif_rejet", "Votre profil ne correspond pas aux critères requis.")
        candidature.statut = 'rejetee_auto'
        candidature.motif_rejet_auto = motif
        candidature.save(update_fields=['statut', 'score_etape1', 'rapport_etape1', 'motif_rejet_auto'])

        _send_email(
            sujet=f"PlacementPro — Résultat de votre candidature pour « {titre_offre} »",
            message=f"""Bonjour {nom_candidat},

Nous avons bien reçu votre candidature pour le poste de « {titre_offre} » chez {nom_entreprise}.

Après analyse automatique de votre dossier, nous avons le regret de vous informer que votre candidature n'a pas été retenue.

Motif : {motif}

Score de compatibilité obtenu : {score:.0f}% (seuil requis : 30%)

Points à améliorer :
{chr(10).join(f"• {p}" for p in resultat.get("points_faibles", []))}

Cordialement,
L'équipe PlacementPro""",
            destinataire=email_candidat
        )

    else:
        candidature.statut = 'etape_2'
        candidature.save(update_fields=['statut', 'score_etape1', 'rapport_etape1'])

        _send_email(
            sujet=f"PlacementPro — Félicitations ! Vous passez à l'étape suivante",
            message=f"""Bonjour {nom_candidat},

Bonne nouvelle ! Votre candidature pour le poste de « {titre_offre} » chez {nom_entreprise} a passé la première étape avec un score de {score:.0f}%.

Connectez-vous sur votre espace candidat pour accéder à l'entretien IA.

Cordialement,
L'équipe PlacementPro""",
            destinataire=email_candidat
        )


@shared_task
def notifier_selection(candidature_id):
    from .models import Candidature

    try:
        candidature = Candidature.objects.select_related(
            'candidat', 'candidat__user', 'annonce', 'annonce__recruteur', 'annonce__recruteur__user'
        ).get(id=candidature_id)
    except Candidature.DoesNotExist:
        return

    candidat       = candidature.candidat
    annonce        = candidature.annonce
    recruteur      = annonce.recruteur
    nom_candidat   = f"{candidat.prenom} {candidat.nom}"
    titre_offre    = annonce.titre
    nom_entreprise = recruteur.nom_entreprise
    score_final    = candidature.score_final or 0

    candidature.statut = 'selectionne'
    candidature.save(update_fields=['statut'])

    _send_email(
        sujet=f"PlacementPro — Votre candidature a été retenue !",
        message=f"""Bonjour {nom_candidat},

Félicitations ! Votre évaluation pour le poste de « {titre_offre} » chez {nom_entreprise} a été un succès.

Score final : {score_final:.0f}%
- Compatibilité du profil : {candidature.score_etape1:.0f}%
- Entretien IA : {candidature.score_etape2:.0f}%

Connectez-vous sur votre espace candidat pour suivre l'avancement.

Cordialement,
L'équipe PlacementPro""",
        destinataire=candidat.user.email
    )

    _send_email(
        sujet=f"PlacementPro — Nouveau candidat sélectionné pour « {titre_offre} »",
        message=f"""Bonjour,

Un nouveau candidat a été sélectionné pour votre offre « {titre_offre} ».

Candidat : {nom_candidat}
Score final : {score_final:.0f}%

Connectez-vous sur votre espace recruteur pour consulter son dossier.

Cordialement,
L'équipe PlacementPro""",
        destinataire=recruteur.user.email
    )