import { ENDPOINTS } from "../config/api.js";
import { apiRequest } from "./apiClient.js";
import { createId } from "../utils/id.js";
import { required } from "../utils/validators.js";
import { generateTempPassword } from "../utils/password.js";

// Uniformise la forme d'un guide avant de l'envoyer au serveur
function normalizeGuide(data) {
  return {
    id: data.id,
    utilisateurId: data.utilisateurId,
    disponibilite: Boolean(data.disponibilite),
    isActive: data.isActive !== false,
  };
}

// Guides actifs uniquement (les guides archivés via soft delete sont exclus)
export async function getGuides() {
  const guides = await apiRequest(ENDPOINTS.guides, {}, "Impossible de charger les guides.");
  return guides.filter((g) => g.isActive !== false);
}

// Guides archivés (soft delete) — pour la future page "Liste des Archives"
export async function getGuidesArchives() {
  const guides = await apiRequest(ENDPOINTS.guides, {}, "Impossible de charger les guides archivés.");
  return guides.filter((g) => g.isActive === false);
}

export async function getGuideByUtilisateurId(utilisateurId) {
  const guides = await apiRequest(
    `${ENDPOINTS.guides}?utilisateurId=${utilisateurId}`,
    {},
    "Impossible de charger le profil guide."
  );
  return guides[0] || null;
}

export async function getGroupeDuGuide(id) {
  const groupes = await apiRequest(
    `${ENDPOINTS.groupes}?guideId=${id}`,
    {},
    "Impossible de charger le groupe du guide."
  );
  return groupes[0] || null;
}

/**
 * Crée le compte utilisateur (rôle GUIDE) ET la fiche guide en même temps.
 * @param {Object} data - { nomComplet, email, telephone, disponibilite, photo }
 * @returns {Object} - { guide, motDePasseGenere } pour que l'admin puisse le communiquer
 */
export async function createGuide(data) {
  required(data.nomComplet, "Le nom complet du guide est obligatoire.");
  required(data.email, "L'email du guide est obligatoire.");
  required(data.telephone, "Le téléphone du guide est obligatoire.");

  // 1. Générer un mot de passe temporaire pour le compte du guide
  const motDePasseGenere = generateTempPassword();

  // 2. Créer le compte utilisateur (rôle GUIDE)
  const utilisateurId = createId("user");
  const nouvelUtilisateur = {
    id: utilisateurId,
    nomComplet: String(data.nomComplet).trim(),
    email: String(data.email).trim(),
    telephone: String(data.telephone).trim(),
    motDePasse: motDePasseGenere,
    role: "GUIDE",
    photo: data.photo || "",
    dateCreation: new Date().toISOString().slice(0, 10),
  };

  await apiRequest(
    ENDPOINTS.utilisateurs,
    { method: "POST", body: JSON.stringify(nouvelUtilisateur) },
    "Impossible de créer le compte utilisateur du guide."
  );

  // 3. Créer la fiche guide, liée à ce compte utilisateur
  const guide = normalizeGuide({
    id: createId("gui"),
    utilisateurId,
    disponibilite: data.disponibilite,
    isActive: true,
  });

  const guideCree = await apiRequest(
    ENDPOINTS.guides,
    { method: "POST", body: JSON.stringify(guide) },
    "Impossible de créer le guide."
  );

  return { guide: guideCree, motDePasseGenere };
}

/**
 * Met à jour la fiche guide (disponibilité) ET son compte utilisateur (nom, email, téléphone, photo).
 * @param {string} id - id de la fiche guide
 * @param {Object} data - { utilisateurId, nomComplet, email, telephone, disponibilite, photo }
 */
export async function updateGuide(id, data) {
  // 1. Fiche guide : disponibilité
  await apiRequest(
    `${ENDPOINTS.guides}/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify({ disponibilite: Boolean(data.disponibilite) }),
    },
    "Impossible de modifier le guide."
  );

  // 2. Compte utilisateur lié : nom, email, téléphone, photo
  if (data.utilisateurId) {
    const majUtilisateur = {};
    if (data.nomComplet !== undefined) majUtilisateur.nomComplet = String(data.nomComplet).trim();
    if (data.email !== undefined) majUtilisateur.email = String(data.email).trim();
    if (data.telephone !== undefined) majUtilisateur.telephone = String(data.telephone).trim();
    if (data.photo) majUtilisateur.photo = data.photo;

    if (Object.keys(majUtilisateur).length > 0) {
      await apiRequest(
        `${ENDPOINTS.utilisateurs}/${data.utilisateurId}`,
        { method: "PATCH", body: JSON.stringify(majUtilisateur) },
        "Impossible de modifier le compte du guide."
      );
    }
  }
}

// Soft delete : archive le guide (il pourra être restauré depuis la page Archives)
export async function deleteGuide(id) {
  return apiRequest(
    `${ENDPOINTS.guides}/${id}`,
    { method: "PATCH", body: JSON.stringify({ isActive: false }) },
    "Impossible d'archiver le guide."
  );
}

// Restaure un guide précédemment archivé
export async function restoreGuide(id) {
  return apiRequest(
    `${ENDPOINTS.guides}/${id}`,
    { method: "PATCH", body: JSON.stringify({ isActive: true }) },
    "Impossible de restaurer le guide."
  );
}
