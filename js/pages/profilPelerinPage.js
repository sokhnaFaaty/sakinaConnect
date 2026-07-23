// pages/profilPelerinPage.js — Mon Profil Spirituel & Bureau d'Identité (PELERIN)
import { pageHeader } from "../components/pageHeader.js";
import { showToast } from "../components/toast.js";
import { escapeHtml } from "../utils/html.js";
import { showError, hideError } from "../utils/formValidator.js";
import { getSession, saveSession } from "../utils/auth.js";
import { validateEmailFormat, validateTelephone } from "../utils/validators.js";
import { emailExiste, telephoneExiste } from "../services/validationService.js";
import { getPelerinByUtilisateurId, updatePelerin } from "../services/pelerinService.js";
import { getProcheByPelerinId } from "../services/procheService.js";
import { updateUtilisateur } from "../services/utilisateurService.js";
import { getGroupes } from "../services/groupeService.js";
import { getGuides } from "../services/guideService.js";
import { getHotels } from "../services/hotelService.js";
import { getUtilisateurs } from "../services/utilisateurService.js";

const conformite = (ok, label) => `
  <div class="flex items-center justify-between border-b border-slate-100 py-2.5 last:border-0 text-sm">
    <span class="text-slate-600">${escapeHtml(label)}</span>
    ${ok
      ? `<span class="inline-flex items-center gap-1 font-bold text-emerald-600"><i class="fa-solid fa-circle-check"></i> Valide</span>`
      : `<span class="inline-flex items-center gap-1 font-bold text-amber-600"><i class="fa-solid fa-clock"></i> En attente</span>`}
  </div>`;

const infoAdmin = (label, valeur) => `
  <div class="rounded-2xl bg-[#F2F2DE]/60 px-4 py-3">
    <p class="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">${escapeHtml(label)}</p>
    <p class="mt-0.5 text-sm font-bold text-slate-800">${escapeHtml(valeur)}</p>
  </div>`;

const champ = (id, label, value, type = "text", placeholder = "") => `
  <div>
    <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="${id}">${escapeHtml(label)}</label>
    <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" type="${type}" id="${id}" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}" />
    <p id="${id}Error" class="mt-1 hidden text-xs text-rose-600"></p>
  </div>`;

