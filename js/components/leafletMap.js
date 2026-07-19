
let carteActuelle = null; // Garde une référence à la carte actuellement affichée
let marqueurActuel = null; // Garde une référence au point actuellement affiché sur la carte

// Crée une carte Leaflet dans l'élément HTML dont l'id est donné
// latitude/longitude : où centrer la carte au départ
export function creerCarte(containerId, latitude, longitude, zoom = 15) {
  // Si une carte existait déjà dans ce conteneur, on la détruit avant d'en recréer une
  // (évite l'erreur "map container is already initialized" de Leaflet)
  if (carteActuelle) {
    carteActuelle.remove();
    carteActuelle = null;
  }

  carteActuelle = L.map(containerId).setView([latitude, longitude], zoom);

  // Ajoute le fond de carte OpenStreetMap (gratuit, pas de clé API nécessaire)
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(carteActuelle);

  marqueurActuel = L.marker([latitude, longitude]).addTo(carteActuelle);

  return carteActuelle;
}

// Déplace la carte existante vers un nouveau lieu, sans la recréer entièrement
export function centrerCarteSur(latitude, longitude, titre = "") {
  if (!carteActuelle) return;

  carteActuelle.setView([latitude, longitude], 15);

  if (marqueurActuel) {
    marqueurActuel.remove();
  }
  marqueurActuel = L.marker([latitude, longitude]).addTo(carteActuelle);

  if (titre) {
    marqueurActuel.bindPopup(titre).openPopup();
  }
}
// creerCarte() : dessine une carte pour la première fois, centrée sur un point, avec un marqueur (l'épingle rouge classique)
// centrerCarteSur() : quand on clique sur une autre étape, on ne recrée pas toute la carte (ça clignoterait), 
// on déplace juste la vue et on change le marqueur de place