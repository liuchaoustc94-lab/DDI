import { useMemo } from "react";
import {
  BookOpenText,
  Calculator,
  ChevronRight,
  CircleAlert,
  Sigma,
} from "lucide-react";
import { useDDI } from "@/hooks/useDDIStore";
import { LeftPanel } from "./LeftPanel";
import { SectionTitle, SubsectionTitle } from "./FieldComponents";
import {
  calcChengPrusoffKi,
  calcCyp3a4CombinedAUCR,
  calcIEntUM,
  calcIhTotalUM,
  calcIhUnboundUM,
  calcInductionFactor,
  calcNetEffectAUCR,
  calcR1,
  calcR3,
  calcReversibleFactor,
  calcTdiAucRatio,
  calcTdiFactor,
  calcTransporterRatio,
  fmtTxtNum,
  getFmValue,
  getKdegG,
  getKdegH,
} from "@/lib/calculations";
import { defaultCyp, defaultOptional, defaultOptionalTr, defaultTr } from "@/lib/data";

interface MetricDetail {
  label: string;
  result: string;
  formula: string;
  inputs: string;
  rule: string;
  note?: string;
  tone?: "default" | "success" | "warning";
}

interface CalculationCardProps {
  title: string;
  subtitle?: string;
  accent?: "blue" | "emerald" | "amber";
  metrics: MetricDetail[];
}

function fmtExpr(value: number | null | undefined, digits = 3): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "---";
  }

  return value.toFixed(digits);
}

function riskTone(isRisk: boolean, isUnavailable = false): "default" | "success" | "warning" {
  if (isUnavailable) {
    return "warning";
  }

  return isRisk ? "warning" : "success";
}

function formatBoolRisk(isRisk: boolean, unavailable = false): string {
  if (unavailable) {
    return "Not assessed";
  }

  return isRisk ? "Risk detected" : "No risk";
}

