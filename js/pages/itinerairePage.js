import { pageHeader } from "../components/pageHeader.js";
import { escapeHtml } from "../utils/html.js";
import { getSession, getUserRole } from "../utils/auth.js";
import { getGuideByUtilisateurId, getGroupeDuGuide } from "../services/guideService.js";
import { getGroupes } from "../services/groupeService.js";
import { getPlanningDuGroupe } from "../services/planningService.js";
import { creerCarte, centrerCarteSur } from "../components/leafletMap.js";

export async function renderItinerairePage() {
  const app = document.getElementById("app");
  const user = getSession();
  const role = getUserRole();

  // Selon le rôle, on détermine la liste des groupes consultables
  let groupesDisponibles = [];
  let groupeSelectionne = null;

  if (role === "GUIDE") {
    const guide = await getGuideByUtilisateurId(user.id);
    if (!guide) {
      app.innerHTML = `<section class="rounded-[2rem] border border-amber-200 bg-amber-50 p-8 text-center"><p class="text-sm font-semibold text-amber-700">Aucun profil guide associé à ce compte.</p></section>`;
      return;
    }
    const groupe = await getGroupeDuGuide(guide.idGuide);
    if (!groupe) {
      app.innerHTML = `<section class="rounded-[2rem] border border-slate-200 bg-white p-8 text-center"><p class="text-sm font-semibold text-slate-500">Aucun groupe ne t'a encore été assigné.</p></section>`;
      return;
    }
    groupesDisponibles = [groupe];
    groupeSelectionne = groupe;
  } else {
    // ADMIN : tous les groupes, avec un sélecteur
    groupesDisponibles = await getGroupes();
    groupeSelectionne = groupesDisponibles[0] || null;
  }

  if (!groupeSelectionne) {
    app.innerHTML = `<section class="rounded-[2rem] border border-slate-200 bg-white p-8 text-center"><p class="text-sm font-semibold text-slate-500">Aucun groupe disponible.</p></section>`;
    return;
  }

  // Le sélecteur de groupe n'apparaît que si l'Admin a plusieurs groupes à choisir
  const selecteurGroupe = role === "ADMIN" && groupesDisponibles.length > 1
    ? `
      <div class="mb-4">
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="selectGroupeItineraire">Groupe :</label>
        <select id="selectGroupeItineraire" class="w-full max-w-xs rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm">
          ${groupesDisponibles.map((g) => `<option value="${escapeHtml(g.idGroupe)}">${escapeHtml(g.nom)}</option>`).join("")}
        </select>
      </div>
    `
    : "";

  app.innerHTML = `
    <section>
      ${pageHeader({
        kicker: "Voyage",
        title: "Itinéraire de Voyage & Rituels",
        subtitle: "Consultez les étapes du voyage et leur emplacement sur la carte.",
      })}

      ${selecteurGroupe}

      <div class="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div id="listeEtapes" class="grid gap-3"></div>
        <div class="h-[500px] overflow-hidden rounded-[2rem] border border-slate-200">
          <div id="carteItineraire" class="h-full w-full"></div>
        </div>
      </div>
    </section>
  `;

  await chargerEtAfficherItineraire(groupeSelectionne.idGroupe);

  // Si l'Admin change de groupe dans le sélecteur, on recharge l'itinéraire
  const select = document.getElementById("selectGroupeItineraire");
  if (select) {
    select.addEventListener("change", () => {
      chargerEtAfficherItineraire(select.value);
    });
  }
}

async function chargerEtAfficherItineraire(groupeId) {
  const planning = await getPlanningDuGroupe(groupeId);
  afficherListeEtapes(planning);
  initialiserCarte(planning);
}

function afficherListeEtapes(planning) {
  const container = document.getElementById("listeEtapes");

  if (planning.length === 0) {
    container.innerHTML = `<p class="text-sm text-slate-400">Aucune étape planifiée pour ce groupe.</p>`;
    return;
  }

  container.innerHTML = planning
    .map((etape, index) => `
      <button data-etape-index="${index}" class="etape-btn rounded-2xl border-2 border-transparent bg-white p-4 text-left shadow-sm transition hover:border-[#333D2A]/30">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-slate-400">${escapeHtml(etape.date)} — ${escapeHtml(etape.heure)}</span>
        </div>
        <h3 class="mt-1 font-black text-slate-900">${escapeHtml(etape.titre)}</h3>
        <p class="mt-1 flex items-center gap-1 text-xs text-slate-500">
          <i class="fa-solid fa-location-dot"></i> ${escapeHtml(etape.lieu)}
        </p>
      </button>
    `)
    .join("");

  container.querySelectorAll(".etape-btn").forEach((bouton) => {
    bouton.addEventListener("click", () => {
      const index = Number(bouton.dataset.etapeIndex);
      const etape = planning[index];
      centrerCarteSur(etape.latitude, etape.longitude, etape.titre);
      marquerEtapeActive(index);
    });
  });
}

function marquerEtapeActive(indexActif) {
  document.querySelectorAll(".etape-btn").forEach((bouton) => {
    const estActif = Number(bouton.dataset.etapeIndex) === indexActif;
    bouton.classList.toggle("border-[#333D2A]", estActif);
    bouton.classList.toggle("bg-[#F2F2DE]", estActif);
  });
}

function initialiserCarte(planning) {
  if (planning.length === 0) return;
  const premiereEtape = planning[0];
  creerCarte("carteItineraire", premiereEtape.latitude, premiereEtape.longitude);
  marquerEtapeActive(0);
}