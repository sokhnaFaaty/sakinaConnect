// services/cloudinaryService.js
import { CLOUDINARY_CONFIG, CLOUDINARY_UPLOAD_URL } from "../config/cloudinary.js";

// Envoie la photo de profil d'un utilisateur vers Cloudinary
// et renvoie l'URL de l'image hébergée
export async function uploadUserPhoto(file) {
  if (!file) return null;

  // 1. Vérifier que c'est bien une image
  if (!file.type.startsWith("image/")) {
    throw new Error("Le fichier sélectionné doit être une image.");
  }

  // 2. Vérifier la taille (2 Mo max)
  const maxSize = 2 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error("L'image ne doit pas dépasser 2 Mo.");
  }

  // 3. Préparer les données à envoyer (Cloudinary attend un FormData)
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);

  // 4. Envoyer la requête à Cloudinary
  const response = await fetch(CLOUDINARY_UPLOAD_URL, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || "Erreur lors de l'envoi de la photo.");
  }

  // 5. Renvoyer l'URL utilisable dans le champ "photo" de l'utilisateur
  return {
    photoUrl: data.secure_url,
    photoPublicId: data.public_id,
  };
}