export async function renderProfilPelerinPage() {
  const app = document.getElementById("app");
  const user = getSession();

  const pelerin = await getPelerinByUtilisateurId(user.id);
  if (!pelerin) {
    app.innerHTML = `<section class="rounded-[2rem] border border-amber-200 bg-amber-50 p-8 text-center"><p class="text-sm font-semibold text-amber-700">Aucun profil pèlerin associé à ce compte.</p></section>`;
    return;
  }

  const [groupes, guides, hotels, utilisateurs, procheAssocie] = await Promise.all([
    getGroupes(), getGuides(), getHotels(), getUtilisateurs(), getProcheByPelerinId(pelerin.id),
  ]);
  const utilisateurMap = Object.fromEntries(utilisateurs.map((u) => [u.id, u]));

  // Le contact d'urgence, c'est le proche : affiché en lecture seule, uniquement s'il existe
  const procheUser = procheAssocie ? utilisateurMap[procheAssocie.utilisateurId] : null;
  const groupe = groupes.find((g) => g.id === pelerin.groupeId);
  const guide = groupe ? guides.find((g) => g.id === groupe.guideId) : null;
  const guideU = guide ? utilisateurMap[guide.utilisateurId] : null;
  const hotelMecque = groupe ? hotels.find((h) => h.id === groupe.hotelMecqueId)?.nom || "-" : "-";
  const hotelMedine = groupe ? hotels.find((h) => h.id === groupe.hotelMedineId)?.nom || "-" : "-";

  app.innerHTML = `
    <section>
      ${pageHeader({ kicker: "Identité", title: "Mon Profil Spirituel & Bureau d'Identité", subtitle: "Consultez et mettez à jour vos justificatifs." })}

      <div class="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <article class="rounded-[2rem] border border-t-4 border-slate-200 border-t-[#0B6E4F] bg-white p-6 shadow-sm">
          <div class="mb-5 flex items-center justify-between">
            <h2 class="flex items-center gap-2 text-base font-black text-slate-950"><i class="fa-solid fa-user text-[#333D2A]"></i> Informations Personnelles</h2>
            <span class="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black text-emerald-700">Modifiable par vous</span>
          </div>

          <div class="mb-5 flex items-start gap-4">
            <div class="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-slate-100">
              ${user.photo ? `<img src="${escapeHtml(user.photo)}" class="h-full w-full object-cover" />` : `<div class="flex h-full w-full items-center justify-center text-slate-300"><i class="fa-solid fa-user text-2xl"></i></div>`}
            </div>
            <div class="flex-1">
              <p class="font-bold text-slate-900">Photo de Profil</p>
              <p class="text-xs text-slate-500">Choisissez une photo représentative pour faciliter votre identification par l'agence sur place.</p>
              <button type="button" id="profPhotoToggle" class="mt-1 text-xs font-bold text-[#333D2A] underline">Choisissez un avatar ou entrer une URL.</button>
              <input class="mt-2 hidden w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm" type="text" id="profPhoto" value="${escapeHtml(user.photo || "")}" placeholder="https://…" />
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            ${champ("profTel", "Numéro de téléphone", user.telephone || "", "text", "77 123 45 67")}
            ${champ("profEmail", "Adresse email", user.email || "", "email", "email@exemple.com")}
          </div>

          ${procheUser ? `
          <div class="mt-5 rounded-2xl bg-rose-50 p-4">
            <p class="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-rose-600"><i class="fa-solid fa-hand-holding-heart"></i> Contact d'urgence — votre proche</p>
            <div class="grid gap-4 sm:grid-cols-2 text-sm">
              <div>
                <p class="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Nom complet</p>
                <p class="mt-0.5 font-bold text-slate-800">${escapeHtml(procheUser.nomComplet || "-")}${procheAssocie.lienParente ? ` (${escapeHtml(procheAssocie.lienParente)})` : ""}</p>
              </div>
              <div>
                <p class="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Téléphone</p>
                <p class="mt-0.5 font-bold text-slate-800">${escapeHtml(procheUser.telephone || "-")}</p>
              </div>
            </div>
          </div>
          ` : ""}

          <div class="mt-5">
            <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="profMedical">Informations médicales de sécurité</label>
            <textarea class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" id="profMedical" rows="2" placeholder="Ex: Hypertension, prendre régulièrement mes médicaments">${escapeHtml(pelerin.informationsMedicales || "")}</textarea>
            <p class="mt-1 text-[11px] italic text-slate-400">Ces données médicales sont exclusivement transmises aux guides référents et à l'admin pour assurer votre sécurité en cas d'urgence médicale.</p>
          </div>

          <div class="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="profMotDePasse">Mot de passe de connexion</label>
              <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" type="password" id="profMotDePasse" placeholder="Laisser vide pour ne pas changer" />
              <p id="profMotDePasseError" class="mt-1 hidden text-xs text-rose-600"></p>
            </div>
            <div>
              <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="profMotDePasseConfirm">Confirmer le mot de passe</label>
              <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" type="password" id="profMotDePasseConfirm" placeholder="Retapez le nouveau mot de passe" />
              <p id="profMotDePasseConfirmError" class="mt-1 hidden text-xs text-rose-600"></p>
            </div>
          </div>

          <div class="mt-6 flex justify-end">
            <button id="profSaveBtn" class="inline-flex items-center gap-2 rounded-2xl bg-[#333D2A] px-5 py-2.5 text-sm font-extrabold text-white transition hover:opacity-90">
              <i class="fa-solid fa-circle-check"></i> Enregistrer les modifications
            </button>
          </div>
        </article>

        <div class="grid gap-6">
          <article class="rounded-[2rem] border border-t-4 border-slate-200 border-t-[#225BBF] bg-white p-6 shadow-sm">
            <h2 class="mb-3 flex items-center gap-2 text-base font-black text-slate-950"><i class="fa-solid fa-file-shield text-[#333D2A]"></i> Conformité réglementaire</h2>
            <p class="mb-3 text-xs text-slate-500">Vérifiez la validité de vos documents officiels avant votre présentation à l'aéroport.</p>
            ${conformite(!!pelerin.numeroPasseport, "Passeport scanné")}
            ${conformite(pelerin.statutVisa === "APPROUVE", "Visa Omra / Hajj")}
            ${conformite(!!pelerin.certificatVaccin, "Vaccin obligatoire ACWY")}
          </article>

          <article class="rounded-[2rem] bg-[#333D2A] p-6 text-white shadow-sm">
            <h2 class="mb-3 flex items-center gap-2 text-base font-black text-[#BC7B3B]"><i class="fa-solid fa-user-shield"></i> Votre guide sur place</h2>
            <p class="mb-3 text-xs text-slate-300">Pour toute question rituelle ou logistique d'urgence, votre guide reste joignable.</p>
            <p class="text-sm"><span class="text-slate-400">Nom :</span> <span class="font-bold">${escapeHtml(guideU?.nomComplet || "Non assigné")}</span></p>
            <p class="text-sm"><span class="text-slate-400">Téléphone :</span> <span class="font-bold">${escapeHtml(guideU?.telephone ? String(guideU.telephone) : "-")}</span></p>
            <p class="text-sm"><span class="text-slate-400">Email :</span> <span class="font-bold">${escapeHtml(guideU?.email || "-")}</span></p>
          </article>
        </div>
      </div>

      <article class="mt-6 rounded-[2rem] border border-t-4 border-slate-200 border-t-[#0B6E4F] bg-white p-6 shadow-sm">
        <h2 class="mb-4 flex items-center gap-2 text-base font-black text-slate-950"><i class="fa-solid fa-clipboard-list text-[#333D2A]"></i> Informations administratives</h2>
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          ${infoAdmin("Nom complet", user.nomComplet || "-")}
          ${infoAdmin("Numéro de passeport", pelerin.numeroPasseport || "-")}
          ${infoAdmin("Statut visa", pelerin.statutVisa || "-")}
          ${infoAdmin("Groupe de voyage", groupe?.nom || "-")}
          ${infoAdmin("Guide assigné", guideU?.nomComplet || "-")}
          ${infoAdmin("Code de badge pèlerin", "SKN-" + pelerin.id.slice(0, 6).toUpperCase())}
          ${infoAdmin("Hôtel Mecque", hotelMecque)}
          ${infoAdmin("Hôtel Médine", hotelMedine)}
          ${infoAdmin("Date de départ", groupe?.dateDepart || "-")}
          ${infoAdmin("Date de retour", groupe?.dateRetour || "-")}
        </div>
      </article>
    </section>
  `;

  document.getElementById("profSaveBtn").addEventListener("click", () => sauvegarder(user, pelerin));

  const photoToggle = document.getElementById("profPhotoToggle");
  if (photoToggle) {
    photoToggle.addEventListener("click", () => {
      const input = document.getElementById("profPhoto");
      input.classList.toggle("hidden");
      if (!input.classList.contains("hidden")) input.focus();
    });
  }
}

