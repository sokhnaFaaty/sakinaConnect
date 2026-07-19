import { ENDPOINTS } from "../config/api.js";
import { apiRequest } from "./apiClient.js";

export async function getHotels() {
  return apiRequest(ENDPOINTS.hotels, {}, "Impossible de charger les hôtels.");
}