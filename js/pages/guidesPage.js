// pages/guidesPage.js — Annuaire des Guides (ADMIN)
import { pageHeader } from "../components/pageHeader.js";
import { renderTable } from "../components/table.js";
import { openDrawer } from "../components/drawer.js";
import { openConfirm, openInfoCopy } from "../components/modal.js";
import { viewToggle, bindViewToggle, getSavedView, saveView } from "../components/viewToogle.js";
import { showToast } from "../components/toast.js";
import { escapeHtml } from "../utils/html.js";
import { showError, hideError, validateField } from "../utils/formValidator.js";
import { validateEmailFormat, validateTelephone } from "../utils/validators.js";
import { emailExiste, telephoneExiste } from "../services/validationService.js";
import {
  getGuides,
  createGuide,
  updateGuide,
  deleteGuide,
} from "../services/guideService.js";
import { getUtilisateurs } from "../services/utilisateurService.js";
import { getGroupes } from "../services/groupeService.js";
import { uploadUserPhoto } from "../services/cloudinaryService.js";

// ---------- Corps du formulaire guide ----------
function guideFormBody(guide, utilisateur) {
  return `
    <div>
      <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="guideNom">Nom complet de l'Oustadh *</label>
      <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" type="text" id="guideNom" value="${escapeHtml(utilisateur?.nomComplet || "")}" placeholder="Ex: Oustadh Massaer Mboup" />
      <p id="guideNomError" class="mt-1 hidden text-xs text-rose-600"></p>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="guideTel">Téléphone de Contact *</label>
        <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" type="text" id="guideTel" value="${escapeHtml(utilisateur?.telephone || "")}" placeholder="77 123 45 67" />
        <p id="guideTelError" class="mt-1 hidden text-xs text-rose-600"></p>
      </div>
      <div>
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="guideEmail">Email *</label>
        <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" type="email" id="guideEmail" value="${escapeHtml(utilisateur?.email || "")}" placeholder="email@gmail.com" />
        <p id="guideEmailError" class="mt-1 hidden text-xs text-rose-600"></p>
      </div>
    </div>

    <div>
      <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="guidePhoto">Image (facultatif)</label>
      <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm" type="file" id="guidePhoto" accept="image/*" />
      <p id="guidePhotoError" class="mt-1 hidden text-xs text-rose-600"></p>
    </div>

    <label class="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
      <span>Actuellement en Service actif (Sur place)</span>
      <input type="checkbox" id="guideDispo" class="h-5 w-5 accent-[#333D2A]" ${guide ? (guide.disponibilite ? "checked" : "") : "checked"} />
    </label>
  `;
}

function openGuideForm(guide, utilisateurMap, onDone) {
  const utilisateur = guide ? utilisateurMap[guide.utilisateurId] : null;

  openDrawer({
    title: guide ? "Modifier un Guide" : "Ajouter un Guide",
    icon: "fa-user-tie",
    body: guideFormBody(guide, utilisateur),
    confirmLabel: guide ? "Mettre à jour" : "Sauvegarder le guide",
    onConfirm: async (overlay) => {
      const nomComplet = overlay.querySelector("#guideNom").value.trim();
      const telephone = overlay.querySelector("#guideTel").value.trim();
      const email = overlay.querySelector("#guideEmail").value.trim();
      const disponibilite = overlay.querySelector("#guideDispo").checked;

      let hasError = false;
      // Présence du nom
      const nomError = validateField(nomComplet, "Le nom complet");
      if (nomError) { showError("guideNom", "guideNomError", nomError); hasError = true; }
      else hideError("guideNom", "guideNomError");
      // Format email
      const emailError = validateEmailFormat(email);
      if (emailError) { showError("guideEmail", "guideEmailError", emailError); hasError = true; }
      else hideError("guideEmail", "guideEmailError");
      // Format téléphone (Sénégal ou Arabie Saoudite)
      const telError = validateTelephone(telephone);
      if (telError) { showError("guideTel", "guideTelError", telError); hasError = true; }
      else hideError("guideTel", "guideTelError");
      if (hasError) return false;

      // Unicité email / téléphone (exclut le compte courant en édition)
      const excludeUserId = guide ? guide.utilisateurId : null;
      if (await emailExiste(email, excludeUserId)) {
        showError("guideEmail", "guideEmailError", "Cet email est déjà utilisé.");
        return false;
      }
      if (await telephoneExiste(telephone, excludeUserId)) {
        showError("guideTel", "guideTelError", "Ce téléphone est déjà utilisé.");
        return false;
      }

      // Upload photo éventuelle
      let photoUrl = "";
      const file = overlay.querySelector("#guidePhoto")?.files?.[0];
      if (file) {
        try {
          const result = await uploadUserPhoto(file);
          photoUrl = result.photoUrl;
        } catch (error) {
          showError("guidePhoto", "guidePhotoError", error.message);
          return false;
        }
      }

      try {
        if (guide) {
          await updateGuide(guide.id, {
            utilisateurId: guide.utilisateurId,
            nomComplet,
            email,
            telephone,
            disponibilite,
            photo: photoUrl,
          });
          showToast("Guide modifié avec succès.");
          await onDone();
        } else {
          const { motDePasseGenere } = await createGuide({
            nomComplet,
            email,
            telephone,
            disponibilite,
            photo: photoUrl,
          });
          showToast("Guide créé avec succès.");
          await onDone();
          setTimeout(() => {
            openInfoCopy({
              title: "Compte guide créé",
              message: `Le compte de <strong>${escapeHtml(nomComplet)}</strong> a été créé. Communique-lui ce mot de passe temporaire :`,
              value: motDePasseGenere,
              onCopy: () => showToast("Mot de passe copié."),
            });
          }, 200);
        }
        return true;
      } catch (error) {
        showToast(error.message, "error");
        return false;
      }
    },
  });
}

