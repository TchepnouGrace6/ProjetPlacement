import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api/auth';

export const inscriptionCandidat = (data) => {
    return axios.post(`${API_URL}/inscription/candidat/`, data);
};

export const inscriptionRecruteur = (data) => {
    return axios.post(`${API_URL}/inscription/recruteur/`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};

export const connexion = (data) => {
    return axios.post(`${API_URL}/connexion/`, data);
};

export const sauvegarderToken = (access, refresh, role, email) => {
    localStorage.setItem('access_token', access);   // ✅ corrigé
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('role', role);
    localStorage.setItem('email', email);
};

export const getToken = () => {
    const token = localStorage.getItem('access_token'); // ✅ corrigé
    if (!token || token === 'null' || token === 'undefined') return null;
    return token;
};
export const getRole = () => localStorage.getItem('role');

export const deconnexion = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
};