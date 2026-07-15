import { pageHeader } from "../components/pageHeader.js";
import { renderSosPanel } from "../components/sosPanel.js";
import { getSos } from "../services/sosService.js";
import { getPelerins } from "../services/pelerinService.js";
import { getUtilisateurs } from "../services/utilisateurService.js";
import { escapeHtml } from "../utils/html.js";

// Données fixes, utiles à la maquette — pas liées à une entité du diagramme de classes
const NUMEROS_URGENCE = [
  { nom: "Secours National Saoudien", detail: "Aide Générale et Sécurité", numero: "911" },
  { nom: "Secours National Saoudien", detail: "Urgences médicales", numero: "997" },
  { nom: "Ministère du Hajj", detail: "Assistance pèlerinage", numero: "922002814" },
];

export async function renderPoleUrgencePage() {
  const app = document.getElementById("app");

  app.innerHTML = `
    <section>
      ${pageHeader({
        kicker: "Sécurité",
        title: "Bureau d'Urgence et Intervention Rapide",
        subtitle: "Pôle d'assistance critique d'égarement. Les pèlerins perdus peuvent signaler immédiatement leur position à toute l'équipe de guides.",
      })}

      <div class="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div id="sosPanelContainer" class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"></div>

        <div class="grid gap-6">
          <article class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 class="mb-4 flex items-center gap-2 text-base font-black text-slate-950">
              <i class="fa-solid fa-phone text-[#333D2A]"></i> Numéros d'Urgences Utiles
            </h2>
            <div class="grid gap-3">
              ${NUMEROS_URGENCE.map((n) => `
                <div class="flex items-center justify-between rounded-xl bg-[#F2F2DE] px-4 py-3">
                  <div>
                    <p class="text-sm font-bold text-slate-800">${escapeHtml(n.nom)}</p>
                    <p class="text-xs text-slate-500">${escapeHtml(n.detail)}</p>
                  </div>
                  <span class="text-base font-black text-[#333D2A]">${escapeHtml(n.numero)}</span>
                </div>
              `).join("")}
            </div>
          </article>

          <article class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 class="mb-4 text-base font-black text-slate-950">Registre des Cas Résolus</h2>
            <div id="casResolusContainer" class="grid gap-3"></div>
          </article>
        </div>
      </div>
    </section>
  `;

  await chargerEtAfficher();
}

async function chargerEtAfficher() {
  const [sos, pelerins, utilisateurs] = await Promise.all([
    getSos(),
    getPelerins(),
    getUtilisateurs(),
  ]);

  const pelerinMap = Object.fromEntries(pelerins.map((p) => [p.idPelerin, p]));
  const utilisateurMap = Object.fromEntries(utilisateurs.map((u) => [u.id, u]));
  const nomResolver = (pelerinId) => utilisateurMap[pelerinMap[pelerinId]?.utilisateurId]?.nomComplet || "Pèlerin inconnu";

  const sosActifs = sos.filter((s) => s.statut === "EN_ATTENTE");
  const sosResolus = sos.filter((s) => s.statut === "RESOLU");

  renderSosPanel("sosPanelContainer", sosActifs, nomResolver, chargerEtAfficher);

  const casResolusEl = document.getElementById("casResolusContainer");
  casResolusEl.innerHTML = sosResolus.length
    ? sosResolus.map((s) => `
        <div class="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
          <div class="mb-1 flex items-center justify-between">
            <span class="text-xs font-bold text-slate-400">${escapeHtml(s.idSOS.slice(0, 6).toUpperCase())}</span>
            <span class="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700">Résolu</span>
          </div>
          <p class="text-sm font-bold text-slate-800">${escapeHtml(nomResolver(s.pelerinId))}</p>
          <p class="mt-1 text-xs text-slate-500">${escapeHtml(s.commentaire || "Aucun commentaire.")}</p>
        </div>
      `).join("")
    : `<p class="text-sm text-slate-400">Aucun cas résolu pour l'instant.</p>`;
}