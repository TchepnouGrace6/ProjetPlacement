from django.urls import path
from .views import (
    InscriptionCandidatView,
    InscriptionRecruteurView,
    ConnexionView,
    ValidationRecruteurView,
    ListeRecruteursEnAttenteView,
    ProfilCandidatView,
    CreationAdminView
)

urlpatterns = [
    path('inscription/candidat/', InscriptionCandidatView.as_view(), name='inscription-candidat'),
    path('inscription/recruteur/', InscriptionRecruteurView.as_view(), name='inscription-recruteur'),
    path('connexion/', ConnexionView.as_view(), name='connexion'),
    path('admin/recruteurs/en-attente/', ListeRecruteursEnAttenteView.as_view()),
    path('admin/recruteurs/<int:recruteur_id>/valider/', ValidationRecruteurView.as_view()),
    path('admin/creer/', CreationAdminView.as_view()),
]