import { ENDPOINTS } from "../config/api.js";
import { apiRequest } from "./apiClient.js";

export async function getCategories() {
  return apiRequest(ENDPOINTS.categories, {}, "Impossible de charger les catégories.");
}
