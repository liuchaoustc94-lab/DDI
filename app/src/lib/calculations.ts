// ============================================================================
// DDI (Drug-Drug Interaction) Calculation Library
// Based on ICH M12 2024 and FDA 2020 guidance
// ============================================================================

// ─── Atomic Weights ─────────────────────────────────────────────────────────
export const atomicWeights: Record<string, number> = {
  H: 1.00794, He: 4.002602, Li: 6.941, Be: 9.012182, B: 10.811,
  C: 12.0107, N: 14.0067, O: 15.9994, F: 18.9984032, Ne: 20.1797,
  Na: 22.98976928, Mg: 24.3050, Al: 26.9815386, Si: 28.0855,
  P: 30.973762, S: 32.065, Cl: 35.453, Ar: 39.948, K: 39.0983,
  Ca: 40.078, Fe: 55.845, Cu: 63.546, Zn: 65.38, Br: 79.904,
  Ag: 107.8682, I: 126.90447,
};

// ─── Formatting Utilities ───────────────────────────────────────────────────
export function fmtTxtNum(x: number | null | undefined, digits = 3): string {
  if (x === null || x === undefined || Number.isNaN(x)) return "---";
  return x.toFixed(digits);
}

export function fmtTxtTrim(x: number | null | undefined, digits = 3): string {
  if (x === null || x === undefined || Number.isNaN(x)) return "---";
  return Number(x.toFixed(digits)).toString();
}

// ─── Chemical Formula Parser ────────────────────────────────────────────────
export function parseFormulaCounts(formula: string): Record<string, number> | null {
  if (!formula || !formula.trim()) return null;

  const s = formula.replace(/\s+/g, "");
  const n = s.length;
  let pos = 1; // 1-based indexing like R

  function parseNumber(): number {
    if (pos > n) return 1;
    const rest = s.substring(pos - 1);
    const match = rest.match(/^[0-9]+/);
    if (!match) return 1;
    const val = parseInt(match[0], 10);
    pos += match[0].length;
    return val;
  }

  function parseElement(): string | null {
    if (pos > n) return null;
    const rest = s.substring(pos - 1);
    const match = rest.match(/^[A-Z][a-z]?/);
    if (!match) return null;
    const el = match[0];
    pos += el.length;
    return el;
  }

  function mergeCounts(a: Record<string, number>, b: Record<string, number>, mult = 1): Record<string, number> {
    const result = { ...a };
    for (const nm of Object.keys(b)) {
      result[nm] = (result[nm] || 0) + b[nm] * mult;
    }
    return result;
  }

  function parseGroup(stopOnRightParen = false): Record<string, number> | null {
    let counts: Record<string, number> = {};

    while (pos <= n) {
      const ch = s[pos - 1];

      if (ch === "(") {
        pos++;
        const inner = parseGroup(true);
        if (inner === null) return null;
        const mult = parseNumber();
        counts = mergeCounts(counts, inner, mult);
      } else if (ch === ")") {
        if (!stopOnRightParen) return null;
        pos++;
        return counts;
      } else {
        const el = parseElement();
        if (el === null) return null;
        const mult = parseNumber();
        counts[el] = (counts[el] || 0) + mult;
      }
    }

    if (stopOnRightParen) return null;
    return counts;
  }

  const counts = parseGroup(false);
  if (counts === null) return null;
  if (pos <= n) return null;
  return counts;
}

export function calcMwFromFormula(formula: string): number {
  const counts = parseFormulaCounts(formula);
  if (counts === null) return NaN;

  let total = 0;
  for (const el of Object.keys(counts)) {
    if (!(el in atomicWeights)) return NaN;
    total += atomicWeights[el] * counts[el];
  }
  return total;
}

// ─── PK Calculations ────────────────────────────────────────────────────────

/**
 * Convert Cmax from ng/mL to uM (micromolar)
 * Formula: Cmax_uM = Cmax_ngmL / MW
 * where MW is in mg/mmol (= g/mol), and 1 ng/mL = 1 ug/L
 * Cmax (ng/mL) / MW (mg/mmol) * (1 ug / 1000 ng) * (1000 mL / L)
 * Simplified: Cmax_ngmL / MW = umol/L = uM
 */