function CalculationCard({ title, subtitle, accent = "blue", metrics }: CalculationCardProps) {
  const accentStyles =
    accent === "emerald"
      ? "from-[#ecfdf5] to-white border-[#bbf7d0]"
      : accent === "amber"
        ? "from-[#fffbeb] to-white border-[#fde68a]"
        : "from-[#eff6ff] to-white border-[#bfdbfe]";

  return (
    <article className={`rounded-2xl border bg-gradient-to-br ${accentStyles} p-5 shadow-sm`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-[#0f172a]">{title}</h3>
          {subtitle ? <p className="mt-1 text-xs text-[#64748b]">{subtitle}</p> : null}
        </div>
        <span className="rounded-full border border-white/80 bg-white/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#475569]">
          Live
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {metrics.map((metric) => (
          <div key={`${title}-${metric.label}`} className="rounded-xl border border-white/80 bg-white/90 p-3 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-semibold text-[#1e293b]">{metric.label}</div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-mono font-semibold ${
                  metric.tone === "warning"
                    ? "bg-[#fff7ed] text-[#c2410c]"
                    : metric.tone === "success"
                      ? "bg-[#ecfdf5] text-[#047857]"
                      : "bg-[#eff6ff] text-[#1d4ed8]"
                }`}
              >
                {metric.result}
              </span>
            </div>
            <div className="mt-2 text-xs leading-5 text-[#475569]">
              <div>
                <span className="font-semibold text-[#334155]">Formula:</span> {metric.formula}
              </div>
              <div className="mt-1 font-mono text-[11px] text-[#0f172a]">
                <span className="font-semibold text-[#334155] font-sans">Inputs:</span> {metric.inputs}
              </div>
              <div className="mt-1 text-[#64748b]">
                <span className="font-semibold text-[#334155]">Rule:</span> {metric.rule}
              </div>
              {metric.note ? (
                <div className="mt-1 text-[#94a3b8]">
                  <span className="font-semibold text-[#64748b]">Note:</span> {metric.note}
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function SummaryStat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-[#dbeafe] bg-white/90 p-4 shadow-sm">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748b]">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-[#0f172a]">{value}</div>
      <div className="mt-1 text-xs text-[#64748b]">{detail}</div>
    </div>
  );
}

function getTransporterThreshold(transporter: string, route: string): number {
  if (transporter === "P-gp" || transporter === "BCRP") {
    return route === "IV" ? 0.02 : 10;
  }

  if (transporter === "MATE1" || transporter === "MATE2K" || transporter === "BSEP") {
    return 0.02;
  }

  return 0.1;
}

function getTransporterLabel(site: string, route: string): string {
  if (site === "gut") {
    return route === "IV" ? "Cmax,u" : "Igut";
  }

  if (site === "hepatic_inlet") {
    return "Iin,max";
  }

  if (site === "hepatic_inlet_unbound") {
    return "Iin,max,u";
  }

  return "Cmax,u";
}

function getTransporterConcentration(
  site: string,
  route: string,
  values: { cmaxUnbound: number; igut: number; iinMaxTotal: number; iinMaxUnbound: number },
): number {
  if (site === "gut") {
    return route === "IV" ? values.cmaxUnbound : values.igut;
  }

  if (site === "hepatic_inlet") {
    return values.iinMaxTotal;
  }

  if (site === "hepatic_inlet_unbound") {
    return values.iinMaxUnbound;
  }

  return values.cmaxUnbound;
}

export function SupportInfoTab() {
  const { state, pkVals } = useDDI();
  const route = state.route;
  const isIv = String(route ?? "").toLowerCase() === "iv";
  const mw = state.mwValue;
  const cmaxTotal = pkVals.cmaxTotalUM;
  const cmaxUnbound = pkVals.cmaxUnboundUM;
  const iinMaxTotal = pkVals.iinMaxTotalUM;
  const iinMaxUnbound = pkVals.iinMaxUnboundUM;
  const igut = pkVals.igutUM;
  const qent = state.systemCypInputs["Qent"]?.value ?? 300;
  const qh = state.systemCypInputs["Qh"]?.value ?? 1617;
  const rb = state.bp ?? NaN;
  const doseUmol = state.doseMg !== null && !Number.isNaN(mw) && mw > 0 ? (state.doseMg * 1000) / mw : NaN;
  const ient = calcIEntUM(state.doseMg ?? NaN, mw, state.kaMin ?? NaN, state.fa ?? NaN, qent, route);
  const ihTotal = calcIhTotalUM(
    cmaxTotal,
    state.doseMg ?? NaN,
    mw,
    state.kaMin ?? NaN,
    state.fa ?? NaN,
    state.fg ?? NaN,
    qh,
    rb,
    route,
  );
  const ihUnbound = calcIhUnboundUM(
    cmaxTotal,
    state.doseMg ?? NaN,
    mw,
    state.kaMin ?? NaN,
    state.fa ?? NaN,
    state.fg ?? NaN,
    qh,
    rb,
    state.fuP ?? NaN,
    route,
  );
  const fgVal = state.systemFgInput.value ?? 0.51;

  const systemCypValues = useMemo(() => {
    const mapped: Record<string, number> = {};
    for (const [key, value] of Object.entries(state.systemCypInputs)) {
      mapped[key] = value.value ?? NaN;
    }
    return mapped;
  }, [state.systemCypInputs]);

  const systemOtherValues = useMemo(() => {
    const mapped: Record<string, number> = {};
    for (const [key, value] of Object.entries(state.systemOtherInputs)) {
      mapped[key] = value.value ?? NaN;
    }
    return mapped;
  }, [state.systemOtherInputs]);

  const pkSupportMetrics = useMemo<MetricDetail[]>(() => {
    return [
      {
        label: "Molecular Weight (g/mol)",
        result: fmtTxtNum(state.mwValue, 2),
        formula: "MW = Σ(element count × atomic weight)",
        inputs: `Formula = ${state.formulaInput || "---"}`,
        rule: "Used for all unit conversions from mg or ng/mL into μmol/L scale.",
      },
      {
        label: "Dose (μmol)",
        result: fmtTxtNum(doseUmol),
        formula: "Dose(μmol) = Dose(mg) × 1000 / MW",
        inputs: `${fmtExpr(state.doseMg)} × 1000 / ${fmtExpr(state.mwValue, 2)}`,
        rule: "Feeds Igut, Ient, Iin,max and Ih calculations.",
      },
      {
        label: "Cmax,total (μM)",
        result: fmtTxtNum(cmaxTotal),
        formula: "Cmax,total = Cmax(ng/mL) / MW",
        inputs: `${fmtExpr(state.cmaxNgMl)} / ${fmtExpr(state.mwValue, 2)}`,
        rule: "Used by PK summary and Tier 1 induction scaling.",
      },
      {
        label: "Cmax,u (μM)",
        result: fmtTxtNum(cmaxUnbound),
        formula: "Cmax,u = Cmax,total × fu,p",
        inputs: `${fmtExpr(cmaxTotal)} × ${fmtExpr(state.fuP)}`,
        rule: "Used by reversible inhibition, TDI, and most transporter ratios.",
      },
      {
        label: "Iin,max (μM)",
        result: fmtTxtNum(iinMaxTotal),
        formula: "Iin,max = Cmax,total + (Fa × Fg × Dose(μmol) × ka) / Qh",
        inputs: `${fmtExpr(cmaxTotal)} + (${fmtExpr(state.fa)} × ${fmtExpr(state.fg)} × ${fmtExpr(doseUmol)} × ${fmtExpr(state.kaMin)}) / ${fmtExpr(qh, 0)}`,
        rule: isIv ? "For IV input the implementation returns Cmax,total directly." : "Used for hepatic inlet transporter assessments.",
      },
      {
        label: "Iin,max,u (μM)",
        result: fmtTxtNum(iinMaxUnbound),
        formula: "Iin,max,u = Iin,max × fu,p",
        inputs: `${fmtExpr(iinMaxTotal)} × ${fmtExpr(state.fuP)}`,
        rule: "Used for OATP1B1/1B3 and other hepatic inlet unbound transporter ratios.",
      },
      {
        label: "Igut (μM)",
        result: fmtTxtNum(igut),
        formula: "Igut = Dose(μmol) / 0.25 L",
        inputs: `${fmtExpr(doseUmol)} / 0.25`,
        rule: isIv ? "For IV route this output is not used and remains unavailable." : "Used for CYP3A4 gut risk and gut transporter assessments.",
      },
      {
        label: "Ient (μM)",
        result: fmtTxtNum(ient),
        formula: "Ient = ka × Fa × Dose(μmol) / Qent × 1000",
        inputs: `${fmtExpr(state.kaMin)} × ${fmtExpr(state.fa)} × ${fmtExpr(doseUmol)} / ${fmtExpr(qent, 0)} × 1000`,
        rule: isIv ? "For IV route this output is not used and remains unavailable." : "Shown in Intermediate Values for intestinal concentration context.",
      },
      {
        label: "Ih,total (μM)",
        result: fmtTxtNum(ihTotal),
        formula: "Ih,total = Cmax,total + (Fa × Fg × ka × Dose(μmol)) / (Qh × Rb)",
        inputs: `${fmtExpr(cmaxTotal)} + (${fmtExpr(state.fa)} × ${fmtExpr(state.fg)} × ${fmtExpr(state.kaMin)} × ${fmtExpr(doseUmol)}) / (${fmtExpr(qh, 0)} × ${fmtExpr(rb)})`,
        rule: isIv ? "For IV route the implementation returns Cmax,total directly." : "Intermediate hepatic inlet concentration before fu,p correction.",
      },
      {
        label: "Ih,u (μM)",
        result: fmtTxtNum(ihUnbound),
        formula: "Ih,u = fu,p × Ih,total",
        inputs: `${fmtExpr(state.fuP)} × ${fmtExpr(ihTotal)}`,
        rule: "Primary inhibitor concentration used by CYP net-effect liver factors.",
      },
    ];
  }, [
    cmaxTotal,
    cmaxUnbound,
    doseUmol,
    ient,
    igut,
    iinMaxTotal,
    iinMaxUnbound,
    ihTotal,
    ihUnbound,
    isIv,
    qent,
    qh,
    rb,
    state.cmaxNgMl,
    state.doseMg,
    state.fa,
    state.fg,
    state.formulaInput,
    state.fuP,
    state.kaMin,
    state.mwValue,
  ]);

  const tier1Cards = useMemo(() => {
    return defaultCyp.map((enzyme) => {
      const inputs = state.cypInputs[enzyme.idBase];
      const ki = inputs?.Ki_uM ?? NaN;
      const KI = inputs?.KI_uM ?? NaN;
      const kinact = inputs?.kinact_min ?? NaN;
      const Emax = inputs?.Emax ?? NaN;
      const EC50 = inputs?.EC50_uM ?? NaN;
      const dScalar = inputs?.d_scalar ?? 1;
      const kdeg = getKdegH(enzyme.idBase, systemCypValues);
      const isCyp3A4 = /CYP3A4/.test(enzyme.enzyme);
      const noInduction = /CYP2A6|CYP2D6|CYP2E1/.test(enzyme.enzyme);

      const r1 = calcR1(cmaxUnbound, ki);
      const iKiRatio = Number.isNaN(r1) ? NaN : r1 - 1;
      const altR1 = isCyp3A4 ? calcR1(igut, ki) : NaN;
      const altIKi = Number.isNaN(altR1) ? NaN : altR1 - 1;
      const scaledTdiI = 5 * cmaxUnbound;
      const r2 = calcTdiAucRatio(scaledTdiI, KI, kinact, kdeg);
      const scaledInductionI = 10 * cmaxTotal;
      const r3 = calcR3(scaledInductionI, Emax, EC50, dScalar as number);

      const metrics: MetricDetail[] = [
        {
          label: "[I]/Ki",
          result: fmtTxtNum(iKiRatio),
          formula: "[I]/Ki = Cmax,u / Ki",
          inputs: `${fmtExpr(cmaxUnbound)} / ${fmtExpr(ki)}`,
          rule: `${formatBoolRisk(!Number.isNaN(iKiRatio) && iKiRatio >= 0.02)}; threshold is ≥ 0.02.`,
          tone: riskTone(!Number.isNaN(iKiRatio) && iKiRatio >= 0.02),
        },
        {
          label: "R2",
          result: fmtTxtNum(r2),
          formula: "R2 = 1 + kinact × (5 × Cmax,u) / (kdeg × (5 × Cmax,u + KI))",
          inputs: `1 + ${fmtExpr(kinact)} × ${fmtExpr(scaledTdiI)} / (${fmtExpr(kdeg, 5)} × (${fmtExpr(scaledTdiI)} + ${fmtExpr(KI)}))`,
          rule: `${formatBoolRisk(!Number.isNaN(r2) && r2 >= 1.25)}; threshold is ≥ 1.25.`,
          tone: riskTone(!Number.isNaN(r2) && r2 >= 1.25),
        },
        {
          label: "R3",
          result: noInduction ? "N/M" : fmtTxtNum(r3),
          formula: "R3 = 1 / (1 + d × Emax × (10 × Cmax,total) / (10 × Cmax,total + EC50))",
          inputs: noInduction
            ? "Induction not assessed for this enzyme."
            : `1 / (1 + ${fmtExpr(dScalar)} × ${fmtExpr(Emax)} × ${fmtExpr(scaledInductionI)} / (${fmtExpr(scaledInductionI)} + ${fmtExpr(EC50)}))`,
          rule: noInduction ? "Not assessed for CYP2A6, CYP2D6, and CYP2E1." : `${formatBoolRisk(!Number.isNaN(r3) && r3 <= 0.8)}; threshold is ≤ 0.8.`,
          tone: riskTone(!Number.isNaN(r3) && r3 <= 0.8, noInduction),
        },
      ];

      if (isCyp3A4) {
        metrics.splice(1, 0, {
          label: "[I]gut/Ki",
          result: isIv ? "N/A" : fmtTxtNum(altIKi),
          formula: "[I]gut/Ki = Igut / Ki",
          inputs: isIv ? "Route is IV, so gut concentration output is not evaluated here." : `${fmtExpr(igut)} / ${fmtExpr(ki)}`,
          rule: isIv ? "Displayed as N/A for IV route." : `${formatBoolRisk(!Number.isNaN(altIKi) && altIKi >= 10)}; threshold is ≥ 10.`,
          tone: riskTone(!Number.isNaN(altIKi) && altIKi >= 10, isIv),
        });
      }

      return {
        title: enzyme.enzyme,
        subtitle: "CYP Tier 1 basic model output explanation",
        accent: isCyp3A4 ? "amber" as const : "blue" as const,
        metrics,
      };
    });
  }, [cmaxTotal, cmaxUnbound, igut, isIv, state.cypInputs, systemCypValues]);

  const optionalTier1Cards = useMemo(() => {
    return defaultOptional.map((opt) => {
      const inputs = state.optionalInputs[opt.idx];
      const active = Boolean(inputs?.name?.trim()) || inputs?.ki !== null;
      const ki = inputs?.ki ?? NaN;
      const r1 = active ? calcR1(cmaxUnbound, ki) : NaN;
      const iKiRatio = Number.isNaN(r1) ? NaN : r1 - 1;

      return {
        title: inputs?.name?.trim() || `Optional enzyme ${opt.idx}`,
        subtitle: active ? "User-defined reversible inhibition check" : "Optional enzyme not configured",
        accent: active ? ("blue" as const) : ("amber" as const),
        metrics: [
          {
            label: "[I]/Ki",
            result: active ? fmtTxtNum(iKiRatio) : "---",
            formula: "[I]/Ki = Cmax,u / Ki",
            inputs: active ? `${fmtExpr(cmaxUnbound)} / ${fmtExpr(ki)}` : "Configure enzyme name and Ki to enable this output.",
            rule: active ? `${formatBoolRisk(!Number.isNaN(iKiRatio) && iKiRatio >= 0.02)}; threshold is ≥ 0.02.` : "No value is generated until the optional enzyme is configured.",
            tone: riskTone(!Number.isNaN(iKiRatio) && iKiRatio >= 0.02, !active),
          },
        ],
      };
    });
  }, [cmaxUnbound, state.optionalInputs]);

  const tier2BaseCards = useMemo(() => {
    return defaultCyp
      .filter((enzyme) => !/CYP3A4/.test(enzyme.enzyme))
      .map((enzyme) => {
        const inputs = state.cypInputs[enzyme.idBase];
        const ki = inputs?.Ki_uM ?? NaN;
        const KI = inputs?.KI_uM ?? NaN;
        const kinact = inputs?.kinact_min ?? NaN;
        const Emax = inputs?.Emax ?? NaN;
        const EC50 = inputs?.EC50_uM ?? NaN;
        const dScalar = inputs?.d_scalar ?? 1;
        const kdeg = getKdegH(enzyme.idBase, systemCypValues);
        const fmVal = getFmValue(`fm_${enzyme.idBase}`, systemOtherValues);
        const noInduction = /CYP2A6|CYP2D6|CYP2E1/.test(enzyme.enzyme);

        const A = calcReversibleFactor(ihUnbound, ki);
        const B = calcTdiFactor(ihUnbound, KI, kinact, kdeg);
        const C = noInduction ? NaN : calcInductionFactor(ihUnbound, Emax, EC50, dScalar as number);
        const net = calcNetEffectAUCR(A, B, C, fmVal);
        const netRisk = !Number.isNaN(net) && (net >= 1.25 || net <= 0.8);

        return {
          title: enzyme.enzyme,
          subtitle: "Tier 2 net-effect liver model",
          accent: netRisk ? ("amber" as const) : ("emerald" as const),
          metrics: [
            {
              label: "A factor",
              result: fmtTxtNum(A),
              formula: "A = 1 / (1 + Ih,u / Ki)",
              inputs: `1 / (1 + ${fmtExpr(ihUnbound)} / ${fmtExpr(ki)})`,
              rule: "Reversible inhibition factor used inside the net-effect model.",
            },
            {
              label: "B factor",
              result: fmtTxtNum(B),
              formula: "B = kdeg / (kdeg + kinact × Ih,u / (Ih,u + KI))",
              inputs: `${fmtExpr(kdeg, 5)} / (${fmtExpr(kdeg, 5)} + ${fmtExpr(kinact)} × ${fmtExpr(ihUnbound)} / (${fmtExpr(ihUnbound)} + ${fmtExpr(KI)}))`,
              rule: "Time-dependent inhibition factor used inside the net-effect model.",
            },
            {
              label: "C factor",
              result: noInduction ? "N/M" : fmtTxtNum(C),
              formula: "C = 1 + d × Emax × Ih,u / (Ih,u + EC50)",
              inputs: noInduction
                ? "Induction not assessed for this enzyme."
                : `1 + ${fmtExpr(dScalar)} × ${fmtExpr(Emax)} × ${fmtExpr(ihUnbound)} / (${fmtExpr(ihUnbound)} + ${fmtExpr(EC50)})`,
              rule: noInduction ? "When unavailable, the implementation treats C as neutral (1.0) in net AUCR." : "Induction factor used inside the net-effect model.",
              tone: riskTone(false, noInduction),
            },
            {
              label: "Net AUCR",
              result: fmtTxtNum(net),
              formula: "AUCR = 1 / ((A × B × C) × fm + (1 - fm))",
              inputs: `1 / ((${fmtExpr(A)} × ${fmtExpr(B)} × ${Number.isNaN(C) ? "1.000" : fmtExpr(C)}) × ${fmtExpr(fmVal)} + (1 - ${fmtExpr(fmVal)}))`,
              rule: `${formatBoolRisk(netRisk)}; report flags AUCR ≥ 1.25 or ≤ 0.8.`,
              tone: riskTone(netRisk),
            },
          ],
        };
      });
  }, [ihUnbound, state.cypInputs, systemCypValues, systemOtherValues]);

  const cyp3a4Tier2Cards = useMemo(() => {
    const substrates = [
      { idBase: "CYP3A4_midazolam", title: "CYP3A4 (midazolam)", fm: systemOtherValues["fm_CYP3A4"] ?? 0.9 },
      { idBase: "CYP3A4_testosterone", title: "CYP3A4 (testosterone)", fm: systemOtherValues["fm_CYP3A4"] ?? 0.9 },
    ];

    return substrates.map((substrate) => {
      const inputs = state.cypInputs[substrate.idBase];
      const ki = inputs?.Ki_uM ?? NaN;
      const KI = inputs?.KI_uM ?? NaN;
      const kinact = inputs?.kinact_min ?? NaN;
      const Emax = inputs?.Emax ?? NaN;
      const EC50 = inputs?.EC50_uM ?? NaN;
      const dScalar = inputs?.d_scalar ?? 1;
      const kdegH = systemCypValues["CYP3A4"] ?? 0.00032;
      const kdegG = getKdegG(systemCypValues);

      const Ah = calcReversibleFactor(ihUnbound, ki);
      const Bh = calcTdiFactor(ihUnbound, KI, kinact, kdegH);
      const Ch = calcInductionFactor(ihUnbound, Emax, EC50, dScalar as number);
      const Ag = calcReversibleFactor(igut, ki);
      const Bg = calcTdiFactor(igut, KI, kinact, kdegG);
      const Cg = calcInductionFactor(igut, Emax, EC50, dScalar as number);
      const net = calcCyp3a4CombinedAUCR(Ah, Bh, Ch, Ag, Bg, Cg, substrate.fm, fgVal);
      const netRisk = !Number.isNaN(net) && (net >= 1.25 || net <= 0.8);

      return {
        title: substrate.title,
        subtitle: "CYP3A4 liver + gut combined net-effect model",
        accent: netRisk ? ("amber" as const) : ("emerald" as const),
        metrics: [
          {
            label: "Liver factors",
            result: `A=${fmtTxtNum(Ah)} / B=${fmtTxtNum(Bh)} / C=${fmtTxtNum(Ch)}`,
            formula: "Ah = 1/(1 + Ih,u/Ki); Bh = kdeg,h/(kdeg,h + kinact × Ih,u/(Ih,u + KI)); Ch = 1 + d × Emax × Ih,u/(Ih,u + EC50)",
            inputs: `Ih,u=${fmtExpr(ihUnbound)}, Ki=${fmtExpr(ki)}, KI=${fmtExpr(KI)}, kinact=${fmtExpr(kinact)}, kdeg,h=${fmtExpr(kdegH, 5)}, Emax=${fmtExpr(Emax)}, EC50=${fmtExpr(EC50)}`,
            rule: "These factors drive the liver AUCR term.",
          },
          {
            label: "Gut factors",
            result: isIv ? "N/A" : `A=${fmtTxtNum(Ag)} / B=${fmtTxtNum(Bg)} / C=${fmtTxtNum(Cg)}`,
            formula: "Ag = 1/(1 + Igut/Ki); Bg = kdeg,g/(kdeg,g + kinact × Igut/(Igut + KI)); Cg = 1 + d × Emax × Igut/(Igut + EC50)",
            inputs: isIv
              ? "Route is IV, so Igut-based gut factors are not normally interpreted."
              : `Igut=${fmtExpr(igut)}, Ki=${fmtExpr(ki)}, KI=${fmtExpr(KI)}, kinact=${fmtExpr(kinact)}, kdeg,g=${fmtExpr(kdegG, 5)}, Emax=${fmtExpr(Emax)}, EC50=${fmtExpr(EC50)}`,
            rule: isIv ? "Gut factor display is informational only for IV route." : "These factors drive the gut AUCR term.",
            tone: riskTone(false, isIv),
          },
          {
            label: "Combined Net AUCR",
            result: fmtTxtNum(net),
            formula: "AUCRtotal = [1 / ((Ah × Bh × Ch) × fm + (1 - fm))] × [1 / ((Ag × Bg × Cg) × (1 - Fg) + Fg)]",
            inputs: `fm=${fmtExpr(substrate.fm)}, Fg=${fmtExpr(fgVal)}, liver(A/B/C)=${fmtExpr(Ah)}/${fmtExpr(Bh)}/${fmtExpr(Ch)}, gut(A/B/C)=${fmtExpr(Ag)}/${fmtExpr(Bg)}/${fmtExpr(Cg)}`,
            rule: `${formatBoolRisk(netRisk)}; report flags AUCR ≥ 1.25 or ≤ 0.8.`,
            tone: riskTone(netRisk),
          },
        ],
      };
    });
  }, [fgVal, igut, ihUnbound, isIv, state.cypInputs, systemCypValues, systemOtherValues]);

  const optionalTier2Cards = useMemo(() => {
    return defaultOptional.map((opt) => {
      const inputs = state.optionalInputs[opt.idx];
      const active = Boolean(inputs?.name?.trim()) || inputs?.ki !== null;
      const ki = active ? (inputs?.ki ?? NaN) : NaN;
      const fm = state.systemOptionalInputs[`opt${opt.idx}`]?.value ?? NaN;
      const A = active ? calcReversibleFactor(ihUnbound, ki) : NaN;
      const net = active ? calcNetEffectAUCR(A, NaN, NaN, fm) : NaN;
      const netRisk = active && !Number.isNaN(net) && (net >= 1.25 || net <= 0.8);

      return {
        title: inputs?.name?.trim() || `Optional enzyme ${opt.idx}`,
        subtitle: active ? "Optional net-effect entry (reversible inhibition only)" : "Optional enzyme not configured",
        accent: active ? ("blue" as const) : ("amber" as const),
        metrics: [
          {
            label: "A factor",
            result: active ? fmtTxtNum(A) : "---",
            formula: "A = 1 / (1 + Ih,u / Ki)",
            inputs: active ? `1 / (1 + ${fmtExpr(ihUnbound)} / ${fmtExpr(ki)})` : "Configure enzyme name and Ki to enable this output.",
            rule: active ? "Only reversible inhibition is considered for optional enzymes." : "No value is generated until the optional enzyme is configured.",
            tone: riskTone(false, !active),
          },
          {
            label: "Net AUCR",
            result: active ? fmtTxtNum(net) : "---",
            formula: "AUCR = 1 / ((A × 1 × 1) × fm + (1 - fm))",
            inputs: active ? `1 / ((${fmtExpr(A)} × 1 × 1) × ${fmtExpr(fm)} + (1 - ${fmtExpr(fm)}))` : "Optional fm value is ignored until the row is configured.",
            rule: active ? `${formatBoolRisk(netRisk)}; report flags AUCR ≥ 1.25 or ≤ 0.8.` : "Configure enzyme inputs before interpretation.",
            tone: riskTone(netRisk, !active),
          },
        ],
      };
    });
  }, [ihUnbound, state.optionalInputs, state.systemOptionalInputs]);

  const transporterCards = useMemo(() => {
    const sharedValues = {
      cmaxUnbound,
      igut,
      iinMaxTotal,
      iinMaxUnbound,
    };

    const standard = defaultTr.map((transporter, index) => {
      const inputs = state.trInputs[index + 1];
      const ki = inputs?.ki ?? calcChengPrusoffKi(inputs?.ic50 ?? NaN, inputs?.s ?? NaN, inputs?.km ?? NaN);
      const I = getTransporterConcentration(transporter.site, route, sharedValues);
      const ratio = calcTransporterRatio(I, ki);
      const threshold = getTransporterThreshold(transporter.transporter, route);
      const risk = !Number.isNaN(ratio) && ratio >= threshold;
      const kiDerivedFromIc50 = inputs?.ki === null || inputs?.ki === undefined;

      return {
        title: transporter.transporter,
        subtitle: `Standard transporter using ${getTransporterLabel(transporter.site, route)} as inhibitor concentration`,
        accent: risk ? ("amber" as const) : ("emerald" as const),
        metrics: [
          {
            label: "Ki,u",
            result: fmtTxtNum(ki),
            formula: kiDerivedFromIc50 ? "Ki = IC50 / (1 + S / Km)" : "Ki = direct user-entered Ki,u",
            inputs: kiDerivedFromIc50
              ? `${fmtExpr(inputs?.ic50)} / (1 + ${fmtExpr(inputs?.s)} / ${fmtExpr(inputs?.km)})`
              : `Direct Ki,u = ${fmtExpr(inputs?.ki)}`,
            rule: kiDerivedFromIc50 ? "Cheng-Prusoff back-calculation is used when Ki is blank." : "Direct Ki overrides the Cheng-Prusoff estimate.",
          },
          {
            label: "[I]/Ki,u",
            result: fmtTxtNum(ratio),
            formula: `[I]/Ki = ${getTransporterLabel(transporter.site, route)} / Ki,u`,
            inputs: `${getTransporterLabel(transporter.site, route)}=${fmtExpr(I)}; Ki,u=${fmtExpr(ki)}`,
            rule: `${formatBoolRisk(risk)}; threshold is ≥ ${fmtExpr(threshold)}.`,
            note: transporter.site === "gut" && isIv ? "IV route uses Cmax,u in place of Igut for gut-site transporters." : undefined,
            tone: riskTone(risk),
          },
        ],
      };
    });

    const optional = defaultOptionalTr.map((transporter) => {
      const inputs = state.optionalTrInputs[transporter.idx];
      const active =
        Boolean(inputs?.name?.trim()) ||
        [inputs?.ki, inputs?.ic50, inputs?.s, inputs?.km].some((value) => value !== null && value !== undefined);
      const site = inputs?.site ?? transporter.site;
      const ki = inputs?.ki ?? calcChengPrusoffKi(inputs?.ic50 ?? NaN, inputs?.s ?? NaN, inputs?.km ?? NaN);
      const I = getTransporterConcentration(site, route, sharedValues);
      const ratio = active ? calcTransporterRatio(I, ki) : NaN;
      const threshold = inputs?.threshold ?? transporter.threshold;
      const thresholdMissing = Number.isNaN(threshold);
      const risk = active && !thresholdMissing && !Number.isNaN(ratio) && ratio >= threshold;
      const name = inputs?.name?.trim() || `Optional transporter ${transporter.idx}`;
      const kiDerivedFromIc50 = inputs?.ki === null || inputs?.ki === undefined;

      return {
        title: name,
        subtitle: active ? `Optional transporter using ${getTransporterLabel(site, route)}` : "Optional transporter not configured",
        accent: active ? ("blue" as const) : ("amber" as const),
        metrics: [
          {
            label: "Ki,u",
            result: active ? fmtTxtNum(ki) : "---",
            formula: kiDerivedFromIc50 ? "Ki = IC50 / (1 + S / Km)" : "Ki = direct user-entered Ki,u",
            inputs: active
              ? kiDerivedFromIc50
                ? `${fmtExpr(inputs?.ic50)} / (1 + ${fmtExpr(inputs?.s)} / ${fmtExpr(inputs?.km)})`
                : `Direct Ki,u = ${fmtExpr(inputs?.ki)}`
              : "Configure name and inhibition inputs to enable this output.",
            rule: active ? "Direct Ki overrides Cheng-Prusoff when provided." : "No output is generated until the transporter is configured.",
            tone: riskTone(false, !active),
          },
          {
            label: "[I]/Ki,u",
            result: active ? fmtTxtNum(ratio) : "---",
            formula: `[I]/Ki = ${getTransporterLabel(site, route)} / Ki,u`,
            inputs: active ? `${getTransporterLabel(site, route)}=${fmtExpr(I)}; Ki,u=${fmtExpr(ki)}` : "Site-specific concentration is only applied after configuration.",
            rule: !active
              ? "Configure transporter inputs before interpretation."
              : thresholdMissing
                ? "Threshold missing; ratio is shown but no risk flag is applied."
                : `${formatBoolRisk(risk)}; threshold is ≥ ${fmtExpr(threshold)}.`,
            tone: riskTone(risk, !active || thresholdMissing),
          },
        ],
      };
    });

    return { standard, optional };
  }, [cmaxUnbound, igut, iinMaxTotal, iinMaxUnbound, isIv, route, state.optionalTrInputs, state.trInputs]);

  const strongestTdiMetric = useMemo(() => {
    const cyp3a4Entries = defaultCyp
      .filter((enzyme) => /CYP3A4/.test(enzyme.enzyme))
      .map((enzyme) => {
        const inputs = state.cypInputs[enzyme.idBase];
        const KI = inputs?.KI_uM ?? NaN;
        const kinact = inputs?.kinact_min ?? NaN;
        const score = !Number.isNaN(kinact) && !Number.isNaN(KI) && KI > 0 ? kinact / KI : NaN;
        return { enzyme: enzyme.enzyme, KI, kinact, score };
      })
      .filter((entry) => !Number.isNaN(entry.score))
      .sort((left, right) => right.score - left.score);

    const strongest = cyp3a4Entries[0];
    return strongest
      ? {
          label: "CYP3A4 strongest TDI selector",
          result: strongest.enzyme,
          formula: "Select the CYP3A4 substrate with the highest kinact / KI ratio",
          inputs: cyp3a4Entries.map((entry) => `${entry.enzyme}: ${fmtExpr(entry.kinact)} / ${fmtExpr(entry.KI)} = ${fmtExpr(entry.score, 5)}`).join(" | "),
          rule: "This matches the Intermediate Values summary widget.",
        }
      : null;
  }, [state.cypInputs]);

  return (
    <div className="grid grid-cols-[220px_1fr] gap-5 items-start p-5 w-full h-full min-h-0 min-w-0 overflow-hidden box-border">
      <LeftPanel />
      <div className="w-full h-full min-w-0 min-h-0 overflow-auto pr-1 pb-8">
        <div className="min-w-[1180px] space-y-8">
          <section className="relative overflow-hidden rounded-[28px] border border-[#dbeafe] bg-[radial-gradient(circle_at_top_left,_rgba(191,219,254,0.9),_rgba(239,246,255,0.92)_38%,_rgba(248,250,252,0.98)_100%)] p-7 shadow-[0_20px_60px_rgba(30,64,175,0.12)]">
            <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-[#bfdbfe]/45 blur-3xl" />
            <div className="absolute bottom-0 left-[34%] h-24 w-24 rounded-full bg-[#93c5fd]/40 blur-3xl" />
            <div className="relative space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-3xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#bfdbfe] bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
                    <BookOpenText className="h-3.5 w-3.5" />
                    Support Information
                  </div>
                  <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#0f172a]">
                    每个输出值的计算路径都在这里。
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-[#475569]">
                    这个模块会跟随当前输入实时更新，逐项说明公式、代入值、阈值和特殊规则。页面里的所有说明都复用当前 assessment
                    页面正在使用的计算链，不是额外手写的静态备注。
                  </p>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#0f172a]">
                    <Calculator className="h-4 w-4 text-[#2563eb]" />
                    Current context
                  </div>
                  <div className="mt-3 space-y-2 text-xs text-[#475569]">
                    <div className="flex items-center gap-2">
                      <ChevronRight className="h-3.5 w-3.5 text-[#60a5fa]" />
                      Drug: <span className="font-semibold text-[#0f172a]">{state.drugName || "---"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ChevronRight className="h-3.5 w-3.5 text-[#60a5fa]" />
                      Route: <span className="font-semibold text-[#0f172a]">{state.route || "---"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ChevronRight className="h-3.5 w-3.5 text-[#60a5fa]" />
                      Formula: <span className="font-semibold text-[#0f172a]">{state.formulaInput || "---"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SummaryStat label="MW" value={fmtTxtNum(state.mwValue, 2)} detail="Current molecular weight in g/mol" />
                <SummaryStat label="Cmax,u" value={fmtTxtNum(cmaxUnbound)} detail="Primary unbound systemic concentration" />
                <SummaryStat label="Ih,u" value={fmtTxtNum(ihUnbound)} detail="Liver-site inhibitor concentration for CYP net effect" />
                <SummaryStat label="Igut" value={fmtTxtNum(igut)} detail={isIv ? "Not used for IV route" : "Gut-site concentration for CYP3A4 and gut transporters"} />
              </div>

              <div className="rounded-2xl border border-[#dbeafe] bg-white/75 px-4 py-3 text-xs text-[#475569] backdrop-blur-sm">
                <div className="flex items-start gap-2">
                  <CircleAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#2563eb]" />
                  <span>
                    `---` means the required upstream input is missing. `N/M` means that output is intentionally not assessed by the current model.
                    Tier 1 CYP `R3` now uses <span className="font-semibold text-[#0f172a]">10 × Cmax,total</span> consistently with the calculation
                    library and the explanatory formula shown below.
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section>
            <SectionTitle>PK And Intermediate Values</SectionTitle>
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.95fr)]">
              <CalculationCard
                title="PK conversion and site concentration chain"
                subtitle="These values feed both CYP and transporter models."
                accent="blue"
                metrics={pkSupportMetrics}
              />
              <CalculationCard
                title="Intermediate summary logic"
                subtitle="Items already shown on the Intermediate Values page."
                accent="amber"
                metrics={[
                  {
                    label: "Qent and Qh usage",
                    result: `Qent=${fmtTxtNum(qent, 0)} / Qh=${fmtTxtNum(qh, 0)}`,
                    formula: "Qent is used only by Ient; Qh is used by Iin,max and Ih calculations.",
                    inputs: `Qent=${fmtExpr(qent, 0)} mL/min; Qh=${fmtExpr(qh, 0)} mL/min`,
                    rule: "Both values come from System Parameters and update the support page live.",
                  },
                  {
                    label: "Blood-to-plasma ratio (Rb/BP)",
                    result: fmtTxtNum(state.bp),
                    formula: "Rb is applied only in Ih,total = Cmax,total + Fa × Fg × ka × Dose(μmol) / (Qh × Rb)",
                    inputs: `Rb = ${fmtExpr(state.bp)}`,
                    rule: "If Rb is unavailable, Ih outputs become unavailable.",
                  },
                  strongestTdiMetric ?? {
                    label: "CYP3A4 strongest TDI selector",
                    result: "---",
                    formula: "Select the CYP3A4 substrate with the highest kinact / KI ratio",
                    inputs: "No valid kinact/KI pair is currently available.",
                    rule: "The Intermediate Values widget stays blank until at least one valid pair exists.",
                  },
                ]}
              />
            </div>
          </section>

          <section>
            <SectionTitle>CYP Tier 1 Output Logic</SectionTitle>
            <SubsectionTitle>Standard CYP enzymes</SubsectionTitle>
            <div className="grid gap-5 2xl:grid-cols-2">
              {tier1Cards.map((card) => (
                <CalculationCard
                  key={card.title}
                  title={card.title}
                  subtitle={card.subtitle}
                  accent={card.accent}
                  metrics={card.metrics}
                />
              ))}
            </div>

            <SubsectionTitle className="mt-8">Optional CYP enzymes</SubsectionTitle>
            <div className="grid gap-5 xl:grid-cols-3">
              {optionalTier1Cards.map((card) => (
                <CalculationCard
                  key={card.title}
                  title={card.title}
                  subtitle={card.subtitle}
                  accent={card.accent}
                  metrics={card.metrics}
                />
              ))}
            </div>
          </section>

          <section>
            <SectionTitle>CYP Tier 2 And Net Effect</SectionTitle>
            <SubsectionTitle>Base liver enzymes</SubsectionTitle>
            <div className="grid gap-5 2xl:grid-cols-2">
              {tier2BaseCards.map((card) => (
                <CalculationCard
                  key={card.title}
                  title={card.title}
                  subtitle={card.subtitle}
                  accent={card.accent}
                  metrics={card.metrics}
                />
              ))}
            </div>

            <SubsectionTitle className="mt-8">CYP3A4 substrate-specific combined AUCR</SubsectionTitle>
            <div className="grid gap-5 xl:grid-cols-2">
              {cyp3a4Tier2Cards.map((card) => (
                <CalculationCard
                  key={card.title}
                  title={card.title}
                  subtitle={card.subtitle}
                  accent={card.accent}
                  metrics={card.metrics}
                />
              ))}
            </div>

            <SubsectionTitle className="mt-8">Optional Tier 2 enzymes</SubsectionTitle>
            <div className="grid gap-5 xl:grid-cols-3">
              {optionalTier2Cards.map((card) => (
                <CalculationCard
                  key={card.title}
                  title={card.title}
                  subtitle={card.subtitle}
                  accent={card.accent}
                  metrics={card.metrics}
                />
              ))}
            </div>
          </section>

          <section>
            <SectionTitle>Transporter Output Logic</SectionTitle>
            <div className="rounded-2xl border border-[#dbeafe] bg-[#f8fbff] p-4 text-xs text-[#475569] shadow-sm">
              <div className="flex items-start gap-2">
                <Sigma className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#2563eb]" />
                <span>
                  Standard transporters derive risk from a site-specific inhibitor concentration divided by Ki,u. If direct Ki is blank,
                  the page falls back to Cheng-Prusoff: <span className="font-mono text-[#0f172a]">Ki = IC50 / (1 + S / Km)</span>.
                </span>
              </div>
            </div>

            <SubsectionTitle className="mt-6">Standard transporters</SubsectionTitle>
            <div className="grid gap-5 2xl:grid-cols-2">
              {transporterCards.standard.map((card) => (
                <CalculationCard
                  key={card.title}
                  title={card.title}
                  subtitle={card.subtitle}
                  accent={card.accent}
                  metrics={card.metrics}
                />
              ))}
            </div>

            <SubsectionTitle className="mt-8">Optional transporters</SubsectionTitle>
            <div className="grid gap-5 xl:grid-cols-3">
              {transporterCards.optional.map((card) => (
                <CalculationCard
                  key={card.title}
                  title={card.title}
                  subtitle={card.subtitle}
                  accent={card.accent}
                  metrics={card.metrics}
                />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
