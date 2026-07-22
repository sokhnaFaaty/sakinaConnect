// pages/groupesPage.js
import { pageHeader } from "../components/pageHeader.js";
import { renderTable } from "../components/table.js";
import { openModal, openConfirm } from "../components/modal.js";
import { openDrawer } from "../components/drawer.js";
import { viewToggle, bindViewToggle, getSavedView, saveView } from "../components/viewToogle.js";
import { showToast } from "../components/toast.js";
import { escapeHtml } from "../utils/html.js";
import { showError, hideError, validateField } from "../utils/formValidator.js";
import {
  getGroupes,
  createGroupe,
  updateGroupe,
  deleteGroupe,
} from "../services/groupeService.js";
import { getPelerins } from "../services/pelerinService.js";
import { getUtilisateurs } from "../services/utilisateurService.js";
import { getGuides } from "../services/guideService.js";
import { getHotels } from "../services/hotelService.js";

// ---------- Corps du formulaire groupe ----------
  let currentView = "table";
function groupeFormBody(groupe, guides, hotels, utilisateurMap) {
  const optionsGuides = guides
    .map((g) => {
      const nom = utilisateurMap[g.utilisateurId]?.nomComplet || g.id;
      return `<option value="${escapeHtml(g.id)}" ${groupe?.guideId === g.id ? "selected" : ""}>${escapeHtml(nom)}</option>`;
    })
    .join("");

  const optionsHotels = (selectedId) =>
    hotels
      .map((h) => `<option value="${escapeHtml(h.id)}" ${selectedId === h.id ? "selected" : ""}>${escapeHtml(h.nom)}</option>`)
      .join("");

  return `
    <div>
      <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="grpNom">Nom du Groupe *</label>
      <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" type="text" id="grpNom" value="${escapeHtml(groupe?.nom || "")}" placeholder="Ex: Groupe A1" />
      <p id="grpNomError" class="mt-1 hidden text-xs text-rose-600"></p>
    </div>

    <div>
      <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="grpGuide">Guide responsable *</label>
      <select class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" id="grpGuide">
        <option value="">Choisir un guide</option>
        ${optionsGuides}
      </select>
      <p id="grpGuideError" class="mt-1 hidden text-xs text-rose-600"></p>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="grpHotelMecque">Hôtel Mecque *</label>
        <select class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" id="grpHotelMecque">
          <option value="">Ex: Fairmont Clock Tower</option>
          ${optionsHotels(groupe?.hotelMecqueId)}
        </select>
        <p id="grpHotelMecqueError" class="mt-1 hidden text-xs text-rose-600"></p>
      </div>
      <div>
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="grpHotelMedine">Hôtel Médine *</label>
        <select class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" id="grpHotelMedine">
          <option value="">Ex: Anwar Al Madina Hotel</option>
          ${optionsHotels(groupe?.hotelMedineId)}
        </select>
        <p id="grpHotelMedineError" class="mt-1 hidden text-xs text-rose-600"></p>
      </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="grpDateDepart">Date de Départ *</label>
        <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" type="date" id="grpDateDepart" value="${escapeHtml(groupe?.dateDepart || "")}" />
        <p id="grpDateDepartError" class="mt-1 hidden text-xs text-rose-600"></p>
      </div>
      <div>
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="grpDateRetour">Date de Retour *</label>
        <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" type="date" id="grpDateRetour" value="${escapeHtml(groupe?.dateRetour || "")}" />
        <p id="grpDateRetourError" class="mt-1 hidden text-xs text-rose-600"></p>
      </div>
    </div>
  `;
}

