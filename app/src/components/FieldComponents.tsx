/* FieldComponents - reusable form field components */
import { RotateCcw } from "lucide-react";

// ─── Label & Note ───────────────────────────────────────────────────────────
export function LabelHtml({ html }: { html: string }) {
  return <div className="text-xs font-semibold text-[#475569] tracking-wide" dangerouslySetInnerHTML={{ __html: html }} />;
}

export function NoteHtml({ html }: { html: string }) {
  return (
    <div
      className="text-[11px] text-[#94a3b8] leading-relaxed mt-1.5 pl-0"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// ─── Reset Button ───────────────────────────────────────────────────────────
export function ResetButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-7 h-7 rounded-md flex items-center justify-center text-[#94a3b8] hover:text-[#ef4444] hover:bg-[#fef2f2] transition-all duration-200"
      title="Reset to default"
    >
      <RotateCcw className="w-3.5 h-3.5" />
    </button>
  );
}

// ─── Numeric Input ──────────────────────────────────────────────────────────
interface NumericInputProps {
  value: number | null;
  onChange: (val: number | null) => void;
  step?: number;
  min?: number;
  max?: number;
  placeholder?: string;
}

export function DdiNumericInput({ value, onChange, step, min, max, placeholder }: NumericInputProps) {
  return (
    <input
      type="number"
      value={value === null || value === undefined ? "" : value}
      onChange={(e) => {
        const v = e.target.value;
        if (v === "") {
          onChange(null);
        } else {
          const n = parseFloat(v);
          if (!Number.isNaN(n)) onChange(n);
        }
      }}
      step={step}
      min={min}
      max={max}
      placeholder={placeholder}
      className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg h-9 text-[13px] px-3 text-[#1e293b] placeholder:text-[#cbd5e1] transition-all duration-200 focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/10 hover:border-[#cbd5e1]"
    />
  );
}

// ─── Text Input ─────────────────────────────────────────────────────────────
interface TextInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export function DdiTextInput({ value, onChange, placeholder }: TextInputProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg h-9 text-[13px] px-3 text-[#1e293b] placeholder:text-[#cbd5e1] transition-all duration-200 focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/10 hover:border-[#cbd5e1]"
    />
  );
}

// ─── Select Input ───────────────────────────────────────────────────────────
interface SelectInputProps {
  value: string;
  onChange: (val: string) => void;
  options: string[];
}

export function DdiSelect({ value, onChange, options }: SelectInputProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg h-9 text-[13px] px-3 text-[#1e293b] transition-all duration-200 focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/10 hover:border-[#cbd5e1] cursor-pointer appearance-none"
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  );
}

// ─── Field Pair (Numeric + Reference) ───────────────────────────────────────
interface FieldPairNumericProps {
  id: string;
  label: string;
  value: number | null;
  refValue: string;
  onChange: (val: number | null) => void;
  onRefChange: (val: string) => void;
  onReset: () => void;
  step?: number;
  min?: number;
  max?: number;
  note?: string;
}

export function FieldPairNumeric({
  label, value, refValue, onChange, onRefChange, onReset,
  step, min, max, note,
}: FieldPairNumericProps) {
  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-[1fr_1fr_32px] items-center gap-2">
        <LabelHtml html={label} />
        <span className="text-[10px] font-medium text-[#94a3b8] uppercase tracking-wider">Reference</span>
        <div />
      </div>
      <div className="grid grid-cols-[1fr_1fr_32px] items-center gap-2">
        <DdiNumericInput value={value} onChange={onChange} step={step} min={min} max={max} />
        <DdiTextInput value={refValue} onChange={onRefChange} />
        <ResetButton onClick={onReset} />
      </div>
      {note && <NoteHtml html={note} />}
    </div>
  );
}

// ─── Field Pair (Select + Reference) ────────────────────────────────────────
interface FieldPairSelectProps {
  label: string;
  value: string;
  refValue: string;
  options: string[];
  onChange: (val: string) => void;
  onRefChange: (val: string) => void;
  onReset: () => void;
  note?: string;
}

export function FieldPairSelect({
  label, value, refValue, options, onChange, onRefChange, onReset, note,
}: FieldPairSelectProps) {
  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-[1fr_1fr_32px] items-center gap-2">
        <LabelHtml html={label} />
        <span className="text-[10px] font-medium text-[#94a3b8] uppercase tracking-wider">Reference</span>
        <div />
      </div>
      <div className="grid grid-cols-[1fr_1fr_32px] items-center gap-2">
        <DdiSelect value={value} onChange={onChange} options={options} />
        <DdiTextInput value={refValue} onChange={onRefChange} />
        <ResetButton onClick={onReset} />
      </div>
      {note && <NoteHtml html={note} />}
    </div>
  );
}

