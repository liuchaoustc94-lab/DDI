import { useMemo } from "react";
import { useDDI } from "@/hooks/useDDIStore";
import { LeftPanel } from "./LeftPanel";
import {
  fmtTxtNum, calcIEntUM, calcIhTotalUM, calcIhUnboundUM,
  calcChengPrusoffKi, calcReversibleFactor, calcTdiFactor, calcInductionFactor,
  getKdegH, getKdegG,
} from "@/lib/calculations";
import { defaultCyp, defaultOptional, defaultOptionalTr, defaultTr } from "@/lib/data";
import { SectionTitle, SubsectionTitle } from "./FieldComponents";

export function IntermediateTab() {
  const { state, pkVals } = useDDI();
  const route = state.route;
  const mw = state.mwValue;

  const doseUmol = (!!state.doseMg && !Number.isNaN(mw) && mw > 0) ? (state.doseMg * 1000 / mw) : NaN;
  const cmaxTotal = pkVals.cmaxTotalUM;
  const cmaxUnbound = pkVals.cmaxUnboundUM;
  const igut = pkVals.igutUM;

  const qent = state.systemCypInputs["Qent"]?.value ?? 300;
  const qh = state.systemCypInputs["Qh"]?.value ?? 1617;
  const rb = state.bp ?? NaN;

  const ient = calcIEntUM(state.doseMg ?? NaN, mw, state.kaMin ?? NaN, state.fa ?? NaN, qent, route);
  const ihTotal = calcIhTotalUM(cmaxTotal, state.doseMg ?? NaN, mw, state.kaMin ?? NaN, state.fa ?? NaN, state.fg ?? NaN, qh, rb, route);
  const ihUnbound = calcIhUnboundUM(cmaxTotal, state.doseMg ?? NaN, mw, state.kaMin ?? NaN, state.fa ?? NaN, state.fg ?? NaN, qh, rb, state.fuP ?? NaN, route);

  // CYP DDI data using proper A/B/C factors
  const cypDdiData = useMemo(() => {
    const systemCypValues: Record<string, number> = {};
    for (const [k, v] of Object.entries(state.systemCypInputs)) {
      systemCypValues[k] = v.value ?? 0;
    }
    return defaultCyp.map((e) => {
      const inputs = state.cypInputs[e.idBase];
      const ki = inputs?.Ki_uM ?? NaN;
      const KI = inputs?.KI_uM ?? NaN;
      const kinact = inputs?.kinact_min ?? NaN;
      const Emax = inputs?.Emax ?? NaN;
      const EC50 = inputs?.EC50_uM ?? NaN;
      const dScalar = inputs?.d_scalar ?? 1;

      // Liver factors (Net Effect Model)
      const kdegH = getKdegH(e.idBase, systemCypValues);
      const Ah = calcReversibleFactor(ihUnbound, ki);
      const Bh = calcTdiFactor(ihUnbound, KI, kinact, kdegH);
      const Ch = /CYP2A6|CYP2D6|CYP2E1/.test(e.enzyme)
        ? 1
        : calcInductionFactor(ihUnbound, Emax, EC50, dScalar as number);

      const comment = /CYP2A6/.test(e.enzyme) ? "Induction not assessed for CYP2A6"
        : /CYP2D6/.test(e.enzyme) ? "Induction not assessed for CYP2D6"
        : /CYP2E1/.test(e.enzyme) ? "Induction not assessed for CYP2E1" : "";

      // Gut factors (CYP3A4 only)
      const kdegG = getKdegG(systemCypValues);
      const Ag = calcReversibleFactor(ient, ki);
      const Bg = calcTdiFactor(ient, KI, kinact, kdegG);
      const Cg = calcInductionFactor(ient, Emax, EC50, dScalar as number);

      return { enzyme: e.enzyme, idBase: e.idBase, Ah, Bh, Ch, comment, Ag, Bg, Cg, isCyp3A4: /CYP3A4/.test(e.enzyme) };
    });
  }, [state.cypInputs, state.systemCypInputs, ient, ihUnbound]);

  const optionalCypRows = useMemo(() => {
    return defaultOptional.map((opt) => {
      const inputs = state.optionalInputs[opt.idx];
      const active = Boolean(inputs?.name?.trim()) || inputs?.ki !== null;
      return {
        idx: opt.idx,
        enzyme: inputs?.name?.trim() || "---",
        Ah: active ? calcReversibleFactor(ihUnbound, inputs?.ki ?? NaN) : NaN,
        Bh: 1,
        Ch: 1,
        comment: "TDI and induction not assessed",
      };
    });
  }, [state.optionalInputs, ihUnbound]);

  const strongestTdi = useMemo(() => {
    const cyp3A4Entries = defaultCyp
      .filter(e => /CYP3A4/.test(e.enzyme))
      .map(e => {
        const inputs = state.cypInputs[e.idBase];
        const KI = inputs?.KI_uM ?? NaN;
        const kinact = inputs?.kinact_min ?? NaN;
        return { enzyme: e.enzyme, kinact, KI, tdiScore: (!Number.isNaN(kinact) && !Number.isNaN(KI) && KI > 0) ? kinact / KI : NaN };
      })
      .filter(e => !Number.isNaN(e.tdiScore))
      .sort((a, b) => b.tdiScore - a.tdiScore);
    return cyp3A4Entries[0] ?? { enzyme: "---", kinact: NaN, KI: NaN };
  }, [state.cypInputs]);

  const trDdiData = useMemo(() => {
    return defaultTr.map((t, i) => {
      const inputs = state.trInputs[i + 1];
      const ki = inputs?.ki ?? calcChengPrusoffKi(inputs?.ic50 ?? NaN, inputs?.s ?? NaN, inputs?.km ?? NaN);
      return { transporter: t.transporter, ki };
    });
  }, [state.trInputs]);

  const optionalTrData = useMemo(() => {
    return defaultOptionalTr.map((opt) => {
      const inputs = state.optionalTrInputs[opt.idx];
      const ki = inputs?.ki ?? calcChengPrusoffKi(inputs?.ic50 ?? NaN, inputs?.s ?? NaN, inputs?.km ?? NaN);
      return {
        idx: opt.idx,
        transporter: inputs?.name?.trim() || "---",
        ki,
      };
    });
  }, [state.optionalTrInputs]);

  const liverRows = cypDdiData.filter(r => !r.isCyp3A4);
  const gutRows = cypDdiData.filter(r => r.isCyp3A4);
  const liverFormulaRowspan = liverRows.length + 1 + optionalCypRows.length;

  return (
    <div className="grid grid-cols-[220px_1fr] gap-5 items-start p-5 w-full h-full min-h-0 min-w-0 overflow-hidden box-border">
      <LeftPanel />
      <div className="w-full h-full min-w-0 min-h-0 overflow-auto pr-1 pb-8">
        <div className="min-w-[1880px] space-y-8">

          {/* ─── Calculated Parameters ─────────────────────────── */}
          <div>
            <SectionTitle>Calculated Parameters</SectionTitle>
            <div className="bg-white rounded-xl shadow-sm border border-[#e2e8f0] overflow-hidden">
              <table className="border-collapse w-full">
                <thead>
                  <tr className="bg-[#f8fafc]">
                    <th className="px-4 py-3 text-xs font-semibold text-[#475569] text-left border-b border-[#e2e8f0]">Parameter</th>
                    <th className="px-4 py-3 text-xs font-semibold text-[#475569] text-center border-b border-[#e2e8f0]">Value</th>
                    <th className="px-4 py-3 text-xs font-semibold text-[#475569] text-left border-b border-[#e2e8f0]">Equation (ICH M12)</th>
                    <th className="px-4 py-3 text-xs font-semibold text-[#475569] text-left border-b border-[#e2e8f0]">Comments</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td colSpan={4} className="px-4 py-2 text-xs font-bold text-[#3b82f6] bg-[#eff6ff] border-b border-[#e2e8f0]">Drug dose and concentrations</td></tr>
                  {[
                    { label: "Dose (&mu;mol)", val: doseUmol, eq: "= Dose (mg) &divide; MW (mg/mmol) &times; <span class='text-[#ef4444] font-bold'>1000</span>", cm: route === "IV" ? "N/A for i.v." : "" },
                    { label: "C<sub>max,total</sub> (&mu;M)", val: cmaxTotal, eq: "= Cmax<sub>total</sub> (ng/mL) &divide; MW (mg/mmol)", cm: "" },
                    { label: "C<sub>max,unbound</sub> (&mu;M)", val: cmaxUnbound, eq: "= Cmax<sub>total</sub> (&mu;M) &times; f<sub>u,p</sub>", cm: "" },
                    { label: "[I]<sub>gut</sub> (&mu;M)", val: igut, eq: "= Dose (&mu;mol) &divide; <span class='text-[#ef4444] font-bold'>0.25</span> L", cm: route === "IV" ? "N/A for i.v." : "" },
                    { label: "[I]<sub>ent</sub> (&mu;M)", val: ient, eq: "= k<sub>a</sub> &times; F<sub>a</sub> &times; Dose (&mu;mol) &divide; Q<sub>ent</sub> &times; <span class='text-[#ef4444] font-bold'>1000</span>", cm: route === "IV" ? "N/A for i.v." : "" },
                    { label: "[I]<sub>h,u</sub> (&mu;M)", val: ihUnbound, eq: "= f<sub>u,p</sub> &times; (Cmax + F<sub>a</sub>&times;F<sub>g</sub>&times;k<sub>a</sub>&times;Dose/Q<sub>h</sub>/Rb &times; <span class='text-[#ef4444] font-bold'>1000</span>)", cm: route === "IV" ? "=Cmax,u" : "" },
                    { label: "[I]<sub>h</sub> (&mu;M)", val: ihTotal, eq: "= Cmax + F<sub>a</sub>&times;F<sub>g</sub>&times;k<sub>a</sub>&times;Dose/Q<sub>h</sub>/Rb &times; <span class='text-[#ef4444] font-bold'>1000</span>", cm: route === "IV" ? "=Cmax" : "" },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-[#f8fafc] transition-colors">
                      <td className="px-4 py-2.5 text-[13px] text-[#334155] border-b border-[#f1f5f9]" dangerouslySetInnerHTML={{ __html: row.label }} />
                      <td className="px-4 py-2.5 text-[13px] text-center font-mono text-[#0f172a] font-semibold border-b border-[#f1f5f9]">{fmtTxtNum(row.val)}</td>
                      <td className="px-4 py-2.5 text-[13px] font-serif text-[#475569] border-b border-[#f1f5f9]" dangerouslySetInnerHTML={{ __html: row.eq }} />
                      <td className="px-4 py-2.5 text-[12px] font-mono text-[#94a3b8] border-b border-[#f1f5f9]">{row.cm}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ─── CYP DDI A/B/C Factors ─────────────────────────── */}
          <div>
            <SubsectionTitle>CYP DDI &mdash; Net Effect Model Factors (A / B / C)</SubsectionTitle>
            <div className="bg-white rounded-xl shadow-sm border border-[#e2e8f0] overflow-hidden">
              <table className="border-collapse w-full table-fixed">
                <thead>
                  <tr className="bg-gradient-to-r from-[#f8fafc] to-[#f1f5f9]">
                    <th colSpan={4} className="px-4 py-3 text-xs font-bold text-[#475569] text-left border-b border-[#e2e8f0]">Net Effect AUCR Equation</th>
                    <th colSpan={6} className="px-4 py-3 text-sm font-serif font-medium text-[#0f172a] border-b border-[#e2e8f0]" dangerouslySetInnerHTML={{ __html: netEffectHtml }} />
                    <th className="px-4 py-3 text-[11px] font-semibold text-[#94a3b8] border-b border-[#e2e8f0]">ICH M12 Sec 7.5</th>
                  </tr>
                  <tr className="bg-[#f8fafc]">
                    <th className="px-4 py-2 text-[11px] font-semibold text-[#475569] text-left border-b border-[#e2e8f0]" style={{ width: 240 }} />
                    <th className="px-2 py-2 text-[11px] font-bold text-[#3b82f6] text-center border-b border-[#e2e8f0]" style={{ width: 84 }} dangerouslySetInnerHTML={{ __html: "A<sub>h</sub>" }} />
                    <th className="px-2 py-2 text-[11px] font-bold text-[#3b82f6] text-center border-b border-[#e2e8f0]" style={{ width: 84 }} dangerouslySetInnerHTML={{ __html: "B<sub>h</sub>" }} />
                    <th className="px-2 py-2 text-[11px] font-bold text-[#3b82f6] text-center border-b border-[#e2e8f0]" style={{ width: 84 }} dangerouslySetInnerHTML={{ __html: "C<sub>h</sub>" }} />
                    <th colSpan={6} className="px-4 py-2 text-xs font-bold text-[#059669] border-b border-[#e2e8f0]">Liver:</th>
                    <th className="border-b border-[#e2e8f0]" />
                  </tr>
                </thead>
                <tbody>
                  {liverRows.map((r, i) => (
                    <tr key={r.idBase} className="hover:bg-[#f8fafc] transition-colors">
                      <td className="px-4 py-2.5 text-[13px] font-medium text-[#334155] border-b border-[#f1f5f9]" style={{ width: 240 }}>{r.enzyme}</td>
                      <td className="px-2 py-2.5 text-[13px] text-center font-mono text-[#0f172a] border-b border-[#f1f5f9]" style={{ width: 84 }}>{fmtTxtNum(r.Ah)}</td>
                      <td className="px-2 py-2.5 text-[13px] text-center font-mono text-[#0f172a] border-b border-[#f1f5f9]" style={{ width: 84 }}>{fmtTxtNum(r.Bh)}</td>
                      <td className={`px-2 py-2.5 text-[13px] text-center font-mono border-b border-[#f1f5f9] ${/CYP2A6|CYP2D6|CYP2E1/.test(r.enzyme) ? "bg-[#fef3c7] text-[#92400e] italic" : "text-[#0f172a]"}`} style={{ width: 84 }}>{fmtTxtNum(r.Ch)}</td>
                      {i === 0 && liverFormulaCells(liverFormulaRowspan, gutRows.length)}
                      <td className="px-4 py-2.5 text-[12px] text-[#64748b] border-b border-[#f1f5f9]" style={{ width: 520 }}>{r.comment}</td>
                    </tr>
                  ))}
                  <tr className="bg-[#f8fafc]"><td colSpan={4} className="px-4 py-2 text-[13px] font-semibold text-[#94a3b8] border-b border-[#e2e8f0]">Optional Enzymes</td><td colSpan={7} className="border-b border-[#e2e8f0]" /></tr>
                  {optionalCypRows.map((r) => (
                    <tr key={`opt-${r.idx}`} className="hover:bg-[#f8fafc]">
                      <td className="px-4 py-2 text-[13px] text-[#94a3b8] italic border-b border-[#f1f5f9]" style={{ width: 240 }}>{r.enzyme}</td>
                      <td className="px-2 py-2 text-[13px] text-center font-mono text-[#0f172a] border-b border-[#f1f5f9]" style={{ width: 84 }}>{fmtTxtNum(r.Ah)}</td>
                      <td className="px-2 py-2 text-[13px] text-center font-mono bg-[#fef3c7] text-[#92400e] border-b border-[#f1f5f9]" style={{ width: 84 }}>1.000</td>
                      <td className="px-2 py-2 text-[13px] text-center font-mono bg-[#fef3c7] text-[#92400e] border-b border-[#f1f5f9]" style={{ width: 84 }}>1.000</td>
                      <td colSpan={6} className="border-b border-[#f1f5f9]" /><td className="px-4 py-2 text-[12px] text-[#94a3b8] border-b border-[#f1f5f9]" style={{ width: 520 }}>{r.comment}</td>
                    </tr>
                  ))}
                  <tr className="bg-[#f8fafc]"><td colSpan={4} className="border-b border-[#e2e8f0]" /><td colSpan={6} className="px-4 py-2 text-xs font-bold text-[#d97706] border-b border-[#e2e8f0]">Gut:</td><td className="border-b border-[#e2e8f0]" /></tr>
                  <tr className="bg-[#f8fafc]">
                    <td className="border-b border-[#e2e8f0]" /><td className="px-2 py-2 text-[11px] font-bold text-[#d97706] text-center border-b border-[#e2e8f0]" style={{ width: 84 }} dangerouslySetInnerHTML={{ __html: "A<sub>g</sub>" }} />
                    <td className="px-2 py-2 text-[11px] font-bold text-[#d97706] text-center border-b border-[#e2e8f0]" style={{ width: 84 }} dangerouslySetInnerHTML={{ __html: "B<sub>g</sub>" }} />
                    <td className="px-2 py-2 text-[11px] font-bold text-[#d97706] text-center border-b border-[#e2e8f0]" style={{ width: 84 }} dangerouslySetInnerHTML={{ __html: "C<sub>g</sub>" }} />
                    <td colSpan={2} className="px-3 py-2 text-[11px] font-semibold text-[#475569] border-b border-[#e2e8f0]">Rev.</td>
                    <td colSpan={2} className="px-3 py-2 text-[11px] font-semibold text-[#475569] border-b border-[#e2e8f0]">TDI</td>
                    <td colSpan={2} className="px-3 py-2 text-[11px] font-semibold text-[#475569] border-b border-[#e2e8f0]">Ind.</td>
                    <td className="border-b border-[#e2e8f0]" />
                  </tr>
                  {gutRows.map((r, j) => (
                    <tr key={r.idBase} className="hover:bg-[#f8fafc] transition-colors">
                      <td className="px-4 py-2.5 text-[13px] font-medium text-[#334155] border-b border-[#f1f5f9]" style={{ width: 240 }}>{r.enzyme}</td>
                      <td className="px-2 py-2.5 text-[13px] text-center font-mono text-[#0f172a] border-b border-[#f1f5f9]" style={{ width: 84 }}>{fmtTxtNum(r.Ag)}</td>
                      <td className="px-2 py-2.5 text-[13px] text-center font-mono text-[#0f172a] border-b border-[#f1f5f9]" style={{ width: 84 }}>{fmtTxtNum(r.Bg)}</td>
                      <td className="px-2 py-2.5 text-[13px] text-center font-mono text-[#0f172a] border-b border-[#f1f5f9]" style={{ width: 84 }}>{fmtTxtNum(r.Cg)}</td>
                      {j === 0 && gutFormulaCells(gutRows.length)}
                      <td className="border-b border-[#f1f5f9]" />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ─── CYP3A4 Strongest TDI ──────────────────────────── */}
          <div>
            <SubsectionTitle>CYP3A4 Strongest TDI</SubsectionTitle>
            <div className="flex items-center gap-4">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-[#e2e8f0] inline-flex items-center gap-6">
                <div>
                  <div className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-1">Selected</div>
                  <div className="text-sm font-bold text-[#0f172a]">{strongestTdi.enzyme}</div>
                </div>
                <div className="w-px h-8 bg-[#e2e8f0]" />
                <div className="text-center">
                  <div className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-1" dangerouslySetInnerHTML={{ __html: "k<sub>inact</sub>" }} />
                  <div className="text-sm font-mono font-bold text-[#0f172a]">{fmtTxtNum(strongestTdi.kinact)}</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-1">KI,u</div>
                  <div className="text-sm font-mono font-bold text-[#0f172a]">{fmtTxtNum(strongestTdi.KI)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Transporter DDI ───────────────────────────────── */}
          <div>
            <SubsectionTitle>Transporter DDI &mdash; Cheng-Prusoff Ki</SubsectionTitle>
            <div className="bg-white rounded-xl shadow-sm border border-[#e2e8f0] overflow-hidden" style={{ maxWidth: 980 }}>
              <table className="border-collapse w-full">
                <thead>
                  <tr className="bg-[#f8fafc]">
                    <th className="px-4 py-3 text-xs font-semibold text-[#475569] text-left border-b border-[#e2e8f0]">Transporter</th>
                    <th className="px-4 py-3 text-xs font-semibold text-[#475569] text-left border-b border-[#e2e8f0]">Calculated Ki</th>
                    <th className="px-4 py-3 text-xs font-semibold text-[#475569] text-center border-b border-[#e2e8f0]">Value (&mu;M)</th>
                    <th className="px-4 py-3 text-xs font-semibold text-[#475569] text-left border-b border-[#e2e8f0]">Equation</th>
                    <th className="px-4 py-3 text-xs font-semibold text-[#475569] text-left border-b border-[#e2e8f0]">Method</th>
                  </tr>
                </thead>
                <tbody>
                  {trDdiData.map((t, i) => (
                    <tr key={i} className="hover:bg-[#f8fafc] transition-colors">
                      <td className="px-4 py-2.5 text-[13px] font-medium text-[#334155] border-b border-[#f1f5f9]">{t.transporter}</td>
                      <td className="px-4 py-2.5 text-[13px] text-[#64748b] border-b border-[#f1f5f9]">Ki,u</td>
                      <td className="px-4 py-2.5 text-[13px] text-center font-mono font-semibold text-[#0f172a] border-b border-[#f1f5f9]">{fmtTxtNum(t.ki)}</td>
                      <td className="px-4 py-2.5 text-[13px] font-serif text-[#475569] border-b border-[#f1f5f9]" dangerouslySetInnerHTML={{ __html: "K<sub>i</sub> = IC<sub>50</sub> / (1 + [S] / K<sub>m</sub>)" }} />
                      <td className="px-4 py-2.5 text-[12px] text-[#94a3b8] border-b border-[#f1f5f9]">Cheng-Prusoff</td>
                    </tr>
                  ))}
                  <tr><td colSpan={5} className="px-4 py-2 text-[13px] font-semibold text-[#94a3b8] bg-[#f8fafc] border-b border-[#e2e8f0]">Optional Transporters</td></tr>
                  {optionalTrData.map((t) => (
                    <tr key={`opt-${t.idx}`} className="hover:bg-[#f8fafc]">
                      <td className="px-4 py-2 text-[13px] text-[#94a3b8] italic border-b border-[#f1f5f9]">{t.transporter}</td>
                      <td className="px-4 py-2 text-[13px] text-[#94a3b8] border-b border-[#f1f5f9]">Ki,u</td>
                      <td className="px-4 py-2 text-[13px] text-center font-mono text-[#0f172a] border-b border-[#f1f5f9]">{fmtTxtNum(t.ki)}</td>
                      <td className="px-4 py-2 text-[13px] font-serif text-[#94a3b8] border-b border-[#f1f5f9]" dangerouslySetInnerHTML={{ __html: "K<sub>i</sub> = IC<sub>50</sub> / (1 + [S] / K<sub>m</sub>)" }} />
                      <td className="px-4 py-2 text-[12px] text-[#94a3b8] border-b border-[#f1f5f9]">Cheng-Prusoff</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Formula Helper Components ──────────────────────────────────────────────
function liverFormulaCells(rowspan: number, _gutRowspan: number) {
  return (
    <>
      <td rowSpan={rowspan} className="px-3 py-3 text-sm font-bold text-[#475569] align-top border-l border-[#e2e8f0]">Liver</td>
      <td rowSpan={rowspan} className="px-3 py-3 text-[12px] font-serif text-[#334155] align-top border-l border-[#e2e8f0]">
        <FormulaFraction
          num="1"
          den={<>1 + <FormulaFraction num={<FormulaHtml html="[I]<sub>h</sub>" />} den={<FormulaHtml html="K<sub>i</sub>" />} /></>}
          prefix={<FormulaHtml html="A<sub>h</sub> =" />}
        />
      </td>
      <td rowSpan={rowspan} className="px-3 py-3 text-sm font-bold text-[#475569] align-top border-l border-[#e2e8f0]">TDI</td>
      <td rowSpan={rowspan} className="px-3 py-3 text-[12px] font-serif text-[#334155] align-top border-l border-[#e2e8f0]">
        <FormulaFraction
          num={<FormulaHtml html="k<sub>deg,h</sub>" />}
          den={
            <>
              <FormulaHtml html="k<sub>deg,h</sub> +" />{" "}
              <FormulaFraction
                num={<FormulaHtml html="[I]<sub>h</sub> &times; k<sub>inact</sub>" />}
                den={<FormulaHtml html="[I]<sub>h</sub> + K<sub>I</sub>" />}
              />
            </>
          }
          prefix={<FormulaHtml html="B<sub>h</sub> =" />}
        />
      </td>
      <td rowSpan={rowspan} className="px-3 py-3 text-sm font-bold text-[#475569] align-top border-l border-[#e2e8f0]">Ind.</td>
      <td rowSpan={rowspan} className="px-3 py-3 text-[12px] font-serif text-[#334155] align-top border-l border-[#e2e8f0]">
        <div className="mb-1"><FormulaHtml html="C<sub>h</sub> = 1 +" /></div>
        <FormulaFraction
          num={<FormulaHtml html="d &times; E<sub>max</sub> &times; [I]<sub>h</sub>" />}
          den={<FormulaHtml html="[I]<sub>h</sub> + EC<sub>50</sub>" />}
        />
      </td>
    </>
  );
}

function gutFormulaCells(rowspan: number) {
  return (
    <>
      <td rowSpan={rowspan} colSpan={2} className="px-3 py-3 text-[12px] font-serif text-[#334155] align-top border-l border-[#e2e8f0]">
        <FormulaFraction
          num="1"
          den={<>1 + <FormulaFraction num={<FormulaHtml html="[I]<sub>g</sub>" />} den={<FormulaHtml html="K<sub>i</sub>" />} /></>}
          prefix={<FormulaHtml html="A<sub>g</sub> =" />}
        />
      </td>
      <td rowSpan={rowspan} colSpan={2} className="px-3 py-3 text-[12px] font-serif text-[#334155] align-top border-l border-[#e2e8f0]">
        <FormulaFraction
          num={<FormulaHtml html="k<sub>deg,g</sub>" />}
          den={
            <>
              <FormulaHtml html="k<sub>deg,g</sub> +" />{" "}
              <FormulaFraction
                num={<FormulaHtml html="[I]<sub>g</sub> &times; k<sub>inact</sub>" />}
                den={<FormulaHtml html="[I]<sub>g</sub> + K<sub>I</sub>" />}
              />
            </>
          }
          prefix={<FormulaHtml html="B<sub>g</sub> =" />}
        />
      </td>
      <td rowSpan={rowspan} colSpan={2} className="px-3 py-3 text-[12px] font-serif text-[#334155] align-top border-l border-[#e2e8f0]">
        <div className="mb-1"><FormulaHtml html="C<sub>g</sub> = 1 +" /></div>
        <FormulaFraction
          num={<FormulaHtml html="d &times; E<sub>max</sub> &times; [I]<sub>g</sub>" />}
          den={<FormulaHtml html="[I]<sub>g</sub> + EC<sub>50</sub>" />}
        />
      </td>
    </>
  );
}

function FormulaHtml({ html }: { html: string }) {
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

function FormulaFraction({ num, den, prefix }: { num: React.ReactNode; den: React.ReactNode; prefix?: React.ReactNode }) {
  return (
    <div className="flex max-w-[220px] flex-col gap-1 leading-tight">
      {prefix && <div className="text-[12px] font-semibold text-[#334155]">{prefix}</div>}
      <span className="inline-flex w-fit flex-col items-center text-center">
        <span className="border-b border-[#334155] px-1.5 py-0.5">{num}</span>
        <span className="px-1.5 py-0.5">{den}</span>
      </span>
    </div>
  );
}

const netEffectHtml = `AUCR = ( <span class="text-base">(</span><span class="inline-flex flex-col items-center mx-1"><span class="border-b border-[#0f172a] px-1">1</span><span class="text-[11px] mt-0.5">(A<sub>g</sub>&times;B<sub>g</sub>&times;C<sub>g</sub>)&times;(1-F<sub>g</sub>)+F<sub>g</sub></span></span><span class="text-base">)</span> ) &times; ( <span class="text-base">(</span><span class="inline-flex flex-col items-center mx-1"><span class="border-b border-[#0f172a] px-1">1</span><span class="text-[11px] mt-0.5">(A<sub>h</sub>&times;B<sub>h</sub>&times;C<sub>h</sub>)&times;f<sub>m</sub>+(1-f<sub>m</sub>)</span></span><span class="text-base">)</span> )`;
