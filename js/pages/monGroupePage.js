// pages/monGroupePage.js
import { pageHeader } from "../components/pageHeader.js";
import { renderTable } from "../components/table.js";
import { escapeHtml } from "../utils/html.js";
import { getSession } from "../utils/auth.js";
import { getGuideByUtilisateurId, getGroupeDuGuide } from "../services/guideService.js";
import { getPelerinsDuGroupe } from "../services/pelerinService.js";
import { getUtilisateurs } from "../services/utilisateurService.js";
import { getHotels } from "../services/hotelService.js";

export async function renderMonGroupePage() {
  const app = document.getElementById("app");
  const user = getSession();

  // 1. Retrouver la fiche guide liée au compte connecté
  const guide = await getGuideByUtilisateurId(user.id);

  if (!guide) {
    app.innerHTML = `
      <section class="rounded-[2rem] border border-amber-200 bg-amber-50 p-8 text-center">
        <p class="text-sm font-semibold text-amber-700">Aucun profil guide associé à ce compte.</p>
      </section>
    `;
    return;
  }

  // 2. Retrouver le groupe qu'il encadre (un seul groupe par guide)
  const groupe = await getGroupeDuGuide(guide.idGuide);

  if (!groupe) {
    app.innerHTML = `
      <section class="rounded-[2rem] border border-slate-200 bg-white p-8 text-center">
        <p class="text-sm font-semibold text-slate-500">Aucun groupe ne t'a encore été assigné.</p>
      </section>
    `;
    return;
  }

  // 3. Charger les pèlerins de ce groupe + les hôtels pour affichage
  const [pelerins, utilisateurs, hotels] = await Promise.all([
    getPelerinsDuGroupe(groupe.idGroupe),
    getUtilisateurs(),
    getHotels(),
  ]);

  const utilisateurMap = Object.fromEntries(utilisateurs.map((u) => [u.id, u]));
  const hotelMap = Object.fromEntries(hotels.map((h) => [h.idHotel, h.nom]));

  const nbApprouves = pelerins.filter((p) => p.statutVisa === "APPROUVE").length;

  app.innerHTML = `
    <section>
      ${pageHeader({
        kicker: "Espace Guide",
        title: `Mon groupe : ${escapeHtml(groupe.nom)}`,
        subtitle: "Consulte la logistique, les pèlerins assignés et les informations de ton groupe.",
      })}

      <!-- Chiffres clés -->
      <div class="mb-6 grid gap-4 sm:grid-cols-3">
        <div class="rounded-2xl border border-slate-200 bg-white p-5">
          <p class="text-xs font-extrabold uppercase tracking-widest text-slate-400">Effectif pèlerins</p>
          <p class="mt-1 text-2xl font-black text-slate-950">${pelerins.length}</p>
        </div>
        <div class="rounded-2xl border border-slate-200 bg-white p-5">
          <p class="text-xs font-extrabold uppercase tracking-widest text-slate-400">Visas approuvés</p>
          <p class="mt-1 text-2xl font-black text-slate-950">${nbApprouves}/${pelerins.length}</p>
        </div>
        <div class="rounded-2xl border border-slate-200 bg-white p-5">
          <p class="text-xs font-extrabold uppercase tracking-widest text-slate-400">Dates du voyage</p>
          <p class="mt-1 text-sm font-bold text-slate-950">${escapeHtml(groupe.dateDepart)} → ${escapeHtml(groupe.dateRetour)}</p>
        </div>
      </div>

      <!-- Infos hôtels -->
      <div class="mb-6 grid gap-4 sm:grid-cols-2">
        <div class="rounded-2xl border border-slate-200 bg-white p-5">
          <p class="text-xs font-extrabold uppercase tracking-widest text-slate-400">Hôtel à la Mecque</p>
          <p class="mt-1 text-sm font-bold text-slate-950">${escapeHtml(hotelMap[groupe.hotelMecqueId] || "-")}</p>
        </div>
        <div class="rounded-2xl border border-slate-200 bg-white p-5">
          <p class="text-xs font-extrabold uppercase tracking-widest text-slate-400">Hôtel à Médine</p>
          <p class="mt-1 text-sm font-bold text-slate-950">${escapeHtml(hotelMap[groupe.hotelMedineId] || "-")}</p>
        </div>
      </div>

      <!-- Liste des pèlerins -->
      <article class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="mb-4 text-xl font-black text-slate-950">Liste de mon Groupe (${pelerins.length})</h2>
        ${renderTable({
          rows: pelerins,
          emptyMessage: "Aucun pèlerin dans ce groupe pour l'instant.",
          columns: [
            {
              label: "Nom Complet",
              render: (p) => escapeHtml(utilisateurMap[p.utilisateurId]?.nomComplet || "—"),
            },
            { label: "N Passeport", render: (p) => escapeHtml(p.numeroPasseport) },
            { label: "Statut Visa", render: (p) => escapeHtml(p.statutVisa) },
            { label: "Santé", render: (p) => escapeHtml(p.informationsMedicales || "----") },
          ],
        })}
      </article>
    </section>
  `;
}