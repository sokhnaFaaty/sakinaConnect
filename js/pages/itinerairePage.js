// pages/itinerairePage.js
import { pageHeader } from "../components/pageHeader.js";
import { openDrawer } from "../components/drawer.js";
import { openConfirm } from "../components/modal.js";
import { showToast } from "../components/toast.js";
import { escapeHtml } from "../utils/html.js";
import { showError, hideError, validateField } from "../utils/formValidator.js";
import { getSession, getUserRole } from "../utils/auth.js";
import { getGuideByUtilisateurId, getGroupeDuGuide } from "../services/guideService.js";
import { getGroupes } from "../services/groupeService.js";
import { getCategories } from "../services/categorieService.js";
import {
  getPlanningDuGroupe,
  createPlanningEvent,
  updatePlanningEvent,
  deletePlanningEvent,
} from "../services/planningService.js";
import { creerCarte, centrerCarteSur } from "../components/leafletMap.js";

const EVENEMENTS_PAR_PAGE = 2;

// État de la page (filtres et pagination courants)
let etatPage = {
  planning: [],
  categories: [],
  groupeId: null,
  filtreJour: "tous",
  filtreCategorie: "tous",
  pageActuelle: 1,
};

export async function renderItinerairePage() {
  const app = document.getElementById("app");
  const user = getSession();
  const role = getUserRole();

  let groupesDisponibles = [];
  let groupeSelectionne = null;

  if (role === "GUIDE") {
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
    groupesDisponibles = [groupe];
    groupeSelectionne = groupe;
  } else {
    groupesDisponibles = await getGroupes();
    groupeSelectionne = groupesDisponibles[0] || null;
  }

  if (!groupeSelectionne) {
    app.innerHTML = `<section class="rounded-[2rem] border border-slate-200 bg-white p-8 text-center"><p class="text-sm font-semibold text-slate-500">Aucun groupe disponible.</p></section>`;
    return;
  }

  const categories = await getCategories();

  const selecteurGroupe = role === "ADMIN" && groupesDisponibles.length > 1
    ? `
      <div class="mb-4">
        <select id="selectGroupeItineraire" class="w-full max-w-xs rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm">
          ${groupesDisponibles.map((g) => `<option value="${escapeHtml(g.id)}">${escapeHtml(g.nom)}</option>`).join("")}
        </select>
      </div>
    `
    : "";

  app.innerHTML = `
    <section>
      ${pageHeader({
        kicker: "Voyage",
        title: "Itinéraire de voyages & Rituels",
        subtitle: "Chronologie épurée détaillant la logistique, le transport et les instructions spirituelles.",
        actionLabel: "Ajouter un Evenement",
        actionId: "addEvenementBtn",
        actionIcon: "fa-plus",
      })}

      ${selecteurGroupe}

      <div class="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <div class="mb-4 rounded-[2rem] border border-slate-200 bg-white p-5">
            <p class="mb-2 text-xs font-extrabold uppercase tracking-widest text-slate-400">Filtrer par jour</p>
            <div id="filtresJour" class="flex flex-wrap gap-2"></div>

            <p class="mb-2 mt-4 text-xs font-extrabold uppercase tracking-widest text-slate-400">Catégories</p>
            <div id="filtresCategorie" class="flex flex-wrap gap-2"></div>
          </div>

          <div id="listeEvenements" class="grid gap-4"></div>
          <div id="paginationEvenements" class="mt-4 flex items-center justify-center gap-2"></div>
        </div>

        <div class="h-[500px] overflow-hidden rounded-[2rem] border border-slate-200 lg:sticky lg:top-20">
          <div id="carteItineraire" class="h-full w-full"></div>
        </div>
      </div>
    </section>
  `;

  etatPage = {
    planning: await getPlanningDuGroupe(groupeSelectionne.id),
    categories,
    groupeId: groupeSelectionne.id,
    filtreJour: "tous",
    filtreCategorie: "tous",
    pageActuelle: 1,
  };

  afficherFiltresJour();
  afficherFiltresCategorie();
  rafraichirAffichage();
  initialiserCarteAvecPremierEvenement();

  document.getElementById("addEvenementBtn").addEventListener("click", () => ouvrirFormulaireEvenement(null));

  const select = document.getElementById("selectGroupeItineraire");
  if (select) {
    select.addEventListener("change", async () => {
      etatPage.groupeId = select.value;
      etatPage.planning = await getPlanningDuGroupe(select.value);
      etatPage.pageActuelle = 1;
      afficherFiltresJour();
      rafraichirAffichage();
      initialiserCarteAvecPremierEvenement();
    });
  }
}

// ---------- Filtres ----------