// ─── Simple Text Field ──────────────────────────────────────────────────────
interface SimpleTextFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
}

export function SimpleTextField({ label, value, onChange }: SimpleTextFieldProps) {
  return (
    <div className="space-y-1.5">
      <LabelHtml html={label} />
      <DdiTextInput value={value} onChange={onChange} />
    </div>
  );
}

// ─── CYP Ki Card ────────────────────────────────────────────────────────────
interface CypKiCardProps {
  enzyme: string;
  idBase: string;
  kiValue: number | null;
  kiRef: string;
  onKiChange: (val: number | null) => void;
  onKiRefChange: (val: string) => void;
  onReset: () => void;
}

export function CypKiCard({ enzyme, kiValue, kiRef, onKiChange, onKiRefChange, onReset }: CypKiCardProps) {
  const displayName = enzyme.includes("CYP3A4") ? `${enzyme}*` : enzyme;
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-[#e2e8f0] hover:shadow-md hover:border-[#cbd5e1] transition-all duration-200">
      <div
        className="text-sm font-bold text-[#0f172a] mb-3"
        dangerouslySetInnerHTML={{ __html: displayName.replace("CYP3A4", "CYP3A4<sup class='text-[#3b82f6]'>*</sup>") }}
      />
      <FieldPairNumeric
        id={`ki_${enzyme}`}
        label="K<sub>i,u</sub> [&mu;M]"
        value={kiValue}
        refValue={kiRef}
        onChange={onKiChange}
        onRefChange={onKiRefChange}
        onReset={onReset}
        note="K<sub>i</sub>, IC<sub>50,u</sub>/2 or IC<sub>50</sub>/2 corrected for microsomal protein binding"
      />
    </div>
  );
}

// ─── CYP TDI Card ───────────────────────────────────────────────────────────
interface CypTdiCardProps {
  enzyme: string;
  KIValue: number | null;
  KIRef: string;
  kinactValue: number | null;
  kinactRef: string;
  onKIChange: (val: number | null) => void;
  onKIRefChange: (val: string) => void;
  onKinactChange: (val: number | null) => void;
  onKinactRefChange: (val: string) => void;
  onResetKI: () => void;
  onResetKinact: () => void;
}

export function CypTdiCard({
  enzyme, KIValue, KIRef, kinactValue, kinactRef,
  onKIChange, onKIRefChange, onKinactChange, onKinactRefChange,
  onResetKI, onResetKinact,
}: CypTdiCardProps) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-[#e2e8f0] hover:shadow-md hover:border-[#cbd5e1] transition-all duration-200">
      <div className="text-sm font-bold text-[#0f172a] mb-4 pb-2 border-b border-[#f1f5f9]">{enzyme}</div>
      <div className="grid grid-cols-2 gap-5">
        <FieldPairNumeric
          id={`KI_${enzyme}`}
          label="KI<sub>,u</sub> [&mu;M]"
          value={KIValue}
          refValue={KIRef}
          onChange={onKIChange}
          onRefChange={onKIRefChange}
          onReset={onResetKI}
          note="unbound KI corrected for microsomal protein binding"
        />
        <FieldPairNumeric
          id={`kinact_${enzyme}`}
          label="k<sub>inact</sub> [min<sup>-1</sup>]"
          value={kinactValue}
          refValue={kinactRef}
          onChange={onKinactChange}
          onRefChange={onKinactRefChange}
          onReset={onResetKinact}
        />
      </div>
    </div>
  );
}

// ─── CYP Induction Card ─────────────────────────────────────────────────────
interface CypIndCardProps {
  enzyme: string;
  EmaxValue: number | null;
  EmaxRef: string;
  EC50Value: number | null;
  EC50Ref: string;
  dScalarValue: number | null;
  dScalarRef: string;
  onEmaxChange: (val: number | null) => void;
  onEmaxRefChange: (val: string) => void;
  onEC50Change: (val: number | null) => void;
  onEC50RefChange: (val: string) => void;
  onDScalarChange: (val: number | null) => void;
  onDScalarRefChange: (val: string) => void;
  onResetEmax: () => void;
  onResetEC50: () => void;
  onResetDScalar: () => void;
}

