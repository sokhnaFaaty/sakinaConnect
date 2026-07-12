import { showToast } from "./components/toast.js";
import { ROLES, HOME_PAGE_BY_ROLE } from "./config/roles.js";
import { isAuthenticated, getUserRole } from "./utils/auth.js";

const routes = {
accueil: renderAccueilPage,
  login: renderLoginPage,

};
const PUBLIC_PAGES = ["accueil", "login"];

// Chaque page déclare la liste des rôles autorisés
const ROUTE_PERMISSIONS = {
  utilisateurs: [ROLES.ADMIN],
  groupes: [ROLES.ADMIN, ROLES.GUIDE],
  planning: [ROLES.ADMIN, ROLES.GUIDE, ROLES.PELERIN],
  suivi: [ROLES.PROCHE],
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

export async function navigate(page = DEFAULT_PAGE, updateUrl = true) {
  const activePage = routes[page] ? page : DEFAULT_PAGE;

  // ── Guard 0 : page publique → accès libre, pas besoin d'être connecté ──
  if (PUBLIC_PAGES.includes(activePage)) {
    if (updateUrl) updatePageUrl(activePage);
    // ... afficher la page (loader + route() + gestion erreur)
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


}
