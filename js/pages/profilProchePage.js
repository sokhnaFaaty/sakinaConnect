// pages/profilProchePage.js — Mon Profil de Proche (PROCHE)
import { pageHeader } from "../components/pageHeader.js";
import { showToast } from "../components/toast.js";
import { escapeHtml } from "../utils/html.js";
import { showError, hideError } from "../utils/formValidator.js";
import { getSession, saveSession } from "../utils/auth.js";
import { validateEmailFormat, validateTelephone } from "../utils/validators.js";
import { emailExiste, telephoneExiste } from "../services/validationService.js";
import { updateUtilisateur } from "../services/utilisateurService.js";

export async function renderProfilProchePage() {
  const app = document.getElementById("app");
  const user = getSession();

  app.innerHTML = `
    <section>
      ${pageHeader({ kicker: "Identité", title: "Mon Profil de Proche", subtitle: "Gérez vos informations de contact personnelles." })}

      <article class="mx-auto max-w-2xl rounded-[2rem] border border-t-4 border-slate-200 border-t-[#0B6E4F] bg-white p-6 shadow-sm">
        <h2 class="mb-5 flex items-center gap-2 text-base font-black text-slate-950"><i class="fa-solid fa-user text-[#333D2A]"></i> Mes informations de contact</h2>

        <div class="mb-5 flex items-start gap-4">
          <div class="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-slate-100">
            ${user.photo ? `<img src="${escapeHtml(user.photo)}" class="h-full w-full object-cover" />` : `<div class="flex h-full w-full items-center justify-center text-slate-300"><i class="fa-solid fa-user text-2xl"></i></div>`}
          </div>
          <div class="flex-1">
            <p class="font-bold text-slate-900">Photo de Profil</p>
            <p class="text-xs text-slate-500">Choisissez une photo représentative pour faciliter votre identification par l'agence sur place.</p>
            <button type="button" id="prochePhotoToggle" class="mt-1 text-xs font-bold text-[#333D2A] underline">Choisissez un avatar ou entrer une URL.</button>
            <input class="mt-2 hidden w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm" type="text" id="prochePhoto" value="${escapeHtml(user.photo || "")}" placeholder="https://…" />
          </div>
        </div>

        <div class="mb-4">
          <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="procheNom">Nom complet</label>
          <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" type="text" id="procheNom" value="${escapeHtml(user.nomComplet || "")}" />
          <p id="procheNomError" class="mt-1 hidden text-xs text-rose-600"></p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="procheTel">Numéro de téléphone</label>
            <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" type="text" id="procheTel" value="${escapeHtml(user.telephone ? String(user.telephone) : "")}" placeholder="77 123 45 67" />
            <p id="procheTelError" class="mt-1 hidden text-xs text-rose-600"></p>
          </div>
          <div>
            <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="procheEmail">Adresse email</label>
            <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" type="email" id="procheEmail" value="${escapeHtml(user.email || "")}" placeholder="email@exemple.com" />
            <p id="procheEmailError" class="mt-1 hidden text-xs text-rose-600"></p>
          </div>
        </div>

        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="procheMotDePasse">Mot de passe de connexion</label>
            <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" type="password" id="procheMotDePasse" placeholder="Laisser vide pour ne pas changer" />
            <p id="procheMotDePasseError" class="mt-1 hidden text-xs text-rose-600"></p>
          </div>
          <div>
            <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="procheMotDePasseConfirm">Confirmer le mot de passe</label>
            <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" type="password" id="procheMotDePasseConfirm" placeholder="Retapez le nouveau mot de passe" />
            <p id="procheMotDePasseConfirmError" class="mt-1 hidden text-xs text-rose-600"></p>
          </div>
        </div>

        <div class="mt-6 flex justify-end">
          <button id="procheSaveBtn" class="inline-flex items-center gap-2 rounded-2xl bg-[#333D2A] px-5 py-2.5 text-sm font-extrabold text-white transition hover:opacity-90">
            <i class="fa-solid fa-circle-check"></i> Enregistrer les modifications
          </button>
        </div>
      </article>
    </section>
  `;

  document.getElementById("prochePhotoToggle").addEventListener("click", () => {
    const input = document.getElementById("prochePhoto");
    input.classList.toggle("hidden");
    if (!input.classList.contains("hidden")) input.focus();
  });

  document.getElementById("procheSaveBtn").addEventListener("click", () => sauvegarder(user));
}

async function sauvegarder(user) {
  const q = (id) => document.getElementById(id);
  const nomComplet = q("procheNom").value.trim();
  const telephone = q("procheTel").value.trim();
  const email = q("procheEmail").value.trim();
  const photo = q("prochePhoto").value.trim();
  const motDePasse = q("procheMotDePasse").value;
  const motDePasseConfirm = q("procheMotDePasseConfirm").value;

  let hasError = false;
  if (!nomComplet) { showError("procheNom", "procheNomError", "Le nom complet est obligatoire."); hasError = true; } else hideError("procheNom", "procheNomError");
  const emailError = validateEmailFormat(email);
  if (emailError) { showError("procheEmail", "procheEmailError", emailError); hasError = true; } else hideError("procheEmail", "procheEmailError");
  const telError = validateTelephone(telephone);
  if (telError) { showError("procheTel", "procheTelError", telError); hasError = true; } else hideError("procheTel", "procheTelError");

  if (motDePasse || motDePasseConfirm) {
    if (!motDePasse) { showError("procheMotDePasse", "procheMotDePasseError", "Saisissez le nouveau mot de passe."); hasError = true; } else hideError("procheMotDePasse", "procheMotDePasseError");
    if (motDePasse !== motDePasseConfirm) { showError("procheMotDePasseConfirm", "procheMotDePasseConfirmError", "Les mots de passe ne correspondent pas."); hasError = true; } else hideError("procheMotDePasseConfirm", "procheMotDePasseConfirmError");
  }
  if (hasError) return;

  if (await emailExiste(email, user.id)) { showError("procheEmail", "procheEmailError", "Cet email est déjà utilisé."); return; }
  if (await telephoneExiste(telephone, user.id)) { showError("procheTel", "procheTelError", "Ce téléphone est déjà utilisé."); return; }

  try {
    const maj = { nomComplet, telephone, email, photo };
    if (motDePasse) maj.motDePasse = motDePasse;
    await updateUtilisateur(user.id, maj);
    saveSession({ ...user, nomComplet, telephone, email, photo });
    showToast("Profil mis à jour avec succès.");
    await renderProfilProchePage();
  } catch (error) {
    showToast(error.message, "error");
  }
}
