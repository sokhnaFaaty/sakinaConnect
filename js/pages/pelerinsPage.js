import { pageHeader } from "../components/pageHeader.js";
import { renderTable } from "../components/table.js";
import { openModal, openConfirm, openInfoCopy } from "../components/modal.js";
import { openDrawer } from "../components/drawer.js";
import { viewToggle, bindViewToggle, getSavedView, saveView } from "../components/viewToogle.js";
import { showToast } from "../components/toast.js";
import { escapeHtml } from "../utils/html.js";
import { showError, hideError, validateField } from "../utils/formValidator.js";
import { validateEmailFormat, validateTelephone } from "../utils/validators.js";
import { emailExiste, telephoneExiste, passeportExiste } from "../services/validationService.js";
import {
  getPelerins,
  createPelerin,
  updatePelerin,
  deletePelerin,
} from "../services/pelerinService.js";
import { getUtilisateurs, getUtilisateurById } from "../services/utilisateurService.js";
import { createProche, getProches, getProcheByPelerinId, updateProche } from "../services/procheService.js";
import { getGroupes } from "../services/groupeService.js";
import { uploadUserPhoto } from "../services/cloudinaryService.js";
import { getHotels } from "../services/hotelService.js";
import { getGuides } from "../services/guideService.js";


// ---------- Corps du formulaire ----------
function pelerinFormBody(pelerin = null, groupes = [], nomPelerin = "", procheExistant = null, procheUtilisateur = null) {
  const isEdit = pelerin !== null;

  const optionsGroupes = groupes
    .map((g) => `<option value="${escapeHtml(g.id)}" ${pelerin?.groupeId === g.id ? "selected" : ""}>${escapeHtml(g.nom)}</option>`)
    .join("");

  // Valeurs pré-remplies du proche (en édition, si le pèlerin en a un)
  const pNom = escapeHtml(procheUtilisateur?.nomComplet || "");
  const pTel = escapeHtml(procheUtilisateur?.telephone || "");
  const pEmail = escapeHtml(procheUtilisateur?.email || "");
  const pLien = escapeHtml(procheExistant?.lienParente || "");

  // Les champs du proche (partagés entre création et édition)
  const procheFieldsInner = `
        <div>
          <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="procheNomComplet">Nom Complet *</label>
          <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" type="text" id="procheNomComplet" value="${pNom}" placeholder="Entrez le nom du proche" />
          <p id="procheNomCompletError" class="mt-1 hidden text-xs text-rose-600"></p>
        </div>
        <div>
          <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="procheTelephone">Téléphone *</label>
          <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" type="text" id="procheTelephone" value="${pTel}" placeholder="Entrez le téléphone" />
          <p id="procheTelephoneError" class="mt-1 hidden text-xs text-rose-600"></p>
        </div>
        <div>
          <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="procheEmail">Email (facultatif)</label>
          <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" type="email" id="procheEmail" value="${pEmail}" placeholder="Entrez l'email du proche" />
          <p id="procheEmailError" class="mt-1 hidden text-xs text-rose-600"></p>
        </div>
        <div>
          <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="procheLien">Lien de Parenté *</label>
          <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" type="text" id="procheLien" value="${pLien}" placeholder="Entrez le lien de parenté" />
          <p id="procheLienError" class="mt-1 hidden text-xs text-rose-600"></p>
        </div>`;

  // Section proche :
  // - édition avec proche existant → champs visibles et modifiables (pas de radio)
  // - création ou édition sans proche → radio OUI/NON pour en ajouter un
  const procheSection = (isEdit && procheExistant)
    ? `
    <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p class="mb-3 text-sm font-extrabold text-slate-800">Contact d'urgence (proche)</p>
      <div id="procheFields" class="grid gap-4">
        ${procheFieldsInner}
      </div>
    </div>`
    : `
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

      <div id="procheFields" class="mt-4 hidden grid gap-4">
        ${procheFieldsInner}
      </div>
    </div>`;

  return `
    <div class="grid gap-4">
      <div>
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="pelNomComplet">Nom Complet *</label>
        <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" type="text" id="pelNomComplet" value="${escapeHtml(nomPelerin || pelerin?.nomComplet || "")}" placeholder="Nom du pèlerin" ${isEdit ? "readonly" : ""} />
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
      <div>
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="pelPhoto">Image</label>
        <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm" type="file" id="pelPhoto" accept="image/*" />
        <p id="pelPhotoError" class="mt-1 hidden text-xs text-rose-600"></p>
      </div>
      ` : ""}

      <div>
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="pelInfosMedicales">Problèmes de Santé Chroniques (ex: Asthme, Diabète, Fauteuil roulant)</label>
        <textarea class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" id="pelInfosMedicales" rows="2" placeholder="Texte saisi">${escapeHtml(pelerin?.informationsMedicales || "")}</textarea>
      </div>


    </div>

    ${procheSection}
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
async function openPelerinForm(pelerin = null, nomPelerin = "") {
  const groupes = await getGroupes();

  // En édition : on récupère le proche existant (= contact d'urgence) pour pré-remplir
  let procheExistant = null;
  let procheUtilisateur = null;
  if (pelerin) {
    procheExistant = await getProcheByPelerinId(pelerin.id);
    if (procheExistant) {
      procheUtilisateur = await getUtilisateurById(procheExistant.utilisateurId);
    }
  }

  openDrawer({
    title: pelerin ? "Modifier un Pèlerin" : "Ajouter un Pèlerin",
    icon: "fa-user",
    body: pelerinFormBody(pelerin, groupes, nomPelerin, procheExistant, procheUtilisateur),
    confirmLabel: pelerin ? "Enregistrer" : "Sauvegarder le profil",
    onMount: (overlay) => attachProcheToggle(overlay),
    onConfirm: async (modal) => {
      const nomComplet = modal.querySelector("#pelNomComplet").value.trim();
      const numeroPasseport = modal.querySelector("#pelPassport").value.trim();
      const statutVisa = modal.querySelector("#pelStatutVisa").value;
      const groupeId = modal.querySelector("#pelGroupe").value;
      const informationsMedicales = modal.querySelector("#pelInfosMedicales").value.trim();
      // Champs email/téléphone du compte pèlerin : présents en création uniquement
      const email = modal.querySelector("#pelEmail")?.value.trim() || "";
      const telephone = modal.querySelector("#pelTelephone")?.value.trim() || "";

      let hasError = false;

      const checks = [
        [nomComplet, "pelNomComplet", "pelNomCompletError", "Le nom complet"],
        [numeroPasseport, "pelPassport", "pelPassportError", "Le numéro de passeport"],
        [groupeId, "pelGroupe", "pelGroupeError", "Le groupe"],
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

      // En création : format de l'email et du téléphone du compte pèlerin
      if (!pelerin) {
        const emailError = validateEmailFormat(email);
        if (emailError) { showError("pelEmail", "pelEmailError", emailError); hasError = true; }
        else hideError("pelEmail", "pelEmailError");
        const telError = validateTelephone(telephone);
        if (telError) { showError("pelTelephone", "pelTelephoneError", telError); hasError = true; }
        else hideError("pelTelephone", "pelTelephoneError");
      }

      // Le proche est traité : s'il existe déjà (édition) → toujours ; sinon si "OUI" est coché
      const procheActif = procheExistant ? true : !!modal.querySelector("#procheOui")?.checked;
      let procheData = null;

      if (procheActif) {
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

        // Format du téléphone du proche (Sénégal ou Arabie Saoudite)
        const procheTelError = validateTelephone(procheTelephone);
        if (procheTelError) { showError("procheTelephone", "procheTelephoneError", procheTelError); hasError = true; }

        // Format de l'email du proche (facultatif : seulement s'il est renseigné)
        if (procheEmail) {
          const procheEmailError = validateEmailFormat(procheEmail);
          if (procheEmailError) { showError("procheEmail", "procheEmailError", procheEmailError); hasError = true; }
          else hideError("procheEmail", "procheEmailError");
        } else {
          hideError("procheEmail", "procheEmailError");
        }

        procheData = {
          nomComplet: procheNomComplet,
          telephone: procheTelephone,
          email: procheEmail,
          lienParente: procheLien,
        };
      }

      if (hasError) return false;

      // Vérification d'unicité (passeport, et à la création : email/téléphone du compte)
      if (pelerin) {
        if (await passeportExiste(numeroPasseport, pelerin.id)) {
          showError("pelPassport", "pelPassportError", "Ce numéro de passeport est déjà utilisé.");
          return false;
        }
      } else {
        if (await passeportExiste(numeroPasseport)) {
          showError("pelPassport", "pelPassportError", "Ce numéro de passeport est déjà utilisé.");
          return false;
        }
        if (await emailExiste(email)) {
          showError("pelEmail", "pelEmailError", "Cet email est déjà utilisé.");
          return false;
        }
        if (await telephoneExiste(telephone)) {
          showError("pelTelephone", "pelTelephoneError", "Ce téléphone est déjà utilisé.");
          return false;
        }
      }

      // Unicité du proche (exclut son propre compte quand on met à jour un proche existant)
      if (procheData) {
        const procheExcludeId = procheUtilisateur?.id;
        if (procheData.email && await emailExiste(procheData.email, procheExcludeId)) {
          showError("procheEmail", "procheEmailError", "Cet email est déjà utilisé.");
          return false;
        }
        if (await telephoneExiste(procheData.telephone, procheExcludeId)) {
          showError("procheTelephone", "procheTelephoneError", "Ce téléphone est déjà utilisé.");
          return false;
        }
      }

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

      // Crée le compte proche et affiche le mot de passe temporaire généré
      const creerProcheAvecMotDePasse = async (pelerinId) => {
        const { motDePasseGenere } = await createProche({ ...procheData, pelerinId });
        setTimeout(() => {
          openInfoCopy({
            title: "Compte proche créé",
            message: `Le compte de <strong>${escapeHtml(procheData.nomComplet)}</strong> a été créé. Communique-lui ce mot de passe temporaire :`,
            value: motDePasseGenere,
            onCopy: () => showToast("Mot de passe copié."),
          });
        }, 200);
      };

      try {
        if (pelerin) {
          await updatePelerin(pelerin.id, {
            numeroPasseport,
            statutVisa,
            groupeId,
            informationsMedicales,
          });

          if (procheData) {
            if (procheExistant) {
              // Le pèlerin avait déjà un proche → on le met à jour
              await updateProche(procheExistant.id, procheExistant.utilisateurId, procheData);
            } else {
              // Aucun proche jusque-là → on en crée un
              await creerProcheAvecMotDePasse(pelerin.id);
            }
          }

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
            photo: photoUrl,
          });

          showToast("Pèlerin créé avec succès.");

          if (procheData) {
            await creerProcheAvecMotDePasse(nouveauPelerin.id);
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
            <p class="text-slate-500">Contact d'urgence — Proche associé (Portail Famille) :</p>
            ${procheUtilisateur ? `
            <p class="font-bold text-slate-800">${escapeHtml(procheUtilisateur.nomComplet)}${procheAssocie.lienParente ? ` (${escapeHtml(procheAssocie.lienParente)})` : ""}</p>
            <p class="text-slate-600">${escapeHtml(procheUtilisateur.telephone || "")}</p>
            ` : `<p class="font-bold text-slate-800">Aucun proche associé.</p>`}
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
    cancelLabel: null,
    maxWidth: "max-w-3xl",
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

  const avatarHtml = (p) => {
    const utilisateur = utilisateurMap[p.utilisateurId];
    return utilisateur?.photo
      ? `<img src="${escapeHtml(utilisateur.photo)}" alt="" class="h-10 w-10 rounded-full object-cover" />`
      : `<div class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400"><i class="fa-solid fa-user"></i></div>`;
  };
  const nomHtml = (p) => escapeHtml(utilisateurMap[p.utilisateurId]?.nomComplet || "—");
  const visaBadge = (p) => p.statutVisa === "APPROUVE"
    ? `<span class="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">Approuvé</span>`
    : `<span class="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">${escapeHtml(p.statutVisa)}</span>`;

  const actionsHtml = (p) => `
    <button class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold" data-view="${escapeHtml(p.id)}" title="Voir">
      <i class="fa-solid fa-eye"></i>
    </button>
    <button class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold" data-edit="${escapeHtml(p.id)}" title="Modifier">
      <i class="fa-solid fa-pen"></i>
    </button>
    <button class="rounded-xl bg-rose-600 px-3 py-2 text-xs font-extrabold text-white" data-delete="${escapeHtml(p.id)}" title="Supprimer">
      <i class="fa-solid fa-trash"></i>
    </button>`;

  const tableHtml = (rows) => `
    <article class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      ${renderTable({
        rows,
        emptyMessage: "Aucun pèlerin ne correspond à votre recherche.",
        columns: [
          { label: "Image", render: (p) => avatarHtml(p) },
          { label: "Nom", render: (p) => `<strong class="font-bold text-slate-950">${nomHtml(p)}</strong>` },
          { label: "N Passeport", render: (p) => escapeHtml(p.numeroPasseport) },
          { label: "Groupe", render: (p) => escapeHtml(groupeMap[p.groupeId]?.nom || "-") },
          { label: "Statut Visa", render: (p) => visaBadge(p) },
          { label: "Santé", render: (p) => escapeHtml(p.informationsMedicales || "----") },
          { label: "Actions", render: (p) => `<div class="flex flex-wrap gap-2">${actionsHtml(p)}</div>` },
        ],
      })}
    </article>`;

  const cardsHtml = (rows) => rows.length
    ? `<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        ${rows.map((p) => `
          <article class="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div class="flex-1 p-5">
              <div class="mb-3 flex items-center gap-3">
                ${avatarHtml(p)}
                <div>
                  <h3 class="font-black text-slate-950">${nomHtml(p)}</h3>
                  <p class="text-xs text-slate-500">${escapeHtml(groupeMap[p.groupeId]?.nom || "Sans groupe")}</p>
                </div>
              </div>
              <div class="grid gap-2 text-sm text-slate-600">
                <p class="flex items-center gap-2"><i class="fa-solid fa-passport w-4 text-[#333D2A]"></i> ${escapeHtml(p.numeroPasseport)}</p>
                <p class="flex items-center gap-2"><i class="fa-solid fa-file-shield w-4 text-[#333D2A]"></i> ${visaBadge(p)}</p>
                <p class="flex items-center gap-2"><i class="fa-solid fa-heart-pulse w-4 text-[#333D2A]"></i> ${escapeHtml(p.informationsMedicales || "----")}</p>
              </div>
            </div>
            <div class="flex items-center justify-end gap-2 bg-[#F2F2DE]/70 px-5 py-3">${actionsHtml(p)}</div>
          </article>
        `).join("")}
      </div>`
    : `<div class="rounded-[2rem] border border-slate-200 bg-white p-10 text-center text-sm text-slate-400 shadow-sm">Aucun pèlerin ne correspond à votre recherche.</div>`;

  // Filtre courant : texte de recherche (nom / passeport) + groupe sélectionné
  let searchTerm = "";
  let groupeFilter = "";

  const getFilteredPelerins = () => {
    const terme = searchTerm.trim().toLowerCase();
    return pelerins.filter((p) => {
      const nom = String(utilisateurMap[p.utilisateurId]?.nomComplet || "").toLowerCase();
      const passeport = String(p.numeroPasseport || "").toLowerCase();
      const matcheRecherche = !terme || nom.includes(terme) || passeport.includes(terme);
      const matcheGroupe = !groupeFilter || p.groupeId === groupeFilter;
      return matcheRecherche && matcheGroupe;
    });
  };

  const optionsGroupesFiltre = groupes
    .map((g) => `<option value="${escapeHtml(g.id)}">${escapeHtml(g.nom)}</option>`)
    .join("");

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
      <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div class="relative flex-1 sm:max-w-xs">
            <i class="fa-solid fa-magnifying-glass pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400"></i>
            <input id="pelSearch" type="search" placeholder="Rechercher un pèlerin (nom, passeport)…" class="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm" />
          </div>
          <select id="pelGroupeFilter" class="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm sm:w-56">
            <option value="">Tous les groupes</option>
            ${optionsGroupesFiltre}
          </select>
        </div>
        <div id="pelToggle"></div>
      </div>
      <div id="pelList"></div>
    </section>
  `;

  document.getElementById("addPelerinBtn").addEventListener("click", () => openPelerinForm());

  let view = getSavedView("pelerins", "table");

  const renderList = () => {
    const rows = getFilteredPelerins();
    document.getElementById("pelList").innerHTML = view === "card" ? cardsHtml(rows) : tableHtml(rows);
    bindPelerinRowEvents(pelerins, utilisateurMap, groupeMap, hotels, guides);
  };

  const draw = () => {
    const toggleEl = document.getElementById("pelToggle");
    toggleEl.innerHTML = viewToggle(view);
    bindViewToggle(toggleEl, (v) => { view = v; saveView("pelerins", v); draw(); });
    renderList();
  };
  draw();

  document.getElementById("pelSearch").addEventListener("input", (e) => {
    searchTerm = e.target.value;
    renderList();
  });
  document.getElementById("pelGroupeFilter").addEventListener("change", (e) => {
    groupeFilter = e.target.value;
    renderList();
  });
}

function bindPelerinRowEvents(pelerins, utilisateurMap, groupeMap, hotels, guides) {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      const pelerin = pelerins.find((p) => p.id === button.dataset.view);
      if (pelerin) openPelerinDetail(pelerin, utilisateurMap, groupeMap, hotels, guides);
    });
  });


  document.querySelectorAll("[data-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      const pelerin = pelerins.find((p) => p.id === button.dataset.edit);
      if (pelerin) openPelerinForm(pelerin, utilisateurMap[pelerin.utilisateurId]?.nomComplet || "");
    });
  });

  document.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.delete;
      openConfirm({
        message: `Voulez-vous supprimer ce pèlerin ?<br/><span class="text-xs text-amber-600">Il sera archivé (avec son compte) et pourra être restauré.</span>`,
        onConfirm: async () => {
          try {
            await deletePelerin(id);
            showToast("Pèlerin archivé.");
            await renderPelerinsPage();
          } catch (error) {
            showToast(error.message, "error");
          }
        },
      });
    });
  });
}