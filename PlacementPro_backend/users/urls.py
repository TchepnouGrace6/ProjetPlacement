from django.urls import path
from .views import (
    AccepterEntretienRHView,
    DemanderEntretienRHView,
    GenererQuestionsIAView,
    InscriptionCandidatView,
    InscriptionRecruteurView,
    ConnexionView,
    ProfilCandidatView,
    MesCandidaturesView,
    SoumettreReponsesIAView,
    StatutCandidatureView,
    ValidationRecruteurView,
    ListeRecruteursEnAttenteView,
    CreationAdminView,
    RecruteurProfileView,
    ListAnnonceView,
    DetailAnnonceView,
    AnnonceRecruteurView,
    DetailAnnonceRecruteurView,
    SoumettreCandiatureView,
    CandidaturesRecruteurView,
    DetailCandidatureView,
    FavoriListView,
    DetailFavoriView,
    ValiderCandidatView,
    StatsRecruteursView
)

urlpatterns = [
    # ========== Authentication & Admin ==========
    path('inscription/candidat/', InscriptionCandidatView.as_view(), name='inscription-candidat'),
    path('inscription/recruteur/', InscriptionRecruteurView.as_view(), name='inscription-recruteur'),
    path('connexion/', ConnexionView.as_view(), name='connexion'),
    path('admin/recruteurs/en-attente/', ListeRecruteursEnAttenteView.as_view()),
    path('admin/recruteurs/<int:recruteur_id>/valider/', ValidationRecruteurView.as_view()),
    path('admin/creer/', CreationAdminView.as_view()),

    # ========== Profil Recruteur ==========
    path('recruteur/profile/', RecruteurProfileView.as_view(), name='recruteur-profile'),

    # ========== Annonces Publiques ==========
    path('annonces/', ListAnnonceView.as_view(), name='list-annonces'),
    path('annonces/<int:annonce_id>/', DetailAnnonceView.as_view(), name='detail-annonce'),

    # ========== Annonces Recruteur ==========
    path('recruteur/annonces/', AnnonceRecruteurView.as_view(), name='recruteur-annonces'),
    path('recruteur/annonces/<int:annonce_id>/', DetailAnnonceRecruteurView.as_view(), name='recruteur-detail-annonce'),

    # ========== Candidatures ==========
    path('annonces/<int:annonce_id>/candidater/', SoumettreCandiatureView.as_view(), name='soumettre-candidature'),
    path('recruteur/candidatures/', CandidaturesRecruteurView.as_view(), name='recruteur-candidatures'),
    path('recruteur/candidatures/<int:annonce_id>/', CandidaturesRecruteurView.as_view(), name='recruteur-candidatures-annonce'),
    path('candidatures/<int:candidature_id>/', DetailCandidatureView.as_view(), name='detail-candidature'),

    # ========== Candidat — mes candidatures + annuler ==========
    path('candidat/mes-candidatures/', MesCandidaturesView.as_view(), name='mes-candidatures'),
    path('candidat/mes-candidatures/<int:candidature_id>/', MesCandidaturesView.as_view(), name='annuler-candidature'),

    # ========== Favoris ==========
    path('recruteur/favoris/', FavoriListView.as_view(), name='recruteur-favoris'),
    path('recruteur/favoris/<int:favori_id>/', DetailFavoriView.as_view(), name='detail-favori'),

    # ========== Profil candidat ==========
    path('candidat/profil/', ProfilCandidatView.as_view(), name='profil-candidat'),

    # ── À AJOUTER dans urls.py ──
# Importe les nouvelles vues :
# from .views import (
#     StatutCandidatureView, GenererQuestionsIAView,
#     SoumettreReponsesIAView, DemanderEntretienRHView,
#     AccepterEntretienRHView, ValiderCandidatView
# )

# Puis ajoute ces paths dans urlpatterns :

path('candidatures/<int:candidature_id>/statut/', StatutCandidatureView.as_view()),
path('candidatures/<int:candidature_id>/questions-ia/', GenererQuestionsIAView.as_view()),
path('candidatures/<int:candidature_id>/reponses-ia/', SoumettreReponsesIAView.as_view()),
path('candidatures/<int:candidature_id>/entretien-rh/', DemanderEntretienRHView.as_view()),
path('candidatures/<int:candidature_id>/accepter-entretien/', AccepterEntretienRHView.as_view()),
path('candidatures/<int:candidature_id>/valider/', ValiderCandidatView.as_view()),

# Dans les imports


# Dans urlpatterns
path('stats/recruteurs/', StatsRecruteursView.as_view(), name='stats-recruteurs'),
]