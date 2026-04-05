from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, password, role, **extra_fields):
        if not email:
            raise ValueError("L'email est obligatoire")
        email = self.normalize_email(email)
        user = self.model(email=email, role=role, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password, **extra_fields):
        extra_fields.setdefault('role', 'admin')
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ('candidat', 'Candidat'),
        ('recruteur', 'Recruteur'),
        ('admin', 'Administrateur'),
    ]
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_inscription = models.DateTimeField(auto_now_add=True)

    groups = models.ManyToManyField(
        'auth.Group',
        related_name='custom_user_set',
        blank=True
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='custom_user_set',
        blank=True
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    objects = UserManager()

    def __str__(self):
        return f"{self.email} ({self.role})"


class Candidat(models.Model):
    SEXE_CHOICES = [
        ('M', 'Masculin'),
        ('F', 'Féminin'),
    ]
    STATUT_CHOICES = [
        ('celibataire', 'Célibataire'),
        ('marie', 'Marié(e)'),
        ('divorce', 'Divorcé(e)'),
        
    ]
    # Lien avec User
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='candidat')

    # Informations personnelles
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    date_naissance = models.DateField()
    sexe = models.CharField(max_length=1, choices=SEXE_CHOICES)
    nationalite = models.CharField(max_length=100)
    telephone = models.CharField(max_length=20)
    ville = models.CharField(max_length=100)
    statut_matrimonial = models.CharField(max_length=20, choices=STATUT_CHOICES)
    handicap = models.BooleanField(default=False)
    langue_parlee = models.CharField(max_length=200)

    # Informations professionnelles
    secteur_activite = models.CharField(max_length=100)
    dernier_poste = models.CharField(max_length=150)
    derniere_entreprise = models.CharField(max_length=150)
    competences = models.TextField()

    # Documents obligatoires
    cv = models.FileField(upload_to='documents/candidats/cv/')
    diplome = models.FileField(upload_to='documents/candidats/diplomes/')
    lettre_motivation = models.FileField(upload_to='documents/candidats/lettres/')
    piece_identite = models.FileField(upload_to='documents/candidats/identite/')

    # Complétude du profil
    profil_complete = models.BooleanField(default=False)
    date_mise_a_jour = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.prenom} {self.nom}"


class Recruteur(models.Model):
    # Lien avec User
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='recruteur')

    # Informations de l'entreprise
    nom_entreprise = models.CharField(max_length=150)
    secteur_activite = models.CharField(max_length=100)
    localisation = models.CharField(max_length=150)
    ville = models.CharField(max_length=100)
    adresse = models.CharField(max_length=255)
    site_web = models.URLField(blank=True)
    telephone = models.CharField(max_length=20)
    description = models.TextField()
    date_creation_entreprise = models.DateField(blank=True, null=True)
    taille_entreprise = models.CharField(max_length=50)
    logo = models.ImageField(upload_to='documents/recruteurs/logos/', blank=True, null=True)

    # Documents de certification
    registre_commerce = models.FileField(upload_to='documents/recruteurs/')
    certificat_immatriculation = models.FileField(upload_to='documents/recruteurs/')
    patente = models.FileField(upload_to='documents/recruteurs/')

    # Validation administrative
    valide_par_admin = models.BooleanField(default=False)
    date_validation = models.DateTimeField(blank=True, null=True)
    motif_rejet = models.TextField(blank=True)

    def __str__(self):
        return self.nom_entreprise


class Annonce(models.Model):
    STATUT_CHOICES = [
        ('brouillon', 'Brouillon'),
        ('publiee', 'Publiée'),
        ('fermee', 'Fermée'),
        ('archivee', 'Archivée'),
    ]
    
    TYPE_CONTRAT_CHOICES = [
        ('cdi', 'CDI'),
        ('cdd', 'CDD'),
        ('stage', 'Stage'),
        ('alternance', 'Alternance'),
        ('freelance', 'Freelance'),
    ]
    
    # Lien avec le recruteur
    recruteur = models.ForeignKey(Recruteur, on_delete=models.CASCADE, related_name='annonces')
    
    # Informations générales
    titre = models.CharField(max_length=200)
    description = models.TextField()
    competences_requises = models.TextField(help_text="Compétences nécessaires, séparées par des virgules")
    qualifications = models.TextField(blank=True, help_text="Formations/diplômes requis")
    
    # Détails du poste
    secteur_activite = models.CharField(max_length=100)
    localisation = models.CharField(max_length=150)
    type_contrat = models.CharField(max_length=20, choices=TYPE_CONTRAT_CHOICES)
    salaire_min = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    salaire_max = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    date_debut = models.DateField()
    
    # Statut et dates
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='brouillon')
    date_creation = models.DateTimeField(auto_now_add=True)
    date_publication = models.DateTimeField(blank=True, null=True)
    date_fermeture = models.DateTimeField(blank=True, null=True)
    date_modification = models.DateTimeField(auto_now=True)
    
    # Visibilité
    nombre_postes = models.IntegerField(default=1)
    visible = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-date_creation']
    
    def __str__(self):
        return f"{self.titre} - {self.recruteur.nom_entreprise}"


class Candidature(models.Model):
    STATUT_CHOICES = [
        ('soumise', 'Soumise'),
        ('acceptee', 'Acceptée'),
        ('rejetee', 'Rejetée'),
        ('en_attente', 'En attente'),
        ('shortlistee', 'Shortlistée'),
        ('acceptee_offre', 'Offre acceptée'),
    ]
    
    # Liens
    annonce = models.ForeignKey(Annonce, on_delete=models.CASCADE, related_name='candidatures')
    candidat = models.ForeignKey(Candidat, on_delete=models.CASCADE, related_name='candidatures')
    
    # Statut et notes
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='soumise')
    notes_recruteur = models.TextField(blank=True)
    note_score = models.IntegerField(blank=True, null=True, help_text="Score de 0 à 5")
    
    # Dates
    date_soumission = models.DateTimeField(auto_now_add=True)
    date_dernier_traitement = models.DateTimeField(auto_now=True)
    
    # Lettre de motivation
    lettre_motivation = models.TextField(blank=True)
    
    class Meta:
        unique_together = ('annonce', 'candidat')
        ordering = ['-date_soumission']
    
    def __str__(self):
        return f"{self.candidat} - {self.annonce.titre} ({self.statut})"


class Favori(models.Model):
    """Modèle pour la shortlist/favoris des recruteurs"""
    
    recruteur = models.ForeignKey(Recruteur, on_delete=models.CASCADE, related_name='favoris')
    candidat = models.ForeignKey(Candidat, on_delete=models.CASCADE, related_name='favoris_recruteur')
    
    raison = models.TextField(blank=True, help_text="Raison du favori")
    date_ajout = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('recruteur', 'candidat')
        ordering = ['-date_ajout']
    
    def __str__(self):
        return f"{self.recruteur.nom_entreprise} - {self.candidat}"