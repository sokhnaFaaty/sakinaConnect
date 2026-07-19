import { getUserRole } from "../utils/auth.js";

const NAV_LINKS_BY_ROLE = {
  ADMIN: [
    { page: "annuaire-guides", label: "Annuaire des Guides", icon: "fa-user-tie" },
    { page: "groupes", label: "Liste des Groupes", icon: "fa-people-group" },
    { page: "pelerins", label: "Liste des Pèlerins", icon: "fa-users" },
      { page: "itineraire", label: "Itinéraire Voyage", icon: "fa-route" },
    { page: "pole-urgence", label: "Pôle d'Urgence SOS", icon: "fa-triangle-exclamation" },
  ],
  GUIDE: [
    { page: "mon-groupe", label: "Mon groupe", icon: "fa-users" },
      { page: "itineraire", label: "Itinéraire Voyage", icon: "fa-route" },
  { page: "mon-pole-urgence", label: "Pôle d'Urgence SOS", icon: "fa-triangle-exclamation" },
  ],
  PELERIN: [
    { page: "dashboard-pelerin", label: "Tableau de Bord", icon: "fa-gauge" },
    { page: "pole-urgence-pelerin", label: "Pôle d'Urgence SOS", icon: "fa-triangle-exclamation" },
  ],
  PROCHE: [],
};

export function renderSidebar() {
  const role = getUserRole();
  const links = NAV_LINKS_BY_ROLE[role] || [];

  const items = links.map((link) => `
    <button class="nav-link flex items-center gap-3 rounded-xl border-l-4 border-transparent px-4 py-3 text-left text-sm font-semibold text-slate-600 transition hover:bg-[#F2F2DE]/60 data-[active=true]:border-[#333D2A] data-[active=true]:bg-[#F2F2DE] data-[active=true]:text-[#333D2A]" data-page="${link.page}">
      <i class="fa-solid ${link.icon} w-5 text-center"></i>
      <span>${link.label}</span>
    </button>
  `).join("");

  return `
    <aside id="sidebar" class="fixed inset-x-0 top-16 bottom-0 left-0 z-40 w-72 -translate-x-full border-r border-slate-200 bg-white transition-transform duration-300 lg:translate-x-0">
      <p class="px-5 pb-2 pt-6 text-xs font-extrabold uppercase tracking-widest text-slate-400">Vues système :</p>

      <nav class="grid gap-1 px-4 pb-4" aria-label="Navigation principale">
        ${items}
      </nav>

      <div class="absolute bottom-5 w-full px-5 grid gap-3">
        <button id="sosBtn" class="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#B40909] px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <span>Urgence SOS</span>
        </button>
        <button id="logoutBtn" class="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FA0404] px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90">
          <i class="fa-solid fa-arrow-right-from-bracket"></i>
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>

    <div id="sidebarOverlay" class="fixed inset-0 z-30 hidden bg-slate-950/40 backdrop-blur-sm lg:hidden"></div>
  `;
}