function afficherFiltresJour() {
  const joursUniques = [...new Set(etatPage.planning.map((e) => e.date))].sort();
  const container = document.getElementById("filtresJour");

  const boutons = [`<button data-jour="tous" class="filtre-jour-btn rounded-xl px-3 py-1.5 text-xs font-bold">Tout le voyage</button>`]
    .concat(joursUniques.map((jour, index) => `<button data-jour="${escapeHtml(jour)}" class="filtre-jour-btn rounded-xl px-3 py-1.5 text-xs font-bold">Jour ${index + 1}</button>`));

  container.innerHTML = boutons.join("");

  container.querySelectorAll(".filtre-jour-btn").forEach((bouton) => {
    bouton.addEventListener("click", () => {
      etatPage.filtreJour = bouton.dataset.jour;
      etatPage.pageActuelle = 1;
      rafraichirAffichage();
    });
  });

  appliquerStyleFiltresActifs();
}

function afficherFiltresCategorie() {
  const container = document.getElementById("filtresCategorie");

  const boutons = [`<button data-cat="tous" class="filtre-cat-btn rounded-xl px-3 py-1.5 text-xs font-bold">Tous</button>`]
    .concat(etatPage.categories.map((c) => `<button data-cat="${escapeHtml(c.idCategorie)}" class="filtre-cat-btn rounded-xl px-3 py-1.5 text-xs font-bold">${escapeHtml(c.libelle)}</button>`));

  container.innerHTML = boutons.join("");

  container.querySelectorAll(".filtre-cat-btn").forEach((bouton) => {
    bouton.addEventListener("click", () => {
      etatPage.filtreCategorie = bouton.dataset.cat;
      etatPage.pageActuelle = 1;
      rafraichirAffichage();
    });
  });

  appliquerStyleFiltresActifs();
}

function appliquerStyleFiltresActifs() {
  document.querySelectorAll(".filtre-jour-btn").forEach((bouton) => {
    const actif = bouton.dataset.jour === etatPage.filtreJour;
    bouton.classList.toggle("bg-[#333D2A]", actif);
    bouton.classList.toggle("text-white", actif);
    bouton.classList.toggle("bg-slate-100", !actif);
    bouton.classList.toggle("text-slate-600", !actif);
  });

  document.querySelectorAll(".filtre-cat-btn").forEach((bouton) => {
    const actif = bouton.dataset.cat === etatPage.filtreCategorie;
    bouton.classList.toggle("bg-[#333D2A]", actif);
    bouton.classList.toggle("text-white", actif);
    bouton.classList.toggle("bg-slate-100", !actif);
    bouton.classList.toggle("text-slate-600", !actif);
  });
}

// ---------- Liste + pagination ----------

function getEvenementsFiltres() {
  return etatPage.planning.filter((e) => {
    const passeFiltreJour = etatPage.filtreJour === "tous" || e.date === etatPage.filtreJour;
    const passeFiltreCategorie = etatPage.filtreCategorie === "tous" || e.categorieId === etatPage.filtreCategorie;
    return passeFiltreJour && passeFiltreCategorie;
  });
}

function rafraichirAffichage() {
  appliquerStyleFiltresActifs();

  const evenementsFiltres = getEvenementsFiltres();
  const totalPages = Math.max(1, Math.ceil(evenementsFiltres.length / EVENEMENTS_PAR_PAGE));
  if (etatPage.pageActuelle > totalPages) etatPage.pageActuelle = totalPages;

  const debut = (etatPage.pageActuelle - 1) * EVENEMENTS_PAR_PAGE;
  const evenementsPage = evenementsFiltres.slice(debut, debut + EVENEMENTS_PAR_PAGE);

  const container = document.getElementById("listeEvenements");
  const categorieMap = Object.fromEntries(etatPage.categories.map((c) => [c.idCategorie, c.libelle]));

  container.innerHTML = evenementsPage.length
    ? evenementsPage.map((e) => carteEvenement(e, categorieMap)).join("")
    : `<p class="text-sm text-slate-400">Aucun événement pour ce filtre.</p>`;

  container.querySelectorAll("[data-modifier]").forEach((bouton) => {
    bouton.addEventListener("click", () => {
      const evenement = etatPage.planning.find((e) => e.id === bouton.dataset.modifier);
      if (evenement) ouvrirFormulaireEvenement(evenement);
    });
  });

  container.querySelectorAll("[data-supprimer]").forEach((bouton) => {
    bouton.addEventListener("click", () => {
      const id = bouton.dataset.supprimer;
      openConfirm({
        title: "Confirmer la suppression",
        message: "Êtes-vous sûr de vouloir supprimer cet événement ?",
        onConfirm: async () => {
          try {
            await deletePlanningEvent(id);
            showToast("Événement supprimé.");
            etatPage.planning = await getPlanningDuGroupe(etatPage.groupeId);
            rafraichirAffichage();
          } catch (error) {
            showToast(error.message, "error");
          }
        },
      });
    });
  });

  container.querySelectorAll("[data-voir-carte]").forEach((bouton) => {
    bouton.addEventListener("click", () => {
      const evenement = etatPage.planning.find((e) => e.id === bouton.dataset.voirCarte);
      if (evenement && evenement.latitude && evenement.longitude) {
        centrerCarteSur(evenement.latitude, evenement.longitude, evenement.titre);
      } else {
        showToast("Position non définie pour cet événement.", "error");
      }
    });
  });

  afficherPagination(totalPages);
}

