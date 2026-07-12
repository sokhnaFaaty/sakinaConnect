import { getUserRole, getSession } from "../utils/auth.js";

const NAV_LINKS_BY_ROLE = {
  ADMIN: [
    { page: "groupes", label: "Groupes", icon: "fa-people-group" },
    { page: "pelerins", label: "Pèlerins", icon: "fa-users" },
  ],
  GUIDE: [
    { page: "mon-groupe", label: "Mon groupe", icon: "fa-users" },
  ],
  PELERIN: [],
  PROCHE: [],
};

export function renderSidebar() {
  const role = getUserRole();
  const user = getSession();
  const links = NAV_LINKS_BY_ROLE[role] || [];

  const items = links.map((link) => `
    <button class="nav-link flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950" data-page="${link.page}">
      <i class="fa-solid ${link.icon} w-5 text-center"></i>
      <span>${link.label}</span>
    </button>
  `).join("");

  return `
    <aside id="sidebar" class="fixed inset-y-0 left-0 z-40 w-72 -translate-x-full border-r border-slate-200 bg-white transition-transform duration-300 lg:translate-x-0">
      <div class="flex items-center gap-3 px-5 py-5">
        <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#333D2A] to-[#BC7B3B] text-white shadow-lg">
          <i class="fa-solid fa-moon"></i>
        </div>
        <div>
          <h1 class="text-lg font-extrabold tracking-tight text-slate-950">Sakina Connect</h1>
        </div>
      </div>

      <nav class="grid gap-2 px-4 pb-4" aria-label="Navigation principale">
        ${items}
      </nav>

      <div class="absolute bottom-5 w-full px-5 grid gap-3">
        <button id="logoutBtn" class="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-50">
          <i class="fa-solid fa-arrow-right-from-bracket"></i>
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>

    <div id="sidebarOverlay" class="fixed inset-0 z-30 hidden bg-slate-950/40 backdrop-blur-sm lg:hidden"></div>
  `;
}