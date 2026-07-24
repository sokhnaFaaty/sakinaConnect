import { ENDPOINTS } from "../config/api.js";
import { apiRequest } from "./apiClient.js";
import { createId } from "../utils/id.js";
import { required } from "../utils/validators.js";
import { getGuideByUtilisateurId, getGroupeDuGuide } from "./guideService.js";
import { getPelerins, getPelerinByUtilisateurId } from "./pelerinService.js";
import { getProcheByUtilisateurId } from "./procheService.js";

// Statuts de modération d'une annonce (idem pour un événement d'itinéraire)
export const STATUT_ANNONCE = {
  EN_ATTENTE: "EN_ATTENTE",
  APPROUVE: "APPROUVE",
  REJETE: "REJETE",
};

// Statut effectif : les annonces créées avant la modération n'ont pas de champ
// `statut` — on les considère alors comme déjà approuvées (rétro-compatibilité).
export function statutAnnonce(a) {
  return a.statut || STATUT_ANNONCE.APPROUVE;
}

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
    statut: data.statut || STATUT_ANNONCE.APPROUVE,
    motifRejet: data.motifRejet || "",
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
  return annonces.filter((a) => {
    // L'auteur (ex : le guide) voit toujours ses propres communiqués,
    // même en attente de validation ou rejetés (pour en connaître l'état).
    if (a.auteurId && a.auteurId === user.id) return true;
    // Les autres lecteurs : uniquement les communiqués approuvés,
    // globaux (admin) ou adressés à leur propre groupe.
    if (statutAnnonce(a) !== STATUT_ANNONCE.APPROUVE) return false;
    return !a.groupeId || a.groupeId === groupeId;
  });
}

// Communiqués en attente de validation — pour la page admin « À valider »
export async function getAnnoncesEnAttente() {
  const annonces = await getAnnonces();
  return annonces.filter((a) => statutAnnonce(a) === STATUT_ANNONCE.EN_ATTENTE);
}

/**
 * Publie un communiqué.
 * @param {Object} data - { titre, contenu, urgence, auteurId, groupeId, statut }
 *   auteurId = utilisateur connecté (admin ou guide) ; groupeId null = communiqué global.
 *   statut = APPROUVE (admin, publié directement) ou EN_ATTENTE (guide, à valider).
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
    statut: data.statut || STATUT_ANNONCE.APPROUVE,
  });

  return apiRequest(
    ENDPOINTS.annonces,
    { method: "POST", body: JSON.stringify(annonce) },
    "Impossible de publier le communiqué."
  );
}

/**
 * Met à jour un communiqué existant (édition admin, ou re-soumission par le guide).
 * @param {Object} data - { titre, contenu, urgence, groupeId?, statut?, motifRejet? }
 */
export async function updateAnnonce(id, data) {
  required(data.titre, "Le titre du communiqué est obligatoire.");
  required(data.contenu, "Le contenu du message est obligatoire.");

  const payload = {
    titre: String(data.titre).trim(),
    contenu: String(data.contenu).trim(),
    urgence: Boolean(data.urgence),
  };
  if (data.groupeId !== undefined) payload.groupeId = data.groupeId || null;
  if (data.statut !== undefined) payload.statut = data.statut;
  if (data.motifRejet !== undefined) payload.motifRejet = data.motifRejet || "";

  return apiRequest(
    `${ENDPOINTS.annonces}/${id}`,
    { method: "PATCH", body: JSON.stringify(payload) },
    "Impossible de modifier le communiqué."
  );
}

// Validation admin : approuve un communiqué (efface un éventuel motif de rejet)
export async function approuverAnnonce(id) {
  return apiRequest(
    `${ENDPOINTS.annonces}/${id}`,
    { method: "PATCH", body: JSON.stringify({ statut: STATUT_ANNONCE.APPROUVE, motifRejet: "" }) },
    "Impossible d'approuver le communiqué."
  );
}

// Validation admin : rejette un communiqué avec un motif (affiché au guide auteur)
export async function rejeterAnnonce(id, motif) {
  required(motif, "Le motif de rejet est obligatoire.");
  return apiRequest(
    `${ENDPOINTS.annonces}/${id}`,
    { method: "PATCH", body: JSON.stringify({ statut: STATUT_ANNONCE.REJETE, motifRejet: String(motif).trim() }) },
    "Impossible de rejeter le communiqué."
  );
}

export async function deleteAnnonce(id) {
  return apiRequest(
    `${ENDPOINTS.annonces}/${id}`,
    { method: "DELETE" },
    "Impossible de supprimer le communiqué."
  );
}
