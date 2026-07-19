// components/viewToogle.js
// Barre de bascule d'affichage Cartes / Tableau, réutilisable.

// Retourne le HTML de la bascule. `active` = "card" | "table".
export function viewToggle(active = "table") {
  const btn = (view, icon, label) => `
    <button type="button" data-view="${view}" title="${label}" aria-pressed="${active === view}"
      class="flex h-9 w-9 items-center justify-center rounded-lg text-sm transition ${
        active === view ? "bg-[#333D2A] text-white" : "text-slate-500 hover:bg-slate-100"
      }">
      <i class="fa-solid ${icon}"></i>
    </button>`;

  return `
    <div class="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1" data-view-toggle>
      ${btn("card", "fa-table-cells-large", "Vue cartes")}
      ${btn("table", "fa-table-list", "Vue tableau")}
    </div>`;
}

// Attache les clics de la bascule contenue dans `container` (élément DOM).
// onChange(view) est appelé avec "card" ou "table".
export function bindViewToggle(container, onChange) {
  if (!container) return;
  container.querySelectorAll("[data-view]").forEach((b) => {
    b.addEventListener("click", () => onChange(b.dataset.view));
  });
}

// Mémorise le choix de vue par page (persiste entre les navigations).
const STORAGE_KEY = (name) => `sakina:view:${name}`;

export function getSavedView(name, fallback = "table") {
  try {
    return localStorage.getItem(STORAGE_KEY(name)) || fallback;
  } catch {
    return fallback;
  }
}

export function saveView(name, view) {
  try {
    localStorage.setItem(STORAGE_KEY(name), view);
  } catch {
    /* localStorage indisponible : on ignore, la vue reste en mémoire */
  }
}
