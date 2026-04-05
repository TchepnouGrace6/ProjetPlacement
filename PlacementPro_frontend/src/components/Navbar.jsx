import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { BarChart3, Building2, Users, Star, LogOut } from 'lucide-react';
import { getRole, deconnexion } from '../api/auth';
import '../styles/navbar.css';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const userRole = getRole();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleDeconnexion = () => {
    deconnexion();
    navigate('/connexion');
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path);

  if (!userRole) {
    return null;
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* LOGO */}
        <Link to="/Accueil" className="navbar-logo">
          🚀 PlacementPro
        </Link>

        {/* HAMBURGER */}
        <div
          className={`hamburger ${mobileMenuOpen ? 'active' : ''}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>

        {/* MENU */}
        <ul className={`nav-menu ${mobileMenuOpen ? 'active' : ''}`}>
          {/* CANDIDAT */}
          {userRole === 'candidat' && (
            <>
              <li className="nav-item">
                <Link
                  to="/Accueil"
                  className={`nav-link ${isActive('/Accueil') ? 'active' : ''}`}
                >
                  Accueil
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/annonces" className="nav-link">
                  Annonces
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/mes-candidatures" className="nav-link">
                  Mes Candidatures
                </Link>
              </li>
            </>
          )}

          {/* RECRUTEUR */}
          {userRole === 'recruteur' && (
            <>
              <li className="nav-item">
                <Link
                  to="/recruiter/dashboard"
                  className={`nav-link ${isActive('/recruiter/dashboard') ? 'active' : ''}`}
                >
                  <BarChart3 size={18} style={{ marginRight: '0.5rem' }} /> Dashboard
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  to="/recruiter/profile"
                  className={`nav-link ${isActive('/recruiter/profile') ? 'active' : ''}`}
                >
                  <Building2 size={18} style={{ marginRight: '0.5rem' }} /> Profil Entreprise
                </Link>
              </li>
              <li className="nav-item dropdown">
                <span className="nav-link dropdown-toggle">
                  📋 Annonces
                </span>
                <div className="dropdown-menu">
                  <Link to="/recruiter/annonces" className="dropdown-item">
                    Mes Annonces
                  </Link>
                  <Link to="/recruiter/annonces/create" className="dropdown-item">
                    Créer Annonce
                  </Link>
                </div>
              </li>
              <li className="nav-item">
                <Link
                  to="/recruiter/candidatures"
                  className={`nav-link ${isActive('/recruiter/candidatures') ? 'active' : ''}`}
                >
                  <Users size={18} style={{ marginRight: '0.5rem' }} /> Candidatures
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  to="/recruiter/favoris"
                  className={`nav-link ${isActive('/recruiter/favoris') ? 'active' : ''}`}
                >
                  <Star size={18} style={{ marginRight: '0.5rem' }} /> Favoris
                </Link>
              </li>
            </>
          )}

          {/* ADMIN */}
          {userRole === 'admin' && (
            <>
              <li className="nav-item">
                <Link
                  to="/admin/dashboard"
                  className={`nav-link ${isActive('/admin/dashboard') ? 'active' : ''}`}
                >
                  🛡️ Admin
                </Link>
              </li>
            </>
          )}

          {/* DÉCONNEXION */}
          <li className="nav-item">
            <button
              onClick={handleDeconnexion}
              className="nav-link logout-btn"
            >
              <LogOut size={18} style={{ marginRight: '0.5rem' }} /> Déconnexion
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}
