import { pageHeader } from "../components/pageHeader.js";
import { renderTable } from "../components/table.js";
import { openModal, openConfirm, openInfoCopy } from "../components/modal.js";
import { openDrawer } from "../components/drawer.js";
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
import { createProche,getProches } from "../services/procheService.js";
import { getGroupes } from "../services/groupeService.js";
import { uploadUserPhoto } from "../services/cloudinaryService.js";
import { getHotels } from "../services/hotelService.js";
import { getGuides } from "../services/guideService.js";


// ---------- Corps du formulaire ----------
function pelerinFormBody(pelerin = null, groupes = []) {
  const isEdit = pelerin !== null;

  const optionsGroupes = groupes
    .map((g) => `<option value="${escapeHtml(g.id)}" ${pelerin?.groupeId === g.id ? "selected" : ""}>${escapeHtml(g.nom)}</option>`)
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

      ${!isEdit ? `
      <div>
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="pelEmail">Email *</label>
        <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" type="email" id="pelEmail" value="" placeholder="email@exemple.com" />
        <p id="pelEmailError" class="mt-1 hidden text-xs text-rose-600"></p>
      </div>

      <div>
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="pelTelephone">Téléphone *</label>
        <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" type="text" id="pelTelephone" value="" placeholder="77 123 45 67" />
        <p id="pelTelephoneError" class="mt-1 hidden text-xs text-rose-600"></p>
      </div>
      ` : ""}

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

  openDrawer({
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
      // Champs email/téléphone du compte pèlerin : présents en création uniquement
      const email = modal.querySelector("#pelEmail")?.value.trim() || "";
      const telephone = modal.querySelector("#pelTelephone")?.value.trim() || "";

      let hasError = false;

      const checks = [
        [nomComplet, "pelNomComplet", "pelNomCompletError", "Le nom complet"],
        [numeroPasseport, "pelPassport", "pelPassportError", "Le numéro de passeport"],
        [groupeId, "pelGroupe", "pelGroupeError", "Le groupe"],
        [contactUrgenceNom, "pelContactNom", "pelContactNomError", "Le nom du contact d'urgence"],
        [contactUrgenceTelephone, "pelContactTel", "pelContactTelError", "Le téléphone du contact d'urgence"],
      ];

      // En création, l'email et le téléphone du compte pèlerin sont obligatoires
      if (!pelerin) {
        checks.push(
          [email, "pelEmail", "pelEmailError", "L'email"],
          [telephone, "pelTelephone", "pelTelephoneError", "Le téléphone"]
        );
      }

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
          await updatePelerin(pelerin.id, {
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
            email,
            telephone,
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
              pelerinId: nouveauPelerin.id,
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
// ---------- Modale : détail d'un pèlerin ----------
export async function openPelerinDetail(pelerin, utilisateurMap, groupeMap, hotels, guides) {
  const utilisateur = utilisateurMap[pelerin.utilisateurId];
  const groupe = groupeMap[pelerin.groupeId];
  const hotelMecque = groupe ? hotels.find((h) => h.id === groupe.hotelMecqueId)?.nom : "-";
  const hotelMedine = groupe ? hotels.find((h) => h.id === groupe.hotelMedineId)?.nom : "-";
  const guide = groupe ? guides.find((g) => g.id === groupe.guideId) : null;
  const guideNom = guide ? utilisateurMap[guide.utilisateurId]?.nomComplet : "-";

  // Le proche associé, s'il existe, vient du service procheService (à récupérer avant l'appel)
  const proches = await getProches();
  const procheAssocie = proches.find((pr) => pr.pelerinId === pelerin.id);
  const procheUtilisateur = procheAssocie ? utilisateurMap[procheAssocie.utilisateurId] : null;

  const visaBadge = pelerin.statutVisa === "APPROUVE"
    ? `<span class="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700"><i class="fa-solid fa-check"></i> Approuvé</span>`
    : `<span class="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">${escapeHtml(pelerin.statutVisa)}</span>`;

  openModal({
    title: "",
    body: `
      <div class="-m-6 mb-0 flex items-start gap-4 border-b border-slate-100 p-6 pb-5">
        <div class="h-16 w-16 overflow-hidden rounded-full bg-slate-100">
          ${utilisateur?.photo ? `<img src="${escapeHtml(utilisateur.photo)}" class="h-full w-full object-cover" />` : `<div class="flex h-full w-full items-center justify-center text-slate-300"><i class="fa-solid fa-user text-2xl"></i></div>`}
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-lg font-black text-slate-950">${escapeHtml(utilisateur?.nomComplet || "-")}</h2>
            <span class="rounded-full bg-[#F2F2DE] px-2 py-0.5 text-xs font-bold text-[#333D2A]">${escapeHtml(pelerin.id.slice(0, 5).toUpperCase())}</span>
          </div>
          <p class="text-sm text-slate-500">Passeport : ${escapeHtml(pelerin.numeroPasseport)}</p>
          <p class="mt-1 text-sm text-slate-500">Statut du Visa : ${visaBadge}</p>
        </div>
      </div>

      <div class="grid gap-4 pt-4 sm:grid-cols-2">
        <div>
          <p class="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#0B6E4F]">
            <i class="fa-solid fa-route"></i> Logistique &amp; Accompagnement
          </p>
          <div class="rounded-2xl bg-[#F2F2DE] p-4 text-sm">
            <p class="text-slate-500">Guide spirituel assigné :</p>
            <p class="mb-3 font-bold text-slate-800">${escapeHtml(guideNom)}</p>
            <p class="text-slate-500">Groupe de voyage :</p>
            <p class="font-bold text-slate-800">${escapeHtml(groupe?.nom || "-")}</p>
          </div>

          <p class="mb-2 mt-4 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#0B6E4F]">
            <i class="fa-solid fa-hotel"></i> Hébergements d'hôtels
          </p>
          <div class="grid grid-cols-2 gap-3">
            <div class="rounded-2xl bg-[#F2F2DE] p-3 text-sm">
              <p class="text-xs font-bold text-slate-500">LA MECQUE :</p>
              <p class="font-bold text-slate-800">${escapeHtml(hotelMecque || "-")}</p>
            </div>
            <div class="rounded-2xl bg-[#F2F2DE] p-3 text-sm">
              <p class="text-xs font-bold text-slate-500">MÉDINE :</p>
              <p class="font-bold text-slate-800">${escapeHtml(hotelMedine || "-")}</p>
            </div>
          </div>
        </div>

        <div>
          <p class="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-rose-600">
            <i class="fa-solid fa-heart-pulse"></i> Fiche médicale &amp; pathologies
          </p>
          <div class="rounded-2xl bg-rose-50 p-4 text-sm">
            <p class="text-xs font-bold text-rose-700">PATHOLOGIES SIGNALÉES :</p>
            <p class="mt-1 text-slate-700">${escapeHtml(pelerin.informationsMedicales || "Aucune pathologie signalée.")}</p>
          </div>

          <p class="mb-2 mt-4 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-rose-600">
            <i class="fa-solid fa-hand-holding-heart"></i> Proches &amp; contacts d'urgence
          </p>
          <div class="rounded-2xl bg-[#F2F2DE] p-4 text-sm">
            <p class="text-slate-500">Contact d'urgence principal :</p>
            <p class="font-bold text-slate-800">${escapeHtml(pelerin.contactUrgenceNom)}</p>
            <p class="mb-3 text-slate-600">${escapeHtml(pelerin.contactUrgenceTelephone)}</p>
            <p class="text-slate-500">Proche associé (Portail Famille) :</p>
            <p class="font-bold text-slate-800">${procheUtilisateur ? escapeHtml(procheUtilisateur.nomComplet) + " (" + escapeHtml(procheAssocie.lienParente) + ")" : "Aucun proche associé."}</p>
          </div>

          <p class="mb-2 mt-4 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-rose-600">
            <i class="fa-solid fa-triangle-exclamation"></i> Historique d'urgence SOS récent
          </p>
          <div class="rounded-2xl bg-[#F2F2DE] p-4 text-sm text-slate-400">
            Aucune alerte SOS récente déclenchée.
          </div>
        </div>
      </div>
    `,
    confirmLabel: "Fermer le Profil",
    onConfirm: async () => true,
  });
}
// ---------- Page principale ----------
export async function renderPelerinsPage() {
  const app = document.getElementById("app");

  // On charge les 3 sources en parallèle : pèlerins, groupes, utilisateurs
  const [pelerins, groupes, utilisateurs,hotels,guides] = await Promise.all([
    getPelerins(),
    getGroupes(),
    getUtilisateurs(),
    getHotels(),
    getGuides(),
  ]);

  const groupeMap = Object.fromEntries(groupes.map((g) => [g.id, g]));

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
            { label: "Groupe", render: (p) => escapeHtml(groupeMap[p.groupeId]?.nom || "-") },
            { label: "Statut Visa", render: (p) => escapeHtml(p.statutVisa) },
            { label: "Santé", render: (p) => escapeHtml(p.informationsMedicales || "----") },
{
  label: "Actions",
  render: (p) => `
    <div class="flex flex-wrap gap-2">
      <button class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold" data-view="${escapeHtml(p.id)}">
        <i class="fa-solid fa-eye"></i>
      </button>
      <button class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold" data-edit="${escapeHtml(p.id)}">
        <i class="fa-solid fa-pen"></i>
      </button>
      <button class="rounded-xl bg-rose-600 px-3 py-2 text-xs font-extrabold text-white" data-delete="${escapeHtml(p.id)}">
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

  bindPelerinEvents(pelerins, utilisateurMap, groupeMap, hotels, guides);
}

function bindPelerinEvents(pelerins, utilisateurMap, groupeMap, hotels, guides) {
  document.getElementById("addPelerinBtn").addEventListener("click", () => openPelerinForm());

  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      const pelerin = pelerins.find((p) => p.id === button.dataset.view);
      if (pelerin) openPelerinDetail(pelerin, utilisateurMap, groupeMap, hotels, guides);
    });
  });


  document.querySelectorAll("[data-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      const pelerin = pelerins.find((p) => p.id === button.dataset.edit);
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