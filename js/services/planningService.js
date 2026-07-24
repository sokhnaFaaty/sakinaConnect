import { ENDPOINTS } from "../config/api.js";
import { apiRequest } from "./apiClient.js";
import { createId } from "../utils/id.js";
import { required } from "../utils/validators.js";

// Statuts de modération d'un événement (mêmes valeurs que pour les annonces)
export const STATUT_EVENEMENT = {
  EN_ATTENTE: "EN_ATTENTE",
  APPROUVE: "APPROUVE",
  REJETE: "REJETE",
};

// Statut effectif : les événements créés avant la modération sont considérés
// comme déjà approuvés (rétro-compatibilité).
export function statutEvenement(e) {
  return e.statut || STATUT_EVENEMENT.APPROUVE;
}

/**
 * Ne conserve que les événements visibles par le lecteur :
 * - ADMIN : tout ;
 * - l'auteur (guide) : ses propres événements quel que soit leur statut ;
 * - les autres (pèlerin…) : uniquement les événements approuvés.
 */
export function filtrerPlanningVisible(events, { role, userId }) {
  if (role === "ADMIN") return events;
  return events.filter((e) => {
    if (e.auteurId && e.auteurId === userId) return true;
    return statutEvenement(e) === STATUT_EVENEMENT.APPROUVE;
  });
}

export async function getPlanningDuGroupe(groupeId) {
  const planning = await apiRequest(
    `${ENDPOINTS.planning}?groupeId=${groupeId}`,
    {},
    "Impossible de charger le planning du groupe."
  );
  return planning.sort((a, b) => `${a.date}${a.heure}`.localeCompare(`${b.date}${b.heure}`));
}

// Événements en attente de validation — pour la page admin « À valider »
export async function getPlanningEnAttente() {
  const planning = await apiRequest(ENDPOINTS.planning, {}, "Impossible de charger le planning.");
  return planning
    .filter((e) => statutEvenement(e) === STATUT_EVENEMENT.EN_ATTENTE)
    .sort((a, b) => `${a.date}${a.heure}`.localeCompare(`${b.date}${b.heure}`));
}

export async function createPlanningEvent(data) {
  required(data.titre, "Le titre de l'événement est obligatoire.");
  required(data.date, "La date est obligatoire.");
  required(data.heure, "L'heure est obligatoire.");
  required(data.lieu, "Le lieu est obligatoire.");
  required(data.categorieId, "La catégorie est obligatoire.");
  required(data.groupeId, "Le groupe est obligatoire.");

  const evenement = {
    id: createId("pl"),
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
    auteurId: data.auteurId || null,
    statut: data.statut || STATUT_EVENEMENT.APPROUVE,
    motifRejet: "",
  };

  return apiRequest(
    ENDPOINTS.planning,
    { method: "POST", body: JSON.stringify(evenement) },
    "Impossible de créer l'événement."
  );
}

export async function updatePlanningEvent(id, data) {
  required(data.titre, "Le titre de l'événement est obligatoire.");
  required(data.date, "La date est obligatoire.");
  required(data.heure, "L'heure est obligatoire.");
  required(data.lieu, "Le lieu est obligatoire.");
  required(data.categorieId, "La catégorie est obligatoire.");

  const payload = {
    titre: data.titre,
    description: data.description || "",
    date: data.date,
    heure: data.heure,
    lieu: data.lieu,
    categorieId: data.categorieId,
    latitude: data.latitude || null,
    longitude: data.longitude || null,
    etapeGuide: data.etapeGuide || "",
  };
  // Re-soumission par le guide : l'événement modifié repasse « en attente ».
  if (data.statut !== undefined) payload.statut = data.statut;
  if (data.motifRejet !== undefined) payload.motifRejet = data.motifRejet || "";

  return apiRequest(
    `${ENDPOINTS.planning}/${id}`,
    { method: "PATCH", body: JSON.stringify(payload) },
    "Impossible de modifier l'événement."
  );
}

// Validation admin : approuve un événement (efface un éventuel motif de rejet)
export async function approuverPlanningEvent(id) {
  return apiRequest(
    `${ENDPOINTS.planning}/${id}`,
    { method: "PATCH", body: JSON.stringify({ statut: STATUT_EVENEMENT.APPROUVE, motifRejet: "" }) },
    "Impossible d'approuver l'événement."
  );
}

// Validation admin : rejette un événement avec un motif (affiché au guide auteur)
export async function rejeterPlanningEvent(id, motif) {
  required(motif, "Le motif de rejet est obligatoire.");
  return apiRequest(
    `${ENDPOINTS.planning}/${id}`,
    { method: "PATCH", body: JSON.stringify({ statut: STATUT_EVENEMENT.REJETE, motifRejet: String(motif).trim() }) },
    "Impossible de rejeter l'événement."
  );
}

export async function deletePlanningEvent(id) {
  return apiRequest(
    `${ENDPOINTS.planning}/${id}`,
    { method: "DELETE" },
    "Impossible de supprimer l'événement."
  );
}