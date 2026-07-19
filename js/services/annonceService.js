import { ENDPOINTS } from "../config/api.js";
import { apiRequest } from "./apiClient.js";
import { createId } from "../utils/id.js";
import { required } from "../utils/validators.js";

// Uniformise la forme d'une annonce (communiqué) avant envoi au serveur
function normalizeAnnonce(data) {
  return {
    id: data.id,
    titre: String(data.titre).trim(),
    contenu: String(data.contenu).trim(),
    urgence: Boolean(data.urgence),
    datePublication: data.datePublication,
    auteurId: data.auteurId || null,
    groupeId: data.groupeId || null,
  };
}

// Toutes les annonces, triées du plus récent au plus ancien
export async function getAnnonces() {
  const annonces = await apiRequest(ENDPOINTS.annonces, {}, "Impossible de charger les communiqués.");
  return annonces.sort((a, b) => String(b.datePublication).localeCompare(String(a.datePublication)));
}

/**
 * Publie un communiqué.
 * @param {Object} data - { titre, contenu, urgence, auteurId, groupeId }
 *   auteurId = utilisateur connecté (admin ou guide) ; groupeId null = communiqué global.
 */
export async function createAnnonce(data) {
  required(data.titre, "Le titre du communiqué est obligatoire.");
  required(data.contenu, "Le contenu du message est obligatoire.");

  const annonce = normalizeAnnonce({
    id: createId("an"),
    titre: data.titre,
    contenu: data.contenu,
    urgence: data.urgence,
    datePublication: new Date().toISOString(),
    auteurId: data.auteurId || null,
    groupeId: data.groupeId || null,
  });

  return apiRequest(
    ENDPOINTS.annonces,
    { method: "POST", body: JSON.stringify(annonce) },
    "Impossible de publier le communiqué."
  );
}

export async function deleteAnnonce(id) {
  return apiRequest(
    `${ENDPOINTS.annonces}/${id}`,
    { method: "DELETE" },
    "Impossible de supprimer le communiqué."
  );
}
