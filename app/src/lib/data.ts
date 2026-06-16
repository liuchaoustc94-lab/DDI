// ============================================================================
// Default Data Tables for DDI Risk Assessment
// Ported from R Shiny defaults
// ============================================================================

// ─── CYP Enzyme Defaults ────────────────────────────────────────────────────
export interface CypEnzyme {
  enzyme: string;
  idBase: string;
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

export const defaultCyp: CypEnzyme[] = [
  { enzyme: "CYP1A2", idBase: "CYP1A2", Ki_uM: null, Ki_ref: "", KI_uM: null, KI_ref: "", kinact_min: null, kinact_ref: "", Emax: 4.0, Emax_ref: "Emax from study 1300942", EC50_uM: null, EC50_ref: "EC50 reported as > 10 from stu", d_scalar: null, d_ref: "" },
  { enzyme: "CYP2A6", idBase: "CYP2A6", Ki_uM: null, Ki_ref: "", KI_uM: null, KI_ref: "", kinact_min: null, kinact_ref: "", Emax: null, Emax_ref: "", EC50_uM: null, EC50_ref: "", d_scalar: null, d_ref: "" },
  { enzyme: "CYP2B6", idBase: "CYP2B6", Ki_uM: null, Ki_ref: "", KI_uM: null, KI_ref: "", kinact_min: null, kinact_ref: "", Emax: 3.8, Emax_ref: "Emax from study 1300942", EC50_uM: 3.0, EC50_ref: "EC50 from study 1300942", d_scalar: null, d_ref: "" },
  { enzyme: "CYP2C8", idBase: "CYP2C8", Ki_uM: null, Ki_ref: "", KI_uM: null, KI_ref: "", kinact_min: null, kinact_ref: "", Emax: 3.0, Emax_ref: "Emax from study 1900152", EC50_uM: null, EC50_ref: "EC50 reported as > 25 from stu", d_scalar: null, d_ref: "" },
  { enzyme: "CYP2C9", idBase: "CYP2C9", Ki_uM: null, Ki_ref: "IC50 reported as > 10, > 10 fro", KI_uM: null, KI_ref: "", kinact_min: null, kinact_ref: "", Emax: 3.3, Emax_ref: "Emax from studies 1900152, :", EC50_uM: 2.2, EC50_ref: "EC50 from studies 1900152, 1", d_scalar: null, d_ref: "" },
  { enzyme: "CYP2C19", idBase: "CYP2C19", Ki_uM: null, Ki_ref: "", KI_uM: null, KI_ref: "", kinact_min: null, kinact_ref: "", Emax: null, Emax_ref: "Emax reported as < 2 from stu", EC50_uM: null, EC50_ref: "EC50 reported as > 25 from stu", d_scalar: null, d_ref: "" },
  { enzyme: "CYP2D6", idBase: "CYP2D6", Ki_uM: null, Ki_ref: "IC50 reported as > 10, > 10 fro", KI_uM: null, KI_ref: "", kinact_min: null, kinact_ref: "", Emax: null, Emax_ref: "", EC50_uM: null, EC50_ref: "", d_scalar: null, d_ref: "" },
  { enzyme: "CYP2E1", idBase: "CYP2E1", Ki_uM: null, Ki_ref: "", KI_uM: null, KI_ref: "", kinact_min: null, kinact_ref: "", Emax: null, Emax_ref: "", EC50_uM: null, EC50_ref: "", d_scalar: null, d_ref: "" },
  { enzyme: "CYP3A4 (midazolam)", idBase: "CYP3A4_midazolam", Ki_uM: null, Ki_ref: "IC50 reported as > 10 from stu", KI_uM: 36.8, KI_ref: "From study(ies) E-53540-10:", kinact_min: 0.011, kinact_ref: "'PKS Enzyme Inhibition' assay", Emax: 26.7, Emax_ref: "Emax from study 1300942", EC50_uM: 1.7, EC50_ref: "EC50 from study 1300942", d_scalar: null, d_ref: "" },
  { enzyme: "CYP3A4 (testosterone)", idBase: "CYP3A4_testosterone", Ki_uM: null, Ki_ref: "", KI_uM: null, KI_ref: "", kinact_min: null, kinact_ref: "", Emax: null, Emax_ref: "", EC50_uM: null, EC50_ref: "", d_scalar: null, d_ref: "" },
];

// ─── Optional Enzymes ───────────────────────────────────────────────────────
export interface OptionalEnzyme {
  label: string;
  idx: number;
}

export const defaultOptional: OptionalEnzyme[] = [
  { label: "Enzyme 1", idx: 1 },
  { label: "Enzyme 2", idx: 2 },
  { label: "Enzyme 3", idx: 3 },
];

// ─── Transporter Defaults ───────────────────────────────────────────────────
export interface Transporter {
  transporter: string;
  Ki_uM: number | null;
  IC50_uM: number | null;
  S_uM: number | null;
  Km_uM: number | null;
  ref: string;
  site: string;
}

export const defaultTr: Transporter[] = [
  { transporter: "P-gp", Ki_uM: null, IC50_uM: 0.34, S_uM: 2, Km_uM: 4, ref: "", site: "gut" },
  { transporter: "BCRP", Ki_uM: null, IC50_uM: null, S_uM: null, Km_uM: null, ref: "", site: "gut" },
  { transporter: "OATP1B1", Ki_uM: null, IC50_uM: 0.57, S_uM: 1, Km_uM: 2, ref: "", site: "hepatic_inlet_unbound" },
  { transporter: "OATP1B3", Ki_uM: null, IC50_uM: 0.84, S_uM: 1, Km_uM: 2, ref: "", site: "hepatic_inlet_unbound" },
  { transporter: "OAT1", Ki_uM: null, IC50_uM: null, S_uM: null, Km_uM: null, ref: "", site: "systemic_unbound" },
  { transporter: "OAT3", Ki_uM: null, IC50_uM: null, S_uM: null, Km_uM: null, ref: "", site: "systemic_unbound" },
  { transporter: "OCT1", Ki_uM: null, IC50_uM: 0.14, S_uM: 10, Km_uM: 5, ref: "", site: "hepatic_inlet_unbound" },
  { transporter: "OCT2", Ki_uM: null, IC50_uM: null, S_uM: null, Km_uM: null, ref: "", site: "systemic_unbound" },
  { transporter: "MRP2", Ki_uM: null, IC50_uM: null, S_uM: null, Km_uM: null, ref: "", site: "systemic_unbound" },
  { transporter: "MATE1", Ki_uM: null, IC50_uM: 5.10, S_uM: 1, Km_uM: 1.5, ref: "", site: "systemic_unbound" },
  { transporter: "MATE2K", Ki_uM: null, IC50_uM: null, S_uM: null, Km_uM: null, ref: "", site: "systemic_unbound" },
  { transporter: "BSEP", Ki_uM: null, IC50_uM: 2.35, S_uM: 1, Km_uM: 1.5, ref: "", site: "systemic_unbound" },
  { transporter: "NTCP", Ki_uM: null, IC50_uM: null, S_uM: null, Km_uM: null, ref: "", site: "hepatic_inlet_unbound" },
];

export type TransporterSite =
  | "gut"
  | "hepatic_inlet"
  | "hepatic_inlet_unbound"
  | "systemic_unbound";

export interface OptionalTransporter {
  label: string;
  idx: number;
  name: string;
  site: TransporterSite;
  threshold: number;
}

export const defaultOptionalTr: OptionalTransporter[] = [
  { label: "Transporter 1", idx: 1, name: "", site: "systemic_unbound", threshold: 0.1 },
  { label: "Transporter 2", idx: 2, name: "", site: "systemic_unbound", threshold: 0.1 },
  { label: "Transporter 3", idx: 3, name: "", site: "systemic_unbound", threshold: 0.1 },
];

export const transporterSiteChoices: Array<{ value: TransporterSite; label: string }> = [
  { value: "gut", label: "Gut / intestine" },
  { value: "hepatic_inlet_unbound", label: "Hepatic inlet unbound (Iin,max,u)" },
  { value: "hepatic_inlet", label: "Hepatic inlet total (Iin,max)" },
  { value: "systemic_unbound", label: "Systemic unbound (Cmax,u)" },
];

// ─── System CYP Parameters ──────────────────────────────────────────────────
export interface SystemCypParam {
  enzyme: string;
  idBase: string;
  paramLabel: string;
  value: number;
  ref: string;
  note: string;
}

export const systemCyp: SystemCypParam[] = [
  { enzyme: "Qent", idBase: "Qent", paramLabel: "Q\u2091\u2099\u209c [mL min\u207B\u00B9]", value: 300, ref: "", note: "18 L hr per 70 kg as described in ICH M12 2017 DDI guidance" },
  { enzyme: "Qh", idBase: "Qh", paramLabel: "Q\u2095 [mL min\u207B\u00B9]", value: 1617, ref: "", note: "Use 97 L hr per 70 kg equals 1617 mL min as described in ICH M12 2020 DDI guidance" },
  { enzyme: "CYP1A2", idBase: "CYP1A2", paramLabel: "k\u2096\u1D48\u1D4D [min\u207B\u00B9]", value: 0.00030, ref: "Liver", note: "Faber and Fuhr, CPT 76(2): 178-184 (2004)" },
  { enzyme: "CYP2A6", idBase: "CYP2A6", paramLabel: "k\u2096\u1D48\u1D4D [min\u207B\u00B9]", value: 0.00030, ref: "Liver", note: "Assumed" },
  { enzyme: "CYP2B6", idBase: "CYP2B6", paramLabel: "k\u2096\u1D48\u1D4D [min\u207B\u00B9]", value: 0.00036, ref: "Liver", note: "Renwick et al., DMD 28(10): 1202-1209 (2000)" },
  { enzyme: "CYP2C8", idBase: "CYP2C8", paramLabel: "k\u2096\u1D48\u1D4D [min\u207B\u00B9]", value: 0.00053, ref: "Liver", note: "Backman et al., DMD 37(12): 2359-2366 (2009)" },
  { enzyme: "CYP2C9", idBase: "CYP2C9", paramLabel: "k\u2096\u1D48\u1D4D [min\u207B\u00B9]", value: 0.00011, ref: "Liver", note: "Renwick et al., DMD 28(10): 1202-1209 (2000)" },
  { enzyme: "CYP2C19", idBase: "CYP2C19", paramLabel: "k\u2096\u1D48\u1D4D [min\u207B\u00B9]", value: 0.00044, ref: "Liver", note: "Renwick et al., DMD 28(10): 1202-1209 (2000)" },
  { enzyme: "CYP2D6", idBase: "CYP2D6", paramLabel: "k\u2096\u1D48\u1D4D [min\u207B\u00B9]", value: 0.00023, ref: "Liver", note: "Liston et al., J Clin Psychopharmacol. 22(2): 169-173 (2003)" },
  { enzyme: "CYP2E1", idBase: "CYP2E1", paramLabel: "k\u2096\u1D48\u1D4D [min\u207B\u00B9]", value: 0.00030, ref: "Liver", note: "Assumed" },
  { enzyme: "CYP3A4", idBase: "CYP3A4", paramLabel: "k\u2096\u1D48\u1D4D [min\u207B\u00B9]", value: 0.00032, ref: "Liver", note: "Rowland-Yeo et al., Eur J Pharmaceut Sci. 43(3): 160-173 (2011)" },
  { enzyme: "CYP3A4 and all other CYPs", idBase: "CYP3A4_all", paramLabel: "k\u2096\u1D48\u1D4D,\u1D4C\u1D3C\u1D4D [min\u207B\u00B9]", value: 0.00048, ref: "Intestine", note: "Greenblatt et al., CPT 74: 121-129 (2003) and Darwich et al., DMD 42(12): 2016-2022 (2014)" },
];

// ─── System Other Parameters (fm values) ────────────────────────────────────
export interface SystemOtherParam {
  enzyme: string;
  idBase: string;
  value: number;
  ref: string;
  note: string;
}

export const systemOther: SystemOtherParam[] = [
  { enzyme: "CYP1A2", idBase: "fm_CYP1A2", value: 0.8, ref: "theoph", note: "Obach RS (2006) The Utility of in Vitro Cytochrome P450 Inhibition Data in the Prediction of Drug-Drug Interactions. JPET 316:336-348" },
  { enzyme: "CYP2A6", idBase: "fm_CYP2A6", value: 1.0, ref: "no sub", note: "" },
  { enzyme: "CYP2B6", idBase: "fm_CYP2B6", value: 0.64, ref: "efavire", note: "Fahmi OA et al. (2016) Evaluation of CYP2B6 Induction and Prediction of Clinical Drug-Drug Interactions. Drug Metab Dispos 44(10):1720-30" },
  { enzyme: "CYP2C8", idBase: "fm_CYP2C8", value: 0.71, ref: "repagl", note: "Gan J et al. (2010) Repaglinide-gemfibrozil drug interaction. Br J Clin Pharmacol 70:870-880" },
  { enzyme: "CYP2C9", idBase: "fm_CYP2C9", value: 0.91, ref: "S-War", note: "Obach RS (2006) The Utility of in Vitro Cytochrome P450 Inhibition Data in the Prediction of Drug-Drug Interactions. JPET 316:336-348" },
  { enzyme: "CYP2C19", idBase: "fm_CYP2C19", value: 0.87, ref: "omepr", note: "Obach RS (2006) The Utility of in Vitro Cytochrome P450 Inhibition Data in the Prediction of Drug-Drug Interactions. JPET 316:336-348" },
  { enzyme: "CYP2D6", idBase: "fm_CYP2D6", value: 0.9, ref: "desipr", note: "Obach RS (2006) The Utility of in Vitro Cytochrome P450 Inhibition Data in the Prediction of Drug-Drug Interactions. JPET 316:336-348" },
  { enzyme: "CYP2E1", idBase: "fm_CYP2E1", value: 1.0, ref: "no sub", note: "" },
  { enzyme: "CYP3A4", idBase: "fm_CYP3A4", value: 0.9, ref: "midazo", note: "Einolf HJ et al. (2013) Evaluation of various static and dynamic modeling methods to predict clinical CYP3A induction." },
];

// ─── System Optional Enzymes ────────────────────────────────────────────────
export const systemOptional: SystemOtherParam[] = [
  { enzyme: "Enzyme 1", idBase: "opt1", value: 1, ref: "no sub", note: "" },
  { enzyme: "Enzyme 2", idBase: "opt2", value: 1, ref: "no sub", note: "" },
  { enzyme: "Enzyme 3", idBase: "opt3", value: 1, ref: "no sub", note: "" },
];

// ─── System Fg ──────────────────────────────────────────────────────────────
export const systemFg: SystemOtherParam = {
  enzyme: "Fg",
  idBase: "Fg",
  value: 0.51,
  ref: "midazo",
  note: "Vieira et al. (2013) Evaluation of Various Static In vitro-In vivo Extrapolation Models for Risk Assessment of CYP3A Inhibition Potential.",
};
