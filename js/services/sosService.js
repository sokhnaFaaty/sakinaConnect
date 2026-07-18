
import { ENDPOINTS } from "../config/api.js";
import { apiRequest } from "./apiClient.js";
import { createId } from "../utils/id.js";

export async function getSos() {
  return apiRequest(ENDPOINTS.sos, {}, "Impossible de charger les alertes SOS.");
}

// Pour le Guide : uniquement les SOS liés à son groupe (via la liste des pèlerins de ce groupe)
export async function getSosParPelerinIds(pelerinIds) {
  const all = await getSos();
  return all.filter((s) => pelerinIds.includes(s.pelerinId));
}

// Déclenché par le pèlerin — position capturée une seule fois, pas de suivi continu
export async function declencherSos({ pelerinId, guideId, commentaire }) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("La géolocalisation n'est pas disponible sur cet appareil."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const sos = {
            id: createId("sos"),
            pelerinId,
            guideId,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            dateHeure: new Date().toISOString(),
            commentaire: commentaire || "",
            statut: "EN_ATTENTE",
          };
          const created = await apiRequest(
            ENDPOINTS.sos,
            { method: "POST", body: JSON.stringify(sos) },
            "Impossible d'envoyer l'alerte SOS."
          );
          resolve(created);
        } catch (error) {
          reject(error);
        }
      },
      () => reject(new Error("Impossible de récupérer ta position. Vérifie que la géolocalisation est autorisée.")),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

// Marque un SOS comme résolu — Guide ou Admin uniquement (jamais le pèlerin)
export async function marquerSosResolu(id) {
  return apiRequest(
    `${ENDPOINTS.sos}/${id}`,
    { method: "PATCH", body: JSON.stringify({ statut: "RESOLU" }) },
    "Impossible de mettre à jour l'alerte SOS."
  );
}
// Vérifie si ce pèlerin a déjà un SOS en cours (EN_ATTENTE), pour éviter les doublons
export async function getSosActifDuPelerin(pelerinId) {
  const all = await getSos();
  return all.find((s) => s.pelerinId === pelerinId && s.statut === "EN_ATTENTE") || null;
}