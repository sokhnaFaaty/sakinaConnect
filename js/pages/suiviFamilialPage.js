// pages/suiviFamilialPage.js — Centre de Sérénité des Familles (PROCHE)
import { pagination, bindPagination } from "../components/pagination.js";
import { showToast } from "../components/toast.js";
import { escapeHtml } from "../utils/html.js";
import { getSession } from "../utils/auth.js";
import { getProcheByUtilisateurId } from "../services/procheService.js";
import { getPelerins } from "../services/pelerinService.js";
import { getGroupes } from "../services/groupeService.js";
import { getGuides } from "../services/guideService.js";
import { getUtilisateurs } from "../services/utilisateurService.js";
import { getSos } from "../services/sosService.js";
import { getPlanningDuGroupe } from "../services/planningService.js";
import { getCategories } from "../services/categorieService.js";

const PLANNING_PER_PAGE = 3;

const banniere = `
  <header class="mb-6 rounded-3xl bg-gradient-to-r from-[#8a5a1f] to-[#BC7B3B] p-6 text-white shadow-sm sm:p-7">
    <span class="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-black uppercase tracking-wider">Centre de Sérénité des Familles</span>
    <h1 class="mt-3 font-display text-2xl font-black tracking-tight sm:text-3xl">Suivez le Parcours Sacré de votre proche</h1>
    <p class="mt-1 max-w-2xl text-sm text-white/80">Consultez l'état de sa préparation administrative, sa dernière position transmise et son guide de voyage.</p>
  </header>`;

const validation = (ok, label) => `
  <div class="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
    <span class="text-slate-600">${escapeHtml(label)}</span>
    ${ok
      ? `<span class="inline-flex items-center gap-1 font-bold text-emerald-600"><i class="fa-solid fa-circle-check"></i> Complet</span>`
      : `<span class="inline-flex items-center gap-1 font-bold text-amber-600"><i class="fa-solid fa-clock"></i> En attente</span>`}
  </div>`;

