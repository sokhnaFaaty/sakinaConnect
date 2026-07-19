
let drawerActif = null;

function getRoot() {
  let root = document.getElementById("modalRoot");
  if (!root) {
    root = document.createElement("div");
    root.id = "modalRoot";
    document.body.appendChild(root);
  }
  return root;
}

// Ouvre un panneau qui glisse depuis la droite de l'écran (drawer)
// Mêmes paramètres que openModal, pour rester cohérent avec le reste du code
export function openDrawer({
  title,
  icon = "fa-circle-info",
  body = "",
  confirmLabel = "Enregistrer",
  confirmIcon = null,
  confirmClass = "bg-[#333D2A] hover:opacity-90",
  cancelLabel = "Annuler",
  onConfirm = null,
  onMount = null,
}) {
  closeDrawer();

  const overlay = document.createElement("div");
  overlay.className = "fixed inset-0 z-50 bg-slate-950/50";

  overlay.innerHTML = `
    <div class="fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-md translate-x-full flex-col bg-white shadow-2xl transition-transform duration-300" id="drawerPanel">
      <div class="flex items-center justify-between border-b border-slate-100 bg-[#333D2A] px-6 py-5">
        <div class="flex items-center gap-3 text-white">
          <i class="fa-solid ${icon}"></i>
          <h2 class="text-lg font-black">${title}</h2>
        </div>
        <button type="button" data-drawer-close class="flex h-9 w-9 items-center justify-center rounded-xl text-white/80 transition hover:bg-white/10" aria-label="Fermer">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <form data-drawer-form class="flex-1 overflow-y-auto px-6 py-5">
        <div class="grid gap-4">${body}</div>
      </form>

      <div class="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
        <button type="button" data-drawer-cancel class="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">${cancelLabel}</button>
        <button type="button" data-drawer-submit class="rounded-2xl bg-[#333D2A] px-5 py-2.5 text-sm font-extrabold text-white hover:opacity-90">${confirmLabel}</button>
      </div>
    </div>
  `;

  getRoot().appendChild(overlay);

  const panel = overlay.querySelector("#drawerPanel");
  const form = overlay.querySelector("[data-drawer-form]");

  // Anime l'entrée du drawer (glisse depuis la droite)
  requestAnimationFrame(() => {
    panel.classList.remove("translate-x-full");
  });

  function close() {
    panel.classList.add("translate-x-full");
    setTimeout(() => overlay.remove(), 300);
    document.removeEventListener("keydown", onKeydown);
    drawerActif = null;
  }

  function onKeydown(event) {
    if (event.key === "Escape") close();
  }

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) close();
  });

  overlay.querySelector("[data-drawer-close]").addEventListener("click", close);
  overlay.querySelector("[data-drawer-cancel]").addEventListener("click", close);

  // Le bouton "Enregistrer" déclenche la soumission du formulaire
  overlay.querySelector("[data-drawer-submit]").addEventListener("click", async () => {
    if (typeof onConfirm === "function") {
      const result = await onConfirm(overlay);
      if (result === false) return;
    }
    close();
  });

  document.addEventListener("keydown", onKeydown);
  drawerActif = { close };

  if (typeof onMount === "function") {
    onMount(overlay);
  }

  return { close };
}

export function closeDrawer() {
  if (drawerActif) drawerActif.close();
}