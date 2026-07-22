import { ENDPOINTS } from "../config/api.js";
import { apiRequest } from "./apiClient.js";
import { createId } from "../utils/id.js";

export async function getHotels() {
  return apiRequest(ENDPOINTS.hotels, {}, "Impossible de charger les hôtels.");
}

// Crée un hôtel (ville = "La Mecque" ou "Médine").
export async function createHotel(data) {
  const hotel = {
    id: createId("hot"),
    nom: String(data.nom || "").trim(),
    ville: data.ville,
    adresse: String(data.adresse || "").trim(),
    telephone: String(data.telephone || "").trim(),
    nombreEtoiles: Number(data.nombreEtoiles) || 5,
  };
  return apiRequest(
    ENDPOINTS.hotels,
    { method: "POST", body: JSON.stringify(hotel) },
    "Impossible d'ajouter l'hôtel."
  );
}