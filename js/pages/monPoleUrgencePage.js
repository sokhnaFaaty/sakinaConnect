import { pageHeader } from "../components/pageHeader.js";
import { renderSosPanel } from "../components/sosPanel.js";
import { getSession } from "../utils/auth.js";
import { getGuideByUtilisateurId, getGroupeDuGuide } from "../services/guideService.js";
import { getPelerinsDuGroupe } from "../services/pelerinService.js";
import { getUtilisateurs } from "../services/utilisateurService.js";
import { getSos } from "../services/sosService.js";

export async function renderMonPoleUrgencePage() {
  const app = document.getElementById("app");
  const user = getSession();

  const guide = await getGuideByUtilisateurId(user.id);
  if (!guide) {
    app.innerHTML = `<section class="rounded-[2rem] border border-amber-200 bg-amber-50 p-8 text-center"><p class="text-sm font-semibold text-amber-700">Aucun profil guide associé à ce compte.</p></section>`;
    return;
  }

  const groupe = await getGroupeDuGuide(guide.id);
  if (!groupe) {
    app.innerHTML = `<section class="rounded-[2rem] border border-slate-200 bg-white p-8 text-center"><p class="text-sm font-semibold text-slate-500">Aucun groupe ne t'a encore été assigné.</p></section>`;
    return;
  }

  app.innerHTML = `
    <section>
      ${pageHeader({
        kicker: "Sécurité",
        title: "Bureau d'Urgence et Intervention Rapide",
        subtitle: "Pôle d'assistance critique d'égarement pour les pèlerins de ton groupe.",
      })}
      <div id="sosPanelContainer" class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"></div>
    </section>
  `;

  await chargerEtAfficher(groupe.id);
}

async function chargerEtAfficher(groupeId) {
  const [pelerinsDuGroupe, sos, utilisateurs] = await Promise.all([
    getPelerinsDuGroupe(groupeId),
    getSos(),
    getUtilisateurs(),
  ]);

  const pelerinIdsDuGroupe = pelerinsDuGroupe.map((p) => p.id);
  const pelerinMap = Object.fromEntries(pelerinsDuGroupe.map((p) => [p.id, p]));
  const utilisateurMap = Object.fromEntries(utilisateurs.map((u) => [u.id, u]));
  const nomResolver = (pelerinId) => utilisateurMap[pelerinMap[pelerinId]?.utilisateurId]?.nomComplet || "Pèlerin inconnu";

  // Ne garder que les SOS des pèlerins de CE groupe, et encore en attente
  const sosActifs = sos.filter((s) => pelerinIdsDuGroupe.includes(s.pelerinId) && s.statut === "EN_ATTENTE");

  renderSosPanel("sosPanelContainer", sosActifs, nomResolver, () => chargerEtAfficher(groupeId));
}