export function calcCmaxUM(cNgMl: number | null | undefined, mw: number): number {
  if (cNgMl === null || cNgMl === undefined || Number.isNaN(cNgMl) || Number.isNaN(mw) || mw <= 0) return NaN;
  return cNgMl / mw;
}

/** Calculate unbound concentration: Cmax_u = Cmax_total * fu,p */
export function calcUnbound(cUM: number, fuP: number): number {
  if (Number.isNaN(cUM) || Number.isNaN(fuP)) return NaN;
  return cUM * fuP;
}

export function isIvRoute(route: string | null | undefined = "Oral"): boolean {
  return String(route ?? "").toLowerCase() === "iv";
}

/**
 * Calculate Iin,max (total) - maximal hepatic inlet concentration
 * ICH M12 Eq: [I]h = Cmax,total + (Fa × Fg × ka × Dose) / Qh / Rb
 * where Dose is in umol, Qh in mL/min, ka in min^-1
 * Result in uM
 */
export function calcIinMaxTotal(
  cmaxUM: number, doseMg: number, fa: number, fg: number,
  kaMin: number, qhMlMin: number, mw: number, route = "Oral"
): number {
  if (isIvRoute(route)) return cmaxUM;
  if ([cmaxUM, doseMg, fa, fg, kaMin, qhMlMin, mw].some(v => v === null || v === undefined || Number.isNaN(v)) || mw <= 0 || qhMlMin <= 0)
    return NaN;
  const doseUmol = doseMg * 1000 / mw;
  return cmaxUM + ((fa * fg * doseUmol * kaMin) / qhMlMin);
}

/** Calculate Iin,max,u (unbound) = Iin,max,total * fu,p */
export function calcIinMaxUnbound(
  cmaxUM: number, doseMg: number, fa: number, fg: number,
  kaMin: number, qhMlMin: number, mw: number, fuP: number, route = "Oral"
): number {
  const x = calcIinMaxTotal(cmaxUM, doseMg, fa, fg, kaMin, qhMlMin, mw, route);
  if (Number.isNaN(x) || Number.isNaN(fuP)) return NaN;
  return x * fuP;
}

/**
 * Calculate [I]gut - intestinal lumen concentration
 * ICH M12: [I]gut = Dose (umol) / 0.25 L
 * where 0.25 L = 250 mL (volume of intestinal fluid)
 */
export function calcIgutUM(doseMg: number, mw: number, gutVolL = 0.25, route = "Oral"): number {
  if (isIvRoute(route)) return NaN;
  if ([doseMg, mw, gutVolL].some(v => v === null || v === undefined || Number.isNaN(v)) || mw <= 0 || gutVolL <= 0)
    return NaN;
  const doseUmol = doseMg * 1000 / mw;
  return doseUmol / gutVolL;
}

/**
 * Calculate [I]ent - enterocyte concentration
 * ICH M12: [I]ent = ka × Fa × Dose (umol) / Qent (mL/min) × 1000
 * Result in uM
 */
export function calcIEntUM(doseMg: number, mw: number, kaMin: number, fa: number, qentMlMin: number, route = "Oral"): number {
  if (isIvRoute(route)) return NaN;
  if ([doseMg, mw, kaMin, fa, qentMlMin].some(v => v === null || v === undefined || Number.isNaN(v)) || mw <= 0 || qentMlMin <= 0)
    return NaN;
  const doseUmol = doseMg * 1000 / mw;
  return (kaMin * fa * doseUmol / qentMlMin) * 1000;
}

/**
 * Calculate [I]h,total (total hepatic inlet concentration)
 * ICH M12 Eq (69): [I]h = Cmax,total + (Fa × Fg × ka × Dose (umol)) / Qh / Rb
 * Note: Dose is already converted to umol
 */
