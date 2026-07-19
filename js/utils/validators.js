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

// Valide un numéro de téléphone sénégalais.
// 9 chiffres, préfixes mobiles autorisés : 70, 75, 76, 77, 78.
// Tolère les espaces et un indicatif +221 / 221 en préfixe.
export function validateTelephoneSN(telephone) {
  let value = String(telephone ?? "").replace(/\D/g, "");
  if (!value) return "Le téléphone est obligatoire.";
  if (value.length > 9) value = value.slice(-9); // retire un éventuel indicatif 221
  if (!/^\d{9}$/.test(value)) return "Le téléphone doit contenir 9 chiffres (ex: 77 123 45 67).";
  if (!/^(70|75|76|77|78)/.test(value)) return "Opérateur non autorisé (70, 75, 76, 77, 78).";
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