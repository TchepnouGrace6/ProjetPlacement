from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import authenticate
#from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.parsers import MultiPartParser, FormParser
import ssl
import smtplib
from django.core.mail import EmailMessage

from .models import User, Recruteur, Candidat
from .serializers import (
    InscriptionCandidatSerializer,
    InscriptionRecruteurSerializer,
    ConnexionSerializer,
    UserSerializer
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