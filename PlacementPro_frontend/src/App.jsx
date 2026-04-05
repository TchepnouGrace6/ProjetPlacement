/*import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <section id="center">
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>
        <div>
          <h1>Get started</h1>
          <p>
            Edit <code>src/App.jsx</code> and save to test <code>HMR</code>
          </p>
        </div>
        <button
          className="counter"
          onClick={() => setCount((count) => count + 1)}
        >
          Count is {count}
        </button>
      </section>

      <div className="ticks"></div>

      <section id="next-steps">
        <div id="docs">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#documentation-icon"></use>
          </svg>
          <h2>Documentation</h2>
          <p>Your questions, answered</p>
          <ul>
            <li>
              <a href="https://vite.dev/" target="_blank">
                <img className="logo" src={viteLogo} alt="" />
                Explore Vite
              </a>
            </li>
            <li>
              <a href="https://react.dev/" target="_blank">
                <img className="button-icon" src={reactLogo} alt="" />
                Learn more
              </a>
            </li>
          </ul>
        </div>
        <div id="social">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#social-icon"></use>
          </svg>
          <h2>Connect with us</h2>
          <p>Join the Vite community</p>
          <ul>
            <li>
              <a href="https://github.com/vitejs/vite" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#github-icon"></use>
                </svg>
                GitHub
              </a>
            </li>
            <li>
              <a href="https://chat.vite.dev/" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#discord-icon"></use>
                </svg>
                Discord
              </a>
            </li>
            <li>
              <a href="https://x.com/vite_js" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#x-icon"></use>
                </svg>
                X.com
              </a>
            </li>
            <li>
              <a href="https://bsky.app/profile/vite.dev" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#bluesky-icon"></use>
                </svg>
                Bluesky
              </a>
            </li>
          </ul>
        </div>
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  )
}*/


import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Register from "./pages/auth/Register";
import Login from "./pages/auth/Login";
import Home from "./pages/Home";
import AdminDashboard from "./pages/admin/AdminDashboard";
import RecruiterDashboard from "./pages/recruiter/RecruiterDashboard";
import RecruiterProfile from "./pages/recruiter/RecruiterProfile";
import AnnoncesList from "./pages/recruiter/AnnoncesList";
import AnnonceForm from "./pages/recruiter/AnnonceForm";
import CandidaturesList from "./pages/recruiter/CandidaturesList";
import CandidatureDetail from "./pages/recruiter/CandidatureDetail";
import FavorisList from "./pages/recruiter/FavorisList";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Toast from "./components/Toast";
import "bootstrap/dist/css/bootstrap.min.css";
import "./auth.css";
import "./styles/animations.css";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Toast />
      <Routes>
        <Route path="/" element={<Navigate to="/Accueil" />} />
        <Route path="/inscription" element={<Register />} />
        <Route path="/connexion" element={<Login />} />
        <Route path="/Accueil" element={<Home />} />
        
        {/* ADMIN ROUTES */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        
        {/* RECRUITER ROUTES - TEMPORARY WITHOUT AUTH FOR TESTING */}
        <Route
          path="/recruiter/dashboard"
          element={<RecruiterDashboard />}
        />
        <Route
          path="/recruiter/profile"
          element={<RecruiterProfile />}
        />
        <Route
          path="/recruiter/annonces"
          element={<AnnoncesList />}
        />
        <Route
          path="/recruiter/annonces/create"
          element={<AnnonceForm />}
        />
        <Route
          path="/recruiter/annonces/:id"
          element={<AnnonceForm />}
        />
        <Route
          path="/recruiter/annonces/:id/edit"
          element={<AnnonceForm />}
        />
        <Route
          path="/recruiter/candidatures"
          element={<CandidaturesList />}
        />
        <Route
          path="/recruiter/candidatures/:id"
          element={<CandidatureDetail />}
        />
        <Route
          path="/recruiter/favoris"
          element={<FavorisList />}
        />
      </Routes>
    </BrowserRouter>
  );
}
