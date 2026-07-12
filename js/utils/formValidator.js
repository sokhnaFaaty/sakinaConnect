export function showError(inputId, errorId, message) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  if (input) {
    input.classList.add("border-rose-500", "focus:ring-rose-100", "focus:border-rose-500");
    input.classList.remove("border-slate-200", "focus:border-indigo-500", "focus:ring-indigo-100");
  }
  if (error) {
    error.textContent = message;
    error.classList.remove("hidden");
    error.classList.add("block");
  }
}

export function hideError(inputId, errorId) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  if (input) {
    input.classList.remove("border-rose-500", "focus:ring-rose-100", "focus:border-rose-500");
    input.classList.add("border-slate-200", "focus:border-indigo-500", "focus:ring-indigo-100");
  }
  if (error) {
    error.textContent = "";
    error.classList.remove("block");
    error.classList.add("hidden");
  }
}

export function validateField(value, fieldName, minLength = 1) {
  if (!value || String(value).trim().length === 0) {
    return `${fieldName} est obligatoire.`;
  }
  if (String(value).trim().length < minLength) {
    return `${fieldName} doit contenir au moins ${minLength} caractères.`;
  }
  return null;
}

export function validateNumber(value, fieldName) {
  if (!value || String(value).trim().length === 0) {
    return `${fieldName} est obligatoire.`;
  }
  if (isNaN(Number(value)) || Number(value) <= 0) {
    return `${fieldName} doit être un nombre positif.`;
  }
  return null;
}

export function validateSelect(value, fieldName) {
  if (!value || value === "") {
    return `Veuillez sélectionner une ${fieldName}.`;
  }
  return null;
}