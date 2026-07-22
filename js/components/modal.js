let activeModal = null;

function getRoot() {
  let root = document.getElementById("modalRoot");
  if (!root) {
    root = document.createElement("div");
    root.id = "modalRoot";
    document.body.appendChild(root);
  }
  return root;
}

export function openModal({
  title,
  icon = "fa-circle-info",
  iconClass = "bg-[#F2F2DE] text-[#333D2A]",
  body = "",
  confirmLabel = "Enregistrer",
  confirmIcon = "fa-floppy-disk",
  confirmClass = "bg-[#333D2A] shadow-[#333D2A]/20 hover:opacity-90",
  cancelLabel = "Annuler",
  onConfirm = null,
  onMount = null,
  maxWidth = "max-w-md",
})  {
  closeModal();

  const lastFocused = document.activeElement;

  const overlay = document.createElement("div");
  overlay.className = "fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");

  overlay.innerHTML = `
    <div class="max-h-[90vh] w-full ${maxWidth} overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
      <div class="mb-5 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="flex h-11 w-11 items-center justify-center rounded-2xl ${iconClass}">
            <i class="fa-solid ${icon}"></i>
          </div>
          <h2 class="text-xl font-black tracking-tight text-slate-950">${title}</h2>
        </div>
        <button type="button" data-modal-close class="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Fermer">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <form data-modal-form class="grid gap-4">
        ${body}
        <div class="mt-2 flex justify-end gap-3">
          ${cancelLabel ? `<button type="button" data-modal-cancel class="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50">${cancelLabel}</button>` : ""}
          <button type="submit" class="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-extrabold text-white shadow-lg transition ${confirmClass}">
            <i class="fa-solid ${confirmIcon}"></i>
            <span>${confirmLabel}</span>
          </button>
        </div>
      </form>
    </div>
  `;

  getRoot().appendChild(overlay);

  function close() {
    overlay.remove();
    document.removeEventListener("keydown", onKeydown);
    activeModal = null;
    if (lastFocused && document.contains(lastFocused)) {
      lastFocused.focus();
    }
  }

  function onKeydown(event) {
    if (event.key === "Escape") close();
  }

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) close();
  });

  overlay.querySelector("[data-modal-close]").addEventListener("click", close);
  const cancelBtn = overlay.querySelector("[data-modal-cancel]");
  if (cancelBtn) cancelBtn.addEventListener("click", close);

  overlay.querySelector("[data-modal-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (typeof onConfirm === "function") {
      const result = await onConfirm(overlay);
      if (result === false) return;
    }
    close();
  });

  document.addEventListener("keydown", onKeydown);
  activeModal = { close };

  if (typeof onMount === "function") {
    onMount(overlay);
  } else {
    const target = overlay.querySelector("input, select, textarea") || overlay.querySelector("[type=submit]");
    if (target) target.focus();
  }

  return { close };
}

// export function openConfirm({ title = "Confirmation", message, confirmLabel = "OUI", cancelLabel = "NON", onConfirm }) {
//   return openModal({
//     title,
//     icon: "fa-triangle-exclamation",
//     iconClass: "bg-rose-100 text-rose-600",
//     body: `<p class="text-center text-sm leading-6 text-slate-600">${message}</p>`,
//     confirmLabel,
//     cancelLabel,
//     confirmIcon: "fa-check",
//     confirmClass: "bg-rose-600 shadow-rose-200 hover:bg-rose-700",
//     onConfirm,
//   });
// }
export function openConfirm({ title = "Confirmer la suppression", message, confirmLabel = "OUI", cancelLabel = "NON", onConfirm }) {
  closeModal();

  const lastFocused = document.activeElement;

  const overlay = document.createElement("div");
  overlay.className = "fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");

  overlay.innerHTML = `
    <div class="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
      <div class="flex items-center justify-between bg-gradient-to-r from-[#333D2A] to-[#F2F2DE] px-6 py-4">
        <h2 class="text-lg font-black text-white">${title}</h2>
        <button type="button" data-modal-close class="flex h-8 w-8 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/10 hover:text-white" aria-label="Fermer">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="px-6 py-8 text-center">
        <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
          <i class="fa-solid fa-triangle-exclamation text-xl"></i>
        </div>
        <p class="text-sm leading-6 text-slate-700">${message}</p>
      </div>

      <div class="flex justify-center gap-4 px-6 pb-6">
        <button type="button" data-modal-cancel class="rounded-2xl bg-blue-600 px-8 py-2.5 text-sm font-extrabold text-white transition hover:bg-blue-700">${cancelLabel}</button>
        <button type="button" data-modal-confirm class="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-8 py-2.5 text-sm font-extrabold text-white transition hover:bg-rose-700">
          <i class="fa-solid fa-check"></i>
          <span>${confirmLabel}</span>
        </button>
      </div>
    </div>
  `;

  getRoot().appendChild(overlay);

  function close() {
    overlay.remove();
    document.removeEventListener("keydown", onKeydown);
    activeModal = null;
    if (lastFocused && document.contains(lastFocused)) {
      lastFocused.focus();
    }
  }

  function onKeydown(event) {
    if (event.key === "Escape") close();
  }

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) close();
  });

  overlay.querySelector("[data-modal-close]").addEventListener("click", close);
  overlay.querySelector("[data-modal-cancel]").addEventListener("click", close);

  overlay.querySelector("[data-modal-confirm]").addEventListener("click", async () => {
    if (typeof onConfirm === "function") {
      const result = await onConfirm();
      if (result === false) return;
    }
    close();
  });

  document.addEventListener("keydown", onKeydown);
  activeModal = { close };

  return { close };
}

export function closeModal() {
  if (activeModal) activeModal.close();
}

// Modale générique pour afficher une valeur à copier (ex: mot de passe généré)
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