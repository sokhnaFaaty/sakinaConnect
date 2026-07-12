import { getSession, getUserRole } from "../utils/auth.js";

const ROLE_LABELS = {
  ADMIN: { text: "Admin", classes: "bg-[#333D2A]/10 text-[#333D2A]" },
  GUIDE: { text: "Guide", classes: "bg-[#BC7B3B]/10 text-[#BC7B3B]" },
  PELERIN: { text: "Pèlerin", classes: "bg-cyan-100 text-cyan-700" },
  PROCHE: { text: "Proche", classes: "bg-emerald-100 text-emerald-700" },
};

export function renderNavbar() {
  const user = getSession();
  const role = getUserRole();
  const roleInfo = ROLE_LABELS[role] || { text: role, classes: "bg-slate-100 text-slate-600" };

  return `
    <header class="fixed inset-x-0 top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:left-72">
      <div class="flex items-center gap-3">
        <button id="sidebarToggle" class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 lg:hidden" aria-label="Ouvrir le menu">
          <i class="fa-solid fa-bars"></i>
        </button>
        <div class="flex items-center gap-2 text-sm font-bold text-slate-500">
          <span id="navbarTitle">Tableau de bord</span>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <span class="hidden sm:inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${roleInfo.classes}">${roleInfo.text}</span>
        <div class="flex items-center gap-2">
          <div class="flex h-9 w-9 items-center justify-center rounded-full bg-[#333D2A]/10 text-[#333D2A] text-sm font-bold">
            ${user ? user.nomComplet.charAt(0).toUpperCase() : "?"}
          </div>
          <span class="hidden sm:block text-sm font-semibold text-slate-700">${user ? user.nomComplet : ""}</span>
        </div>
      </div>
    </header>
  `;
}