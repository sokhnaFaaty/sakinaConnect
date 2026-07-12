import { ENDPOINTS } from "../config/api.js";
import { apiRequest } from "./apiClient.js";

export async function getGuides() {
  return apiRequest(ENDPOINTS.guides, {}, "Impossible de charger les guides.");
}

export async function getGuideByUtilisateurId(utilisateurId) {
  const guides = await apiRequest(
    `${ENDPOINTS.guides}?utilisateurId=${utilisateurId}`,
    {},
    "Impossible de charger le profil guide."
  );
  return guides[0] || null;
}

export async function getGroupeDuGuide(idGuide) {
  const groupes = await apiRequest(
    `${ENDPOINTS.groupes}?guideId=${idGuide}`,
    {},
    "Impossible de charger le groupe du guide."
  );
  return groupes[0] || null;
}
