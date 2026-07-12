// services/utilisateurService.js
import { ENDPOINTS } from "../config/api.js";
import { apiRequest } from "./apiClient.js";

export async function getUtilisateurs() {
  return apiRequest(ENDPOINTS.utilisateurs, {}, "Impossible de charger les utilisateurs.");
}

export async function getUtilisateurById(id) {
  return apiRequest(`${ENDPOINTS.utilisateurs}/${id}`, {}, "Impossible de charger cet utilisateur.");
}