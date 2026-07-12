// pages/loginPage.js
import { login } from "../services/authService.js";
import { navigate } from "../router.js";
import { HOME_PAGE_BY_ROLE } from "../config/roles.js";
import { showError, hideError } from "../utils/formValidator.js";
import { validateLoginEmail, validateLoginPassword } from "../utils/validators.js";

export function renderLoginPage() {
  const sidebarRoot = document.getElementById("sidebarRoot");
  const navbarRoot = document.getElementById("navbarRoot");
  if (sidebarRoot) sidebarRoot.innerHTML = "";
  if (navbarRoot) navbarRoot.innerHTML = "";

  const main = document.querySelector("main");
  main.className = "min-h-screen font-sans";

  const app = document.getElementById("app");
  app.className = "";
  app.innerHTML = `
    <div class="relative flex min-h-screen items-center justify-center bg-cover bg-center p-4"
         style="background-image: linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url('./assets/login-bg.jpg');">

      <div class="w-full max-w-md overflow-hidden rounded-2xl bg-[#F2F2DE] shadow-2xl">

        <div class="bg-[#333D2A] px-6 py-6 text-center text-white">
          <button id="backToAccueilBtn" class="mb-3 flex items-center gap-2 text-xs font-bold text-slate-200 hover:text-white">
            <i class="fa-solid fa-arrow-left"></i> Accueil
          </button>
          <i class="fa-solid fa-moon text-[#BC7B3B] text-2xl"></i>
          <h1 class="mt-2 text-xl font-black">Portail Sakina Connect</h1>
          <p class="mt-1 text-xs text-slate-300">Gestion sereine et organisation de la logistique physique</p>
        </div>

        <div class="border-t-4 border-[#BC7B3B] p-6">

          <div id="loginError" class="mb-4 hidden rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
            <i class="fa-solid fa-circle-exclamation mr-2"></i>
            <span id="loginErrorMessage"></span>
          </div>

          <div class="grid gap-4">
            <div>
              <label class="mb-1 block text-xs font-bold text-[#333D2A]" for="loginEmail">Adresse email :</label>
              <input class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#BC7B3B] focus:ring-2 focus:ring-[#BC7B3B]/30" type="email" id="loginEmail" placeholder="nom@gmail.com" autocomplete="email" />
              <p id="loginEmailError" class="mt-1 hidden text-xs text-rose-600"></p>
            </div>

            <div>
              <label class="mb-1 block text-xs font-bold text-[#333D2A]" for="loginPassword">Mot de passe :</label>
              <div class="relative">
                <input class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-12 text-sm outline-none focus:border-[#BC7B3B] focus:ring-2 focus:ring-[#BC7B3B]/30" type="password" id="loginPassword" placeholder="••••••••••••" autocomplete="current-password" />
                <button type="button" id="togglePassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700" aria-label="Afficher/masquer le mot de passe">
                  <i class="fa-solid fa-eye" id="togglePasswordIcon"></i>
                </button>
              </div>
              <p id="loginPasswordError" class="mt-1 hidden text-xs text-rose-600"></p>
            </div>

            <button id="loginBtn" type="button" class="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#333D2A] px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
              Connexion
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  bindLoginEvents();
}

function bindLoginEvents() {
  const emailInput = document.getElementById("loginEmail");
  const passwordInput = document.getElementById("loginPassword");
  const loginBtn = document.getElementById("loginBtn");
  const toggleBtn = document.getElementById("togglePassword");
  const toggleIcon = document.getElementById("togglePasswordIcon");
  const backBtn = document.getElementById("backToAccueilBtn");

  backBtn.addEventListener("click", () => navigate("accueil"));

  toggleBtn.addEventListener("click", () => {
    const isPassword = passwordInput.type === "password";
    passwordInput.type = isPassword ? "text" : "password";
    toggleIcon.className = isPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye";
  });

  emailInput.addEventListener("input", () => {
    if (emailInput.value.trim()) hideError("loginEmail", "loginEmailError");
  });

  passwordInput.addEventListener("input", () => {
    if (passwordInput.value.trim()) hideError("loginPassword", "loginPasswordError");
  });

  loginBtn.addEventListener("click", handleLogin);
  passwordInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleLogin();
  });
}

async function handleLogin() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const loginBtn = document.getElementById("loginBtn");

  document.getElementById("loginError").classList.add("hidden");

  let hasError = false;

  const emailError = validateLoginEmail(email);
  if (emailError) {
    showError("loginEmail", "loginEmailError", emailError);
    hasError = true;
  } else {
    hideError("loginEmail", "loginEmailError");
  }

  const passwordError = validateLoginPassword(password);
  if (passwordError) {
    showError("loginPassword", "loginPasswordError", passwordError);
    hasError = true;
  } else {
    hideError("loginPassword", "loginPasswordError");
  }

  if (hasError) return;

  loginBtn.disabled = true;
  loginBtn.innerHTML = `
    <div class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
    <span>Connexion...</span>
  `;

  try {
    const user = await login(email, password);
    await navigate(HOME_PAGE_BY_ROLE[user.role] || "accueil");
  } catch (error) {
    document.getElementById("loginErrorMessage").textContent = error.message;
    document.getElementById("loginError").classList.remove("hidden");

    loginBtn.disabled = false;
    loginBtn.innerHTML = `Connexion`;
  }
}