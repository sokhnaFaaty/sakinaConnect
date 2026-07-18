import { ENDPOINTS } from "../config/api.js";
import { apiRequest } from "./apiClient.js";
import { createId } from "../utils/id.js";
import { required } from "../utils/validators.js";
import { generateTempPassword } from "../utils/password.js";

// Uniformise la forme d'un pèlerin avant de l'envoyer au serveur
function normalizePelerin(data) {
  return {
    id: data.id,
    utilisateurId: data.utilisateurId,
    numeroPasseport: String(data.numeroPasseport).trim(),
    statutVisa: data.statutVisa,
    certificatVaccin: Boolean(data.certificatVaccin),
    informationsMedicales: data.informationsMedicales || "",
    contactUrgenceNom: String(data.contactUrgenceNom).trim(),
    contactUrgenceTelephone: String(data.contactUrgenceTelephone).trim(),
    groupeId: data.groupeId || null,
  };
}

export async function getPelerins() {
  return apiRequest(ENDPOINTS.pelerins, {}, "Impossible de charger les pèlerins.");
}

// Récupère uniquement les pèlerins d'un groupe donné (utile pour "Mon groupe" côté Guide)
export async function getPelerinsDuGroupe(groupeId) {
  return apiRequest(
    `${ENDPOINTS.pelerins}?groupeId=${groupeId}`,
    {},
    "Impossible de charger les pèlerins du groupe."
  );
}

/**
 * Crée le compte utilisateur (rôle PELERIN) ET la fiche pèlerin en même temps
 * @param {Object} data - { nomComplet, numeroPasseport, statutVisa, groupeId, informationsMedicales, contactUrgenceNom, contactUrgenceTelephone }
 * @returns {Object} - le pèlerin créé (avec id, utilisateurId, etc.)
 */
export async function createPelerin(data) {
  required(data.nomComplet, "Le nom complet du pèlerin est obligatoire.");
  required(data.numeroPasseport, "Le numéro de passeport est obligatoire.");
  required(data.statutVisa, "Le statut du visa est obligatoire.");
  required(data.groupeId, "Le groupe est obligatoire.");
  required(data.contactUrgenceNom, "Le nom du contact d'urgence est obligatoire.");
  required(data.contactUrgenceTelephone, "Le téléphone du contact d'urgence est obligatoire.");

  // 1. Générer un mot de passe temporaire pour le compte du pèlerin
  const motDePasseGenere = generateTempPassword();

  // 2. Créer le compte utilisateur (rôle PELERIN)
  const utilisateurId = createId("user");
  const nouvelUtilisateur = {
    id: utilisateurId,
    nomComplet: String(data.nomComplet).trim(),
    email: "",
    telephone: "",
    motDePasse: motDePasseGenere,
    role: "PELERIN",
    photo: "",
    dateCreation: new Date().toISOString().slice(0, 10),
  };

  await apiRequest(
    ENDPOINTS.utilisateurs,
    { method: "POST", body: JSON.stringify(nouvelUtilisateur) },
    "Impossible de créer le compte utilisateur du pèlerin."
  );

  // 3. Créer la fiche pèlerin, liée à ce compte utilisateur
  const pelerin = normalizePelerin({
    id: createId("pel"),
    utilisateurId,
    ...data,
  });

  const pelerinCree = await apiRequest(
    ENDPOINTS.pelerins,
    { method: "POST", body: JSON.stringify(pelerin) },
    "Impossible de créer le pèlerin."
  );

  // On renvoie aussi le mot de passe généré pour que l'admin puisse le communiquer
  return { ...pelerinCree, motDePasseGenere };
}

export async function updatePelerin(id, data) {
  required(data.numeroPasseport, "Le numéro de passeport est obligatoire.");
  required(data.statutVisa, "Le statut du visa est obligatoire.");
  required(data.contactUrgenceNom, "Le nom du contact d'urgence est obligatoire.");
  required(data.contactUrgenceTelephone, "Le téléphone du contact d'urgence est obligatoire.");

  return apiRequest(
    `${ENDPOINTS.pelerins}/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        numeroPasseport: String(data.numeroPasseport).trim(),
        statutVisa: data.statutVisa,
        informationsMedicales: data.informationsMedicales || "",
        contactUrgenceNom: String(data.contactUrgenceNom).trim(),
        contactUrgenceTelephone: String(data.contactUrgenceTelephone).trim(),
        groupeId: data.groupeId || null,
      }),
    },
    "Impossible de modifier le pèlerin."
  );
}

export async function deletePelerin(id) {
  return apiRequest(
    `${ENDPOINTS.pelerins}/${id}`,
    { method: "DELETE" },
    "Impossible de supprimer le pèlerin."
  );
}

// Affecte (ou retire) un pèlerin à un groupe précis, depuis la fiche du groupe
export async function affecterPelerinAuGroupe(id, groupeId) {
  return apiRequest(
    `${ENDPOINTS.pelerins}/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify({ groupeId }),
    },
    "Impossible d'affecter le pèlerin au groupe."
  );
}
// Retrouve la fiche pèlerin liée au compte utilisateur connecté
export async function getPelerinByUtilisateurId(utilisateurId) {
  const pelerins = await apiRequest(
    `${ENDPOINTS.pelerins}?utilisateurId=${utilisateurId}`,
    {},
    "Impossible de charger le profil pèlerin."
  );
  return pelerins[0] || null;
}
