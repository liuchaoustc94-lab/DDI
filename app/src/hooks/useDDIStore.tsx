import React, { createContext, useContext, useReducer, useMemo } from "react";
import { calcMwFromFormula, pkSummary } from "@/lib/calculations";
import type { PKSummaryResult } from "@/lib/calculations";
import {
  defaultCyp,
  defaultOptionalTr,
  defaultTr,
  systemCyp,
  systemOther,
  systemOptional,
  systemFg,
} from "@/lib/data";
import type { TransporterSite } from "@/lib/data";

// ─── Form Input Types ───────────────────────────────────────────────────────
export interface CypInputs {
  Ki_uM: number | null;
  Ki_ref: string;
  KI_uM: number | null;
  KI_ref: string;
  kinact_min: number | null;
  kinact_ref: string;
  Emax: number | null;
  Emax_ref: string;
  EC50_uM: number | null;
  EC50_ref: string;
  d_scalar: number | null;
  d_ref: string;
}

export interface OptionalInputs {
  name: string;
  ki: number | null;
  ref: string;
}

export interface TransporterInputs {
  ki: number | null;
  ic50: number | null;
  s: number | null;
  km: number | null;
  ref: string;
}

export interface OptionalTransporterInputs {
  name: string;
  site: TransporterSite;
  threshold: number | null;
  ki: number | null;
  ic50: number | null;
  s: number | null;
  km: number | null;
  ref: string;
}

export interface SystemCypInputs {
  value: number | null;
  ref: string;
}

export interface DDIState {
  // Navigation
  activeTab: string;

  // Substance params
  formulaInput: string;
  formulaInputRef: string;
  mwDisplay: string;
  mwDisplayRef: string;
  route: string;
  routeRef: string;
  doseMg: number | null;
  doseMgRef: string;
  cmaxNgMl: number | null;
  cmaxNgMlRef: string;
  fuP: number | null;
  fuPRef: string;
  bp: number | null;
  bpRef: string;
  fa: number | null;
  faRef: string;
  fg: number | null;
  fgRef: string;
  kaMin: number | null;
  kaMinRef: string;

  // CYP inputs
  cypInputs: Record<string, CypInputs>;

  // Optional enzyme inputs
  optionalInputs: Record<number, OptionalInputs>;

  // Transporter inputs
  trInputs: Record<number, TransporterInputs>;
  optionalTrInputs: Record<number, OptionalTransporterInputs>;

  // System inputs
  systemCypInputs: Record<string, SystemCypInputs>;
  systemOtherInputs: Record<string, SystemCypInputs>;
  systemOptionalInputs: Record<string, SystemCypInputs>;
  systemFgInput: SystemCypInputs;

  // SMILES for 2D structure rendering
  smiles: string;
  smilesRef: string;

  // Calculated
  mwValue: number;
  drugName: string;
}

// ─── Initialize CYP inputs from defaults ────────────────────────────────────
function initCypInputs(): Record<string, CypInputs> {
  const inputs: Record<string, CypInputs> = {};
  for (const e of defaultCyp) {
    inputs[e.idBase] = {
      Ki_uM: e.Ki_uM,
      Ki_ref: e.Ki_ref,
      KI_uM: e.KI_uM,
      KI_ref: e.KI_ref,
      kinact_min: e.kinact_min,
      kinact_ref: e.kinact_ref,
      Emax: e.Emax,
      Emax_ref: e.Emax_ref,
      EC50_uM: e.EC50_uM,
      EC50_ref: e.EC50_ref,
      d_scalar: e.d_scalar,
      d_ref: e.d_ref,
    };
  }
  return inputs;
}

function initOptionalInputs(): Record<number, OptionalInputs> {
  return { 1: { name: "", ki: null, ref: "" }, 2: { name: "", ki: null, ref: "" }, 3: { name: "", ki: null, ref: "" } };
}

