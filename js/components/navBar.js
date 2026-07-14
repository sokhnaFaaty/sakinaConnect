import { getSession, getUserRole } from "../utils/auth.js";

const ROLE_LABELS = {
  ADMIN: "Admin",
  GUIDE: "Guide",
  PELERIN: "Pèlerin",
  PROCHE: "Proche",
};

export function renderNavbar() {
  const user = getSession();
  const role = getUserRole();
  const roleLabel = ROLE_LABELS[role] || role;

  return `
    <header class="fixed inset-x-0 top-0 z-20 flex h-16 items-center justify-between bg-[#333D2A] px-4 lg:left-72">
    <div class="flex items-center gap-3">
  <button id="sidebarToggle" ...>...</button>
  <i class="fa-solid fa-moon text-[#BC7B3B]"></i>
  <span class="font-display text-base font-black text-white">Sakina Connect</span>
</div>
   

      <div class="flex items-center gap-3">
        <div class="text-right">
          <p class="text-sm font-bold text-white">${user ? user.nomComplet : ""}</p>
          <span class="text-xs text-slate-300">${roleLabel}</span>
        </div>
        <div class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#BC7B3B] text-sm font-bold text-white">
          ${user?.photo
            ? `<img src="${user.photo}" alt="" class="h-full w-full object-cover" />`
            : (user ? user.nomComplet.charAt(0).toUpperCase() : "?")
          }
        </div>
      </div>
    </header>
  `;
}