// Génère un mot de passe temporaire simple (6 chiffres)
// Le proche pourra le changer une fois connecté (fonctionnalité à venir dans son espace)
export function generateTempPassword() {
  const code = Math.floor(100000 + Math.random() * 900000); // ex: 483920
  return String(code);
}
