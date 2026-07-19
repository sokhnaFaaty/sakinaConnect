import { ENDPOINTS } from "../config/api.js";
import { apiRequest } from "./apiClient.js";

/**
 * Vérifications d'unicité côté front, en attendant la migration vers MySQL.
 * En base MySQL, ces règles seront des contraintes UNIQUE sur :
 *   utilisateurs.email, utilisateurs.telephone, pelerins.numeroPasseport.
 * Ces fonctions permettent de refuser un doublon avant l'appel de création/màj.
 */

function normalizeEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}

// Ramène un téléphone à ses 9 derniers chiffres (ignore espaces et indicatif 221)
function normalizeTelephone(value) {
  return String(value ?? "").replace(/\D/g, "").slice(-9);
}

function normalizePasseport(value) {
  return String(value ?? "").trim().toUpperCase();
}

async function getUtilisateurs() {
  return apiRequest(ENDPOINTS.utilisateurs, {}, "Impossible de vérifier l'unicité.");
}

// L'email est-il déjà utilisé par un autre compte ? excludeUserId = compte à ignorer (édition)
export async function emailExiste(email, excludeUserId = null) {
  const cible = normalizeEmail(email);
  if (!cible) return false;
  const utilisateurs = await getUtilisateurs();
  return utilisateurs.some((u) => u.id !== excludeUserId && normalizeEmail(u.email) === cible);
}

// Le téléphone est-il déjà utilisé par un autre compte ?
export async function telephoneExiste(telephone, excludeUserId = null) {
  const cible = normalizeTelephone(telephone);
  if (!cible) return false;
  const utilisateurs = await getUtilisateurs();
  return utilisateurs.some((u) => u.id !== excludeUserId && normalizeTelephone(u.telephone) === cible);
}

// Le numéro de passeport est-il déjà utilisé par un autre pèlerin ?
export async function passeportExiste(numeroPasseport, excludePelerinId = null) {
  const cible = normalizePasseport(numeroPasseport);
  if (!cible) return false;
  const pelerins = await apiRequest(ENDPOINTS.pelerins, {}, "Impossible de vérifier l'unicité du passeport.");
  return pelerins.some((p) => p.id !== excludePelerinId && normalizePasseport(p.numeroPasseport) === cible);
}
