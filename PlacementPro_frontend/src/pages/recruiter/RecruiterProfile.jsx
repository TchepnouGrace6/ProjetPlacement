import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Save, Camera, CheckCircle, X, Clock } from 'lucide-react';
import { getRecruteurProfile, updateRecruteurProfile } from '../../api/recruiter';
import '../../styles/recruiter-profile.css';

export default function RecruiterProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    nom_entreprise: '',
    secteur_activite: '',
    localisation: '',
    ville: '',
    adresse: '',
    site_web: '',
    telephone: '',
    description: '',
    taille_entreprise: '',
    logo: null
  });

  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    chargerProfile();
  }, []);

  const chargerProfile = async () => {
    try {
      setLoading(true);
      const response = await getRecruteurProfile();
      
      if (response.data.logo) {
        setLogoPreview(response.data.logo);
      }

      setProfile(response.data);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement du profil');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        setError('Veuillez sélectionner une image');
        return;
      }

      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('L\'image doit être inférieure à 5MB');
        return;
      }

      // Créer un aperçu
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Mettre à jour le profil avec le nouveau logo
      setProfile(prev => ({
        ...prev,
        logo: file
      }));

      setError(null);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);

      // Utiliser FormData pour envoyer les données avec le fichier
      const formData = new FormData();
      
      // Ajouter les champs texte
      formData.append('nom_entreprise', profile.nom_entreprise);
      formData.append('secteur_activite', profile.secteur_activite);
      formData.append('localisation', profile.localisation);
      formData.append('ville', profile.ville);
      formData.append('adresse', profile.adresse);
      formData.append('site_web', profile.site_web);
      formData.append('telephone', profile.telephone);
      formData.append('description', profile.description);
      formData.append('taille_entreprise', profile.taille_entreprise);
      
      // Ajouter le logo s'il a été modifié
      if (profile.logo instanceof File) {
        formData.append('logo', profile.logo);
      }

      await updateRecruteurProfile(formData);
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Erreur lors de la sauvegarde du profil');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="recruiter-profile-container">
        <div className="loading">Chargement du profil...</div>
      </div>
    );
  }

  return (
    <div className="recruiter-profile-container">
      <div className="profile-card">
        <h1><Building2 size={32} style={{ display: 'inline-block', marginRight: '0.5rem' }} /> Profil Entreprise</h1>

        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <CheckCircle size={20} style={{ marginRight: '0.5rem' }} /> Profil mis à jour avec succès
          </div>
        )}

        <form onSubmit={handleSubmit} className="profile-form">
          {/* Section Logo */}
          <div className="logo-section">
            <h3>Logo Entreprise</h3>
            
            <div className="logo-upload">
              {logoPreview ? (
                <div className="logo-preview">
                  <img 
                    src={logoPreview} 
                    alt="Logo preview"
                    className="logo-image"
                  />
                  <button
                    type="button"
                    className="btn-remove-logo"
                    onClick={() => {
                      setLogoPreview(null);
                      setProfile(prev => ({ ...prev, logo: null }));
                    }}
                  >
                    <X size={16} style={{ marginRight: '0.25rem' }} /> Supprimer
                  </button>
                </div>
              ) : (
                <div className="logo-placeholder">
                  <Camera size={48} style={{ marginBottom: '0.5rem' }} />
                  <p>Aucun logo</p>
                </div>
              )}

              <input
                type="file"
                id="logoInput"
                accept="image/*"
                onChange={handleLogoChange}
                className="file-input"
              />
              <label htmlFor="logoInput" className="btn-upload">
                Choisir une image
              </label>
              <small>Format: JPG, PNG, GIF | Taille max: 5MB</small>
            </div>
          </div>

          {/* Section Informations */}
          <div className="form-section">
            <h3>Informations Entreprise</h3>

            <div className="form-group">
              <label htmlFor="nom_entreprise">Nom de l'entreprise *</label>
              <input
                type="text"
                id="nom_entreprise"
                name="nom_entreprise"
                value={profile.nom_entreprise}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="secteur_activite">Secteur d'activité *</label>
                <input
                  type="text"
                  id="secteur_activite"
                  name="secteur_activite"
                  value={profile.secteur_activite}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="taille_entreprise">Taille entreprise *</label>
                <select
                  id="taille_entreprise"
                  name="taille_entreprise"
                  value={profile.taille_entreprise}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Sélectionner</option>
                  <option value="1-10">1-10 personnes</option>
                  <option value="11-50">11-50 personnes</option>
                  <option value="51-200">51-200 personnes</option>
                  <option value="201-500">201-500 personnes</option>
                  <option value="500+">500+ personnes</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="ville">Ville *</label>
                <input
                  type="text"
                  id="ville"
                  name="ville"
                  value={profile.ville}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="localisation">Localisation *</label>
                <input
                  type="text"
                  id="localisation"
                  name="localisation"
                  value={profile.localisation}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="adresse">Adresse *</label>
              <input
                type="text"
                id="adresse"
                name="adresse"
                value={profile.adresse}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="telephone">Téléphone *</label>
                <input
                  type="tel"
                  id="telephone"
                  name="telephone"
                  value={profile.telephone}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="site_web">Site Web</label>
                <input
                  type="url"
                  id="site_web"
                  name="site_web"
                  value={profile.site_web}
                  onChange={handleInputChange}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={profile.description}
                onChange={handleInputChange}
                rows="5"
                required
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Clock size={18} style={{ marginRight: '0.5rem' }} /> Sauvegarde...
                </>
              ) : (
                <>
                  <Save size={18} style={{ marginRight: '0.5rem' }} /> Enregistrer
                </>
              )}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/recruiter/dashboard')}
            >
              Retour
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
