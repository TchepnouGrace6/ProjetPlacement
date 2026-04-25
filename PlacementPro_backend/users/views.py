from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.core.mail import send_mail, EmailMessage
import json
from groq import Groq
from django.utils import timezone
from django.conf import settings
from rest_framework.parsers import MultiPartParser, FormParser
import ssl
import smtplib

from .models import User, Recruteur, Candidat, Annonce, Candidature, Favori
from .serializers import (
    InscriptionCandidatSerializer,
    InscriptionRecruteurSerializer,
    ConnexionSerializer,
    UserSerializer,
    RecruteurProfileSerializer,
    AnnonceListSerializer,
    AnnonceDetailSerializer,
    AnnonceCreateUpdateSerializer,
    CandidatureListSerializer,
    CandidatureDetailSerializer,
    CandidatureUpdateSerializer,
    FavoriListSerializer,
    FavoriDetailSerializer,
    FavoriCreateSerializer
)


class InscriptionCandidatView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()

        # Vérifier si un compte candidat existe déjà avec cet email
        if User.objects.filter(email=email, role='candidat').exists():
            return Response(
                {"error": "Un compte candidat existe déjà avec cet email. Veuillez vous connecter."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Vérifier si l'email existe avec un autre rôle
        if User.objects.filter(email=email).exists():
            return Response(
                {"error": "Cet email est déjà utilisé avec un autre type de compte."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = InscriptionCandidatSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Compte candidat créé avec succès."},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class InscriptionRecruteurView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = InscriptionRecruteurSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Votre demande a été soumise. Vous recevrez un email après validation de l'administrateur."},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ConnexionView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ConnexionSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            password = serializer.validated_data['password']
            user = authenticate(request, email=email, password=password)

            if user is None:
                return Response(
                    {"error": "Email ou mot de passe incorrect."},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            if not user.is_active:
                return Response(
                    {"error": "Votre compte est en attente de validation par l'administrateur."},
                    status=status.HTTP_403_FORBIDDEN
                )

            refresh = RefreshToken.for_user(user)
            refresh['user_id'] = int(user.id)

            return Response({
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "role": user.role,
                "email": user.email
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def envoyer_email(sujet, message, destinataire):
    context = ssl.create_default_context()
    context.check_hostname = False
    context.verify_mode = ssl.CERT_NONE

    with smtplib.SMTP_SSL('smtp.gmail.com', 465, context=context) as server:
        server.login(settings.EMAIL_HOST_USER, settings.EMAIL_HOST_PASSWORD)
        msg = f"Subject: {sujet}\nFrom: {settings.EMAIL_HOST_USER}\nTo: {destinataire}\nContent-Type: text/plain; charset=utf-8\n\n{message}"
        server.sendmail(settings.EMAIL_HOST_USER, destinataire, msg.encode('utf-8'))


class ValidationRecruteurView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, recruteur_id):
        if request.user.role != 'admin':
            return Response(
                {"error": "Accès refusé. Réservé à l'administrateur."},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            recruteur = Recruteur.objects.get(id=recruteur_id)
        except Recruteur.DoesNotExist:
            return Response(
                {"error": "Recruteur introuvable."},
                status=status.HTTP_404_NOT_FOUND
            )

        action = request.data.get('action')
        motif = request.data.get('motif', '')

        if action == 'valider':
            recruteur.valide_par_admin = True
            recruteur.user.is_active = True
            recruteur.user.save()
            recruteur.save()
            envoyer_email(
                'PlacementPro — Compte validé',
                "Bonjour,\n\nVotre compte recruteur sur PlacementPro a été validé. Vous pouvez maintenant vous connecter.\n\nL'équipe PlacementPro",
                recruteur.user.email
            )
            return Response(
                {"message": "Compte recruteur validé et email envoyé."},
                status=status.HTTP_200_OK
            )

        elif action == 'rejeter':
            recruteur.motif_rejet = motif
            recruteur.save()
            envoyer_email(
                'PlacementPro — Demande rejetée',
                f"Bonjour,\n\nVotre demande d'inscription a été rejetée.\n\nMotif : {motif}\n\nL'équipe PlacementPro",
                recruteur.user.email
            )
            return Response(
                {"message": "Demande rejetée et email envoyé."},
                status=status.HTTP_200_OK
            )

        return Response(
            {"error": "Action invalide. Utilisez 'valider' ou 'rejeter'."},
            status=status.HTTP_400_BAD_REQUEST
        )


class ListeRecruteursEnAttenteView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin':
            return Response({"error": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)

        recruteurs = Recruteur.objects.filter(valide_par_admin=False)
        data = []
        for r in recruteurs:
            data.append({
                "id": r.id,
                "nom_entreprise": r.nom_entreprise,
                "email": r.user.email,
                "ville": r.ville,
                "localisation": r.localisation,
                "adresse": r.adresse,
                "telephone": r.telephone,
                "secteur_activite": r.secteur_activite,
                "taille_entreprise": r.taille_entreprise,
                "description": r.description,
                "date_inscription": r.user.date_inscription,
                "logo": request.build_absolute_uri(r.logo.url) if r.logo else None,
                "registre_commerce": request.build_absolute_uri(r.registre_commerce.url) if r.registre_commerce else None,
                "certificat_immatriculation": request.build_absolute_uri(r.certificat_immatriculation.url) if r.certificat_immatriculation else None,
                "patente": request.build_absolute_uri(r.patente.url) if r.patente else None,
            })
        return Response(data, status=status.HTTP_200_OK)


class CreationAdminView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response(
                {"error": "Email et mot de passe obligatoires."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(email=email).exists():
            return Response(
                {"error": "Cet email existe déjà."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.create_user(
            email=email,
            password=password,
            role='admin',
            is_active=True,
            is_staff=True
        )
        return Response(
            {"message": "Compte admin créé avec succès."},
            status=status.HTTP_201_CREATED
        )


# ========== VIEWS POUR PROFIL RECRUTEUR ==========

class RecruteurProfileView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        if request.user.is_authenticated:
            try:
                recruteur = request.user.recruteur
                serializer = RecruteurProfileSerializer(recruteur)
                return Response(serializer.data, status=status.HTTP_200_OK)
            except Recruteur.DoesNotExist:
                return Response(
                    {"error": "Profil recruteur introuvable."},
                    status=status.HTTP_404_NOT_FOUND
                )
        return Response(
            {"error": "Non authentifié."},
            status=status.HTTP_401_UNAUTHORIZED
        )

    def put(self, request):
        if request.user.is_authenticated:
            try:
                recruteur = request.user.recruteur
            except Recruteur.DoesNotExist:
                return Response(
                    {"error": "Profil recruteur introuvable."},
                    status=status.HTTP_404_NOT_FOUND
                )

            serializer = RecruteurProfileSerializer(recruteur, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        return Response(
            {"error": "Non authentifié."},
            status=status.HTTP_401_UNAUTHORIZED
        )


# ========== VIEWS POUR ANNONCES ==========

class ListAnnonceView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        secteur = request.query_params.get('secteur', None)
        localisation = request.query_params.get('localisation', None)
        type_contrat = request.query_params.get('type_contrat', None)

        annonces_query = Annonce.objects.filter(statut='publiee', visible=True)

        if secteur:
            annonces_query = annonces_query.filter(secteur_activite__icontains=secteur)
        if localisation:
            annonces_query = annonces_query.filter(localisation__icontains=localisation)
        if type_contrat:
            annonces_query = annonces_query.filter(type_contrat=type_contrat)

        serializer = AnnonceListSerializer(annonces_query, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class DetailAnnonceView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, annonce_id):
        try:
            annonce = Annonce.objects.get(id=annonce_id, statut='publiee')
        except Annonce.DoesNotExist:
            return Response(
                {"error": "Annonce introuvable."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = AnnonceDetailSerializer(annonce, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class AnnonceRecruteurView(APIView):
    permission_classes = [IsAuthenticated]          # ✅ token obligatoire
    # authentication_classes supprimé               # ✅ JWT lu automatiquement
 
    def get(self, request):
        try:
            recruteur = request.user.recruteur      # ✅ CE recruteur uniquement
        except Recruteur.DoesNotExist:
            return Response(
                {"error": "Profil recruteur introuvable."},
                status=status.HTTP_404_NOT_FOUND
            )
        annonces = recruteur.annonces.all()         # ✅ SES annonces uniquement
        serializer = AnnonceListSerializer(annonces, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
 
    def post(self, request):
        try:
            recruteur = request.user.recruteur      # ✅ CE recruteur uniquement
        except Recruteur.DoesNotExist:
            return Response(
                {"error": "Profil recruteur introuvable."},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = AnnonceCreateUpdateSerializer(data=request.data)
        if serializer.is_valid():
            annonce = serializer.save(recruteur=recruteur)
            return Response(
                AnnonceDetailSerializer(annonce, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class DetailAnnonceRecruteurView(APIView):
    permission_classes = [IsAuthenticated]          # ✅ token obligatoire
 
    def get(self, request, annonce_id):
        try:
            annonce = Annonce.objects.get(id=annonce_id, recruteur__user=request.user)  # ✅
        except Annonce.DoesNotExist:
            return Response({"error": "Annonce introuvable."}, status=status.HTTP_404_NOT_FOUND)
        serializer = AnnonceDetailSerializer(annonce, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
 
    def put(self, request, annonce_id):
        try:
            annonce = Annonce.objects.get(id=annonce_id, recruteur__user=request.user)  # ✅
        except Annonce.DoesNotExist:
            return Response({"error": "Annonce introuvable."}, status=status.HTTP_404_NOT_FOUND)
        serializer = AnnonceCreateUpdateSerializer(annonce, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(AnnonceDetailSerializer(annonce, context={'request': request}).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
 
    def delete(self, request, annonce_id):
        try:
            annonce = Annonce.objects.get(id=annonce_id, recruteur__user=request.user)  # ✅
        except Annonce.DoesNotExist:
            return Response({"error": "Annonce introuvable."}, status=status.HTTP_404_NOT_FOUND)
        annonce.delete()
        return Response({"message": "Annonce supprimée avec succès."}, status=status.HTTP_204_NO_CONTENT)


# ========== VIEWS POUR CANDIDATURES ==========
class SoumettreCandiatureView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, annonce_id):
        if request.user.role != 'candidat':
            return Response(
                {"error": "Seuls les candidats peuvent soumettre une candidature."},
                status=status.HTTP_403_FORBIDDEN
            )
        try:
            annonce = Annonce.objects.get(id=annonce_id)
        except Annonce.DoesNotExist:
            return Response({"error": "Annonce introuvable."}, status=status.HTTP_404_NOT_FOUND)

        # Vérifier que l'offre n'est pas déjà pourvue
        if annonce.statut == 'pourvue':
            return Response({"error": "Cette offre a déjà été pourvue."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            candidat = request.user.candidat
        except Candidat.DoesNotExist:
            return Response({"error": "Profil candidat introuvable."}, status=status.HTTP_404_NOT_FOUND)

        # Vérifier profil complet
        if not candidat.profil_complete:
            return Response(
                {"error": "Vous devez compléter votre profil avant de postuler."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Vérifier qu'il n'a pas déjà postulé
        if Candidature.objects.filter(annonce=annonce, candidat=candidat).exists():
            return Response(
                {"error": "Vous avez déjà postulé pour cette annonce."},
                status=status.HTTP_400_BAD_REQUEST
            )

        lettre_motivation = request.data.get('lettre_motivation', '')
        candidature = Candidature.objects.create(
            annonce=annonce,
            candidat=candidat,
            lettre_motivation=lettre_motivation,
            statut='soumise'
        )

        # ── Déclencher l'analyse automatique en arrière-plan ──
        from .tasks import filtrer_candidature
        filtrer_candidature.delay(candidature.id)

        return Response(
            {"message": "Candidature soumise. Analyse en cours...", "id": candidature.id},
            status=status.HTTP_201_CREATED
        )



# ========== CANDIDATURES DU CANDIDAT CONNECTÉ ==========

class MesCandidaturesView(APIView):
    """Lister et annuler les candidatures du candidat connecté"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'candidat':
            return Response({"error": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)

        try:
            candidat = request.user.candidat
        except Candidat.DoesNotExist:
            return Response([], status=status.HTTP_200_OK)

        candidatures = Candidature.objects.filter(candidat=candidat).select_related('annonce', 'annonce__recruteur')
        data = []
        for c in candidatures:
            logo = None
            if c.annonce.recruteur.logo:
                logo = request.build_absolute_uri(c.annonce.recruteur.logo.url)
            data.append({
                "id": c.id,
                "annonce_id": c.annonce.id,
                "annonce_titre": c.annonce.titre,
                "nom_entreprise": c.annonce.recruteur.nom_entreprise,
                "secteur_activite": c.annonce.secteur_activite,
                "localisation": c.annonce.localisation,
                "type_contrat": c.annonce.type_contrat,
                "salaire_min": str(c.annonce.salaire_min) if c.annonce.salaire_min else None,
                "statut": c.statut,
                "date_soumission": c.date_soumission,
                "date_dernier_traitement": c.date_dernier_traitement,
                "lettre_motivation": c.lettre_motivation,
                "note_score": c.note_score,
                "logo": logo,
            })
        return Response(data, status=status.HTTP_200_OK)

    def delete(self, request, candidature_id):
        """Annuler une candidature"""
        if request.user.role != 'candidat':
            return Response({"error": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)

        try:
            candidat = request.user.candidat
            candidature = Candidature.objects.get(id=candidature_id, candidat=candidat)
        except (Candidat.DoesNotExist, Candidature.DoesNotExist):
            return Response({"error": "Candidature introuvable."}, status=status.HTTP_404_NOT_FOUND)

        candidature.delete()
        return Response({"message": "Candidature annulée avec succès."}, status=status.HTTP_204_NO_CONTENT)


# Remplace la classe CandidaturesRecruteurView dans ton views.py par celle-ci :

class CandidaturesRecruteurView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, annonce_id=None):
        if request.user.role != 'recruteur':
            return Response({"error": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)

        try:
            recruteur = request.user.recruteur
        except Recruteur.DoesNotExist:
            return Response({"error": "Profil recruteur introuvable."}, status=status.HTTP_404_NOT_FOUND)

        if annonce_id:
            try:
                annonce = Annonce.objects.get(id=annonce_id, recruteur=recruteur)
            except Annonce.DoesNotExist:
                return Response({"error": "Annonce introuvable."}, status=status.HTTP_404_NOT_FOUND)
            candidatures = Candidature.objects.filter(
                annonce=annonce
            ).select_related('candidat', 'candidat__user', 'annonce', 'annonce__recruteur')
        else:
            # Toutes les candidatures pour toutes les annonces du recruteur connecté
            candidatures = Candidature.objects.filter(
                annonce__recruteur=recruteur
            ).select_related('candidat', 'candidat__user', 'annonce', 'annonce__recruteur')

        statut = request.query_params.get('statut', None)
        if statut:
            candidatures = candidatures.filter(statut=statut)

        data = []
        for c in candidatures:
            try:
                data.append({
                    "id": c.id,
                    "annonce_id": c.annonce.id,
                    "annonce_titre": c.annonce.titre,
                    "candidat_nom": f"{c.candidat.prenom} {c.candidat.nom}",
                    "candidat_email": c.candidat.user.email,
                    "candidat_id": c.candidat.id,
                    "statut": c.statut,
                    "date_soumission": c.date_soumission,
                    "date_dernier_traitement": c.date_dernier_traitement,
                    "note_score": c.note_score,
                    "score_etape1": getattr(c, 'score_etape1', None),
                    "lettre_motivation": c.lettre_motivation,
                    "photo_profil": request.build_absolute_uri(c.candidat.photo_profil.url) if c.candidat.photo_profil else None,
                })
            except Exception:
                # Ignore les candidatures avec données corrompues
                continue

        return Response(data, status=status.HTTP_200_OK)


class DetailCandidatureView(APIView):
    permission_classes = [IsAuthenticated]          # ✅ token obligatoire
 
    def get(self, request, candidature_id):
        try:
            # ✅ Vérifie que la candidature est sur une annonce de CE recruteur
            candidature = Candidature.objects.get(
                id=candidature_id,
                annonce__recruteur__user=request.user
            )
        except Candidature.DoesNotExist:
            return Response({"error": "Candidature introuvable."}, status=status.HTTP_404_NOT_FOUND)
        serializer = CandidatureDetailSerializer(candidature)
        return Response(serializer.data, status=status.HTTP_200_OK)
 
    def put(self, request, candidature_id):
        try:
            candidature = Candidature.objects.get(
                id=candidature_id,
                annonce__recruteur__user=request.user  # ✅
            )
        except Candidature.DoesNotExist:
            return Response({"error": "Candidature introuvable."}, status=status.HTTP_404_NOT_FOUND)
        serializer = CandidatureUpdateSerializer(candidature, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(CandidatureDetailSerializer(candidature).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ========== VIEWS POUR FAVORIS ==========

class FavoriListView(APIView):
    permission_classes = [IsAuthenticated]          # ✅ token obligatoire
 
    def get(self, request):
        try:
            recruteur = request.user.recruteur      # ✅ CE recruteur uniquement
        except Recruteur.DoesNotExist:
            return Response({"error": "Profil recruteur introuvable."}, status=status.HTTP_404_NOT_FOUND)
        favoris = recruteur.favoris.all()           # ✅ SES favoris uniquement
        serializer = FavoriListSerializer(favoris, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
 
    def post(self, request):
        try:
            recruteur = request.user.recruteur      # ✅ CE recruteur uniquement
        except Recruteur.DoesNotExist:
            return Response({"error": "Profil recruteur introuvable."}, status=status.HTTP_404_NOT_FOUND)
 
        candidat_id = request.data.get('candidat')
        raison = request.data.get('raison', '')
        try:
            candidat = Candidat.objects.get(id=candidat_id)
        except Candidat.DoesNotExist:
            return Response({"error": "Candidat introuvable."}, status=status.HTTP_404_NOT_FOUND)
 
        favori, created = Favori.objects.get_or_create(
            recruteur=recruteur,
            candidat=candidat,
            defaults={'raison': raison}
        )
        if not created:
            favori.raison = raison
            favori.save()
 
        return Response(
            FavoriDetailSerializer(favori).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )


class DetailFavoriView(APIView):
    permission_classes = [IsAuthenticated]          # ✅ token obligatoire
 
    def get(self, request, favori_id):
        try:
            favori = Favori.objects.get(id=favori_id, recruteur__user=request.user)  # ✅
        except Favori.DoesNotExist:
            return Response({"error": "Favori introuvable."}, status=status.HTTP_404_NOT_FOUND)
        return Response(FavoriDetailSerializer(favori).data, status=status.HTTP_200_OK)
 
    def put(self, request, favori_id):
        try:
            favori = Favori.objects.get(id=favori_id, recruteur__user=request.user)  # ✅
        except Favori.DoesNotExist:
            return Response({"error": "Favori introuvable."}, status=status.HTTP_404_NOT_FOUND)
        raison = request.data.get('raison')
        if raison is not None:
            favori.raison = raison
            favori.save()
        return Response(FavoriDetailSerializer(favori).data, status=status.HTTP_200_OK)
 
    def delete(self, request, favori_id):
        try:
            favori = Favori.objects.get(id=favori_id, recruteur__user=request.user)  # ✅
        except Favori.DoesNotExist:
            return Response({"error": "Favori introuvable."}, status=status.HTTP_404_NOT_FOUND)
        favori.delete()
        return Response({"message": "Favori supprimé avec succès."}, status=status.HTTP_204_NO_CONTENT)


# ========== PROFIL CANDIDAT ==========

class ProfilCandidatView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        if request.user.role != 'candidat':
            return Response({"error": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)
        try:
            candidat = request.user.candidat
            from .serializers import CandidatProfilSerializer
            data = CandidatProfilSerializer(candidat).data
            # Ajouter la photo de profil avec URL absolue
            if candidat.photo_profil:
                data['photo_profil'] = request.build_absolute_uri(candidat.photo_profil.url)
            return Response(data)
        except Exception:
            return Response({"profil_complete": False}, status=status.HTTP_200_OK)

    def post(self, request):
        if request.user.role != 'candidat':
            return Response({"error": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)
        from .serializers import CandidatProfilSerializer
        try:
            candidat = request.user.candidat
            serializer = CandidatProfilSerializer(candidat, data=request.data, partial=True)
        except Exception:
            serializer = CandidatProfilSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response({"message": "Profil complété avec succès.", "profil_complete": True}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        """Mettre à jour le profil candidat (y compris photo)"""
        if request.user.role != 'candidat':
            return Response({"error": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)
        from .serializers import CandidatProfilSerializer
        try:
            candidat = request.user.candidat
        except Exception:
            return Response({"error": "Profil introuvable."}, status=status.HTTP_404_NOT_FOUND)

        serializer = CandidatProfilSerializer(candidat, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response({"message": "Profil mis à jour avec succès.", "profil_complete": True}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
# ── À AJOUTER dans views.py ──
# Imports supplémentaires nécessaires en haut du fichier :
# import json, anthropic
# from django.conf import settings
# from .tasks import filtrer_candidature, notifier_selection




# ── MODIFIER SoumettreCandiatureView.post() — ajouter le déclenchement de la tâche ──




# ── NOUVEAU : Statut de la candidature pour le candidat ──
class StatutCandidatureView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, candidature_id):
        try:
            candidat = request.user.candidat
            candidature = Candidature.objects.get(id=candidature_id, candidat=candidat)
        except (Candidat.DoesNotExist, Candidature.DoesNotExist):
            return Response({"error": "Candidature introuvable."}, status=status.HTTP_404_NOT_FOUND)

        rapport = {}
        if candidature.rapport_etape1:
            try:
                rapport = json.loads(candidature.rapport_etape1)
            except Exception:
                pass

        return Response({
            "id": candidature.id,
            "statut": candidature.statut,
            "score_etape1": candidature.score_etape1,
            "score_etape2": candidature.score_etape2,
            "score_final": candidature.score_final,
            "motif_rejet": candidature.motif_rejet_auto,
            "rapport": rapport,
            "annonce_titre": candidature.annonce.titre,
        })


# ── NOUVEAU : Générer les questions pour l'entretien IA ──
class GenererQuestionsIAView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, candidature_id):
        try:
            candidat = request.user.candidat
            candidature = Candidature.objects.select_related('annonce').get(
                id=candidature_id, candidat=candidat
            )
        except (Candidat.DoesNotExist, Candidature.DoesNotExist):
            return Response({"error": "Candidature introuvable."}, status=status.HTTP_404_NOT_FOUND)

        if candidature.statut not in ['etape_2', 'entretien_ia']:
            return Response({"error": "L'entretien IA n'est pas encore disponible."}, status=status.HTTP_403_FORBIDDEN)

        annonce  = candidature.annonce
        candidat_obj = candidature.candidat

        prompt = f"""Tu es un recruteur expert. Génère exactement 5 questions d'entretien pour ce poste.

Poste : {annonce.titre}
Secteur : {annonce.secteur_activite}
Compétences requises : {annonce.competences_requises}
Description : {annonce.description[:500]}
Profil du candidat : {candidat_obj.competences} — {candidat_obj.secteur_activite}

Les questions doivent :
- Évaluer les compétences techniques spécifiques au poste
- Être progressives (du plus simple au plus complexe)
- Permettre d'évaluer la motivation et l'adéquation culturelle
- Être posées en français
- Être claires et précises

Réponds UNIQUEMENT avec ce JSON :
{{
  "questions": [
    {{"id": 1, "question": "...", "critere": "compétence technique", "duree_secondes": 60}},
    {{"id": 2, "question": "...", "critere": "expérience", "duree_secondes": 90}},
    {{"id": 3, "question": "...", "critere": "résolution de problème", "duree_secondes": 120}},
    {{"id": 4, "question": "...", "critere": "motivation", "duree_secondes": 60}},
    {{"id": 5, "question": "...", "critere": "adéquation culturelle", "duree_secondes": 90}}
  ]
}}"""

        try:
            client = Groq(api_key=settings.GROQ_API_KEY)
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1
            )
            raw = response.choices[0].message.content.strip()
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            data = json.loads(raw.strip())

            candidature.statut = 'entretien_ia'
            candidature.save(update_fields=['statut'])

            return Response(data)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ── NOUVEAU : Soumettre les réponses de l'entretien IA pour scoring ──
class SoumettreReponsesIAView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, candidature_id):
        try:
            candidat = request.user.candidat
            candidature = Candidature.objects.select_related('annonce').get(
                id=candidature_id, candidat=candidat
            )
        except (Candidat.DoesNotExist, Candidature.DoesNotExist):
            return Response({"error": "Candidature introuvable."}, status=status.HTTP_404_NOT_FOUND)

        reponses          = request.data.get('reponses', [])      # [{question, reponse, duree}]
        comportement_score= request.data.get('comportement_score', 80)  # Score webcam 0-100
        transcription     = request.data.get('transcription', '')

        annonce = candidature.annonce

        prompt = f"""Tu es un expert en recrutement. Évalue les réponses de ce candidat lors de son entretien IA.

Poste : {annonce.titre}
Compétences requises : {annonce.competences_requises}

=== RÉPONSES DU CANDIDAT ===
{json.dumps(reponses, ensure_ascii=False, indent=2)}

Pour chaque réponse, évalue :
1. La pertinence par rapport à la question
2. La maîtrise technique
3. La clarté de l'expression
4. La profondeur de la réponse

Réponds UNIQUEMENT avec ce JSON :
{{
  "score_global": <0-100>,
  "scores_par_question": [
    {{"id": 1, "score": <0-100>, "commentaire": "..."}},
    {{"id": 2, "score": <0-100>, "commentaire": "..."}},
    {{"id": 3, "score": <0-100>, "commentaire": "..."}},
    {{"id": 4, "score": <0-100>, "commentaire": "..."}},
    {{"id": 5, "score": <0-100>, "commentaire": "..."}}
  ],
  "points_forts": ["...", "..."],
  "points_amelioration": ["...", "..."],
  "verdict": "<appréciation globale en 2 phrases>"
}}"""

        try:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            model = genai.GenerativeModel('gemini-1.5-flash')
            response = model.generate_content(prompt)
            raw = response.text.strip()
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            resultat = json.loads(raw.strip())
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        score_ia          = float(resultat.get('score_global', 0))
        score_etape1      = candidature.score_etape1 or 0
        # Score final = 40% étape1 + 40% entretien IA + 20% comportement
        score_final       = (score_etape1 * 0.4) + (score_ia * 0.4) + (float(comportement_score) * 0.2)

        candidature.score_etape2       = score_ia
        candidature.comportement_score = comportement_score
        candidature.score_final        = score_final
        candidature.rapport_etape2     = json.dumps(resultat, ensure_ascii=False)
        candidature.transcription_ia   = transcription

        if score_final >= 90:
            candidature.statut = 'selectionne'
            candidature.save()
            from .tasks import notifier_selection
            notifier_selection.delay(candidature.id)
        else:
            candidature.statut = 'rejetee_auto'
            motif = f"Score final insuffisant : {score_final:.0f}% (seuil requis : 90%)"
            candidature.motif_rejet_auto = motif
            candidature.save()
            # Email rejet étape 2
            from .tasks import _send_email
            _send_email(
                sujet=f"PlacementPro — Résultat de votre entretien IA pour « {annonce.titre} »",
                message=f"""Bonjour {candidat.prenom} {candidat.nom},

Nous avons analysé votre entretien IA pour le poste de « {annonce.titre } ».

📊 Résultats :
  • Compatibilité profil : {score_etape1:.0f}%
  • Entretien IA : {score_ia:.0f}%
  • Comportement : {comportement_score:.0f}%
  • Score final : {score_final:.0f}% (seuil requis : 90%)

Points forts : {', '.join(resultat.get('points_forts', []))}

Malheureusement votre score final ne correspond pas au seuil requis pour ce poste.

Nous vous encourageons à postuler à d'autres offres.

Cordialement,
L'équipe PlacementPro""",
                destinataire=candidat.user.email
            )

        return Response({
            "score_etape2": score_ia,
            "score_final": score_final,
            "statut": candidature.statut,
            "rapport": resultat,
            "selectionne": score_final >= 90
        })


# ── NOUVEAU : Demander un entretien RH (recruteur → candidat) ──
class DemanderEntretienRHView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, candidature_id):
        try:
            recruteur = request.user.recruteur
            candidature = Candidature.objects.select_related(
                'candidat', 'candidat__user', 'annonce'
            ).get(id=candidature_id, annonce__recruteur=recruteur)
        except (Recruteur.DoesNotExist, Candidature.DoesNotExist):
            return Response({"error": "Candidature introuvable."}, status=status.HTTP_404_NOT_FOUND)

        date_prevue = request.data.get('date_prevue')  # ISO format

        candidature.statut = 'entretien_rh'
        candidature.entretien_rh_demande_le = timezone.now()
        if date_prevue:
            from datetime import datetime
            candidature.entretien_rh_date_prevue = datetime.fromisoformat(date_prevue)
        candidature.save(update_fields=['statut', 'entretien_rh_demande_le', 'entretien_rh_date_prevue'])

        candidat = candidature.candidat
        annonce  = candidature.annonce
        from .tasks import _send_email
        _send_email(
            sujet=f"PlacementPro — 📅 Invitation à un entretien pour « {annonce.titre} »",
            message=f"""Bonjour {candidat.prenom} {candidat.nom},

{annonce.recruteur.nom_entreprise} souhaite vous rencontrer pour un entretien concernant le poste de « {annonce.titre} ».

{'Date proposée : ' + date_prevue if date_prevue else ''}

👉 Connectez-vous sur votre espace candidat pour accepter ou décliner cette invitation.

Cordialement,
L'équipe PlacementPro""",
            destinataire=candidat.user.email
        )
        return Response({"message": "Invitation d'entretien envoyée."})


# ── NOUVEAU : Candidat accepte l'entretien RH ──
class AccepterEntretienRHView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, candidature_id):
        try:
            candidat = request.user.candidat
            candidature = Candidature.objects.select_related(
                'annonce', 'annonce__recruteur', 'annonce__recruteur__user'
            ).get(id=candidature_id, candidat=candidat)
        except (Candidat.DoesNotExist, Candidature.DoesNotExist):
            return Response({"error": "Candidature introuvable."}, status=status.HTTP_404_NOT_FOUND)

        candidature.statut = 'entretien_rh_accepte'
        candidature.entretien_rh_accepte_le = timezone.now()
        candidature.save(update_fields=['statut', 'entretien_rh_accepte_le'])

        # Notifier le recruteur
        recruteur = candidature.annonce.recruteur
        from .tasks import _send_email
        _send_email(
            sujet=f"PlacementPro — ✅ {candidat.prenom} {candidat.nom} a accepté l'entretien",
            message=f"""Bonjour,

{candidat.prenom} {candidat.nom} a accepté votre invitation d'entretien pour le poste de « {candidature.annonce.titre} ».

Connectez-vous sur votre espace recruteur pour lancer la session d'entretien.

Cordialement,
L'équipe PlacementPro""",
            destinataire=recruteur.user.email
        )
        return Response({"message": "Entretien accepté."})


# ── NOUVEAU : Valider ou rejeter après l'entretien RH ──
class ValiderCandidatView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, candidature_id):
        try:
            recruteur = request.user.recruteur
            candidature = Candidature.objects.select_related(
                'candidat', 'candidat__user', 'annonce'
            ).get(id=candidature_id, annonce__recruteur=recruteur)
        except (Recruteur.DoesNotExist, Candidature.DoesNotExist):
            return Response({"error": "Candidature introuvable."}, status=status.HTTP_404_NOT_FOUND)

        decision = request.data.get('decision')  # 'valider' ou 'rejeter'
        message_perso = request.data.get('message', '')

        candidat  = candidature.candidat
        annonce   = candidature.annonce
        from .tasks import _send_email

        if decision == 'valider':
            candidature.statut = 'valide'
            candidature.save(update_fields=['statut'])

            # Marquer l'offre comme pourvue
            annonce.statut = 'pourvue'
            annonce.save(update_fields=['statut'])

            _send_email(
                sujet=f"🎉 Bienvenue chez {annonce.recruteur.nom_entreprise} !",
                message=f"""Bonjour {candidat.prenom} {candidat.nom},

Nous avons le plaisir de vous annoncer que votre candidature pour le poste de « {annonce.titre} » a été retenue !

{annonce.recruteur.nom_entreprise} est ravie de vous ouvrir ses portes et de vous accueillir dans son équipe.

{message_perso}

Vous recevrez prochainement les détails de votre intégration.

Félicitations et bienvenue !

L'équipe {annonce.recruteur.nom_entreprise} & PlacementPro""",
                destinataire=candidat.user.email
            )
            return Response({"message": "Candidat validé. Offre marquée comme pourvue."})

        elif decision == 'rejeter':
            candidature.statut = 'rejetee'
            candidature.save(update_fields=['statut'])

            _send_email(
                sujet=f"PlacementPro — Suite de votre candidature chez {annonce.recruteur.nom_entreprise}",
                message=f"""Bonjour {candidat.prenom} {candidat.nom},

Nous vous remercions pour votre participation au processus de recrutement pour le poste de « {annonce.titre } » chez {annonce.recruteur.nom_entreprise}.

Après considération, nous avons décidé de ne pas donner suite à votre candidature.

{message_perso if message_perso else "Nous vous souhaitons bonne chance dans vos recherches d'emploi."}

Cordialement,
L'équipe PlacementPro""",
                destinataire=candidat.user.email
            )
            return Response({"message": "Candidat rejeté."})

        return Response({"error": "Décision invalide."}, status=status.HTTP_400_BAD_REQUEST)

class StatsRecruteursView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin':
            return Response({"error": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)

        from django.db.models import Count

        total_recruteurs = Recruteur.objects.count()
        recruteurs_valides = Recruteur.objects.filter(valide_par_admin=True).count()
        recruteurs_en_attente = Recruteur.objects.filter(valide_par_admin=False).count()
        total_candidats = Candidat.objects.count()
        total_annonces = Annonce.objects.count()
        annonces_publiees = Annonce.objects.filter(statut='publiee').count()
        total_candidatures = Candidature.objects.count()

        return Response({
            "total_recruteurs": total_recruteurs,
            "recruteurs_valides": recruteurs_valides,
            "recruteurs_en_attente": recruteurs_en_attente,
            "total_candidats": total_candidats,
            "total_annonces": total_annonces,
            "annonces_publiees": annonces_publiees,
            "total_candidatures": total_candidatures,
        }, status=status.HTTP_200_OK)
    
# ========== STATS ADMIN ==========
# Ajoute ces deux classes à la FIN de ton views.py

class StatsCandidatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin':
            return Response({"error": "Accès refusé."}, status=status.HTTP_403_FORBIDDEN)

        return Response({
            "total_candidats": Candidat.objects.count(),
            "total_candidatures": Candidature.objects.count(),
            "candidatures_acceptees": Candidature.objects.filter(statut__in=['acceptee', 'acceptee_offre', 'selectionne', 'valide']).count(),
            "candidatures_rejetees": Candidature.objects.filter(statut__in=['rejetee', 'rejetee_auto']).count(),
            "candidatures_en_cours": Candidature.objects.filter(statut__in=['soumise', 'en_attente', 'analyse_en_cours', 'etape_2', 'shortlistee']).count(),
        }, status=status.HTTP_200_OK)