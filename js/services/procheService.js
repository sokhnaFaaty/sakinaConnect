import { ENDPOINTS } from "../config/api.js";
import { apiRequest } from "./apiClient.js";
import { createId } from "../utils/id.js";
import { required } from "../utils/validators.js";
import { generateTempPassword } from "../utils/password.js";

function normalizeProche(data) {
  return {
    idProche: data.idProche,
    utilisateurId: data.utilisateurId,
    pelerinId: data.pelerinId,
    lienParente: String(data.lienParente).trim(),
  };
}

export async function getProches() {
  return apiRequest(ENDPOINTS.proches, {}, "Impossible de charger les proches.");
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
  };

  await apiRequest(
    ENDPOINTS.utilisateurs,
    { method: "POST", body: JSON.stringify(nouvelUtilisateur) },
    "Impossible de créer le compte utilisateur du proche."
  );

  // 3. Créer la fiche proche, liée au pèlerin
  const proche = normalizeProche({
    idProche: createId("proc"),
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

export async function deleteProche(idProche) {
  return apiRequest(
    `${ENDPOINTS.proches}/${idProche}`,
    { method: "DELETE" },
    "Impossible de supprimer le proche."
  );
}
