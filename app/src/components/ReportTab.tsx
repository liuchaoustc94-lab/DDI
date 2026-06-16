import { useMemo, useState } from "react";
import { useDDI } from "@/hooks/useDDIStore";
import { LeftPanel } from "./LeftPanel";
import { Button } from "@/components/ui/button";
import {
  fmtTxtNum, calcR1, calcTdiAucRatio, calcR3,
  calcReversibleFactor, calcTdiFactor, calcInductionFactor,
  calcNetEffectAUCR, calcCyp3a4CombinedAUCR,
  calcIEntUM, calcIhUnboundUM, calcGutNetAUCR, calcHepaticNetAUCR,
  getKdegH, getKdegG, getFmValue, getTier1TdiDenominator,
} from "@/lib/calculations";
import { defaultCyp, defaultOptional } from "@/lib/data";
import { downloadCsvReport, formatCsvExportFeedback, type CsvExportFeedback } from "@/lib/export";
import { Shield, ShieldAlert, FileCheck, Download } from "lucide-react";

/*
 * ═══════════════════════════════════════════════════════════════════════════════
 * CYP DDI Risk Assessment Report
 * 
 * Tier 1: Basic Model (Regulatory Guidance)
 *   - Reversible inhibition: R1 = 1 + [I]/Ki  (FDA), [I]/Ki (ICH/EMA)
 *   - TDI: R2 = (kobs + kdeg)/kdeg  (ICH M12)
 *   - Induction: R3 = 1/(1 + d*Emax*[I]/([I]+EC50))  (ICH M12)
 * 
 * Tier 2: Net Effect Model (Fahmi/Isoherranen, ICH M12 Section 7.5)
 *   AUCR = AUCR_gut × AUCR_liver
 *   AUCR_liver = 1 / ((Ah × Bh × Ch) × fm + (1 - fm))
 *   AUCR_gut   = 1 / ((Ag × Bg × Cg) × (1 - Fg) + Fg)
 *   where:
 *     A (reversible) = 1 / (1 + [I]/Ki)
 *     B (TDI)        = kdeg / (kdeg + kinact×[I]/([I]+KI))
 *     C (induction)  = 1 + d×Emax×[I]/([I]+EC50)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

export function ReportTab() {
  const { state, pkVals } = useDDI();
  const route = state.route;
  const cmaxUnbound = pkVals.cmaxUnboundUM;
  const igut = pkVals.igutUM;
  const cmaxTotal = pkVals.cmaxTotalUM;
  const [isExporting, setIsExporting] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<CsvExportFeedback | null>(null);

  const systemCypValues: Record<string, number> = {};
  for (const [k, v] of Object.entries(state.systemCypInputs)) {
    systemCypValues[k] = v.value ?? 0;
  }
  const systemOtherValues: Record<string, number> = {};
  for (const [k, v] of Object.entries(state.systemOtherInputs)) {
    systemOtherValues[k] = v.value ?? 0;
  }

  const qh = state.systemCypInputs["Qh"]?.value ?? 1617;
  const qent = state.systemCypInputs["Qent"]?.value ?? 300;
  const ient = calcIEntUM(
    state.doseMg ?? NaN,
    state.mwValue,
    state.kaMin ?? NaN,
    state.fa ?? NaN,
    qent,
    route,
  );
  const ihUnbound = calcIhUnboundUM(
    cmaxTotal, state.doseMg ?? NaN, state.mwValue,
    state.kaMin ?? NaN, state.fa ?? NaN, state.fg ?? NaN, qh, state.bp ?? NaN, state.fuP ?? NaN, route
  );
  const fgVal = state.systemFgInput.value ?? 0.51;

  // ─── Tier 1 Data ──────────────────────────────────────────────────────────
  // ICH M12 criteria:
  //   Reversible:  [I]/Ki >= 0.02  (equivalent to FDA R1 >= 1.02)
  //   TDI:         R2 >= 1.25
  //   Induction:   R3 <= 0.8
  //   Gut (CYP3A4 only): [I]gut/Ki >= 10
  const tier1Data = useMemo(() => {
    return defaultCyp.map((e) => {
      const inputs = state.cypInputs[e.idBase];
      const ki = inputs?.Ki_uM ?? NaN;
      const KI = inputs?.KI_uM ?? NaN;
      const kinact = inputs?.kinact_min ?? NaN;
      const Emax = inputs?.Emax ?? NaN;
      const EC50 = inputs?.EC50_uM ?? NaN;
      const dScalar = inputs?.d_scalar ?? 1;
      const kdeg = getKdegH(e.idBase, systemCypValues);
      const isCyp3A4 = /CYP3A4/.test(e.enzyme);

      // Reversible inhibition
      // FDA: R1 = 1 + [I]/Ki,  criteria: R1 >= 1.02
      // ICH: [I]/Ki,            criteria: [I]/Ki >= 0.02
      const r1 = calcR1(cmaxUnbound, ki);                    // 1 + [I]/Ki
      const iKiRatio = Number.isNaN(r1) ? NaN : r1 - 1;      // [I]/Ki (without 1+)

      // Gut concentration - only for CYP3A4 per ICH M12
      // [I]gut = Dose (umol) / 0.25 L
      const altR1 = isCyp3A4 ? calcR1(igut, ki) : NaN;
      const altIKi = Number.isNaN(altR1) ? NaN : altR1 - 1;

      // TDI: R2 = (kobs + kdeg)/kdeg, [I] = 5 × Cmax,u (SF=5)
      const tdiDenominator = getTier1TdiDenominator(KI, EC50, Emax);
      const r2 = calcTdiAucRatio(5 * cmaxUnbound, tdiDenominator, kinact, kdeg);

      // Induction: R3 = 1/(1 + d*Emax*10*Cmax,total/(10*Cmax,total + EC50))
      // [I] = 10 × Cmax,total (SF=10 for induction)
      const r3 = calcR3(10 * cmaxUnbound, Emax, EC50, dScalar as number);

      const noInduction = /CYP2A6|CYP2D6|CYP2E1/.test(e.enzyme);

      // Risk flags
      const isRedR1 = !Number.isNaN(iKiRatio) && iKiRatio >= 0.02;        // ICH criteria
      const isRedAltR1 = isCyp3A4 && route !== "IV" && !Number.isNaN(altIKi) && altIKi >= 10; // Only CYP3A4 gut
      const isRedR2 = !Number.isNaN(r2) && r2 >= 1.25;
      const isRedR3 = !Number.isNaN(r3) && r3 <= 0.8 && !noInduction;

      return {
        enzyme: e.enzyme,
        r1, iKiRatio, altR1, altIKi, r2, r3,
        isRedR1, isRedAltR1, isRedR2, isRedR3, noInduction,
        isCyp3A4,
        r1Txt: fmtTxtNum(r1),
        iKiTxt: fmtTxtNum(iKiRatio),
        altTxt: isCyp3A4 && route !== "IV" ? fmtTxtNum(altR1) : "N/A",
        altIKiTxt: isCyp3A4 && route !== "IV" ? fmtTxtNum(altIKi) : "N/A",
        r3Txt: noInduction ? "N/M" : fmtTxtNum(r3),
      };
    });
  }, [state.cypInputs, cmaxUnbound, igut, route, systemCypValues]);

  // ─── Tier 2 Data: Net Effect Model ────────────────────────────────────────
  const optionalTier1Rows = useMemo(() => {
    return defaultOptional.map((opt) => {
      const inputs = state.optionalInputs[opt.idx];
      const active = Boolean(inputs?.name?.trim()) || inputs?.ki !== null;
      const r1 = active ? calcR1(cmaxUnbound, inputs?.ki ?? NaN) : NaN;
      const iKiRatio = Number.isNaN(r1) ? NaN : r1 - 1;
      return {
        idx: opt.idx,
        active,
        name: inputs?.name?.trim() || "---",
        iKiTxt: fmtTxtNum(iKiRatio),
        isRedR1: !Number.isNaN(iKiRatio) && iKiRatio >= 0.02,
      };
    });
  }, [state.optionalInputs, cmaxUnbound]);

  const tier2Data = useMemo(() => {
    const baseEnzymes = defaultCyp.filter(e => !/CYP3A4/.test(e.enzyme));
    const baseRows = baseEnzymes.map((e) => {
      const inputs = state.cypInputs[e.idBase];
      const ki = inputs?.Ki_uM ?? NaN;
      const KI = inputs?.KI_uM ?? NaN;
      const kinact = inputs?.kinact_min ?? NaN;
      const Emax = inputs?.Emax ?? NaN;
      const EC50 = inputs?.EC50_uM ?? NaN;
      const dScalar = inputs?.d_scalar ?? 1;
      const kdeg = getKdegH(e.idBase, systemCypValues);
      const fmVal = getFmValue(`fm_${e.idBase}`, systemOtherValues);

      // Net Effect Model factors (Fahmi/Isoherranen, ICH M12)
      // A = reversible factor = 1/(1 + [I]/Ki)
      // B = TDI factor = kdeg/(kdeg + kinact*[I]/([I]+KI))
      // C = induction factor = 1 + d*Emax*[I]/([I]+EC50)
      const A = calcReversibleFactor(ihUnbound, ki);
      const B = calcTdiFactor(ihUnbound, KI, kinact, kdeg);
      const C = /CYP2A6|CYP2D6|CYP2E1/.test(e.enzyme)
        ? NaN
        : calcInductionFactor(ihUnbound, Emax, EC50, dScalar as number);

      // For display: R1 and R2 decomposition
      const rev = calcR1(ihUnbound, ki);       // 1 + [I]/Ki (display only)
      const tdi = calcTdiAucRatio(ihUnbound, KI, kinact, kdeg); // R2 (display only)

      // Net AUCR = 1 / ((A × B × C) × fm + (1 - fm))
      const net = calcNetEffectAUCR(A, B, C, fmVal);

      return {
        enzyme: e.enzyme, ki, KI, kinact, Emax, EC50,
        A, B, C, rev, tdi, net,
        noInduction: /CYP2A6|CYP2D6|CYP2E1/.test(e.enzyme),
      };
    });

    // ── CYP3A4: Midazolam ──────────────────────────────────────────────
    const midaz = defaultCyp.find(e => e.idBase === "CYP3A4_midazolam");
    const midazInputs = midaz ? state.cypInputs[midaz.idBase] : null;

    const mKi = midazInputs?.Ki_uM ?? NaN;
    const mKI = midazInputs?.KI_uM ?? NaN;
    const mKinact = midazInputs?.kinact_min ?? NaN;
    const mEmax = midazInputs?.Emax ?? NaN;
    const mEC50 = midazInputs?.EC50_uM ?? NaN;
    const mD = midazInputs?.d_scalar ?? 1;
    const mKdegH = systemCypValues["CYP3A4"] ?? 0.00032;
    const mKdegG = getKdegG(systemCypValues);
    const fm3a4 = systemOtherValues["fm_CYP3A4"] ?? 0.9;

    // Liver factors
    const mAh = calcReversibleFactor(ihUnbound, mKi);
    const mBh = calcTdiFactor(ihUnbound, mKI, mKinact, mKdegH);
    const mCh = calcInductionFactor(ihUnbound, mEmax, mEC50, mD as number);

    // Gut factors
    const mAg = calcReversibleFactor(ient, mKi);
    const mBg = calcTdiFactor(ient, mKI, mKinact, mKdegG);
    const mCg = calcInductionFactor(ient, mEmax, mEC50, mD as number);

    const mLiverNet = calcHepaticNetAUCR(mAh, mBh, mCh, fm3a4);
    const mGutNet = calcGutNetAUCR(mAg, mBg, mCg, fgVal);
    const mNet = calcCyp3a4CombinedAUCR(mAh, mBh, mCh, mAg, mBg, mCg, fm3a4, fgVal);

    // Display values (R1, R2 decomposition)
    const mRev = calcR1(ihUnbound, mKi);
    const mTdiLiver = calcTdiAucRatio(ihUnbound, mKI, mKinact, mKdegH);
    const mRevGut = calcR1(igut, mKi);
    const mTdiGut = calcTdiAucRatio(ient, mKI, mKinact, mKdegG);

    // ── CYP3A4: Testosterone ───────────────────────────────────────────
    const testo = defaultCyp.find(e => e.idBase === "CYP3A4_testosterone");
    const testoInputs = testo ? state.cypInputs[testo.idBase] : null;

    const tKi = testoInputs?.Ki_uM ?? NaN;
    const tKI = testoInputs?.KI_uM ?? NaN;
    const tKinact = testoInputs?.kinact_min ?? NaN;
    const tEmax = testoInputs?.Emax ?? NaN;
    const tEC50 = testoInputs?.EC50_uM ?? NaN;
    const tD = testoInputs?.d_scalar ?? 1;
    const tKdegH = systemCypValues["CYP3A4"] ?? 0.00032;
    const tKdegG = getKdegG(systemCypValues);

    const tAh = calcReversibleFactor(ihUnbound, tKi);
    const tBh = calcTdiFactor(ihUnbound, tKI, tKinact, tKdegH);
    const tCh = calcInductionFactor(ihUnbound, tEmax, tEC50, tD as number);
    const tAg = calcReversibleFactor(ient, tKi);
    const tBg = calcTdiFactor(ient, tKI, tKinact, tKdegG);
    const tCg = calcInductionFactor(ient, tEmax, tEC50, tD as number);

    const tLiverNet = calcHepaticNetAUCR(tAh, tBh, tCh, fm3a4);
    const tGutNet = calcGutNetAUCR(tAg, tBg, tCg, fgVal);
    const tNet = calcCyp3a4CombinedAUCR(tAh, tBh, tCh, tAg, tBg, tCg, fm3a4, fgVal);

    const tRev = calcR1(ihUnbound, tKi);
    const tTdiLiver = calcTdiAucRatio(ihUnbound, tKI, tKinact, tKdegH);
    const tRevGut = calcR1(igut, tKi);
    const tTdiGut = calcTdiAucRatio(ient, tKI, tKinact, tKdegG);

    return {
      baseRows,
      midaz: {
        ki: mKi, KI: mKI, kinact: mKinact, Emax: mEmax, EC50: mEC50,
        Ah: mAh, Bh: mBh, Ch: mCh, Ag: mAg, Bg: mBg, Cg: mCg,
        rev: mRev, tdiLiver: mTdiLiver, revGut: mRevGut, tdiGut: mTdiGut,
        liverNet: mLiverNet, gutNet: mGutNet, net: mNet,
      },
      testo: {
        ki: tKi, KI: tKI, kinact: tKinact, Emax: tEmax, EC50: tEC50,
        Ah: tAh, Bh: tBh, Ch: tCh, Ag: tAg, Bg: tBg, Cg: tCg,
        rev: tRev, tdiLiver: tTdiLiver, revGut: tRevGut, tdiGut: tTdiGut,
        liverNet: tLiverNet, gutNet: tGutNet, net: tNet,
      },
    };
  }, [state.cypInputs, ihUnbound, ient, igut, systemCypValues, systemOtherValues, fgVal]);

  const optionalTier2Rows = useMemo(() => {
    return defaultOptional.map((opt) => {
      const inputs = state.optionalInputs[opt.idx];
      const active = Boolean(inputs?.name?.trim()) || inputs?.ki !== null;
      const fm = state.systemOptionalInputs[`opt${opt.idx}`]?.value ?? NaN;
      const A = active ? calcReversibleFactor(ihUnbound, inputs?.ki ?? NaN) : NaN;
      const net = active ? calcNetEffectAUCR(A, NaN, NaN, fm) : NaN;
      return {
        idx: opt.idx,
        active,
        name: inputs?.name?.trim() || "---",
        ki: active ? (inputs?.ki ?? NaN) : NaN,
        A,
        net,
      };
    });
  }, [state.optionalInputs, state.systemOptionalInputs, ihUnbound]);

  const handleExportReport = async () => {
    const generatedAt = new Date();
    const sections = [
      {
        title: "CYP DDI Risk Assessment Report",
        rows: [
          ["Drug Name", state.drugName || "---"],
          ["Chemical Formula", state.formulaInput || "---"],
          ["Molecular Weight (g/mol)", fmtTxtNum(state.mwValue, 2)],
          ["Route", state.route || "---"],
          ["Dose (mg)", fmtTxtNum(state.doseMg, 3)],
          ["Cmax (ng/mL)", fmtTxtNum(state.cmaxNgMl, 3)],
          ["fu,p", fmtTxtNum(state.fuP, 3)],
          ["B/P", fmtTxtNum(state.bp, 3)],
          ["Fa", fmtTxtNum(state.fa, 3)],
          ["Fg", fmtTxtNum(state.fg, 3)],
          ["ka (min^-1)", fmtTxtNum(state.kaMin, 3)],
          ["Generated At", generatedAt.toLocaleString()],
        ],
      },
      {
        title: "PK Summary",
        rows: [
          ["Metric", "Value"],
          ["Cmax,u (uM)", fmtTxtNum(cmaxUnbound)],
          ["I_gut (uM)", fmtTxtNum(igut)],
          ["Ih,u (uM)", fmtTxtNum(ihUnbound)],
          ["Cmax,total (uM)", fmtTxtNum(cmaxTotal)],
        ],
      },
      {
        title: "Tier 1 Standard Enzymes",
        rows: [
          ["Enzyme", "[I]/Ki", "R1 Risk", "[I]gut/Ki", "Gut Risk", "R2", "TDI Risk", "R3", "Induction Risk"],
          ...tier1Data.map((row) => [
            row.enzyme,
            row.iKiTxt,
            row.isRedR1 ? "Risk detected" : "No risk",
            row.altIKiTxt,
            row.isCyp3A4 && !row.isRedAltR1 ? "No risk" : row.isRedAltR1 ? "Risk detected" : "N/A",
            fmtTxtNum(row.r2),
            row.isRedR2 ? "Risk detected" : "No risk",
            row.r3Txt,
            row.noInduction ? "N/M" : row.isRedR3 ? "Risk detected" : "No risk",
          ]),
        ],
      },
      {
        title: "Tier 1 Optional Enzymes",
        rows: [
          ["Enzyme", "[I]/Ki", "R1 Risk"],
          ...optionalTier1Rows.map((row) => [
            row.name,
            row.iKiTxt,
            !row.active ? "Not configured" : row.isRedR1 ? "Risk detected" : "No risk",
          ]),
        ],
      },
      {
        title: "Tier 2 Base Enzymes",
        rows: [
          ["Enzyme", "Ki_uM", "KI_uM", "kinact_min^-1", "Emax", "EC50_uM", "Ah", "Bh", "Ch", "Net AUCR", "Risk"],
          ...tier2Data.baseRows.map((row) => [
            row.enzyme,
            fmtTxtNum(row.ki),
            fmtTxtNum(row.KI),
            fmtTxtNum(row.kinact),
            fmtTxtNum(row.Emax),
            fmtTxtNum(row.EC50),
            fmtTxtNum(row.A),
            fmtTxtNum(row.B),
            row.noInduction ? "N/M" : fmtTxtNum(row.C),
            fmtTxtNum(row.net),
            !Number.isNaN(row.net) && (row.net >= 1.25 || row.net <= 0.8) ? "Risk detected" : "No risk",
          ]),
        ],
      },
      {
        title: "Tier 2 CYP3A4 Detail",
        rows: [
          ["Substrate", "Region", "Ki_uM", "KI_uM", "kinact_min^-1", "Emax", "EC50_uM", "A", "B", "C", "Net AUCR", "Risk"],
          [
            "Midazolam",
            "Liver",
            fmtTxtNum(tier2Data.midaz.ki),
            fmtTxtNum(tier2Data.midaz.KI),
            fmtTxtNum(tier2Data.midaz.kinact),
            fmtTxtNum(tier2Data.midaz.Emax),
            fmtTxtNum(tier2Data.midaz.EC50),
            fmtTxtNum(tier2Data.midaz.Ah),
            fmtTxtNum(tier2Data.midaz.Bh),
            fmtTxtNum(tier2Data.midaz.Ch),
            fmtTxtNum(tier2Data.midaz.liverNet),
            "---",
          ],
          [
            "Midazolam",
            "Gut",
            "---",
            "---",
            "---",
            "---",
            "---",
            fmtTxtNum(tier2Data.midaz.Ag),
            fmtTxtNum(tier2Data.midaz.Bg),
            fmtTxtNum(tier2Data.midaz.Cg),
            fmtTxtNum(tier2Data.midaz.gutNet),
            "---",
          ],
          [
            "Midazolam",
            "Combined",
            "---",
            "---",
            "---",
            "---",
            "---",
            "---",
            "---",
            "---",
            fmtTxtNum(tier2Data.midaz.net),
            !Number.isNaN(tier2Data.midaz.net) && (tier2Data.midaz.net >= 1.25 || tier2Data.midaz.net <= 0.8) ? "Risk detected" : "No risk",
          ],
          [
            "Testosterone",
            "Liver",
            fmtTxtNum(tier2Data.testo.ki),
            fmtTxtNum(tier2Data.testo.KI),
            fmtTxtNum(tier2Data.testo.kinact),
            fmtTxtNum(tier2Data.testo.Emax),
            fmtTxtNum(tier2Data.testo.EC50),
            fmtTxtNum(tier2Data.testo.Ah),
            fmtTxtNum(tier2Data.testo.Bh),
            fmtTxtNum(tier2Data.testo.Ch),
            fmtTxtNum(tier2Data.testo.liverNet),
            "---",
          ],
          [
            "Testosterone",
            "Gut",
            "---",
            "---",
            "---",
            "---",
            "---",
            fmtTxtNum(tier2Data.testo.Ag),
            fmtTxtNum(tier2Data.testo.Bg),
            fmtTxtNum(tier2Data.testo.Cg),
            fmtTxtNum(tier2Data.testo.gutNet),
            "---",
          ],
          [
            "Testosterone",
            "Combined",
            "---",
            "---",
            "---",
            "---",
            "---",
            "---",
            "---",
            "---",
            fmtTxtNum(tier2Data.testo.net),
            !Number.isNaN(tier2Data.testo.net) && (tier2Data.testo.net >= 1.25 || tier2Data.testo.net <= 0.8) ? "Risk detected" : "No risk",
          ],
        ],
      },
      {
        title: "Tier 2 Optional Enzymes",
        rows: [
          ["Enzyme", "Ki_uM", "Ah", "Net AUCR", "Risk"],
          ...optionalTier2Rows.map((row) => [
            row.name,
            fmtTxtNum(row.ki),
            fmtTxtNum(row.A),
            fmtTxtNum(row.net),
            !row.active ? "Not configured" : !Number.isNaN(row.net) && (row.net >= 1.25 || row.net <= 0.8) ? "Risk detected" : "No risk",
          ]),
        ],
      },
    ];

    setIsExporting(true);
    setExportFeedback({
      tone: "info",
      text: "Preparing CSV export...",
    });

    try {
      const result = await downloadCsvReport(`${state.drugName || "drug"}-cyp-ddi-report`, sections, generatedAt);
      setExportFeedback(formatCsvExportFeedback(result));
    } catch (error) {
      setExportFeedback({
        tone: "error",
        text: error instanceof Error ? error.message : "Unable to export CSV report.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="grid grid-cols-[220px_1fr] gap-5 items-start p-5 w-full h-full min-h-0 min-w-0 overflow-hidden box-border">
      <LeftPanel />
      <div className="w-full h-full min-w-0 min-h-0 overflow-auto pr-1 pb-8">
        <div className="min-w-[1400px] space-y-8">
          {/* Title */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] flex items-center justify-center shadow-md">
                <FileCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#0f172a] tracking-tight">CYP DDI Risk Assessment Report</h2>
                <p className="text-xs text-[#94a3b8] font-medium">for {state.drugName}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleExportReport}
                disabled={isExporting}
                className="h-10 rounded-xl border-[#cbd5e1] bg-white px-4 text-[#0f172a] shadow-sm hover:bg-[#f8fafc]"
              >
                <Download className="w-4 h-4" />
                {isExporting ? "Preparing..." : "Export CSV"}
              </Button>
              {exportFeedback ? (
                <p
                  aria-live="polite"
                  className={`max-w-[340px] text-right text-xs font-medium ${
                    exportFeedback.tone === "success"
                      ? "text-[#0f766e]"
                      : exportFeedback.tone === "error"
                        ? "text-[#dc2626]"
                        : "text-[#475569]"
                  }`}
                >
                  {exportFeedback.text}
                </p>
              ) : null}
            </div>
          </div>

          {/* ─── Tier 1 ────────────────────────────────────────────────── */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-[#3b82f6]" />
              <h3 className="text-sm font-bold text-[#0f172a]">Tier 1 Risk Assessment &mdash; ICH M12 / FDA 2020</h3>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-[#e2e8f0] overflow-hidden">
              <table className="border-collapse w-full">
                <thead>
                  <tr className="bg-[#f8fafc]">
                    <th rowSpan={3} className="px-3 py-3 text-[11px] font-bold text-[#475569] text-left border-b border-[#e2e8f0]">CYP Enzyme</th>
                    <th colSpan={2} className="px-3 py-2 text-[11px] font-bold text-[#475569] text-center border-b border-[#e2e8f0]">Reversible Inhibition</th>
                    <th className="px-3 py-2 text-[11px] font-bold text-[#475569] text-center border-b border-[#e2e8f0]">TDI</th>
                    <th className="px-3 py-2 text-[11px] font-bold text-[#475569] text-center border-b border-[#e2e8f0]">Induction</th>
                  </tr>
                  <tr className="bg-[#f8fafc]">
                    <th className="px-3 py-1.5 text-[10px] font-semibold text-[#94a3b8] text-center border-b border-[#e2e8f0]">[I]/Ki (ICH)</th>
                    <th className="px-3 py-1.5 text-[10px] font-semibold text-[#94a3b8] text-center border-b border-[#e2e8f0]">[I]gut/Ki (CYP3A4 only)</th>
                    <th className="px-3 py-1.5 text-[10px] font-semibold text-[#94a3b8] text-center border-b border-[#e2e8f0]" dangerouslySetInnerHTML={{ __html: "R<sub>2</sub>" }} />
                    <th className="px-3 py-1.5 text-[10px] font-semibold text-[#94a3b8] text-center border-b border-[#e2e8f0]" dangerouslySetInnerHTML={{ __html: "R<sub>3</sub>" }} />
                  </tr>
                  <tr className="bg-[#f8fafc]">
                    <th className="px-3 py-1.5 text-[10px] font-semibold text-[#94a3b8] text-center border-b border-[#e2e8f0]" dangerouslySetInnerHTML={{ __html: "[I]=C<sub>max,u</sub>; cutoff=0.02" }} />
                    <th className="px-3 py-1.5 text-[10px] font-semibold text-[#94a3b8] text-center border-b border-[#e2e8f0]" dangerouslySetInnerHTML={{ __html: "[I]=[I]<sub>gut</sub>; cutoff=10" }} />
                    <th className="px-3 py-1.5 text-[10px] font-semibold text-[#94a3b8] text-center border-b border-[#e2e8f0]" dangerouslySetInnerHTML={{ __html: "[I]=5&times;C<sub>max,u</sub>; cutoff=1.25" }} />
                    <th className="px-3 py-1.5 text-[10px] font-semibold text-[#94a3b8] text-center border-b border-[#e2e8f0]" dangerouslySetInnerHTML={{ __html: "[I]=10&times;C<sub>max,u</sub>; cutoff=0.8" }} />
                  </tr>
                </thead>
                <tbody>
                  {tier1Data.map((r) => (
                    <tr key={r.enzyme} className="hover:bg-[#f8fafc] transition-colors">
                      <td className="px-3 py-2 text-[13px] font-medium text-[#334155] border-b border-[#f1f5f9]">{r.enzyme}</td>
                      {/* [I]/Ki */}
                      <td className={`px-3 py-2 text-[13px] text-center font-mono border-b border-[#f1f5f9] ${r.isRedR1 ? "bg-[#fef2f2] text-[#dc2626] font-bold" : ""}`}>
                        {r.iKiTxt}
                      </td>
                      {/* [I]gut/Ki - only CYP3A4 */}
                      <td className={`px-3 py-2 text-[13px] text-center font-mono border-b border-[#f1f5f9] ${r.isRedAltR1 ? "bg-[#fef2f2] text-[#dc2626] font-bold" : ""} ${!r.isCyp3A4 ? "bg-[#f8fafc] text-[#94a3b8]" : ""}`}>
                        {r.altIKiTxt}
                      </td>
                      {/* R2 TDI */}
                      <td className={`px-3 py-2 text-[13px] text-center font-mono border-b border-[#f1f5f9] ${r.isRedR2 ? "bg-[#fef2f2] text-[#dc2626] font-bold" : ""}`}>
                        {fmtTxtNum(r.r2)}
                      </td>
                      {/* R3 Induction */}
                      <td className={`px-3 py-2 text-[13px] text-center font-mono border-b border-[#f1f5f9] ${r.isRedR3 ? "bg-[#fef2f2] text-[#dc2626] font-bold" : ""} ${r.noInduction ? "bg-[#f8fafc] text-[#94a3b8]" : ""}`}>
                        {r.r3Txt}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-[#f8fafc]"><td colSpan={5} className="px-3 py-2 text-[12px] font-semibold text-[#94a3b8] border-b border-[#e2e8f0]">Optional Enzymes</td></tr>
                  {optionalTier1Rows.map((row) => (
                    <tr key={`opt-${row.idx}`} className="hover:bg-[#f8fafc]">
                      <td className="px-3 py-2 text-[13px] text-[#94a3b8] border-b border-[#f1f5f9]">{row.name}</td>
                      <td className={`px-3 py-2 text-[13px] text-center font-mono border-b border-[#f1f5f9] ${row.isRedR1 ? "bg-[#fef2f2] text-[#dc2626] font-bold" : "text-[#94a3b8]"}`}>{row.iKiTxt}</td>
                      <td className="px-3 py-2 text-[13px] text-center font-mono text-[#94a3b8] bg-[#f8fafc] border-b border-[#f1f5f9]">N/A</td>
                      <td className="px-3 py-2 text-[13px] text-center font-mono text-[#94a3b8] bg-[#f8fafc] border-b border-[#f1f5f9]">N/M</td>
                      <td className="px-3 py-2 text-[13px] text-center font-mono text-[#94a3b8] bg-[#f8fafc] border-b border-[#f1f5f9]">N/M</td>
                    </tr>
                  ))}
                  {/* Criteria row */}
                  <tr className="bg-[#f8fafc] text-center">
                    <td className="px-3 py-2 text-[12px] font-bold text-[#475569] border-b border-[#e2e8f0]">Criteria</td>
                    <td className="px-3 py-2 text-[12px] font-semibold text-[#059669] border-b border-[#e2e8f0]">&ge; 0.02</td>
                    <td className="px-3 py-2 text-[12px] font-semibold text-[#059669] border-b border-[#e2e8f0]">&ge; 10 (CYP3A4)</td>
                    <td className="px-3 py-2 text-[12px] font-semibold text-[#059669] border-b border-[#e2e8f0]">&ge; 1.25</td>
                    <td className="px-3 py-2 text-[12px] font-semibold text-[#059669] border-b border-[#e2e8f0]">&le; 0.8</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ─── Tier 2: Net Effect Model ──────────────────────────────── */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert className="w-4 h-4 text-[#d97706]" />
              <h3 className="text-sm font-bold text-[#0f172a]">Tier 2 Risk Assessment &mdash; Net Effect Model (ICH M12 Section 7.5)</h3>
            </div>

            {/* Net Effect Equation */}
            <div className="bg-gradient-to-r from-[#eff6ff] to-[#f0f9ff] rounded-xl p-4 mb-4 border border-[#bfdbfe]">
              <div className="text-xs font-bold text-[#3b82f6] mb-2 uppercase tracking-wider">Net Effect AUCR Equation</div>
              <div className="text-sm font-serif text-[#1e293b] leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: `AUCR = ( <span class="border-b border-[#1e293b] px-1">1</span> / [ (A<sub>g</sub> &times; B<sub>g</sub> &times; C<sub>g</sub>) &times; (1 &minus; F<sub>g</sub>) + F<sub>g</sub> ] ) &times; ( <span class="border-b border-[#1e293b] px-1">1</span> / [ (A<sub>h</sub> &times; B<sub>h</sub> &times; C<sub>h</sub>) &times; f<sub>m</sub> + (1 &minus; f<sub>m</sub>) ] )`
                }}
              />
              <div className="text-[11px] text-[#64748b] mt-2">
                A = 1/(1+[I]/Ki) reversible | B = kdeg/(kdeg+kinact&times;[I]/([I]+KI)) TDI | C = 1+d&times;Emax&times;[I]/([I]+EC50) induction
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-[#e2e8f0] overflow-hidden">
              <table className="border-collapse w-full">
                <thead>
                  <tr className="bg-[#f8fafc]">
                    <th className="px-2 py-2 text-[10px] font-bold text-[#475569] text-left border-b border-[#e2e8f0]">CYP</th>
                    <th className="px-2 py-2 text-[10px] font-bold text-[#475569] text-center border-b border-[#e2e8f0]" dangerouslySetInnerHTML={{ __html: "K<sub>i,u</sub>" }} />
                    <th className="px-2 py-2 text-[10px] font-bold text-[#475569] text-center border-b border-[#e2e8f0]" dangerouslySetInnerHTML={{ __html: "KI<sub>u</sub>" }} />
                    <th className="px-2 py-2 text-[10px] font-bold text-[#475569] text-center border-b border-[#e2e8f0]" dangerouslySetInnerHTML={{ __html: "k<sub>inact</sub>" }} />
                    <th className="px-2 py-2 text-[10px] font-bold text-[#475569] text-center border-b border-[#e2e8f0]" dangerouslySetInnerHTML={{ __html: "E<sub>max</sub>" }} />
                    <th className="px-2 py-2 text-[10px] font-bold text-[#475569] text-center border-b border-[#e2e8f0]" dangerouslySetInnerHTML={{ __html: "EC<sub>50</sub>" }} />
                    <th className="px-2 py-2 text-[10px] font-bold text-[#3b82f6] text-center border-b border-[#e2e8f0]">A<sub>h</sub></th>
                    <th className="px-2 py-2 text-[10px] font-bold text-[#3b82f6] text-center border-b border-[#e2e8f0]">B<sub>h</sub></th>
                    <th className="px-2 py-2 text-[10px] font-bold text-[#3b82f6] text-center border-b border-[#e2e8f0]">C<sub>h</sub></th>
                    <th className="px-2 py-2 text-[10px] font-bold text-[#0f172a] text-center border-b border-[#e2e8f0]">Net AUCR</th>
                  </tr>
                </thead>
                <tbody>
                  {tier2Data.baseRows.map((r) => (
                    <tr key={r.enzyme} className="hover:bg-[#f8fafc] transition-colors">
                      <td className="px-2 py-1.5 text-[12px] font-medium text-[#334155] border-b border-[#f1f5f9]">{r.enzyme}</td>
                      <td className="px-2 py-1.5 text-[12px] text-center font-mono text-[#334155] border-b border-[#f1f5f9]">{fmtTxtNum(r.ki)}</td>
                      <td className="px-2 py-1.5 text-[12px] text-center font-mono text-[#334155] border-b border-[#f1f5f9]">{fmtTxtNum(r.KI)}</td>
                      <td className="px-2 py-1.5 text-[12px] text-center font-mono text-[#334155] border-b border-[#f1f5f9]">{fmtTxtNum(r.kinact)}</td>
                      <td className="px-2 py-1.5 text-[12px] text-center font-mono text-[#334155] border-b border-[#f1f5f9]">{fmtTxtNum(r.Emax)}</td>
                      <td className="px-2 py-1.5 text-[12px] text-center font-mono text-[#334155] border-b border-[#f1f5f9]">{fmtTxtNum(r.EC50)}</td>
                      <td className="px-2 py-1.5 text-[12px] text-center font-mono text-[#3b82f6] border-b border-[#f1f5f9]">{fmtTxtNum(r.A)}</td>
                      <td className="px-2 py-1.5 text-[12px] text-center font-mono text-[#3b82f6] border-b border-[#f1f5f9]">{fmtTxtNum(r.B)}</td>
                      <td className={`px-2 py-1.5 text-[12px] text-center font-mono border-b border-[#f1f5f9] ${r.noInduction ? "bg-[#f8fafc] text-[#94a3b8]" : "text-[#3b82f6]"}`}>{r.noInduction ? "N/M" : fmtTxtNum(r.C)}</td>
                      <td className={`px-2 py-1.5 text-[12px] text-center font-mono font-bold border-b border-[#f1f5f9] ${!Number.isNaN(r.net) && (r.net >= 1.25 || r.net <= 0.8) ? "bg-[#fef2f2] text-[#dc2626]" : "text-[#0f172a]"}`}>{fmtTxtNum(r.net)}</td>
                    </tr>
                  ))}

                  {/* CYP3A4 Header */}
                  <tr className="bg-[#eff6ff]">
                    <td colSpan={10} className="px-2 py-1.5 text-[12px] font-bold text-[#3b82f6] border-b border-[#e2e8f0]">
                      CYP3A4 (includes gut + liver combined AUCR)
                    </td>
                  </tr>

                  {/* Midazolam Liver */}
                  <tr className="hover:bg-[#f8fafc]">
                    <td className="px-2 py-1.5 text-[12px] text-[#475569] border-b border-[#f1f5f9]">&nbsp;&nbsp;Midazolam (Liver)</td>
                    <td className="px-2 py-1.5 text-[12px] text-center font-mono text-[#334155] border-b border-[#f1f5f9]">{fmtTxtNum(tier2Data.midaz.ki)}</td>
                    <td className="px-2 py-1.5 text-[12px] text-center font-mono text-[#334155] border-b border-[#f1f5f9]">{fmtTxtNum(tier2Data.midaz.KI)}</td>
                    <td className="px-2 py-1.5 text-[12px] text-center font-mono text-[#334155] border-b border-[#f1f5f9]">{fmtTxtNum(tier2Data.midaz.kinact)}</td>
                    <td className="px-2 py-1.5 text-[12px] text-center font-mono text-[#334155] border-b border-[#f1f5f9]">{fmtTxtNum(tier2Data.midaz.Emax)}</td>
                    <td className="px-2 py-1.5 text-[12px] text-center font-mono text-[#334155] border-b border-[#f1f5f9]">{fmtTxtNum(tier2Data.midaz.EC50)}</td>
                    <td className="px-2 py-1.5 text-[12px] text-center font-mono text-[#3b82f6] border-b border-[#f1f5f9]">{fmtTxtNum(tier2Data.midaz.Ah)}</td>
                    <td className="px-2 py-1.5 text-[12px] text-center font-mono text-[#3b82f6] border-b border-[#f1f5f9]">{fmtTxtNum(tier2Data.midaz.Bh)}</td>
                    <td className="px-2 py-1.5 text-[12px] text-center font-mono text-[#3b82f6] border-b border-[#f1f5f9]">{fmtTxtNum(tier2Data.midaz.Ch)}</td>
                    <td className="px-2 py-1.5 text-[12px] text-center font-mono text-[#0f172a] border-b border-[#f1f5f9]">{fmtTxtNum(tier2Data.midaz.liverNet)}</td>
                  </tr>
                  {/* Midazolam Gut */}
                  <tr className="hover:bg-[#f8fafc]">
                    <td className="px-2 py-1.5 text-[12px] text-[#475569] border-b border-[#f1f5f9]">&nbsp;&nbsp;Midazolam (Gut)</td>
                    <td colSpan={5} className="border-b border-[#f1f5f9]" />
                    <td className="px-2 py-1.5 text-[12px] text-center font-mono text-[#d97706] border-b border-[#f1f5f9]">{fmtTxtNum(tier2Data.midaz.Ag)}</td>
                    <td className="px-2 py-1.5 text-[12px] text-center font-mono text-[#d97706] border-b border-[#f1f5f9]">{fmtTxtNum(tier2Data.midaz.Bg)}</td>
                    <td className="px-2 py-1.5 text-[12px] text-center font-mono text-[#d97706] border-b border-[#f1f5f9]">{fmtTxtNum(tier2Data.midaz.Cg)}</td>
                    <td className="px-2 py-1.5 text-[12px] text-center font-mono text-[#0f172a] border-b border-[#f1f5f9]">{fmtTxtNum(tier2Data.midaz.gutNet)}</td>
                  </tr>
                  {/* Midazolam Combined */}
                  <tr className="bg-[#eff6ff] hover:bg-[#dbeafe]">
                    <td className="px-2 py-1.5 text-[12px] font-bold text-[#1e40af] border-b border-[#bfdbfe]">&nbsp;&nbsp;Midazolam (Liver + Gut)</td>
                    <td colSpan={8} className="border-b border-[#bfdbfe]" />
                    <td className={`px-2 py-1.5 text-[12px] text-center font-mono font-bold border-b border-[#bfdbfe] ${!Number.isNaN(tier2Data.midaz.net) && (tier2Data.midaz.net >= 1.25 || tier2Data.midaz.net <= 0.8) ? "bg-[#fef2f2] text-[#dc2626]" : "text-[#1e40af]"}`}>{fmtTxtNum(tier2Data.midaz.net)}</td>
                  </tr>

                  {/* Testosterone Liver */}
                  <tr className="hover:bg-[#f8fafc]">
                    <td className="px-2 py-1.5 text-[12px] text-[#475569] border-b border-[#f1f5f9]">&nbsp;&nbsp;Testosterone (Liver)</td>
                    <td className="px-2 py-1.5 text-[12px] text-center font-mono text-[#334155] border-b border-[#f1f5f9]">{fmtTxtNum(tier2Data.testo.ki)}</td>
                    <td className="px-2 py-1.5 text-[12px] text-center font-mono text-[#334155] border-b border-[#f1f5f9]">{fmtTxtNum(tier2Data.testo.KI)}</td>
                    <td className="px-2 py-1.5 text-[12px] text-center font-mono text-[#334155] border-b border-[#f1f5f9]">{fmtTxtNum(tier2Data.testo.kinact)}</td>
                    <td className="px-2 py-1.5 text-[12px] text-center font-mono text-[#334155] border-b border-[#f1f5f9]">{fmtTxtNum(tier2Data.testo.Emax)}</td>
                    <td className="px-2 py-1.5 text-[12px] text-center font-mono text-[#334155] border-b border-[#f1f5f9]">{fmtTxtNum(tier2Data.testo.EC50)}</td>
                    <td className="px-2 py-1.5 text-[12px] text-center font-mono text-[#3b82f6] border-b border-[#f1f5f9]">{fmtTxtNum(tier2Data.testo.Ah)}</td>
                    <td className="px-2 py-1.5 text-[12px] text-center font-mono text-[#3b82f6] border-b border-[#f1f5f9]">{fmtTxtNum(tier2Data.testo.Bh)}</td>
                    <td className="px-2 py-1.5 text-[12px] text-center font-mono text-[#3b82f6] border-b border-[#f1f5f9]">{fmtTxtNum(tier2Data.testo.Ch)}</td>
                    <td className="px-2 py-1.5 text-[12px] text-center font-mono text-[#0f172a] border-b border-[#f1f5f9]">{fmtTxtNum(tier2Data.testo.liverNet)}</td>
                  </tr>
                  {/* Testosterone Gut */}
                  <tr className="hover:bg-[#f8fafc]">
                    <td className="px-2 py-1.5 text-[12px] text-[#475569] border-b border-[#f1f5f9]">&nbsp;&nbsp;Testosterone (Gut)</td>
                    <td colSpan={5} className="border-b border-[#f1f5f9]" />
                    <td className="px-2 py-1.5 text-[12px] text-center font-mono text-[#d97706] border-b border-[#f1f5f9]">{fmtTxtNum(tier2Data.testo.Ag)}</td>
                    <td className="px-2 py-1.5 text-[12px] text-center font-mono text-[#d97706] border-b border-[#f1f5f9]">{fmtTxtNum(tier2Data.testo.Bg)}</td>
                    <td className="px-2 py-1.5 text-[12px] text-center font-mono text-[#d97706] border-b border-[#f1f5f9]">{fmtTxtNum(tier2Data.testo.Cg)}</td>
                    <td className="px-2 py-1.5 text-[12px] text-center font-mono text-[#0f172a] border-b border-[#f1f5f9]">{fmtTxtNum(tier2Data.testo.gutNet)}</td>
                  </tr>
                  {/* Testosterone Combined */}
                  <tr className="bg-[#eff6ff] hover:bg-[#dbeafe]">
                    <td className="px-2 py-1.5 text-[12px] font-bold text-[#1e40af] border-b border-[#bfdbfe]">&nbsp;&nbsp;Testosterone (Liver + Gut)</td>
                    <td colSpan={8} className="border-b border-[#bfdbfe]" />
                    <td className={`px-2 py-1.5 text-[12px] text-center font-mono font-bold border-b border-[#bfdbfe] ${!Number.isNaN(tier2Data.testo.net) && (tier2Data.testo.net >= 1.25 || tier2Data.testo.net <= 0.8) ? "bg-[#fef2f2] text-[#dc2626]" : "text-[#1e40af]"}`}>{fmtTxtNum(tier2Data.testo.net)}</td>
                  </tr>

                  {/* Optional */}
                  <tr className="bg-[#f8fafc]"><td colSpan={10} className="px-2 py-1.5 text-[12px] font-semibold text-[#94a3b8] border-b border-[#e2e8f0]">Optional Enzymes</td></tr>
                  {optionalTier2Rows.map((row) => (
                    <tr key={`opt2-${row.idx}`} className="hover:bg-[#f8fafc]">
                      <td className="px-2 py-1.5 text-[12px] text-[#94a3b8] border-b border-[#f1f5f9]">{row.name}</td>
                      <td className="px-2 py-1.5 text-[12px] text-center font-mono text-[#334155] border-b border-[#f1f5f9]">{fmtTxtNum(row.ki)}</td>
                      <td className="px-2 py-1.5 text-[12px] text-center font-mono text-[#94a3b8] bg-[#f8fafc] border-b border-[#f1f5f9]">N/M</td>
                      <td className="px-2 py-1.5 text-[12px] text-center font-mono text-[#94a3b8] bg-[#f8fafc] border-b border-[#f1f5f9]">N/M</td>
                      <td className="px-2 py-1.5 text-[12px] text-center font-mono text-[#94a3b8] bg-[#f8fafc] border-b border-[#f1f5f9]">N/M</td>
                      <td className="px-2 py-1.5 text-[12px] text-center font-mono text-[#94a3b8] bg-[#f8fafc] border-b border-[#f1f5f9]">N/M</td>
                      <td className="px-2 py-1.5 text-[12px] text-center font-mono text-[#3b82f6] border-b border-[#f1f5f9]">{fmtTxtNum(row.A)}</td>
                      <td className="px-2 py-1.5 text-[12px] text-center font-mono text-[#94a3b8] bg-[#f8fafc] border-b border-[#f1f5f9]">N/M</td>
                      <td className="px-2 py-1.5 text-[12px] text-center font-mono text-[#94a3b8] bg-[#f8fafc] border-b border-[#f1f5f9]">N/M</td>
                      <td className={`px-2 py-1.5 text-[12px] text-center font-mono font-bold border-b border-[#f1f5f9] ${!Number.isNaN(row.net) && (row.net >= 1.25 || row.net <= 0.8) ? "bg-[#fef2f2] text-[#dc2626]" : "text-[#0f172a]"}`}>{fmtTxtNum(row.net)}</td>
                    </tr>
                  ))}

                  {/* Legend */}
                  <tr>
                    <td colSpan={10} className="px-4 py-3 text-[11px] text-[#64748b] border-t border-[#e2e8f0]">
                      <span className="inline-block w-2 h-2 rounded-full bg-[#3b82f6] mr-1" /><span className="mr-4">A<sub>h</sub>/B<sub>h</sub>/C<sub>h</sub> = Liver factors</span>
                      <span className="inline-block w-2 h-2 rounded-full bg-[#d97706] mr-1" /><span className="mr-4">A<sub>g</sub>/B<sub>g</sub>/C<sub>g</sub> = Gut factors</span>
                      <span className="font-semibold text-[#059669] mr-2">Criteria: AUCR &ge; 1.25 or &le; 0.8</span>
                      <span className="bg-[#fef2f2] text-[#dc2626] px-1.5 py-0.5 rounded text-[10px] font-bold">Red = DDI risk detected</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
