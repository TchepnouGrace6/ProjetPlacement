from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, Candidat, Recruteur, Annonce, Candidature, Favori


class InscriptionCandidatSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ['email', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            role='candidat'
        )
        return user


class InscriptionRecruteurSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    nom_entreprise = serializers.CharField()
    secteur_activite = serializers.CharField()
    localisation = serializers.CharField()
    ville = serializers.CharField()
    adresse = serializers.CharField()
    telephone = serializers.CharField()
    description = serializers.CharField()
    taille_entreprise = serializers.CharField()
    registre_commerce = serializers.FileField()
    certificat_immatriculation = serializers.FileField()
    patente = serializers.FileField()
    logo = serializers.ImageField()

    class Meta:
        model = User
        fields = [
            'email', 'password',
            'nom_entreprise', 'secteur_activite', 'localisation',
            'ville', 'adresse', 'telephone', 'description',
            'taille_entreprise', 'registre_commerce',
            'certificat_immatriculation', 'patente', 'logo'
        ]

    def create(self, validated_data):
        recruteur_fields = [
            'nom_entreprise', 'secteur_activite', 'localisation',
            'ville', 'adresse', 'telephone', 'description',
            'taille_entreprise', 'registre_commerce',
            'certificat_immatriculation', 'patente', 'logo'
        ]
        recruteur_data = {}
        for field in recruteur_fields:
            if field in validated_data:
                recruteur_data[field] = validated_data.pop(field)

        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            role='recruteur',
            is_active=False
        )
        Recruteur.objects.create(user=user, **recruteur_data)
        return user


class ConnexionSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'role', 'is_active', 'date_inscription']


class RecruteurProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recruteur
        fields = [
            'id', 'nom_entreprise', 'secteur_activite', 'localisation',
            'ville', 'adresse', 'site_web', 'telephone', 'description',
            'date_creation_entreprise', 'taille_entreprise', 'logo'
        ]


class AnnonceListSerializer(serializers.ModelSerializer):
    nom_entreprise = serializers.CharField(source='recruteur.nom_entreprise', read_only=True)
    nombre_candidatures = serializers.SerializerMethodField()
    logo = serializers.SerializerMethodField()

    class Meta:
        model = Annonce
        fields = [
            'id', 'titre', 'description', 'secteur_activite', 'localisation',
            'type_contrat', 'salaire_min', 'salaire_max', 'date_debut',
            'statut', 'date_publication', 'nom_entreprise', 'nombre_candidatures', 'logo'
        ]

    def get_nombre_candidatures(self, obj):
        return obj.candidatures.count()

    def get_logo(self, obj):
        request = self.context.get('request')
        if obj.recruteur.logo:
            return request.build_absolute_uri(obj.recruteur.logo.url)
        return None


class AnnonceDetailSerializer(serializers.ModelSerializer):
    nom_entreprise = serializers.CharField(source='recruteur.nom_entreprise', read_only=True)
    nombre_candidatures = serializers.SerializerMethodField()
    logo = serializers.SerializerMethodField()

    class Meta:
        model = Annonce
        fields = [
            'id', 'titre', 'description', 'competences_requises',
            'qualifications', 'secteur_activite', 'localisation',
            'type_contrat', 'salaire_min', 'salaire_max', 'date_debut',
            'nombre_postes', 'statut', 'date_creation', 'date_publication',
            'date_fermeture', 'nom_entreprise', 'nombre_candidatures', 'visible', 'logo'
        ]

    def get_nombre_candidatures(self, obj):
        return obj.candidatures.count()

    def get_logo(self, obj):
        request = self.context.get('request')
        if request and obj.recruteur.logo:
            return request.build_absolute_uri(obj.recruteur.logo.url)
        return None


class AnnonceCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Annonce
        fields = [
            'titre', 'description', 'competences_requises', 'qualifications',
            'secteur_activite', 'localisation', 'type_contrat',
            'salaire_min', 'salaire_max', 'date_debut', 'nombre_postes', 'statut'
        ]


