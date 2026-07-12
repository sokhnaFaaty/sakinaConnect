import { ENDPOINTS } from "../config/api.js";
import { apiRequest } from "./apiClient.js";

export async function getGuides() {
  return apiRequest(ENDPOINTS.guides, {}, "Impossible de charger les guides.");
}