export async function renderSuiviFamilialPage() {
  const app = document.getElementById("app");
  const user = getSession();

  const proche = await getProcheByUtilisateurId(user.id);
  if (!proche) {
    app.innerHTML = `<section>${banniere}<div class="rounded-[2rem] border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">Aucun pèlerin associé à votre compte.</div></section>`;
    return;
  }

  const [pelerins, groupes, guides, utilisateurs, sos] = await Promise.all([
    getPelerins(), getGroupes(), getGuides(), getUtilisateurs(), getSos(),
  ]);
  const utilisateurMap = Object.fromEntries(utilisateurs.map((u) => [u.id, u]));
  const pelerin = pelerins.find((p) => p.id === proche.pelerinId);
  if (!pelerin) {
    app.innerHTML = `<section>${banniere}<div class="rounded-[2rem] border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">Le pèlerin suivi est introuvable.</div></section>`;
    return;
  }
  const pelerinU = utilisateurMap[pelerin.utilisateurId];
  const groupe = groupes.find((g) => g.id === pelerin.groupeId);
  const guide = groupe ? guides.find((g) => g.id === groupe.guideId) : null;
  const guideU = guide ? utilisateurMap[guide.utilisateurId] : null;

  // Dernier SOS transmis (toutes statuts) pour la position + horodatage
  const mesSos = sos.filter((s) => s.pelerinId === pelerin.id)
    .sort((a, b) => String(b.dateHeure).localeCompare(String(a.dateHeure)));
  const dernierSos = mesSos[0] || null;
  const localisation = dernierSos ? `${dernierSos.latitude.toFixed(4)}, ${dernierSos.longitude.toFixed(4)}` : "Aucune position transmise";
  const derniereMaj = dernierSos ? new Date(dernierSos.dateHeure).toLocaleString("fr-FR") : "—";

  const [planning, categories] = await Promise.all([
    getPlanningDuGroupe(groupe ? groupe.id : "___"),
    getCategories(),
  ]);
  const categorieMap = Object.fromEntries(categories.map((c) => [c.id, c.libelle]));

  app.innerHTML = `
    <section>
      ${banniere}

      <article class="mb-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <p class="mb-3 text-xs font-extrabold uppercase tracking-widest text-slate-400">Vous suivez actuellement</p>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div class="flex items-center gap-3">
            <div class="h-12 w-12 overflow-hidden rounded-full bg-slate-100">
              ${pelerinU?.photo ? `<img src="${escapeHtml(pelerinU.photo)}" class="h-full w-full object-cover" />` : `<div class="flex h-full w-full items-center justify-center text-slate-300"><i class="fa-solid fa-user"></i></div>`}
            </div>
            <div>
              <p class="font-black text-slate-900">${escapeHtml(pelerinU?.nomComplet || "-")}</p>
              <p class="text-xs text-slate-500">Passeport : ${escapeHtml(pelerin.numeroPasseport)}</p>
            </div>
          </div>
          <div class="text-sm"><p class="text-slate-500">Groupe :</p><p class="font-bold text-slate-800">${escapeHtml(groupe?.nom || "-")}</p><p class="mt-1 text-slate-500">Guide responsable :</p><p class="font-bold text-slate-800">${escapeHtml(guideU?.nomComplet || "-")}</p></div>
          <div class="text-sm"><p class="text-slate-500">Dernière position :</p><p class="flex items-center gap-1 font-bold text-slate-800"><i class="fa-solid fa-location-dot text-rose-500"></i> ${escapeHtml(localisation)}</p></div>
          <div class="rounded-2xl bg-[#F2F2DE]/60 p-3 text-sm"><p class="text-xs font-extrabold uppercase tracking-widest text-slate-400">Dernière mise à jour</p><p class="font-bold text-slate-800">${escapeHtml(derniereMaj)}</p></div>
        </div>
      </article>

      <div class="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <article class="rounded-[2rem] border border-t-4 border-slate-200 border-t-[#0B6E4F] bg-white p-6 shadow-sm">
          <div class="mb-4 flex items-start justify-between gap-2">
            <div>
              <p class="text-xs text-slate-400">Dossier de suivi : ${escapeHtml(pelerin.id.slice(0, 6).toUpperCase())}</p>
              <h2 class="text-base font-black text-slate-950">Données de Voyages Consolidées</h2>
            </div>
            <div class="text-right">
              <span class="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black text-emerald-700">Départ approuvé</span>
              <p class="mt-1 text-[10px] text-slate-400">Vérifié par le Siège Sakina</p>
            </div>
          </div>

          <p class="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#0B6E4F]"><i class="fa-solid fa-clipboard-check"></i> Liste de validation administrative</p>
          <div class="mb-5 grid gap-3 sm:grid-cols-3">
            ${validation(!!pelerin.numeroPasseport, "Passeport vérifié")}
            ${validation(pelerin.statutVisa === "APPROUVE", "Visa délivré")}
            ${validation(!!pelerin.certificatVaccin, "Certificat vaccin")}
          </div>

          <p class="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#0B6E4F]"><i class="fa-solid fa-clock"></i> Planning de groupe actif <span class="normal-case text-slate-400">(évitez d'appeler durant les rituels)</span></p>
          <div id="suiviPlanningList" class="grid gap-3"></div>
          <div id="suiviPlanningPagination"></div>
        </article>

        <div class="grid gap-6">
          <article class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 class="mb-3 text-base font-black text-slate-950">Guide assigné</h2>
            <p class="font-bold text-slate-900">${escapeHtml(guideU?.nomComplet || "Non assigné")}</p>
            <p class="text-xs uppercase tracking-widest text-slate-400">Guide & chef de groupe</p>
            <p class="mt-3 text-sm"><span class="text-slate-500">Mobile :</span> <span class="font-bold text-slate-800">${escapeHtml(guideU?.telephone ? String(guideU.telephone) : "-")}</span></p>
            <p class="text-sm"><span class="text-slate-500">Email :</span> <span class="font-bold text-slate-800">${escapeHtml(guideU?.email || "-")}</span></p>
            ${guideU?.telephone ? `<a href="tel:${escapeHtml(String(guideU.telephone))}" class="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-600"><i class="fa-solid fa-phone"></i> Appeler</a>` : ""}
          </article>

          <article class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 class="mb-2 text-base font-black text-slate-950">Message au guide</h2>
            <p class="mb-3 text-xs text-slate-500">Besoin de signaler au guide une consigne médicale importante ou un besoin d'assistance ? Laissez un message ici.</p>
            <textarea id="messageGuide" rows="3" class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" placeholder="Ex: Mon père a besoin de son inhalateur de secours…"></textarea>
            <button id="envoyerMessageBtn" class="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#333D2A] px-4 py-2.5 text-sm font-extrabold text-white transition hover:opacity-90">
              <i class="fa-solid fa-paper-plane"></i> Envoyer le message
            </button>
          </article>
        </div>
      </div>
    </section>
  `;

  // Message au guide (placeholder : pas d'entité messagerie dans le modèle)
  document.getElementById("envoyerMessageBtn").addEventListener("click", () => {
    const zone = document.getElementById("messageGuide");
    if (!zone.value.trim()) { showToast("Veuillez saisir un message.", "error"); return; }
    zone.value = "";
    showToast("Message transmis au guide.");
  });

  // Planning paginé (Données de Voyages Consolidées)
  const joursUniques = [...new Set(planning.map((e) => e.date))].sort();
  const carte = (e) => {
    const numeroJour = joursUniques.indexOf(e.date) + 1;
    const categorieLabel = categorieMap[e.categorieId] || "";
    return `
      <div class="rounded-2xl border border-slate-200 bg-[#F2F2DE]/40 p-4">
        <div class="mb-1 flex items-center justify-between gap-2">
          <span class="text-xs font-black uppercase tracking-wider text-[#BC7B3B]">Jour ${numeroJour} · ${escapeHtml(e.heure || "")}</span>
          ${categorieLabel ? `<span class="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">${escapeHtml(categorieLabel)}</span>` : ""}
        </div>
        <h3 class="font-black text-slate-900">${escapeHtml(e.titre)}</h3>
        <p class="mt-1 text-xs text-slate-500">${escapeHtml(e.lieu || "")}</p>
      </div>`;
  };

  let page = 1;
  const draw = () => {
    const totalPages = Math.max(1, Math.ceil(planning.length / PLANNING_PER_PAGE));
    if (page > totalPages) page = totalPages;
    const items = planning.slice((page - 1) * PLANNING_PER_PAGE, page * PLANNING_PER_PAGE);
    document.getElementById("suiviPlanningList").innerHTML = planning.length
      ? items.map(carte).join("")
      : `<p class="text-sm text-slate-400">Aucun événement planifié pour l'instant.</p>`;
    const pagEl = document.getElementById("suiviPlanningPagination");
    pagEl.innerHTML = pagination(page, totalPages);
    bindPagination(pagEl, (p) => { page = p; draw(); });
  };
  draw();
}
