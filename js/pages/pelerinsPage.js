import { pageHeader } from "../components/pageHeader.js";
import { renderTable } from "../components/table.js";
import { openModal, openConfirm, openInfoCopy } from "../components/modal.js";
import { showToast } from "../components/toast.js";
import { escapeHtml } from "../utils/html.js";
import { showError, hideError, validateField } from "../utils/formValidator.js";
import {
  getPelerins,
  createPelerin,
  updatePelerin,
  deletePelerin,
} from "../services/pelerinService.js";
import { getUtilisateurs } from "../services/utilisateurService.js";
import { createProche } from "../services/procheService.js";
import { getGroupes } from "../services/groupeService.js";
import { uploadUserPhoto } from "../services/cloudinaryService.js";

// ---------- Corps du formulaire ----------
function pelerinFormBody(pelerin = null, groupes = []) {
  const isEdit = pelerin !== null;

  const optionsGroupes = groupes
    .map((g) => `<option value="${escapeHtml(g.idGroupe)}" ${pelerin?.groupeId === g.idGroupe ? "selected" : ""}>${escapeHtml(g.nom)}</option>`)
    .join("");

  return `
    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="pelNomComplet">Nom Complet *</label>
        <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" type="text" id="pelNomComplet" value="${escapeHtml(pelerin?.nomComplet || "")}" placeholder="Nom du pèlerin" ${isEdit ? "readonly" : ""} />
        <p id="pelNomCompletError" class="mt-1 hidden text-xs text-rose-600"></p>
      </div>

      <div>
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="pelPassport">Numéro de Passeport *</label>
        <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" type="text" id="pelPassport" value="${escapeHtml(pelerin?.numeroPasseport || "")}" placeholder="Numéro de passeport" />
        <p id="pelPassportError" class="mt-1 hidden text-xs text-rose-600"></p>
      </div>

      <div>
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="pelStatutVisa">Statut du Visa *</label>
        <select class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" id="pelStatutVisa">
          <option value="EN_ATTENTE" ${pelerin?.statutVisa === "EN_ATTENTE" ? "selected" : ""}>En cours</option>
          <option value="APPROUVE" ${pelerin?.statutVisa === "APPROUVE" ? "selected" : ""}>Approuvé</option>
          <option value="REFUSE" ${pelerin?.statutVisa === "REFUSE" ? "selected" : ""}>Refusé</option>
        </select>
      </div>

      <div>
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="pelGroupe">Numéro de Groupe *</label>
        <select class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" id="pelGroupe">
          <option value="">-- Choisir un groupe --</option>
          ${optionsGroupes}
        </select>
        <p id="pelGroupeError" class="mt-1 hidden text-xs text-rose-600"></p>
      </div>

      ${!isEdit ? `
      <div class="sm:col-span-2">
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="pelPhoto">Image</label>
        <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm" type="file" id="pelPhoto" accept="image/*" />
        <p id="pelPhotoError" class="mt-1 hidden text-xs text-rose-600"></p>
      </div>
      ` : ""}
    </div>

    <div>
      <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="pelInfosMedicales">Problèmes de Santé Chroniques (ex: Asthme, Diabète, Fauteuil roulant)</label>
      <textarea class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" id="pelInfosMedicales" rows="2" placeholder="Texte saisi">${escapeHtml(pelerin?.informationsMedicales || "")}</textarea>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <div>
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="pelContactNom">Contact urgence - Nom *</label>
        <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" type="text" id="pelContactNom" value="${escapeHtml(pelerin?.contactUrgenceNom || "")}" />
        <p id="pelContactNomError" class="mt-1 hidden text-xs text-rose-600"></p>
      </div>
      <div>
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="pelContactTel">Contact urgence - Téléphone *</label>
        <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" type="text" id="pelContactTel" value="${escapeHtml(pelerin?.contactUrgenceTelephone || "")}" />
        <p id="pelContactTelError" class="mt-1 hidden text-xs text-rose-600"></p>
      </div>
    </div>

    ${!isEdit ? `
    <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p class="mb-3 text-sm font-extrabold text-slate-800">Ajouter un Proche ?</p>
      <div class="flex gap-4">
        <label class="flex items-center gap-2 text-sm">
          <input type="radio" name="ajouterProche" id="procheOui" value="oui" />
          OUI
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input type="radio" name="ajouterProche" id="procheNon" value="non" checked />
          NON
        </label>
      </div>

      <div id="procheFields" class="mt-4 hidden grid gap-4 sm:grid-cols-2">
        <div>
          <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="procheNomComplet">Nom Complet *</label>
          <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" type="text" id="procheNomComplet" placeholder="Entrez le nom du proche" />
          <p id="procheNomCompletError" class="mt-1 hidden text-xs text-rose-600"></p>
        </div>
        <div>
          <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="procheTelephone">Téléphone *</label>
          <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" type="text" id="procheTelephone" placeholder="Entrez le téléphone" />
          <p id="procheTelephoneError" class="mt-1 hidden text-xs text-rose-600"></p>
        </div>
        <div>
          <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="procheEmail">Email (facultatif)</label>
          <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" type="email" id="procheEmail" placeholder="Entrez l'email du proche" />
        </div>
        <div>
          <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="procheLien">Lien de Parenté *</label>
          <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" type="text" id="procheLien" placeholder="Entrez le lien de parenté" />
          <p id="procheLienError" class="mt-1 hidden text-xs text-rose-600"></p>
        </div>
      </div>
    </div>
    ` : ""}
  `;
}

// Affiche/cache la section proche selon le radio choisi
function attachProcheToggle(modal) {
  const radios = modal.querySelectorAll('input[name="ajouterProche"]');
  const fields = modal.querySelector("#procheFields");
  if (!radios.length || !fields) return;

  radios.forEach((radio) => {
    radio.addEventListener("change", () => {
      if (modal.querySelector("#procheOui").checked) {
        fields.classList.remove("hidden");
      } else {
        fields.classList.add("hidden");
      }
    });
  });
}

// ---------- Formulaire principal ----------
async function openPelerinForm(pelerin = null) {
  const groupes = await getGroupes();

  openModal({
    title: pelerin ? "Modifier un Pèlerin" : "Ajouter un Pèlerin",
    icon: "fa-user",
    body: pelerinFormBody(pelerin, groupes),
    confirmLabel: pelerin ? "Enregistrer" : "Sauvegarder le profil",
    onMount: (overlay) => attachProcheToggle(overlay),
    onConfirm: async (modal) => {
      const nomComplet = modal.querySelector("#pelNomComplet").value.trim();
      const numeroPasseport = modal.querySelector("#pelPassport").value.trim();
      const statutVisa = modal.querySelector("#pelStatutVisa").value;
      const groupeId = modal.querySelector("#pelGroupe").value;
      const informationsMedicales = modal.querySelector("#pelInfosMedicales").value.trim();
      const contactUrgenceNom = modal.querySelector("#pelContactNom").value.trim();
      const contactUrgenceTelephone = modal.querySelector("#pelContactTel").value.trim();

      let hasError = false;

      const checks = [
        [nomComplet, "pelNomComplet", "pelNomCompletError", "Le nom complet"],
        [numeroPasseport, "pelPassport", "pelPassportError", "Le numéro de passeport"],
        [groupeId, "pelGroupe", "pelGroupeError", "Le groupe"],
        [contactUrgenceNom, "pelContactNom", "pelContactNomError", "Le nom du contact d'urgence"],
        [contactUrgenceTelephone, "pelContactTel", "pelContactTelError", "Le téléphone du contact d'urgence"],
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

      const procheOui = modal.querySelector("#procheOui")?.checked;
      let procheData = null;

      if (procheOui) {
        const procheNomComplet = modal.querySelector("#procheNomComplet").value.trim();
        const procheTelephone = modal.querySelector("#procheTelephone").value.trim();
        const procheEmail = modal.querySelector("#procheEmail").value.trim();
        const procheLien = modal.querySelector("#procheLien").value.trim();

        const procheChecks = [
          [procheNomComplet, "procheNomComplet", "procheNomCompletError", "Le nom du proche"],
          [procheTelephone, "procheTelephone", "procheTelephoneError", "Le téléphone du proche"],
          [procheLien, "procheLien", "procheLienError", "Le lien de parenté"],
        ];

        procheChecks.forEach(([value, inputId, errorId, label]) => {
          const error = validateField(value, label);
          if (error) {
            showError(inputId, errorId, error);
            hasError = true;
          } else {
            hideError(inputId, errorId);
          }
        });

        procheData = {
          nomComplet: procheNomComplet,
          telephone: procheTelephone,
          email: procheEmail,
          lienParente: procheLien,
        };
      }

      if (hasError) return false;

      let photoUrl = "";
      const fileInput = modal.querySelector("#pelPhoto");
      const file = fileInput?.files?.[0];

      if (file) {
        try {
          const result = await uploadUserPhoto(file);
          photoUrl = result.photoUrl;
        } catch (error) {
          showError("pelPhoto", "pelPhotoError", error.message);
          return false;
        }
      }

      try {
        if (pelerin) {
          await updatePelerin(pelerin.idPelerin, {
            numeroPasseport,
            statutVisa,
            groupeId,
            informationsMedicales,
            contactUrgenceNom,
            contactUrgenceTelephone,
          });
          showToast("Pèlerin modifié avec succès.");
        } else {
          const nouveauPelerin = await createPelerin({
            nomComplet,
            numeroPasseport,
            statutVisa,
            groupeId,
            informationsMedicales,
            contactUrgenceNom,
            contactUrgenceTelephone,
            photo: photoUrl,
          });

          showToast("Pèlerin créé avec succès.");

          if (procheData) {
            const { motDePasseGenere } = await createProche({
              ...procheData,
              pelerinId: nouveauPelerin.idPelerin,
            });

            setTimeout(() => {
              openInfoCopy({
                title: "Compte proche créé",
                message: `Le compte de <strong>${escapeHtml(procheData.nomComplet)}</strong> a été créé. Communique-lui ce mot de passe temporaire :`,
                value: motDePasseGenere,
                onCopy: () => showToast("Mot de passe copié."),
              });
            }, 200);
          }
        }

        await renderPelerinsPage();
        return true;
      } catch (error) {
        showToast(error.message, "error");
        return false;
      }
    },
  });
}

// ---------- Page principale ----------
export async function renderPelerinsPage() {
  const app = document.getElementById("app");

  // On charge les 3 sources en parallèle : pèlerins, groupes, utilisateurs
  const [pelerins, groupes, utilisateurs] = await Promise.all([
    getPelerins(),
    getGroupes(),
    getUtilisateurs(),
  ]);

  const groupeMap = Object.fromEntries(groupes.map((g) => [g.idGroupe, g.nom]));

  // Jointure : pour chaque pèlerin, on retrouve son nom/sa photo via utilisateurId
  const utilisateurMap = Object.fromEntries(utilisateurs.map((u) => [u.id, u]));

  app.innerHTML = `
    <section>
      ${pageHeader({
        kicker: "Sécurité & Suivi",
        title: "Manifeste des Pèlerins",
        subtitle: "Enregistrez, suivez et validez la conformité réglementaire de tous les inscrits.",
        actionLabel: "Ajouter un Nouveau Pelerin",
        actionId: "addPelerinBtn",
        actionIcon: "fa-user-plus",
      })}

      <article class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        ${renderTable({
          rows: pelerins,
          emptyMessage: "Aucun pèlerin enregistré.",
          columns: [
            {
              label: "Image",
              render: (p) => {
                const utilisateur = utilisateurMap[p.utilisateurId];
                return utilisateur?.photo
                  ? `<img src="${escapeHtml(utilisateur.photo)}" alt="" class="h-10 w-10 rounded-full object-cover" />`
                  : `<div class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400"><i class="fa-solid fa-user"></i></div>`;
              },
            },
            {
              label: "ID & Nom",
              render: (p) => {
                const utilisateur = utilisateurMap[p.utilisateurId];
                return `<strong class="font-bold text-slate-950">${escapeHtml(utilisateur?.nomComplet || "—")}</strong>`;
              },
            },
            { label: "N Passeport", render: (p) => escapeHtml(p.numeroPasseport) },
            { label: "Groupe", render: (p) => escapeHtml(groupeMap[p.groupeId] || "-") },
            { label: "Statut Visa", render: (p) => escapeHtml(p.statutVisa) },
            { label: "Santé", render: (p) => escapeHtml(p.informationsMedicales || "----") },
            {
              label: "Actions",
              render: (p) => `
                <div class="flex flex-wrap gap-2">
                  <button class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold" data-edit="${escapeHtml(p.idPelerin)}">
                    <i class="fa-solid fa-pen"></i>
                  </button>
                  <button class="rounded-xl bg-rose-600 px-3 py-2 text-xs font-extrabold text-white" data-delete="${escapeHtml(p.idPelerin)}">
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

  bindPelerinEvents(pelerins);
}

function bindPelerinEvents(pelerins) {
  document.getElementById("addPelerinBtn").addEventListener("click", () => openPelerinForm());

  document.querySelectorAll("[data-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      const pelerin = pelerins.find((p) => p.idPelerin === button.dataset.edit);
      if (pelerin) openPelerinForm(pelerin);
    });
  });

  document.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.delete;
      openConfirm({
        message: "Voulez-vous supprimer ce pèlerin ?",
        onConfirm: async () => {
          try {
            await deletePelerin(id);
            showToast("Pèlerin supprimé.");
            await renderPelerinsPage();
          } catch (error) {
            showToast(error.message, "error");
          }
        },
      });
    });
  });
}