function openGroupeForm(groupe, guides, hotels, utilisateurMap) {
  openDrawer({
    title: groupe ? "Modifier le groupe de Voyage" : "Ajouter un groupe de Voyage",
    icon: "fa-people-group",
    body: groupeFormBody(groupe, guides, hotels, utilisateurMap),
    confirmLabel: groupe ? "Mettre à jour" : "Enregistrer",
    onConfirm: async (modal) => {
      const nom = modal.querySelector("#grpNom").value.trim();
      const guideId = modal.querySelector("#grpGuide").value;
      const hotelMecqueId = modal.querySelector("#grpHotelMecque").value;
      const hotelMedineId = modal.querySelector("#grpHotelMedine").value;
      const dateDepart = modal.querySelector("#grpDateDepart").value;
      const dateRetour = modal.querySelector("#grpDateRetour").value;

      let hasError = false;
      const checks = [
        [nom, "grpNom", "grpNomError", "Le nom du groupe"],
        [guideId, "grpGuide", "grpGuideError", "Le guide"],
        [hotelMecqueId, "grpHotelMecque", "grpHotelMecqueError", "L'hôtel à la Mecque"],
        [hotelMedineId, "grpHotelMedine", "grpHotelMedineError", "L'hôtel à Médine"],
        [dateDepart, "grpDateDepart", "grpDateDepartError", "La date de départ"],
        [dateRetour, "grpDateRetour", "grpDateRetourError", "La date de retour"],
      ];
      checks.forEach(([value, inputId, errorId, label]) => {
        const error = validateField(value, label);
        if (error) { showError(inputId, errorId, error); hasError = true; }
        else hideError(inputId, errorId);
      });
      if (hasError) return false;

      try {
        if (groupe) {
          await updateGroupe(groupe.id, { nom, guideId, hotelMecqueId, hotelMedineId, dateDepart, dateRetour });
          showToast("Groupe modifié avec succès.");
        } else {
          await createGroupe({ nom, guideId, hotelMecqueId, hotelMedineId, dateDepart, dateRetour });
          showToast("Groupe créé avec succès.");
        }
        await renderGroupesPage();
        return true;
      } catch (error) {
        showToast(error.message, "error");
        return false;
      }
    },
  });
}

