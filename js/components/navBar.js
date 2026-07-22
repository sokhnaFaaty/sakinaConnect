import { getSession, getUserRole, saveSession } from "../utils/auth.js";
import { logout } from "../services/authService.js";
import { getPelerinByUtilisateurId } from "../services/pelerinService.js";
import { getNotifications, countUnseen, markSeen } from "../services/notificationService.js";
import { escapeHtml } from "../utils/html.js";
import { openModal } from "./modal.js";
import { showToast } from "./toast.js";
import { showError, hideError } from "../utils/formValidator.js";
import { validateEmailFormat, validateTelephone } from "../utils/validators.js";
import { emailExiste, telephoneExiste } from "../services/validationService.js";
import { updateUtilisateur } from "../services/utilisateurService.js";
import { uploadUserPhoto } from "../services/cloudinaryService.js";

// Rôles disposant déjà d'une page "Mon profil" complète (barre latérale).
// Pour eux, le bouton d'édition du menu y renvoie ; les autres (Admin, Guide)
// ouvrent une modale d'édition légère.
const PROFILE_PAGE_BY_ROLE = {
  PELERIN: "mon-profil",
  PROCHE: "mon-profil-proche",
};

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
  if (menuBtn) {
    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleProfileDropdown();
    });
  }

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

// Menu déroulant "Mon profil" : ouvert depuis l'avatar en haut à droite.
// Bascule (ouvre/ferme) à chaque clic sur le bouton du menu.
function toggleProfileDropdown() {
  if (document.getElementById("profilePanel")) {
    fermerProfil();
  } else {
    ouvrirProfil();
  }
}

// Affiche le menu déroulant du profil ancré sous l'avatar.
function ouvrirProfil() {
  fermerPanneauNotif(); // un seul panneau ouvert à la fois

  const user = getSession();
  if (!user) return;
  const role = getUserRole();
  const roleLabel = ROLE_LABELS[role] || role || "";
  const initiale = user.nomComplet ? escapeHtml(user.nomComplet.charAt(0).toUpperCase()) : "?";

  const panel = document.createElement("div");
  panel.id = "profilePanel";
  panel.className = "fixed right-3 top-16 z-[90] w-72 max-w-[92vw] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl";
  panel.innerHTML = `
    <div class="flex flex-col items-center gap-2 bg-[#333D2A] px-4 py-5 text-center text-white">
      <div class="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-[#BC7B3B] text-xl font-black">
        ${user.photo ? `<img src="${escapeHtml(user.photo)}" alt="" class="h-full w-full object-cover" />` : initiale}
      </div>
      <div>
        <h3 class="text-base font-black">${escapeHtml(user.nomComplet || "-")}</h3>
        <span class="mt-1 inline-block rounded-full bg-white/15 px-3 py-0.5 text-xs font-bold">${escapeHtml(roleLabel)}</span>
      </div>
    </div>

    <div class="grid gap-2 p-4">
      ${infoRow("fa-envelope", "Email", user.email || "-")}
      ${infoRow("fa-phone", "Téléphone", user.telephone || "-")}
      <div id="profilePassportSlot"></div>
    </div>

    <div class="grid gap-2 border-t border-slate-100 p-3">
      <button id="profileEditBtn" class="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-700 transition hover:bg-slate-50">
        <i class="fa-solid fa-pen"></i> Modifier mon profil
      </button>
      <button id="profileLogoutBtn" class="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FA0404] px-4 py-2.5 text-sm font-extrabold text-white transition hover:opacity-90">
        <i class="fa-solid fa-arrow-right-from-bracket"></i> Déconnexion
      </button>
    </div>`;
  document.body.appendChild(panel);

  panel.querySelector("#profileEditBtn").addEventListener("click", () => {
    fermerProfil();
    // Pèlerin / Proche : on renvoie vers leur page "Mon profil" complète.
    // Admin / Guide : pas de page dédiée -> modale d'édition légère.
    const dest = PROFILE_PAGE_BY_ROLE[role];
    if (dest) {
      window.location.hash = "/" + dest;
    } else {
      ouvrirEditionProfil(user);
    }
  });

  panel.querySelector("#profileLogoutBtn").addEventListener("click", () => {
    fermerProfil();
    logout();
  });

  // Le passeport n'existe que pour un pèlerin (sur sa fiche, pas sur le compte).
  // Chargé à la volée puis injecté, pour ne pas retarder l'ouverture du menu.
  if (role === "PELERIN") {
    getPelerinByUtilisateurId(user.id)
      .then((pelerin) => {
        const slot = document.getElementById("profilePassportSlot");
        if (slot && pelerin?.numeroPasseport) {
          slot.innerHTML = infoRow("fa-passport", "Passeport", pelerin.numeroPasseport);
        }
      })
      .catch(() => {
        /* on ignore : le profil s'affiche sans le passeport */
      });
  }

  // Fermer si on clique en dehors (au prochain tick pour ignorer le clic courant)
  setTimeout(() => document.addEventListener("click", clicDehorsProfil), 0);
}

function clicDehorsProfil(e) {
  const panel = document.getElementById("profilePanel");
  const btn = document.getElementById("userMenuBtn");
  if (panel && !panel.contains(e.target) && btn && !btn.contains(e.target)) {
    fermerProfil();
  }
}

function fermerProfil() {
  const panel = document.getElementById("profilePanel");
  if (panel) panel.remove();
  document.removeEventListener("click", clicDehorsProfil);
}

// Re-rend la navbar (avatar + nom) après une modification de profil, sans recharger la page.
function refreshNavbar() {
  const root = document.getElementById("navbarRoot");
  if (!root) return;
  root.innerHTML = renderNavbar();
  bindNavbar();
}

