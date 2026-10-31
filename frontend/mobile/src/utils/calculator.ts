/** Logique de la calculatrice de l'écran discret, séparée de l'affichage pour être testée. */
export const OPS = ["÷", "×", "−", "+"] as const;
export type Op = (typeof OPS)[number];

export function apply(a: number, b: number, op: Op): number {
  switch (op) {
    case "+":
      return a + b;
    case "−":
      return a - b;
    case "×":
      return a * b;
    case "÷":
      return b === 0 ? NaN : a / b;
  }
}

/** Affichage à la française (virgule), « Erreur » pour une division par zéro. */
export function format(n: number): string {
  if (!Number.isFinite(n)) return "Erreur";
  return Number.parseFloat(n.toPrecision(12)).toString().replace(".", ",");
}

/** Vrai quand la saisie, sans opération en cours, correspond au code de retour. */
export function isExitCode(entry: string, code: string | null, pendingOp: boolean): boolean {
  return !pendingOp && !!code && entry === code;
}
