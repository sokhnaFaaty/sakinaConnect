import { navigate } from "../router.js";

export function renderAccueilPage() {
  // Page publique : pas besoin de la sidebar/navbar de l'appli connectée
  const sidebarRoot = document.getElementById("sidebarRoot");
  const navbarRoot = document.getElementById("navbarRoot");
  if (sidebarRoot) sidebarRoot.innerHTML = "";
  if (navbarRoot) navbarRoot.innerHTML = "";

  const main = document.querySelector("main");
  main.className = "min-h-screen bg-[#F2F2DE] font-sans";

  const app = document.getElementById("app");
  app.className = "";
  app.innerHTML = `
    <div class="min-h-screen">
      <!-- Barre du haut -->
      <header class="flex items-center justify-between px-6 py-4 sm:px-10 bg-[#333D2A]">
        <div class="flex items-center gap-2 font-display">
          <i class="fa-solid fa-moon text-[#BC7B3B] text-xl"></i>
          <span class="font-display text-lg font-black text-white ">Sakina <span class="text-[#BC7B3B]">Connect</span></span>
        </div>
        <button id="goToLoginBtn" class="rounded-xl bg-[#BC7B3B] px-4 py-2 text-sm font-bold text-white transition hover:opacity-90">
          <i class="fa-solid fa-right-to-bracket mr-2"></i>Se connecter
        </button>
      </header>

      <!-- Accroche principale -->
      <section class="mx-auto max-w-5xl px-6 py-10 sm:px-10">
        <p class="mb-4 inline-block rounded-full bg-[#333D2A]/10 px-3 py-1 text-xs font-bold text-[#333D2A]">
          Un Sanctuaire Numérique pour la Préparation du Hajj et de Omra
        </p>
        <h1 class="font-display text-3xl font-black leading-tight text-[#333D2A] sm:text-5xl">
          Voyagez avec <span class="text-[#BC7B3B]">Sérénité</span>,<br/>
          Adorez avec Concentration.
        </h1>
        <p class="mt-4 max-w-2xl text-slate-700">
          Éliminez le stress administratif, les coupures de communication et la panique
          logistique. Sakina Connect vous maintient préparé avant le départ et vous protège
          durant votre pèlerinage.
        </p>
        <button id="accessBtn" class="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#333D2A] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90">
          Accéder à l'espace de Connexion
          <i class="fa-solid fa-arrow-right"></i>
        </button>
      </section>

      <!-- Défis résolus -->
      <section class="bg-[#333D2A] px-6 py-14 text-center text-white sm:px-10">
        <p class="text-xs font-bold uppercase tracking-widest text-[#BC7B3B]">Résoudre des défis concrets</p>
        <h2 class="font-display mt-2 text-2xl font-black sm:text-3xl">Soutien pour les Pèlerins, Sérénité pour les Familles</h2>
        <p class="mx-auto mt-3 max-w-2xl text-sm text-slate-200">
          Nous réduisons les frictions physiques et la surcharge mentale afin que votre esprit
          se concentre pleinement à la prière.
        </p>

        <div class="mx-auto mt-8 grid max-w-4xl gap-4 sm:grid-cols-3">
          <div class="rounded-2xl bg-white/5 p-5 text-left">
            <i class="fa-solid fa-shield-halved text-[#BC7B3B]"></i>
            <h3 class="font-display mt-2 font-bold">Contrôle de Sécurité Administratif</h3>
            <p class="mt-1 text-xs text-slate-300">Un tableau de bord visuel qui clarifie l'état de chaque pèlerin (passeport, visa, vaccination).</p>
          </div>
          <div class="rounded-2xl bg-white/5 p-5 text-left">
            <i class="fa-solid fa-route text-[#BC7B3B]"></i>
            <h3 class="font-display mt-2 font-bold">Itinéraires et Directives claires</h3>
            <p class="mt-1 text-xs text-slate-300">Des plannings étape par étape, simplifiés et lisibles pour tous les âges.</p>
          </div>
          <div class="rounded-2xl bg-white/5 p-5 text-left">
            <i class="fa-solid fa-triangle-exclamation text-[#BC7B3B]"></i>
            <h3 class=" font-display mt-2 font-bold">Bouton de Secours SOS</h3>
            <p class="mt-1 text-xs text-slate-300">Un grand bouton d'alerte qui prévient instantanément les guides désignés.</p>
          </div>
        </div>
      </section>

      <!-- Pied de page -->
      <footer class="px-6 py-8 text-center sm:px-10">
        <div class="flex items-center justify-center gap-2">
          <i class="fa-solid fa-moon text-[#BC7B3B]"></i>
          <span class="font-black text-[#333D2A]">Sakina <span class="text-[#BC7B3B]">Connect</span></span>
        </div>
        <p class="mt-1 text-xs text-slate-500">Plateforme numérique de gestion et d'accompagnement des pèlerins.</p>
      </footer>
    </div>
  `;

  // Les deux boutons font la même chose : aller au login
  document.getElementById("goToLoginBtn").addEventListener("click", () => navigate("login"));
  document.getElementById("accessBtn").addEventListener("click", () => navigate("login"));
}