function initTrInputs(): Record<number, TransporterInputs> {
  const inputs: Record<number, TransporterInputs> = {};
  defaultTr.forEach((t, i) => {
    inputs[i + 1] = { ki: t.Ki_uM, ic50: t.IC50_uM, s: t.S_uM, km: t.Km_uM, ref: t.ref };
  });
  return inputs;
}

function initOptionalTrInputs(): Record<number, OptionalTransporterInputs> {
  const inputs: Record<number, OptionalTransporterInputs> = {};
  defaultOptionalTr.forEach((t) => {
    inputs[t.idx] = {
      name: t.name,
      site: t.site,
      threshold: t.threshold,
      ki: null,
      ic50: null,
      s: null,
      km: null,
      ref: "",
    };
  });
  return inputs;
}

function initSystemCypInputs(): Record<string, SystemCypInputs> {
  const inputs: Record<string, SystemCypInputs> = {};
  for (const p of systemCyp) {
    inputs[p.idBase] = { value: p.value, ref: p.ref };
  }
  return inputs;
}

function initSystemOtherInputs(): Record<string, SystemCypInputs> {
  const inputs: Record<string, SystemCypInputs> = {};
  for (const p of systemOther) {
    inputs[p.idBase] = { value: p.value, ref: p.ref };
  }
  return inputs;
}

function initSystemOptionalInputs(): Record<string, SystemCypInputs> {
  const inputs: Record<string, SystemCypInputs> = {};
  for (const p of systemOptional) {
    inputs[p.idBase] = { value: p.value, ref: p.ref };
  }
  return inputs;
}

// ─── Default State ──────────────────────────────────────────────────────────
const defaultFormula = "C19H22F3N5O2S";
const defaultMw = calcMwFromFormula(defaultFormula);

const initialState: DDIState = {
  activeTab: "substance",

  formulaInput: defaultFormula,
  formulaInputRef: "",
  mwDisplay: `${defaultMw.toFixed(2)} (AVG)`,
  mwDisplayRef: "",
  route: "Oral",
  routeRef: "",
  doseMg: 300,
  doseMgRef: "",
  cmaxNgMl: null,
  cmaxNgMlRef: "",
  fuP: 0.1,
  fuPRef: "",
  bp: 1,
  bpRef: "",
  fa: 1,
  faRef: "",
  fg: 1,
  fgRef: "",
  kaMin: 0.1,
  kaMinRef: "",

  smiles: "",
  smilesRef: "",

  cypInputs: initCypInputs(),
  optionalInputs: initOptionalInputs(),
  trInputs: initTrInputs(),
  optionalTrInputs: initOptionalTrInputs(),
  systemCypInputs: initSystemCypInputs(),
  systemOtherInputs: initSystemOtherInputs(),
  systemOptionalInputs: initSystemOptionalInputs(),
  systemFgInput: { value: systemFg.value, ref: systemFg.ref },

  mwValue: defaultMw,
  drugName: "NVP-BYL719",
};

// ─── Actions ────────────────────────────────────────────────────────────────
export type DDIAction =
  | { type: "SET_TAB"; tab: string }
  | { type: "SET_FORMULA"; formula: string }
  | { type: "SET_FIELD"; field: string; value: unknown }
  | { type: "SET_SMILES"; smiles: string; ref: string }
  | { type: "SET_CYP_INPUT"; idBase: string; field: keyof CypInputs; value: unknown }
  | { type: "SET_OPTIONAL_INPUT"; idx: number; field: keyof OptionalInputs; value: unknown }
  | { type: "SET_TR_INPUT"; idx: number; field: keyof TransporterInputs; value: unknown }
  | { type: "SET_OPTIONAL_TR_INPUT"; idx: number; field: keyof OptionalTransporterInputs; value: unknown }
  | { type: "SET_SYSTEM_CYP_INPUT"; idBase: string; field: keyof SystemCypInputs; value: unknown }
  | { type: "SET_SYSTEM_OTHER_INPUT"; idBase: string; field: keyof SystemCypInputs; value: unknown }
  | { type: "SET_SYSTEM_OPTIONAL_INPUT"; idBase: string; field: keyof SystemCypInputs; value: unknown }
  | { type: "SET_SYSTEM_FG_INPUT"; field: keyof SystemCypInputs; value: unknown }
  | { type: "RESET_ALL" }
  | { type: "RESET_SUBSTANCE" }
  | { type: "RESET_SYSTEM" };

