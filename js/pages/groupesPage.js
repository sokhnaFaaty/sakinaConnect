// pages/groupesPage.js
import { pageHeader } from "../components/pageHeader.js";
import { renderTable } from "../components/table.js";
import { openModal, openConfirm } from "../components/modal.js";
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
function groupeFormBody(groupe, guides, hotels, utilisateurMap) {
  const optionsGuides = guides
    .map((g) => {
      const nom = utilisateurMap[g.utilisateurId]?.nomComplet || g.idGuide;
      return `<option value="${escapeHtml(g.idGuide)}" ${groupe?.guideId === g.idGuide ? "selected" : ""}>${escapeHtml(nom)}</option>`;
    })
    .join("");

  const optionsHotels = (selectedId) =>
    hotels
      .map((h) => `<option value="${escapeHtml(h.idHotel)}" ${selectedId === h.idHotel ? "selected" : ""}>${escapeHtml(h.nom)} (${escapeHtml(h.ville)})</option>`)
      .join("");

  return `
    <div>
      <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="grpNom">Nom du groupe *</label>
      <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" type="text" id="grpNom" value="${escapeHtml(groupe?.nom || "")}" placeholder="ex: Groupe A-1" />
      <p id="grpNomError" class="mt-1 hidden text-xs text-rose-600"></p>
    </div>

    <div>
      <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="grpGuide">Guide assigné *</label>
      <select class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" id="grpGuide">
        <option value="">-- Choisir un guide --</option>
        ${optionsGuides}
      </select>
      <p id="grpGuideError" class="mt-1 hidden text-xs text-rose-600"></p>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="grpHotelMecque">Hôtel à la Mecque *</label>
        <select class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" id="grpHotelMecque">
          <option value="">-- Choisir --</option>
          ${optionsHotels(groupe?.hotelMecqueId)}
        </select>
        <p id="grpHotelMecqueError" class="mt-1 hidden text-xs text-rose-600"></p>
      </div>
      <div>
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="grpHotelMedine">Hôtel à Médine *</label>
        <select class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" id="grpHotelMedine">
          <option value="">-- Choisir --</option>
          ${optionsHotels(groupe?.hotelMedineId)}
        </select>
        <p id="grpHotelMedineError" class="mt-1 hidden text-xs text-rose-600"></p>
      </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="grpDateDepart">Date de départ *</label>
        <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" type="date" id="grpDateDepart" value="${escapeHtml(groupe?.dateDepart || "")}" />
        <p id="grpDateDepartError" class="mt-1 hidden text-xs text-rose-600"></p>
      </div>
      <div>
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="grpDateRetour">Date de retour *</label>
        <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" type="date" id="grpDateRetour" value="${escapeHtml(groupe?.dateRetour || "")}" />
        <p id="grpDateRetourError" class="mt-1 hidden text-xs text-rose-600"></p>
      </div>
    </div>
  `;
}

