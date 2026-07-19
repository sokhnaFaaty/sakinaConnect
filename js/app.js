import { renderSidebar } from "./components/sideBar.js";
import { renderNavbar } from "./components/navBar.js";
import { navigate, getCurrentPageFromUrl, setLayoutSync } from "./router.js";
import { initConfirmModal } from "./components/confirmModal.js";
import { isAuthenticated } from "./utils/auth.js";
import { logout } from "./services/authService.js";

let layoutMounted = false;

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

  if (isAuthenticated()) {
    // Restaure la mise en page applicative (le login passe main/#app en plein écran)
    if (main) main.className = "min-h-screen pt-16 lg:pl-72";
    if (app) app.className = "mx-auto max-w-7xl p-4 sm:p-6 lg:p-8";

    if (!layoutMounted) {
      mountLayout();
      const logoutBtn = document.getElementById("logoutBtn");
      if (logoutBtn) logoutBtn.addEventListener("click", logout);
      const sidebar = initSidebar();
      initNavigation(sidebar);
      layoutMounted = true;
    }
  } else if (layoutMounted) {
    document.getElementById("sidebarRoot").innerHTML = "";
    document.getElementById("navbarRoot").innerHTML = "";
    layoutMounted = false;
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

  window.addEventListener("popstate", () => {
    navigate(getCurrentPageFromUrl(), false);
  });
}

startApp();