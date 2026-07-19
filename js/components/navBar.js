import { getSession, getUserRole } from "../utils/auth.js";
import { openDrawer } from "./drawer.js";
import { showToast } from "./toast.js";
import { logout } from "../services/authService.js";
import { getPelerinByUtilisateurId } from "../services/pelerinService.js";
import { escapeHtml } from "../utils/html.js";

const ROLE_LABELS = {
  ADMIN: "Admin",
  GUIDE: "Guide",
  PELERIN: "Pèlerin",
  PROCHE: "Proche",
};

export function renderNavbar() {
  const user = getSession();
  const role = getUserRole();
  const roleLabel = ROLE_LABELS[role] || role || "";
  const initiale = user?.nomComplet ? escapeHtml(user.nomComplet.charAt(0).toUpperCase()) : "?";

  return `
    <header class="fixed inset-x-0 top-0 z-20 flex h-16 items-center justify-between bg-[#333D2A] px-4">
      <div class="flex items-center gap-3">
        <button id="sidebarToggle" class="flex h-10 w-10 items-center justify-center rounded-xl text-white transition hover:bg-white/10 lg:hidden" aria-label="Ouvrir le menu">
          <i class="fa-solid fa-bars"></i>
        </button>
        <i class="fa-solid fa-moon text-[#BC7B3B]"></i>
        <span class="font-display text-base font-black text-white">Sakina Connect</span>
      </div>

      <div class="flex items-center gap-2 sm:gap-4">
        <button id="notifBtn" class="relative flex h-10 w-10 items-center justify-center rounded-xl text-white transition hover:bg-white/10" aria-label="Notifications">
          <i class="fa-solid fa-bell"></i>
        </button>

        <button id="userMenuBtn" class="flex items-center gap-2 rounded-xl px-2 py-1 transition hover:bg-white/10" aria-label="Mon profil">
          <div class="hidden text-right sm:block">
            <p class="text-sm font-bold text-white">${user ? escapeHtml(user.nomComplet) : ""}</p>
            <span class="text-xs text-slate-300">${escapeHtml(roleLabel)}</span>
          </div>
          <div class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#BC7B3B] text-sm font-bold text-white">
            ${user?.photo ? `<img src="${escapeHtml(user.photo)}" alt="" class="h-full w-full object-cover" />` : initiale}
          </div>
          <i class="fa-solid fa-chevron-down text-xs text-slate-300"></i>
        </button>
      </div>
    </header>
  `;
}

// Branche les interactions de la navbar (à appeler après le montage du layout)
export function bindNavbar() {
  const menuBtn = document.getElementById("userMenuBtn");
  if (menuBtn) menuBtn.addEventListener("click", openProfileDrawer);

  const notifBtn = document.getElementById("notifBtn");
  // La cloche sera reliée aux notifications (SOS + annonces) lors de la feature annonces.
  if (notifBtn) notifBtn.addEventListener("click", () => showToast("Notifications bientôt disponibles."));
}

function infoRow(icon, label, value) {
  return `
    <div class="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
      <i class="fa-solid ${icon} w-5 text-center text-[#333D2A]"></i>
      <div>
        <p class="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">${escapeHtml(label)}</p>
        <p class="text-sm font-bold text-slate-800">${escapeHtml(value)}</p>
      </div>
    </div>`;
}

// Drawer "Mon profil" : infos de l'utilisateur + bouton Déconnexion en bas
async function openProfileDrawer() {
  const user = getSession();
  if (!user) return;
  const role = getUserRole();
  const roleLabel = ROLE_LABELS[role] || role || "";
  const initiale = user.nomComplet ? escapeHtml(user.nomComplet.charAt(0).toUpperCase()) : "?";

  // Le passeport n'existe que pour un pèlerin (sur sa fiche, pas sur le compte)
  let extraRows = "";
  if (role === "PELERIN") {
    try {
      const pelerin = await getPelerinByUtilisateurId(user.id);
      if (pelerin?.numeroPasseport) {
        extraRows += infoRow("fa-passport", "Passeport", pelerin.numeroPasseport);
      }
    } catch {
      /* on ignore : le profil s'affiche sans le passeport */
    }
  }

  openDrawer({
    title: "Mon profil",
    icon: "fa-user",
    cancelLabel: "Fermer",
    confirmLabel: "Déconnexion",
    confirmIcon: "fa-arrow-right-from-bracket",
    confirmClass: "bg-[#FA0404] hover:opacity-90",
    onConfirm: async () => {
      logout();
      return true;
    },
    body: `
      <div class="flex flex-col items-center gap-3 border-b border-slate-100 pb-5 text-center">
        <div class="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-[#BC7B3B] text-2xl font-black text-white">
          ${user.photo ? `<img src="${escapeHtml(user.photo)}" alt="" class="h-full w-full object-cover" />` : initiale}
        </div>
        <div>
          <h3 class="text-lg font-black text-slate-950">${escapeHtml(user.nomComplet || "-")}</h3>
          <span class="mt-1 inline-block rounded-full bg-[#F2F2DE] px-3 py-0.5 text-xs font-bold text-[#333D2A]">${escapeHtml(roleLabel)}</span>
        </div>
      </div>

      <div class="grid gap-2 pt-4">
        ${infoRow("fa-envelope", "Email", user.email || "-")}
        ${infoRow("fa-phone", "Téléphone", user.telephone || "-")}
        ${extraRows}
      </div>
    `,
  });
}
