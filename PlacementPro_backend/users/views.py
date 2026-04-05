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
            return Response(
                {"error": "Accès refusé."},
                status=status.HTTP_403_FORBIDDEN
            )
        recruteurs = Recruteur.objects.filter(valide_par_admin=False)
        data = []
        for r in recruteurs:
            data.append({
                "id": r.id,
                "nom_entreprise": r.nom_entreprise,
                "email": r.user.email,
                "ville": r.ville,
                "secteur_activite": r.secteur_activite,
                "date_inscription": r.user.date_inscription,
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
    """Obtenir et mettre à jour le profil du recruteur"""
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        """Obtenir le profil du recruteur actuel"""
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
        """Mettre à jour le profil du recruteur"""
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
    """Lister toutes les annonces publiées ou filtrées"""
    permission_classes = [AllowAny]

    def get(self, request):
        # Filtres optionnels
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
        
        serializer = AnnonceListSerializer(annonces_query, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class DetailAnnonceView(APIView):
    """Détail d'une annonce"""
    permission_classes = [AllowAny]

    def get(self, request, annonce_id):
        try:
            annonce = Annonce.objects.get(id=annonce_id, statut='publiee')
        except Annonce.DoesNotExist:
            return Response(
                {"error": "Annonce introuvable."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = AnnonceDetailSerializer(annonce)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AnnonceRecruteurView(APIView):
    """Lister les annonces du recruteur connecté - TEMPORARY WITHOUT AUTH CHECK"""
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        # TEMPORARY: Accept all requests without role check
        try:
            # Try to get recruteur if authenticated
            if request.user.is_authenticated:
                recruteur = request.user.recruteur
                annonces = recruteur.annonces.all()
            else:
                # If not authenticated, return all annonces
                annonces = Annonce.objects.all()
        except (Recruteur.DoesNotExist, AttributeError):
            return Response(
                {"error": "Profil recruteur introuvable."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = AnnonceListSerializer(annonces, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        """Créer une nouvelle annonce - TEMPORARY WITHOUT ROLE CHECK"""
        # TEMPORARY: For testing, use first recruteur if exists, otherwise create data without user
        try:
            # Try to get recruteur if authenticated
            if request.user.is_authenticated:
                recruteur = request.user.recruteur
            else:
                # If not authenticated, get first recruteur from database
                recruteur = Recruteur.objects.first()
                if not recruteur:
                    return Response(
                        {"error": "Aucun recruteur trouvé pour créer une annonce."},
                        status=status.HTTP_404_NOT_FOUND
                    )
        except Recruteur.DoesNotExist:
            return Response(
                {"error": "Profil recruteur introuvable."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = AnnonceCreateUpdateSerializer(data=request.data)
        if serializer.is_valid():
            annonce = serializer.save(recruteur=recruteur)
            return Response(
                AnnonceDetailSerializer(annonce).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DetailAnnonceRecruteurView(APIView):
    """Détail et modification d'une annonce par le recruteur - TEMPORARY WITHOUT AUTH CHECK"""
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, annonce_id):
        try:
            annonce = Annonce.objects.get(id=annonce_id)
            # TEMPORARY: Skip ownership check
        except Annonce.DoesNotExist:
            return Response(
                {"error": "Annonce introuvable."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = AnnonceDetailSerializer(annonce)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, annonce_id):
        """Modifier une annonce - TEMPORARY"""
        try:
            annonce = Annonce.objects.get(id=annonce_id)
            # TEMPORARY: Skip ownership check
        except Annonce.DoesNotExist:
            return Response(
                {"error": "Annonce introuvable."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = AnnonceCreateUpdateSerializer(annonce, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                AnnonceDetailSerializer(annonce).data,
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, annonce_id):
        """Supprimer une annonce - TEMPORARY"""
        try:
            annonce = Annonce.objects.get(id=annonce_id)
            # TEMPORARY: Skip ownership check
        except Annonce.DoesNotExist:
            return Response(
                {"error": "Annonce introuvable."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        annonce.delete()
        return Response(
            {"message": "Annonce supprimée avec succès."},
            status=status.HTTP_204_NO_CONTENT
        )


# ========== VIEWS POUR CANDIDATURES ==========

class SoumettreCandiatureView(APIView):
    """Soumettre une candidature"""
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
            return Response(
                {"error": "Annonce introuvable."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        try:
            candidat = request.user.candidat
        except Candidat.DoesNotExist:
            return Response(
                {"error": "Profil candidat introuvable."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Vérifier si le candidat a déjà candidaturé
        if Candidature.objects.filter(annonce=annonce, candidat=candidat).exists():
            return Response(
                {"error": "Vous avez déjà candidaturé pour cette annonce."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        lettre_motivation = request.data.get('lettre_motivation', '')
        
        candidature = Candidature.objects.create(
            annonce=annonce,
            candidat=candidat,
            lettre_motivation=lettre_motivation
        )
        
        return Response(
            CandidatureDetailSerializer(candidature).data,
            status=status.HTTP_201_CREATED
        )


class CandidaturesRecruteurView(APIView):
    """Lister les candidatures pour les annonces du recruteur - TEMPORARY WITHOUT AUTH CHECK"""
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, annonce_id=None):
        # TEMPORARY: Accept all requests
        
        if annonce_id:
            try:
                annonce = Annonce.objects.get(id=annonce_id)
            except Annonce.DoesNotExist:
                return Response(
                    {"error": "Annonce introuvable."},
                    status=status.HTTP_404_NOT_FOUND
                )
            candidatures = annonce.candidatures.all()
        else:
            # Return all candidatures
            candidatures = Candidature.objects.all()
        
        # Filtres optionnels
        statut = request.query_params.get('statut', None)
        if statut:
            candidatures = candidatures.filter(statut=statut)
        
        serializer = CandidatureListSerializer(candidatures, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class DetailCandidatureView(APIView):
    """Détail d'une candidature - TEMPORARY WITHOUT AUTH CHECK"""
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, candidature_id):
        try:
            candidature = Candidature.objects.get(id=candidature_id)
            # TEMPORARY: Skip ownership check
        except Candidature.DoesNotExist:
            return Response(
                {"error": "Candidature introuvable."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = CandidatureDetailSerializer(candidature)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, candidature_id):
        """Mettre à jour le statut et les notes d'une candidature - TEMPORARY"""
        try:
            candidature = Candidature.objects.get(id=candidature_id)
            # TEMPORARY: Skip ownership check
        except Candidature.DoesNotExist:
            return Response(
                {"error": "Candidature introuvable."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = CandidatureUpdateSerializer(candidature, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                CandidatureDetailSerializer(candidature).data,
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ========== VIEWS POUR FAVORIS ==========

class FavoriListView(APIView):
    """Lister les favoris du recruteur - TEMPORARY WITHOUT AUTH CHECK"""
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        # TEMPORARY: Accept all requests
        # If authenticated, return user's favoris, else return all
        if request.user.is_authenticated:
            try:
                recruteur = request.user.recruteur
                favoris = recruteur.favoris.all()
            except Recruteur.DoesNotExist:
                favoris = Favori.objects.all()
        else:
            favoris = Favori.objects.all()
        
        serializer = FavoriListSerializer(favoris, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        """Ajouter un candidat aux favoris - TEMPORARY"""
        # TEMPORARY: Use first recruteur if not authenticated
        if request.user.is_authenticated:
            try:
                recruteur = request.user.recruteur
            except Recruteur.DoesNotExist:
                return Response(
                    {"error": "Profil recruteur introuvable."},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            recruteur = Recruteur.objects.first()
            if not recruteur:
                return Response(
                    {"error": "Aucun recruteur trouvé."},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        candidat_id = request.data.get('candidat')
        raison = request.data.get('raison', '')
        
        try:
            candidat = Candidat.objects.get(id=candidat_id)
        except Candidat.DoesNotExist:
            return Response(
                {"error": "Candidat introuvable."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Vérifier si le candidat est déjà en favori
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
    """Détail et suppression d'un favori - TEMPORARY WITHOUT AUTH CHECK"""
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, favori_id):
        try:
            favori = Favori.objects.get(id=favori_id)
            # TEMPORARY: Skip ownership check
        except Favori.DoesNotExist:
            return Response(
                {"error": "Favori introuvable."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = FavoriDetailSerializer(favori)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, favori_id):
        """Mettre à jour les notes d'un favori - TEMPORARY"""
        try:
            favori = Favori.objects.get(id=favori_id)
            # TEMPORARY: Skip ownership check
        except Favori.DoesNotExist:
            return Response(
                {"error": "Favori introuvable."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        raison = request.data.get('raison')
        if raison is not None:
            favori.raison = raison
            favori.save()
        
        return Response(
            FavoriDetailSerializer(favori).data,
            status=status.HTTP_200_OK
        )

    def delete(self, request, favori_id):
        """Supprimer un favori - TEMPORARY"""
        try:
            favori = Favori.objects.get(id=favori_id)
            # TEMPORARY: Skip ownership check
        except Favori.DoesNotExist:
            return Response(
                {"error": "Favori introuvable."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        favori.delete()
        return Response(
            {"message": "Favori supprimé avec succès."},
            status=status.HTTP_204_NO_CONTENT
        )