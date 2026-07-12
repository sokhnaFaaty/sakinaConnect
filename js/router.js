import { showToast } from "./components/toast.js";
import { ROLES, HOME_PAGE_BY_ROLE } from "./config/roles.js";
import { isAuthenticated, getUserRole } from "./utils/auth.js";

import { renderAccueilPage } from "./pages/accueilPage.js";
import { renderLoginPage } from "./pages/loginPage.js";
import { renderMonGroupePage } from "./pages/monGroupePage.js";
import { renderGroupesPage } from "./pages/groupePage.js";
import { renderPelerinsPage } from "./pages/pelerinsPage.js";

const routes = {
  accueil: renderAccueilPage,
  login: renderLoginPage,
  groupes: renderGroupesPage,
  pelerins: renderPelerinsPage,
  "mon-groupe": renderMonGroupePage,
};

const PUBLIC_PAGES = ["accueil", "login"];

// Chaque page déclare la liste des rôles autorisés
const ROUTE_PERMISSIONS = {
  groupes: [ROLES.ADMIN],
  pelerins: [ROLES.ADMIN],
  "mon-groupe": [ROLES.GUIDE],
};

function canAccess(page, role) {
  const allowedRoles = ROUTE_PERMISSIONS[page];
  return !allowedRoles || allowedRoles.includes(role); // pas de restriction = accès libre
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

// Affiche le loader, appelle la page, gère les erreurs
// (factorisé ici pour ne pas dupliquer ce bloc dans chaque cas de navigate())
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
        <p class="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          Vérifie que JSON Server est bien lancé avec :
          <strong class="font-black text-slate-950">npx json-server db.json --port 3000</strong>
        </p>
      </section>
    `;
    showToast(error.message, "error");
  }
}

export async function navigate(page = DEFAULT_PAGE, updateUrl = true) {
  const activePage = routes[page] ? page : DEFAULT_PAGE;

  // ── Guard 0 : page publique → accès libre, pas besoin d'être connecté ──
  if (PUBLIC_PAGES.includes(activePage)) {
    if (updateUrl) updatePageUrl(activePage);
    await afficherPage(activePage);
    return;
  }

  // ── Guard 1 : page privée + non authentifié → renvoi vers login ──
  if (!isAuthenticated()) {
    await navigate("login", true);
    return;
  }

  const role = getUserRole();

  // ── Guard 2 : rôle sans accès à cette page → redirection vers SON tableau de bord ──
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