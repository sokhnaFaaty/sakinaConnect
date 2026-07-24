// pages/validationPage.js — File d'attente de modération (ADMIN)
// Regroupe les communiqués ET les événements d'itinéraire soumis par les guides,
// et permet à l'admin de les approuver ou de les rejeter (avec motif).
import { pageHeader } from "../components/pageHeader.js";
import { openModal } from "../components/modal.js";
import { showToast } from "../components/toast.js";
import { escapeHtml } from "../utils/html.js";
import { showError, hideError, validateField } from "../utils/formValidator.js";
import {
  getAnnoncesEnAttente,
  approuverAnnonce,
  rejeterAnnonce,
} from "../services/annonceService.js";
import {
  getPlanningEnAttente,
  approuverPlanningEvent,
  rejeterPlanningEvent,
} from "../services/planningService.js";
import { getUtilisateurs } from "../services/utilisateurService.js";
import { getGroupes } from "../services/groupeService.js";
import { getCategories } from "../services/categorieService.js";

// Modale de rejet : le motif est obligatoire (il sera affiché au guide auteur).
function ouvrirRejet(onRejeter) {
  openModal({
    title: "Rejeter la publication",
    icon: "fa-circle-xmark",
    iconClass: "bg-rose-100 text-rose-600",
    confirmLabel: "Confirmer le rejet",
    confirmIcon: "fa-ban",
    confirmClass: "bg-rose-600 shadow-rose-200 hover:bg-rose-700",
    body: `
      <div>
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="motifRejet">Motif du rejet *</label>
        <textarea class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" id="motifRejet" rows="3" placeholder="Explique au guide pourquoi sa publication est refusée..."></textarea>
        <p id="motifRejetError" class="mt-1 hidden text-xs text-rose-600"></p>
      </div>
    `,
    onConfirm: async (modal) => {
      const motif = modal.querySelector("#motifRejet").value.trim();
      const err = validateField(motif, "Le motif");
      if (err) { showError("motifRejet", "motifRejetError", err); return false; }
      hideError("motifRejet", "motifRejetError");
      try {
        await onRejeter(motif);
        return true;
      } catch (error) {
        showToast(error.message, "error");
        return false;
      }
    },
  });
}

