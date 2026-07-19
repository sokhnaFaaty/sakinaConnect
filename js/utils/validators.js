// utils/validators.js

export function required(value, message) {
  if (!String(value ?? "").trim()) {
    throw new Error(message);
  }
}

// Valide le format d'un email. Retourne un message d'erreur ou null.
export function validateEmailFormat(email) {
  const value = String(email ?? "").trim();
  if (!value) return "L'email est obligatoire.";
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(value) ? null : "L'email n'est pas valide.";
}

// Valide un numéro de téléphone du Sénégal (SN) ou d'Arabie Saoudite / Makka (KSA).
// Ramène aux 9 derniers chiffres (tolère espaces et indicatif +221 / +966, et le 0 local KSA).
//   SN  : 9 chiffres, préfixes mobiles 70, 75, 76, 77, 78.
//   KSA : 9 chiffres, mobile commençant par 5 (ex. 05x local -> 5xxxxxxxx).
export function validateTelephone(telephone) {
  let value = String(telephone ?? "").replace(/\D/g, "");
  if (!value) return "Le téléphone est obligatoire.";
  if (value.length > 9) value = value.slice(-9); // retire un éventuel indicatif (221 / 966) ou 0 local
  if (!/^\d{9}$/.test(value)) return "Le téléphone doit contenir 9 chiffres.";
  const estSN = /^(70|75|76|77|78)/.test(value);
  const estKSA = /^5/.test(value);
  if (!estSN && !estKSA) {
    return "Numéro invalide (Sénégal : 70/75/76/77/78 — Arabie Saoudite : 5X).";
  }
  return null;
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