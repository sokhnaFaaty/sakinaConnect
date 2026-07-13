// services/planningService.js
import { ENDPOINTS } from "../config/api.js";
import { apiRequest } from "./apiClient.js";

// Récupère les événements du planning pour un groupe donné, triés par date/heure
export async function getPlanningDuGroupe(groupeId) {
  const planning = await apiRequest(
    `${ENDPOINTS.planning}?groupeId=${groupeId}`,
    {},
    "Impossible de charger le planning du groupe."
  );
  return planning.sort((a, b) => `${a.date}${a.heure}`.localeCompare(`${b.date}${b.heure}`));
}