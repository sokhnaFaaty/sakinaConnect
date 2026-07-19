// services/utilisateurService.js
import { ENDPOINTS } from "../config/api.js";
import { apiRequest } from "./apiClient.js";

export async function getUtilisateurs() {
  return apiRequest(ENDPOINTS.utilisateurs, {}, "Impossible de charger les utilisateurs.");
}

export async function getUtilisateurById(id) {
  return apiRequest(`${ENDPOINTS.utilisateurs}/${id}`, {}, "Impossible de charger cet utilisateur.");
}

// Met à jour un compte utilisateur (self-service depuis "Mon profil", ou admin).
// `data` ne contient que les champs à modifier (email, telephone, photo, motDePasse, nomComplet...).
export async function updateUtilisateur(id, data) {
  return apiRequest(
    `${ENDPOINTS.utilisateurs}/${id}`,
    { method: "PATCH", body: JSON.stringify(data) },
    "Impossible de mettre à jour le compte."
  );
}