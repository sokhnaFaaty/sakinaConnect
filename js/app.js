import { renderSidebar } from "./components/sideBar.js";
import { renderNavbar, bindNavbar } from "./components/navBar.js";
import { navigate, getCurrentPageFromUrl, setLayoutSync, onHashChange } from "./router.js";
import { initConfirmModal } from "./components/confirmModal.js";
import { isAuthenticated, getUserRole } from "./utils/auth.js";

// Le bouton "Urgence SOS" du sidebar mène au Pôle d'Urgence adapté au rôle
const POLE_URGENCE_BY_ROLE = {
  ADMIN: "pole-urgence",
  GUIDE: "mon-pole-urgence",
  PELERIN: "pole-urgence-pelerin",
};

function mountLayout() {
  document.getElementById("sidebarRoot").innerHTML = renderSidebar();
  document.getElementById("navbarRoot").innerHTML = renderNavbar();
}

// (Re)monte le layout applicatif quand l'utilisateur est connecté, le démonte sinon.
// Appelé à chaque navigation par le router : corrige l'affichage après login
// sans avoir à recharger la page.
function ensureLayout() {
  const main = document.querySelector("main");
  const app = document.getElementById("app");
  const navbarRoot = document.getElementById("navbarRoot");

  if (isAuthenticated()) {
    // Restaure la mise en page applicative (le login/accueil passent en plein écran)
    if (main) main.className = "min-h-screen pt-16 lg:pl-72";
    if (app) app.className = "mx-auto max-w-7xl p-4 sm:p-6 lg:p-8";

    // (Re)monte le layout s'il est absent du DOM. On se base sur la présence réelle
    // et non sur un drapeau : une page publique (accueil/login) vide les roots, donc
    // il faut pouvoir remonter ensuite sans rechargement.
    if (!navbarRoot || navbarRoot.childElementCount === 0) {
      mountLayout();
      bindNavbar();
      const sidebar = initSidebar();
      initNavigation(sidebar);
    }
  } else {
    document.getElementById("sidebarRoot").innerHTML = "";
    if (navbarRoot) navbarRoot.innerHTML = "";
  }
}

function initSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  const toggle = document.getElementById("sidebarToggle");

  if (!sidebar || !overlay || !toggle) return { close: () => {} };

  const close = () => {
    sidebar.classList.add("-translate-x-full");
    overlay.classList.add("hidden");
  };

  toggle.addEventListener("click", () => {
    sidebar.classList.remove("-translate-x-full");
    overlay.classList.remove("hidden");
  });

  overlay.addEventListener("click", close);

  // Bouton "Urgence SOS" : navigue vers le Pôle d'Urgence selon le rôle
  const sosBtn = document.getElementById("sosBtn");
  if (sosBtn) {
    sosBtn.addEventListener("click", async () => {
      const dest = POLE_URGENCE_BY_ROLE[getUserRole()];
      if (!dest) return;
      await navigate(dest);
      if (window.innerWidth < 1024) close();
    });
  }

  return { close };
}

function initNavigation(sidebar) {
  document.querySelectorAll("[data-page]").forEach((button) => {
    button.addEventListener("click", async () => {
      await navigate(button.dataset.page);
      if (window.innerWidth < 1024) sidebar.close();
    });
  });
}

function startApp() {
  // Toujours initialiser la modale de confirmation (utilisée partout)
  initConfirmModal();

  // Le router synchronise le layout à chaque navigation (montage après login,
  // démontage sur les pages publiques) via ce hook.
  setLayoutSync(ensureLayout);

  navigate(getCurrentPageFromUrl(), false);

  // La navigation passe désormais par le hash de l'URL (#/groupes).
  // On réagit à chaque changement de hash (retour navigateur, lien, saisie manuelle).
  window.addEventListener("hashchange", onHashChange);
}

startApp();