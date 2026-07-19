import { getSession } from "../utils/auth.js";
import { getPelerinByUtilisateurId } from "../services/pelerinService.js";
import { getGroupes } from "../services/groupeService.js";
import { getGuides } from "../services/guideService.js";
import { getUtilisateurs } from "../services/utilisateurService.js";
import { getPlanningDuGroupe } from "../services/planningService.js";
import { declencherSos, getSosActifDuPelerin } from "../services/sosService.js";
import { showToast } from "../components/toast.js";
import { openConfirm } from "../components/modal.js";
import { navigate } from "../router.js";
import { escapeHtml } from "../utils/html.js";

export async function renderDashboardPelerinPage() {
  const app = document.getElementById("app");
  const user = getSession();

  const pelerin = await getPelerinByUtilisateurId(user.id);
  if (!pelerin) {
    app.innerHTML = `<section class="rounded-[2rem] border border-amber-200 bg-amber-50 p-8 text-center"><p class="text-sm font-semibold text-amber-700">Aucun profil pèlerin associé à ce compte.</p></section>`;
    return;
  }

  const [groupes, guides, utilisateurs, planning, sosActif] = await Promise.all([
    getGroupes(),
    getGuides(),
    getUtilisateurs(),
    getPlanningDuGroupe(pelerin.groupeId),
    getSosActifDuPelerin(pelerin.id),
  ]);

  const groupe = groupes.find((g) => g.id === pelerin.groupeId);
  const guide = groupe ? guides.find((g) => g.id === groupe.guideId) : null;
  const utilisateurMap = Object.fromEntries(utilisateurs.map((u) => [u.id, u]));
  const guideUtilisateur = guide ? utilisateurMap[guide.utilisateurId] : null;

  const maintenant = new Date();
  const prochainRituel = planning
    .filter((p) => new Date(`${p.date}T${p.heure}`) >= maintenant)
    .sort((a, b) => new Date(`${a.date}T${a.heure}`) - new Date(`${b.date}T${b.heure}`))[0]
    || planning[0] || null;

  app.innerHTML = `
    <section>
      <div class="mb-6 rounded-3xl bg-[#333D2A] p-6 text-white shadow-sm sm:p-7">
        <p class="text-sm font-bold text-[#BC7B3B]">ASSALAMU ALAYKUM,</p>
        <h1 class="font-display text-2xl font-black sm:text-3xl">${escapeHtml(user.nomComplet)}</h1>
        <p class="mt-1 text-sm text-slate-300">Votre guide pour l'Omra : ${escapeHtml(guideUtilisateur?.nomComplet || "-")}</p>
      </div>

      <!-- "Avis important" viendra de la branche feature/annonces -->

      <div class="mb-6 grid gap-4 sm:grid-cols-2">
        <div class="rounded-2xl border border-slate-200 bg-white p-5">
          <div class="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-[#F2F2DE] text-[#333D2A]"><i class="fa-regular fa-clock"></i></div>
          <h2 class="font-black text-slate-950">1. Mon planning du jour</h2>
          <p class="text-xs text-slate-500">Voir les horaires et les lieux de rencontre</p>
          ${prochainRituel ? `
            <div class="mt-3 rounded-xl bg-[#F2F2DE] p-3">
              <p class="text-xs font-extrabold uppercase tracking-wider text-[#333D2A]">Prochain rituel :</p>
              <p class="mt-1 text-sm font-bold text-slate-800">${escapeHtml(prochainRituel.titre)} (${escapeHtml(prochainRituel.lieu)}) à ${escapeHtml(prochainRituel.heure)}</p>
            </div>
          ` : `<p class="mt-3 text-sm text-slate-400">Aucun événement à venir.</p>`}
        </div>

        <div class="rounded-2xl border border-slate-200 bg-white p-5">
          <div class="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600"><i class="fa-solid fa-phone"></i></div>
          <h2 class="font-black text-slate-950">2. Contacter mon guide</h2>
          <p class="text-xs text-slate-500">Besoin d'aide ou égaré ? Parlez à l'Oustadh</p>
          <div class="mt-3 flex items-center justify-between rounded-xl bg-[#F2F2DE] p-3">
            <div>
              <p class="text-sm font-bold text-slate-800">${escapeHtml(guideUtilisateur?.nomComplet || "Non assigné")}</p>
              <p class="text-xs text-slate-500">Langues : Wolof - Français - Anglais</p>
            </div>
            <a href="tel:${escapeHtml(guideUtilisateur?.telephone || "")}" class="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700">
              <i class="fa-solid fa-phone"></i> Appeler
            </a>
          </div>
        </div>
      </div>

      <div id="sosZone"></div>
    </section>
  `;

  renderZoneSos(pelerin, groupe, sosActif);
}

function renderZoneSos(pelerin, groupe, sosActif) {
  const zone = document.getElementById("sosZone");

  if (sosActif) {
    zone.innerHTML = `
      <div class="rounded-3xl border-2 border-rose-300 bg-rose-50 p-6 text-center">
        <div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-rose-600 text-white">
          <i class="fa-solid fa-triangle-exclamation text-xl"></i>
        </div>
        <h2 class="text-lg font-black text-rose-700">Alerte SOS en cours</h2>
        <p class="mt-1 text-sm text-rose-600">Ton guide et le centre de contrôle ont été alertés. Reste où tu es si possible, de l'aide arrive.</p>
        <button id="voirDetailSosBtn" class="mt-3 text-sm font-bold text-rose-700 underline">Voir le détail dans Pôle d'Urgence SOS</button>
      </div>
    `;
    document.getElementById("voirDetailSosBtn").addEventListener("click", () => navigate("pole-urgence-pelerin"));
    return;
  }

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
            pelerinId: pelerin.id,
            guideId: groupe?.guideId || null,
            commentaire: "",
          });
          showToast("Alerte SOS envoyée. De l'aide arrive.");
          const nouveauSosActif = await getSosActifDuPelerin(pelerin.id);
          renderZoneSos(pelerin, groupe, nouveauSosActif);
        } catch (error) {
          showToast(error.message, "error");
        }
      },
    });
  });
}