function reducer(state: DDIState, action: DDIAction): DDIState {
  switch (action.type) {
    case "SET_TAB":
      return { ...state, activeTab: action.tab };

    case "SET_FORMULA": {
      const formula = action.formula;
      const mw = calcMwFromFormula(formula);
      const mwStr = Number.isNaN(mw) ? "---" : `${mw.toFixed(2)} (AVG)`;
      return {
        ...state,
        formulaInput: formula,
        mwDisplay: mwStr,
        mwValue: Number.isNaN(mw) ? NaN : mw,
      };
    }

    case "SET_FIELD":
      return { ...state, [action.field]: action.value };

    case "SET_SMILES":
      return { ...state, smiles: action.smiles, smilesRef: action.ref };

    case "SET_CYP_INPUT":
      return {
        ...state,
        cypInputs: {
          ...state.cypInputs,
          [action.idBase]: {
            ...state.cypInputs[action.idBase],
            [action.field]: action.value,
          },
        },
      };

    case "SET_OPTIONAL_INPUT":
      return {
        ...state,
        optionalInputs: {
          ...state.optionalInputs,
          [action.idx]: {
            ...state.optionalInputs[action.idx],
            [action.field]: action.value,
          },
        },
      };

    case "SET_TR_INPUT":
      return {
        ...state,
        trInputs: {
          ...state.trInputs,
          [action.idx]: {
            ...state.trInputs[action.idx],
            [action.field]: action.value,
          },
        },
      };

    case "SET_OPTIONAL_TR_INPUT":
      return {
        ...state,
        optionalTrInputs: {
          ...state.optionalTrInputs,
          [action.idx]: {
            ...state.optionalTrInputs[action.idx],
            [action.field]: action.value,
          },
        },
      };

    case "SET_SYSTEM_CYP_INPUT":
      return {
        ...state,
        systemCypInputs: {
          ...state.systemCypInputs,
          [action.idBase]: {
            ...state.systemCypInputs[action.idBase],
            [action.field]: action.value,
          },
        },
      };

    case "SET_SYSTEM_OTHER_INPUT":
      return {
        ...state,
        systemOtherInputs: {
          ...state.systemOtherInputs,
          [action.idBase]: {
            ...state.systemOtherInputs[action.idBase],
            [action.field]: action.value,
          },
        },
      };

    case "SET_SYSTEM_OPTIONAL_INPUT":
      return {
        ...state,
        systemOptionalInputs: {
          ...state.systemOptionalInputs,
          [action.idBase]: {
            ...state.systemOptionalInputs[action.idBase],
            [action.field]: action.value,
          },
        },
      };

    case "SET_SYSTEM_FG_INPUT":
      return {
        ...state,
        systemFgInput: {
          ...state.systemFgInput,
          [action.field]: action.value,
        },
      };

    case "RESET_ALL":
      return { ...initialState };

    case "RESET_SUBSTANCE": {
      const mw = calcMwFromFormula(defaultFormula);
      return {
        ...state,
        formulaInput: defaultFormula,
        formulaInputRef: "",
        mwDisplay: `${mw.toFixed(2)} (AVG)`,
        mwDisplayRef: "",
        route: "Oral",
        routeRef: "",
        doseMg: 300,
        doseMgRef: "",
        cmaxNgMl: null,
        cmaxNgMlRef: "",
        fuP: 0.1,
        fuPRef: "",
        bp: 1,
        bpRef: "",
        fa: 1,
        faRef: "",
        fg: 1,
        fgRef: "",
        kaMin: 0.1,
        kaMinRef: "",
        smiles: "",
        smilesRef: "",
        cypInputs: initCypInputs(),
        optionalInputs: initOptionalInputs(),
        trInputs: initTrInputs(),
        optionalTrInputs: initOptionalTrInputs(),
        mwValue: mw,
        drugName: "NVP-BYL719",
      };
    }

    case "RESET_SYSTEM":
      return {
        ...state,
        systemCypInputs: initSystemCypInputs(),
        systemOtherInputs: initSystemOtherInputs(),
        systemOptionalInputs: initSystemOptionalInputs(),
        systemFgInput: { value: systemFg.value, ref: systemFg.ref },
      };

    default:
      return state;
  }
}