async function sauvegarder(user, pelerin) {
  const q = (id) => document.getElementById(id);
  const telephone = q("profTel").value.trim();
  const email = q("profEmail").value.trim();
  const photo = q("profPhoto").value.trim();
  const informationsMedicales = q("profMedical").value.trim();
  const motDePasse = q("profMotDePasse").value;
  const motDePasseConfirm = q("profMotDePasseConfirm").value;

  let hasError = false;
  const emailError = validateEmailFormat(email);
  if (emailError) { showError("profEmail", "profEmailError", emailError); hasError = true; } else hideError("profEmail", "profEmailError");
  const telError = validateTelephone(telephone);
  if (telError) { showError("profTel", "profTelError", telError); hasError = true; } else hideError("profTel", "profTelError");

  // Mot de passe : uniquement si l'utilisateur en saisit un nouveau, il doit être confirmé
  if (motDePasse || motDePasseConfirm) {
    if (!motDePasse) { showError("profMotDePasse", "profMotDePasseError", "Saisissez le nouveau mot de passe."); hasError = true; }
    else hideError("profMotDePasse", "profMotDePasseError");
    if (motDePasse !== motDePasseConfirm) { showError("profMotDePasseConfirm", "profMotDePasseConfirmError", "Les mots de passe ne correspondent pas."); hasError = true; }
    else hideError("profMotDePasseConfirm", "profMotDePasseConfirmError");
  }

  if (hasError) return;

  // Unicité email / téléphone (en excluant son propre compte)
  if (await emailExiste(email, user.id)) { showError("profEmail", "profEmailError", "Cet email est déjà utilisé."); return; }
  if (await telephoneExiste(telephone, user.id)) { showError("profTel", "profTelError", "Ce téléphone est déjà utilisé."); return; }

  try {
    const majUtilisateur = { email, telephone, photo };
    if (motDePasse) majUtilisateur.motDePasse = motDePasse;
    await updateUtilisateur(user.id, majUtilisateur);

    await updatePelerin(pelerin.id, {
      numeroPasseport: pelerin.numeroPasseport,
      statutVisa: pelerin.statutVisa,
      groupeId: pelerin.groupeId,
      informationsMedicales,
    });

    // Rafraîchit la session pour que la navbar reflète les changements
    saveSession({ ...user, email, telephone, photo });
    showToast("Profil mis à jour avec succès.");
    await renderProfilPelerinPage();
  } catch (error) {
    showToast(error.message, "error");
  }
}
