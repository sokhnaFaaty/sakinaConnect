// pages/monGroupePelerinPage.js — Mon groupe (côté PELERIN)
import { pageHeader } from "../components/pageHeader.js";
import { pagination, bindPagination } from "../components/pagination.js";
import { escapeHtml } from "../utils/html.js";
import { getSession } from "../utils/auth.js";
import { getPelerinByUtilisateurId } from "../services/pelerinService.js";
import { getGroupes } from "../services/groupeService.js";
import { getPlanningDuGroupe } from "../services/planningService.js";
import { getCategories } from "../services/categorieService.js";

const PLANNING_PER_PAGE = 2;

const badgeEtat = (ok, label, texteOk = "Valide") => `
  <div class="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
    <span class="text-slate-600">${escapeHtml(label)}</span>
    ${ok
      ? `<span class="inline-flex items-center gap-1 font-bold text-emerald-600"><i class="fa-solid fa-circle-check"></i> ${escapeHtml(texteOk)}</span>`
      : `<span class="inline-flex items-center gap-1 font-bold text-amber-600"><i class="fa-solid fa-clock"></i> En attente</span>`}
  </div>`;

export async function renderMonGroupePelerinPage() {
  const app = document.getElementById("app");
  const user = getSession();

  const pelerin = await getPelerinByUtilisateurId(user.id);
  if (!pelerin) {
    app.innerHTML = `<section class="rounded-[2rem] border border-amber-200 bg-amber-50 p-8 text-center"><p class="text-sm font-semibold text-amber-700">Aucun profil pèlerin associé à ce compte.</p></section>`;
    return;
  }

  const groupes = await getGroupes();
  const groupe = groupes.find((g) => g.id === pelerin.groupeId);
  if (!groupe) {
    app.innerHTML = `<section>${pageHeader({ kicker: "Mon voyage", title: "Mon groupe", subtitle: "" })}<div class="rounded-[2rem] border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">Aucun groupe ne t'est encore assigné.</div></section>`;
    return;
  }

  const [planning, categories] = await Promise.all([
    getPlanningDuGroupe(groupe.id),
    getCategories(),
  ]);
  const categorieMap = Object.fromEntries(categories.map((c) => [c.idCategorie, c.libelle]));

  app.innerHTML = `
    <section>
      ${pageHeader({ kicker: "Mon voyage", title: `Mon groupe : ${escapeHtml(groupe.nom)}`, subtitle: "Vos informations enregistrées et état de préparation." })}

      <div class="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <article class="rounded-[2rem] border border-t-4 border-slate-200 border-t-[#0B6E4F] bg-white p-6 shadow-sm">
          <h2 class="mb-4 flex items-center gap-2 text-base font-black text-slate-950"><i class="fa-solid fa-briefcase text-[#333D2A]"></i> Ma fiche Logistique</h2>

          <p class="mb-3 text-xs font-extrabold uppercase tracking-widest text-slate-400">Identité & contact d'urgence</p>
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="rounded-2xl bg-[#F2F2DE]/60 p-4 text-sm">
              <p class="text-slate-500">Nom complet :</p>
              <p class="mb-2 font-bold text-slate-800">${escapeHtml(user.nomComplet || "-")}</p>
              <p class="text-slate-500">Identifiant pèlerin :</p>
              <p class="mb-2 font-bold text-slate-800">${escapeHtml(pelerin.id.slice(0, 6).toUpperCase())}</p>
              <p class="text-slate-500">Numéro de passeport :</p>
              <p class="mb-2 font-bold text-slate-800">${escapeHtml(pelerin.numeroPasseport || "-")}</p>
              <p class="text-slate-500">Contact d'urgence :</p>
              <p class="font-bold text-slate-800">${escapeHtml(pelerin.contactUrgenceNom || "-")}</p>
              <p class="text-slate-600">${escapeHtml(pelerin.contactUrgenceTelephone || "")}</p>
            </div>
            <div class="grid gap-3">
              ${badgeEtat(!!pelerin.numeroPasseport, "Passeport", "Complet")}
              ${badgeEtat(pelerin.statutVisa === "APPROUVE", "Visa de voyage", "Approuvé")}
              ${badgeEtat(!!pelerin.certificatVaccin, "Certification de vaccination", "Valide")}
              ${badgeEtat(false, "Tenue d'Ihram emballée")}
            </div>
          </div>
        </article>

        <article class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 class="mb-4 flex items-center gap-2 text-base font-black text-slate-950"><i class="fa-solid fa-clock text-[#333D2A]"></i> Planning de voyages</h2>
          <div id="planningPelerinList" class="grid gap-3"></div>
          <div id="planningPelerinPagination"></div>
        </article>
      </div>
    </section>
  `;

  const joursUniques = [...new Set(planning.map((e) => e.date))].sort();
  const carte = (e) => {
    const numeroJour = joursUniques.indexOf(e.date) + 1;
    const categorieLabel = categorieMap[e.categorieId] || "";
    return `
      <div class="rounded-2xl border border-slate-200 bg-white p-4">
        <div class="mb-1 flex items-center justify-between gap-2">
          <span class="rounded-full bg-[#333D2A] px-2.5 py-0.5 text-[10px] font-black uppercase text-white">Jour ${numeroJour}</span>
          ${categorieLabel ? `<span class="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">${escapeHtml(categorieLabel)}</span>` : ""}
        </div>
        <h3 class="font-black text-slate-900">${escapeHtml(e.titre)}</h3>
        <p class="mt-1 text-sm text-slate-500">${escapeHtml(e.description || "")}</p>
        <p class="mt-2 flex items-center gap-1 text-xs text-slate-500"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(e.lieu || "-")} · ${escapeHtml(e.heure || "")}</p>
      </div>`;
  };

  let page = 1;
  const draw = () => {
    const totalPages = Math.max(1, Math.ceil(planning.length / PLANNING_PER_PAGE));
    if (page > totalPages) page = totalPages;
    const items = planning.slice((page - 1) * PLANNING_PER_PAGE, page * PLANNING_PER_PAGE);
    document.getElementById("planningPelerinList").innerHTML = planning.length
      ? items.map(carte).join("")
      : `<p class="text-sm text-slate-400">Aucun événement planifié pour l'instant.</p>`;
    const pagEl = document.getElementById("planningPelerinPagination");
    pagEl.innerHTML = pagination(page, totalPages);
    bindPagination(pagEl, (p) => { page = p; draw(); });
  };
  draw();
}
