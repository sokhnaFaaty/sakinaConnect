// services/authService.js
import { ENDPOINTS } from "../config/api.js";
import { saveSession, clearSession } from "../utils/auth.js";

export async function login(email, password) {
  if (!email || !password) {
    throw new Error("Email et mot de passe obligatoires.");
  }

  const response = await fetch(`${ENDPOINTS.utilisateurs}?email=${encodeURIComponent(email)}`);

  if (!response.ok) {
    throw new Error("Erreur lors de la connexion. Vérifie que le serveur est démarré.");
  }

  const utilisateurs = await response.json();

  if (utilisateurs.length === 0) {
    throw new Error("Email ou mot de passe incorrect.");
  }

  const utilisateur = utilisateurs[0];

  if (utilisateur.motDePasse !== password) {
    throw new Error("Email ou mot de passe incorrect.");
  }

  const { motDePasse: _mdp, ...userSafe } = utilisateur;

  saveSession(userSafe);

  return userSafe;
}

export function logout() {
  clearSession();
  window.location.href = window.location.pathname;
}