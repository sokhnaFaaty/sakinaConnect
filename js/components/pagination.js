// components/pagination.js — pagination réutilisable

// Retourne le HTML de la pagination (rien si une seule page).
export function pagination(currentPage, totalPages) {
  if (totalPages <= 1) return "";

  const btn = (label, page, { disabled = false, active = false } = {}) => `
    <button type="button" data-page-nav="${page}" ${disabled ? "disabled" : ""}
      class="flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-bold transition ${
        active ? "bg-[#333D2A] text-white" : "text-slate-600 hover:bg-slate-100"
      } ${disabled ? "cursor-not-allowed opacity-40" : ""}">${label}</button>`;

  const numeros = [];
  for (let i = 1; i <= totalPages; i++) {
    numeros.push(btn(String(i), i, { active: i === currentPage }));
  }

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
