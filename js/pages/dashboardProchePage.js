// pages/dashboardProchePage.js — Portail Famille & Suivi Sécurité (PROCHE)
import { escapeHtml } from "../utils/html.js";
import { getSession } from "../utils/auth.js";
import { getProcheByUtilisateurId } from "../services/procheService.js";
import { getPelerins } from "../services/pelerinService.js";
import { getGroupes } from "../services/groupeService.js";
import { getGuides } from "../services/guideService.js";
import { getUtilisateurs } from "../services/utilisateurService.js";
import { getSos } from "../services/sosService.js";

const banniere = (nom) => `
  <header class="mb-6 rounded-3xl bg-gradient-to-r from-[#1f4d3a] to-[#0B6E4F] p-6 text-white shadow-sm sm:p-7">
    <span class="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-black uppercase tracking-wider">Portail Famille & Suivi Sécurité</span>
    <h1 class="mt-3 font-display text-2xl font-black tracking-tight sm:text-3xl">Assalamu alaykum ${escapeHtml(nom || "")}</h1>
    <p class="mt-1 max-w-2xl text-sm text-white/80">Bienvenue dans votre tableau de bord de sérénité. Suivez en direct le parcours spirituel et physique de votre proche.</p>
  </header>`;

const badgeValide = (ok, label) => `
  <div class="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
    <span class="text-slate-600">${escapeHtml(label)}</span>
    ${ok
      ? `<span class="inline-flex items-center gap-1 font-bold text-emerald-600"><i class="fa-solid fa-circle-check"></i> Valide</span>`
      : `<span class="inline-flex items-center gap-1 font-bold text-amber-600"><i class="fa-solid fa-clock"></i> En attente</span>`}
  </div>`;

export async function renderDashboardProchePage() {
  const app = document.getElementById("app");
  const user = getSession();

  const proche = await getProcheByUtilisateurId(user.id);
  if (!proche) {
    app.innerHTML = `<section>${banniere(user?.nomComplet)}<div class="rounded-[2rem] border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">Aucun pèlerin associé à votre compte.</div></section>`;
    return;
  }

  const [pelerins, groupes, guides, utilisateurs, sos] = await Promise.all([
    getPelerins(),
    getGroupes(),
    getGuides(),
    getUtilisateurs(),
    getSos(),
  ]);

  const utilisateurMap = Object.fromEntries(utilisateurs.map((u) => [u.id, u]));
  const pelerin = pelerins.find((p) => p.id === proche.pelerinId);
  const pelerinUtilisateur = pelerin ? utilisateurMap[pelerin.utilisateurId] : null;
  const groupe = pelerin ? groupes.find((g) => g.id === pelerin.groupeId) : null;
  const guide = groupe ? guides.find((g) => g.id === groupe.guideId) : null;
  const guideUtilisateur = guide ? utilisateurMap[guide.utilisateurId] : null;
  const sosActif = pelerin ? sos.find((s) => s.pelerinId === pelerin.id && s.statut === "EN_ATTENTE") : null;

  if (!pelerin) {
    app.innerHTML = `<section>${banniere(user?.nomComplet)}<div class="rounded-[2rem] border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">Le pèlerin suivi est introuvable.</div></section>`;
    return;
  }

  const statutSecurite = sosActif
    ? `<span class="inline-block rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-700">Incident SOS Actif</span>`
    : `<span class="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">Situation normale</span>`;

  const blocSos = sosActif
    ? `
      <article class="mt-6 rounded-[2rem] border border-rose-200 bg-rose-50 p-6">
        <h2 class="flex items-center gap-2 text-base font-black text-rose-700"><i class="fa-solid fa-triangle-exclamation"></i> SOS ACTIF – ALERTE DÉCLENCHÉE</h2>
        <p class="mt-1 text-sm font-bold text-rose-600">Dernière localisation transmise exclusivement du SOS (ceci ne représente pas un suivi GPS continu).</p>
        <div class="mt-4 grid gap-4 rounded-2xl bg-white p-4 sm:grid-cols-3">
          <div><p class="text-xs font-extrabold uppercase tracking-widest text-slate-400">Latitude</p><p class="font-bold text-slate-800">${escapeHtml(String(sosActif.latitude ?? "-"))}</p></div>
          <div><p class="text-xs font-extrabold uppercase tracking-widest text-slate-400">Longitude</p><p class="font-bold text-slate-800">${escapeHtml(String(sosActif.longitude ?? "-"))}</p></div>
          <div><p class="text-xs font-extrabold uppercase tracking-widest text-slate-400">Heure</p><p class="font-bold text-slate-800">${escapeHtml(new Date(sosActif.dateHeure).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }))}</p></div>
        </div>
        <p class="mt-3 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-rose-700">Statut : Le guide est en cours d'intervention</p>
      </article>`
    : "";

  app.innerHTML = `
    <section>
      ${banniere(user?.nomComplet)}

      <p class="mb-3 text-xs font-extrabold uppercase tracking-widest text-slate-400">Vous suivez actuellement</p>
      <div class="grid gap-4 lg:grid-cols-3">
        <article class="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p class="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#0B6E4F]"><i class="fa-solid fa-user"></i> Pèlerin suivi</p>
          <p class="text-lg font-black text-slate-950">${escapeHtml(pelerinUtilisateur?.nomComplet || "-")}</p>
          <p class="mt-1 text-xs text-slate-500">ID : ${escapeHtml(pelerin.id.slice(0, 6).toUpperCase())} &nbsp; Passeport : ${escapeHtml(pelerin.numeroPasseport)}</p>
          <p class="mt-4 text-xs text-slate-500">Statut de Sécurité :</p>
          <div class="mt-1">${statutSecurite}</div>
        </article>

        <article class="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p class="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#0B6E4F]"><i class="fa-solid fa-route"></i> Logistique & Guide</p>
          <p class="text-sm text-slate-500">Groupe :</p>
          <p class="mb-2 font-bold text-slate-800">${escapeHtml(groupe?.nom || "-")}</p>
          <p class="text-sm text-slate-500">Guide responsable :</p>
          <p class="mb-3 font-bold text-slate-800">${escapeHtml(guideUtilisateur?.nomComplet || "-")}</p>
          ${guideUtilisateur?.telephone
            ? `<a href="tel:${escapeHtml(String(guideUtilisateur.telephone))}" class="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-600"><i class="fa-solid fa-phone"></i> Appeler</a>`
            : ""}
        </article>

        <article class="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p class="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#0B6E4F]"><i class="fa-solid fa-circle-info"></i> État général</p>
          <p class="text-sm font-bold text-slate-800">Suivi de groupe standard</p>
          <p class="mt-1 text-sm text-slate-600">Le pèlerin suit actuellement le programme et les séances d'enseignements spirituels définis par son guide.</p>
        </article>
      </div>

      ${blocSos}

      <p class="mb-3 mt-6 text-xs font-extrabold uppercase tracking-widest text-slate-400">Aperçu administratif de préparation</p>
      <div class="grid gap-3 sm:grid-cols-3">
        ${badgeValide(!!pelerin.numeroPasseport, "Passeport scanné")}
        ${badgeValide(pelerin.statutVisa === "APPROUVE", "Visa Omra / Hajj")}
        ${badgeValide(!!pelerin.certificatVaccin, "Vaccin obligatoire ACWY")}
      </div>
    </section>
  `;
}
