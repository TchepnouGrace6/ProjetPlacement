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