// ─── Context ────────────────────────────────────────────────────────────────
interface DDIContextType {
  state: DDIState;
  dispatch: React.Dispatch<DDIAction>;
  pkVals: PKSummaryResult;
}

const DDIContext = createContext<DDIContextType | null>(null);

export function DDIProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const pkVals = useMemo(() => {
    const qhMlMin = state.systemCypInputs["Qh"]?.value ?? 1617;
    return pkSummary({
      cmaxNgMl: state.cmaxNgMl,
      mwCalc: state.mwValue,
      fuP: state.fuP,
      doseMg: state.doseMg,
      fa: state.fa,
      fg: state.fg,
      kaMin: state.kaMin,
      qhMlMin: qhMlMin,
      gutVolL: 0.25,
      route: state.route,
    });
  }, [state.cmaxNgMl, state.mwValue, state.fuP, state.doseMg, state.fa, state.fg, state.kaMin, state.route, state.systemCypInputs]);

  return (
    <DDIContext.Provider value={{ state, dispatch, pkVals }}>
      {children}
    </DDIContext.Provider>
  );
}

export function useDDI() {
  const ctx = useContext(DDIContext);
  if (!ctx) throw new Error("useDDI must be used within DDIProvider");
  return ctx;
}

// ─── Reset Helpers ──────────────────────────────────────────────────────────
export function useResetCyp(idBase: string) {
  const { dispatch } = useDDI();
  const defaults = defaultCyp.find(e => e.idBase === idBase);
  if (!defaults) return () => {};

  return () => {
    dispatch({ type: "SET_CYP_INPUT", idBase, field: "Ki_uM", value: defaults.Ki_uM });
    dispatch({ type: "SET_CYP_INPUT", idBase, field: "Ki_ref", value: defaults.Ki_ref });
    dispatch({ type: "SET_CYP_INPUT", idBase, field: "KI_uM", value: defaults.KI_uM });
    dispatch({ type: "SET_CYP_INPUT", idBase, field: "KI_ref", value: defaults.KI_ref });
    dispatch({ type: "SET_CYP_INPUT", idBase, field: "kinact_min", value: defaults.kinact_min });
    dispatch({ type: "SET_CYP_INPUT", idBase, field: "kinact_ref", value: defaults.kinact_ref });
    dispatch({ type: "SET_CYP_INPUT", idBase, field: "Emax", value: defaults.Emax });
    dispatch({ type: "SET_CYP_INPUT", idBase, field: "Emax_ref", value: defaults.Emax_ref });
    dispatch({ type: "SET_CYP_INPUT", idBase, field: "EC50_uM", value: defaults.EC50_uM });
    dispatch({ type: "SET_CYP_INPUT", idBase, field: "EC50_ref", value: defaults.EC50_ref });
    dispatch({ type: "SET_CYP_INPUT", idBase, field: "d_scalar", value: defaults.d_scalar });
    dispatch({ type: "SET_CYP_INPUT", idBase, field: "d_ref", value: defaults.d_ref });
  };
}

