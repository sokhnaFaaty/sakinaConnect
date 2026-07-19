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
    isActive: data.isActive !== false,
  };
}

export async function getPelerins() {
  const pelerins = await apiRequest(ENDPOINTS.pelerins, {}, "Impossible de charger les pèlerins.");
  return pelerins.filter((p) => p.isActive !== false);
}

// Pèlerins archivés (soft delete) — pour la page Archives
export async function getPelerinsArchives() {
  const pelerins = await apiRequest(ENDPOINTS.pelerins, {}, "Impossible de charger les pèlerins archivés.");
  return pelerins.filter((p) => p.isActive === false);
}

// Récupère uniquement les pèlerins actifs d'un groupe donné (utile pour "Mon groupe" côté Guide)
export async function getPelerinsDuGroupe(groupeId) {
  const pelerins = await apiRequest(
    `${ENDPOINTS.pelerins}?groupeId=${groupeId}`,
    {},
    "Impossible de charger les pèlerins du groupe."
  );
  return pelerins.filter((p) => p.isActive !== false);
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
    email: data.email ? String(data.email).trim() : "",
    telephone: data.telephone ? String(data.telephone).trim() : "",
    motDePasse: motDePasseGenere,
    role: "PELERIN",
    photo: data.photo || "",
    dateCreation: new Date().toISOString().slice(0, 10),
    isActive: true,
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

// Soft delete : archive la fiche pèlerin ET son compte utilisateur lié
export async function deletePelerin(id) {
  const pelerin = await apiRequest(`${ENDPOINTS.pelerins}/${id}`, {}, "Impossible de charger le pèlerin.");
  await apiRequest(`${ENDPOINTS.pelerins}/${id}`, { method: "PATCH", body: JSON.stringify({ isActive: false }) }, "Impossible d'archiver le pèlerin.");
  if (pelerin?.utilisateurId) {
    await apiRequest(`${ENDPOINTS.utilisateurs}/${pelerin.utilisateurId}`, { method: "PATCH", body: JSON.stringify({ isActive: false }) }, "Impossible d'archiver le compte du pèlerin.");
  }
}

// Restaure la fiche pèlerin et réactive son compte
export async function restorePelerin(id) {
  const pelerin = await apiRequest(`${ENDPOINTS.pelerins}/${id}`, {}, "Impossible de charger le pèlerin.");
  await apiRequest(`${ENDPOINTS.pelerins}/${id}`, { method: "PATCH", body: JSON.stringify({ isActive: true }) }, "Impossible de restaurer le pèlerin.");
  if (pelerin?.utilisateurId) {
    await apiRequest(`${ENDPOINTS.utilisateurs}/${pelerin.utilisateurId}`, { method: "PATCH", body: JSON.stringify({ isActive: true }) }, "Impossible de restaurer le compte du pèlerin.");
  }
}

// Suppression définitive : vrai DELETE de la fiche et du compte lié
export async function deletePelerinDefinitif(id) {
  const pelerin = await apiRequest(`${ENDPOINTS.pelerins}/${id}`, {}, "Impossible de charger le pèlerin.");
  await apiRequest(`${ENDPOINTS.pelerins}/${id}`, { method: "DELETE" }, "Impossible de supprimer le pèlerin.");
  if (pelerin?.utilisateurId) {
    await apiRequest(`${ENDPOINTS.utilisateurs}/${pelerin.utilisateurId}`, { method: "DELETE" }, "Impossible de supprimer le compte du pèlerin.");
  }
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
