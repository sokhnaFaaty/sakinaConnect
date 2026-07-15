import { escapeHtml } from "../utils/html.js";
import { getSession } from "../utils/auth.js";
import { getPelerinByUtilisateurId } from "../services/pelerinService.js";
import { getGroupes } from "../services/groupeService.js";
import { getGuides, getGuideByUtilisateurId } from "../services/guideService.js";
import { getUtilisateurs } from "../services/utilisateurService.js";
import { getSos, getSosActifDuPelerin } from "../services/sosService.js";
import { renderPelerinSosTrigger, renderPelerinSosActif } from "../components/sosPanel.js";

const NUMEROS_URGENCE = [
  { nom: "Secours National Saoudien", detail: "Aide Générale et Sécurité", numero: "911" },
  { nom: "Secours National Saoudien", detail: "Urgences médicales", numero: "997" },
  { nom: "Ministère du Hajj", detail: "Assistance pèlerinage", numero: "922002814" },
];

export async function renderPoleUrgencePelerinPage() {
  const app = document.getElementById("app");
  const user = getSession();

  const pelerin = await getPelerinByUtilisateurId(user.id);
  if (!pelerin) {
    app.innerHTML = `<section class="rounded-[2rem] border border-amber-200 bg-amber-50 p-8 text-center"><p class="text-sm font-semibold text-amber-700">Aucun profil pèlerin associé à ce compte.</p></section>`;
    return;
  }

  const [groupes, guides, utilisateurs, tousLesSos] = await Promise.all([
    getGroupes(),
    getGuides(),
    getUtilisateurs(),
    getSos(),
  ]);

  const groupe = groupes.find((g) => g.idGroupe === pelerin.groupeId);
  const guide = groupe ? guides.find((g) => g.idGuide === groupe.guideId) : null;
  const utilisateurMap = Object.fromEntries(utilisateurs.map((u) => [u.id, u]));
  const guideUtilisateur = guide ? utilisateurMap[guide.utilisateurId] : null;

  const mesSos = tousLesSos.filter((s) => s.pelerinId === pelerin.idPelerin);
  const mesSosResolus = mesSos.filter((s) => s.statut === "RESOLU");
  const sosActif = mesSos.find((s) => s.statut === "EN_ATTENTE") || null;

  app.innerHTML = `
    <section>
      <div class="mb-6 flex items-start gap-4 rounded-3xl bg-rose-600 p-6 text-white shadow-sm sm:p-7">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15"><i class="fa-solid fa-shield-halved"></i></div>
        <div>
          <span class="mb-1 inline-block rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">Pôle Assistance Secours</span>
          <h1 class="font-display text-2xl font-black sm:text-3xl">Mon Espace SOS</h1>
          <p class="mt-1 text-sm text-rose-100">Signalez instantanément votre position exacte si vous vous perdez ou si vous faites face à une urgence. L'agence interviendra à la seconde inshaAllah.</p>
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div class="grid gap-6">
          <div id="sosMainZone"></div>

          <article class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 class="mb-4 text-base font-black text-slate-950">Mes SOS Précédents Résolus (${mesSosResolus.length})</h2>
            ${mesSosResolus.length
              ? mesSosResolus.map((s) => `
                  <div class="mb-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 last:mb-0">
                    <div class="mb-1 flex items-center justify-between">
                      <span class="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-black text-slate-600">${escapeHtml(s.idSOS.slice(0, 6).toUpperCase())}</span>
                      <span class="text-xs text-slate-400">${new Date(s.dateHeure).toLocaleString("fr-FR")}</span>
                    </div>
                    <p class="flex items-center gap-1 text-sm text-slate-600"><i class="fa-solid fa-location-dot"></i> ${s.latitude.toFixed(4)}, ${s.longitude.toFixed(4)}</p>
                  </div>
                `).join("")
              : `<p class="text-sm text-slate-400">Aucun SOS résolu pour l'instant.</p>`
            }
          </article>
        </div>

        <div class="grid gap-6">
          <article class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 class="mb-3 flex items-center gap-2 text-base font-black text-slate-950">
              <i class="fa-solid fa-user-shield text-[#333D2A]"></i> Mon guide
            </h2>
            <div class="flex items-center gap-3">
              <div class="h-12 w-12 overflow-hidden rounded-full bg-slate-100">
                ${guideUtilisateur?.photo ? `<img src="${escapeHtml(guideUtilisateur.photo)}" class="h-full w-full object-cover" />` : `<div class="flex h-full w-full items-center justify-center text-slate-300"><i class="fa-solid fa-user"></i></div>`}
              </div>
              <div>
                <p class="text-sm font-bold text-slate-900">${escapeHtml(guideUtilisateur?.nomComplet || "Non assigné")}</p>
                <p class="text-xs text-slate-500">À votre écoute 24h/24</p>
              </div>
            </div>
            <p class="mt-3 text-xs text-slate-500">Votre guide spirituel et logistique dispose d'un accès à votre profil de santé et à votre contact d'urgence.</p>
            <a href="tel:${escapeHtml(guideUtilisateur?.telephone || "")}" class="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-[#333D2A] px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90">
              <i class="fa-solid fa-phone"></i> Appeler mon guide
            </a>
          </article>

          <article class="rounded-[2rem] bg-[#333D2A] p-6 text-white">
            <h2 class="mb-4 flex items-center gap-2 text-base font-black">
              <i class="fa-solid fa-phone-volume text-[#BC7B3B]"></i> Numéros d'Urgences Utiles
            </h2>
            <div class="grid gap-3">
              ${NUMEROS_URGENCE.map((n) => `
                <div class="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3">
                  <div>
                    <p class="text-sm font-bold">${escapeHtml(n.nom)}</p>
                    <p class="text-xs text-slate-300">${escapeHtml(n.detail)}</p>
                  </div>
                  <span class="text-base font-black text-[#BC7B3B]">${escapeHtml(n.numero)}</span>
                </div>
              `).join("")}
            </div>
          </article>
        </div>
      </div>
    </section>
  `;

  afficherZonePrincipale(pelerin, groupe, sosActif, guideUtilisateur?.nomComplet || "Non assigné");
}

async function afficherZonePrincipale(pelerin, groupe, sosActif, guideNom) {
  if (sosActif) {
    renderPelerinSosActif("sosMainZone", sosActif, guideNom);
  } else {
    renderPelerinSosTrigger("sosMainZone", pelerin, groupe, async () => {
      await renderPoleUrgencePelerinPage();
    });
  }
}
