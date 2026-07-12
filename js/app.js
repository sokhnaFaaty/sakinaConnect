import { renderSidebar } from "./components/sideBar.js";
import { renderNavbar } from "./components/navBar.js";
import { navigate, getCurrentPageFromUrl } from "./router.js";
import { initConfirmModal } from "./components/confirmModal.js";
import { isAuthenticated } from "./utils/auth.js";
import { logout } from "./services/authService.js";

function mountLayout() {
  document.getElementById("sidebarRoot").innerHTML = renderSidebar();
  document.getElementById("navbarRoot").innerHTML = renderNavbar();
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

  // Le layout (sidebar/navbar) ne se monte que si quelqu'un est connecté
  // Sinon, accueilPage.js et loginPage.js gèrent leur propre affichage plein écran
  if (isAuthenticated()) {
    mountLayout();

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) logoutBtn.addEventListener("click", logout);

    const sidebar = initSidebar();
    initNavigation(sidebar);
  }

  navigate(getCurrentPageFromUrl(), false);

  window.addEventListener("popstate", () => {
    navigate(getCurrentPageFromUrl(), false);
  });
}

startApp();