export function calcIhTotalUM(
  cmaxTotalUM: number, doseMg: number, mw: number,
  kaMin: number, fa: number, fg: number, qhMlMin: number, rb: number, route = "Oral"
): number {
  if (isIvRoute(route)) return cmaxTotalUM;
  if ([cmaxTotalUM, doseMg, mw, kaMin, fa, fg, qhMlMin, rb].some(v => v === null || v === undefined || Number.isNaN(v)) || mw <= 0 || qhMlMin <= 0 || rb <= 0)
    return NaN;
  const doseUmol = doseMg * 1000 / mw;
  return cmaxTotalUM + (((fa * fg * kaMin * doseUmol) / qhMlMin) / rb) * 1000;
}

/**
 * Calculate [I]h,u (unbound hepatic inlet concentration)
 * ICH M12: [I]h,u = fu,p × [I]h,total
 */
export function calcIhUnboundUM(
  cmaxTotalUM: number, doseMg: number, mw: number,
  kaMin: number, fa: number, fg: number, qhMlMin: number, rb: number, fuP: number, route = "Oral"
): number {
  if (isIvRoute(route)) return calcUnbound(cmaxTotalUM, fuP);
  const x = calcIhTotalUM(cmaxTotalUM, doseMg, mw, kaMin, fa, fg, qhMlMin, rb, route);
  if (Number.isNaN(x) || Number.isNaN(fuP)) return NaN;
  return fuP * x;
}

// ─── DDI Calculations ───────────────────────────────────────────────────────

/**
 * Calculate reversible inhibition factor A (for Net Effect Model)
 * A = 1 / (1 + [I]/Ki)
 * where [I] is the unbound inhibitor concentration at the enzyme site
 */
export function calcReversibleFactor(I: number, Ki: number): number {
  if ([I, Ki].some(v => v === null || v === undefined || Number.isNaN(v)) || Ki <= 0) return NaN;
  return 1 / (1 + I / Ki);
}

/**
 * Calculate R1 for Tier 1 basic model (FDA 2020)
 * R1 = 1 + [I]/Ki
 * Criteria: R1 >= 1.02 indicates DDI risk
 * 
 * Note: ICH M12/EMA uses [I]/Ki >= 0.02 (equivalent to R1 >= 1.02)
 */
export function calcR1(I: number, Ki: number): number {
  if ([I, Ki].some(v => v === null || v === undefined || Number.isNaN(v)) || Ki <= 0) return NaN;
  return 1 + I / Ki;
}

/**
 * Calculate [I]/Ki ratio (ICH M12/EMA form, without the 1+)
 * Criteria: [I]/Ki >= 0.02 indicates DDI risk
 */
export function calcIKiRatio(I: number, Ki: number): number {
  if ([I, Ki].some(v => v === null || v === undefined || Number.isNaN(v)) || Ki <= 0) return NaN;
  return I / Ki;
}

/**
 * Calculate TDI (Time-Dependent Inhibition) B factor for Net Effect Model
 * B = kdeg / (kdeg + kinact × [I] / ([I] + KI))
 */
export function calcTdiFactor(I: number, KI: number, kinactMin: number, kdegMin: number): number {
  if ([I, KI, kinactMin, kdegMin].some(v => v === null || v === undefined || Number.isNaN(v)) || KI <= 0 || kdegMin <= 0)
    return NaN;
  return kdegMin / (kdegMin + (kinactMin * I) / (KI + I));
}

/**
 * Calculate R2 for Tier 1 TDI basic model (ICH M12/FDA 2020)
 * R2 = (kobs + kdeg) / kdeg = 1 + (kinact × [I]) / (kdeg × ([I] + KI))
 * where [I] = SF × Cmax,u, SF = 5
 * Criteria: R2 >= 1.25 indicates DDI risk
 */
export function calcTdiAucRatio(I: number, KI: number, kinactMin: number, kdegMin: number): number {
  if ([I, KI, kinactMin, kdegMin].some(v => v === null || v === undefined || Number.isNaN(v)) || KI <= 0 || kdegMin <= 0)
    return NaN;
  return 1 + (kinactMin * I) / (kdegMin * (KI + I));
}

