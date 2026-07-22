import { pageHeader } from "../components/pageHeader.js";
import { renderTable } from "../components/table.js";
import { escapeHtml } from "../utils/html.js";
import { getSession } from "../utils/auth.js";
import { getGuideByUtilisateurId, getGroupeDuGuide } from "../services/guideService.js";
import { getPelerinsDuGroupe } from "../services/pelerinService.js";
import { getUtilisateurs } from "../services/utilisateurService.js";
import { getPlanningDuGroupe } from "../services/planningService.js";
import { openModal } from "../components/modal.js";

import { openPelerinDetail } from "./pelerinsPage.js";
import { getHotels } from "../services/hotelService.js";
export async function renderMonGroupePage() {
  const app = document.getElementById("app");
  const user = getSession();

  const guide = await getGuideByUtilisateurId(user.id);
  if (!guide) {
    app.innerHTML = `<section class="rounded-[2rem] border border-amber-200 bg-amber-50 p-8 text-center"><p class="text-sm font-semibold text-amber-700">Aucun profil guide associé à ce compte.</p></section>`;
    return;
  }

  const groupe = await getGroupeDuGuide(guide.id);
  if (!groupe) {
    app.innerHTML = `<section class="rounded-[2rem] border border-slate-200 bg-white p-8 text-center"><p class="text-sm font-semibold text-slate-500">Aucun groupe ne t'a encore été assigné.</p></section>`;
    return;
  }

  const [pelerins, utilisateurs,planning,hotels] = await Promise.all([
    getPelerinsDuGroupe(groupe.id),
    getUtilisateurs(),
      getPlanningDuGroupe(groupe.id),
  getHotels(),

  ]);

  const utilisateurMap = Object.fromEntries(utilisateurs.map((u) => [u.id, u]));
  const nbApprouves = pelerins.filter((p) => p.statutVisa === "APPROUVE").length;
  const pourcentageApprouves = pelerins.length ? Math.round((nbApprouves / pelerins.length) * 100) : 0;

  app.innerHTML = `
    <section>
      <div class="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
      <span class="mb-3 inline-block rounded-full bg-[#333D2A]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#333D2A]">Espace Guide Staff</span>
      <h1 class="font-display text-2xl font-black text-slate-950 sm:text-3xl">Mon groupe : ${escapeHtml(groupe.nom)}</h1>
      <p class="mt-1 text-sm text-slate-500">Gérez la logistique, suivez l'itinéraire et veillez sur la sécurité des pèlerins</p>
    </div>


      <div class="mb-6 grid gap-4 sm:grid-cols-4">
        <div class="rounded-2xl border border-slate-200 bg-white p-5">
          <div class="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-[#F2F2DE] text-[#333D2A]"><i class="fa-solid fa-users"></i></div>
          <p class="text-xs font-extrabold uppercase tracking-widest text-slate-400">Effectif pèlerins</p>
          <p class="mt-1 text-2xl font-black text-slate-950">${pelerins.length}</p>
        </div>
        <div class="rounded-2xl border border-slate-200 bg-white p-5">
          <div class="flex items-center justify-between">
            <p class="text-xs font-extrabold uppercase tracking-widest text-slate-400">Visas approuvés</p>
            <span class="text-xs font-bold text-slate-500">${pourcentageApprouves}%</span>
          </div>
          <p class="mt-1 text-2xl font-black text-slate-950">${nbApprouves}/${pelerins.length}</p>
          <div class="mt-2 h-1.5 w-full rounded-full bg-slate-100">
            <div class="h-1.5 rounded-full bg-[#333D2A]" style="width:${pourcentageApprouves}%"></div>
          </div>
        </div>
        <div class="rounded-2xl border border-rose-200 bg-rose-50 p-5">
          <div class="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-600"><i class="fa-solid fa-triangle-exclamation"></i></div>
          <p class="text-xs font-extrabold uppercase tracking-widest text-rose-600">SOS actifs</p>
          <p class="mt-1 text-2xl font-black text-rose-700">0</p>
        </div>
        <div class="rounded-2xl border border-slate-200 bg-white p-5">
          <div class="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600"><i class="fa-solid fa-clock"></i></div>
          <p class="text-xs font-extrabold uppercase tracking-widest text-slate-400">Annonces publiées</p>
          <p class="mt-1 text-2xl font-black text-slate-950">0</p>
        </div>
      </div>

<div class="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <article class="min-w-0 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="mb-4 text-lg font-black text-slate-950">Liste de mon Groupe (${pelerins.length})</h2>
        ${renderTable({
          rows: pelerins,
          emptyMessage: "Aucun pèlerin dans ce groupe pour l'instant.",
          columns: [
            {
              label: "Image",
              render: (p) => {
                const u = utilisateurMap[p.utilisateurId];
                return u?.photo
                  ? `<img src="${escapeHtml(u.photo)}" class="h-10 w-10 rounded-full object-cover" />`
                  : `<div class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400"><i class="fa-solid fa-user"></i></div>`;
              },
            },
            { label: "Nom Complet", render: (p) => `<strong class="font-bold text-slate-950">${escapeHtml(utilisateurMap[p.utilisateurId]?.nomComplet || "—")}</strong>` },
            { label: "Numéro Visa", render: (p) => escapeHtml(p.numeroPasseport) },
            { label: "Statut Visa", render: (p) => p.statutVisa === "APPROUVE"
              ? `<span class="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">Approuvé</span>`
              : `<span class="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">${escapeHtml(p.statutVisa)}</span>` },
            { label: "Fiche", render: (p) => `<button data-view-pelerin="${escapeHtml(p.id)}" title="Voir la fiche" class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-[#333D2A] hover:bg-slate-50"><i class="fa-solid fa-eye"></i></button>` },
          ],
        })}
      </article>

      <article class="min-w-0 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="mb-4 flex items-center gap-2 text-lg font-black text-slate-950">
          <i class="fa-regular fa-clock text-[#BC7B3B]"></i> Planning de voyages
        </h2>
        <div id="planningList" class="grid gap-4"></div>
        <div id="planningPagination" class="mt-4 flex items-center justify-center gap-2"></div>
      </article>
    </div>
  </section>
