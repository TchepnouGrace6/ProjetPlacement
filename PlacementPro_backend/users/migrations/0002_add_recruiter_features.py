# Generated migration for recruiter features

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Annonce',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('titre', models.CharField(max_length=200)),
                ('description', models.TextField()),
                ('competences_requises', models.TextField(help_text='Compétences nécessaires, séparées par des virgules')),
                ('qualifications', models.TextField(blank=True, help_text='Formations/diplômes requis')),
                ('secteur_activite', models.CharField(max_length=100)),
                ('localisation', models.CharField(max_length=150)),
                ('type_contrat', models.CharField(choices=[('cdi', 'CDI'), ('cdd', 'CDD'), ('stage', 'Stage'), ('alternance', 'Alternance'), ('freelance', 'Freelance')], max_length=20)),
                ('salaire_min', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('salaire_max', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('date_debut', models.DateField()),
                ('statut', models.CharField(choices=[('brouillon', 'Brouillon'), ('publiee', 'Publiée'), ('fermee', 'Fermée'), ('archivee', 'Archivée')], default='brouillon', max_length=20)),
                ('date_creation', models.DateTimeField(auto_now_add=True)),
                ('date_publication', models.DateTimeField(blank=True, null=True)),
                ('date_fermeture', models.DateTimeField(blank=True, null=True)),
                ('date_modification', models.DateTimeField(auto_now=True)),
                ('nombre_postes', models.IntegerField(default=1)),
                ('visible', models.BooleanField(default=True)),
                ('recruteur', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='annonces', to='users.recruteur')),
            ],
            options={
                'ordering': ['-date_creation'],
            },
        ),
        migrations.CreateModel(
            name='Favori',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('raison', models.TextField(blank=True, help_text='Raison du favori')),
                ('date_ajout', models.DateTimeField(auto_now_add=True)),
                ('date_modification', models.DateTimeField(auto_now=True)),
                ('candidat', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='favoris_recruteur', to='users.candidat')),
                ('recruteur', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='favoris', to='users.recruteur')),
            ],
            options={
                'ordering': ['-date_ajout'],
                'unique_together': {('recruteur', 'candidat')},
            },
        ),
        migrations.CreateModel(
            name='Candidature',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('statut', models.CharField(choices=[('soumise', 'Soumise'), ('acceptee', 'Acceptée'), ('rejetee', 'Rejetée'), ('en_attente', 'En attente'), ('shortlistee', 'Shortlistée'), ('acceptee_offre', 'Offre acceptée')], default='soumise', max_length=20)),
                ('notes_recruteur', models.TextField(blank=True)),
                ('note_score', models.IntegerField(blank=True, help_text='Score de 0 à 5', null=True)),
                ('date_soumission', models.DateTimeField(auto_now_add=True)),
                ('date_dernier_traitement', models.DateTimeField(auto_now=True)),
                ('lettre_motivation', models.TextField(blank=True)),
                ('annonce', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='candidatures', to='users.annonce')),
                ('candidat', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='candidatures', to='users.candidat')),
            ],
            options={
                'ordering': ['-date_soumission'],
                'unique_together': {('annonce', 'candidat')},
            },
        ),
    ]
