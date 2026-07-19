// pages/annoncePage.js — Tableau d'affichage des communiqués (ADMIN + GUIDE)
import { pageHeader } from "../components/pageHeader.js";
import { openModal, openConfirm } from "../components/modal.js";
import { pagination, bindPagination } from "../components/pagination.js";
import { showToast } from "../components/toast.js";
import { escapeHtml } from "../utils/html.js";
import { showError, hideError, validateField } from "../utils/formValidator.js";
import { getSession, getUserRole } from "../utils/auth.js";
import { getAnnonces, createAnnonce, deleteAnnonce } from "../services/annonceService.js";
import { getUtilisateurs } from "../services/utilisateurService.js";
import { getGuides } from "../services/guideService.js";

const ROLE_LABELS = { ADMIN: "Administrateur", GUIDE: "Guide", PELERIN: "Pèlerin", PROCHE: "Proche" };
const PER_PAGE = 3;

// ---------- Modal de publication ----------
function openPublierAnnonce(user, onDone) {
  openModal({
    title: "Diffuser un message système",
    icon: "fa-bullhorn",
    body: `
      <div>
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="annonceTitre">Titre du communiqué *</label>
        <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" type="text" id="annonceTitre" placeholder="Ex: Modification de la ligne de Bus de la Mecque" />
        <p id="annonceTitreError" class="mt-1 hidden text-xs text-rose-600"></p>
      </div>
      <div>
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="annonceContenu">Contenu du message *</label>
        <textarea class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" id="annonceContenu" rows="4" placeholder="Décrivez clairement et précisément les détails ..."></textarea>
        <p id="annonceContenuError" class="mt-1 hidden text-xs text-rose-600"></p>
      </div>
      <label class="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-slate-700">
        <input type="checkbox" id="annonceUrgent" class="h-5 w-5 accent-rose-600" />
        <span>Marquer comme urgent (affiche un bandeau rouge chez tous les pèlerins)</span>
      </label>
    `,
    confirmLabel: "Publier l'annonce",
    confirmIcon: "fa-paper-plane",
    onConfirm: async (modal) => {
      const titre = modal.querySelector("#annonceTitre").value.trim();
      const contenu = modal.querySelector("#annonceContenu").value.trim();
      const urgence = modal.querySelector("#annonceUrgent").checked;

      let hasError = false;
      const titreError = validateField(titre, "Le titre");
      if (titreError) { showError("annonceTitre", "annonceTitreError", titreError); hasError = true; }
      else hideError("annonceTitre", "annonceTitreError");
      const contenuError = validateField(contenu, "Le contenu");
      if (contenuError) { showError("annonceContenu", "annonceContenuError", contenuError); hasError = true; }
      else hideError("annonceContenu", "annonceContenuError");
      if (hasError) return false;

      try {
        await createAnnonce({ titre, contenu, urgence, auteurId: user.id });
        showToast("Communiqué publié.");
        await onDone();
        return true;
      } catch (error) {
        showToast(error.message, "error");
        return false;
      }
    },
  });
}