// ---------- Modale : liste en lecture seule des pèlerins du groupe ----------
function groupeDetailBody(groupe, guides, hotels, pelerins, utilisateurMap) {
  const guide = guides.find((g) => g.id === groupe.guideId);
  const guideNom = guide ? utilisateurMap[guide.utilisateurId]?.nomComplet : "-";
  const hotelMecque = hotels.find((h) => h.id === groupe.hotelMecqueId)?.nom || "-";
  const hotelMedine = hotels.find((h) => h.id === groupe.hotelMedineId)?.nom || "-";
  const pelerinsDuGroupe = pelerins.filter((p) => p.groupeId === groupe.id);

  const membres = pelerinsDuGroupe
    .map((p) => {
      const nom = utilisateurMap[p.utilisateurId]?.nomComplet || "-";
      return `
        <div class="flex items-center justify-between border-b border-slate-100 py-2 text-sm last:border-0">
          <span class="font-bold text-slate-800">${escapeHtml(nom)}</span>
          <span class="text-xs text-slate-500">Passeport : ${escapeHtml(p.numeroPasseport)} &nbsp; ID : ${escapeHtml(p.id.slice(0, 6).toUpperCase())}</span>
        </div>
      `;
    })
    .join("");

  return `
    <div class="grid gap-4 sm:grid-cols-2">
      <div class="rounded-2xl bg-[#F2F2DE] p-5 ">
       <p class="mb-3 flex items-center gap-2 text-sm font-extrabold text-slate-800">
  <i class="fa-solid fa-user text-[#07744E]"></i> Informations générales
</p>
        <dl class="grid gap-2 text-sm">
          <div class="flex justify-between"><dt class="text-slate-500">ID du groupe :</dt><dd class="font-semibold">${escapeHtml(groupe.id.slice(0, 6).toUpperCase())}</dd></div>
          <div class="flex justify-between"><dt class="text-slate-500">Nom :</dt><dd class="font-semibold">${escapeHtml(groupe.nom)}</dd></div>
          <div class="flex justify-between"><dt class="text-slate-500">Guide responsable :</dt><dd class="font-semibold">${escapeHtml(guideNom)}</dd></div>
          <div class="flex justify-between"><dt class="text-slate-500">Pèlerins inscrits :</dt><dd class="font-semibold">${pelerinsDuGroupe.length}</dd></div>
        </dl>
      </div>
      <div class="rounded-2xl bg-[#F2F2DE] p-4">
        <p class="mb-3 flex items-center gap-2 text-sm font-extrabold text-slate-800">
          <i class="fa-solid fa-location-dot text-[#07744E]"></i> Informations de voyage
        </p>
        <dl class="grid gap-2 text-sm">
          <div class="flex justify-between"><dt class="text-slate-500">Hôtel Mecque :</dt><dd class="font-semibold">${escapeHtml(hotelMecque)}</dd></div>
          <div class="flex justify-between"><dt class="text-slate-500">Hôtel Médine :</dt><dd class="font-semibold">${escapeHtml(hotelMedine)}</dd></div>
          <div class="flex justify-between"><dt class="text-slate-500">Jour de départ :</dt><dd class="font-semibold">${escapeHtml(groupe.dateDepart)}</dd></div>
          <div class="flex justify-between"><dt class="text-slate-500">Jour de retour :</dt><dd class="font-semibold">${escapeHtml(groupe.dateRetour)}</dd></div>
        </dl>
      </div>
    </div>

    <div class="mt-4">
      <p class="mb-3 flex items-center gap-2 text-sm font-extrabold text-slate-800">
        <i class="fa-solid fa-users text-[#07744E]"></i> Membres du groupe (${pelerinsDuGroupe.length})
      </p>
      <div class="rounded-2xl border border-slate-200 p-4">
        ${membres || `<p class="text-sm text-slate-400">Aucun pèlerin dans ce groupe pour l'instant.</p>`}
      </div>
    </div>
  `;
}

function openGroupeDetail(groupe, guides, hotels, pelerins, utilisateurMap) {
  openModal({
    title: `Détail du ${escapeHtml(groupe.nom)}`,
    icon: "fa-people-group",
    iconClass: "bg-transparent text-slate-700 text-lg",
    body: groupeDetailBody(groupe, guides, hotels, pelerins, utilisateurMap),
    confirmLabel: "Fermer",
    cancelLabel: null,
    maxWidth: "max-w-2xl",
    onConfirm: async () => true,
  });
}
// ---------- Page principale ----------

export async function renderGroupesPage() {
  const app = document.getElementById("app");

  const [groupes, guides, hotels, pelerins, utilisateurs] = await Promise.all([
    getGroupes(),
    getGuides(),
    getHotels(),
    getPelerins(),
    getUtilisateurs(),
  ]);

  const utilisateurMap = Object.fromEntries(utilisateurs.map((u) => [u.id, u]));
  const hotelMap = Object.fromEntries(hotels.map((h) => [h.id, h.nom]));

  // Compte le nombre de pèlerins par groupe (calculé localement)
  const nbPelerinsParGroupe = {};
  pelerins.forEach((p) => {
    if (p.groupeId) {
      nbPelerinsParGroupe[p.groupeId] = (nbPelerinsParGroupe[p.groupeId] || 0) + 1;
    }
  });

  const guideNom = (g) => {
    const guide = guides.find((guide) => guide.id === g.guideId);
    return utilisateurMap[guide?.utilisateurId]?.nomComplet || "-";
  };

  const actionsHtml = (g) => `
    <button class="text-slate-500 hover:text-slate-800" data-view-pelerins="${escapeHtml(g.id)}" title="Voir">
      <i class="fa-solid fa-eye"></i>
    </button>
    <button class="text-indigo-500 hover:text-indigo-700" data-edit="${escapeHtml(g.id)}" title="Modifier">
      <i class="fa-solid fa-pen"></i>
    </button>
    <button class="text-rose-500 hover:text-rose-700" data-delete="${escapeHtml(g.id)}" title="Supprimer">
      <i class="fa-solid fa-trash"></i>
    </button>`;

  const tableHtml = () => `
    <article class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      ${renderTable({
        rows: groupes,
        emptyMessage: "Aucun groupe enregistré.",
        columns: [
          { label: "ID", render: (g) => `<span class="text-xs font-bold text-slate-400">${escapeHtml(g.id.slice(0, 6).toUpperCase())}</span>` },
          { label: "Nom du groupe", render: (g) => `<strong class="font-bold text-slate-950">${escapeHtml(g.nom)}</strong>` },
          { label: "Guide responsable", render: (g) => escapeHtml(guideNom(g)) },
          { label: "Nombre de pèlerins", render: (g) => `${nbPelerinsParGroupe[g.id] || 0} pèlerins` },
          { label: "Actions", render: (g) => `<div class="flex items-center gap-3 text-base">${actionsHtml(g)}</div>` },
        ],
      })}
    </article>`;

  const cardsHtml = () => groupes.length
    ? `<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        ${groupes.map((g) => `
          <article class="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div class="flex-1 p-5">
              <div class="mb-2 flex items-start justify-between gap-2">
                <h3 class="font-black text-slate-950">${escapeHtml(g.nom)}</h3>
                <span class="rounded-md bg-[#F2F2DE] px-2 py-0.5 text-xs font-bold text-[#333D2A]">${escapeHtml(g.id.slice(0, 6).toUpperCase())}</span>
              </div>
              <div class="mt-3 grid gap-2 text-sm text-slate-600">
                <p class="flex items-center gap-2"><i class="fa-solid fa-user-tie w-4 text-[#333D2A]"></i> ${escapeHtml(guideNom(g))}</p>
                <p class="flex items-center gap-2"><i class="fa-solid fa-users w-4 text-[#333D2A]"></i> ${nbPelerinsParGroupe[g.id] || 0} pèlerins</p>
                <p class="flex items-center gap-2"><i class="fa-solid fa-plane-departure w-4 text-[#333D2A]"></i> ${escapeHtml(g.dateDepart || "-")} → ${escapeHtml(g.dateRetour || "-")}</p>
              </div>
            </div>
            <div class="flex items-center justify-end gap-3 bg-[#F2F2DE]/70 px-5 py-3 text-base">${actionsHtml(g)}</div>
          </article>
        `).join("")}
      </div>`
    : `<div class="rounded-[2rem] border border-slate-200 bg-white p-10 text-center text-sm text-slate-400 shadow-sm">Aucun groupe enregistré.</div>`;

  app.innerHTML = `
    <section>
      ${pageHeader({
        kicker: "Organisation",
        title: "Liste des Groupes",
        subtitle: "Créer les groupes, assigner un guide et consulter les pèlerins affectés.",
        actionLabel: "Nouveau groupe",
        actionId: "addGroupeBtn",
        actionIcon: "fa-plus",
      })}
      <div class="mb-4 flex justify-end" id="grpToggle"></div>
      <div id="grpList"></div>
    </section>
  `;

  document.getElementById("addGroupeBtn").addEventListener("click", () => openGroupeForm(null, guides, hotels, utilisateurMap));

  let view = getSavedView("groupes", "table");
  const draw = () => {
    const toggleEl = document.getElementById("grpToggle");
    toggleEl.innerHTML = viewToggle(view);
    document.getElementById("grpList").innerHTML = view === "card" ? cardsHtml() : tableHtml();
    bindViewToggle(toggleEl, (v) => { view = v; saveView("groupes", v); draw(); });
    bindGroupeRowEvents(groupes, guides, hotels, pelerins, utilisateurMap);
  };
  draw();
}

function bindGroupeRowEvents(groupes, guides, hotels, pelerins, utilisateurMap) {
  document.querySelectorAll("[data-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      const groupe = groupes.find((g) => g.id === button.dataset.edit);
      if (groupe) openGroupeForm(groupe, guides, hotels, utilisateurMap);
    });
  });

  document.querySelectorAll("[data-view-pelerins]").forEach((button) => {
    button.addEventListener("click", () => {
      const groupe = groupes.find((g) => g.id === button.dataset.viewPelerins);
      if (groupe) openGroupeDetail(groupe, guides, hotels, pelerins, utilisateurMap);
    });
  });

  document.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.delete;
      const groupe = groupes.find((g) => g.id === id);
      openConfirm({
        title: "Confirmer la suppression",
        message: `Êtes-vous sûr de vouloir supprimer le groupe<br/><strong>${escapeHtml(groupe?.nom || "")}</strong> ?<br/><span class="text-xs text-amber-600">Il sera archivé et pourra être restauré.</span>`,
        onConfirm: async () => {
          try {
            await deleteGroupe(id);
            showToast("Groupe archivé.");
            await renderGroupesPage();
          } catch (error) {
            showToast(error.message, "error");
          }
        },
      });
    });
  });
}