function carteEvenement(evenement, categorieMap) {
  // Calcule "Jour X" à partir du rang de sa date parmi les jours uniques triés
  const joursUniques = [...new Set(etatPage.planning.map((e) => e.date))].sort();
  const numeroJour = joursUniques.indexOf(evenement.date) + 1;
  const categorieLabel = categorieMap[evenement.categorieId] || "";

  return `
    <div class="rounded-2xl border border-slate-200 bg-white p-5">
      <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <span class="rounded-full bg-[#333D2A] px-2.5 py-0.5 text-[10px] font-black uppercase text-white">Jour ${numeroJour}</span>
          <span class="text-xs font-bold text-slate-400">${escapeHtml(evenement.heure)}</span>
          <span class="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">${escapeHtml(categorieLabel)}</span>
        </div>
        <button data-voir-carte="${escapeHtml(evenement.id)}" class="flex items-center gap-1 text-xs font-bold text-[#333D2A] hover:underline">
          <i class="fa-solid fa-location-dot"></i> ${escapeHtml(evenement.lieu)}
        </button>
      </div>

      ${evenement.etapeGuide ? `
        <div class="mb-2 rounded-xl bg-[#F2F2DE] px-3 py-2 text-xs font-semibold text-[#333D2A]">
          Étape de guidage : ${escapeHtml(evenement.etapeGuide)}
        </div>
      ` : ""}

      <h3 class="font-black text-slate-900">${escapeHtml(evenement.titre)}</h3>
      <p class="mt-1 text-sm text-slate-500">${escapeHtml(evenement.description)}</p>

      <div class="mt-3 flex gap-4 text-xs font-extrabold">
        <button data-modifier="${escapeHtml(evenement.id)}" class="text-amber-600 hover:underline">Modifier</button>
        <button data-supprimer="${escapeHtml(evenement.id)}" class="text-rose-600 hover:underline">Supprimer</button>
      </div>
    </div>
  `;
}

function afficherPagination(totalPages) {
  const container = document.getElementById("paginationEvenements");

  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  const boutons = [];
  boutons.push(`<button data-page-nav="prev" class="h-8 w-8 rounded-full text-xs font-bold text-slate-500 hover:bg-slate-100"><i class="fa-solid fa-chevron-left"></i></button>`);
  for (let page = 1; page <= totalPages; page++) {
    boutons.push(`<button data-page-nav="${page}" class="h-8 w-8 rounded-full text-xs font-bold transition ${
      page === etatPage.pageActuelle ? "bg-[#333D2A] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
    }">${page}</button>`);
  }
  boutons.push(`<button data-page-nav="next" class="h-8 w-8 rounded-full text-xs font-bold text-slate-500 hover:bg-slate-100"><i class="fa-solid fa-chevron-right"></i></button>`);

  container.innerHTML = boutons.join("");

  container.querySelectorAll("[data-page-nav]").forEach((bouton) => {
    bouton.addEventListener("click", () => {
      const valeur = bouton.dataset.pageNav;
      if (valeur === "prev") etatPage.pageActuelle = Math.max(1, etatPage.pageActuelle - 1);
      else if (valeur === "next") etatPage.pageActuelle = Math.min(totalPages, etatPage.pageActuelle + 1);
      else etatPage.pageActuelle = Number(valeur);
      rafraichirAffichage();
    });
  });
}

// ---------- Carte ----------

function initialiserCarteAvecPremierEvenement() {
  const premierAvecPosition = etatPage.planning.find((e) => e.latitude && e.longitude);
  if (premierAvecPosition) {
    creerCarte("carteItineraire", premierAvecPosition.latitude, premierAvecPosition.longitude);
  } else {
    document.getElementById("carteItineraire").innerHTML = `<div class="flex h-full items-center justify-center text-sm text-slate-400">Aucune position définie pour ce voyage.</div>`;
  }
}

// ---------- Formulaire (drawer) Ajouter/Modifier ----------

