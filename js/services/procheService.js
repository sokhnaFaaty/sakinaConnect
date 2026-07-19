import { ENDPOINTS } from "../config/api.js";
import { apiRequest } from "./apiClient.js";
import { createId } from "../utils/id.js";
import { required } from "../utils/validators.js";
import { generateTempPassword } from "../utils/password.js";

function normalizeProche(data) {
  return {
    id: data.id,
    utilisateurId: data.utilisateurId,
    pelerinId: data.pelerinId,
    lienParente: String(data.lienParente).trim(),
    isActive: data.isActive !== false,
  };
}

export async function getProches() {
  const proches = await apiRequest(ENDPOINTS.proches, {}, "Impossible de charger les proches.");
  return proches.filter((p) => p.isActive !== false);
}

// Proches archivés (soft delete) — pour la page Archives
export async function getProchesArchives() {
  const proches = await apiRequest(ENDPOINTS.proches, {}, "Impossible de charger les proches archivés.");
  return proches.filter((p) => p.isActive === false);
}

// Retrouve la fiche proche liée au compte utilisateur connecté
export async function getProcheByUtilisateurId(utilisateurId) {
  const proches = await apiRequest(
    `${ENDPOINTS.proches}?utilisateurId=${utilisateurId}`,
    {},
    "Impossible de charger le profil proche."
  );
  return proches[0] || null;
}

/**
 * Crée le compte utilisateur (rôle PROCHE) ET sa fiche proche, liée à un pèlerin
 * @param {Object} data - { nomComplet, telephone, email (facultatif), lienParente, pelerinId }
 * @returns {Object} - { proche, motDePasseGenere } pour que l'admin puisse le communiquer
 */
export async function createProche(data) {
  required(data.nomComplet, "Le nom complet du proche est obligatoire.");
  required(data.telephone, "Le téléphone du proche est obligatoire.");
  required(data.lienParente, "Le lien de parenté est obligatoire.");
  required(data.pelerinId, "Le pèlerin associé est obligatoire.");

  // 1. Générer un mot de passe temporaire
  const motDePasseGenere = generateTempPassword();

  // 2. Créer le compte utilisateur (rôle PROCHE)
  const utilisateurId = createId("user");
  const nouvelUtilisateur = {
    id: utilisateurId,
    nomComplet: String(data.nomComplet).trim(),
    email: data.email ? String(data.email).trim() : "",
    telephone: data.telephone,
    motDePasse: motDePasseGenere,
    role: "PROCHE",
    photo: "",
    dateCreation: new Date().toISOString().slice(0, 10),
    isActive: true,
  };

  await apiRequest(
    ENDPOINTS.utilisateurs,
    { method: "POST", body: JSON.stringify(nouvelUtilisateur) },
    "Impossible de créer le compte utilisateur du proche."
  );

  // 3. Créer la fiche proche, liée au pèlerin
  const proche = normalizeProche({
    id: createId("proc"),
    utilisateurId,
    pelerinId: data.pelerinId,
    lienParente: data.lienParente,
  });

  const procheCree = await apiRequest(
    ENDPOINTS.proches,
    { method: "POST", body: JSON.stringify(proche) },
    "Impossible de créer le proche."
  );

  // On renvoie le mot de passe généré pour que l'admin puisse le donner au proche
  return { proche: procheCree, motDePasseGenere };
}

// Soft delete : archive la fiche proche ET son compte utilisateur lié
export async function deleteProche(id) {
  const proche = await apiRequest(`${ENDPOINTS.proches}/${id}`, {}, "Impossible de charger le proche.");
  await apiRequest(`${ENDPOINTS.proches}/${id}`, { method: "PATCH", body: JSON.stringify({ isActive: false }) }, "Impossible d'archiver le proche.");
  if (proche?.utilisateurId) {
    await apiRequest(`${ENDPOINTS.utilisateurs}/${proche.utilisateurId}`, { method: "PATCH", body: JSON.stringify({ isActive: false }) }, "Impossible d'archiver le compte du proche.");
  }
}

export async function restoreProche(id) {
  const proche = await apiRequest(`${ENDPOINTS.proches}/${id}`, {}, "Impossible de charger le proche.");
  await apiRequest(`${ENDPOINTS.proches}/${id}`, { method: "PATCH", body: JSON.stringify({ isActive: true }) }, "Impossible de restaurer le proche.");
  if (proche?.utilisateurId) {
    await apiRequest(`${ENDPOINTS.utilisateurs}/${proche.utilisateurId}`, { method: "PATCH", body: JSON.stringify({ isActive: true }) }, "Impossible de restaurer le compte du proche.");
  }
}

export async function deleteProcheDefinitif(id) {
  const proche = await apiRequest(`${ENDPOINTS.proches}/${id}`, {}, "Impossible de charger le proche.");
  await apiRequest(`${ENDPOINTS.proches}/${id}`, { method: "DELETE" }, "Impossible de supprimer le proche.");
  if (proche?.utilisateurId) {
    await apiRequest(`${ENDPOINTS.utilisateurs}/${proche.utilisateurId}`, { method: "DELETE" }, "Impossible de supprimer le compte du proche.");
  }
}