export function useResetOptional(idx: number) {
  const { dispatch } = useDDI();
  return () => {
    dispatch({ type: "SET_OPTIONAL_INPUT", idx, field: "name", value: "" });
    dispatch({ type: "SET_OPTIONAL_INPUT", idx, field: "ki", value: null });
    dispatch({ type: "SET_OPTIONAL_INPUT", idx, field: "ref", value: "" });
  };
}

export function useResetTr(idx: number) {
  const { dispatch } = useDDI();
  const defaults = defaultTr[idx - 1];
  if (!defaults) return () => {};
  return () => {
    dispatch({ type: "SET_TR_INPUT", idx, field: "ki", value: defaults.Ki_uM });
    dispatch({ type: "SET_TR_INPUT", idx, field: "ic50", value: defaults.IC50_uM });
    dispatch({ type: "SET_TR_INPUT", idx, field: "s", value: defaults.S_uM });
    dispatch({ type: "SET_TR_INPUT", idx, field: "km", value: defaults.Km_uM });
    dispatch({ type: "SET_TR_INPUT", idx, field: "ref", value: defaults.ref });
  };
}

export function useResetOptionalTr(idx: number) {
  const { dispatch } = useDDI();
  const defaults = defaultOptionalTr.find((t) => t.idx === idx);
  if (!defaults) return () => {};
  return () => {
    dispatch({ type: "SET_OPTIONAL_TR_INPUT", idx, field: "name", value: defaults.name });
    dispatch({ type: "SET_OPTIONAL_TR_INPUT", idx, field: "site", value: defaults.site });
    dispatch({ type: "SET_OPTIONAL_TR_INPUT", idx, field: "threshold", value: defaults.threshold });
    dispatch({ type: "SET_OPTIONAL_TR_INPUT", idx, field: "ki", value: null });
    dispatch({ type: "SET_OPTIONAL_TR_INPUT", idx, field: "ic50", value: null });
    dispatch({ type: "SET_OPTIONAL_TR_INPUT", idx, field: "s", value: null });
    dispatch({ type: "SET_OPTIONAL_TR_INPUT", idx, field: "km", value: null });
    dispatch({ type: "SET_OPTIONAL_TR_INPUT", idx, field: "ref", value: "" });
  };
}

export function useResetSystemCyp(idBase: string) {
  const { dispatch } = useDDI();
  const defaults = systemCyp.find(p => p.idBase === idBase);
  if (!defaults) return () => {};
  return () => {
    dispatch({ type: "SET_SYSTEM_CYP_INPUT", idBase, field: "value", value: defaults.value });
    dispatch({ type: "SET_SYSTEM_CYP_INPUT", idBase, field: "ref", value: defaults.ref });
  };
}

export function useResetSystemOther(idBase: string) {
  const { dispatch } = useDDI();
  const defaults = systemOther.find(p => p.idBase === idBase);
  if (!defaults) return () => {};
  return () => {
    dispatch({ type: "SET_SYSTEM_OTHER_INPUT", idBase, field: "value", value: defaults.value });
    dispatch({ type: "SET_SYSTEM_OTHER_INPUT", idBase, field: "ref", value: defaults.ref });
  };
}

export function useResetSystemOptional(idBase: string) {
  const { dispatch } = useDDI();
  const defaults = systemOptional.find(p => p.idBase === idBase);
  if (!defaults) return () => {};
  return () => {
    dispatch({ type: "SET_SYSTEM_OPTIONAL_INPUT", idBase, field: "value", value: defaults.value });
    dispatch({ type: "SET_SYSTEM_OPTIONAL_INPUT", idBase, field: "ref", value: defaults.ref });
  };
}

export function useResetSystemFg() {
  const { dispatch } = useDDI();
  return () => {
    dispatch({ type: "SET_SYSTEM_FG_INPUT", field: "value", value: systemFg.value });
    dispatch({ type: "SET_SYSTEM_FG_INPUT", field: "ref", value: systemFg.ref });
  };
}
