import { useDDI, useResetSystemCyp, useResetSystemOther, useResetSystemOptional, useResetSystemFg } from "@/hooks/useDDIStore";
import { LeftPanel } from "./LeftPanel";
import { SystemCard, SectionTitle, SubsectionTitle } from "./FieldComponents";
import { systemCyp, systemOther, systemOptional } from "@/lib/data";
/* SystemTab - System Input Parameters */

export function SystemTab() {
  const { state, dispatch } = useDDI();

  return (
    <div className="grid grid-cols-[220px_1fr] gap-5 items-start p-5 w-full h-full min-h-0 min-w-0 overflow-hidden box-border">
      <LeftPanel />
      <div className="w-full h-full min-w-0 min-h-0 overflow-auto pr-1 pb-8">
        <div className="min-w-[1320px] space-y-8">

          {/* ─── CYP ────────────────────────────────────────────── */}
          <div>
            <SectionTitle>CYP Parameters</SectionTitle>
            <div className="grid grid-cols-[repeat(3,minmax(310px,1fr))] gap-4">
              {systemCyp.map((p) => (
                <SystemCard
                  key={p.idBase}
                  title={p.enzyme}
                  label={p.paramLabel}
                  value={state.systemCypInputs[p.idBase]?.value ?? null}
                  refValue={state.systemCypInputs[p.idBase]?.ref ?? ""}
                  onChange={(v) => dispatch({ type: "SET_SYSTEM_CYP_INPUT", idBase: p.idBase, field: "value", value: v })}
                  onRefChange={(v) => dispatch({ type: "SET_SYSTEM_CYP_INPUT", idBase: p.idBase, field: "ref", value: v })}
                  onReset={useResetSystemCyp(p.idBase)}
                  note={p.note}
                />
              ))}
            </div>
          </div>

          {/* ─── Other properties ─────────────────────────────── */}
          <div>
            <SubsectionTitle>Other Properties</SubsectionTitle>
            <div className="grid grid-cols-[repeat(3,minmax(310px,1fr))] gap-4">
              {systemOther.map((p) => (
                <SystemCard
                  key={p.idBase}
                  title={p.enzyme}
                  label="f<sub>m</sub>"
                  value={state.systemOtherInputs[p.idBase]?.value ?? null}
                  refValue={state.systemOtherInputs[p.idBase]?.ref ?? ""}
                  onChange={(v) => dispatch({ type: "SET_SYSTEM_OTHER_INPUT", idBase: p.idBase, field: "value", value: v })}
                  onRefChange={(v) => dispatch({ type: "SET_SYSTEM_OTHER_INPUT", idBase: p.idBase, field: "ref", value: v })}
                  onReset={useResetSystemOther(p.idBase)}
                  note={p.note}
                />
              ))}
            </div>
          </div>

          {/* ─── Optional enzymes ──────────────────────────────── */}
          <div>
            <SubsectionTitle>Optional Enzymes</SubsectionTitle>
            <div className="grid grid-cols-[repeat(3,minmax(310px,1fr))] gap-4">
              {systemOptional.map((p) => (
                <SystemCard
                  key={p.idBase}
                  title={p.enzyme}
                  label="f<sub>m</sub>"
                  value={state.systemOptionalInputs[p.idBase]?.value ?? null}
                  refValue={state.systemOptionalInputs[p.idBase]?.ref ?? ""}
                  onChange={(v) => dispatch({ type: "SET_SYSTEM_OPTIONAL_INPUT", idBase: p.idBase, field: "value", value: v })}
                  onRefChange={(v) => dispatch({ type: "SET_SYSTEM_OPTIONAL_INPUT", idBase: p.idBase, field: "ref", value: v })}
                  onReset={useResetSystemOptional(p.idBase)}
                  note={p.note}
                />
              ))}
            </div>
          </div>

          {/* ─── Fg ────────────────────────────────────────────── */}
          <div className="max-w-sm">
            <SubsectionTitle>F<sub>g</sub> Parameter</SubsectionTitle>
            <SystemCard
              title=""
              label="F<sub>g</sub>"
              value={state.systemFgInput.value ?? null}
              refValue={state.systemFgInput.ref ?? ""}
              onChange={(v) => dispatch({ type: "SET_SYSTEM_FG_INPUT", field: "value", value: v })}
              onRefChange={(v) => dispatch({ type: "SET_SYSTEM_FG_INPUT", field: "ref", value: v })}
              onReset={useResetSystemFg()}
              note="Vieira et al. (2013) Evaluation of Various Static In vitro-In vivo Extrapolation Models for Risk Assessment of CYP3A Inhibition Potential."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