function corpsFormulaireEvenement(evenement) {
  const optionsCategories = etatPage.categories
    .map((c) => `<option value="${escapeHtml(c.idCategorie)}" ${evenement?.categorieId === c.idCategorie ? "selected" : ""}>${escapeHtml(c.libelle)}</option>`)
    .join("");

  // Calcule le numéro de jour existant (nombre simple, comme dans ta maquette "Jour de Voyage (Numéro)")
  const joursUniques = [...new Set(etatPage.planning.map((e) => e.date))].sort();
  const numeroJourActuel = evenement ? joursUniques.indexOf(evenement.date) + 1 : "";

  return `
    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="evtJour">Jour de Voyage (Numéro)</label>
        <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" type="text" id="evtJour" value="${escapeHtml(String(numeroJourActuel))}" placeholder="Ex: 1" />
      </div>
      <div>
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="evtHeure">Heure (ex: 14h 30 ou 08h 00)</label>
        <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" type="text" id="evtHeure" value="${escapeHtml(evenement?.heure || "")}" placeholder="08h 00" />
        <p id="evtHeureError" class="mt-1 hidden text-xs text-rose-600"></p>
      </div>
    </div>

    <div>
      <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="evtDate">Date de l'événement *</label>
      <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" type="date" id="evtDate" value="${escapeHtml(evenement?.date || "")}" />
      <p id="evtDateError" class="mt-1 hidden text-xs text-rose-600"></p>
    </div>

    <div>
      <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="evtTitre">Titre de l'événement *</label>
      <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" type="text" id="evtTitre" value="${escapeHtml(evenement?.titre || "")}" />
      <p id="evtTitreError" class="mt-1 hidden text-xs text-rose-600"></p>
    </div>

    <div>
      <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="evtLieu">Nom de Lieu *</label>
      <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" type="text" id="evtLieu" value="${escapeHtml(evenement?.lieu || "")}" />
      <p id="evtLieuError" class="mt-1 hidden text-xs text-rose-600"></p>
    </div>

    <div>
      <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="evtCategorie">Catégorie *</label>
      <select class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" id="evtCategorie">
        <option value="">-- Choisir --</option>
        ${optionsCategories}
      </select>
      <p id="evtCategorieError" class="mt-1 hidden text-xs text-rose-600"></p>
    </div>

    <div>
      <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="evtEtapeGuide">Guide ou étape spirituel</label>
      <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" type="text" id="evtEtapeGuide" value="${escapeHtml(evenement?.etapeGuide || "")}" />
    </div>

    <div>
      <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="evtDescription">Description</label>
      <textarea class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" id="evtDescription" rows="3">${escapeHtml(evenement?.description || "")}</textarea>
    </div>
  `;
}

function ouvrirFormulaireEvenement(evenement) {
  openDrawer({
    title: evenement ? "Modifier l'evenement" : "Ajouter un evenement",
    icon: "fa-calendar-day",
    body: corpsFormulaireEvenement(evenement),
    confirmLabel: evenement ? "Enregistrer l'itineraire" : "Enregistrer l'itineraire",
    onConfirm: async (overlay) => {
      const date = overlay.querySelector("#evtDate").value;
      const heure = overlay.querySelector("#evtHeure").value.trim();
      const titre = overlay.querySelector("#evtTitre").value.trim();
      const lieu = overlay.querySelector("#evtLieu").value.trim();
      const categorieId = overlay.querySelector("#evtCategorie").value;
      const etapeGuide = overlay.querySelector("#evtEtapeGuide").value.trim();
      const description = overlay.querySelector("#evtDescription").value.trim();

      let hasError = false;
      const checks = [
        [date, "evtDate", "evtDateError", "La date"],
        [heure, "evtHeure", "evtHeureError", "L'heure"],
        [titre, "evtTitre", "evtTitreError", "Le titre"],
        [lieu, "evtLieu", "evtLieuError", "Le lieu"],
        [categorieId, "evtCategorie", "evtCategorieError", "La catégorie"],
      ];
      checks.forEach(([value, inputId, errorId, label]) => {
        const error = validateField(value, label);
        if (error) { showError(inputId, errorId, error); hasError = true; }
        else hideError(inputId, errorId);
      });
      if (hasError) return false;

      try {
        if (evenement) {
          await updatePlanningEvent(evenement.id, { date, heure, titre, lieu, categorieId, etapeGuide, description });
          showToast("Événement modifié avec succès.");
        } else {
          await createPlanningEvent({ date, heure, titre, lieu, categorieId, etapeGuide, description, groupeId: etatPage.groupeId });
          showToast("Événement créé avec succès.");
        }
        etatPage.planning = await getPlanningDuGroupe(etatPage.groupeId);
        afficherFiltresJour();
        rafraichirAffichage();
        return true;
      } catch (error) {
        showToast(error.message, "error");
        return false;
      }
    },
  });
}