/**
 * Calculate induction C factor for Net Effect Model
 * C = 1 + (d × Emax × [I]) / ([I] + EC50)
 * 
 * Note: This is the "C" factor used in the Net Effect AUCR equation.
 * For Tier 1 R3 assessment, use calcR3() which returns 1/C (the predicted AUCR from induction)
 */
export function calcInductionFactor(I: number, Emax: number, EC50: number, dScalar = 1): number {
  if ([I, Emax, EC50].some(v => v === null || v === undefined || Number.isNaN(v)) || EC50 <= 0) return NaN;
  return 1 + (dScalar * Emax * I) / (EC50 + I);
}

export function combineStaticTerms(A: number, B: number, C: number): number {
  const vals = [A, B, C].filter(v => !Number.isNaN(v));
  if (!vals.length) return NaN;
  return vals.reduce((acc, value) => acc * value, 1);
}

export function calcHepaticNetAUCR(A: number, B: number, C: number, fm: number): number {
  if (Number.isNaN(fm)) return NaN;
  const effectTerm = combineStaticTerms(A, B, C);
  if (Number.isNaN(effectTerm)) return NaN;
  return 1 / (effectTerm * fm + (1 - fm));
}

export function calcGutNetAUCR(A: number, B: number, C: number, fg: number): number {
  if (Number.isNaN(fg)) return NaN;
  const effectTerm = combineStaticTerms(A, B, C);
  if (Number.isNaN(effectTerm)) return NaN;
  return 1 / (effectTerm * (1 - fg) + fg);
}

export function combineAUCRTerms(liverAUCR: number, gutAUCR: number): number {
  if (Number.isNaN(liverAUCR) && Number.isNaN(gutAUCR)) return NaN;
  if (Number.isNaN(liverAUCR)) return gutAUCR;
  if (Number.isNaN(gutAUCR)) return liverAUCR;
  return gutAUCR * liverAUCR;
}

/**
 * Legacy workbook-compatible denominator selection for Tier 1 R2.
 * Some assessment sheets place the effective TDI constant in the EC50 column;
 * when that is not populated, the next populated constant is used.
 */
export function getTier1TdiDenominator(KI: number, EC50: number, Emax: number): number {
  for (const value of [EC50, Emax, KI]) {
    if (!Number.isNaN(value) && value > 0) {
      return value;
    }
  }
  return NaN;
}

/**
 * Calculate R3 for Tier 1 induction basic model (ICH M12)
 * R3 = 1 / (1 + (d × Emax × [I]) / ([I] + EC50))
 * where [I] = SF × Cmax,total, SF = 10
 * Criteria: R3 <= 0.8 indicates DDI risk
 * 
 * Note: R3 = 1 / C, where C is the induction factor
 */
export function calcR3(I: number, Emax: number, EC50: number, dScalar = 1): number {
  if ([I, Emax, EC50].some(v => v === null || v === undefined || Number.isNaN(v)) || EC50 <= 0) return NaN;
  return 1 / (1 + (dScalar * Emax * I) / (EC50 + I));
}

/**
 * Calculate Net Effect AUCR (Fahmi/Isoherranen model, ICH M12 Eq)
 * AUCR = (1/((A × B × C) × fm + (1 - fm)))
 * where A = reversible factor, B = TDI factor, C = induction factor
 * 
 * If a factor is NaN, it is treated as 1 (no effect)
 */
export function calcNetEffectAUCR(A: number, B: number, C: number, fm: number): number {
  return calcHepaticNetAUCR(A, B, C, fm);
}

/**
 * Calculate CYP3A4 combined gut + liver AUCR
 * AUCR_total = AUCR_gut × AUCR_liver
 * where AUCR_gut = 1 / ((Ag × Bg × Cg) × (1 - Fg) + Fg)
 * and AUCR_liver = 1 / ((Ah × Bh × Ch) × fm + (1 - fm))
 */
