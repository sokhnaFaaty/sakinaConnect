// pages/annoncePage.js — Tableau d'affichage des communiqués (ADMIN + GUIDE)
import { pageHeader } from "../components/pageHeader.js";
import { openModal, openConfirm } from "../components/modal.js";
import { pagination, bindPagination } from "../components/pagination.js";
import { showToast } from "../components/toast.js";
import { escapeHtml } from "../utils/html.js";
import { showError, hideError, validateField } from "../utils/formValidator.js";
import { getSession, getUserRole } from "../utils/auth.js";
import { getAnnoncesVisibles, getGroupeIdDuLecteur, createAnnonce, updateAnnonce, deleteAnnonce, statutAnnonce, STATUT_ANNONCE } from "../services/annonceService.js";
import { getUtilisateurs } from "../services/utilisateurService.js";
import { getGuides } from "../services/guideService.js";
import { getGroupes } from "../services/groupeService.js";

const ROLE_LABELS = { ADMIN: "Administrateur", GUIDE: "Guide", PELERIN: "Pèlerin", PROCHE: "Proche" };
const PER_PAGE = 3;

// ---------- Modal de publication / édition ----------
// annonce : null => création ; objet => édition.
// groupeId : null => communiqué global (tous les pèlerins) ; <id> => réservé à ce groupe.
// - GUIDE : la cible est forcée sur son groupe ; sa publication passe « en attente » de validation.
// - ADMIN : un select dynamique permet de viser « Tous les pèlerins » ou un groupe précis ;
//           sa publication est directement approuvée.
function openFormAnnonce(user, role, groupeId, groupes, annonce, onDone) {
  const isAdmin = role === "ADMIN";
  const isEdit = !!annonce;

  // Bloc de ciblage : select pour l'admin, bandeau informatif pour le guide.
  const blocCible = isAdmin
    ? `
      <div>
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="annonceGroupe">Destinataires du communiqué *</label>
        <select class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" id="annonceGroupe">
          <option value="" ${annonce && !annonce.groupeId ? "selected" : ""}>Tous les pèlerins (communiqué général)</option>
          ${groupes.map((g) => `<option value="${escapeHtml(g.id)}" ${annonce && annonce.groupeId === g.id ? "selected" : ""}>Groupe : ${escapeHtml(g.nom)}</option>`).join("")}
        </select>
      </div>
    `
    : `
      <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600">
        <i class="fa-solid fa-circle-info text-[#333D2A]"></i>
        Ce communiqué sera adressé aux <span class="font-black text-[#333D2A]">pèlerins de ton groupe</span>, après validation par l'administrateur.
      </div>
    `;

  const porteeUrgence = isAdmin ? "les pèlerins concernés" : "les pèlerins de ton groupe";

  openModal({
    title: isEdit ? "Modifier le communiqué" : "Diffuser un message système",
    icon: "fa-bullhorn",
    confirmLabel: isEdit ? "Enregistrer" : "Publier l'annonce",
    confirmIcon: isEdit ? "fa-floppy-disk" : "fa-paper-plane",
    body: `
      ${blocCible}
      <div>
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="annonceTitre">Titre du communiqué *</label>
        <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" type="text" id="annonceTitre" value="${escapeHtml(annonce?.titre || "")}" placeholder="Ex: Modification de la ligne de Bus de la Mecque" />
        <p id="annonceTitreError" class="mt-1 hidden text-xs text-rose-600"></p>
      </div>
      <div>
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="annonceContenu">Contenu du message *</label>
        <textarea class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm" id="annonceContenu" rows="4" placeholder="Décrivez clairement et précisément les détails ...">${escapeHtml(annonce?.contenu || "")}</textarea>
        <p id="annonceContenuError" class="mt-1 hidden text-xs text-rose-600"></p>
      </div>
      <label class="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-slate-700">
        <input type="checkbox" id="annonceUrgent" class="h-5 w-5 accent-rose-600" ${annonce?.urgence ? "checked" : ""} />
        <span>Marquer comme urgent (affiche un bandeau rouge chez ${escapeHtml(porteeUrgence)})</span>
      </label>
    `,
    onConfirm: async (modal) => {
      const titre = modal.querySelector("#annonceTitre").value.trim();
      const contenu = modal.querySelector("#annonceContenu").value.trim();
      const urgence = modal.querySelector("#annonceUrgent").checked;
      // Admin : cible choisie dans le select (vide => global). Guide : son groupe forcé.
      const cibleGroupeId = isAdmin ? (modal.querySelector("#annonceGroupe").value || null) : groupeId;

      let hasError = false;
      const titreError = validateField(titre, "Le titre");
      if (titreError) { showError("annonceTitre", "annonceTitreError", titreError); hasError = true; }
      else hideError("annonceTitre", "annonceTitreError");
      const contenuError = validateField(contenu, "Le contenu");
      if (contenuError) { showError("annonceContenu", "annonceContenuError", contenuError); hasError = true; }
      else hideError("annonceContenu", "annonceContenuError");
      if (hasError) return false;

      try {
        if (isEdit) {
          // Le guide qui modifie sa propre annonce la re-soumet à validation ;
          // l'admin conserve le statut existant.
          const champsStatut = role === "GUIDE"
            ? { statut: STATUT_ANNONCE.EN_ATTENTE, motifRejet: "" }
            : {};
          await updateAnnonce(annonce.id, { titre, contenu, urgence, groupeId: cibleGroupeId, ...champsStatut });
          showToast(role === "GUIDE" ? "Communiqué renvoyé pour validation." : "Communiqué modifié.");
        } else {
          // Guide : en attente de validation ; admin : approuvé directement.
          const statut = role === "GUIDE" ? STATUT_ANNONCE.EN_ATTENTE : STATUT_ANNONCE.APPROUVE;
          await createAnnonce({ titre, contenu, urgence, auteurId: user.id, groupeId: cibleGroupeId, statut });
          showToast(role === "GUIDE" ? "Communiqué envoyé pour validation." : "Communiqué publié.");
        }
        await onDone();
        return true;
      } catch (error) {
        showToast(error.message, "error");
        return false;
      }
    },
  });
}

