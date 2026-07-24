// services/notificationService.js
// Agrège les notifications d'un utilisateur (SOS + annonces) selon son rôle.
// Aucune nouvelle collection en base : tout est calculé depuis `sos` et `annonces`.
import { getSos } from "./sosService.js";
import { getAnnoncesVisibles } from "./annonceService.js";
import { getPelerins, getPelerinsDuGroupe } from "./pelerinService.js";
import { getUtilisateurs } from "./utilisateurService.js";
import { getGuideByUtilisateurId, getGroupeDuGuide } from "./guideService.js";
import { getProcheByUtilisateurId } from "./procheService.js";

// Page du Pôle d'Urgence selon le rôle (où mène une notification SOS)
const POLE_PAR_ROLE = {
  ADMIN: "pole-urgence",
  GUIDE: "mon-pole-urgence",
  PROCHE: "suivi-familial",
};

/**
 * Renvoie la liste des notifications pour l'utilisateur connecté.
 * @returns {Array} items { id, type, icon, titre, sous, date, urgent, page }
 */
export async function getNotifications(user, role) {
  const items = [];

  // 1) Annonces récentes — filtrées selon le groupe du lecteur
  //    (communiqués globaux de l'admin + communiqués de son propre groupe)
  try {
    const annonces = await getAnnoncesVisibles(user, role); // déjà triées du plus récent au plus ancien
    annonces.slice(0, 10).forEach((a) => {
      items.push({
        id: "an-" + a.id,
        type: "annonce",
        icon: "fa-bullhorn",
        titre: a.titre,
        sous: a.contenu,
        date: a.datePublication,
        urgent: !!a.urgence,
        page: "annonces",
      });
    });
  } catch { /* pas d'annonces disponibles */ }

  // 2) SOS EN_ATTENTE — dépend du rôle
  let sosPertinents = [];
  try {
    if (role === "ADMIN") {
      const sos = await getSos();
      sosPertinents = sos.filter((s) => s.statut === "EN_ATTENTE");
    } else if (role === "GUIDE") {
      const guide = await getGuideByUtilisateurId(user.id);
      const groupe = guide ? await getGroupeDuGuide(guide.id) : null;
      if (groupe) {
        const pels = await getPelerinsDuGroupe(groupe.id);
        const ids = new Set(pels.map((p) => p.id));
        const sos = await getSos();
        sosPertinents = sos.filter((s) => s.statut === "EN_ATTENTE" && ids.has(s.pelerinId));
      }
    } else if (role === "PROCHE") {
      const proche = await getProcheByUtilisateurId(user.id);
      if (proche) {
        const sos = await getSos();
        sosPertinents = sos.filter((s) => s.statut === "EN_ATTENTE" && s.pelerinId === proche.pelerinId);
      }
    }
    // PELERIN : pas de notification SOS (il voit son alerte sur sa propre page)
  } catch { /* pas de SOS accessibles */ }

  if (sosPertinents.length) {
    const [pelerins, utilisateurs] = await Promise.all([getPelerins(), getUtilisateurs()]);
    const um = Object.fromEntries(utilisateurs.map((u) => [u.id, u]));
    const pm = Object.fromEntries(pelerins.map((p) => [p.id, p]));
    const nomPelerin = (pid) => um[pm[pid]?.utilisateurId]?.nomComplet || "Pèlerin";
    sosPertinents.forEach((s) => {
      items.push({
        id: "sos-" + s.id,
        type: "sos",
        icon: "fa-triangle-exclamation",
        titre: "Alerte SOS : " + nomPelerin(s.pelerinId),
        sous: s.commentaire || "Position transmise",
        date: s.dateHeure,
        urgent: true,
        page: POLE_PAR_ROLE[role] || "annonces",
      });
    });
  }

  // Tri : le plus récent en premier
  items.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  return items;
}

// ---- Gestion du "lu / non lu" (mémorisé par utilisateur dans localStorage) ----
const KEY = (uid) => `notif:lastSeen:${uid}`;

export function getLastSeen(uid) {
  try { return localStorage.getItem(KEY(uid)); } catch { return null; }
}

export function markSeen(uid) {
  try { localStorage.setItem(KEY(uid), new Date().toISOString()); } catch { /* ignore */ }
}

// Nombre de notifications plus récentes que la dernière ouverture de la cloche
export function countUnseen(items, uid) {
  const last = getLastSeen(uid);
  if (!last) return items.length;
  return items.filter((i) => String(i.date) > last).length;
}
