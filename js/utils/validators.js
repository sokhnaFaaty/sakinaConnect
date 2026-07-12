// utils/validators.js

export function required(value, message) {
  if (!String(value ?? "").trim()) {
    throw new Error(message);
  }
}

// Vérifie l'email du formulaire de connexion
// Retourne un message d'erreur (texte) si invalide, ou null si tout va bien
export function validateLoginEmail(email) {
  if (!email || !email.trim()) {
    return "L'email est obligatoire.";
  }
  return null;
}

// Vérifie le mot de passe du formulaire de connexion
export function validateLoginPassword(password) {
  if (!password) {
    return "Le mot de passe est obligatoire.";
  }
  return null;
}