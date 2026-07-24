// components/pagination.js — pagination réutilisable

// Retourne le HTML de la pagination (rien si une seule page).
export function pagination(currentPage, totalPages) {
  if (totalPages <= 1) return "";

  const btn = (label, page, { disabled = false, active = false } = {}) => `
    <button type="button" data-page-nav="${page}" ${disabled ? "disabled" : ""}
      class="flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-bold transition ${
        active ? "bg-[#333D2A] text-white" : "text-slate-600 hover:bg-slate-100"
      } ${disabled ? "cursor-not-allowed opacity-40" : ""}">${label}</button>`;

  const ellipsis = `<span class="flex h-9 min-w-9 items-center justify-center px-1 text-sm font-bold text-slate-400">…</span>`;

  // Fenêtre de pages : toujours 1 et la dernière, plus current ± 1, avec des « … » pour les trous.
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }

  const numeros = pages.map((p) =>
    p === "…" ? ellipsis : btn(String(p), p, { active: p === currentPage })
  );

  return `
    <div class="mt-6 flex items-center justify-center gap-1" data-pagination>
      ${btn('<i class="fa-solid fa-chevron-left"></i>', currentPage - 1, { disabled: currentPage <= 1 })}
      ${numeros.join("")}
      ${btn('<i class="fa-solid fa-chevron-right"></i>', currentPage + 1, { disabled: currentPage >= totalPages })}
    </div>`;
}

// Attache les clics de pagination contenus dans `container`. onNavigate(page) reçoit le numéro cible.
export function bindPagination(container, onNavigate) {
  if (!container) return;
  container.querySelectorAll("[data-page-nav]").forEach((b) => {
    if (b.disabled) return;
    b.addEventListener("click", () => onNavigate(Number(b.dataset.pageNav)));
  });
}
