import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getRole } from '../api/auth';

/**
 * Composant ProtectedRoute
 * Protège les routes en vérifiant le rôle de l'utilisateur
 */
export default function ProtectedRoute({ children, requiredRole = null }) {
  const location = useLocation();
  const userRole = getRole();

  // Vérifier si l'utilisateur est authentifié
  if (!userRole) {
    return <Navigate to="/connexion" state={{ from: location }} replace />;
  }

  // Vérifier si le rôle est autorisé
  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/Accueil" replace />;
  }

  return children;
}
