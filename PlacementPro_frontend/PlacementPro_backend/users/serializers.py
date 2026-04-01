from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, Candidat, Recruteur


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

    class Meta:
        model = User
        fields = [
            'email', 'password',
            'nom_entreprise', 'secteur_activite', 'localisation',
            'ville', 'adresse', 'telephone', 'description',
            'taille_entreprise', 'registre_commerce',
            'certificat_immatriculation', 'patente'
        ]

    def create(self, validated_data):
        recruteur_fields = [
            'nom_entreprise', 'secteur_activite', 'localisation',
            'ville', 'adresse', 'telephone', 'description',
            'taille_entreprise', 'registre_commerce',
            'certificat_immatriculation', 'patente'
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