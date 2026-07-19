import { ENDPOINTS } from "../config/api.js";
import { apiRequest } from "./apiClient.js";
import { createId } from "../utils/id.js";
import { required } from "../utils/validators.js";

// Uniformise la forme d'un groupe avant de l'envoyer au serveur
function normalizeGroupe(data) {
  return {
    id: data.id,
    nom: String(data.nom).trim(),
    guideId: data.guideId,
    hotelMecqueId: data.hotelMecqueId,
    hotelMedineId: data.hotelMedineId,
    dateDepart: data.dateDepart,
    dateRetour: data.dateRetour,
    isActive: data.isActive !== false,
  };
}

export async function getGroupes() {
  const groupes = await apiRequest(ENDPOINTS.groupes, {}, "Impossible de charger les groupes.");
  return groupes.filter((g) => g.isActive !== false);
}

// Groupes archivés (soft delete) — pour la page Archives
export async function getGroupesArchives() {
  const groupes = await apiRequest(ENDPOINTS.groupes, {}, "Impossible de charger les groupes archivés.");
  return groupes.filter((g) => g.isActive === false);
}

export async function createGroupe(data) {
  required(data.nom, "Le nom du groupe est obligatoire.");
  required(data.guideId, "Le guide est obligatoire.");
  required(data.hotelMecqueId, "L'hôtel à la Mecque est obligatoire.");
  required(data.hotelMedineId, "L'hôtel à Médine est obligatoire.");
  required(data.dateDepart, "La date de départ est obligatoire.");
  required(data.dateRetour, "La date de retour est obligatoire.");

  const groupe = normalizeGroupe({
    id: createId("gr"),
    ...data,
  });

  return apiRequest(
    ENDPOINTS.groupes,
    {
      method: "POST",
      body: JSON.stringify(groupe),
    },
    "Impossible de créer le groupe."
  );
}

export async function updateGroupe(id, data) {
  required(data.nom, "Le nom du groupe est obligatoire.");
  required(data.guideId, "Le guide est obligatoire.");
  required(data.hotelMecqueId, "L'hôtel à la Mecque est obligatoire.");
  required(data.hotelMedineId, "L'hôtel à Médine est obligatoire.");
  required(data.dateDepart, "La date de départ est obligatoire.");
  required(data.dateRetour, "La date de retour est obligatoire.");

  return apiRequest(
    `${ENDPOINTS.groupes}/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(normalizeGroupe({ id, ...data })),
    },
    "Impossible de modifier le groupe."
  );
}

// Soft delete : archive le groupe
export async function deleteGroupe(id) {
  return apiRequest(
    `${ENDPOINTS.groupes}/${id}`,
    { method: "PATCH", body: JSON.stringify({ isActive: false }) },
    "Impossible d'archiver le groupe."
  );
}

export async function restoreGroupe(id) {
  return apiRequest(
    `${ENDPOINTS.groupes}/${id}`,
    { method: "PATCH", body: JSON.stringify({ isActive: true }) },
    "Impossible de restaurer le groupe."
  );
}

export async function deleteGroupeDefinitif(id) {
  return apiRequest(
    `${ENDPOINTS.groupes}/${id}`,
    { method: "DELETE" },
    "Impossible de supprimer le groupe."
  );
}

// Compte le nombre de pèlerins dans un groupe donné (pour la colonne "Nb pèlerins")
export async function countPelerinsDuGroupe(id) {
  const pelerins = await apiRequest(
    `${ENDPOINTS.pelerins}?groupeId=${id}`,
    {},
    "Impossible de compter les pèlerins du groupe."
  );
  return pelerins.length;
}
