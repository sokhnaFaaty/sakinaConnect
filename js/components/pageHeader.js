import { escapeHtml } from "../utils/html.js";

export function pageHeader({ kicker = "Application", title, subtitle, actionLabel = null, actionId = null, actionIcon = "fa-plus" }) {
  const action = actionLabel
    ? `
      <button id="${escapeHtml(actionId)}" class="inline-flex items-center gap-2 rounded-2xl bg-[#333D2A] px-4 py-2.5 text-sm font-extrabold text-white transition hover:opacity-90">
        <i class="fa-solid ${escapeHtml(actionIcon)}"></i>
        <span>${escapeHtml(actionLabel)}</span>
      </button>
    `
    : "";

  return `
    <header class="mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="font-display text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">${escapeHtml(title)}</h1>
          <p class="mt-1 text-sm text-slate-500">${escapeHtml(subtitle)}</p>
        </div>
        ${action}
      </div>
    </header>
  `;
}