export async function renderValidationPage() {
  const app = document.getElementById("app");

  const [annonces, evenements, utilisateurs, groupes, categories] = await Promise.all([
    getAnnoncesEnAttente(),
    getPlanningEnAttente(),
    getUtilisateurs(),
    getGroupes(),
    getCategories(),
  ]);

  const utilisateurMap = Object.fromEntries(utilisateurs.map((u) => [u.id, u]));
  const groupeMap = Object.fromEntries(groupes.map((g) => [g.id, g.nom]));
  const categorieMap = Object.fromEntries(categories.map((c) => [c.id, c.libelle]));

  const auteurNom = (id) => utilisateurMap[id]?.nomComplet || "Auteur inconnu";
  const groupeNom = (id) => (id ? (groupeMap[id] || "Groupe inconnu") : "Tous les pèlerins");

  const total = annonces.length + evenements.length;

  // Boutons d'action communs (approuver / rejeter)
  const actions = (type, id) => `
    <div class="mt-4 flex flex-wrap gap-3">
      <button data-approuver="${type}:${escapeHtml(id)}" class="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-emerald-700">
        <i class="fa-solid fa-check"></i> Approuver
      </button>
      <button data-rejeter="${type}:${escapeHtml(id)}" class="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-extrabold text-rose-600 transition hover:bg-rose-50">
        <i class="fa-solid fa-ban"></i> Rejeter
      </button>
    </div>
  `;

  const carteAnnonce = (a) => `
    <article class="rounded-3xl border border-slate-200 ${a.urgence ? "border-l-4 border-l-[#B40909]" : ""} bg-white p-5 shadow-sm">
      <div class="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span class="rounded-full bg-violet-100 px-2.5 py-0.5 font-bold text-violet-700"><i class="fa-solid fa-bullhorn"></i> Communiqué</span>
        <span class="rounded-full bg-sky-100 px-2.5 py-0.5 font-bold text-sky-700"><i class="fa-solid fa-people-group"></i> ${escapeHtml(groupeNom(a.groupeId))}</span>
        ${a.urgence ? `<span class="rounded-full bg-rose-100 px-2.5 py-0.5 font-black text-rose-700">Urgent</span>` : ""}
        <span class="ml-auto"><i class="fa-regular fa-user"></i> ${escapeHtml(auteurNom(a.auteurId))}</span>
      </div>
      <h3 class="font-black text-slate-950">${escapeHtml(a.titre)}</h3>
      <p class="mt-1 whitespace-pre-line text-sm text-slate-600">${escapeHtml(a.contenu)}</p>
      ${actions("annonce", a.id)}
    </article>
  `;

  const carteEvenement = (e) => `
    <article class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span class="rounded-full bg-teal-100 px-2.5 py-0.5 font-bold text-teal-700"><i class="fa-solid fa-route"></i> Événement</span>
        <span class="rounded-full bg-sky-100 px-2.5 py-0.5 font-bold text-sky-700"><i class="fa-solid fa-people-group"></i> ${escapeHtml(groupeNom(e.groupeId))}</span>
        <span class="rounded-full bg-amber-100 px-2.5 py-0.5 font-bold text-amber-700">${escapeHtml(categorieMap[e.categorieId] || "")}</span>
        <span class="ml-auto"><i class="fa-regular fa-user"></i> ${escapeHtml(auteurNom(e.auteurId))}</span>
      </div>
      <h3 class="font-black text-slate-950">${escapeHtml(e.titre)}</h3>
      <div class="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-500">
        <span><i class="fa-regular fa-calendar"></i> ${escapeHtml(e.date)}</span>
        <span><i class="fa-regular fa-clock"></i> ${escapeHtml(e.heure)}</span>
        <span><i class="fa-solid fa-location-dot"></i> ${escapeHtml(e.lieu)}</span>
      </div>
      ${e.description ? `<p class="mt-2 text-sm text-slate-600">${escapeHtml(e.description)}</p>` : ""}
      ${actions("evenement", e.id)}
    </article>
  `;

  const section = (titre, icone, items, rendu) => `
    <section class="mb-8">
      <h2 class="mb-3 flex items-center gap-2 text-lg font-black text-slate-950">
        <i class="fa-solid ${icone} text-[#333D2A]"></i> ${escapeHtml(titre)}
        <span class="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-black text-slate-600">${items.length}</span>
      </h2>
      ${items.length
        ? `<div class="grid gap-4">${items.map(rendu).join("")}</div>`
        : `<div class="rounded-[2rem] border border-slate-200 bg-white p-8 text-center text-sm text-slate-400 shadow-sm">Rien à valider ici.</div>`}
    </section>
  `;

  app.innerHTML = `
    <section>
      ${pageHeader({
        kicker: "Modération",
        title: "Publications à valider",
        subtitle: total > 0
          ? `${total} publication(s) de guides en attente de ta validation.`
          : "Aucune publication en attente. Tout est à jour.",
      })}
      ${section("Communiqués en attente", "fa-bullhorn", annonces, carteAnnonce)}
      ${section("Événements d'itinéraire en attente", "fa-route", evenements, carteEvenement)}
    </section>
  `;

  // ----- Actions -----
  app.querySelectorAll("[data-approuver]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const [type, id] = btn.dataset.approuver.split(":");
      try {
        if (type === "annonce") await approuverAnnonce(id);
        else await approuverPlanningEvent(id);
        showToast("Publication approuvée.");
        await renderValidationPage();
      } catch (error) {
        showToast(error.message, "error");
      }
    });
  });

  app.querySelectorAll("[data-rejeter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const [type, id] = btn.dataset.rejeter.split(":");
      ouvrirRejet(async (motif) => {
        if (type === "annonce") await rejeterAnnonce(id, motif);
        else await rejeterPlanningEvent(id, motif);
        showToast("Publication rejetée.");
        await renderValidationPage();
      });
    });
  });
}