// Modale d'édition du profil pour l'Admin et le Guide (qui n'ont pas de page dédiée).
// Champs modifiables : photo, email, téléphone, mot de passe. Le nom reste en lecture seule.
function ouvrirEditionProfil(user) {
  const initiale = user.nomComplet ? escapeHtml(user.nomComplet.charAt(0).toUpperCase()) : "?";

  openModal({
    title: "Modifier mon profil",
    icon: "fa-user-pen",
    confirmLabel: "Enregistrer",
    body: `
      <div class="flex items-center gap-4">
        <div class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#BC7B3B] text-xl font-black text-white">
          ${user.photo ? `<img src="${escapeHtml(user.photo)}" alt="" class="h-full w-full object-cover" />` : initiale}
        </div>
        <div class="flex-1">
          <p class="font-bold text-slate-900">${escapeHtml(user.nomComplet || "-")}</p>
          <p class="text-xs text-slate-500">Choisissez une image pour remplacer votre photo actuelle.</p>
        </div>
      </div>

      <div>
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="editProfPhoto">Photo (facultatif)</label>
        <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm" type="file" id="editProfPhoto" accept="image/*" />
        <p id="editProfPhotoError" class="mt-1 hidden text-xs text-rose-600"></p>
      </div>

      <div>
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="editProfEmail">Adresse email *</label>
        <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" type="email" id="editProfEmail" value="${escapeHtml(user.email || "")}" placeholder="email@exemple.com" />
        <p id="editProfEmailError" class="mt-1 hidden text-xs text-rose-600"></p>
      </div>

      <div>
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="editProfTel">Numéro de téléphone *</label>
        <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" type="text" id="editProfTel" value="${escapeHtml(user.telephone || "")}" placeholder="77 123 45 67" />
        <p id="editProfTelError" class="mt-1 hidden text-xs text-rose-600"></p>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="editProfPwd">Nouveau mot de passe</label>
          <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" type="password" id="editProfPwd" placeholder="Laisser vide pour ne pas changer" />
          <p id="editProfPwdError" class="mt-1 hidden text-xs text-rose-600"></p>
        </div>
        <div>
          <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="editProfPwdConfirm">Confirmer le mot de passe</label>
          <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" type="password" id="editProfPwdConfirm" placeholder="Retapez le mot de passe" />
          <p id="editProfPwdConfirmError" class="mt-1 hidden text-xs text-rose-600"></p>
        </div>
      </div>
    `,
    onConfirm: async (overlay) => {
      const q = (id) => overlay.querySelector("#" + id);
      const email = q("editProfEmail").value.trim();
      const telephone = q("editProfTel").value.trim();
      const motDePasse = q("editProfPwd").value;
      const motDePasseConfirm = q("editProfPwdConfirm").value;

      let hasError = false;
      const emailError = validateEmailFormat(email);
      if (emailError) { showError("editProfEmail", "editProfEmailError", emailError); hasError = true; }
      else hideError("editProfEmail", "editProfEmailError");

      const telError = validateTelephone(telephone);
      if (telError) { showError("editProfTel", "editProfTelError", telError); hasError = true; }
      else hideError("editProfTel", "editProfTelError");

      // Mot de passe : seulement s'il est renseigné, il doit être confirmé
      if (motDePasse || motDePasseConfirm) {
        if (!motDePasse) { showError("editProfPwd", "editProfPwdError", "Saisissez le nouveau mot de passe."); hasError = true; }
        else hideError("editProfPwd", "editProfPwdError");
        if (motDePasse !== motDePasseConfirm) { showError("editProfPwdConfirm", "editProfPwdConfirmError", "Les mots de passe ne correspondent pas."); hasError = true; }
        else hideError("editProfPwdConfirm", "editProfPwdConfirmError");
      }
      if (hasError) return false;

      // État de chargement sur le bouton (comme le drawer) le temps des appels réseau
      const submitBtn = overlay.querySelector("[type=submit]");
      const contenuInitial = submitBtn ? submitBtn.innerHTML : "";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add("cursor-not-allowed", "opacity-60");
        submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i><span>Traitement…</span>`;
      }

      const restaurerBouton = () => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.classList.remove("cursor-not-allowed", "opacity-60");
          submitBtn.innerHTML = contenuInitial;
        }
      };

      try {
        // Unicité (en excluant son propre compte)
        if (await emailExiste(email, user.id)) {
          showError("editProfEmail", "editProfEmailError", "Cet email est déjà utilisé.");
          restaurerBouton();
          return false;
        }
        if (await telephoneExiste(telephone, user.id)) {
          showError("editProfTel", "editProfTelError", "Ce téléphone est déjà utilisé.");
          restaurerBouton();
          return false;
        }

        // Nouvelle photo éventuelle (sinon on garde l'actuelle)
        let photo = user.photo || "";
        const file = q("editProfPhoto")?.files?.[0];
        if (file) {
          try {
            const result = await uploadUserPhoto(file);
            photo = result.photoUrl;
          } catch (error) {
            showError("editProfPhoto", "editProfPhotoError", error.message);
            restaurerBouton();
            return false;
          }
        }

        const majUtilisateur = { email, telephone, photo };
        if (motDePasse) majUtilisateur.motDePasse = motDePasse;
        await updateUtilisateur(user.id, majUtilisateur);

        // Rafraîchit la session + la navbar (avatar / infos)
        saveSession({ ...user, email, telephone, photo });
        showToast("Profil mis à jour avec succès.");
        refreshNavbar();
        return true;
      } catch (error) {
        showToast(error.message, "error");
        restaurerBouton();
        return false;
      }
    },
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
  fermerProfil(); // un seul panneau ouvert à la fois
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
