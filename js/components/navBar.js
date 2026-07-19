import { getSession, getUserRole } from "../utils/auth.js";
import { openDrawer } from "./drawer.js";
import { logout } from "../services/authService.js";
import { getPelerinByUtilisateurId } from "../services/pelerinService.js";
import { getNotifications, countUnseen, markSeen } from "../services/notificationService.js";
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
          <span id="notifBadge" class="absolute right-1 top-1 hidden min-w-[18px] rounded-full bg-[#B40909] px-1 text-center text-[10px] font-black leading-[18px] text-white"></span>
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

  initNotifications();
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

// ---------- Notifications (cloche) ----------
async function initNotifications() {
  const user = getSession();
  const role = getUserRole();
  const notifBtn = document.getElementById("notifBtn");
  if (!user || !notifBtn) return;

  let items = [];
  try { items = await getNotifications(user, role); } catch { items = []; }
  updateBadge(items, user.id);

  notifBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (document.getElementById("notifPanel")) fermerPanneauNotif();
    else ouvrirPanneauNotif(items, user);
  });
}

function updateBadge(items, uid) {
  const badge = document.getElementById("notifBadge");
  if (!badge) return;
  const n = countUnseen(items, uid);
  if (n > 0) {
    badge.textContent = n > 9 ? "9+" : String(n);
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}

function formatDateNotif(d) {
  if (!d) return "";
  return String(d).slice(0, 16).replace("T", " à ");
}

function notifRow(item) {
  const iconWrap = item.type === "sos" ? "bg-rose-100 text-rose-600" : "bg-[#F2F2DE] text-[#333D2A]";
  return `
    <button data-notif-page="${escapeHtml(item.page)}" class="flex w-full items-start gap-3 border-b border-slate-50 px-4 py-3 text-left transition hover:bg-slate-50 last:border-0">
      <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconWrap}"><i class="fa-solid ${item.icon}"></i></span>
      <span class="min-w-0 flex-1">
        <span class="flex items-center gap-2">
          <span class="truncate font-bold text-slate-800">${escapeHtml(item.titre)}</span>
          ${item.urgent ? `<span class="shrink-0 rounded-full bg-rose-100 px-1.5 text-[9px] font-black text-rose-700">URGENT</span>` : ""}
        </span>
        <span class="mt-0.5 block truncate text-xs text-slate-500">${escapeHtml(item.sous || "")}</span>
        <span class="mt-0.5 block text-[10px] text-slate-400">${escapeHtml(formatDateNotif(item.date))}</span>
      </span>
    </button>`;
}

function ouvrirPanneauNotif(items, user) {
  fermerPanneauNotif();
  markSeen(user.id); // ouvrir la cloche = tout marquer comme lu
  const badge = document.getElementById("notifBadge");
  if (badge) badge.classList.add("hidden");

  const panel = document.createElement("div");
  panel.id = "notifPanel";
  panel.className = "fixed right-3 top-16 z-[90] w-80 max-w-[92vw] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl";
  panel.innerHTML = `
    <div class="flex items-center justify-between bg-[#333D2A] px-4 py-3 text-white">
      <span class="font-black">Notifications</span>
      <span class="text-xs text-slate-300">${items.length}</span>
    </div>
    <div class="max-h-96 overflow-y-auto">
      ${items.length ? items.map(notifRow).join("") : `<p class="p-6 text-center text-sm text-slate-400">Aucune notification pour le moment.</p>`}
    </div>`;
  document.body.appendChild(panel);

  panel.querySelectorAll("[data-notif-page]").forEach((el) => {
    el.addEventListener("click", () => {
      const page = el.dataset.notifPage;
      fermerPanneauNotif();
      if (page) window.location.hash = "/" + page;
    });
  });

  // Fermer si on clique en dehors du panneau (ajouté au prochain tick pour ignorer le clic courant)
  setTimeout(() => document.addEventListener("click", clicDehorsNotif), 0);
}

function clicDehorsNotif(e) {
  const panel = document.getElementById("notifPanel");
  const btn = document.getElementById("notifBtn");
  if (panel && !panel.contains(e.target) && btn && !btn.contains(e.target)) {
    fermerPanneauNotif();
  }
}

function fermerPanneauNotif() {
  const panel = document.getElementById("notifPanel");
  if (panel) panel.remove();
  document.removeEventListener("click", clicDehorsNotif);
}