export function CypIndCard({
  enzyme, EmaxValue, EmaxRef, EC50Value, EC50Ref, dScalarValue, dScalarRef,
  onEmaxChange, onEmaxRefChange, onEC50Change, onEC50RefChange,
  onDScalarChange, onDScalarRefChange,
  onResetEmax, onResetEC50, onResetDScalar,
}: CypIndCardProps) {
  const displayName = enzyme.replace(/ \(.*\)/, "");
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-[#e2e8f0] hover:shadow-md hover:border-[#cbd5e1] transition-all duration-200">
      <div className="text-sm font-bold text-[#0f172a] mb-4 pb-2 border-b border-[#f1f5f9]">{displayName}</div>
      <div className="grid grid-cols-3 gap-5">
        <FieldPairNumeric
          id={`emax_${enzyme}`}
          label="E<sub>max</sub> [Fold]"
          value={EmaxValue}
          refValue={EmaxRef}
          onChange={onEmaxChange}
          onRefChange={onEmaxRefChange}
          onReset={onResetEmax}
          note="total mRNA increase vs baseline"
        />
        <FieldPairNumeric
          id={`ec50_${enzyme}`}
          label="EC<sub>50</sub> [&mu;M]"
          value={EC50Value}
          refValue={EC50Ref}
          onChange={onEC50Change}
          onRefChange={onEC50RefChange}
          onReset={onResetEC50}
        />
        <FieldPairNumeric
          id={`dscalar_${enzyme}`}
          label="<i>d</i>-scalar"
          value={dScalarValue}
          refValue={dScalarRef}
          onChange={onDScalarChange}
          onRefChange={onDScalarRefChange}
          onReset={onResetDScalar}
          note="default to 1"
        />
      </div>
    </div>
  );
}

// ─── Optional Enzyme Card ───────────────────────────────────────────────────
interface OptionalEnzymeCardProps {
  label: string;
  idx: number;
  name: string;
  ki: number | null;
  ref: string;
  onNameChange: (val: string) => void;
  onKiChange: (val: number | null) => void;
  onRefChange: (val: string) => void;
  onReset: () => void;
}

export function OptionalEnzymeCard({
  label, name, ki, ref,
  onNameChange, onKiChange, onRefChange, onReset,
}: OptionalEnzymeCardProps) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-[#e2e8f0] hover:shadow-md hover:border-[#cbd5e1] transition-all duration-200">
      <div className="text-sm font-bold text-[#0f172a] mb-4 pb-2 border-b border-[#f1f5f9]">{label}</div>
      <div className="grid grid-cols-[1fr_140px_1fr_32px] gap-4 items-start">
        <SimpleTextField label="Enzyme Name" value={name} onChange={onNameChange} />
        <div className="space-y-1.5">
          <LabelHtml html="K<sub>i,u</sub> [&mu;M]" />
          <DdiNumericInput value={ki} onChange={onKiChange} />
        </div>
        <SimpleTextField label="Reference" value={ref} onChange={onRefChange} />
        <div className="pt-5"><ResetButton onClick={onReset} /></div>
      </div>
    </div>
  );
}

// ─── Transporter Card ───────────────────────────────────────────────────────
interface TransporterCardProps {
  transporter: string;
  idx: number;
  ki: number | null;
  ic50: number | null;
  s: number | null;
  km: number | null;
  ref: string;
  onKiChange: (val: number | null) => void;
  onIc50Change: (val: number | null) => void;
  onSChange: (val: number | null) => void;
  onKmChange: (val: number | null) => void;
  onRefChange: (val: string) => void;
  onReset: () => void;
}

export function TransporterCard({
  transporter, ki, ic50, s, km, ref,
  onKiChange, onIc50Change, onSChange, onKmChange, onRefChange, onReset,
}: TransporterCardProps) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-[#e2e8f0] hover:shadow-md hover:border-[#cbd5e1] transition-all duration-200">
      <div className="text-sm font-bold text-[#0f172a] mb-4 pb-2 border-b border-[#f1f5f9]">{transporter}</div>
      <div className="grid grid-cols-5 gap-4 items-start">
        <div className="space-y-1.5">
          <LabelHtml html="K<sub>i,u</sub>" />
          <DdiNumericInput value={ki} onChange={onKiChange} />
        </div>
        <div className="space-y-1.5">
          <LabelHtml html="IC50<sub>,u</sub>" />
          <DdiNumericInput value={ic50} onChange={onIc50Change} />
        </div>
        <div className="space-y-1.5">
          <LabelHtml html="[S]" />
          <DdiNumericInput value={s} onChange={onSChange} />
        </div>
        <div className="space-y-1.5">
          <LabelHtml html="K<sub>m</sub>" />
          <DdiNumericInput value={km} onChange={onKmChange} />
        </div>
        <div className="grid grid-cols-[1fr_32px] gap-2 items-start">
          <SimpleTextField label="Reference" value={ref} onChange={onRefChange} />
          <div className="pt-5"><ResetButton onClick={onReset} /></div>
        </div>
      </div>
    </div>
  );
}

interface OptionalTransporterCardProps {
  label: string;
  name: string;
  site: string;
  threshold: number | null;
  ki: number | null;
  ic50: number | null;
  s: number | null;
  km: number | null;
  ref: string;
  siteOptions: Array<{ value: string; label: string }>;
  onNameChange: (val: string) => void;
  onSiteChange: (val: string) => void;
  onThresholdChange: (val: number | null) => void;
  onKiChange: (val: number | null) => void;
  onIc50Change: (val: number | null) => void;
  onSChange: (val: number | null) => void;
  onKmChange: (val: number | null) => void;
  onRefChange: (val: string) => void;
  onReset: () => void;
}

