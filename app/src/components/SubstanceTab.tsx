import { useDDI, useResetCyp, useResetOptional, useResetOptionalTr, useResetTr } from "@/hooks/useDDIStore";
import { LeftPanel } from "./LeftPanel";
import {
  FieldPairNumeric, FieldPairSelect, CypKiCard, CypTdiCard,
  CypIndCard, OptionalEnzymeCard, OptionalTransporterCard, TransporterCard,
  DdiTextInput, ResetButton, LabelHtml, NoteHtml,
  SectionTitle, SubsectionTitle,
} from "./FieldComponents";
import { defaultCyp, defaultOptional, defaultOptionalTr, defaultTr, transporterSiteChoices } from "@/lib/data";
import { Pill, Syringe, Droplets, Zap, FlaskConical, ArrowLeftRight } from "lucide-react";

export function SubstanceTab() {
  const { state, dispatch } = useDDI();

  return (
    <div className="grid grid-cols-[220px_1fr] gap-5 items-start p-5 w-full h-full min-h-0 min-w-0 overflow-hidden box-border">
      <LeftPanel />
      <div className="w-full h-full min-w-0 min-h-0 overflow-auto pr-1 pb-8">
        <div className="min-w-[1250px] space-y-8">

          {/* ─── Drug and PK Properties ─────────────────────────── */}
          <div>
            <SectionTitle>Drug and PK Properties</SectionTitle>
            <div className="grid grid-cols-[repeat(3,minmax(280px,1fr))] gap-4">
              {/* Chemical Formula */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-[#e2e8f0]">
                <div className="grid grid-cols-[1fr_1fr_32px] items-center gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <AtomIcon />
                    <LabelHtml html="Chemical Formula" />
                  </div>
                  <span className="text-[10px] font-medium text-[#94a3b8] uppercase tracking-wider">Reference</span>
                  <div />
                </div>
                <div className="grid grid-cols-[1fr_1fr_32px] items-center gap-2">
                  <DdiTextInput
                    value={state.formulaInput}
                    onChange={(v) => dispatch({ type: "SET_FORMULA", formula: v })}
                  />
                  <DdiTextInput
                    value={state.formulaInputRef}
                    onChange={(v) => dispatch({ type: "SET_FIELD", field: "formulaInputRef", value: v })}
                  />
                  <ResetButton onClick={() => dispatch({ type: "RESET_SUBSTANCE" })} />
                </div>
                <NoteHtml html="Enter formula: C19H22F3N5O2S, NaCl, C6H5ClO, Fe2(SO4)3" />
              </div>

              {/* SMILES */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-[#e2e8f0]">
                <div className="grid grid-cols-[1fr_1fr_32px] items-center gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <SmilesIcon />
                    <LabelHtml html="SMILES" />
                  </div>
                  <span className="text-[10px] font-medium text-[#94a3b8] uppercase tracking-wider">Reference</span>
                  <div />
                </div>
                <div className="grid grid-cols-[1fr_1fr_32px] items-center gap-2">
                  <DdiTextInput
                    value={state.smiles}
                    onChange={(v) => dispatch({ type: "SET_SMILES", smiles: v, ref: state.smilesRef })}
                    placeholder="e.g. CCO for ethanol"
                  />
                  <DdiTextInput
                    value={state.smilesRef}
                    onChange={(v) => dispatch({ type: "SET_SMILES", smiles: state.smiles, ref: v })}
                  />
                  <ResetButton onClick={() => dispatch({ type: "SET_SMILES", smiles: "", ref: "" })} />
                </div>
                <NoteHtml html="Enter SMILES to render 2D structure in the left panel. Example: CCN1CCN(CC1)C2=CC..." />
              </div>

              <FieldCard icon={<WeightIcon />}>
                <FieldPairSelect
                  label="MW [g/mol]"
                  value={state.mwDisplay}
                  refValue={state.mwDisplayRef}
                  options={[state.mwDisplay]}
                  onChange={(v) => dispatch({ type: "SET_FIELD", field: "mwDisplay", value: v })}
                  onRefChange={(v) => dispatch({ type: "SET_FIELD", field: "mwDisplayRef", value: v })}
                  onReset={() => {
                    const mw = state.mwValue;
                    const val = Number.isNaN(mw) ? "---" : `${mw.toFixed(2)} (AVG)`;
                    dispatch({ type: "SET_FIELD", field: "mwDisplay", value: val });
                    dispatch({ type: "SET_FIELD", field: "mwDisplayRef", value: "" });
                  }}
                />
              </FieldCard>

              <FieldCard icon={<RouteIcon />}>
                <FieldPairSelect
                  label="Dosing route"
                  value={state.route}
                  refValue={state.routeRef}
                  options={["Oral", "IV"]}
                  onChange={(v) => dispatch({ type: "SET_FIELD", field: "route", value: v })}
                  onRefChange={(v) => dispatch({ type: "SET_FIELD", field: "routeRef", value: v })}
                  onReset={() => {
                    dispatch({ type: "SET_FIELD", field: "route", value: "Oral" });
                    dispatch({ type: "SET_FIELD", field: "routeRef", value: "" });
                  }}
                />
              </FieldCard>

              <FieldCard icon={<Pill className="w-3.5 h-3.5 text-[#3b82f6]" />}>
                <FieldPairNumeric
                  id="dose_mg" label="Dose [mg]" value={state.doseMg} refValue={state.doseMgRef}
                  onChange={(v) => dispatch({ type: "SET_FIELD", field: "doseMg", value: v })}
                  onRefChange={(v) => dispatch({ type: "SET_FIELD", field: "doseMgRef", value: v })}
                  onReset={() => { dispatch({ type: "SET_FIELD", field: "doseMg", value: 300 }); dispatch({ type: "SET_FIELD", field: "doseMgRef", value: "" }); }}
                  min={0}
                />
              </FieldCard>

              <FieldCard icon={<Droplets className="w-3.5 h-3.5 text-[#06b6d4]" />}>
                <FieldPairNumeric
                  id="cmax_ng_ml"
                  label="Plasma C<sub>max,ss</sub> [ng/mL]"
                  value={state.cmaxNgMl} refValue={state.cmaxNgMlRef}
                  onChange={(v) => dispatch({ type: "SET_FIELD", field: "cmaxNgMl", value: v })}
                  onRefChange={(v) => dispatch({ type: "SET_FIELD", field: "cmaxNgMlRef", value: v })}
                  onReset={() => { dispatch({ type: "SET_FIELD", field: "cmaxNgMl", value: null }); dispatch({ type: "SET_FIELD", field: "cmaxNgMlRef", value: "" }); }}
                  min={0}
                />
              </FieldCard>

              <FieldCard icon={<Syringe className="w-3.5 h-3.5 text-[#8b5cf6]" />}>
                <FieldPairNumeric
                  id="fu_p" label="f<sub>u,p</sub>" value={state.fuP} refValue={state.fuPRef}
                  onChange={(v) => dispatch({ type: "SET_FIELD", field: "fuP", value: v })}
                  onRefChange={(v) => dispatch({ type: "SET_FIELD", field: "fuPRef", value: v })}
                  onReset={() => { dispatch({ type: "SET_FIELD", field: "fuP", value: 0.1 }); dispatch({ type: "SET_FIELD", field: "fuPRef", value: "" }); }}
                  min={0} max={1} step={0.001}
                />
              </FieldCard>

              <FieldCard icon={<Zap className="w-3.5 h-3.5 text-[#f59e0b]" />}>
                <FieldPairNumeric
                  id="bp" label="B/P" value={state.bp} refValue={state.bpRef}
                  onChange={(v) => dispatch({ type: "SET_FIELD", field: "bp", value: v })}
                  onRefChange={(v) => dispatch({ type: "SET_FIELD", field: "bpRef", value: v })}
                  onReset={() => { dispatch({ type: "SET_FIELD", field: "bp", value: 1 }); dispatch({ type: "SET_FIELD", field: "bpRef", value: "" }); }}
                  min={0.0001} step={0.01}
                  note="Also called RB in the ICH M12 guidance"
                />
              </FieldCard>

              <FieldCard icon={<FlaskConical className="w-3.5 h-3.5 text-[#10b981]" />}>
                <FieldPairNumeric
                  id="fa" label="F<sub>a</sub>" value={state.fa} refValue={state.faRef}
                  onChange={(v) => dispatch({ type: "SET_FIELD", field: "fa", value: v })}
                  onRefChange={(v) => dispatch({ type: "SET_FIELD", field: "faRef", value: v })}
                  onReset={() => { dispatch({ type: "SET_FIELD", field: "fa", value: 1 }); dispatch({ type: "SET_FIELD", field: "faRef", value: "" }); }}
                  min={0} max={1} step={0.01}
                  note="ICH M12 default is 1"
                />
              </FieldCard>

              <FieldCard icon={<FlaskConical className="w-3.5 h-3.5 text-[#ec4899]" />}>
                <FieldPairNumeric
                  id="fg" label="F<sub>g</sub>" value={state.fg} refValue={state.fgRef}
                  onChange={(v) => dispatch({ type: "SET_FIELD", field: "fg", value: v })}
                  onRefChange={(v) => dispatch({ type: "SET_FIELD", field: "fgRef", value: v })}
                  onReset={() => { dispatch({ type: "SET_FIELD", field: "fg", value: 1 }); dispatch({ type: "SET_FIELD", field: "fgRef", value: "" }); }}
                  min={0} max={1} step={0.01}
                  note="ICH M12 default is 1"
                />
              </FieldCard>

              <FieldCard icon={<ArrowLeftRight className="w-3.5 h-3.5 text-[#6366f1]" />}>
                <FieldPairNumeric
                  id="ka_min" label="k<sub>a</sub> [min<sup>-1</sup>]" value={state.kaMin} refValue={state.kaMinRef}
                  onChange={(v) => dispatch({ type: "SET_FIELD", field: "kaMin", value: v })}
                  onRefChange={(v) => dispatch({ type: "SET_FIELD", field: "kaMinRef", value: v })}
                  onReset={() => { dispatch({ type: "SET_FIELD", field: "kaMin", value: 0.1 }); dispatch({ type: "SET_FIELD", field: "kaMinRef", value: "" }); }}
                  min={0} step={0.001}
                  note="ICH M12 default is 0.1"
                />
              </FieldCard>
            </div>
          </div>

          {/* ─── CYP Reversible Inhibition ──────────────────────── */}
          <div>
            <SubsectionTitle>CYP Reversible Inhibition</SubsectionTitle>
            <div className="grid grid-cols-[repeat(3,minmax(300px,1fr))] gap-4">
              {defaultCyp.map((e) => (
                <CypKiCard
                  key={e.idBase}
                  enzyme={e.enzyme}
                  idBase={e.idBase}
                  kiValue={state.cypInputs[e.idBase]?.Ki_uM ?? null}
                  kiRef={state.cypInputs[e.idBase]?.Ki_ref ?? ""}
                  onKiChange={(v) => dispatch({ type: "SET_CYP_INPUT", idBase: e.idBase, field: "Ki_uM", value: v })}
                  onKiRefChange={(v) => dispatch({ type: "SET_CYP_INPUT", idBase: e.idBase, field: "Ki_ref", value: v })}
                  onReset={useResetCyp(e.idBase)}
                />
              ))}
            </div>
          </div>

          {/* ─── Optional enzymes ───────────────────────────────── */}
          <div>
            <SubsectionTitle>Optional Enzymes</SubsectionTitle>
            <div className="space-y-3">
              {defaultOptional.map((opt) => (
                <OptionalEnzymeCard
                  key={opt.idx}
                  label={opt.label}
                  idx={opt.idx}
                  name={state.optionalInputs[opt.idx]?.name ?? ""}
                  ki={state.optionalInputs[opt.idx]?.ki ?? null}
                  ref={state.optionalInputs[opt.idx]?.ref ?? ""}
                  onNameChange={(v) => dispatch({ type: "SET_OPTIONAL_INPUT", idx: opt.idx, field: "name", value: v })}
                  onKiChange={(v) => dispatch({ type: "SET_OPTIONAL_INPUT", idx: opt.idx, field: "ki", value: v })}
                  onRefChange={(v) => dispatch({ type: "SET_OPTIONAL_INPUT", idx: opt.idx, field: "ref", value: v })}
                  onReset={useResetOptional(opt.idx)}
                />
              ))}
            </div>
          </div>

          {/* ─── CYP Time-Dependent Inhibition ──────────────────── */}
          <div>
            <SubsectionTitle>CYP Time-Dependent Inhibition</SubsectionTitle>
            <div className="space-y-3">
              {defaultCyp.map((e) => (
                <CypTdiCard
                  key={e.idBase}
                  enzyme={e.enzyme}
                  KIValue={state.cypInputs[e.idBase]?.KI_uM ?? null}
                  KIRef={state.cypInputs[e.idBase]?.KI_ref ?? ""}
                  kinactValue={state.cypInputs[e.idBase]?.kinact_min ?? null}
                  kinactRef={state.cypInputs[e.idBase]?.kinact_ref ?? ""}
                  onKIChange={(v) => dispatch({ type: "SET_CYP_INPUT", idBase: e.idBase, field: "KI_uM", value: v })}
                  onKIRefChange={(v) => dispatch({ type: "SET_CYP_INPUT", idBase: e.idBase, field: "KI_ref", value: v })}
                  onKinactChange={(v) => dispatch({ type: "SET_CYP_INPUT", idBase: e.idBase, field: "kinact_min", value: v })}
                  onKinactRefChange={(v) => dispatch({ type: "SET_CYP_INPUT", idBase: e.idBase, field: "kinact_ref", value: v })}
                  onResetKI={useResetCyp(e.idBase)}
                  onResetKinact={useResetCyp(e.idBase)}
                />
              ))}
            </div>
          </div>

          {/* ─── CYP Induction ──────────────────────────────────── */}
          <div>
            <SubsectionTitle>CYP Induction</SubsectionTitle>
            <div className="space-y-3">
              {defaultCyp.map((e) => (
                <CypIndCard
                  key={e.idBase}
                  enzyme={e.enzyme}
                  EmaxValue={state.cypInputs[e.idBase]?.Emax ?? null}
                  EmaxRef={state.cypInputs[e.idBase]?.Emax_ref ?? ""}
                  EC50Value={state.cypInputs[e.idBase]?.EC50_uM ?? null}
                  EC50Ref={state.cypInputs[e.idBase]?.EC50_ref ?? ""}
                  dScalarValue={state.cypInputs[e.idBase]?.d_scalar ?? null}
                  dScalarRef={state.cypInputs[e.idBase]?.d_ref ?? ""}
                  onEmaxChange={(v) => dispatch({ type: "SET_CYP_INPUT", idBase: e.idBase, field: "Emax", value: v })}
                  onEmaxRefChange={(v) => dispatch({ type: "SET_CYP_INPUT", idBase: e.idBase, field: "Emax_ref", value: v })}
                  onEC50Change={(v) => dispatch({ type: "SET_CYP_INPUT", idBase: e.idBase, field: "EC50_uM", value: v })}
                  onEC50RefChange={(v) => dispatch({ type: "SET_CYP_INPUT", idBase: e.idBase, field: "EC50_ref", value: v })}
                  onDScalarChange={(v) => dispatch({ type: "SET_CYP_INPUT", idBase: e.idBase, field: "d_scalar", value: v })}
                  onDScalarRefChange={(v) => dispatch({ type: "SET_CYP_INPUT", idBase: e.idBase, field: "d_ref", value: v })}
                  onResetEmax={useResetCyp(e.idBase)}
                  onResetEC50={useResetCyp(e.idBase)}
                  onResetDScalar={useResetCyp(e.idBase)}
                />
              ))}
            </div>
          </div>

          {/* ─── Transporter Inhibition ─────────────────────────── */}
          <div>
            <SubsectionTitle>Transporter Inhibition<sup className="text-[#3b82f6]">*</sup></SubsectionTitle>
            <div className="space-y-3">
              {defaultTr.map((t, i) => (
                <TransporterCard
                  key={i + 1}
                  transporter={t.transporter}
                  idx={i + 1}
                  ki={state.trInputs[i + 1]?.ki ?? null}
                  ic50={state.trInputs[i + 1]?.ic50 ?? null}
                  s={state.trInputs[i + 1]?.s ?? null}
                  km={state.trInputs[i + 1]?.km ?? null}
                  ref={state.trInputs[i + 1]?.ref ?? ""}
                  onKiChange={(v) => dispatch({ type: "SET_TR_INPUT", idx: i + 1, field: "ki", value: v })}
                  onIc50Change={(v) => dispatch({ type: "SET_TR_INPUT", idx: i + 1, field: "ic50", value: v })}
                  onSChange={(v) => dispatch({ type: "SET_TR_INPUT", idx: i + 1, field: "s", value: v })}
                  onKmChange={(v) => dispatch({ type: "SET_TR_INPUT", idx: i + 1, field: "km", value: v })}
                  onRefChange={(v) => dispatch({ type: "SET_TR_INPUT", idx: i + 1, field: "ref", value: v })}
                  onReset={useResetTr(i + 1)}
                />
              ))}
            </div>
          </div>

          <div>
            <SubsectionTitle>Optional Transporters</SubsectionTitle>
            <div className="space-y-3">
              {defaultOptionalTr.map((opt) => (
                <OptionalTransporterCard
                  key={opt.idx}
                  label={opt.label}
                  name={state.optionalTrInputs[opt.idx]?.name ?? ""}
                  site={state.optionalTrInputs[opt.idx]?.site ?? opt.site}
                  threshold={state.optionalTrInputs[opt.idx]?.threshold ?? opt.threshold}
                  ki={state.optionalTrInputs[opt.idx]?.ki ?? null}
                  ic50={state.optionalTrInputs[opt.idx]?.ic50 ?? null}
                  s={state.optionalTrInputs[opt.idx]?.s ?? null}
                  km={state.optionalTrInputs[opt.idx]?.km ?? null}
                  ref={state.optionalTrInputs[opt.idx]?.ref ?? ""}
                  siteOptions={transporterSiteChoices}
                  onNameChange={(v) => dispatch({ type: "SET_OPTIONAL_TR_INPUT", idx: opt.idx, field: "name", value: v })}
                  onSiteChange={(v) => dispatch({ type: "SET_OPTIONAL_TR_INPUT", idx: opt.idx, field: "site", value: v })}
                  onThresholdChange={(v) => dispatch({ type: "SET_OPTIONAL_TR_INPUT", idx: opt.idx, field: "threshold", value: v })}
                  onKiChange={(v) => dispatch({ type: "SET_OPTIONAL_TR_INPUT", idx: opt.idx, field: "ki", value: v })}
                  onIc50Change={(v) => dispatch({ type: "SET_OPTIONAL_TR_INPUT", idx: opt.idx, field: "ic50", value: v })}
                  onSChange={(v) => dispatch({ type: "SET_OPTIONAL_TR_INPUT", idx: opt.idx, field: "s", value: v })}
                  onKmChange={(v) => dispatch({ type: "SET_OPTIONAL_TR_INPUT", idx: opt.idx, field: "km", value: v })}
                  onRefChange={(v) => dispatch({ type: "SET_OPTIONAL_TR_INPUT", idx: opt.idx, field: "ref", value: v })}
                  onReset={useResetOptionalTr(opt.idx)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Small Icon Components ──────────────────────────────────────────────────
function FieldCard({ children, icon }: { children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-[#e2e8f0] hover:shadow-md hover:border-[#cbd5e1] transition-all duration-200">
      <div className="flex items-center gap-1.5 mb-2">{icon}<span /></div>
      {children}
    </div>
  );
}

function AtomIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z"/><path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5Z"/></svg>;
}
function WeightIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="3"/><path d="M6.5 8a2 2 0 0 0-1.905 1.46L2.1 20.2A2 2 0 0 0 4.03 22.8h15.94a2 2 0 0 0 1.93-2.6l-2.495-10.74A2 2 0 0 0 17.5 8"/></svg>;
}
function RouteIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>;
}

function SmilesIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v4"/><path d="M12 18v4"/><path d="m4.93 4.93 2.83 2.83"/><path d="m16.24 16.24 2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="m4.93 19.07 2.83-2.83"/><path d="m16.24 7.76 2.83-2.83"/></svg>;
}
