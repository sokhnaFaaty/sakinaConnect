// pages/archivesPage.js — Liste des Archives (ADMIN)
import { pageHeader } from "../components/pageHeader.js";
import { openConfirm } from "../components/modal.js";
import { showToast } from "../components/toast.js";
import { escapeHtml } from "../utils/html.js";
import { getUtilisateurs } from "../services/utilisateurService.js";
import { getPelerinsArchives, restorePelerin, deletePelerinDefinitif } from "../services/pelerinService.js";
import { getGuidesArchives, restoreGuide, deleteGuideDefinitif } from "../services/guideService.js";
import { getGroupesArchives, restoreGroupe, deleteGroupeDefinitif } from "../services/groupeService.js";
import { getProchesArchives, restoreProche, deleteProcheDefinitif } from "../services/procheService.js";

export async function renderArchivesPage() {
  const app = document.getElementById("app");

  const [pelerins, guides, groupes, proches, utilisateurs] = await Promise.all([
    getPelerinsArchives(),
    getGuidesArchives(),
    getGroupesArchives(),
    getProchesArchives(),
    getUtilisateurs(),
  ]);
  const um = Object.fromEntries(utilisateurs.map((u) => [u.id, u]));

  const onglets = {
    pelerins: { label: "Pèlerins", icon: "fa-users", items: pelerins, nom: (p) => um[p.utilisateurId]?.nomComplet || "-", sous: (p) => `Passeport : ${p.numeroPasseport || "-"}`, restore: restorePelerin, del: deletePelerinDefinitif },
    guides: { label: "Guides", icon: "fa-user-tie", items: guides, nom: (g) => um[g.utilisateurId]?.nomComplet || "-", sous: () => "Guide", restore: restoreGuide, del: deleteGuideDefinitif },
    groupes: { label: "Groupes", icon: "fa-people-group", items: groupes, nom: (g) => g.nom || "-", sous: (g) => `ID : ${g.id.slice(0, 6).toUpperCase()}`, restore: restoreGroupe, del: deleteGroupeDefinitif },
    proches: { label: "Proches", icon: "fa-hand-holding-heart", items: proches, nom: (p) => um[p.utilisateurId]?.nomComplet || "-", sous: (p) => `Lien : ${p.lienParente || "-"}`, restore: restoreProche, del: deleteProcheDefinitif },
  };

  let active = "pelerins";
  let search = "";

  app.innerHTML = `
    <section>
      ${pageHeader({ kicker: "Corbeille", title: "Liste des Archives", subtitle: "Gérez les fiches supprimées temporairement (soft delete). Restaurez-les ou supprimez-les définitivement." })}

      <div class="mb-6 flex flex-col gap-3 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div id="archTabs" class="flex flex-wrap gap-2"></div>
        <div class="relative sm:w-72">
          <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input id="archSearch" type="text" placeholder="Rechercher…" class="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm" />
        </div>
      </div>

      <div id="archList" class="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"></div>
    </section>
  `;

  const renderTabs = () => {
    document.getElementById("archTabs").innerHTML = Object.entries(onglets).map(([key, o]) => `
      <button data-tab="${key}" class="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition ${
        active === key ? "bg-[#333D2A] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }">
        <i class="fa-solid ${o.icon}"></i> ${o.label} archivés (${o.items.length})
      </button>`).join("");
    document.querySelectorAll("#archTabs [data-tab]").forEach((b) => {
      b.addEventListener("click", () => { active = b.dataset.tab; draw(); });
    });
  };

  const draw = () => {
    renderTabs();
    const o = onglets[active];
    const q = search.toLowerCase();
    const items = o.items.filter((it) => !q || `${o.nom(it)} ${o.sous(it)}`.toLowerCase().includes(q));

    document.getElementById("archList").innerHTML = items.length
      ? `<div class="grid gap-3">${items.map((it) => `
          <div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
            <div>
              <p class="font-bold text-slate-800">${escapeHtml(o.nom(it))}</p>
              <p class="text-xs text-slate-500">${escapeHtml(o.sous(it))}</p>
            </div>
            <div class="flex items-center gap-2">
              <button data-restore="${escapeHtml(it.id)}" class="inline-flex items-center gap-1 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-600"><i class="fa-solid fa-rotate-left"></i> Restaurer</button>
              <button data-del="${escapeHtml(it.id)}" class="inline-flex items-center gap-1 rounded-xl bg-rose-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-rose-700"><i class="fa-solid fa-trash"></i> Supprimer définitivement</button>
            </div>
          </div>`).join("")}</div>`
      : `<div class="flex flex-col items-center gap-2 py-10 text-center text-sm text-slate-400">
          <i class="fa-solid fa-box-archive text-2xl"></i>
          <p>Aucun élément archivé dans « ${escapeHtml(o.label)} ».</p>
        </div>`;

    document.querySelectorAll("#archList [data-restore]").forEach((b) => {
      b.addEventListener("click", async () => {
        try {
          await o.restore(b.dataset.restore);
          showToast(`${o.label.slice(0, -1)} restauré(e).`);
          await renderArchivesPage();
        } catch (error) { showToast(error.message, "error"); }
      });
    });

    document.querySelectorAll("#archList [data-del]").forEach((b) => {
      b.addEventListener("click", () => {
        openConfirm({
          title: "Suppression définitive",
          message: "Cette action est <strong>irréversible</strong>. Supprimer définitivement cet élément (et son compte lié le cas échéant) ?",
          onConfirm: async () => {
            try {
              await o.del(b.dataset.del);
              showToast("Élément supprimé définitivement.");
              await renderArchivesPage();
            } catch (error) { showToast(error.message, "error"); }
          },
        });
      });
    });
  };

  document.getElementById("archSearch").addEventListener("input", (e) => { search = e.target.value.trim(); draw(); });

  draw();
}