export function OptionalTransporterCard({
  label, name, site, threshold, ki, ic50, s, km, ref, siteOptions,
  onNameChange, onSiteChange, onThresholdChange, onKiChange, onIc50Change, onSChange, onKmChange, onRefChange, onReset,
}: OptionalTransporterCardProps) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-[#e2e8f0] hover:shadow-md hover:border-[#cbd5e1] transition-all duration-200">
      <div className="text-sm font-bold text-[#0f172a] mb-4 pb-2 border-b border-[#f1f5f9]">{label}</div>
      <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_140px_32px] gap-4 items-start mb-4">
        <SimpleTextField label="Transporter Name" value={name} onChange={onNameChange} />
        <div className="space-y-1.5">
          <LabelHtml html="Site / [I]" />
          <select
            value={site}
            onChange={(e) => onSiteChange(e.target.value)}
            className="w-full bg-[#f8fafc] border border-[#e2e8f0] rounded-lg h-9 text-[13px] px-3 text-[#1e293b] transition-all duration-200 focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/10 hover:border-[#cbd5e1] cursor-pointer"
          >
            {siteOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <LabelHtml html="Threshold" />
          <DdiNumericInput value={threshold} onChange={onThresholdChange} min={0} step={0.01} />
        </div>
        <div className="pt-5"><ResetButton onClick={onReset} /></div>
      </div>
      <div className="grid grid-cols-[repeat(5,minmax(0,1fr))] gap-4 items-start">
        <div className="space-y-1.5">
          <LabelHtml html="K<sub>i,u</sub>" />
          <DdiNumericInput value={ki} onChange={onKiChange} />
        </div>
        <div className="space-y-1.5">
          <LabelHtml html="IC50<sub>,u</sub>" />
          <DdiNumericInput value={ic50} onChange={onIc50Change} />
        </div>
        <div className="space-y-1.5">
          <LabelHtml html="[S]" />
          <DdiNumericInput value={s} onChange={onSChange} />
        </div>
        <div className="space-y-1.5">
          <LabelHtml html="K<sub>m</sub>" />
          <DdiNumericInput value={km} onChange={onKmChange} />
        </div>
        <SimpleTextField label="Reference" value={ref} onChange={onRefChange} />
      </div>
      <NoteHtml html="Threshold is editable so optional transporters can follow transporter-specific guidance. If K<sub>i,u</sub> is empty, the report will derive it from Cheng-Prusoff." />
    </div>
  );
}

// ─── System Card ────────────────────────────────────────────────────────────
interface SystemCardProps {
  title: string;
  label: string;
  value: number | null;
  refValue: string;
  onChange: (val: number | null) => void;
  onRefChange: (val: string) => void;
  onReset: () => void;
  note?: string;
}

export function SystemCard({
  title, label, value, refValue, onChange, onRefChange, onReset, note,
}: SystemCardProps) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-[#e2e8f0] hover:shadow-md hover:border-[#cbd5e1] transition-all duration-200">
      <div className="text-sm font-bold text-[#0f172a] mb-4 pb-2 border-b border-[#f1f5f9]">{title}</div>
      <div className="grid grid-cols-[1fr_120px_32px] items-center gap-2 mb-1">
        <LabelHtml html={label} />
        <span className="text-[10px] font-medium text-[#94a3b8] uppercase tracking-wider">Ref</span>
        <div />
      </div>
      <div className="grid grid-cols-[1fr_120px_32px] items-center gap-2">
        <DdiNumericInput value={value} onChange={onChange} />
        <DdiTextInput value={refValue} onChange={onRefChange} />
        <ResetButton onClick={onReset} />
      </div>
      {note && note.length > 0 && (
        <div className="mt-2 text-[11px] text-[#94a3b8] leading-relaxed flex gap-1.5 items-start">
          <span className="text-[#3b82f6] mt-0.5 flex-shrink-0">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
          </span>
          <span dangerouslySetInnerHTML={{ __html: note }} />
        </div>
      )}
    </div>
  );
}

// ─── Section Title ──────────────────────────────────────────────────────────
export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl font-bold text-[#0f172a] tracking-tight mb-6 flex items-center gap-3">
      <span className="w-1 h-6 bg-gradient-to-b from-[#3b82f6] to-[#8b5cf6] rounded-full" />
      {children}
    </h2>
  );
}

export function SubsectionTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={`text-lg font-semibold text-[#334155] mb-4 flex items-center gap-2 ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
      {children}
    </h3>
  );
}