// ---------- Carte d'un guide ----------
function guideCard(guide, utilisateur, groupesDuGuide) {
  const nom = utilisateur?.nomComplet || "Guide inconnu";
  const badge = guide.disponibilite
    ? `<span class="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-black text-emerald-700">En Service</span>`
    : `<span class="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-black text-slate-500">Indisponible</span>`;

  const groupesLabel = groupesDuGuide.length
    ? groupesDuGuide.map((g) => escapeHtml(g.nom)).join(", ")
    : "Aucun groupe assigné";

  return `
    <article class="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div class="flex-1 p-5">
        <div class="mb-2 flex items-start justify-between gap-2">
          <h3 class="font-black text-slate-950">${escapeHtml(nom)}</h3>
          ${badge}
        </div>
        <span class="inline-block rounded-md bg-[#F2F2DE] px-2 py-0.5 text-xs font-bold text-[#333D2A]">${escapeHtml(guide.id.slice(0, 6).toUpperCase())}</span>

        <div class="mt-4 grid gap-2 text-sm text-slate-600">
          <p class="flex items-center gap-2"><i class="fa-solid fa-phone w-4 text-[#333D2A]"></i> ${escapeHtml(utilisateur?.telephone || "-")}</p>
          <p class="flex items-center gap-2"><i class="fa-solid fa-envelope w-4 text-[#333D2A]"></i> ${escapeHtml(utilisateur?.email || "-")}</p>
        </div>
      </div>

      <div class="flex items-center justify-between gap-2 bg-[#F2F2DE]/70 px-5 py-3">
        <div>
          <p class="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Groupe assigné</p>
          <p class="text-sm font-bold text-slate-800">${groupesLabel}</p>
        </div>
        <div class="flex items-center gap-3 text-base">
          <button class="text-indigo-500 hover:text-indigo-700" data-edit-guide="${escapeHtml(guide.id)}" title="Modifier">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="text-rose-500 hover:text-rose-700" data-delete-guide="${escapeHtml(guide.id)}" title="Archiver">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    </article>
  `;
}

