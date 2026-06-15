import { useDDI } from "@/hooks/useDDIStore";
import { fmtTxtNum } from "@/lib/calculations";
import { MoleculeViewer } from "./MoleculeViewer";
import { Weight, Ruler } from "lucide-react";

export function LeftPanel() {
  const { state } = useDDI();

  const mim = Number.isNaN(state.mwValue) ? "---" : `${fmtTxtNum(state.mwValue, 2)} Da`;

  return (
    <div className="sticky top-0 self-start z-10 w-[220px] space-y-4">
      {/* 2D Molecule Structure */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v4"/><path d="M12 18v4"/><path d="m4.93 4.93 2.83 2.83"/><path d="m16.24 16.24 2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="m4.93 19.07 2.83-2.83"/><path d="m16.24 7.76 2.83-2.83"/></svg>
            <span className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-widest">2D Structure</span>
          </div>
          {state.smiles && (
            <span className="text-[9px] text-[#22c55e] bg-[#f0fdf4] px-1.5 py-0.5 rounded-full font-medium">SMILES</span>
          )}
        </div>
        <div className="flex justify-center">
          <MoleculeViewer smiles={state.smiles} width={190} height={190} />
        </div>
      </div>

      {/* Formula Card */}
      <div className="bg-white rounded-xl p-4 border border-[#e2e8f0] shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Weight className="w-3.5 h-3.5 text-[#3b82f6]" />
          <span className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-widest">Chemical Formula</span>
        </div>
        <div className="text-xl font-bold text-[#0f172a] tracking-tight font-mono">{state.formulaInput}</div>
      </div>

      {/* MW Table */}
      <div className="bg-white rounded-xl p-4 border border-[#e2e8f0] shadow-sm space-y-2.5">
        <div className="flex items-center gap-2 mb-3">
          <Ruler className="w-3.5 h-3.5 text-[#8b5cf6]" />
          <span className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-widest">Molecular Weight</span>
        </div>
        <div className="flex justify-between items-center py-1">
          <span className="text-xs text-[#64748b] font-medium">M.I.M.</span>
          <span className="text-sm font-bold text-[#0f172a] font-mono">{mim}</span>
        </div>
        <div className="h-px bg-[#f1f5f9]" />
        <div className="flex justify-between items-center py-1">
          <span className="text-xs text-[#64748b] font-medium">M.A.M.</span>
          <span className="text-sm font-bold text-[#0f172a] font-mono">{mim}</span>
        </div>
        <div className="h-px bg-[#f1f5f9]" />
        <div className="flex justify-between items-center py-1">
          <span className="text-xs text-[#64748b] font-medium">AVG.</span>
          <span className="text-sm font-bold text-[#0f172a] font-mono">{mim}</span>
        </div>
      </div>
    </div>
  );
}
