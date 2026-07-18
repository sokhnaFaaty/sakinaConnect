import { ENDPOINTS } from "../config/api.js";
import { apiRequest } from "./apiClient.js";
import { createId } from "../utils/id.js";
import { required } from "../utils/validators.js";

export async function getPlanningDuGroupe(groupeId) {
  const planning = await apiRequest(
    `${ENDPOINTS.planning}?groupeId=${groupeId}`,
    {},
    "Impossible de charger le planning du groupe."
  );
  return planning.sort((a, b) => `${a.date}${a.heure}`.localeCompare(`${b.date}${b.heure}`));
}

export async function createPlanningEvent(data) {
  required(data.titre, "Le titre de l'événement est obligatoire.");
  required(data.date, "La date est obligatoire.");
  required(data.heure, "L'heure est obligatoire.");
  required(data.lieu, "Le lieu est obligatoire.");
  required(data.categorieId, "La catégorie est obligatoire.");
  required(data.groupeId, "Le groupe est obligatoire.");

  const evenement = {
    idPlanning: createId("pl"),
    titre: data.titre,
    description: data.description || "",
    date: data.date,
    heure: data.heure,
    lieu: data.lieu,
    categorieId: data.categorieId,
    groupeId: data.groupeId,
    latitude: data.latitude || null,
    longitude: data.longitude || null,
    etapeGuide: data.etapeGuide || "",
  };

  return apiRequest(
    ENDPOINTS.planning,
    { method: "POST", body: JSON.stringify(evenement) },
    "Impossible de créer l'événement."
  );
}

export async function updatePlanningEvent(idPlanning, data) {
  required(data.titre, "Le titre de l'événement est obligatoire.");
  required(data.date, "La date est obligatoire.");
  required(data.heure, "L'heure est obligatoire.");
  required(data.lieu, "Le lieu est obligatoire.");
  required(data.categorieId, "La catégorie est obligatoire.");

  return apiRequest(
    `${ENDPOINTS.planning}/${idPlanning}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        titre: data.titre,
        description: data.description || "",
        date: data.date,
        heure: data.heure,
        lieu: data.lieu,
        categorieId: data.categorieId,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        etapeGuide: data.etapeGuide || "",
      }),
    },
    "Impossible de modifier l'événement."
  );
}

export async function deletePlanningEvent(idPlanning) {
  return apiRequest(
    `${ENDPOINTS.planning}/${idPlanning}`,
    { method: "DELETE" },
    "Impossible de supprimer l'événement."
  );
}