export function calcCyp3a4CombinedAUCR(
  Ah: number, Bh: number, Ch: number,
  Ag: number, Bg: number, Cg: number,
  fm: number, fg: number
): number {
  const aucrLiver = calcHepaticNetAUCR(Ah, Bh, Ch, fm);
  const aucrGut = calcGutNetAUCR(Ag, Bg, Cg, fg);
  return combineAUCRTerms(aucrLiver, aucrGut);
}

/**
 * Calculate Cheng-Prusoff Ki from IC50
 * Ki = IC50 / (1 + [S]/Km)
 */
export function calcChengPrusoffKi(ic50: number, s: number, km: number): number {
  if ([ic50, s, km].some(v => v === null || v === undefined || Number.isNaN(v)) || km <= 0) return NaN;
  return ic50 / (1 + s / km);
}

/**
 * Calculate transporter DDI ratio [I]/Ki
 * Criteria per ICH M12:
 *   P-gp, BCRP (gut): [I]gut/Ki >= 10
 *   OATP1B1/1B3 (hepatic inlet): Iin,u/Ki >= 0.1
 *   OAT1/3, OCT2, MRP2 (systemic): Cmax,u/Ki >= 0.1
 *   MATE1/2-K, BSEP: Cmax,u/Ki >= 0.02
 */
export function calcTransporterRatio(I: number, Ki: number): number {
  if ([I, Ki].some(v => v === null || v === undefined || Number.isNaN(v)) || Ki <= 0) return NaN;
  return I / Ki;
}

// ─── PK Summary ─────────────────────────────────────────────────────────────
export interface PKSummaryInput {
  cmaxNgMl: number | null;
  mwCalc: number;
  fuP: number | null;
  doseMg: number | null;
  fa: number | null;
  fg: number | null;
  kaMin: number | null;
  qhMlMin: number;
  gutVolL?: number;
  route?: string;
}

export interface PKSummaryResult {
  cmaxTotalUM: number;
  cmaxUnboundUM: number;
  iinMaxTotalUM: number;
  iinMaxUnboundUM: number;
  igutUM: number;
}

export function pkSummary(x: PKSummaryInput): PKSummaryResult {
  const cmaxTotalUM = calcCmaxUM(x.cmaxNgMl, x.mwCalc);
  const cmaxUnboundUM = calcUnbound(cmaxTotalUM, x.fuP ?? NaN);
  const iinMaxTotalUM = calcIinMaxTotal(
    cmaxTotalUM, x.doseMg ?? NaN, x.fa ?? NaN, x.fg ?? NaN,
    x.kaMin ?? NaN, x.qhMlMin, x.mwCalc, x.route ?? "Oral"
  );
  const iinMaxUnboundUM = calcIinMaxUnbound(
    cmaxTotalUM, x.doseMg ?? NaN, x.fa ?? NaN, x.fg ?? NaN,
    x.kaMin ?? NaN, x.qhMlMin, x.mwCalc, x.fuP ?? NaN, x.route ?? "Oral"
  );
  const igutUM = calcIgutUM(x.doseMg ?? NaN, x.mwCalc, x.gutVolL ?? 0.25, x.route ?? "Oral");

  return { cmaxTotalUM, cmaxUnboundUM, iinMaxTotalUM, iinMaxUnboundUM, igutUM };
}

// ─── Helper for kdeg lookup ─────────────────────────────────────────────────
export function getKdegH(idBase: string, systemCypValues: Record<string, number>): number {
  if (idBase.includes("CYP3A4")) return systemCypValues["CYP3A4"] ?? 0.00032;
  return systemCypValues[idBase] ?? 0.00032;
}

// ─── Helper for kdeg gut lookup ─────────────────────────────────────────────
export function getKdegG(systemCypValues: Record<string, number>): number {
  return systemCypValues["CYP3A4_all"] ?? 0.00048;
}

// ─── fm value lookup ────────────────────────────────────────────────────────
export function getFmValue(idBase: string, systemOtherValues: Record<string, number>): number {
  return systemOtherValues[idBase] ?? 1;
}