// ---------- Page principale ----------
export async function renderAnnoncePage() {
  const app = document.getElementById("app");
  const user = getSession();
  const role = getUserRole();

  const [annonces, utilisateurs, guides, monGroupeId, groupes] = await Promise.all([
    getAnnoncesVisibles(user, role),
    getUtilisateurs(),
    getGuides(),
    getGroupeIdDuLecteur(user, role),
    role === "ADMIN" ? getGroupes() : Promise.resolve([]),
  ]);

  const utilisateurMap = Object.fromEntries(utilisateurs.map((u) => [u.id, u]));
  const guideMap = Object.fromEntries(guides.map((g) => [g.id, g]));

  // Seuls l'admin et le guide publient ; le pèlerin consulte en lecture seule.
  // Un guide sans groupe assigné ne peut pas publier (il n'a personne à qui adresser le message).
  const peutPublier = role === "ADMIN" || (role === "GUIDE" && !!monGroupeId);
  // Portée du communiqué à la publication : admin => global (null), guide => son groupe.
  const groupeIdPublication = role === "GUIDE" ? monGroupeId : null;

  // Auteur : via auteurId (nouveau), avec repli sur guideId (ancienne annonce du JSON)
  const auteur = (a) => {
    let u = a.auteurId ? utilisateurMap[a.auteurId] : null;
    if (!u && a.guideId && guideMap[a.guideId]) u = utilisateurMap[guideMap[a.guideId].utilisateurId];
    const nom = u?.nomComplet || "Auteur inconnu";
    const roleLabel = u ? (ROLE_LABELS[u.role] || u.role) : "";
    return roleLabel ? `${nom} (${roleLabel})` : nom;
  };

  const peutSupprimer = (a) => role === "ADMIN" || (a.auteurId && a.auteurId === user.id);
  // Admin peut éditer tout communiqué ; le guide édite les siens (re-soumis à validation).
  const peutModifier = (a) => role === "ADMIN" || (a.auteurId && a.auteurId === user.id);

  // Nom du groupe ciblé (connu surtout côté admin qui charge la liste des groupes)
  const groupeMap = Object.fromEntries(groupes.map((g) => [g.id, g.nom]));
  const libelleCible = (a) => {
    if (!a.groupeId) return "Général";
    const nom = groupeMap[a.groupeId];
    return nom ? `Groupe : ${nom}` : "Mon groupe";
  };

  // Badge de statut de validation (affiché surtout à l'auteur et à l'admin)
  const statutBadge = (a) => {
    const st = statutAnnonce(a);
    if (st === STATUT_ANNONCE.EN_ATTENTE) {
      return `<span class="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700"><i class="fa-solid fa-clock"></i> En attente de validation</span>`;
    }
    if (st === STATUT_ANNONCE.REJETE) {
      return `<span class="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700"><i class="fa-solid fa-circle-xmark"></i> Rejeté</span>`;
    }
    return "";
  };

  const carte = (a, numero) => `
    <article class="rounded-3xl border border-slate-200 ${a.urgence ? "border-l-4 border-l-[#B40909]" : ""} bg-white p-5 shadow-sm">
      <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <span class="rounded-md bg-[#F2F2DE] px-2 py-0.5 text-xs font-bold text-[#333D2A]">A-${String(numero).padStart(2, "0")}</span>
          ${a.groupeId
            ? `<span class="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-bold text-violet-700"><i class="fa-solid fa-people-group"></i> ${escapeHtml(libelleCible(a))}</span>`
            : `<span class="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-bold text-sky-700"><i class="fa-solid fa-globe"></i> Général</span>`}
          ${a.urgence ? `<span class="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-black text-rose-700">Alerte Urgente</span>` : ""}
          ${statutBadge(a)}
        </div>
        <div class="flex items-center gap-4 text-xs text-slate-500">
          <span><i class="fa-regular fa-calendar"></i> ${escapeHtml((a.datePublication || "").slice(0, 10))}</span>
          <span><i class="fa-regular fa-user"></i> ${escapeHtml(auteur(a))}</span>
          ${peutModifier(a) ? `<button class="text-amber-500 hover:text-amber-700" data-edit-annonce="${escapeHtml(a.id)}" title="Modifier"><i class="fa-solid fa-pen"></i></button>` : ""}
          ${peutSupprimer(a) ? `<button class="text-rose-500 hover:text-rose-700" data-delete-annonce="${escapeHtml(a.id)}" title="Supprimer"><i class="fa-solid fa-trash"></i></button>` : ""}
        </div>
      </div>
      <h3 class="font-black text-slate-950">${escapeHtml(a.titre)}</h3>
      <p class="mt-1 whitespace-pre-line text-sm text-slate-600">${escapeHtml(a.contenu)}</p>
      ${statutAnnonce(a) === STATUT_ANNONCE.REJETE && a.motifRejet ? `
        <div class="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
          <i class="fa-solid fa-circle-exclamation"></i> Motif du rejet : ${escapeHtml(a.motifRejet)}
        </div>
      ` : ""}
    </article>
  `;

  app.innerHTML = `
    <section>
      ${pageHeader({
        kicker: "Communication",
        title: "Tableau d'affichage des communiqués",
        subtitle: "Alertes en temps réel, consignes quotidiennes.",
        actionLabel: peutPublier ? "Publier un Communiqué" : null,
        actionId: peutPublier ? "addAnnonceBtn" : null,
        actionIcon: "fa-plus",
      })}

      <div class="mb-6 flex flex-col gap-3 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div class="relative flex-1">
          <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input id="annonceSearch" type="text" placeholder="Rechercher des communiqués" class="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm" />
        </div>
        <button id="urgentFilterBtn" type="button" class="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
          Afficher uniquement les urgentes
        </button>
      </div>

      <div id="annonceList" class="grid gap-4"></div>
      <div id="annoncePagination"></div>
    </section>
  `;

  const addBtn = document.getElementById("addAnnonceBtn");
  if (addBtn) addBtn.addEventListener("click", () => openFormAnnonce(user, role, groupeIdPublication, groupes, null, renderAnnoncePage));

  let search = "";
  let urgentOnly = false;
  let page = 1;

  const filtered = () => {
    let list = annonces;
    if (urgentOnly) list = list.filter((a) => a.urgence);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((a) => `${a.titre} ${a.contenu}`.toLowerCase().includes(q));
    }
    return list;
  };

  const draw = () => {
    const list = filtered();
    const totalPages = Math.max(1, Math.ceil(list.length / PER_PAGE));
    if (page > totalPages) page = totalPages;
    const start = (page - 1) * PER_PAGE;
    const items = list.slice(start, start + PER_PAGE);

    const listEl = document.getElementById("annonceList");
    listEl.innerHTML = items.length
      ? items.map((a) => carte(a, annonces.indexOf(a) + 1)).join("")
      : `<div class="rounded-[2rem] border border-slate-200 bg-white p-10 text-center text-sm text-slate-400 shadow-sm">Aucun communiqué${urgentOnly || search ? " ne correspond à ce filtre" : ""}.</div>`;

    const pagEl = document.getElementById("annoncePagination");
    pagEl.innerHTML = pagination(page, totalPages);
    bindPagination(pagEl, (p) => { page = p; draw(); });

    listEl.querySelectorAll("[data-edit-annonce]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const annonce = annonces.find((a) => a.id === btn.dataset.editAnnonce);
        if (annonce) openFormAnnonce(user, role, groupeIdPublication, groupes, annonce, renderAnnoncePage);
      });
    });

    listEl.querySelectorAll("[data-delete-annonce]").forEach((btn) => {
      btn.addEventListener("click", () => {
        openConfirm({
          title: "Confirmer la suppression",
          message: "Voulez-vous supprimer ce communiqué ?",
          onConfirm: async () => {
            try {
              await deleteAnnonce(btn.dataset.deleteAnnonce);
              showToast("Communiqué supprimé.");
              await renderAnnoncePage();
            } catch (error) {
              showToast(error.message, "error");
            }
          },
        });
      });
    });
  };

  document.getElementById("annonceSearch").addEventListener("input", (e) => {
    search = e.target.value.trim();
    page = 1;
    draw();
  });

  document.getElementById("urgentFilterBtn").addEventListener("click", (e) => {
    urgentOnly = !urgentOnly;
    page = 1;
    const btn = e.currentTarget;
    if (urgentOnly) {
      btn.textContent = "Afficher tous les communiqués";
      btn.classList.add("bg-rose-600", "text-white", "border-rose-600");
      btn.classList.remove("bg-white", "text-slate-700", "border-slate-200");
    } else {
      btn.textContent = "Afficher uniquement les urgentes";
      btn.classList.remove("bg-rose-600", "text-white", "border-rose-600");
      btn.classList.add("bg-white", "text-slate-700", "border-slate-200");
    }
    draw();
  });

  draw();
}
