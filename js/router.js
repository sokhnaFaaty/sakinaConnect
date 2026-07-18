import { showToast } from "./components/toast.js";
import { ROLES, HOME_PAGE_BY_ROLE } from "./config/roles.js";
import { isAuthenticated, getUserRole } from "./utils/auth.js";

import { renderAccueilPage } from "./pages/accueilPage.js";
import { renderLoginPage } from "./pages/loginPage.js";
import { renderMonGroupePage } from "./pages/monGroupePage.js";
import { renderGroupesPage } from "./pages/groupesPage.js";
import { renderPelerinsPage } from "./pages/pelerinsPage.js";
import { renderPoleUrgencePelerinPage } from "./pages/poleUrgencePelerinPage.js";
import { renderPoleUrgencePage } from "./pages/poleUrgencePage.js";
import { renderDashboardPelerinPage } from "./pages/dashboardPelerinPage.js";
import { renderMonPoleUrgencePage } from "./pages/monPoleUrgencePage.js";
import { renderItinerairePage } from "./pages/itinerairePage.js";

const routes = {
  accueil: renderAccueilPage,
  login: renderLoginPage,
  groupes: renderGroupesPage,
  pelerins: renderPelerinsPage,
  "mon-groupe": renderMonGroupePage,
   "dashboard-pelerin": renderDashboardPelerinPage,
  "pole-urgence": renderPoleUrgencePage,
    "mon-pole-urgence": renderMonPoleUrgencePage, 
    "pole-urgence-pelerin": renderPoleUrgencePelerinPage,
      "itineraire": renderItinerairePage,

};

const PUBLIC_PAGES = ["accueil", "login"];

const ROUTE_PERMISSIONS = {
  groupes: [ROLES.ADMIN],
  pelerins: [ROLES.ADMIN],
  "mon-groupe": [ROLES.GUIDE],
  "dashboard-pelerin": [ROLES.PELERIN],
  "pole-urgence": [ROLES.ADMIN],
  "mon-pole-urgence": [ROLES.GUIDE],
    "pole-urgence-pelerin": [ROLES.PELERIN],
      "itineraire": [ROLES.GUIDE,ROLES.ADMIN],



};

function canAccess(page, role) {
  const allowedRoles = ROUTE_PERMISSIONS[page];
  return !allowedRoles || allowedRoles.includes(role);
}

const DEFAULT_PAGE = "accueil";

export function getCurrentPageFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const page = params.get("page");
  return routes[page] ? page : DEFAULT_PAGE;
}

function updatePageUrl(page) {
  const url = new URL(window.location.href);
  url.searchParams.set("page", page);
  history.pushState(null, "", url);
}

async function afficherPage(activePage) {
  const app = document.getElementById("app");
  const route = routes[activePage];

  app.innerHTML = `
    <div class="grid min-h-[50vh] place-items-center rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-sm">
      <div>
        <div class="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"></div>
        <p class="mt-4 text-sm font-bold text-slate-500">Chargement...</p>
      </div>
    </div>
  `;
document.querySelectorAll("[data-page]").forEach((button) => {
  const isActive = button.dataset.page === activePage;
  button.dataset.active = isActive ? "true" : "false";
});
  try {
    await route();
  } catch (error) {
    app.innerHTML = `
      <section class="rounded-[2rem] border border-rose-200 bg-white p-8 shadow-sm">
        <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
          <i class="fa-solid fa-triangle-exclamation"></i>
        </div>
        <h1 class="text-2xl font-black tracking-tight text-slate-950">Erreur de chargement</h1>
        <p class="mt-2 text-sm leading-6 text-slate-600">${error.message}</p>
      </section>
    `;
    showToast(error.message, "error");
  }
}

export async function navigate(page = DEFAULT_PAGE, updateUrl = true) {
  const activePage = routes[page] ? page : DEFAULT_PAGE;

  if (PUBLIC_PAGES.includes(activePage)) {
    if (updateUrl) updatePageUrl(activePage);
    await afficherPage(activePage);
    return;
  }

  if (!isAuthenticated()) {
    await navigate("login", true);
    return;
  }

  const role = getUserRole();

  if (!canAccess(activePage, role)) {
    showToast("Accès refusé.", "error");
    await navigate(HOME_PAGE_BY_ROLE[role], true);
    return;
  }

  if (updateUrl) {
    updatePageUrl(activePage);
  }

  await afficherPage(activePage);
}