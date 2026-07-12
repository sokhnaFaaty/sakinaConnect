export function openInfoCopy({ title, message, value, icon = "fa-key", onCopy = null }) {
  return openModal({
    title,
    icon,
    iconClass: "bg-emerald-100 text-emerald-600",
    body: `
      <p class="text-sm text-slate-600">${message}</p>
      <div class="mt-3 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <span class="text-lg font-black tracking-widest text-slate-950">${value}</span>
        <button type="button" data-copy-value class="text-slate-500 hover:text-slate-800">
          <i class="fa-solid fa-copy"></i>
        </button>
      </div>
    `,
    confirmLabel: "J'ai noté",
    confirmIcon: "fa-check",
    onMount: (overlay) => {
      overlay.querySelector("[data-copy-value]").addEventListener("click", () => {
        navigator.clipboard.writeText(value);
        if (typeof onCopy === "function") onCopy();
      });
    },
    onConfirm: async () => true,
  });
}