// ---------- Page principale ----------
export async function renderAnnoncePage() {
  const app = document.getElementById("app");
  const user = getSession();
  const role = getUserRole();

  const [annonces, utilisateurs, guides] = await Promise.all([
    getAnnonces(),
    getUtilisateurs(),
    getGuides(),
  ]);

  const utilisateurMap = Object.fromEntries(utilisateurs.map((u) => [u.id, u]));
  const guideMap = Object.fromEntries(guides.map((g) => [g.id, g]));

  // Seuls l'admin et le guide publient ; le pèlerin consulte en lecture seule.
  const peutPublier = role === "ADMIN" || role === "GUIDE";

  // Auteur : via auteurId (nouveau), avec repli sur guideId (ancienne annonce du JSON)
  const auteur = (a) => {
    let u = a.auteurId ? utilisateurMap[a.auteurId] : null;
    if (!u && a.guideId && guideMap[a.guideId]) u = utilisateurMap[guideMap[a.guideId].utilisateurId];
    const nom = u?.nomComplet || "Auteur inconnu";
    const roleLabel = u ? (ROLE_LABELS[u.role] || u.role) : "";
    return roleLabel ? `${nom} (${roleLabel})` : nom;
  };

  const peutSupprimer = (a) => role === "ADMIN" || (a.auteurId && a.auteurId === user.id);

  const carte = (a, numero) => `
    <article class="rounded-3xl border border-slate-200 ${a.urgence ? "border-l-4 border-l-[#B40909]" : ""} bg-white p-5 shadow-sm">
      <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <span class="rounded-md bg-[#F2F2DE] px-2 py-0.5 text-xs font-bold text-[#333D2A]">A-${String(numero).padStart(2, "0")}</span>
          ${a.urgence ? `<span class="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-black text-rose-700">Alerte Urgente</span>` : ""}
        </div>
        <div class="flex items-center gap-4 text-xs text-slate-500">
          <span><i class="fa-regular fa-calendar"></i> ${escapeHtml((a.datePublication || "").slice(0, 10))}</span>
          <span><i class="fa-regular fa-user"></i> ${escapeHtml(auteur(a))}</span>
          ${peutSupprimer(a) ? `<button class="text-rose-500 hover:text-rose-700" data-delete-annonce="${escapeHtml(a.id)}" title="Supprimer"><i class="fa-solid fa-trash"></i></button>` : ""}
        </div>
      </div>
      <h3 class="font-black text-slate-950">${escapeHtml(a.titre)}</h3>
      <p class="mt-1 whitespace-pre-line text-sm text-slate-600">${escapeHtml(a.contenu)}</p>
    </article>
  `;

  app.innerHTML = `
    <section>
      ${pageHeader({
        kicker: "Communication",
        title: "Tableau d'affichage des communiqués",
        subtitle: "Alertes en temps réel, consignes quotidiennes.",
        actionLabel: peutPublier ? "Publier un Communiqué" : null,
        actionId: peutPublier ? "addAnnonceBtn" : null,
        actionIcon: "fa-plus",
      })}

      <div class="mb-6 flex flex-col gap-3 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div class="relative flex-1">
          <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input id="annonceSearch" type="text" placeholder="Rechercher des communiqués" class="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm" />
        </div>
        <button id="urgentFilterBtn" type="button" class="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
          Afficher uniquement les urgentes
        </button>
      </div>

      <div id="annonceList" class="grid gap-4"></div>
      <div id="annoncePagination"></div>
    </section>
  `;

  const addBtn = document.getElementById("addAnnonceBtn");
  if (addBtn) addBtn.addEventListener("click", () => openPublierAnnonce(user, renderAnnoncePage));

  let search = "";
  let urgentOnly = false;
  let page = 1;

  const filtered = () => {
    let list = annonces;
    if (urgentOnly) list = list.filter((a) => a.urgence);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((a) => `${a.titre} ${a.contenu}`.toLowerCase().includes(q));
    }
    return list;
  };

  const draw = () => {
    const list = filtered();
    const totalPages = Math.max(1, Math.ceil(list.length / PER_PAGE));
    if (page > totalPages) page = totalPages;
    const start = (page - 1) * PER_PAGE;
    const items = list.slice(start, start + PER_PAGE);

    const listEl = document.getElementById("annonceList");
    listEl.innerHTML = items.length
      ? items.map((a) => carte(a, annonces.indexOf(a) + 1)).join("")
      : `<div class="rounded-[2rem] border border-slate-200 bg-white p-10 text-center text-sm text-slate-400 shadow-sm">Aucun communiqué${urgentOnly || search ? " ne correspond à ce filtre" : ""}.</div>`;

    const pagEl = document.getElementById("annoncePagination");
    pagEl.innerHTML = pagination(page, totalPages);
    bindPagination(pagEl, (p) => { page = p; draw(); });

    listEl.querySelectorAll("[data-delete-annonce]").forEach((btn) => {
      btn.addEventListener("click", () => {
        openConfirm({
          title: "Confirmer la suppression",
          message: "Voulez-vous supprimer ce communiqué ?",
          onConfirm: async () => {
            try {
              await deleteAnnonce(btn.dataset.deleteAnnonce);
              showToast("Communiqué supprimé.");
              await renderAnnoncePage();
            } catch (error) {
              showToast(error.message, "error");
            }
          },
        });
      });
    });
  };

  document.getElementById("annonceSearch").addEventListener("input", (e) => {
    search = e.target.value.trim();
    page = 1;
    draw();
  });

  document.getElementById("urgentFilterBtn").addEventListener("click", (e) => {
    urgentOnly = !urgentOnly;
    page = 1;
    const btn = e.currentTarget;
    if (urgentOnly) {
      btn.textContent = "Afficher tous les communiqués";
      btn.classList.add("bg-rose-600", "text-white", "border-rose-600");
      btn.classList.remove("bg-white", "text-slate-700", "border-slate-200");
    } else {
      btn.textContent = "Afficher uniquement les urgentes";
      btn.classList.remove("bg-rose-600", "text-white", "border-rose-600");
      btn.classList.add("bg-white", "text-slate-700", "border-slate-200");
    }
    draw();
  });

  draw();
}
