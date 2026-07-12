import { ENDPOINTS } from "../config/api.js";
import { apiRequest } from "./apiClient.js";
import { createId } from "../utils/id.js";
import { required } from "../utils/validators.js";

// Uniformise la forme d'un groupe avant de l'envoyer au serveur
function normalizeGroupe(data) {
  return {
    idGroupe: data.idGroupe,
    nom: String(data.nom).trim(),
    guideId: data.guideId,
    hotelMecqueId: data.hotelMecqueId,
    hotelMedineId: data.hotelMedineId,
    dateDepart: data.dateDepart,
    dateRetour: data.dateRetour,
  };
}

export async function getGroupes() {
  return apiRequest(ENDPOINTS.groupes, {}, "Impossible de charger les groupes.");
}

export async function createGroupe(data) {
  required(data.nom, "Le nom du groupe est obligatoire.");
  required(data.guideId, "Le guide est obligatoire.");
  required(data.hotelMecqueId, "L'hôtel à la Mecque est obligatoire.");
  required(data.hotelMedineId, "L'hôtel à Médine est obligatoire.");
  required(data.dateDepart, "La date de départ est obligatoire.");
  required(data.dateRetour, "La date de retour est obligatoire.");

  const groupe = normalizeGroupe({
    idGroupe: createId("gr"),
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

export async function updateGroupe(idGroupe, data) {
  required(data.nom, "Le nom du groupe est obligatoire.");
  required(data.guideId, "Le guide est obligatoire.");
  required(data.hotelMecqueId, "L'hôtel à la Mecque est obligatoire.");
  required(data.hotelMedineId, "L'hôtel à Médine est obligatoire.");
  required(data.dateDepart, "La date de départ est obligatoire.");
  required(data.dateRetour, "La date de retour est obligatoire.");

  return apiRequest(
    `${ENDPOINTS.groupes}/${idGroupe}`,
    {
      method: "PATCH",
      body: JSON.stringify(normalizeGroupe({ idGroupe, ...data })),
    },
    "Impossible de modifier le groupe."
  );
}

export async function deleteGroupe(idGroupe) {
  return apiRequest(
    `${ENDPOINTS.groupes}/${idGroupe}`,
    { method: "DELETE" },
    "Impossible de supprimer le groupe."
  );
}

// Compte le nombre de pèlerins dans un groupe donné (pour la colonne "Nb pèlerins")
export async function countPelerinsDuGroupe(idGroupe) {
  const pelerins = await apiRequest(
    `${ENDPOINTS.pelerins}?groupeId=${idGroupe}`,
    {},
    "Impossible de compter les pèlerins du groupe."
  );
  return pelerins.length;
}