function openGroupeForm(groupe, guides, hotels, utilisateurMap) {
  openModal({
    title: groupe ? "Modifier le groupe" : "Nouveau groupe",
    icon: "fa-people-group",
    body: groupeFormBody(groupe, guides, hotels, utilisateurMap),
    confirmLabel: groupe ? "Enregistrer" : "Créer",
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
        if (error) {
          showError(inputId, errorId, error);
          hasError = true;
        } else {
          hideError(inputId, errorId);
        }
      });

      if (hasError) return false;

      try {
        if (groupe) {
          await updateGroupe(groupe.idGroupe, { nom, guideId, hotelMecqueId, hotelMedineId, dateDepart, dateRetour });
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
function pelerinsDuGroupeBody(groupe, pelerins, utilisateurMap) {
  const pelerinsDuGroupe = pelerins.filter((p) => p.groupeId === groupe.idGroupe);

  const rows = pelerinsDuGroupe
    .map((p) => {
      const nom = utilisateurMap[p.utilisateurId]?.nomComplet || p.numeroPasseport;
      return `
        <div class="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-2.5 text-sm">
          <span>${escapeHtml(nom)} <span class="text-xs text-slate-400">(${escapeHtml(p.numeroPasseport)})</span></span>
          <span class="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">${escapeHtml(p.statutVisa)}</span>
        </div>
      `;
    })
    .join("");

  return `
    <p class="mb-3 text-sm text-slate-600">Pèlerins affectés au groupe <strong>${escapeHtml(groupe.nom)}</strong> :</p>
    <div class="grid max-h-80 gap-2 overflow-y-auto">
      ${rows || `<p class="text-sm text-slate-400">Aucun pèlerin affecté à ce groupe pour l'instant.</p>`}
    </div>
    <p class="mt-3 text-xs text-slate-400">
      L'affectation d'un pèlerin à un groupe se fait à sa création et ne peut plus être modifiée ensuite.
    </p>
  `;
}

function openPelerinsDuGroupe(groupe, pelerins, utilisateurMap) {
  openModal({
    title: "Pèlerins du groupe",
    icon: "fa-user-group",
    body: pelerinsDuGroupeBody(groupe, pelerins, utilisateurMap),
    confirmLabel: "Fermer",
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
  const hotelMap = Object.fromEntries(hotels.map((h) => [h.idHotel, h.nom]));

  // Compte le nombre de pèlerins par groupe (calculé localement)
  const nbPelerinsParGroupe = {};
  pelerins.forEach((p) => {
    if (p.groupeId) {
      nbPelerinsParGroupe[p.groupeId] = (nbPelerinsParGroupe[p.groupeId] || 0) + 1;
    }
  });

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

      <article class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        ${renderTable({
          rows: groupes,
          emptyMessage: "Aucun groupe enregistré.",
          columns: [
            { label: "Nom du groupe", render: (g) => `<strong class="font-bold text-slate-950">${escapeHtml(g.nom)}</strong>` },
            {
              label: "Guide assigné",
              render: (g) => {
                const guide = guides.find((guide) => guide.idGuide === g.guideId);
                const nom = guide ? utilisateurMap[guide.utilisateurId]?.nomComplet : "-";
                return escapeHtml(nom || "-");
              },
            },
            { label: "Hôtel Mecque", render: (g) => escapeHtml(hotelMap[g.hotelMecqueId] || "-") },
            { label: "Hôtel Médine", render: (g) => escapeHtml(hotelMap[g.hotelMedineId] || "-") },
            { label: "Date départ", render: (g) => escapeHtml(g.dateDepart) },
            { label: "Date retour", render: (g) => escapeHtml(g.dateRetour) },
            { label: "Nb pèlerins", render: (g) => String(nbPelerinsParGroupe[g.idGroupe] || 0) },
            {
              label: "Actions",
              render: (g) => `
                <div class="flex flex-wrap gap-2">
                  <button class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold" data-view-pelerins="${escapeHtml(g.idGroupe)}">
                    <i class="fa-solid fa-eye"></i> Voir pèlerins
                  </button>
                  <button class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold" data-edit="${escapeHtml(g.idGroupe)}">
                    <i class="fa-solid fa-pen"></i>
                  </button>
                  <button class="rounded-xl bg-rose-600 px-3 py-2 text-xs font-extrabold text-white" data-delete="${escapeHtml(g.idGroupe)}">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
              `,
            },
          ],
        })}
      </article>
    </section>
  `;

  bindGroupeEvents(groupes, guides, hotels, pelerins, utilisateurMap);
}

function bindGroupeEvents(groupes, guides, hotels, pelerins, utilisateurMap) {
  document.getElementById("addGroupeBtn").addEventListener("click", () => openGroupeForm(null, guides, hotels, utilisateurMap));

  document.querySelectorAll("[data-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      const groupe = groupes.find((g) => g.idGroupe === button.dataset.edit);
      if (groupe) openGroupeForm(groupe, guides, hotels, utilisateurMap);
    });
  });

  document.querySelectorAll("[data-view-pelerins]").forEach((button) => {
    button.addEventListener("click", () => {
      const groupe = groupes.find((g) => g.idGroupe === button.dataset.viewPelerins);
      if (groupe) openPelerinsDuGroupe(groupe, pelerins, utilisateurMap);
    });
  });

  document.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.delete;
      openConfirm({
        message: "Voulez-vous supprimer ce groupe ?",
        onConfirm: async () => {
          try {
            await deleteGroupe(id);
            showToast("Groupe supprimé.");
            await renderGroupesPage();
          } catch (error) {
            showToast(error.message, "error");
          }
        },
      });
    });
  });
}