// ---------- Page principale ----------
export async function renderGuidesPage() {
  const app = document.getElementById("app");

  const [guides, utilisateurs, groupes] = await Promise.all([
    getGuides(),
    getUtilisateurs(),
    getGroupes(),
  ]);

  const utilisateurMap = Object.fromEntries(utilisateurs.map((u) => [u.id, u]));
  const groupesParGuide = {};
  groupes.forEach((g) => {
    if (g.guideId) {
      (groupesParGuide[g.guideId] = groupesParGuide[g.guideId] || []).push(g);
    }
  });
  const groupesLabel = (guide) => {
    const gs = groupesParGuide[guide.id] || [];
    return gs.length ? gs.map((g) => g.nom).join(", ") : "Aucun groupe assigné";
  };

  const actionsHtml = (guide) => `
    <button class="text-indigo-500 hover:text-indigo-700" data-edit-guide="${escapeHtml(guide.id)}" title="Modifier">
      <i class="fa-solid fa-pen"></i>
    </button>
    <button class="text-rose-500 hover:text-rose-700" data-delete-guide="${escapeHtml(guide.id)}" title="Archiver">
      <i class="fa-solid fa-trash"></i>
    </button>`;

  const cardsHtml = () => guides.length
    ? `<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        ${guides.map((guide) => guideCard(guide, utilisateurMap[guide.utilisateurId], groupesParGuide[guide.id] || [])).join("")}
      </div>`
    : `<div class="rounded-[2rem] border border-slate-200 bg-white p-10 text-center text-sm text-slate-400 shadow-sm">Aucun guide enregistré pour l'instant.</div>`;

  const tableHtml = () => `
    <article class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      ${renderTable({
        rows: guides,
        emptyMessage: "Aucun guide enregistré pour l'instant.",
        columns: [
          { label: "Nom", render: (guide) => `<strong class="font-bold text-slate-950">${escapeHtml(utilisateurMap[guide.utilisateurId]?.nomComplet || "-")}</strong>` },
          { label: "Téléphone", render: (guide) => escapeHtml(utilisateurMap[guide.utilisateurId]?.telephone || "-") },
          { label: "Email", render: (guide) => escapeHtml(utilisateurMap[guide.utilisateurId]?.email || "-") },
          { label: "Disponibilité", render: (guide) => guide.disponibilite
            ? `<span class="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-black text-emerald-700">En Service</span>`
            : `<span class="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-black text-slate-500">Indisponible</span>` },
          { label: "Groupes assignés", render: (guide) => escapeHtml(groupesLabel(guide)) },
          { label: "Actions", render: (guide) => `<div class="flex items-center gap-3 text-base">${actionsHtml(guide)}</div>` },
        ],
      })}
    </article>`;

  app.innerHTML = `
    <section>
      ${pageHeader({
        kicker: "Équipe",
        title: "Guides Spirituels (Oustadhs/Oustadhas)",
        subtitle: "Gérez et affectez les guides et leurs groupes.",
        actionLabel: "Ajouter un guide",
        actionId: "addGuideBtn",
        actionIcon: "fa-user-plus",
      })}
      <div class="mb-4 flex justify-end" id="guideToggle"></div>
      <div id="guideList"></div>
    </section>
  `;

  document.getElementById("addGuideBtn").addEventListener("click", () =>
    openGuideForm(null, utilisateurMap, renderGuidesPage)
  );

  let view = getSavedView("guides", "card");
  const draw = () => {
    const toggleEl = document.getElementById("guideToggle");
    toggleEl.innerHTML = viewToggle(view);
    document.getElementById("guideList").innerHTML = view === "card" ? cardsHtml() : tableHtml();
    bindViewToggle(toggleEl, (v) => { view = v; saveView("guides", v); draw(); });
    bindGuideRowEvents(guides, utilisateurMap);
  };
  draw();
}

function bindGuideRowEvents(guides, utilisateurMap) {
  document.querySelectorAll("[data-edit-guide]").forEach((button) => {
    button.addEventListener("click", () => {
      const guide = guides.find((g) => g.id === button.dataset.editGuide);
      if (guide) openGuideForm(guide, utilisateurMap, renderGuidesPage);
    });
  });

  document.querySelectorAll("[data-delete-guide]").forEach((button) => {
    button.addEventListener("click", () => {
      const guide = guides.find((g) => g.id === button.dataset.deleteGuide);
      const nom = utilisateurMap[guide?.utilisateurId]?.nomComplet || "";
      openConfirm({
        title: "Confirmer la suppression",
        message: `Êtes-vous sûr de vouloir supprimer le guide<br/><strong>${escapeHtml(nom)}</strong> ?<br/><span class="text-xs text-amber-600">Le guide sera archivé et pourra être restauré.</span>`,
        onConfirm: async () => {
          try {
            await deleteGuide(button.dataset.deleteGuide);
            showToast("Guide archivé.");
            await renderGuidesPage();
          } catch (error) {
            showToast(error.message, "error");
          }
        },
      });
    });
  });
}
