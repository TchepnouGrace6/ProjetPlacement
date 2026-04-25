import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";
import Home from "./pages/Home";
import NosOffres from "./pages/NosOffres";
import AdminDashboard from "./pages/admin/AdminDashboard";
import RecruiterDashboard from "./pages/recruiter/RecruiterDashboard";
import RecruiterProfile from "./pages/recruiter/RecruiterProfile";
import AnnoncesList from "./pages/recruiter/AnnoncesList";
import AnnonceForm from "./pages/recruiter/AnnonceForm";
import CandidaturesList from "./pages/recruiter/CandidaturesList";
import CandidatureDetail from "./pages/recruiter/CandidatureDetail";
import FavorisList from "./pages/recruiter/FavorisList";
import ProtectedRoute from "./components/ProtectedRoute";
import OffreDetail from "./pages/OffreDetail";
/*import PostulerForm from "./pages/candidat/PostulerForm";
import CandidatDashboard from "./pages/candidat/CandidatDashboard";*/
import PostulerForm from "./pages/candidat/Postulerform";
import CandidatDashboard from "./pages/candidat/Candidatdashboard";
import Navbar from "./components/Navbar";
import Toast from "./components/Toast";
import FAQ from "./pages/Faq";
 import EntretienIA from "./pages/candidat/EntretienIA";
import Apropos from "./pages/Apropos";
import "bootstrap/dist/css/bootstrap.min.css";
import "./auth.css";
import "./styles/animations.css";

/* ── Routes où la Navbar doit être cachée ── */
const ROUTES_SANS_NAVBAR = [
  "/candidat/dashboard",
  "/candidat/postuler",
  "/candidat/entretien",
  "/admin/dashboard",
  "/recruiter",
  "/connexion",
  "/inscription",
  "/Accueil",
  "/nos-offres",
  "/nos-offres/",
  "/nos-offres/:id",
  "/faq",
  "/apropos",
  "/offre-detail",
  "/offre-detail/:id",
  "/candidat/postuler/:annonceId",
  "/candidat/entretien/:candidatureId",
  "/recruiter/dashboard",
  "/recruiter/profile",
  "/recruiter/annonces",
];

function NavbarConditionnelle() {
  const location = useLocation();
  const cacher = ROUTES_SANS_NAVBAR.some(r => location.pathname.startsWith(r));
  if (cacher) return null;
  return <Navbar />;
}

/* ── Guard candidat ── */
function CandidatRoute({ children }) {
  const token = localStorage.getItem("access_token");
  const role  = localStorage.getItem("role");
  if (!token) return <Navigate to="/connexion" />;
  if (role !== "candidat") return <Navigate to="/" />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <NavbarConditionnelle />
      <Toast />
      <Routes>
        {/* ── Pages publiques ── */}
        <Route path="/"            element={<Navigate to="/Accueil" />} />
        <Route path="/Accueil"     element={<Home />} />
        <Route path="/nos-offres"  element={<NosOffres />} />
        <Route path="/nos-offres/:id" element={<OffreDetail />} />
        <Route path="/faq"         element={<FAQ />} />
        <Route path="/apropos"     element={<Apropos />} />

        {/* ── Auth ── */}
        <Route path="/connexion"   element={<Login />} />
        <Route path="/inscription" element={<Register />} />

        {/* ── Espace Candidat ── */}
        <Route path="/candidat/dashboard" element={
          <CandidatRoute><CandidatDashboard /></CandidatRoute>
        } />
        <Route path="/candidat/postuler/:annonceId" element={
          <CandidatRoute><PostulerForm /></CandidatRoute>
        } />

        {/* ── Admin ── */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>
        } />

        {/* ── Recruteur ── */}
        <Route path="/recruiter/dashboard"         element={<RecruiterDashboard />} />
        <Route path="/recruiter/profile"           element={<RecruiterProfile />} />
        <Route path="/recruiter/annonces"          element={<AnnoncesList />} />
        <Route path="/recruiter/annonces/create"   element={<AnnonceForm />} />
        <Route path="/recruiter/annonces/:id"      element={<AnnonceForm />} />
        <Route path="/recruiter/annonces/:id/edit" element={<AnnonceForm />} />
        <Route path="/recruiter/candidatures"      element={<CandidaturesList />} />
        <Route path="/recruiter/candidatures/:id"  element={<CandidatureDetail />} />
        <Route path="/recruiter/favoris"           element={<FavorisList />} />
        <Route path="/candidat/entretien/:candidatureId" element={<CandidatRoute><EntretienIA /></CandidatRoute>} />
      </Routes>
    </BrowserRouter>
  );
}