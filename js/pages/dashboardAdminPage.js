// pages/dashboardAdminPage.js — Console du Siège Sakina (ADMIN)
import { renderSosPanel } from "../components/sosPanel.js";
import { pagination, bindPagination } from "../components/pagination.js";
import { showToast } from "../components/toast.js";
import { escapeHtml } from "../utils/html.js";
import { navigate } from "../router.js";
import { getPelerins } from "../services/pelerinService.js";
import { getGroupes } from "../services/groupeService.js";
import { getGuides } from "../services/guideService.js";
import { getSos } from "../services/sosService.js";
import { getUtilisateurs } from "../services/utilisateurService.js";
import { getAnnonces } from "../services/annonceService.js";

const BULLETINS_PER_PAGE = 3;

function statCard({ label, valeur, sousTexte, icon, accent = "text-[#333D2A]", borderAccent = "border-slate-200" }) {
  return `
    <article class="rounded-3xl border-b-4 ${borderAccent} border border-slate-200 bg-white p-5 shadow-sm">
      <div class="mb-3 flex items-center justify-between">
        <p class="text-xs font-extrabold uppercase tracking-widest text-slate-400">${escapeHtml(label)}</p>
        <i class="fa-solid ${icon} ${accent}"></i>
      </div>
      <p class="text-3xl font-black text-slate-950">${valeur}</p>
      <p class="mt-2 text-xs text-slate-400">${escapeHtml(sousTexte)}</p>
    </article>`;
}

export async function renderDashboardAdminPage() {
  const app = document.getElementById("app");

  const [pelerins, groupes, guides, sos, utilisateurs, annonces] = await Promise.all([
    getPelerins(),
    getGroupes(),
    getGuides(),
    getSos(),
    getUtilisateurs(),
    getAnnonces(),
  ]);

  const pelerinMap = Object.fromEntries(pelerins.map((p) => [p.id, p]));
  const utilisateurMap = Object.fromEntries(utilisateurs.map((u) => [u.id, u]));
  const guideMap = Object.fromEntries(guides.map((g) => [g.id, g]));
  const nomResolver = (pelerinId) =>
    utilisateurMap[pelerinMap[pelerinId]?.utilisateurId]?.nomComplet || "Pèlerin inconnu";

  const sosActifs = sos.filter((s) => s.statut === "EN_ATTENTE");
  const problemesVisa = pelerins.filter((p) => p.statutVisa !== "APPROUVE").length;
  const guidesAssignes = new Set(groupes.map((g) => g.guideId).filter(Boolean)).size;

  const auteurAnnonce = (a) => {
    let u = a.auteurId ? utilisateurMap[a.auteurId] : null;
    if (!u && a.guideId && guideMap[a.guideId]) u = utilisateurMap[guideMap[a.guideId].utilisateurId];
    return u?.nomComplet || "Auteur";
  };

  app.innerHTML = `
    <section>
      <header class="mb-6 rounded-3xl bg-[#333D2A] p-6 text-white shadow-sm sm:p-7">
        <span class="inline-block rounded-full bg-[#BC7B3B] px-3 py-1 text-xs font-black uppercase tracking-wider">Administration Système</span>
        <h1 class="mt-3 font-display text-2xl font-black tracking-tight sm:text-3xl">Console du Siège Sakina</h1>
        <p class="mt-1 max-w-2xl text-sm text-slate-300">Suivi logistique en temps réel, validations des documents et secours SOS actifs.</p>
      </header>

      <div class="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        ${statCard({ label: "Total des pèlerins", valeur: pelerins.length, sousTexte: "Actifs avant départ & sur place", icon: "fa-users", borderAccent: "border-b-[#333D2A]" })}
        ${statCard({ label: "Problèmes de visa", valeur: problemesVisa, sousTexte: "En cours / manquants", icon: "fa-file-circle-exclamation", accent: "text-amber-500", borderAccent: "border-b-amber-500" })}
        ${statCard({ label: "SOS actives", valeur: sosActifs.length, sousTexte: "Secours immédiat requis !", icon: "fa-circle-exclamation", accent: "text-rose-600", borderAccent: "border-b-rose-600" })}
        ${statCard({ label: "Guides assignés", valeur: guidesAssignes, sousTexte: "Actifs avant départ & sur place", icon: "fa-user-tie", borderAccent: "border-b-[#333D2A]" })}
      </div>

      <div class="grid gap-6 lg:grid-cols-2">
        <div id="adminSosContainer" class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"></div>

        <article class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="flex items-center gap-2 text-lg font-black text-slate-950"><i class="fa-solid fa-bell text-[#333D2A]"></i> Bulletins Système Actifs</h2>
            <button id="gererPostsBtn" class="text-sm font-bold text-[#BC7B3B] hover:underline">Gérer les Posts</button>
          </div>
          <div id="bulletinsList" class="grid gap-3"></div>
          <div id="bulletinsPagination"></div>
        </article>
      </div>
    </section>
  `;

  document.getElementById("gererPostsBtn").addEventListener("click", () => navigate("annonces"));

  // Moniteur d'Urgence SOS (paginé + résolution) via le composant partagé
  renderSosPanel("adminSosContainer", sosActifs, nomResolver, renderDashboardAdminPage);

  // Bulletins (annonces) paginés
  let page = 1;
  const drawBulletins = () => {
    const totalPages = Math.max(1, Math.ceil(annonces.length / BULLETINS_PER_PAGE));
    if (page > totalPages) page = totalPages;
    const items = annonces.slice((page - 1) * BULLETINS_PER_PAGE, page * BULLETINS_PER_PAGE);
    document.getElementById("bulletinsList").innerHTML = annonces.length
      ? items.map((a) => `
          <div class="rounded-2xl border ${a.urgence ? "border-l-4 border-l-[#B40909]" : ""} border-slate-100 bg-slate-50 p-4">
            <div class="mb-1 flex items-center justify-between gap-2">
              <p class="font-bold text-slate-800">${escapeHtml(a.titre)}</p>
              ${a.urgence ? `<span class="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-black text-rose-700">URGENT</span>` : ""}
            </div>
            <p class="text-xs text-slate-500 line-clamp-2">${escapeHtml(a.contenu)}</p>
            <p class="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">${escapeHtml(auteurAnnonce(a))} · ${escapeHtml((a.datePublication || "").slice(0, 10))}</p>
          </div>`).join("")
      : `<p class="text-sm text-slate-400">Aucun communiqué publié.</p>`;
    const pagEl = document.getElementById("bulletinsPagination");
    pagEl.innerHTML = pagination(page, totalPages);
    bindPagination(pagEl, (p) => { page = p; drawBulletins(); });
  };
  drawBulletins();
}
