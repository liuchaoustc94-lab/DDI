import { useMemo, useState } from "react";
import { useDDI } from "@/hooks/useDDIStore";
import { LeftPanel } from "./LeftPanel";
import { Button } from "@/components/ui/button";
import {
  fmtTxtNum,
  fmtTxtTrim,
  calcChengPrusoffKi,
  calcTransporterRatio,
} from "@/lib/calculations";
import { defaultOptionalTr, defaultTr } from "@/lib/data";
import { downloadCsvReport, formatCsvExportFeedback, type CsvExportFeedback } from "@/lib/export";
import { Truck, AlertTriangle, Download } from "lucide-react";

function getStandardOrgan(transporter: string, route: string): string {
  if (transporter === "P-gp" || transporter === "BCRP") {
    return route === "IV" ? "Systemic *" : "Intestine *";
  }

  const organMap: Record<string, string> = {
    OATP1B1: "Liver",
    OATP1B3: "Liver",
    OAT1: "Kidney",
    OAT3: "Kidney",
    OCT1: "Liver",
    OCT2: "Kidney",
    MRP2: "Kidney, Liver",
    MATE1: "Kidney, Liver",
    MATE2K: "Kidney",
    BSEP: "Liver",
    NTCP: "Liver",
  };

  return organMap[transporter] ?? "Systemic";
}

function getOptionalOrgan(site: string, route: string): string {
  if (site === "gut") return route === "IV" ? "Systemic *" : "Intestine *";
  if (site === "hepatic_inlet" || site === "hepatic_inlet_unbound") return "Liver";
  return "Systemic";
}

function getFormulaHtml(site: string, route: string): string {
  if (site === "gut") {
    return route === "IV"
      ? "C<sub>max,u</sub> / K<sub>i,u</sub>"
      : "[Dose/250 mL] / K<sub>i,u</sub>";
  }
  if (site === "hepatic_inlet") return "I<sub>in,max</sub> / K<sub>i,u</sub>";
  if (site === "hepatic_inlet_unbound") return "I<sub>in,max,u</sub> / K<sub>i,u</sub>";
  return "C<sub>max,u</sub> / K<sub>i,u</sub>";
}

function getFormulaText(site: string, route: string): string {
  if (site === "gut") {
    return route === "IV"
      ? "Cmax,u / Ki,u"
      : "[Dose/250 mL] / Ki,u";
  }
  if (site === "hepatic_inlet") return "Iin,max / Ki,u";
  if (site === "hepatic_inlet_unbound") return "Iin,max,u / Ki,u";
  return "Cmax,u / Ki,u";
}

function getIValue(
  site: string,
  route: string,
  values: {
    cmaxUnbound: number;
    igut: number;
    iinMaxTotal: number;
    iinMaxUnbound: number;
  },
): number {
  if (site === "gut") return route === "IV" ? values.cmaxUnbound : values.igut;
  if (site === "hepatic_inlet") return values.iinMaxTotal;
  if (site === "hepatic_inlet_unbound") return values.iinMaxUnbound;
  return values.cmaxUnbound;
}

function getStandardThreshold(transporter: string, route: string): number {
  if (transporter === "P-gp" || transporter === "BCRP") {
    return route === "IV" ? 0.02 : 10;
  }
  if (transporter === "MATE1" || transporter === "MATE2K" || transporter === "BSEP") {
    return 0.02;
  }
  return 0.1;
}