class CandidatureCandidatSerializer(serializers.ModelSerializer):
    class Meta:
        model = Candidat
        fields = ['id', 'nom', 'prenom', 'telephone']


class CandidatureListSerializer(serializers.ModelSerializer):
    candidat_nom = serializers.SerializerMethodField()
    candidat_email = serializers.CharField(source='candidat.user.email', read_only=True)
    annonce_titre = serializers.CharField(source='annonce.titre', read_only=True)

    class Meta:
        model = Candidature
        fields = [
            'id', 'annonce_titre', 'candidat_nom', 'candidat_email',
            'statut', 'date_soumission', 'date_dernier_traitement', 'note_score'
        ]

    def get_candidat_nom(self, obj):
        return f"{obj.candidat.prenom} {obj.candidat.nom}"


class CandidatureDetailSerializer(serializers.ModelSerializer):
    candidat_info = serializers.SerializerMethodField()
    annonce_titre = serializers.CharField(source='annonce.titre', read_only=True)

    class Meta:
        model = Candidature
        fields = [
            'id', 'annonce_titre', 'candidat_info', 'statut',
            'notes_recruteur', 'note_score', 'lettre_motivation',
            'date_soumission', 'date_dernier_traitement'
        ]

    def get_candidat_info(self, obj):
        candidat = obj.candidat
        return {
            'id': candidat.id,
            'nom': candidat.nom,
            'prenom': candidat.prenom,
            'email': candidat.user.email,
            'telephone': candidat.telephone,
            'ville': candidat.ville,
            'secteur': candidat.secteur_activite,
            'competences': candidat.competences,
            'cv': candidat.cv.url if candidat.cv else None,
            'diplome': candidat.diplome.url if candidat.diplome else None,
            'photo_profil': candidat.photo_profil.url if candidat.photo_profil else None,
        }


class CandidatureUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Candidature
        fields = ['statut', 'notes_recruteur', 'note_score']


class FavoriListSerializer(serializers.ModelSerializer):
    candidat_nom = serializers.SerializerMethodField()
    candidat_email = serializers.CharField(source='candidat.user.email', read_only=True)

    class Meta:
        model = Favori
        fields = ['id', 'candidat_nom', 'candidat_email', 'raison', 'date_ajout']

    def get_candidat_nom(self, obj):
        return f"{obj.candidat.prenom} {obj.candidat.nom}"


class FavoriDetailSerializer(serializers.ModelSerializer):
    candidat_info = serializers.SerializerMethodField()

    class Meta:
        model = Favori
        fields = ['id', 'candidat_info', 'raison', 'date_ajout', 'date_modification']

    def get_candidat_info(self, obj):
        candidat = obj.candidat
        return {
            'id': candidat.id,
            'nom': candidat.nom,
            'prenom': candidat.prenom,
            'email': candidat.user.email,
            'telephone': candidat.telephone,
            'ville': candidat.ville,
            'secteur': candidat.secteur_activite,
            'competences': candidat.competences,
            'cv': candidat.cv.url if candidat.cv else None,
            'photo_profil': candidat.photo_profil.url if candidat.photo_profil else None,
        }


class FavoriCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Favori
        fields = ['candidat', 'raison']


class CandidatProfilSerializer(serializers.ModelSerializer):
    class Meta:
        model = Candidat
        fields = [
            'nom', 'prenom', 'date_naissance', 'sexe', 'nationalite',
            'telephone', 'ville', 'statut_matrimonial', 'handicap',
            'langue_parlee', 'secteur_activite', 'dernier_poste',
            'derniere_entreprise', 'competences',
            'cv', 'diplome', 'lettre_motivation', 'piece_identite',
            'photo_profil', 'profil_complete',
        ]

    def create(self, validated_data):
        validated_data['profil_complete'] = True
        user = validated_data.pop('user', None)
        return Candidat.objects.create(user=user, **validated_data)

    def update(self, instance, validated_data):
        validated_data['profil_complete'] = True
        validated_data.pop('user', None)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        return instance