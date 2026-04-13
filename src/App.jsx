import React, { useEffect, useState } from "react";
import {
  Area, AreaChart, ComposedChart,
  Line, LineChart,
  ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

/* ─── Config ─────────────────────────────────────────────────────────────── */

const SNAPSHOT_MODE = false;
const SNAPSHOT_TIME = "18:31:34";
const BRAND = { name: "VITAGEMINA", subtitle: "Clinical AI Twin System · v0.1.0" };

const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/* ─── Themes ─────────────────────────────────────────────────────────────── */

const THEMES = {
  light: {
    bg: "#eef2f7",
    surface: "#ffffff",
    surfaceAlt: "#f5f8fc",
    card: "#ffffff",
    cardSoft: "#edf1f7",
    border: "#ccd5e0",
    borderSoft: "#dce4ef",
    title: "#0b1a2c",
    text: "#1a2d42",
    subtext: "#3a5068",
    muted: "#607a90",
    faint: "#8fa5ba",
    header: "rgba(255,255,255,0.96)",
    axis: "#607a90",
    chartBg: "#f8fafd",
    stripBg: "#e4edf8",
    stripText: "#0c3260",
  },
  dark: {
    bg: "#07101c",
    surface: "#0c1825",
    surfaceAlt: "#091420",
    card: "#0c1825",
    cardSoft: "#111f30",
    border: "#1a3048",
    borderSoft: "#152840",
    title: "#e0eaf5",
    text: "#bfcfe0",
    subtext: "#8aaec8",
    muted: "#5a7a90",
    faint: "#3a5060",
    header: "rgba(7,16,28,0.97)",
    axis: "#5a7a90",
    chartBg: "#060f1a",
    stripBg: "#08162a",
    stripText: "#6aaedf",
  },
};

/* ─── Data ───────────────────────────────────────────────────────────────── */

const GENOMICS = { CYP2D6: "UM", BRCA2: "WT", TPMT: "IM", DPYD: "PM", VKORC1: "VAR", "HLA-B": "WT" };

const STATUS_COLOR = { UM: "#22d3ee", WT: "#4ade80", IM: "#facc15", PM: "#f87171", VAR: "#fb923c" };

const GENOMIC_ROWS = [
  { gene: "CYP2D6", status: "UM", impact: "Accelerated drug clearance via CYP2D6 pathway" },
  { gene: "BRCA2",  status: "WT", impact: "No elevated hereditary cancer risk" },
  { gene: "TPMT",   status: "IM", impact: "Moderate thiopurine sensitivity — reduce dose" },
  { gene: "DPYD",   status: "PM", impact: "Fluoropyrimidine (5-FU) toxicity — critical contraindication" },
  { gene: "VKORC1", status: "VAR", impact: "Reduced warfarin dose requirement" },
  { gene: "HLA-B",  status: "WT", impact: "No abacavir / carbamazepine hypersensitivity" },
];

const ORGAN_BASE = [
  { axis: "Hepatic",   value: 74, threshold: 75 },
  { axis: "Renal",     value: 86, threshold: 70 },
  { axis: "Cardiac",   value: 89, threshold: 70 },
  { axis: "Neuro",     value: 62, threshold: 70 },
  { axis: "Immune",    value: 82, threshold: 70 },
  { axis: "Metabolic", value: 56, threshold: 70 },
];

const BLOOD_PANEL = [
  { label: "WBC",        val: "6.8",  unit: "K/µL",    status: "normal" },
  { label: "HbA1c",      val: "7.1",  unit: "%",       status: "warn"   },
  { label: "Creatinine", val: "0.92", unit: "mg/dL",   status: "normal" },
  { label: "LDL-C",      val: "143",  unit: "mg/dL",   status: "warn"   },
  { label: "CRP",        val: "3.8",  unit: "mg/L",    status: "alert"  },
  { label: "eGFR",       val: "84",   unit: "mL/min",  status: "normal" },
];

const DRUG_PROFILES = {
  "Carboplatin AUC5": {
    ka: 8.0, keStd: 0.22, F: 1.0, Vd: 15, dose: 450,
    keAdjust: (g) => g.TPMT === "IM" ? 0.185 : 0.22,
    toxLine: 80, therMin: 10, therMax: 60, timeMax: 12,
    yLabel: "µg/mL",
    genomicNote: "TPMT intermediate metabolizer status predicts extended exposure and elevated myelosuppression risk.",
    verdictType: "warn",
    verdictText: "TPMT IM detected — recommend 15% dose reduction and enhanced CBC monitoring on days 7 and 14.",
    efficacy: 79, toxRisk: 22, halfLife: 2.4, optDose: 85,
  },
  "Warfarin 5mg": {
    ka: 1.2, keStd: 0.09, F: 0.93, Vd: 10, dose: 5,
    keAdjust: (g) => g.CYP2D6 === "UM" ? 0.12 : 0.09,
    toxLine: 0.8, therMin: 0.1, therMax: 0.45, timeMax: 24,
    yLabel: "mg/L",
    genomicNote: "CYP2D6 UM increases clearance; VKORC1 VAR lowers dose requirement. Close INR monitoring required.",
    verdictType: "ok",
    verdictText: "Warfarin tolerated in this demo scenario. Review INR and dose-adjust clinically.",
    efficacy: 87, toxRisk: 10, halfLife: 7.7, optDose: 110,
  },
  "Capecitabine 1250mg": {
    ka: 2.0, keStd: 0.8, F: 0.8, Vd: 35, dose: 1250,
    keAdjust: (g) => g.DPYD === "PM" ? 0.065 : 0.8,
    toxLine: 120, therMin: 20, therMax: 80, timeMax: 12,
    yLabel: "ng/mL (5-FU)",
    genomicNote: "DPYD poor metabolizer status predicts major fluoropyrimidine toxicity at standard dosing.",
    verdictType: "critical",
    verdictText: "CONTRAINDICATED — DPYD PM detected. Major dose reduction or alternative therapy is required.",
    efficacy: 68, toxRisk: 91, halfLife: 0.8, optDose: 25,
  },
  "Imatinib 400mg": {
    ka: 0.4, keStd: 0.038, F: 0.98, Vd: 450, dose: 400,
    keAdjust: (g) => g.CYP2D6 === "UM" ? 0.052 : 0.038,
    toxLine: 4500, therMin: 1000, therMax: 3000, timeMax: 48,
    yLabel: "ng/mL",
    genomicNote: "CYP2D6 UM modestly increases clearance. Trough concentration remains in the expected therapeutic band.",
    verdictType: "ok",
    verdictText: "Imatinib acceptable in this demo scenario. Standard monitoring applies.",
    efficacy: 84, toxRisk: 12, halfLife: 18, optDose: 100,
  },
  "Metformin 500mg": {
    ka: 0.9, keStd: 0.14, F: 0.55, Vd: 300, dose: 500,
    keAdjust: () => 0.14,
    toxLine: 5.0, therMin: 0.5, therMax: 2.5, timeMax: 24,
    yLabel: "µg/mL",
    genomicNote: "No major pharmacogenomic warnings in this scenario. Renal function adequate for routine monitoring.",
    verdictType: "ok",
    verdictText: "Metformin acceptable with routine renal monitoring.",
    efficacy: 82, toxRisk: 5, halfLife: 6.2, optDose: 100,
  },
  "Paclitaxel 175mg/m²": {
    // timeMax 12h: peak at ~0.6h then clear fall — fills chart better than 24h
    ka: 5.0, keStd: 0.18, F: 1.0, Vd: 500, dose: 300,
    keAdjust: (g) => g.CYP2D6 === "UM" ? 0.22 : 0.18,
    toxLine: 0.22, therMin: 0.05, therMax: 0.15, timeMax: 12,
    yLabel: "µmol/L",
    genomicNote: "CYP2D6 UM may accelerate paclitaxel clearance marginally. Neutropenia monitoring remains standard.",
    verdictType: "warn",
    verdictText: "Paclitaxel acceptable at standard dose — monitor neutrophil count closely on days 8 and 15.",
    efficacy: 76, toxRisk: 34, halfLife: 5.8, optDose: 100,
  },
  "Dexamethasone 4mg": {
    ka: 2.5, keStd: 0.12, F: 0.85, Vd: 70, dose: 4,
    keAdjust: (g) => g.CYP2D6 === "UM" ? 0.15 : 0.12,
    toxLine: 0.3, therMin: 0.02, therMax: 0.18, timeMax: 24,
    yLabel: "µg/mL",
    genomicNote: "No clinically significant pharmacogenomic interactions for dexamethasone in this profile. Glucose monitoring warranted given existing CGM findings.",
    verdictType: "ok",
    verdictText: "Dexamethasone acceptable. Monitor glucose — risk of transient hyperglycaemia given borderline HbA1c.",
    efficacy: 88, toxRisk: 8, halfLife: 4.0, optDose: 100,
  },
  "Ondansetron 8mg": {
    ka: 3.0, keStd: 0.14, F: 0.60, Vd: 160, dose: 8,
    keAdjust: (g) => g.CYP2D6 === "UM" ? 0.20 : 0.14,
    toxLine: 0.12, therMin: 0.01, therMax: 0.07, timeMax: 12,
    yLabel: "µg/mL",
    genomicNote: "CYP2D6 UM significantly increases ondansetron clearance, reducing plasma exposure — antiemetic effect may be attenuated.",
    verdictType: "warn",
    verdictText: "CYP2D6 UM: ondansetron exposure likely reduced. Consider granisetron or palonosetron as alternatives.",
    efficacy: 61, toxRisk: 6, halfLife: 3.5, optDose: 75,
  },
  "Pembrolizumab 200mg": {
    // IV bolus model — ka is very high (near-instant delivery), no absorption delay.
    // ke = 0.004/h → half-life 173h (≈7 days). Starts at ~33 µg/mL, declines to
    // ~4 µg/mL at 504h — a clear, readable exponential decay across the window.
    ka: 50.0, keStd: 0.004, F: 1.0, Vd: 6, dose: 200,
    keAdjust: () => 0.004,
    toxLine: 45, therMin: 5, therMax: 30, timeMax: 504,
    yLabel: "µg/mL",
    genomicNote: "No direct pharmacogenomic interactions known. TMB and MSI status would be key efficacy biomarkers in a real clinical context.",
    verdictType: "ok",
    verdictText: "Pembrolizumab Q3W is acceptable pending tumour biomarker assessment. Immune-related adverse event monitoring required.",
    efficacy: 72, toxRisk: 18, halfLife: 173, optDose: 100,
  },
  "Cyclophosphamide 600mg": {
    // timeMax 12h: full rise-and-fall within window (was 24h which made tail invisible)
    ka: 4.0, keStd: 0.15, F: 1.0, Vd: 38, dose: 600,
    keAdjust: (g) => g.CYP2D6 === "UM" ? 0.19 : 0.15,
    toxLine: 50, therMin: 5, therMax: 35, timeMax: 12,
    yLabel: "µg/mL",
    genomicNote: "CYP2D6 UM may enhance activation of cyclophosphamide to its active 4-OH metabolite, potentially increasing both efficacy and haematological toxicity.",
    verdictType: "warn",
    verdictText: "CYP2D6 UM: enhanced activation expected — monitor for haematological toxicity and consider 10% dose reduction.",
    efficacy: 74, toxRisk: 41, halfLife: 6.0, optDose: 90,
  },
  "Tamoxifen 20mg": {
    // dose in µg (20mg = 20000µg), Vd in L → output µg/L = ng/mL
    // Peak ~5 ng/mL, therapeutic trough 2–6 ng/mL, half-life ~7 days
    ka: 0.8, keStd: 0.004, F: 0.99, Vd: 4000, dose: 20000,
    keAdjust: (g) => g.CYP2D6 === "UM" ? 0.005 : 0.004,
    toxLine: 9, therMin: 1.5, therMax: 6, timeMax: 336,
    yLabel: "ng/mL",
    genomicNote: "CYP2D6 UM may produce elevated endoxifen (active metabolite), potentially increasing both efficacy and side-effect risk. BRCA2 WT reduces hereditary cancer risk.",
    verdictType: "ok",
    verdictText: "Tamoxifen acceptable in this profile. CYP2D6 UM may enhance endoxifen conversion — monitor for thromboembolic events.",
    efficacy: 80, toxRisk: 14, halfLife: 192, optDose: 100,
  },
  "Cisplatin 75mg/m²": {
    ka: 6.0, keStd: 0.25, F: 1.0, Vd: 12, dose: 130,
    keAdjust: (g) => g.TPMT === "IM" ? 0.21 : 0.25,
    toxLine: 6.0, therMin: 0.5, therMax: 3.5, timeMax: 12,
    yLabel: "µg/mL (free Pt)",
    genomicNote: "TPMT IM may modestly reduce tolerance to platinum-related myelosuppression. Renal function is a key determinant of cisplatin clearance.",
    verdictType: "warn",
    verdictText: "Cisplatin: TPMT IM warrants enhanced haematological monitoring. Pre-hydration and antiemetics mandatory.",
    efficacy: 77, toxRisk: 38, halfLife: 1.5, optDose: 90,
  },
};

const VERDICT_COLOR = { ok: "#4ade80", warn: "#facc15", critical: "#f87171" };
const VERDICT_BG_LIGHT = { ok: "#f0fdf4", warn: "#fffbeb", critical: "#fff1f2" };
const VERDICT_BG_DARK  = { ok: "#0a1e12", warn: "#1a1500", critical: "#1c0808" };
const VERDICT_TEXT     = { ok: "#15803d", warn: "#b45309", critical: "#dc2626" };

/* ─── PK Curve ───────────────────────────────────────────────────────────── */

function computePKCurve(profile, genomics) {
  const { ka, keStd, F, Vd, dose, timeMax } = profile;
  const ke = profile.keAdjust(genomics);
  return Array.from({ length: 81 }, (_, i) => {
    const t = (i / 80) * timeMax;
    const calc = (k) => {
      const d = Math.abs(ka - k);
      return d < 1e-6 ? 0 : Math.max(0, (F * dose * ka) / (Vd * d) * (Math.exp(-k * t) - Math.exp(-ka * t)));
    };
    return { t: +t.toFixed(2), patient: +calc(ke).toFixed(4), population: +calc(keStd).toFixed(4) };
  });
}

/* ─── ECG ────────────────────────────────────────────────────────────────── */

// Display rate: 1 sample per 40ms = 25 samples/sec.
// samplesPerBeat at 25/sec: round(1500/bpm) → 21 at 70 BPM, 19 at 80 BPM.
// Buffer of 80 samples → ~3.5 beats visible. Scrolls in 3.2 s of real time.
function ecgValue(globalI, bpm) {
  const samplesPerBeat = Math.max(12, Math.round(1500 / bpm));
  const p = (globalI % samplesPerBeat) / samplesPerBeat;
  let v = 0;
  v += 0.12 * Math.exp(-((p - 0.10) ** 2) / 0.0018);
  v -= 0.06 * Math.exp(-((p - 0.22) ** 2) / 0.0002);
  v += 0.95 * Math.exp(-((p - 0.25) ** 2) / 0.0001);
  v -= 0.10 * Math.exp(-((p - 0.28) ** 2) / 0.0002);
  v += 0.20 * Math.exp(-((p - 0.45) ** 2) / 0.0025);
  v += (Math.random() - 0.5) * 0.014;
  return +v.toFixed(3);
}

/* ─── Hooks ──────────────────────────────────────────────────────────────── */

// Returns bpm only — hrAlert is derived in render (bpm > 100) to avoid
// the state-batching race that caused tachycardia to show at 75 BPM.
function useHeartRate() {
  const [bpm, setBpm] = useState(78);
  useEffect(() => {
    if (SNAPSHOT_MODE) return;
    const id = setInterval(() => {
      setBpm(() => {
        const spike = Math.random() < 0.03;
        return spike ? Math.round(rand(108, 130)) : Math.round(rand(68, 86));
      });
    }, 700);
    return () => clearInterval(id);
  }, []);
  return bpm;
}

function useECG(bpm) {
  const [ecg, setEcg] = useState(() =>
    Array.from({ length: 150 }, (_, i) => ({ i, v: ecgValue(i, bpm) }))
  );
  useEffect(() => {
    if (SNAPSHOT_MODE) return;
    const id = setInterval(() => {
      setEcg((prev) => {
        const gi = prev[prev.length - 1].i + 1;
        return [...prev.slice(1), { i: gi, v: ecgValue(gi, bpm) }];
      });
    }, 40);
    return () => clearInterval(id);
  }, [bpm]);
  return ecg;
}

function useGlucose() {
  const [data, setData] = useState(() =>
    Array.from({ length: 40 }, (_, i) => ({
      t: i,
      mg: +(107.2 + Math.sin(i / 7) * 0.1 - (39 - i) * 0.01).toFixed(1),
    }))
  );
  const [warn, setWarn] = useState(null);
  useEffect(() => {
    if (SNAPSHOT_MODE) return;
    const id = setInterval(() => {
      setData((prev) => {
        const last = prev[prev.length - 1];
        const next = clamp(last.mg + (Math.random() - 0.47) * 3.0, 52, 230);
        setWarn(next < 70 ? "Hypoglycaemia" : next > 180 ? "Hyperglycaemia" : null);
        return [...prev.slice(-39), { t: last.t + 1, mg: +next.toFixed(1) }];
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return { data, warn };
}

function useOrgans() {
  const [organs, setOrgans] = useState(ORGAN_BASE);
  useEffect(() => {
    if (SNAPSHOT_MODE) return;
    const id = setInterval(() => {
      setOrgans((prev) => prev.map((o) => ({
        ...o,
        value: +clamp(o.value + (Math.random() - 0.5) * 0.8, 30, 99).toFixed(1),
      })));
    }, 2800);
    return () => clearInterval(id);
  }, []);
  return organs;
}

function usePredictions() {
  const [events, setEvents] = useState([
    { id: "arr",  label: "Arrhythmia risk",  prob: 12, hrs: 4.2, sev: "low"  },
    { id: "gluc", label: "Glucose dip <70",  prob: 38, hrs: 1.8, sev: "mid"  },
    { id: "crp",  label: "CRP spike",        prob: 59, hrs: 7.0, sev: "high" },
  ]);
  useEffect(() => {
    if (SNAPSHOT_MODE) return;
    const id = setInterval(() => {
      setEvents((prev) => prev.map((ev) => ({
        ...ev,
        prob: +clamp(ev.prob + (Math.random() - 0.48) * 1.1, 2, 97).toFixed(1),
        hrs: +Math.max(0.05, ev.hrs - 0.002).toFixed(2),
      })));
    }, 3000);
    return () => clearInterval(id);
  }, []);
  return events;
}

function useOllama() {
  const [state, setState] = useState(SNAPSHOT_MODE ? { status: "offline", model: null } : { status: "probing", model: null });
  useEffect(() => {
    if (SNAPSHOT_MODE) return;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 1800);
    fetch("http://localhost:11434/api/tags", { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => { clearTimeout(timer); setState({ status: "online", model: (d.models || [])[0]?.name || "ready" }); })
      .catch(() => setState({ status: "offline", model: null }));
    return () => clearTimeout(timer);
  }, []);
  return state;
}

const SIM_STEPS = [
  "Loading genomic variant table…",
  "Mapping pharmacokinetic features…",
  "Running one-compartment PK model…",
  "Applying patient-specific adjustments…",
  "Estimating pharmacodynamic response…",
  "Checking toxicity thresholds…",
  "Generating clinical summary…",
];

function useDrugSim(selectedDrug) {
  const initProfile = DRUG_PROFILES[selectedDrug];
  const initCurve = SNAPSHOT_MODE && initProfile ? computePKCurve(initProfile, GENOMICS) : null;

  const [phase, setPhase]       = useState(SNAPSHOT_MODE ? "done" : "idle");
  const [progress, setProgress] = useState(SNAPSHOT_MODE ? 100 : 0);
  const [pkData, setPkData]     = useState(initCurve);
  const [result, setResult]     = useState(
    SNAPSHOT_MODE && initProfile && initCurve
      ? { ...initProfile, patientPeak: Math.max(...initCurve.map((c) => c.patient)) }
      : null
  );

  const runSim = () => {
    const profile = DRUG_PROFILES[selectedDrug];
    if (!profile) return;
    setPhase("simulating"); setProgress(0); setResult(null); setPkData(null);
    let p = 0;
    const id = setInterval(() => {
      p += rand(12, 22);
      setProgress(Math.min(p, 100));
      if (p >= 100) {
        clearInterval(id);
        const curve = computePKCurve(profile, GENOMICS);
        setPkData(curve);
        setResult({ ...profile, patientPeak: Math.max(...curve.map((c) => c.patient)) });
        setPhase("done");
      }
    }, 20);
  };

  const reset = () => {
    if (SNAPSHOT_MODE) return;
    setPhase("idle"); setProgress(0); setPkData(null); setResult(null);
  };

  useEffect(() => {
    if (!SNAPSHOT_MODE) return;
    const profile = DRUG_PROFILES[selectedDrug];
    if (!profile) return;
    const curve = computePKCurve(profile, GENOMICS);
    setPkData(curve);
    setResult({ ...profile, patientPeak: Math.max(...curve.map((c) => c.patient)) });
    setPhase("done"); setProgress(100);
  }, [selectedDrug]);

  return { phase, progress, pkData, result, runSim, reset };
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function PulseDot({ active, color = "#22d3ee" }) {
  return (
    <span style={{
      display: "inline-block", width: 8, height: 8, borderRadius: "50%",
      background: active ? color : "#607a90", flexShrink: 0,
      boxShadow: active ? `0 0 0 3px ${color}25` : "none",
      animation: active ? "vg-pulse 2s ease-in-out infinite" : "none",
    }} />
  );
}

function Tag({ label, color }) {
  return (
    <span style={{
      padding: "3px 9px", borderRadius: 999, fontSize: 11, fontWeight: 700,
      background: `${color}1a`, color, border: `1px solid ${color}38`,
      whiteSpace: "nowrap", letterSpacing: "0.04em",
      fontFamily: "'DM Mono', 'Fira Mono', monospace",
    }}>{label}</span>
  );
}

function PKTooltip({ active, payload, label, profile, theme }) {
  if (!active || !payload?.length || !profile) return null;
  const pat = payload.find((p) => p.dataKey === "patient")?.value;
  const pop = payload.find((p) => p.dataKey === "population")?.value;
  const over = pat > profile.toxLine;
  return (
    <div style={{
      background: theme.surface, border: `1px solid ${theme.border}`,
      borderRadius: 8, padding: "10px 13px", fontSize: 12,
      color: theme.text, lineHeight: 1.55,
      boxShadow: "0 8px 20px rgba(0,0,0,0.18)",
    }}>
      <div style={{ color: theme.muted, marginBottom: 5, fontFamily: "'DM Mono', monospace" }}>t = {label}h</div>
      {pop != null && <div style={{ color: theme.subtext }}>Population avg: <span style={{ fontFamily: "'DM Mono', monospace" }}>{Number(pop).toFixed(3)}</span></div>}
      {pat != null && (
        <div style={{ color: over ? "#f87171" : "#22d3ee", fontWeight: 700 }}>
          Patient (Dario): <span style={{ fontFamily: "'DM Mono', monospace" }}>{Number(pat).toFixed(3)}</span>
          {over ? "  ⚠ above toxicity" : ""}
        </div>
      )}
    </div>
  );
}

/* ─── Custom SVG Radar ───────────────────────────────────────────────────── */

function OrganRadar({ organs, theme }) {
  const W = 220, H = 200, cx = 110, cy = 100, r = 78;
  const n = organs.length;
  const angles = organs.map((_, i) => (i / n) * 2 * Math.PI - Math.PI / 2);

  const pt = (angle, radius) => [
    cx + radius * Math.cos(angle),
    cy + radius * Math.sin(angle),
  ];

  const gridLevels = [25, 50, 75, 100];
  const valuePts = organs.map((o, i) => pt(angles[i], (o.value / 100) * r));
  const shapePath = valuePts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ") + "Z";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ display: "block" }}>
      {/* Grid polygons */}
      {gridLevels.map((lvl) => {
        const pts = angles.map((a) => pt(a, (lvl / 100) * r));
        return (
          <polygon key={lvl}
            points={pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ")}
            fill="none" stroke={theme.border} strokeWidth={lvl === 100 ? 1 : 0.5}
          />
        );
      })}
      {/* Axis spokes */}
      {angles.map((a, i) => {
        const end = pt(a, r);
        return <line key={i} x1={cx} y1={cy} x2={end[0].toFixed(1)} y2={end[1].toFixed(1)} stroke={theme.border} strokeWidth={0.5} />;
      })}
      {/* Data fill */}
      <path d={shapePath} fill="#22d3ee" fillOpacity={0.2} stroke="#22d3ee" strokeWidth={2.5} strokeLinejoin="round" />
      {/* Data dots */}
      {valuePts.map((p, i) => (
        <circle key={i} cx={p[0].toFixed(1)} cy={p[1].toFixed(1)} r={3.5}
          fill="#22d3ee" stroke={theme.card} strokeWidth={1.5} />
      ))}
      {/* Labels */}
      {organs.map((o, i) => {
        const a = angles[i];
        const lx = cx + (r + 17) * Math.cos(a);
        const ly = cy + (r + 17) * Math.sin(a);
        const below = o.value < o.threshold;
        const anchor = Math.abs(Math.cos(a)) < 0.2 ? "middle" : Math.cos(a) > 0 ? "start" : "end";
        return (
          <text key={o.axis} x={lx.toFixed(1)} y={ly.toFixed(1)}
            textAnchor={anchor} dominantBaseline="middle"
            fontSize={9.5} fontWeight={below ? 700 : 400}
            fill={below ? "#f97316" : theme.axis}
            fontFamily="'DM Sans', system-ui, sans-serif"
          >
            {o.axis}
          </text>
        );
      })}
    </svg>
  );
}

/* ─── Main App ───────────────────────────────────────────────────────────── */

export default function App() {
  const [uiMode, setUiMode]         = useState("light");
  const [selectedDrug, setSelectedDrug] = useState("Carboplatin AUC5");
  const [time, setTime]             = useState(new Date());

  const theme  = THEMES[uiMode];
  const isDark = uiMode === "dark";

  const bpm                     = useHeartRate();
  const hrAlert                 = bpm > 100;
  const ecg                     = useECG(bpm);
  const { data: glucData, warn: glucWarn } = useGlucose();
  const organs                  = useOrgans();
  const predictions             = usePredictions();
  const ollama                  = useOllama();
  const { phase, progress, pkData, result, runSim, reset } = useDrugSim(selectedDrug);

  useEffect(() => {
    if (SNAPSHOT_MODE) return;
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Fix browser tab + print header (was showing CRA default "React App")
  useEffect(() => { document.title = "VITAGEMINA — Clinical AI Twin System"; }, []);

  const latestGluc  = glucData[glucData.length - 1]?.mg.toFixed(1) ?? "--";
  const belowThresh = organs.filter((o) => o.value < o.threshold);
  const simStep     = SIM_STEPS[Math.min(Math.floor(progress / (100 / SIM_STEPS.length)), SIM_STEPS.length - 1)];

  const card = {
    background: theme.card, border: `1px solid ${theme.border}`,
    borderRadius: 12, padding: 18,
    boxShadow: isDark ? "none" : "0 1px 4px rgba(10,25,50,0.07)",
  };

  const genomicRowBg = (s) => {
    if (s === "PM")  return isDark ? "#1c0a0a" : "#fff1f2";
    if (s === "VAR") return isDark ? "#1b1204" : "#fffbeb";
    if (s === "IM")  return isDark ? "#191400" : "#fefce8";
    return theme.surfaceAlt;
  };

  return (
    <div style={{ background: theme.bg, color: theme.text, minHeight: "100vh", fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        select, button { font: inherit; }

        @keyframes vg-pulse  { 0%,100%{box-shadow:0 0 0 3px rgba(34,211,238,.25)} 50%{box-shadow:0 0 0 7px rgba(34,211,238,.06)} }
        @keyframes vg-shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes vg-slide  { from{opacity:0;transform:translateY(-5px)} to{opacity:1;transform:translateY(0)} }
        @keyframes vg-popIn  { from{opacity:0;transform:scale(.97)} to{opacity:1;transform:scale(1)} }

        .vg-card { transition: box-shadow .2s; }
        .vg-select {
          appearance: none; -webkit-appearance: none; cursor: pointer;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' fill='none' stroke='%23607a90' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 12px center;
          padding-right: 34px !important;
          transition: border-color .15s, box-shadow .15s;
        }
        .vg-select:focus  { outline: none; box-shadow: 0 0 0 3px rgba(34,211,238,.25); border-color: #22d3ee !important; }
        .vg-select:hover  { border-color: #22d3ee !important; }

        .vg-btn-run {
          background: linear-gradient(135deg, #0369a1 0%, #22d3ee 100%);
          background-size: 200% 100%; color: #fff;
          border: none; border-radius: 8px;
          padding: 10px 18px; font-size: 13px; font-weight: 700;
          cursor: pointer; white-space: nowrap;
          transition: filter .15s, transform .1s;
        }
        .vg-btn-run:hover:not(:disabled) { filter: brightness(1.1); }
        .vg-btn-run:active:not(:disabled) { transform: scale(.97); }
        .vg-btn-run.running { animation: vg-shimmer 1.4s linear infinite; cursor: default; }
        .vg-btn-run:disabled { opacity: .5; cursor: default; }

        .vg-btn-ghost {
          background: transparent; border-radius: 8px;
          padding: 10px 14px; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: background .15s;
        }
        .vg-btn-ghost:hover:not(:disabled) { background: rgba(34,211,238,.08); }
        .vg-btn-ghost:active { transform: scale(.97); }
        .vg-btn-ghost:disabled { opacity: .4; cursor: default; }

        .vg-toggle-track {
          width: 40px; height: 22px; border-radius: 999px;
          position: relative; cursor: pointer; border: none;
          transition: background .25s;
        }
        .vg-toggle-thumb {
          position: absolute; top: 3px;
          width: 16px; height: 16px; border-radius: 50%; background: #fff;
          box-shadow: 0 1px 4px rgba(0,0,0,.3);
          transition: left .22s cubic-bezier(.4,0,.2,1);
        }

        .vg-bar-fill {
          height: 100%; border-radius: 999px;
          background: linear-gradient(90deg, #0369a1, #22d3ee, #a78bfa);
          background-size: 200% 100%;
          animation: vg-shimmer 1.3s linear infinite;
        }

        .vg-alert { animation: vg-slide .25s ease; }
        .vg-sim-result { animation: vg-popIn .3s ease; }

        @media (max-width: 1100px) {
          .vg-col3 { grid-template-columns: 1fr !important; }
          .vg-col2 { grid-template-columns: 1fr !important; }
          .vg-col2-wide { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 720px) {
          .vg-metric-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .vg-blood-grid  { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media print {
          header { position: static !important; box-shadow: none !important; }
          .vg-col3 { grid-template-columns: 1fr 1fr 1fr !important; }
          .vg-col2 { grid-template-columns: 1fr 1fr !important; }
          .vg-col2-wide { grid-template-columns: 1.45fr 0.85fr !important; }
          .vg-metric-grid { grid-template-columns: repeat(4, 1fr) !important; }
          .vg-blood-grid  { grid-template-columns: repeat(3, 1fr) !important; }
        }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 20,
        background: theme.header, borderBottom: `1px solid ${theme.border}`,
        backdropFilter: "blur(10px)", padding: "11px 20px",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>

          <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
            <div style={{
              width: 34, height: 34, borderRadius: "50%",
              border: "2px solid #22d3ee", display: "grid", placeItems: "center",
              fontSize: 18, color: "#22d3ee", userSelect: "none",
            }}>⊕</div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: theme.title, letterSpacing: "0.04em" }}>{BRAND.name}</div>
              <div style={{ fontSize: 11, color: theme.muted, marginTop: 1 }}>{BRAND.subtitle}</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>

            {/* Ollama probe */}
            <div style={{
              display: "flex", alignItems: "center", gap: 7,
              border: `1px solid ${theme.border}`, background: theme.surface,
              borderRadius: 999, padding: "6px 12px", fontSize: 12,
              color: ollama.status === "online" ? "#4ade80" : theme.subtext,
            }}>
              <PulseDot active={ollama.status === "online"} color="#4ade80" />
              {ollama.status === "probing"  && "Probing local AI…"}
              {ollama.status === "online"   && `Local AI online · ${ollama.model}`}
              {ollama.status === "offline"  && "Optional local AI offline"}
            </div>

            {/* Twin active */}
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: theme.subtext }}>
              <PulseDot active color="#22d3ee" />
              <span style={{ color: "#22d3ee", fontWeight: 700 }}>Twin active</span>
              <span style={{ fontFamily: "'DM Mono', monospace" }}>
                {SNAPSHOT_MODE ? SNAPSHOT_TIME : time.toLocaleTimeString("en-GB", { hour12: false })}
              </span>
              <span>· Dario Arian · <span style={{ fontFamily: "'DM Mono', monospace" }}>#PT-00472</span></span>
            </div>

            {/* Dark / light toggle */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <span style={{ color: theme.muted, userSelect: "none" }}>☀</span>
              <button
                className="vg-toggle-track"
                style={{ background: isDark ? "#22d3ee" : theme.borderSoft }}
                onClick={() => setUiMode(isDark ? "light" : "dark")}
                aria-label="Toggle dark mode"
              >
                <span className="vg-toggle-thumb" style={{ left: isDark ? 21 : 3 }} />
              </button>
              <span style={{ color: theme.muted, userSelect: "none" }}>☽</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Organ alert strip ──────────────────────────────────────────────── */}
      {belowThresh.length > 0 && (
        <div className="vg-alert" style={{
          padding: "9px 20px",
          background: isDark ? "#1b1306" : "#fff7ed",
          borderBottom: `1px solid ${isDark ? "#5c2e14" : "#fed7aa"}`,
          display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center",
          fontSize: 12, color: isDark ? "#fb923c" : "#9a3412",
        }}>
          <strong>⚠ Organ index below threshold:</strong>
          {belowThresh.map((o) => <Tag key={o.axis} label={`${o.axis} ${o.value}/${o.threshold}`} color="#f97316" />)}
        </div>
      )}

      {/* ── Clinical alert banner ──────────────────────────────────────────── */}
      {(hrAlert || glucWarn) && (
        <div className="vg-alert" style={{
          padding: "9px 20px", background: "#7f1d1d", color: "#fee2e2",
          fontSize: 13, display: "flex", gap: 20, flexWrap: "wrap",
        }}>
          {hrAlert && <span>⚡ Tachycardia detected — <strong style={{ fontFamily: "'DM Mono', monospace" }}>{bpm} BPM</strong></span>}
          {glucWarn && <span>⚡ {glucWarn} — <strong style={{ fontFamily: "'DM Mono', monospace" }}>{latestGluc} mg/dL</strong></span>}
        </div>
      )}

      {/* ── IT mode strip ─────────────────────────────────────────────────── */}
      <div style={{
        background: theme.stripBg, color: theme.stripText,
        padding: "7px 20px", fontSize: 11, lineHeight: 1.6,
        borderBottom: `1px solid ${theme.border}`,
      }}>
        <strong>Operational context</strong> · Browser demo · Client-side simulation · Optional local AI ·
        Production requires secure hosting, FHIR/HL7 integration, SSO/MFA
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Row 1: Cardiac · Glucose · Organ index */}
        <div className="vg-col3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>

          {/* Cardiac */}
          <div style={card} className="vg-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: theme.title, letterSpacing: "0.06em" }}>CARDIAC MONITOR</div>
              <Tag label={hrAlert ? "TACHYCARDIA" : "SINUS RHYTHM"} color={hrAlert ? "#f87171" : "#22d3ee"} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: theme.muted, marginBottom: 4 }}>Heart rate</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                  <span style={{ fontSize: 50, fontWeight: 800, lineHeight: 1, color: hrAlert ? "#f87171" : "#22d3ee", fontFamily: "'DM Mono', monospace" }}>{bpm}</span>
                  <span style={{ fontSize: 14, color: theme.muted }}>BPM</span>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: theme.muted, marginBottom: 4 }}>SpO₂</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span style={{ fontSize: 32, fontWeight: 800, lineHeight: 1, color: "#4ade80", fontFamily: "'DM Mono', monospace" }}>98</span>
                  <span style={{ fontSize: 13, color: theme.muted }}>%</span>
                </div>
              </div>
            </div>
            <div style={{ background: theme.chartBg, borderRadius: 8, padding: "6px 2px" }}>
              <ResponsiveContainer width="100%" height={68}>
                <LineChart data={ecg}>
                  <Line dataKey="v" type="linear" stroke={hrAlert ? "#f87171" : "#22d3ee"} strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ fontSize: 11, color: theme.muted, marginTop: 8 }}>PQRST morphology · Lead II</div>
          </div>

          {/* Glucose */}
          <div style={card} className="vg-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: theme.title, letterSpacing: "0.06em" }}>CONTINUOUS GLUCOSE</div>
              {glucWarn ? <Tag label={glucWarn.toUpperCase()} color="#f97316" /> : <Tag label="IN RANGE" color="#4ade80" />}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: theme.muted, marginBottom: 4 }}>Current glucose</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                  <span style={{ fontSize: 50, fontWeight: 800, lineHeight: 1, color: glucWarn ? "#f97316" : "#a78bfa", fontFamily: "'DM Mono', monospace" }}>{latestGluc}</span>
                  <span style={{ fontSize: 14, color: theme.muted }}>mg/dL</span>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: theme.muted }}>Target</div>
                <div style={{ fontSize: 13, color: theme.subtext, fontFamily: "'DM Mono', monospace" }}>70–140</div>
              </div>
            </div>
            <div style={{ background: theme.chartBg, borderRadius: 8, padding: "6px 2px" }}>
              <ResponsiveContainer width="100%" height={68}>
                <AreaChart data={glucData}>
                  <defs>
                    <linearGradient id="vgGFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={glucWarn ? "#f97316" : "#a78bfa"} stopOpacity={0.28} />
                      <stop offset="95%" stopColor={glucWarn ? "#f97316" : "#a78bfa"} stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <ReferenceLine y={70}  stroke="#f87171" strokeDasharray="3 3" />
                  <ReferenceLine y={140} stroke="#facc15" strokeDasharray="3 3" />
                  <Area dataKey="mg" type="monotone" stroke={glucWarn ? "#f97316" : "#a78bfa"} strokeWidth={2} fill="url(#vgGFill)" dot={false} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Organ index */}
          <div style={card} className="vg-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: theme.title, letterSpacing: "0.06em" }}>ORGAN SYSTEM INDEX</div>
              <span style={{ fontSize: 11, color: theme.muted }}>6-domain · /100</span>
            </div>
            <div style={{ background: theme.chartBg, borderRadius: 8, height: 190, overflow: "hidden" }}>
              <OrganRadar organs={organs} theme={theme} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 10 }}>
              {organs.map((o) => {
                const below = o.value < o.threshold;
                const col   = below ? "#f97316" : o.value >= 80 ? "#4ade80" : "#22d3ee";
                return (
                  <div key={o.axis} style={{ display: "grid", gridTemplateColumns: "68px 1fr 30px", gap: 8, alignItems: "center" }}>
                    <div style={{ fontSize: 11, color: below ? "#f97316" : theme.muted, fontWeight: below ? 700 : 400 }}>{o.axis}</div>
                    <div style={{ height: 5, borderRadius: 999, background: theme.cardSoft, overflow: "hidden" }}>
                      <div style={{ width: `${o.value}%`, height: "100%", background: col, borderRadius: 999, transition: "width .5s ease" }} />
                    </div>
                    <div style={{ fontSize: 11, textAlign: "right", fontFamily: "'DM Mono', monospace", color: col, fontWeight: 700 }}>{o.value}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Row 2: Blood panel · Genomics */}
        <div className="vg-col2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

          {/* Blood panel */}
          <div style={card} className="vg-card">
            <div style={{ fontSize: 12, fontWeight: 700, color: theme.title, letterSpacing: "0.06em", marginBottom: 14 }}>BLOOD CHEMISTRY PANEL</div>
            <div className="vg-blood-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {BLOOD_PANEL.map((b) => {
                const col    = b.status === "alert" ? "#f87171" : b.status === "warn" ? "#facc15" : theme.title;
                const bdrCol = b.status === "alert" ? "#fca5a5" : b.status === "warn" ? "#fde68a" : theme.borderSoft;
                return (
                  <div key={b.label} style={{ background: theme.cardSoft, border: `1px solid ${bdrCol}`, borderRadius: 10, padding: 12 }}>
                    <div style={{ fontSize: 11, color: theme.muted, marginBottom: 6, letterSpacing: "0.03em" }}>{b.label}</div>
                    <div style={{ fontSize: 32, fontWeight: 800, color: col, lineHeight: 1, fontFamily: "'DM Mono', monospace" }}>{b.val}</div>
                    <div style={{ fontSize: 11, color: theme.muted, marginTop: 2 }}>{b.unit}</div>
                    {b.status !== "normal" && (
                      <div style={{ fontSize: 11, color: col, marginTop: 7, fontWeight: 600 }}>
                        {b.status === "alert" ? "↑ Elevated" : "→ Borderline"}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Genomics */}
          <div style={card} className="vg-card">
            <div style={{ fontSize: 12, fontWeight: 700, color: theme.title, letterSpacing: "0.06em", marginBottom: 14 }}>PHARMACOGENOMIC PROFILE</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {GENOMIC_ROWS.map((g) => (
                <div key={g.gene} style={{
                  display: "grid", gridTemplateColumns: "78px 1fr auto",
                  gap: 12, alignItems: "center",
                  border: `1px solid ${theme.borderSoft}`, borderRadius: 8,
                  padding: "9px 12px", background: genomicRowBg(g.status),
                  transition: "background .2s",
                }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: theme.title, fontFamily: "'DM Mono', monospace" }}>{g.gene}</div>
                  <div style={{ fontSize: 12, color: theme.subtext, lineHeight: 1.5 }}>{g.impact}</div>
                  <Tag label={g.status} color={STATUS_COLOR[g.status]} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Row 3: Drug sim · Predictions */}
        <div className="vg-col2-wide" style={{ display: "grid", gridTemplateColumns: "1.45fr 0.85fr", gap: 14 }}>

          {/* Drug simulation */}
          <div style={card} className="vg-card">
            <div style={{
              fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", marginBottom: 16,
              color: result?.verdictType ? VERDICT_COLOR[result.verdictType] : theme.title,
            }}>
              DRUG SIMULATION ENGINE
            </div>

            {/* Controls row */}
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14 }}>
              <select
                className="vg-select"
                value={selectedDrug}
                onChange={(e) => { setSelectedDrug(e.target.value); if (!SNAPSHOT_MODE) reset(); }}
                style={{
                  flex: 1, padding: "10px 34px 10px 12px", borderRadius: 8,
                  border: `1px solid ${theme.border}`, background: theme.surface,
                  color: theme.text, fontSize: 13, fontWeight: 600,
                }}
              >
                {Object.keys(DRUG_PROFILES).map((d) => <option key={d} value={d}>{d}</option>)}
              </select>

              {phase === "done" ? (
                <button
                  className="vg-btn-ghost"
                  onClick={reset}
                  disabled={SNAPSHOT_MODE}
                  style={{ border: `1px solid ${theme.border}`, color: SNAPSHOT_MODE ? theme.faint : theme.subtext }}
                >
                  Reset
                </button>
              ) : (
                <button
                  className={`vg-btn-run${phase === "simulating" ? " running" : ""}`}
                  onClick={runSim}
                  disabled={phase === "simulating" || SNAPSHOT_MODE}
                >
                  {SNAPSHOT_MODE ? "Snapshot" : phase === "simulating" ? "Simulating…" : "▶ Run simulation"}
                </button>
              )}
            </div>

            {/* Idle: scenario preview */}
            {phase === "idle" && DRUG_PROFILES[selectedDrug] && (
              <div style={{
                border: `1px solid ${theme.border}`, background: theme.surfaceAlt,
                borderRadius: 8, padding: 14, fontSize: 13, color: theme.subtext,
                lineHeight: 1.6, marginBottom: 14,
              }}>
                <div style={{ fontWeight: 700, color: theme.title, marginBottom: 7, fontSize: 12, letterSpacing: "0.04em" }}>
                  SCENARIO CHECK · {selectedDrug}
                </div>
                {DRUG_PROFILES[selectedDrug].genomicNote}
              </div>
            )}

            {/* Simulating: progress */}
            {phase === "simulating" && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontSize: 12, color: theme.subtext, minHeight: 18 }}>{simStep}</div>
                  <div style={{ fontSize: 12, color: theme.muted, fontFamily: "'DM Mono', monospace" }}>{Math.round(progress)}%</div>
                </div>
                <div style={{ height: 8, borderRadius: 999, background: theme.cardSoft, overflow: "hidden" }}>
                  <div className="vg-bar-fill" style={{ width: `${progress}%`, transition: "width .12s" }} />
                </div>
              </div>
            )}

            {/* Done: results */}
            {phase === "done" && result && pkData && (
              <div className="vg-sim-result">
                {/* Metric tiles */}
                <div className="vg-metric-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8, marginBottom: 16 }}>
                  {[
                    { label: "Efficacy",      val: `${result.efficacy}%`,  color: "#4ade80" },
                    { label: "Toxicity risk", val: `${result.toxRisk}%`,   color: result.toxRisk > 40 ? "#f87171" : result.toxRisk > 20 ? "#facc15" : "#4ade80" },
                    { label: "Half-life",     val: `${result.halfLife}h`,  color: "#22d3ee" },
                    { label: "Optimal dose",  val: `${result.optDose}%`,   color: "#a78bfa" },
                  ].map((m) => (
                    <div key={m.label} style={{ background: theme.cardSoft, border: `1px solid ${theme.borderSoft}`, borderRadius: 10, padding: 12 }}>
                      <div style={{ fontSize: 11, color: theme.muted, marginBottom: 5 }}>{m.label}</div>
                      <div style={{ fontSize: 26, fontWeight: 800, color: m.color, lineHeight: 1, fontFamily: "'DM Mono', monospace" }}>{m.val}</div>
                    </div>
                  ))}
                </div>

                {/* PK chart */}
                <div style={{ fontSize: 11, color: theme.muted, marginBottom: 8 }}>
                  Plasma concentration · {result.yLabel} · 0–{result.timeMax}h
                </div>
                <div style={{ background: theme.chartBg, border: `1px solid ${theme.borderSoft}`, borderRadius: 8, padding: "8px 2px 4px", marginBottom: 12 }}>
                  <ResponsiveContainer width="100%" height={220}>
                    <ComposedChart data={pkData} margin={{ top: 8, right: 24, left: 4, bottom: 0 }}>
                      <XAxis dataKey="t" tick={{ fontSize: 11, fill: theme.axis }} tickFormatter={(v) => `${v}h`} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: theme.axis }} tickLine={false} axisLine={false} width={38} />
                      <Tooltip content={<PKTooltip profile={result} theme={theme} />} />
                      <ReferenceLine y={result.toxLine}  stroke="#f87171" strokeDasharray="5 5" />
                      <ReferenceLine y={result.therMax}  stroke="#facc15" strokeDasharray="4 4" />
                      <ReferenceLine y={result.therMin}  stroke="#4ade80" strokeDasharray="4 4" />
                      <Line type="monotone" dataKey="population" stroke={theme.faint} strokeDasharray="6 4" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="patient"    stroke={VERDICT_COLOR[result.verdictType]} strokeWidth={3} dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Chart legend */}
                <div style={{ display: "flex", gap: 18, fontSize: 12, color: theme.subtext, marginBottom: 14 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ display: "inline-block", width: 22, height: 2, borderTop: `2px dashed ${theme.faint}` }} />
                    Population average
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ display: "inline-block", width: 22, height: 2, background: VERDICT_COLOR[result.verdictType], borderRadius: 1 }} />
                    Dario Arian (genomic)
                  </span>
                </div>

                {/* Genomic note */}
                <div style={{
                  borderLeft: `3px solid ${VERDICT_COLOR[result.verdictType]}`, borderRadius: "0 0 0 0",
                  paddingLeft: 10, fontSize: 13, color: theme.subtext,
                  lineHeight: 1.6, marginBottom: 12,
                }}>
                  {result.genomicNote}
                </div>

                {/* Verdict box */}
                <div style={{
                  border: `1px solid ${VERDICT_COLOR[result.verdictType]}55`,
                  background: isDark ? VERDICT_BG_DARK[result.verdictType] : VERDICT_BG_LIGHT[result.verdictType],
                  color: VERDICT_TEXT[result.verdictType],
                  borderRadius: 8, padding: 13,
                  fontSize: 13, fontWeight: 600, lineHeight: 1.55,
                }}>
                  {result.verdictText}
                </div>
              </div>
            )}
          </div>

          {/* Predictive timeline */}
          <div style={card} className="vg-card">
            <div style={{ fontSize: 12, fontWeight: 700, color: theme.title, letterSpacing: "0.06em", marginBottom: 16 }}>
              PREDICTIVE EVENT TIMELINE
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {predictions.map((ev) => {
                const barColor = ev.sev === "high" ? "#f87171" : ev.sev === "mid" ? "#fb923c" : "#22d3ee";
                const prob = Number(ev.prob);
                return (
                  <div key={ev.id} style={{
                    border: `1px solid ${theme.borderSoft}`, background: theme.surfaceAlt,
                    borderRadius: 10, padding: 12,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: theme.title }}>{ev.label}</div>
                      <div style={{
                        fontSize: 12, fontFamily: "'DM Mono', monospace",
                        color: ev.hrs < 2 ? "#fb923c" : theme.muted,
                        fontWeight: ev.hrs < 2 ? 700 : 400,
                      }}>
                        ~{ev.hrs.toFixed(1)}h
                      </div>
                    </div>
                    <div style={{ height: 8, borderRadius: 999, background: theme.cardSoft, overflow: "hidden", marginBottom: 8 }}>
                      <div style={{ width: `${prob}%`, height: "100%", borderRadius: 999, background: barColor, transition: "width .5s ease" }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span style={{ fontSize: 28, fontWeight: 800, color: barColor, lineHeight: 1, fontFamily: "'DM Mono', monospace" }}>{prob}%</span>
                      <span style={{ fontSize: 11, color: theme.muted }}>
                        {prob > 60 ? "High probability" : prob > 35 ? "Moderate risk" : "Low risk"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${theme.borderSoft}`, fontSize: 11, color: theme.muted, lineHeight: 1.65 }}>
              Ensemble model: CGM trend · ECG pattern · CRP trajectory · pharmacogenomic weighting.
              Probabilities refresh every 3 s in active mode.
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: theme.faint, lineHeight: 1.6 }}>
              Biomed-Ensemble-v3 · Twin 4.2.1-dario ·
              Sync: {SNAPSHOT_MODE ? "snapshot" : "live-simulated"} · Optional local AI explanation
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10,
          fontSize: 11, color: theme.muted, borderTop: `1px solid ${theme.border}`, paddingTop: 12,
        }}>
          <span>Digital twin integrity: <strong style={{ color: "#22d3ee" }}>Verified demo</strong></span>
          <span>Expected domains: CGM · ECG · wearables · genomic array · blood panel</span>
          <span>{SNAPSHOT_MODE ? "Documentation snapshot" : "Client-side simulation"} · Not for clinical use</span>
        </div>
      </div>
    </div>
  );
}
