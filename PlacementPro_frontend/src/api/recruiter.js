import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api/auth';

// Helper pour obtenir le token
const getAuthHeaders = () => ({
    headers: {
        'Authorization': `Bearer ${localStorage.getItem('access')}`,
        'Content-Type': 'application/json'
    }
});

const getMultipartHeaders = () => ({
    headers: {
        'Authorization': `Bearer ${localStorage.getItem('access')}`,
        'Content-Type': 'multipart/form-data'
    }
});

// ========== ANNONCES ==========

export const getAnnonces = (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.secteur) params.append('secteur', filters.secteur);
    if (filters.localisation) params.append('localisation', filters.localisation);
    if (filters.type_contrat) params.append('type_contrat', filters.type_contrat);
    
    return axios.get(
        `${API_URL}/annonces/?${params.toString()}`,
        { headers: { 'Content-Type': 'application/json' } }
    );
};

export const getAnnonceDetail = (annonceId) => {
    return axios.get(`${API_URL}/annonces/${annonceId}/`);
};

export const getMesAnnonces = () => {
    return axios.get(`${API_URL}/recruteur/annonces/`, getAuthHeaders());
};

export const creerAnnonce = (data) => {
    return axios.post(`${API_URL}/recruteur/annonces/`, data, getAuthHeaders());
};

export const getAnnonceRecruteur = (annonceId) => {
    return axios.get(`${API_URL}/recruteur/annonces/${annonceId}/`, getAuthHeaders());
};

export const modifierAnnonce = (annonceId, data) => {
    return axios.put(
        `${API_URL}/recruteur/annonces/${annonceId}/`,
        data,
        getAuthHeaders()
    );
};

export const supprimerAnnonce = (annonceId) => {
    return axios.delete(`${API_URL}/recruteur/annonces/${annonceId}/`, getAuthHeaders());
};

// ========== PROFIL RECRUTEUR ==========

export const getRecruteurProfile = () => {
    return axios.get(`${API_URL}/recruteur/profile/`, getAuthHeaders());
};

export const updateRecruteurProfile = (data) => {
    const formData = new FormData();
    
    // Ajouter tous les champs
    for (const key in data) {
        if (data[key] !== null && data[key] !== undefined) {
            formData.append(key, data[key]);
        }
    }
    
    return axios.put(
        `${API_URL}/recruteur/profile/`,
        formData,
        {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access')}`,
                'Content-Type': 'multipart/form-data'
            }
        }
    );
};

// ========== CANDIDATURES ==========

export const soumettreCandidate = (annonceId, data) => {
    return axios.post(
        `${API_URL}/annonces/${annonceId}/candidater/`,
        data,
        getAuthHeaders()
    );
};

export const getMesCandidatures = (annonceId = null) => {
    const url = annonceId
        ? `${API_URL}/recruteur/candidatures/${annonceId}/`
        : `${API_URL}/recruteur/candidatures/`;
    return axios.get(url, getAuthHeaders());
};

export const getCandidatureDetail = (candidatureId) => {
    return axios.get(
        `${API_URL}/candidatures/${candidatureId}/`,
        getAuthHeaders()
    );
};

export const mettreAJourCandidature = (candidatureId, data) => {
    return axios.put(
        `${API_URL}/candidatures/${candidatureId}/`,
        data,
        getAuthHeaders()
    );
};

// ========== FAVORIS ==========

export const getMesFavoris = () => {
    return axios.get(`${API_URL}/recruteur/favoris/`, getAuthHeaders());
};

export const ajouterFavori = (candidatId, raison = '') => {
    return axios.post(
        `${API_URL}/recruteur/favoris/`,
        { candidat: candidatId, raison },
        getAuthHeaders()
    );
};

export const getFavoriDetail = (favoriId) => {
    return axios.get(
        `${API_URL}/recruteur/favoris/${favoriId}/`,
        getAuthHeaders()
    );
};

export const modifierFavori = (favoriId, raison) => {
    return axios.put(
        `${API_URL}/recruteur/favoris/${favoriId}/`,
        { raison },
        getAuthHeaders()
    );
};

export const supprimerFavori = (favoriId) => {
    return axios.delete(
        `${API_URL}/recruteur/favoris/${favoriId}/`,
        getAuthHeaders()
    );
};
