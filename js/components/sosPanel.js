
import { escapeHtml } from "../utils/html.js";
import { showToast } from "./toast.js";
import { marquerSosResolu ,declencherSos} from "../services/sosService.js";
import { openConfirm} from "./modal.js";

function tempsEcoule(dateHeure) {
  const diffMs = Date.now() - new Date(dateHeure).getTime();
  const heures = Math.floor(diffMs / 3600000);
  const minutes = Math.floor((diffMs % 3600000) / 60000);
  return heures > 0 ? `${heures}h ${minutes}min` : `${minutes} min`;
}

function sosCard(sos, pelerinNom) {
  return `
    <div class="mb-3 rounded-2xl border-l-4 border-rose-500 bg-rose-50 p-4">
      <div class="mb-2 flex items-center justify-between">
        <span class="rounded-full bg-rose-600 px-2.5 py-0.5 text-xs font-black text-white">${escapeHtml(sos.idSOS.slice(0, 6).toUpperCase())}</span>
        <span class="text-xs text-slate-400"><i class="fa-regular fa-clock"></i> ${tempsEcoule(sos.dateHeure)}</span>
      </div>
      <p class="font-black text-slate-900">${escapeHtml(pelerinNom)}</p>
      <p class="mt-1 flex items-center gap-1 text-xs text-slate-500">
        <i class="fa-solid fa-location-dot"></i> ${sos.latitude.toFixed(4)}, ${sos.longitude.toFixed(4)}
      </p>
      ${sos.commentaire ? `<p class="mt-2 text-sm italic text-slate-600">"${escapeHtml(sos.commentaire)}"</p>` : ""}
      <button data-resolve-sos="${escapeHtml(sos.idSOS)}" class="mt-3 rounded-xl bg-[#333D2A] px-4 py-2 text-xs font-bold text-white transition hover:opacity-90">
        Marquer Résolu
      </button>
    </div>
  `;
}

// Affiche le panneau "Alertes de Paniques Actives" dans le conteneur donné
// pelerinNomResolver : fonction (pelerinId) => nom complet, fournie par la page appelante
export function renderSosPanel(containerId, sosActifs, pelerinNomResolver, onResolved) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <h2 class="mb-4 flex items-center gap-2 text-lg font-black text-slate-950">
      <i class="fa-solid fa-tower-broadcast text-rose-600"></i> Alertes de Paniques Actives (${sosActifs.length})
    </h2>
    ${sosActifs.length
      ? sosActifs.map((s) => sosCard(s, pelerinNomResolver(s.pelerinId))).join("")
      : `<p class="text-sm text-slate-400">Aucune alerte active pour le moment.</p>`
    }
  `;

  container.querySelectorAll("[data-resolve-sos]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await marquerSosResolu(button.dataset.resolveSos);
        showToast("Alerte marquée comme résolue.");
        if (typeof onResolved === "function") await onResolved();
      } catch (error) {
        showToast(error.message, "error");
      }
    });
  });
}
// Bouton de déclenchement SOS — réutilisé sur le Dashboard ET sur "Mon Espace SOS"
export function renderPelerinSosTrigger(containerId, pelerin, groupe, onTriggered) {
  const zone = document.getElementById(containerId);
  if (!zone) return;

  zone.innerHTML = `
    <div class="flex flex-col items-center gap-4 rounded-3xl border-2 border-rose-200 bg-rose-50 p-6 sm:flex-row sm:justify-between sm:text-left">
      <div>
        <h2 class="flex items-center gap-2 text-lg font-black text-rose-700">
          <i class="fa-solid fa-shield-halved"></i> Aide d'urgence en Cas d'Égarement
        </h2>
        <p class="mt-1 max-w-xl text-sm text-rose-600">
          Si tu te perds dans la foule, perds de vue ton groupe, ou si tu as besoin d'une assistance immédiate,
          appuie sur le <strong>GRAND BOUTON ROUGE</strong>. Ton guide et le centre de contrôle seront alertés à l'instant.
        </p>
      </div>
      <button id="sosTriggerBtn" class="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-rose-600 text-lg font-black text-white shadow-lg shadow-rose-300 transition hover:bg-rose-700 active:scale-95">
        SOS
      </button>
    </div>
  `;

  document.getElementById("sosTriggerBtn").addEventListener("click", () => {
    openConfirm({
      title: "Déclencher une alerte SOS",
      message: "Ta position actuelle sera envoyée à ton guide et à l'administration. Confirmer l'envoi ?",
      confirmLabel: "OUI, ENVOYER",
      onConfirm: async () => {
        try {
          await declencherSos({
            pelerinId: pelerin.idPelerin,
            guideId: groupe?.guideId || null,
            commentaire: "",
          });
          showToast("Alerte SOS envoyée. De l'aide arrive.");
          if (typeof onTriggered === "function") await onTriggered();
        } catch (error) {
          showToast(error.message, "error");
        }
      },
    });
  });
}

// Panneau "État de l'alerte active" — affiché quand un SOS est en cours
export function renderPelerinSosActif(containerId, sos, guideNom, guideTelephone) {
  const zone = document.getElementById(containerId);
  if (!zone) return;

  zone.innerHTML = `
    <div class="rounded-[2rem] border border-slate-200 bg-white p-6">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-base font-black text-slate-950">État de l'alerte active :</h2>
        <span class="text-xs text-slate-400">Date et Heure de l'alerte : ${new Date(sos.dateHeure).toLocaleString("fr-FR")}</span>
      </div>
      <span class="mb-4 inline-block rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-700">En attente de secours</span>

      <div class="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p class="text-xs font-extrabold uppercase tracking-widest text-slate-400">Localisation déclarée :</p>
          <p class="mt-1 flex items-center gap-1 text-sm font-bold text-slate-800">
            <i class="fa-solid fa-location-dot text-rose-500"></i> ${sos.latitude.toFixed(4)}, ${sos.longitude.toFixed(4)}
          </p>
          <p class="mt-3 text-xs font-extrabold uppercase tracking-widest text-slate-400">Guide responsable :</p>
          <p class="mt-1 text-sm font-bold text-slate-800">${escapeHtml(guideNom)}</p>
        </div>
        <div class="rounded-2xl bg-rose-50 p-4">
          <p class="text-xs font-extrabold uppercase tracking-widest text-rose-600">Commentaire et Actions :</p>
          <p class="mt-1 text-sm text-rose-700">L'admin et le guide ont été notifiés. Un premier commentaire de secours s'affichera ici dès qu'un membre de l'équipe aura débuté l'intervention.</p>
        </div>
      </div>

      <div class="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <p class="mb-1 flex items-center gap-2 text-sm font-black text-amber-700">
          <i class="fa-solid fa-triangle-exclamation"></i> Que faire en attendant ?
        </p>
        <p class="text-sm text-amber-700">
          Reste là où tu es, si possible dans un endroit visible et sécurisé. Ne panique pas. Ton guide ou un membre
          de notre équipe d'assistance t'appellera sur ton téléphone ou te rejoindra directement aux coordonnées indiquées.
        </p>
      </div>
    </div>
  `;
}