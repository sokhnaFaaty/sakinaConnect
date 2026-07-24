import { ENDPOINTS } from "../config/api.js";
import { apiRequest } from "./apiClient.js";
import { createId } from "../utils/id.js";
import { required } from "../utils/validators.js";
import { getGuideByUtilisateurId, getGroupeDuGuide } from "./guideService.js";
import { getPelerins, getPelerinByUtilisateurId } from "./pelerinService.js";
import { getProcheByUtilisateurId } from "./procheService.js";

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
 * Résout l'id du groupe auquel appartient l'utilisateur connecté (ou null s'il n'en a pas).
 * GUIDE -> son groupe assigné ; PELERIN -> son groupe ; PROCHE -> le groupe de son pèlerin.
 */
export async function getGroupeIdDuLecteur(user, role) {
  if (role === "GUIDE") {
    const guide = await getGuideByUtilisateurId(user.id);
    const groupe = guide ? await getGroupeDuGuide(guide.id) : null;
    return groupe?.id || null;
  }
  if (role === "PELERIN") {
    const pelerin = await getPelerinByUtilisateurId(user.id);
    return pelerin?.groupeId || null;
  }
  if (role === "PROCHE") {
    const proche = await getProcheByUtilisateurId(user.id);
    if (!proche) return null;
    const pelerins = await getPelerins();
    const pelerin = pelerins.find((p) => p.id === proche.pelerinId);
    return pelerin?.groupeId || null;
  }
  return null;
}

/**
 * Annonces visibles par l'utilisateur connecté :
 * - ADMIN : toutes les annonces ;
 * - autres rôles : les communiqués globaux (groupeId null, publiés par l'admin)
 *   + ceux adressés à leur propre groupe.
 */
export async function getAnnoncesVisibles(user, role) {
  const annonces = await getAnnonces();
  if (role === "ADMIN") return annonces;
  const groupeId = await getGroupeIdDuLecteur(user, role);
  return annonces.filter((a) => !a.groupeId || a.groupeId === groupeId);
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