`;

renderPlanningPanel(planning);

const groupeMapSimple = { [groupe.id]: groupe };
document.querySelectorAll("[data-view-pelerin]").forEach((button) => {
  button.addEventListener("click", () => {
    const pelerin = pelerins.find((p) => p.id === button.dataset.viewPelerin);
    if (pelerin) openPelerinDetail(pelerin, utilisateurMap, groupeMapSimple, hotels, [guide]);
  });
});
}
      const PLANNING_PAR_PAGE = 2;
let planningPageActuelle = 1;

function renderPlanningPanel(planning) {
  const listEl = document.getElementById("planningList");
  const paginationEl = document.getElementById("planningPagination");
  if (!listEl) return;

  const totalPages = Math.max(1, Math.ceil(planning.length / PLANNING_PAR_PAGE));
  if (planningPageActuelle > totalPages) planningPageActuelle = totalPages;

  const debut = (planningPageActuelle - 1) * PLANNING_PAR_PAGE;
  const items = planning.slice(debut, debut + PLANNING_PAR_PAGE);

  listEl.innerHTML = items.length
    ? items.map((evenement, index) => planningCard(evenement, debut + index + 1)).join("")
    : `<p class="text-sm text-slate-400">Aucun événement planifié pour ce groupe.</p>`;

  listEl.querySelectorAll("[data-planning-id]").forEach((card) => {
    card.addEventListener("click", () => {
      const evenement = planning.find((e) => e.id === card.dataset.planningId);
      if (evenement) openPlanningDetail(evenement);
    });
  });

  paginationEl.innerHTML = Array.from({ length: totalPages }, (_, i) => i + 1)
    .map((page) => `
      <button data-page-planning="${page}" class="h-8 w-8 rounded-full text-xs font-bold transition ${
        page === planningPageActuelle ? "bg-[#333D2A] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }">${page}</button>
    `).join("");

  paginationEl.querySelectorAll("[data-page-planning]").forEach((button) => {
    button.addEventListener("click", () => {
      planningPageActuelle = Number(button.dataset.pagePlanning);
      renderPlanningPanel(planning);
    });
  });

  
}

function planningCard(evenement, jourNumero) {
  return `
    <div data-planning-id="${escapeHtml(evenement.id)}" class="cursor-pointer rounded-2xl border border-slate-100 bg-[#F2F2DE]/50 p-4 transition hover:bg-[#F2F2DE]">
      <span class="mb-2 inline-block rounded-full bg-[#333D2A] px-2.5 py-0.5 text-[10px] font-black uppercase text-white">Jour ${jourNumero}</span>
      <h3 class="text-sm font-black text-slate-900">${escapeHtml(evenement.titre)}</h3>
      <p class="mt-1 line-clamp-2 text-xs text-slate-500">${escapeHtml(evenement.description)}</p>
      <p class="mt-2 text-xs text-slate-400"><i class="fa-solid fa-location-dot mr-1"></i>${escapeHtml(evenement.lieu)}</p>
    </div>
  `;
}

function openPlanningDetail(evenement) {
  openModal({
    title: evenement.titre,
    icon: "fa-calendar-day",
    body: `
      <div class="grid gap-3 text-sm">
        <div class="flex justify-between"><span class="text-slate-500">Date :</span><span class="font-semibold">${escapeHtml(evenement.date)} à ${escapeHtml(evenement.heure)}</span></div>
        <div class="flex justify-between"><span class="text-slate-500">Lieu :</span><span class="font-semibold">${escapeHtml(evenement.lieu)}</span></div>
        <p class="mt-2 leading-6 text-slate-700">${escapeHtml(evenement.description)}</p>
      </div>
    `,
    confirmLabel: "Fermer",
    onConfirm: async () => true,
  });
}2