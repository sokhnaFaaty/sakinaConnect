// pages/dashboardGuidePage.js — Console de Rassemblement du Groupe (GUIDE)
import { pagination, bindPagination } from "../components/pagination.js";
import { escapeHtml } from "../utils/html.js";
import { navigate } from "../router.js";
import { getSession } from "../utils/auth.js";
import { getGuideByUtilisateurId, getGroupeDuGuide } from "../services/guideService.js";
import { getPelerinsDuGroupe } from "../services/pelerinService.js";
import { getUtilisateurs } from "../services/utilisateurService.js";
import { getSos } from "../services/sosService.js";

const PELERINS_PER_PAGE = 4;

function statCard(label, valeur, icon, accent = "text-[#333D2A]") {
  return `
    <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="mb-3 flex items-center justify-between">
        <p class="text-xs font-extrabold uppercase tracking-widest text-slate-400">${escapeHtml(label)}</p>
        <i class="fa-solid ${icon} ${accent}"></i>
      </div>
      <p class="text-2xl font-black text-slate-950">${escapeHtml(String(valeur))}</p>
    </article>`;
}

const banniere = `
  <header class="mb-6 rounded-3xl bg-gradient-to-r from-[#8a5a1f] to-[#BC7B3B] p-6 text-white shadow-sm sm:p-7">
    <span class="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-black uppercase tracking-wider">Guide d'Omra Certifié (Oustadh)</span>
    <h1 class="mt-3 font-display text-2xl font-black tracking-tight sm:text-3xl">Console de Rassemblement du Groupe</h1>
    <p class="mt-1 max-w-2xl text-sm text-white/80">Mettez à jour les plannings, consultez le manifeste des pèlerins et suivez les alertes SOS de votre groupe.</p>
  </header>`;

export async function renderDashboardGuidePage() {
  const app = document.getElementById("app");
  const user = getSession();

  const guide = await getGuideByUtilisateurId(user.id);
  if (!guide) {
    app.innerHTML = `<section>${banniere}<div class="rounded-[2rem] border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">Aucun profil guide associé à ce compte.</div></section>`;
    return;
  }

  const groupe = await getGroupeDuGuide(guide.id);
  if (!groupe) {
    app.innerHTML = `<section>${banniere}<div class="rounded-[2rem] border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">Aucun groupe ne vous est encore assigné.</div></section>`;
    return;
  }

  const [pelerins, utilisateurs, sos] = await Promise.all([
    getPelerinsDuGroupe(groupe.id),
    getUtilisateurs(),
    getSos(),
  ]);

  const utilisateurMap = Object.fromEntries(utilisateurs.map((u) => [u.id, u]));
  const idsPelerins = new Set(pelerins.map((p) => p.id));
  const sosActifsGroupe = sos.filter((s) => s.statut === "EN_ATTENTE" && idsPelerins.has(s.pelerinId)).length;

  const visaBadge = (p) => p.statutVisa === "APPROUVE"
    ? `<span class="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">Approuvé</span>`
    : `<span class="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">${escapeHtml(p.statutVisa)}</span>`;

  app.innerHTML = `
    <section>
      ${banniere}

      <div class="mb-6 grid gap-4 sm:grid-cols-3">
        ${statCard("Nom du groupe", groupe.nom, "fa-people-group")}
        ${statCard("Mes pèlerins", `${pelerins.length} âmes actives`, "fa-user")}
        ${statCard("Alerte SOS", sosActifsGroupe > 0 ? `${sosActifsGroupe} urgence(s)` : "Aucune", "fa-circle-exclamation", sosActifsGroupe > 0 ? "text-rose-600" : "text-[#333D2A]")}
      </div>

      <div class="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <article class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 class="mb-4 text-lg font-black text-slate-950">Liste des Pèlerins Assignés</h2>
          <div id="guidePelerinsList" class="grid gap-3"></div>
          <div id="guidePelerinsPagination"></div>
        </article>

        <article class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 class="mb-3 text-lg font-black text-slate-950">Directives Rapides du Guide</h2>
          <p class="text-sm leading-6 text-slate-600">Utilisez le panneau d'itinéraire de voyage pour ajouter des consignes sur les points de rassemblement. Informer régulièrement les pèlerins sur les rituels du jour permet de prévenir les égarements dans les foules.</p>
          <button id="allerItineraireBtn" class="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#BC7B3B] px-4 py-3 text-sm font-extrabold text-white transition hover:opacity-90">
            <i class="fa-solid fa-clock"></i> Allez au créateur d'itinéraire
          </button>
        </article>
      </div>
    </section>
  `;

  document.getElementById("allerItineraireBtn").addEventListener("click", () => navigate("itineraire"));

  let page = 1;
  const draw = () => {
    const totalPages = Math.max(1, Math.ceil(pelerins.length / PELERINS_PER_PAGE));
    if (page > totalPages) page = totalPages;
    const items = pelerins.slice((page - 1) * PELERINS_PER_PAGE, page * PELERINS_PER_PAGE);
    document.getElementById("guidePelerinsList").innerHTML = pelerins.length
      ? items.map((p) => `
          <div class="flex items-center justify-between rounded-2xl bg-[#F2F2DE]/60 px-4 py-3">
            <div>
              <p class="font-bold text-slate-800">${escapeHtml(utilisateurMap[p.utilisateurId]?.nomComplet || "-")}</p>
              <p class="text-xs text-slate-500">Passeport : ${escapeHtml(p.numeroPasseport)}</p>
            </div>
            ${visaBadge(p)}
          </div>`).join("")
      : `<p class="text-sm text-slate-400">Aucun pèlerin dans ce groupe.</p>`;
    const pagEl = document.getElementById("guidePelerinsPagination");
    pagEl.innerHTML = pagination(page, totalPages);
    bindPagination(pagEl, (p) => { page = p; draw(); });
  };
  draw();
}
