let pendingAction = null;
let lastFocusedElement = null;

export function initConfirmModal() {
  const modal = document.getElementById("confirmModal");
  const cancelBtn = document.getElementById("confirmCancelBtn");
  const acceptBtn = document.getElementById("confirmAcceptBtn");

  cancelBtn.addEventListener("click", closeConfirmModal);

  acceptBtn.addEventListener("click", async () => {
    if (typeof pendingAction === "function") {
      await pendingAction();
    }
    closeConfirmModal();
  });

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeConfirmModal();
    }
  });
}

export function openConfirmModal(message, onConfirm) {
  const modal = document.getElementById("confirmModal");
  const modalMessage = document.getElementById("confirmModalMessage");
  const acceptBtn = document.getElementById("confirmAcceptBtn");

  pendingAction = onConfirm;
  lastFocusedElement = document.activeElement;
  modalMessage.textContent = message;

  modal.classList.remove("hidden");
  modal.classList.add("flex");
  modal.setAttribute("aria-hidden", "false");
  acceptBtn.focus();
}

export function closeConfirmModal() {
  const modal = document.getElementById("confirmModal");
  pendingAction = null;
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  modal.setAttribute("aria-hidden", "true");

  if (lastFocusedElement && document.contains(lastFocusedElement)) {
    lastFocusedElement.focus();
  }
}