export function TransporterReportTab() {
  const { state, pkVals } = useDDI();
  const route = state.route;
  const cmaxUnbound = pkVals.cmaxUnboundUM;
  const igut = pkVals.igutUM;
  const iinMaxTotal = pkVals.iinMaxTotalUM;
  const iinMaxUnbound = pkVals.iinMaxUnboundUM;
  const [isExporting, setIsExporting] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<CsvExportFeedback | null>(null);

  const trLabelMap: Record<string, string> = {
    "P-gp": "P-gp",
    BCRP: "BCRP",
    OATP1B1: "OATP1B1",
    OATP1B3: "OATP1B3",
    OAT1: "OAT1",
    OAT3: "OAT3",
    OCT1: "OCT1",
    OCT2: "OCT2",
    MRP2: "MRP2",
    MATE1: "MATE1",
    MATE2K: "MATE2-K",
    BSEP: "BSEP",
    NTCP: "NTCP",
  };

  const standardRows = useMemo(() => {
    return defaultTr.map((t, i) => {
      const inputs = state.trInputs[i + 1];
      const ki = inputs?.ki ?? calcChengPrusoffKi(inputs?.ic50 ?? NaN, inputs?.s ?? NaN, inputs?.km ?? NaN);
      const I = getIValue(t.site, route, { cmaxUnbound, igut, iinMaxTotal, iinMaxUnbound });
      const ratio = calcTransporterRatio(I, ki);
      const thresholdNum = getStandardThreshold(t.transporter, route);
      const redFlag = !Number.isNaN(ratio) && ratio >= thresholdNum;

      return {
        key: t.transporter,
        organ: getStandardOrgan(t.transporter, route),
        label: trLabelMap[t.transporter] ?? t.transporter,
        ki,
        formula: getFormulaHtml(t.site, route),
        ratio,
        threshold: fmtTxtTrim(thresholdNum, 3),
        redFlag,
      };
    });
  }, [state.trInputs, route, cmaxUnbound, igut, iinMaxTotal, iinMaxUnbound]);

  const optionalRows = useMemo(() => {
    return defaultOptionalTr.map((opt) => {
      const inputs = state.optionalTrInputs[opt.idx];
      const active = Boolean(inputs?.name?.trim()) || [inputs?.ki, inputs?.ic50, inputs?.s, inputs?.km].some((v) => v !== null && v !== undefined);
      const ki = inputs?.ki ?? calcChengPrusoffKi(inputs?.ic50 ?? NaN, inputs?.s ?? NaN, inputs?.km ?? NaN);
      const thresholdNum = inputs?.threshold ?? opt.threshold;
      const I = getIValue(inputs?.site ?? opt.site, route, { cmaxUnbound, igut, iinMaxTotal, iinMaxUnbound });
      const ratio = active ? calcTransporterRatio(I, ki) : NaN;
      const thresholdMissing = Number.isNaN(thresholdNum);
      const redFlag = active && !thresholdMissing && !Number.isNaN(ratio) && ratio >= thresholdNum;

      return {
        key: opt.idx,
        active,
        organ: getOptionalOrgan(inputs?.site ?? opt.site, route),
        label: inputs?.name?.trim() || "---",
        ki: active ? ki : NaN,
        formula: getFormulaHtml(inputs?.site ?? opt.site, route),
        ratio,
        threshold: fmtTxtTrim(thresholdNum, 3),
        thresholdMissing,
        redFlag,
      };
    });
  }, [state.optionalTrInputs, route, cmaxUnbound, igut, iinMaxTotal, iinMaxUnbound]);

  const handleExportReport = async () => {
    const generatedAt = new Date();
    const sections = [
      {
        title: "Transporter DDI Risk Assessment Report",
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
          ["Iin,max (uM)", fmtTxtNum(iinMaxTotal)],
          ["Iin,max,u (uM)", fmtTxtNum(iinMaxUnbound)],
        ],
      },
      {
        title: "Standard Transporters",
        rows: [
          ["Organ", "Transporter", "Ki_uM", "Formula", "[I]/Ki,u", "Threshold", "Risk"],
          ...standardRows.map((row, index) => [
            row.organ.replace(/<[^>]+>/g, ""),
            row.label,
            fmtTxtNum(row.ki),
            getFormulaText(defaultTr[index]?.site ?? "systemic_unbound", route),
            fmtTxtNum(row.ratio),
            `>= ${row.threshold}`,
            row.redFlag ? "Risk detected" : "No risk",
          ]),
        ],
      },
      {
        title: "Optional Transporters",
        rows: [
          ["Organ", "Transporter", "Active", "Ki_uM", "Formula", "[I]/Ki,u", "Threshold", "Status"],
          ...optionalRows.map((row) => [
            row.organ.replace(/<[^>]+>/g, ""),
            row.label,
            row.active ? "Yes" : "No",
            fmtTxtNum(row.ki),
            getFormulaText(state.optionalTrInputs[row.key]?.site ?? defaultOptionalTr[row.key - 1]?.site ?? "systemic_unbound", route),
            fmtTxtNum(row.ratio),
            row.thresholdMissing ? row.threshold : `>= ${row.threshold}`,
            !row.active ? "Not configured" : row.thresholdMissing ? "Threshold missing" : row.redFlag ? "Risk detected" : "No risk",
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
      const result = await downloadCsvReport(`${state.drugName || "drug"}-transporter-ddi-report`, sections, generatedAt);
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
        <div className="min-w-[1100px] space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#06b6d4] to-[#3b82f6] flex items-center justify-center shadow-md">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#0f172a] tracking-tight">Transporter DDI Risk Assessment Report</h2>
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

          <div className="bg-white rounded-xl shadow-sm border border-[#e2e8f0] overflow-hidden" style={{ maxWidth: 1040 }}>
            <table className="border-collapse w-full">
              <thead>
                <tr className="bg-[#f8fafc]">
                  <th className="px-4 py-3 text-[11px] font-bold text-[#475569] text-left border-b border-[#e2e8f0]">Organ</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-[#475569] text-left border-b border-[#e2e8f0]">Transporter</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-[#475569] text-center border-b border-[#e2e8f0]" dangerouslySetInnerHTML={{ __html: "K<sub>i,u</sub> (&mu;M)" }} />
                  <th className="px-4 py-3 text-[11px] font-bold text-[#475569] text-left border-b border-[#e2e8f0]">Formula</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-[#475569] text-center border-b border-[#e2e8f0]" dangerouslySetInnerHTML={{ __html: "[I]/K<sub>i,u</sub>" }} />
                  <th className="px-4 py-3 text-[11px] font-bold text-[#475569] text-center border-b border-[#e2e8f0]">Threshold</th>
                </tr>
              </thead>
              <tbody>
                {standardRows.map((row) => (
                  <tr key={row.key} className={`hover:bg-[#f8fafc] transition-colors ${row.redFlag ? "bg-[#fef2f2]" : ""}`}>
                    <td className="px-4 py-2.5 text-[13px] text-[#475569] border-b border-[#f1f5f9]">
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${row.redFlag ? "bg-[#ef4444]" : "bg-[#22c55e]"}`} />
                        <span dangerouslySetInnerHTML={{ __html: row.organ }} />
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[13px] font-medium text-[#334155] border-b border-[#f1f5f9]">{row.label}</td>
                    <td className={`px-4 py-2.5 text-[13px] text-center font-mono border-b border-[#f1f5f9] ${row.redFlag ? "text-[#dc2626] font-bold" : "text-[#0f172a]"}`}>{fmtTxtNum(row.ki)}</td>
                    <td className="px-4 py-2.5 text-[13px] font-serif text-[#475569] border-b border-[#f1f5f9]" dangerouslySetInnerHTML={{ __html: row.formula }} />
                    <td className={`px-4 py-2.5 text-[13px] text-center font-mono border-b border-[#f1f5f9] ${row.redFlag ? "text-[#dc2626] font-bold" : "text-[#0f172a]"}`}>{fmtTxtNum(row.ratio)}</td>
                    <td className="px-4 py-2.5 text-[13px] text-center border-b border-[#f1f5f9]">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${row.redFlag ? "bg-[#fef2f2] text-[#dc2626]" : "bg-[#f0fdf4] text-[#16a34a]"}`} dangerouslySetInnerHTML={{ __html: `&ge;${row.threshold}` }} />
                    </td>
                  </tr>
                ))}

                <tr className="bg-[#f8fafc]">
                  <td colSpan={6} className="px-4 py-2 text-[12px] font-semibold text-[#94a3b8] border-b border-[#e2e8f0]">Optional Transporters</td>
                </tr>

                {optionalRows.map((row) => (
                  <tr key={`opt-${row.key}`} className={`hover:bg-[#f8fafc] transition-colors ${row.redFlag ? "bg-[#fef2f2]" : ""}`}>
                    <td className="px-4 py-2.5 text-[13px] text-[#475569] border-b border-[#f1f5f9]">
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${!row.active ? "bg-[#cbd5e1]" : row.redFlag ? "bg-[#ef4444]" : "bg-[#22c55e]"}`} />
                        <span dangerouslySetInnerHTML={{ __html: row.organ }} />
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[13px] text-[#94a3b8] border-b border-[#f1f5f9]">{row.label}</td>
                    <td className={`px-4 py-2.5 text-[13px] text-center font-mono border-b border-[#f1f5f9] ${row.redFlag ? "text-[#dc2626] font-bold" : "text-[#0f172a]"}`}>{fmtTxtNum(row.ki)}</td>
                    <td className="px-4 py-2.5 text-[13px] font-serif text-[#475569] border-b border-[#f1f5f9]" dangerouslySetInnerHTML={{ __html: row.formula }} />
                    <td className={`px-4 py-2.5 text-[13px] text-center font-mono border-b border-[#f1f5f9] ${row.redFlag ? "text-[#dc2626] font-bold" : "text-[#0f172a]"}`}>{fmtTxtNum(row.ratio)}</td>
                    <td className="px-4 py-2.5 text-[13px] text-center border-b border-[#f1f5f9]">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          row.thresholdMissing
                            ? "bg-[#f8fafc] text-[#94a3b8]"
                            : row.redFlag
                              ? "bg-[#fef2f2] text-[#dc2626]"
                              : "bg-[#f0fdf4] text-[#16a34a]"
                        }`}
                        dangerouslySetInnerHTML={{ __html: row.thresholdMissing ? row.threshold : `&ge;${row.threshold}` }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-6 text-xs text-[#64748b]">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#ef4444]" /> Risk detected</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#22c55e]" /> No risk</span>
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-[#d97706]" />
              Oral P-gp/BCRP uses [Dose/250 mL]; i.v. P-gp/BCRP uses C<sub>max,u</sub> with cutoff 0.02.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
